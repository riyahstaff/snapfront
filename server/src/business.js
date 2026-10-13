// Sales & profit: each seller's back office. Revenue, Stripe fees, refunds, product costs and the
// seller's own expenses add up to a profit or loss for any date range, alongside every sale, every
// customer (with tags and notes), traffic and the Stripe balance. Fees and refunds come from the
// seller's own Stripe account (orders are direct charges there) and are cached on each order.
import crypto from "node:crypto";
import { config } from "./config.js";
import { db, newId } from "./db.js";
import { httpError } from "./claude.js";
import { stripeClient } from "./payments.js";

const cols = (t) => new Set(db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name));
const addCol = (t, name, def) => { if (!cols(t).has(name)) db.exec(`ALTER TABLE ${t} ADD COLUMN ${name} ${def}`); };
addCol("orders", "fee_cents", "INTEGER");            // Stripe processing fee (+ any platform fee), from Stripe
addCol("orders", "refunded_cents", "INTEGER NOT NULL DEFAULT 0");
addCol("orders", "cost_cents", "INTEGER");           // what the items cost the seller, fixed when paid
addCol("orders", "money_synced_at", "TEXT");
db.exec(`CREATE TABLE IF NOT EXISTS customer_notes (
  seller_id TEXT NOT NULL,
  email TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  note TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (seller_id, email)
)`);
db.exec(`CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  day TEXT NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  amount_cents INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);
db.exec("CREATE INDEX IF NOT EXISTS expenses_seller_day ON expenses (seller_id, day)");

const SOLD = "status IN ('paid','fulfilled')";
export const EXPENSE_CATEGORIES = ["ads", "supplies", "shipping", "software", "fees", "other"];
const dollars = (c) => Math.round(Number(c || 0)) / 100;
const normEmail = (e) => String(e || "").trim().toLowerCase();
const day = (d) => d.toISOString().slice(0, 10);

/* ---------- date ranges ---------- */
/** "7", "14", "30", "90", "365", "all", or from/to (YYYY-MM-DD). Returns inclusive day bounds. */
export function range({ range: r = "30", from, to } = {}) {
  const today = day(new Date());
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (iso.test(String(from || "")) && iso.test(String(to || ""))) {
    const [a, b] = [String(from), String(to)].sort();
    if ((Date.parse(b) - Date.parse(a)) / 864e5 > 3660) throw httpError(400, "Pick a range of 10 years or less.");
    return { from: a, to: b > today ? today : b, label: "custom" };
  }
  if (r === "all") return { from: "2000-01-01", to: today, label: "all" };
  const n = [7, 14, 30, 90, 365].includes(Number(r)) ? Number(r) : 30;
  return { from: day(new Date(Date.now() - (n - 1) * 864e5)), to: today, label: String(n) };
}

/* ---------- what each order cost the seller ---------- */
/** Item cost from the product (or option) cost the seller entered or the supplier charges. */
function itemsCost(items) {
  let total = 0, known = true;
  for (const l of items) {
    const v = l.variant_id ? db.prepare("SELECT cost_cents FROM product_variants WHERE id = ?").get(l.variant_id) : null;
    const p = db.prepare("SELECT cost_cents FROM products WHERE id = ?").get(l.product_id);
    const unit = v?.cost_cents ?? p?.cost_cents;
    if (unit == null) { known = false; continue; }
    total += unit * l.qty;
  }
  return { cents: total, known };
}
/** Fix an order's item cost when it's paid, so later price or cost edits don't rewrite history. */
export function snapshotCost(orderId) {
  const o = db.prepare("SELECT items, cost_cents FROM orders WHERE id = ?").get(orderId);
  if (!o || o.cost_cents != null) return;
  db.prepare("UPDATE orders SET cost_cents = ? WHERE id = ?").run(itemsCost(JSON.parse(o.items)).cents, orderId);
}
const orderCost = (o) => (o.cost_cents != null ? o.cost_cents : itemsCost(JSON.parse(o.items)).cents);

/* ---------- Stripe fees and refunds ---------- */
let stripeFor = () => stripeClient();
export function setBusinessStripe(fn) { stripeFor = fn; }   // tests

/** Read the fee and refunds for one paid order from the seller's Stripe account. */
export async function syncOrderMoney(order, seller) {
  if (!order.checkout_session_id || !seller?.stripe_account_id) return order;
  const s = stripeFor();
  const opts = { stripeAccount: seller.stripe_account_id };
  const session = await s.checkout.sessions.retrieve(order.checkout_session_id, { expand: ["payment_intent.latest_charge.balance_transaction"] }, opts);
  const pi = session.payment_intent;
  const charge = pi && typeof pi === "object" ? pi.latest_charge : null;
  let fee = null, refunded = 0;
  if (charge && typeof charge === "object") {
    refunded = charge.amount_refunded || 0;
    const bt = charge.balance_transaction;
    if (bt && typeof bt === "object") fee = bt.fee ?? null;
    if (charge.disputed && charge.dispute) refunded = Math.max(refunded, charge.amount || 0);
  }
  db.prepare("UPDATE orders SET fee_cents = COALESCE(?, fee_cents), refunded_cents = ?, money_synced_at = datetime('now') WHERE id = ?").run(fee, refunded, order.id);
  return db.prepare("SELECT * FROM orders WHERE id = ?").get(order.id);
}

/** Bring fees and refunds up to date: new orders right away, recent ones twice a day. */
export async function syncDue(sellerId = null, limit = 40) {
  if (!config.stripeKey) return 0;
  const rows = db.prepare(`SELECT o.*, s.stripe_account_id FROM orders o JOIN sellers s ON s.id = o.seller_id
    WHERE o.${SOLD} AND o.checkout_session_id IS NOT NULL AND s.stripe_account_id IS NOT NULL ${sellerId ? "AND o.seller_id = ?" : ""}
      AND (o.money_synced_at IS NULL OR (o.money_synced_at < datetime('now', '-12 hours') AND o.paid_at > datetime('now', '-120 days')))
    ORDER BY o.money_synced_at IS NOT NULL, o.paid_at DESC LIMIT ?`).all(...(sellerId ? [sellerId, limit] : [limit]));
  let n = 0;
  for (const o of rows) {
    try { await syncOrderMoney(o, { stripe_account_id: o.stripe_account_id }); n++; }
    catch (e) {
      console.warn("[business] stripe sync", o.id, e.message);
      // Don't retry a broken order every few minutes.
      db.prepare("UPDATE orders SET money_synced_at = datetime('now', '-11 hours') WHERE id = ?").run(o.id);
    }
  }
  return n;
}

/* ---------- money for one order ---------- */
function money(o) {
  const fee = o.fee_cents ?? estimateFee(o.total_cents);
  const cost = orderCost(o);
  const refunded = o.refunded_cents || 0;
  // What the seller keeps: the payment, less tax collected (owed to the state), refunds, fees and item costs.
  const net = o.total_cents - (o.tax_cents || 0) - refunded - fee - cost;
  return { fee, fee_estimated: o.fee_cents == null, cost, refunded, net };
}
/** Until Stripe reports the real fee: the standard US card rate. */
const estimateFee = (total) => (total > 0 ? Math.round(total * 0.029) + 30 : 0);

/* ---------- overview ---------- */
export function summary(seller, q = {}) {
  const r = range(q);
  const orders = db.prepare(`SELECT * FROM orders WHERE seller_id = ? AND ${SOLD} AND date(paid_at) BETWEEN ? AND ?`).all(seller.id, r.from, r.to);
  const t = { gross: 0, discounts: 0, shipping: 0, tax: 0, refunds: 0, fees: 0, costs: 0, orders: orders.length, refunded_orders: 0, estimated_fees: 0 };
  const byDay = new Map(), products = new Map();
  for (const o of orders) {
    const m = money(o);
    t.gross += o.subtotal_cents; t.discounts += o.discount_cents || 0; t.shipping += o.shipping_cents || 0; t.tax += o.tax_cents || 0;
    t.refunds += m.refunded; t.fees += m.fee; t.costs += m.cost;
    if (m.refunded) t.refunded_orders++;
    if (m.fee_estimated) t.estimated_fees++;
    const d = String(o.paid_at).slice(0, 10);
    const b = byDay.get(d) || { revenue: 0, profit: 0, orders: 0 };
    b.revenue += o.total_cents - (o.tax_cents || 0); b.profit += m.net; b.orders++;   // same basis as the Revenue total
    byDay.set(d, b);
    // Per product: revenue and cost share by line; fees split by line value.
    const items = JSON.parse(o.items);
    const linesTotal = items.reduce((s, l) => s + l.unit_cents * l.qty, 0) || 1;
    for (const l of items) {
      const share = (l.unit_cents * l.qty) / linesTotal;
      const p = products.get(l.product_id) || { id: l.product_id, title: l.title, units: 0, revenue: 0, cost: 0, fees: 0, refunds: 0 };
      const unitCost = itemsCost([l]).cents;
      p.units += l.qty; p.revenue += Math.round((o.subtotal_cents - (o.discount_cents || 0)) * share);
      p.cost += o.cost_cents != null ? Math.round(o.cost_cents * share) : unitCost;
      p.fees += Math.round(m.fee * share); p.refunds += Math.round(m.refunded * share);
      products.set(l.product_id, p);
    }
  }
  const expenses = db.prepare("SELECT category, SUM(amount_cents) AS cents FROM expenses WHERE seller_id = ? AND day BETWEEN ? AND ? GROUP BY category").all(seller.id, r.from, r.to);
  const expenseTotal = expenses.reduce((s, e) => s + e.cents, 0);
  for (const e of db.prepare("SELECT day, SUM(amount_cents) AS cents FROM expenses WHERE seller_id = ? AND day BETWEEN ? AND ? GROUP BY day").all(seller.id, r.from, r.to)) {
    const b = byDay.get(e.day) || { revenue: 0, profit: 0, orders: 0 };
    b.profit -= e.cents; byDay.set(e.day, b);
  }
  // Revenue = what buyers paid for products and shipping (tax collected isn't the seller's money).
  const revenue = t.gross - t.discounts + t.shipping;
  const net = revenue - t.refunds - t.fees - t.costs - expenseTotal;

  // Traffic, from the store's own visit counter.
  const traffic = db.prepare("SELECT COUNT(DISTINCT visitor || day) AS visitors, COALESCE(SUM(views),0) AS views FROM store_visits WHERE seller_id = ? AND day BETWEEN ? AND ?").get(seller.id, r.from, r.to);
  const visitsByDay = new Map(db.prepare("SELECT day, COUNT(DISTINCT visitor) AS v FROM store_visits WHERE seller_id = ? AND day BETWEEN ? AND ? GROUP BY day").all(seller.id, r.from, r.to).map((x) => [x.day, x.v]));
  const productVisits = new Map(db.prepare("SELECT product_id, COUNT(DISTINCT visitor || day) AS v FROM store_visits WHERE seller_id = ? AND day BETWEEN ? AND ? AND product_id != '' GROUP BY product_id").all(seller.id, r.from, r.to).map((x) => [x.product_id, x.v]));
  const sources = db.prepare("SELECT source, COUNT(DISTINCT visitor || day) AS visitors FROM store_visits WHERE seller_id = ? AND day BETWEEN ? AND ? GROUP BY source ORDER BY visitors DESC LIMIT 8").all(seller.id, r.from, r.to);
  const titles = new Map(db.prepare("SELECT id, title FROM products WHERE seller_id = ?").all(seller.id).map((p) => [p.id, p.title]));
  for (const [id, v] of productVisits) if (!products.has(id) && titles.has(id)) products.set(id, { id, title: titles.get(id), units: 0, revenue: 0, cost: 0, fees: 0, refunds: 0 });

  // One point per day for short ranges; per week or month for long ones.
  const span = Math.round((Date.parse(r.to) - Date.parse(r.from)) / 864e5) + 1;
  const firstSale = orders.length ? orders.map((o) => String(o.paid_at).slice(0, 10)).sort()[0] : r.to;
  const start = r.label === "all" ? firstSale : r.from;
  const bucket = span > 400 && r.label !== "all" ? "month" : (Date.parse(r.to) - Date.parse(start)) / 864e5 > 120 ? (span > 800 ? "month" : "week") : "day";
  const keyOf = (d) => (bucket === "day" ? d : bucket === "month" ? d.slice(0, 7) : day(new Date(Date.parse(d) - ((new Date(d).getUTCDay() + 6) % 7) * 864e5)));
  const series = new Map();
  for (let ms = Date.parse(start); ms <= Date.parse(r.to); ms += 864e5) {
    const d = day(new Date(ms)), k = keyOf(d), b = byDay.get(d), s = series.get(k) || { period: k, revenue: 0, profit: 0, orders: 0, visitors: 0 };
    if (b) { s.revenue += b.revenue; s.profit += b.profit; s.orders += b.orders; }
    s.visitors += visitsByDay.get(d) || 0;
    series.set(k, s);
  }
  const customers = new Set(orders.map((o) => normEmail(o.email)).filter(Boolean));
  const returning = [...customers].filter((e) => db.prepare(`SELECT 1 FROM orders WHERE seller_id = ? AND ${SOLD} AND lower(email) = ? AND date(paid_at) < ?`).get(seller.id, e, r.from)).length;

  return {
    range: r,
    totals: {
      revenue: dollars(revenue), orders: t.orders, average_order: t.orders ? dollars(revenue / t.orders) : 0,
      net_profit: dollars(net), margin: revenue > 0 ? Math.round((net / revenue) * 1000) / 10 : 0,
      customers: customers.size, new_customers: customers.size - returning, returning_customers: returning,
      visitors: traffic.visitors, views: traffic.views, conversion: traffic.visitors ? Math.round((t.orders / traffic.visitors) * 1000) / 10 : 0,
    },
    pnl: {
      gross_sales: dollars(t.gross), discounts: dollars(t.discounts), shipping_charged: dollars(t.shipping), revenue: dollars(revenue),
      refunds: dollars(t.refunds), stripe_fees: dollars(t.fees), product_costs: dollars(t.costs), expenses: dollars(expenseTotal),
      net_profit: dollars(net), tax_collected: dollars(t.tax), refunded_orders: t.refunded_orders, estimated_fee_orders: t.estimated_fees,
      expense_categories: expenses.map((e) => ({ category: e.category, amount: dollars(e.cents) })),
    },
    series: { bucket, points: [...series.values()].map((s) => ({ ...s, revenue: dollars(s.revenue), profit: dollars(s.profit) })) },
    products: [...products.values()].map((p) => {
      const visitors = productVisits.get(p.id) || 0;
      const profit = p.revenue - p.refunds - p.fees - p.cost;
      return { id: p.id, title: titles.get(p.id) || p.title, units: p.units, revenue: dollars(p.revenue), cost: dollars(p.cost), profit: dollars(profit), visitors, conversion: visitors ? Math.round((p.units / visitors) * 1000) / 10 : 0 };
    }).sort((a, b) => b.revenue - a.revenue || b.visitors - a.visitors).slice(0, 25),
    sources,
    missing_costs: db.prepare("SELECT COUNT(*) AS n FROM products WHERE seller_id = ? AND status = 'live' AND kind = 'physical' AND cost_cents IS NULL").get(seller.id).n,
  };
}

/* ---------- sales ---------- */
const orderRow = (o) => {
  const m = money(o);
  return {
    id: o.id, paid_at: o.paid_at, status: m.refunded >= o.total_cents && o.total_cents > 0 ? "refunded" : m.refunded ? "partly refunded" : o.status,
    customer_name: o.customer_name, email: o.email,
    items: JSON.parse(o.items).map((l) => ({ title: l.title, variant: l.variant, qty: l.qty })),
    total: dollars(o.total_cents), tax: dollars(o.tax_cents), discount: dollars(o.discount_cents), shipping: dollars(o.shipping_cents),
    refunded: dollars(m.refunded), fee: dollars(m.fee), fee_estimated: m.fee_estimated, cost: dollars(m.cost), profit: dollars(m.net), discount_code: o.discount_code,
  };
};
export function sales(seller, q = {}) {
  const r = range(q);
  const search = String(q.q || "").trim().toLowerCase().slice(0, 80);
  const page = Math.max(0, Math.min(1000, Number(q.page) || 0)), size = 50;
  const where = [`seller_id = ?`, SOLD, `date(paid_at) BETWEEN ? AND ?`];
  const args = [seller.id, r.from, r.to];
  if (search) { where.push("(lower(COALESCE(email,'')) LIKE ? OR lower(COALESCE(customer_name,'')) LIKE ? OR lower(id) LIKE ? OR lower(items) LIKE ?)"); args.push(...Array(4).fill(`%${search}%`)); }
  if (q.status === "refunded") where.push("refunded_cents > 0");
  if (q.status === "unfulfilled") where.push("status = 'paid'");
  if (q.status === "fulfilled") where.push("status = 'fulfilled'");
  const total = db.prepare(`SELECT COUNT(*) AS n FROM orders WHERE ${where.join(" AND ")}`).get(...args).n;
  const rows = db.prepare(`SELECT * FROM orders WHERE ${where.join(" AND ")} ORDER BY paid_at DESC LIMIT ? OFFSET ?`).all(...args, size, page * size);
  return { range: r, total, page, page_size: size, orders: rows.map(orderRow) };
}

/* ---------- customers ---------- */
const parseTags = (s) => { try { const t = JSON.parse(s); return Array.isArray(t) ? t : []; } catch { return []; } };
function customerList(seller) {
  const rows = db.prepare(`SELECT lower(email) AS email, MAX(customer_name) AS name, COUNT(*) AS orders, SUM(total_cents - COALESCE(tax_cents,0) - COALESCE(refunded_cents,0)) AS spent,
      MIN(paid_at) AS first_order, MAX(paid_at) AS last_order, MAX(shipping_address) AS address
    FROM orders WHERE seller_id = ? AND ${SOLD} AND email IS NOT NULL AND email != '' GROUP BY lower(email)`).all(seller.id);
  const notes = new Map(db.prepare("SELECT * FROM customer_notes WHERE seller_id = ?").all(seller.id).map((n) => [n.email, n]));
  return rows.map((c) => {
    let location = null;
    try { const a = JSON.parse(c.address || "null"); location = a ? [a.city, a.state, a.country].filter(Boolean).join(", ") || null : null; } catch { /* old rows */ }
    const n = notes.get(c.email);
    return { email: c.email, name: c.name, orders: c.orders, spent: dollars(c.spent), first_order: c.first_order, last_order: c.last_order,
      repeat: c.orders > 1, location, tags: n ? parseTags(n.tags) : [], note: n?.note || "" };
  });
}
export function customers(seller, q = {}) {
  let list = customerList(seller);
  const search = String(q.q || "").trim().toLowerCase();
  if (search) list = list.filter((c) => c.email.includes(search) || String(c.name || "").toLowerCase().includes(search) || c.tags.some((t) => t.toLowerCase().includes(search)));
  if (q.tag) list = list.filter((c) => c.tags.includes(String(q.tag)));
  if (q.filter === "repeat") list = list.filter((c) => c.repeat);
  const sort = { spent: (a, b) => b.spent - a.spent, orders: (a, b) => b.orders - a.orders || b.spent - a.spent, name: (a, b) => String(a.name || a.email).localeCompare(String(b.name || b.email)) }[q.sort]
    || ((a, b) => String(b.last_order).localeCompare(String(a.last_order)));
  list.sort(sort);
  const all = customerList(seller);
  return {
    total: list.length,
    stats: { customers: all.length, repeat: all.filter((c) => c.repeat).length, lifetime_value: all.length ? dollars((all.reduce((s, c) => s + c.spent, 0) * 100) / all.length) : 0 },
    tags: [...new Set(all.flatMap((c) => c.tags))].sort(),
    customers: list.slice(0, 500),
  };
}
export function customer(seller, rawEmail) {
  const email = normEmail(rawEmail);
  const c = customerList(seller).find((x) => x.email === email);
  if (!c) throw httpError(404, "That customer hasn't bought from this store.");
  const orders = db.prepare(`SELECT * FROM orders WHERE seller_id = ? AND ${SOLD} AND lower(email) = ? ORDER BY paid_at DESC LIMIT 100`).all(seller.id, email).map(orderRow);
  return { ...c, orders_list: orders };
}
export function updateCustomer(seller, rawEmail, b = {}) {
  const email = normEmail(rawEmail);
  if (!customerList(seller).some((x) => x.email === email)) throw httpError(404, "That customer hasn't bought from this store.");
  const cur = db.prepare("SELECT * FROM customer_notes WHERE seller_id = ? AND email = ?").get(seller.id, email);
  const tags = Array.isArray(b.tags) ? [...new Set(b.tags.map((t) => String(t).trim().replace(/\s+/g, " ").slice(0, 24)).filter(Boolean))].slice(0, 12) : parseTags(cur?.tags || "[]");
  const note = b.note != null ? String(b.note).slice(0, 2000) : cur?.note || "";
  db.prepare(`INSERT INTO customer_notes (seller_id, email, tags, note) VALUES (?,?,?,?)
    ON CONFLICT(seller_id, email) DO UPDATE SET tags = excluded.tags, note = excluded.note, updated_at = datetime('now')`).run(seller.id, email, JSON.stringify(tags), note);
  return customer(seller, email);
}

/* ---------- expenses ---------- */
export const listExpenses = (seller, q = {}) => {
  const r = range(q);
  return { range: r, categories: EXPENSE_CATEGORIES, expenses: db.prepare("SELECT id, day, label, category, amount_cents FROM expenses WHERE seller_id = ? AND day BETWEEN ? AND ? ORDER BY day DESC, created_at DESC LIMIT 500")
    .all(seller.id, r.from, r.to).map((e) => ({ id: e.id, day: e.day, label: e.label, category: e.category, amount: dollars(e.amount_cents) })) };
};
export function addExpense(seller, b = {}) {
  const label = String(b.label || "").replace(/\s+/g, " ").trim().slice(0, 80);
  const amount = Math.round(Number(b.amount) * 100);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(String(b.day || "")) ? String(b.day) : day(new Date());
  if (!label) throw httpError(400, "Say what the expense was for.");
  if (!(amount > 0) || amount > 100_000_000) throw httpError(400, "Enter an amount, like 24.99.");
  const category = EXPENSE_CATEGORIES.includes(b.category) ? b.category : "other";
  const id = newId("exp");
  db.prepare("INSERT INTO expenses (id, seller_id, day, label, category, amount_cents) VALUES (?,?,?,?,?,?)").run(id, seller.id, d, label, category, amount);
  return { id, day: d, label, category, amount: dollars(amount) };
}
export function deleteExpense(seller, id) {
  if (!db.prepare("DELETE FROM expenses WHERE id = ? AND seller_id = ?").run(String(id || ""), seller.id).changes) throw httpError(404, "That expense doesn't exist.");
}

/* ---------- CSV downloads (signed links, so phones and browsers can open them directly) ---------- */
const csvCell = (v) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;   // stop spreadsheets from running a "formula" a buyer typed
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const csv = (header, rows) => [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
// Other features add their own downloads (subscribers, affiliates) through the same signed links.
const EXPORTERS = new Map();
export const registerExport = (kind, fn) => EXPORTERS.set(kind, fn);
const exportSig = (sellerId, kind, exp) => crypto.createHmac("sha256", config.downloadSecret).update(`export:${sellerId}:${kind}:${exp}`).digest("base64url").slice(0, 32);
export function exportLink(seller, kind, q = {}) {
  if (!["sales", "customers", "expenses"].includes(kind) && !EXPORTERS.has(kind)) throw httpError(400, "Export sales, customers or expenses.");
  const exp = Math.floor(Date.now() / 1000) + 15 * 60;
  const params = new URLSearchParams({ s: seller.id, k: kind, e: String(exp), sig: exportSig(seller.id, kind, exp) });
  for (const k of ["range", "from", "to"]) if (q[k]) params.set(k, String(q[k]));
  return { url: `${config.publicUrl}/api/business/export?${params}` };
}
export function exportFile(q) {
  const { s, k, e, sig } = q;
  const exp = Number(e);
  if (!s || !k || !exp || exp < Date.now() / 1000) throw httpError(410, "This download link has expired. Tap Export again.");
  const want = exportSig(String(s), String(k), exp);
  if (String(sig || "").length !== want.length || !crypto.timingSafeEqual(Buffer.from(String(sig)), Buffer.from(want))) throw httpError(403, "This download link isn't valid.");
  const seller = db.prepare("SELECT * FROM sellers WHERE id = ?").get(String(s));
  if (!seller) throw httpError(404, "This store no longer exists.");
  if (EXPORTERS.has(String(k))) return EXPORTERS.get(String(k))(seller, q);
  const r = range(q);
  const stamp = r.label === "all" ? `all_time_to_${r.to}` : `${r.from}_to_${r.to}`;
  if (k === "sales") {
    const rows = db.prepare(`SELECT * FROM orders WHERE seller_id = ? AND ${SOLD} AND date(paid_at) BETWEEN ? AND ? ORDER BY paid_at DESC`).all(seller.id, r.from, r.to).map(orderRow);
    return { name: `sales_${stamp}.csv`, body: csv(["Date", "Order", "Customer", "Email", "Items", "Total", "Tax", "Shipping", "Discount", "Refunded", "Stripe fee", "Item cost", "Profit", "Status"],
      rows.map((o) => [o.paid_at, o.id, o.customer_name, o.email, o.items.map((i) => `${i.qty} x ${i.title}${i.variant ? ` (${i.variant})` : ""}`).join("; "),
        o.total, o.tax, o.shipping, o.discount, o.refunded, o.fee, o.cost, o.profit, o.status])) };
  }
  if (k === "customers") {
    const rows = customerList(seller).sort((a, b) => b.spent - a.spent);
    return { name: `customers_${day(new Date())}.csv`, body: csv(["Name", "Email", "Orders", "Total spent", "First order", "Last order", "Location", "Tags", "Note"],
      rows.map((c) => [c.name, c.email, c.orders, c.spent, c.first_order, c.last_order, c.location, c.tags.join("; "), c.note])) };
  }
  const rows = listExpenses(seller, q).expenses;
  return { name: `expenses_${stamp}.csv`, body: csv(["Date", "Expense", "Category", "Amount"], rows.map((x) => [x.day, x.label, x.category, x.amount])) };
}

/* ---------- Stripe balance and payouts ---------- */
export async function balance(seller) {
  if (!seller.stripe_account_id) return { connected: false };
  const s = stripeFor();
  const opts = { stripeAccount: seller.stripe_account_id };
  const [bal, payouts] = await Promise.all([s.balance.retrieve({}, opts), s.payouts.list({ limit: 10 }, opts)]);
  const usd = (list) => dollars((list || []).filter((x) => x.currency === "usd").reduce((t, x) => t + x.amount, 0));
  return {
    connected: true, available: usd(bal.available), pending: usd(bal.pending),
    payouts: (payouts.data || []).map((p) => ({ id: p.id, amount: dollars(p.amount), status: p.status, arrival_date: p.arrival_date ? day(new Date(p.arrival_date * 1000)) : null })),
    dashboard_url: "https://dashboard.stripe.com/",
  };
}
