// Connected-account subscriptions. Always retrieve current Stripe state so replayed or
// out-of-order webhooks cannot restore canceled/unpaid access.
import { db } from "./db.js";
import { httpError } from "./claude.js";
import { stripeClient, downloadToken, readDownloadToken } from "./payments.js";
import { config } from "./config.js";
import { storeOrigin } from "./urls.js";
const idOf = (v) => typeof v === "string" ? v : v?.id;
const now = () => Math.floor(Date.now() / 1000);

export async function syncSubscription(subscriptionId, accountId, orderId = null) {
  const known = db.prepare("SELECT * FROM store_subscriptions WHERE id=? AND stripe_account_id=?").get(subscriptionId, accountId);
  const order = db.prepare(`SELECT o.*,s.stripe_account_id FROM orders o JOIN sellers s ON s.id=o.seller_id WHERE o.id=?`).get(known?.order_id || orderId || "");
  if (!order || order.stripe_account_id !== accountId || !JSON.parse(order.items).some((l) => l.billing_interval)) return null;
  const sub = await stripeClient().subscriptions.retrieve(subscriptionId, { expand: ["latest_invoice"] }, { stripeAccount: accountId });
  if (sub.metadata?.snapfront_order !== order.id || !idOf(sub.customer)) return null;
  const end = sub.items?.data?.[0]?.current_period_end || sub.current_period_end || 0;
  const invoice = typeof sub.latest_invoice === "object" ? sub.latest_invoice : null;
  // Active alone isn't proof of payment (e.g. manually marked uncollectible).
  const status = sub.status === "active" && invoice?.status !== "paid" ? "unpaid" : sub.status;
  db.transaction(() => {
    db.prepare(`INSERT INTO store_subscriptions (id,seller_id,order_id,stripe_account_id,customer_id,status,period_end,cancel_at_period_end,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,period_end=excluded.period_end,
      cancel_at_period_end=excluded.cancel_at_period_end,updated_at=excluded.updated_at`)
      .run(sub.id,order.seller_id,order.id,accountId,idOf(sub.customer),status,end,sub.cancel_at_period_end ? 1 : 0,now());
    if (invoice?.status === "paid") recordInvoice(sub.id, invoice);
  })();
  return db.prepare("SELECT * FROM store_subscriptions WHERE id=?").get(sub.id);
}
export function recordInvoice(subscriptionId, invoice) {
  db.prepare(`INSERT OR IGNORE INTO store_subscription_invoices (id,subscription_id,amount_paid,currency,paid_at) VALUES (?,?,?,?,?)`)
    .run(invoice.id,subscriptionId,invoice.amount_paid || 0,invoice.currency || "usd",invoice.status_transitions?.paid_at || invoice.created || now());
}
export async function registerCheckout(order, session) {
  const subscriptionId = idOf(session.subscription);
  if (!subscriptionId || session.payment_status !== "paid" || session.id !== order?.checkout_session_id) return;
  const seller = db.prepare("SELECT stripe_account_id FROM sellers WHERE id=?").get(order.seller_id);
  return syncSubscription(subscriptionId, seller.stripe_account_id, order.id);
}
export async function handleEvent(event) {
  if (!event.account) return;
  const obj = event.data.object;
  const subscriptionId = obj.object === "subscription" ? obj.id : idOf(obj.parent?.subscription_details?.subscription || obj.subscription);
  if (!subscriptionId || !["customer.subscription.updated","customer.subscription.deleted","invoice.paid","invoice.payment_failed","invoice.payment_action_required"].includes(event.type)) return;
  const sub = await syncSubscription(subscriptionId, event.account);
  if (sub && obj.object === "invoice" && obj.status === "paid") recordInvoice(sub.id, obj);
}
export function access(order) {
  if (!JSON.parse(order.items).some((l) => l.billing_interval)) return true;
  const sub = db.prepare("SELECT * FROM store_subscriptions WHERE order_id=?").get(order.id);
  return Boolean(sub && sub.status === "active" && sub.period_end > now());
}
export async function refreshOrder(order, force = false) {
  const sub = db.prepare("SELECT * FROM store_subscriptions WHERE order_id=?").get(order.id);
  if (sub && (force || sub.updated_at < now()-60 || sub.period_end <= now())) await syncSubscription(sub.id,sub.stripe_account_id);
}
export function publicSubscription(orderId) {
  const s = db.prepare("SELECT * FROM store_subscriptions WHERE order_id=?").get(orderId);
  if (!s) return null;
  return { status: s.status, period_end: s.period_end, cancel_at_period_end: Boolean(s.cancel_at_period_end),
    manage_url: `${config.publicUrl}/membership/manage?t=${encodeURIComponent(downloadToken("membership",orderId,30))}` };
}
export async function portal(token) {
  const t = readDownloadToken(token);
  if (t?.p !== "membership") throw httpError(410,"This management link expired. Open your order confirmation for a new one.");
  const sub = db.prepare("SELECT * FROM store_subscriptions WHERE order_id=?").get(t.s);
  if (!sub) throw httpError(404,"Subscription not found.");
  const seller = db.prepare("SELECT * FROM sellers WHERE id=?").get(sub.seller_id);
  const opts = { stripeAccount: sub.stripe_account_id };
  // Configuration belongs to this connected account, not the Snapfront platform.
  const configs = await stripeClient().billingPortal.configurations.list({limit:100},opts);
  let cfg = configs.data.find((c) => c.active && c.metadata?.snapfront_memberships === "v1");
  if (!cfg) cfg = await stripeClient().billingPortal.configurations.create({
    metadata: { snapfront_memberships:"v1" }, business_profile:{headline:`Manage your ${seller.store_name} subscription`},
    features:{ customer_update:{enabled:true,allowed_updates:["email","name"]}, invoice_history:{enabled:true},
      payment_method_update:{enabled:true}, subscription_cancel:{enabled:true,mode:"at_period_end"} }
  },opts);
  return (await stripeClient().billingPortal.sessions.create({customer:sub.customer_id,configuration:cfg.id,
    return_url:`${storeOrigin(seller.store_slug)}/thanks?o=${sub.order_id}`},opts)).url;
}
export function list(seller) {
  return db.prepare(`SELECT s.id,s.status,s.period_end,s.cancel_at_period_end,o.email,o.items,
    COALESCE((SELECT SUM(i.amount_paid) FROM store_subscription_invoices i WHERE i.subscription_id=s.id),0) AS revenue_cents
    FROM store_subscriptions s JOIN orders o ON o.id=s.order_id WHERE s.seller_id=? ORDER BY s.updated_at DESC LIMIT 200`).all(seller.id)
    .map((s) => ({...s,title:JSON.parse(s.items)[0]?.title,items:undefined}));
}
export async function reconcile() {
  const rows = db.prepare("SELECT id,stripe_account_id FROM store_subscriptions WHERE status NOT IN ('canceled','incomplete_expired') ORDER BY updated_at LIMIT 100").all();
  for (const s of rows) { try { await syncSubscription(s.id,s.stripe_account_id); } catch(e) { console.warn("[store-subscriptions]",s.id,e.message); } }
}
