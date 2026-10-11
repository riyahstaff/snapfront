// AliExpress dropshipping, with the seller's own AliExpress Open Platform app (App Key + App Secret)
// and a one-time "authorize" step that links the seller's AliExpress buyer account.
// Gateway and signing follow the Open Platform (IOP) rules: HMAC-SHA256 over the sorted parameters,
// prefixed with the API path for /rest calls. Docs: https://openservice.aliexpress.com/doc/doc.htm
import crypto from "node:crypto";
import { httpError } from "./claude.js";
import { byOptionName, https, lowPrice, makeCache, r2, splitPhone, stripHtml, US_STATES } from "./supplier-util.js";

const SYNC = "https://api-sg.aliexpress.com/sync";
const REST = "https://api-sg.aliexpress.com/rest";
export const AUTHORIZE = "https://api-sg.aliexpress.com/oauth/authorize";
let fetchImpl = (...a) => fetch(...a);
const cached = makeCache(300);
export function setAliExpressFetch(f) { fetchImpl = f; cached.clear(); }   // used by tests

/** IOP signature: sorted key+value pairs (with the API path in front for /rest calls), HMAC-SHA256, upper-case hex. */
export function sign(secret, params, apiPath = "") {
  const base = apiPath + Object.keys(params).filter((k) => params[k] !== undefined && params[k] !== null && k !== "sign").sort()
    .map((k) => `${k}${params[k]}`).join("");
  return crypto.createHmac("sha256", secret).update(base, "utf8").digest("hex").toUpperCase();
}

async function rawCall(creds, method, params = {}, { session = true } = {}) {
  const rest = method.startsWith("/");
  const p = {
    ...Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [k, typeof v === "object" ? JSON.stringify(v) : String(v)])),
    app_key: creds.appKey, timestamp: String(Date.now()), sign_method: "sha256",
    ...(rest ? {} : { method }), ...(session && creds.accessToken ? { session: creds.accessToken } : {}),
  };
  p.sign = sign(creds.appSecret, p, rest ? method : "");
  const url = `${rest ? REST + method : SYNC}?${new URLSearchParams(p)}`;
  let res;
  try { res = await fetchImpl(url, { method: "POST" }); }
  catch (e) { console.error("[aliexpress] network", method, e.message); throw httpError(502, "Couldn't reach AliExpress. Try again in a minute."); }
  const j = await res.json().catch(() => ({}));
  const err = j?.error_response || (rest && j?.code && String(j.code) !== "0" ? j : null);
  if (err) {
    const code = String(err.code || ""), msg = String(err.sub_msg || err.msg || err.message || code);
    console.error("[aliexpress]", method, code, err.sub_code || "", msg);
    if (/IncompleteSignature|InvalidApiKey|AppKey|isv\.app|app key/i.test(`${code} ${msg}`)) throw httpError(400, "AliExpress didn't accept that App Key and App Secret. Copy both again from your app in the AliExpress Open Platform console.");
    if (code === "27" || /session|token/i.test(code)) { const e = httpError(401, "Your AliExpress authorization has expired. Authorize Snapfront again in Store settings."); e.aeAuth = true; throw e; }
    if (/InsufficientPermission|permission|ApiCallLimit|isv\.permission/i.test(`${code} ${msg}`)) throw httpError(403, "Your AliExpress app doesn't have the Dropshipping API permission yet. Apply for it in the AliExpress Open Platform console.");
    throw httpError(502, `AliExpress: ${msg}`.slice(0, 300));
  }
  return j;
}

/** The "..._response" object of a /sync call, whatever AliExpress named it. */
const unwrap = (j) => {
  const k = Object.keys(j || {}).find((x) => x.endsWith("_response"));
  return k ? j[k] : j;
};
/** AliExpress wraps arrays as {thing_d_t_o: [...]}; take the array either way. */
const arr = (v) => {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object") { const inner = Object.values(v).find(Array.isArray); if (inner) return inner; }
  return [];
};

/* ---------- authorization ---------- */
export function authorizeUrl(creds, redirectUri, state) {
  return `${AUTHORIZE}?${new URLSearchParams({ response_type: "code", force_auth: "true", redirect_uri: redirectUri, client_id: creds.appKey, state })}`;
}
const expiry = (ms, secs) => (Number(ms) > 1e12 ? Number(ms) : Date.now() + (Number(secs) || 0) * 1000);
function withTokens(creds, t) {
  return {
    ...creds, accessToken: t.access_token, refreshToken: t.refresh_token || creds.refreshToken || null,
    expiresAt: expiry(t.expire_time, t.expires_in), refreshExpiresAt: expiry(t.refresh_token_valid_time, t.refresh_expires_in),
    account: t.account || t.user_nick || creds.account || null,
  };
}
export async function finishAuthorization(creds, code) {
  const t = await rawCall(creds, "/auth/token/create", { code }, { session: false });
  if (!t?.access_token) throw httpError(502, "AliExpress didn't send an access token back. Try authorizing again.");
  return withTokens(creds, t);
}

/** Calls made as the seller: refreshes the access token first when it's about to expire. */
async function call(creds, method, params) {
  if (!creds.accessToken) { const e = httpError(409, "Finish connecting AliExpress: tap Authorize in Store settings."); e.aeAuth = true; throw e; }
  if (creds.refreshToken && creds.expiresAt && creds.expiresAt < Date.now() + 3600e3 && (!creds.refreshExpiresAt || creds.refreshExpiresAt > Date.now())) {
    const t = await rawCall(creds, "/auth/token/refresh", { refresh_token: creds.refreshToken }, { session: false });
    if (t?.access_token) Object.assign(creds, withTokens(creds, t), { _changed: true });
  }
  return unwrap(await rawCall(creds, method, params));
}

/* ---------- products ---------- */
/** Pull the product id out of an AliExpress link (or a bare id). */
export function productIdFrom(text) {
  const s = String(text || "");
  const m = s.match(/\/item\/(?:[^/]*?)(\d{9,20})\.html/) || s.match(/(?:productIds?|item_id|id)=(\d{9,20})/) || s.match(/^\s*(\d{9,20})\s*$/) || s.match(/(\d{12,20})/);
  return m ? m[1] : null;
}

async function freight(creds, { productId, skuId, qty = 1, to = "US", price }) {
  const r = await call(creds, "aliexpress.logistics.buyer.freight.calculate", {
    param_aeop_freight_calculate_for_buyer_d_t_o: { country_code: to, product_id: Number(productId), product_num: qty, send_goods_country_code: "CN", sku_id: skuId || undefined, price: price ? String(price) : undefined, price_currency: "USD" },
  }).catch((e) => { if (e.status === 429 || e.aeAuth) throw e; return null; });
  const list = arr(r?.result?.aeop_freight_calculate_result_for_buyer_d_t_o_list || r?.result?.aeop_freight_calculate_result_for_buyer_dto_list);
  const opts = list.map((o) => ({
    name: String(o.service_name || ""), price: o.freight?.amount != null ? Number(o.freight.amount) : Number(o.freight?.cent) / 100,
    days: String(o.estimated_delivery_time || ""), from: "CN",
  })).filter((o) => o.name && Number.isFinite(o.price)).sort((a, b) => a.price - b.price);
  return opts[0] || null;
}

function skuName(props) {
  return props.map((p) => p.property_value_definition_name || p.sku_property_value).filter(Boolean).join(" / ").slice(0, 60);
}
function skuAttr(sku, props) {
  if (sku.sku_attr) return String(sku.sku_attr);
  return props.map((p) => `${p.sku_property_id}:${p.property_value_id_long || p.property_value_id}${p.property_value_definition_name ? `#${p.property_value_definition_name}` : ""}`).join(";");
}

async function product(creds, id) {
  return cached(`p:${creds.appKey}:${id}`, 60 * 60e3, async () => {
    const r = await call(creds, "aliexpress.ds.product.get", { product_id: id, ship_to_country: "US", target_currency: "USD", target_language: "EN" });
    const d = r?.result;
    if (!d?.ae_item_base_info_dto) throw httpError(404, "AliExpress didn't return that product. Check the link, or it may not ship to the US.");
    const base = d.ae_item_base_info_dto;
    const skus = arr(d.ae_item_sku_info_dtos);
    const variants = skus.map((s) => {
      const props = arr(s.ae_sku_property_dtos || s.aeop_s_k_u_propertys);
      return {
        vid: String(s.sku_id || s.id || ""), sku: String(s.sku_code || s.sku_id || s.id || ""), name: skuName(props) || "Standard",
        cost: lowPrice(s.offer_sale_price || s.sku_price), image: https(props.find((p) => p.sku_image)?.sku_image), meta: skuAttr(s, props),
        stock: Number(s.sku_available_stock ?? s.s_k_u_available_stock ?? s.ipm_sku_stock ?? 1),
      };
    }).filter((v) => v.vid && v.cost > 0 && v.stock > 0).map(({ stock: _s, ...v }) => v).sort(byOptionName);
    const firstProps = arr(skus[0]?.ae_sku_property_dtos || skus[0]?.aeop_s_k_u_propertys);
    const images = [...new Set(String(d.ae_multimedia_info_dto?.image_urls || "").split(";").map(https).filter(Boolean))].slice(0, 12);
    const cheapest = [...variants].sort((a, b) => a.cost - b.cost)[0];
    const shipping = cheapest ? await freight(creds, { productId: id, skuId: cheapest.vid, price: cheapest.cost }) : null;
    const cost = cheapest?.cost ?? null;
    return {
      pid: String(base.product_id || id), title: String(base.subject || "").slice(0, 200), description: stripHtml(base.detail || base.mobile_detail).slice(0, 4000),
      images, option_name: firstProps.map((p) => p.sku_property_name).filter(Boolean).join(" / ").slice(0, 30) || "Option",
      cost, variants, shipping, landed_cost: cost != null ? r2(cost + (shipping?.price || 0)) : null,
    };
  });
}

const tracked = (st) => /SEND_GOODS|SHIPPED/.test(st);

export const adapter = {
  id: "aliexpress",
  name: "AliExpress",
  browseWithoutAccount: false,
  needsAuthorization: true,

  async connect(input) {
    const appKey = String(input?.app_key || "").trim(), appSecret = String(input?.app_secret || "").trim();
    if (!/^\d{5,12}$/.test(appKey)) throw httpError(400, "Paste your AliExpress App Key (a number). It's on your app's page in the AliExpress Open Platform console.");
    if (appSecret.length < 16 || appSecret.length > 128) throw httpError(400, "Paste your AliExpress App Secret from the same page.");
    return { creds: { appKey, appSecret }, info: {}, pending: true };
  },

  /** AliExpress has no open keyword search for dropshippers; sellers paste a product link instead. */
  async search(creds, { q }) {
    const id = productIdFrom(q);
    if (!id) throw httpError(400, "Paste an AliExpress product link, like https://www.aliexpress.com/item/1005001234567890.html");
    const p = await product(creds, id);
    return { page: 1, total: 1, pages: 1, products: [{ pid: p.pid, title: p.title, image: p.images[0] || null, cost: p.cost, sku: null }] };
  },

  async product(creds, pid) {
    const id = productIdFrom(pid);
    if (!id) throw httpError(400, "That AliExpress product id doesn't look right.");
    return product(creds, id);
  },

  async placeOrder(creds, { order, address: a, lines, autoPay }) {
    const phone = splitPhone(a.phone);
    const items = [];
    for (const l of lines) {
      const ship = await freight(creds, { productId: l.productId, skuId: l.vid, qty: l.qty, to: a.country });
      if (!ship) throw httpError(422, "AliExpress has no shipping method to this address for one of the items.");
      items.push({ product_id: Number(l.productId), product_count: l.qty, sku_attr: l.meta || undefined, logistics_service_name: ship.name, order_memo: "Please don't include invoices or prices in the package." });
    }
    const r = await call(creds, "aliexpress.ds.order.create", {
      param_place_order_request4_open_api_d_t_o: {
        out_order_id: order.id,
        logistics_address: {
          full_name: String(order.customer_name || "Customer").slice(0, 60), contact_person: String(order.customer_name || "Customer").slice(0, 60),
          address: a.line1, address2: a.line2 || undefined, city: a.city, zip: a.postal_code || undefined, country: a.country,
          province: a.country === "US" ? (US_STATES[a.state] || a.state) : (a.state || a.city), mobile_no: phone.number || undefined, phone_country: phone.country || undefined, locale: "en_US",
        },
        product_items: items,
      },
      ds_extend_request: { payment: { pay_currency: "USD", try_to_pay: autoPay ? "true" : "false" } },
    });
    const res = r?.result || {};
    if (res.is_success === false || res.is_success === "false") throw httpError(422, `AliExpress didn't accept the order: ${res.error_msg || res.error_code || "unknown reason"}`);
    const ids = arr(res.order_list).length ? arr(res.order_list) : [res.order_list?.number].flat().filter(Boolean);
    return { supplier_order_id: ids.map(String).join(",") || null, status: autoPay ? "sent" : "awaiting_payment" };
  },

  /** AliExpress splits an order per seller, so one Snapfront order can map to several AliExpress orders. */
  async orderStatus(creds, supplierOrderId) {
    const results = [];
    for (const id of String(supplierOrderId).split(",").filter(Boolean)) {
      const r = await call(creds, "aliexpress.trade.ds.order.get", { single_order_query: { order_id: Number(id) } });
      results.push(r?.result || {});
    }
    const states = results.map((o) => {
      const st = String(o.order_status || ""), ls = String(o.logistics_status || "");
      if (/CANCEL|CLOSE/.test(st)) return "canceled";
      if (st === "FINISH" || ls === "BUYER_ACCEPT_GOODS") return "delivered";
      if (st === "WAIT_BUYER_ACCEPT_GOODS" || tracked(ls)) return "shipped";
      if (st === "PLACE_ORDER_SUCCESS") return "awaiting_payment";
      return st ? "sent" : null;
    });
    const rank = ["awaiting_payment", "sent", "shipped", "delivered"];
    const status = states.includes("canceled") ? "canceled" : states.reduce((lo, s) => (rank.indexOf(s) < rank.indexOf(lo) ? s : lo), "delivered");
    const logistics = results.flatMap((o) => arr(o.logistics_info_list)).find((x) => x.logistics_no);
    return { status, tracking_number: logistics?.logistics_no || null, carrier: logistics?.logistics_service || null, tracking_url: null };
  },
};
