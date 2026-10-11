import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const API_URL: string = (Constants.expoConfig?.extra?.apiUrl as string) || "http://localhost:8080";
const TOKEN_KEY = "snapfront.token";
const STORE_KEY = "snapfront.store";

export type Faq = { q: string; a: string };
export type Draft = {
  image_file?: string | null;
  image_url?: string | null;
  kind: "physical" | "digital";
  title: string;
  tagline: string;
  description: string;
  bullets: string[];
  tags: string[];
  faq: Faq[];
  category: string;
  price: number;
  alt_text?: string;
  seo_description?: string;
  delivery_url?: string | null;
  /** Short text shown on the product photo in the store, like "New" or "20% off" */
  label?: string;
};
export type Variant = { id: string; name: string; price_cents: number | null; price: number; inventory: number | null; sku: string };
/** What the app sends when editing variants: keep `id` to update one, omit it to add one. */
export type VariantInput = { id?: string; name: string; price?: number | null; inventory?: number | null };
export type Product = Draft & {
  id: string;
  slug: string;
  status: "draft" | "live";
  price_cents: number;
  page_url?: string;
  has_delivery: boolean;
  created_at: string;
  inventory: number | null;
  option_name: string;
  sku: string;
  variants: Variant[];
  in_stock: boolean;
  source: "cj" | null;
  cost: number | null;
};
export type ProductPatch = Partial<Draft> & {
  inventory?: number | null;
  option_name?: string;
  variants?: VariantInput[];
  status?: "draft";
};
export type Seller = {
  id: string;
  store_name: string;
  store_slug: string;
  tagline: string;
  store_url: string;
  /** e.g. "snapfront.app" when every store has its own <slug>.snapfront.app address */
  store_domain: string | null;
  custom_domain: null | { domain: string; status: "pending" | "active" | "failed" };
  stripe_connected: boolean;
  stripe_ready: boolean;
  shipping_flat: number;
  free_shipping_over: number | null;
  ship_countries: string[];
  tax_enabled: boolean;
  /** Storefront look, one of the ids from api.themes() */
  theme: string;
  /** "About us" text on the storefront */
  about: string;
  /** Short line in the strip above the storefront header; blank = shipping info */
  announcement: string;
  /** Storefront cover photo */
  banner_url: string | null;
  /** Link-in-bio buttons */
  links: { label: string; url: string }[];
  links_url: string;
  feeds: { google: string; meta: string };
  /** Pro: email buyers who leave checkout (needs email set up on the server) */
  abandoned_emails: boolean;
};
/** A storefront look the seller can pick (server/src/themes.js). */
export type StoreTheme = {
  id: string; name: string; for: string; vibe: string; dark: boolean;
  fonts: { display: string; body: string };
  colors: { bg: string; surface: string; ink: string; muted: string; accent: string; onAccent: string; badge: string; onBadge: string; line: string;
    panel: string; onPanel: string; bar: string; onBar: string; foot: string };
  shape: { radius: number; button: number; ratio: string; card: string; header: "split" | "center" | "stack";
    hero: "overlay" | "split" | "collage" | "editorial" | "type" | "spotlight"; upper: string | null };
};
/** Photo studio: a new background behind a product photo. */
export type StudioStyle = { color: string } | { scene: string } | { prompt: string };
export type StudioPresets = { enabled: boolean; custom: boolean; colors: { id: string; name: string; hex: string }[]; scenes: { id: string; name: string }[] };
export type StudioResult = { image_file: string; image_url: string; source_file: string; notice?: string | null };
/** Free directory of places to source products. */
export type SourceSupplier = { id: string; name: string; url: string; sells: string; shipsFrom: string; cost: string; delivery: string; tip?: string; connect?: "cj" | "aliexpress" | "printful" };
export type SourceDirectory = { updated: string; note: string; groups: { id: string; name: string; blurb: string; suppliers: SourceSupplier[] }[] };
/** Marketing posts */
export type PostCopy = { headline: string; subline: string; bullets: string[]; cta: string; caption: string; hashtags: string[]; link: string };
export type PostKind = "image" | "carousel" | "reel";
export type PostFormat = "post" | "square" | "story";
export type MarketingOptions = { templates: { id: string; name: string; about: string }[]; formats: PostFormat[]; ai: AiPresets };
export type RenderedPost = { kind: PostKind; files: { file: string; url: string }[] };
/** AI video clips and lifestyle photos (Runpod) */
export type AiPresets = { enabled: boolean; motions: { id: string; name: string }[]; scenes: { id: string; name: string }[] };
export type AiJob = { id: string; kind: "video" | "scene"; status: "queued" | "running" | "done" | "failed"; error: string | null; created_at: string; url?: string; file?: string; image_file?: string };
/** Store insights (Pro) */
export type Insights = { days: number; visitors: number; views: number; orders: number; sales: number; conversion: number;
  daily: { day: string; visitors: number; orders: number; sales: number }[]; top_products: { id: string; title: string; visitors: number; sold: number }[]; sources: { source: string; visitors: number }[] };
export type Review = { id: string; product_id: string; product_title: string | null; name: string; rating: number; body: string; status: "published" | "hidden"; created_at: string };
export type PlanId = "free" | "launch" | "pro";
export type PlanLimits = { name: string; liveStores: number; stores: number; photo: number; product: number; agent: number; research: number; studio: number; post: number; scene: number; video: number };
export type Account = {
  id: string;
  email: string | null;
  plan: PlanId;
  plan_name: string;
  limits: PlanLimits;
  period: string;  // "YYYY-MM", or "trial" on the free plan
  usage: { photo: number; product: number; agent: number; research: number; studio: number; post: number; scene: number; video: number };
  stores: { id: string; store_name: string; store_slug: string; live_allowed: boolean; current: boolean }[];
  can_add_store: boolean;
  suppliers: Suppliers;
};
export type DomainView = {
  enabled: boolean; domain: string | null; status?: "pending" | "active" | "failed";
  record?: { type: "CNAME"; host: string; value: string }; url?: string;
};
export type SupplierId = "cj" | "printful" | "aliexpress";
export type SupplierState = {
  name: string; connected: boolean; auto_pay: boolean;
  browse_without_account?: boolean; pending_authorization?: boolean; callback_url?: string; store_name?: string; account_name?: string;
};
export type Suppliers = Record<SupplierId, SupplierState>;
/** What each supplier needs from the seller to connect. */
export type SupplierConnectInput = { api_key?: string; token?: string; app_key?: string; app_secret?: string; auto_pay?: boolean };
export type Me = Seller & { account: Account };
export type PriceMatch = { title: string; link: string; thumbnail: string | null; price: number; in_stock: boolean | null; store: string; store_name: string };
export type PriceCheck = {
  image_url: string;
  matches: PriceMatch[];
  summary: { count: number; lowest: number | null; median: number | null; highest: number | null; lowest_major: number | null; by_store: Record<string, { store_name: string; price: number; link: string }> };
  suggestion: null | { price: number; basis: string; cost?: number; profit?: number; margin_percent?: number; warning?: string };
};
export type PriceCheckInput = { imageBase64?: string; mediaType?: string; image_file?: string; image_url?: string; cost?: number };
export type StorePatch = Partial<Pick<Seller, "store_name" | "store_slug" | "tagline" | "shipping_flat" | "free_shipping_over" | "ship_countries" | "tax_enabled" | "theme" | "about" | "announcement" | "links" | "abandoned_emails">>;
export type OrderItem = { title: string; variant: string | null; qty: number; kind: "physical" | "digital"; unit: number };
export type Address = { line1?: string; line2?: string | null; city?: string; state?: string | null; postal_code?: string; country?: string };
export type Order = {
  id: string;
  status: "paid" | "fulfilled" | "canceled";
  items: OrderItem[];
  subtotal: number; discount: number; shipping: number; tax: number; total: number;
  discount_code: string | null;
  email: string | null;
  customer_name: string | null;
  shipping_address: Address | null;
  paid_at: string | null;
  fulfilled_at: string | null;
  created_at: string;
  supplier: null | { name: string; status: SupplierStatus; order_id: string | null; error: string | null };
  fulfillments?: Fulfillment[];
  tracking: null | { number: string; carrier: string | null; url: string };
};
export type Fulfillment = {
  supplier: SupplierId; name: string; status: SupplierStatus; order_id: string | null; error: string | null;
  tracking: null | { number: string; carrier: string | null; url: string };
};
export type SupplierStatus = "needs_key" | "sending" | "awaiting_payment" | "sent" | "shipped" | "delivered" | "failed" | "canceled";
export type CatalogItem = { pid: string; title: string; image: string | null; cost: number | null; sku: string | null };
export type CatalogPage = { page: number; total: number; pages: number; products: CatalogItem[] };
export type CatalogVariant = { vid: string; sku: string; name: string; cost: number; image: string | null };
export type ShippingQuote = { name: string; price: number; days: string; from: string };
export type CatalogProduct = {
  pid: string; title: string; description: string; images: string[]; option_name: string; cost: number | null;
  variants: CatalogVariant[]; shipping: ShippingQuote | null; landed_cost: number | null;
  source: SupplierId; supplier_name: string; suggested_price?: number | null; design?: boolean;
};
export type ImportResult = {
  product: Product;
  pricing: { price: number; cost: number; shipping: ShippingQuote | null; landed_cost: number; profit: number; basis: string; warning: string | null };
  market: null | { summary: PriceCheck["summary"]; matches: PriceMatch[] };
};
export type Discount = {
  id: string; code: string; kind: "percent" | "amount"; value: number; active: boolean; uses: number;
  max_uses: number | null; min_subtotal: number; expires_at: string | null; label: string;
};
export type DiscountInput = { code: string; kind: "percent" | "amount"; percent?: number; amount?: number; min_subtotal?: number; max_uses?: number };
export type ProductType = { id: string; name: string; sub: string; price: number };
export type Trend = { name: string; why: string; where: string };
export type ChatMessage = { role: "user" | "assistant"; content: string };
export type AgentProduct = { id: string; title: string; price: number; status: "draft" | "live"; kind: string; page_url?: string };
export type AgentEvent =
  | { type: "thinking"; at: number }
  | { type: "step"; tool: string; label: string; at: number }
  | { type: "step_failed"; tool: string; label: string; at: number }
  | { type: "product"; product: AgentProduct; at: number };
export type AgentRun = { id: string; status: "running" | "done" | "error"; events: AgentEvent[]; next: number; reply: string | null; error: string | null };

export class ApiError extends Error {
  constructor(message: string, public status: number, public upgrade: PlanId | null = null) {
    super(message);
  }
}

/** Called when the server says a feature needs a paid plan, so the app can show the plans screen. */
let upgradeListener: ((plan: PlanId, message: string) => void) | null = null;
export function onUpgradeNeeded(fn: typeof upgradeListener) { upgradeListener = fn; }

let tokenCache: string | null = null;
let storeCache: string | null | undefined;
async function currentStore(): Promise<string | null> {
  if (storeCache === undefined) storeCache = await SecureStore.getItemAsync(STORE_KEY);
  return storeCache ?? null;
}
async function token(): Promise<string> {
  if (tokenCache) return tokenCache;
  tokenCache = await SecureStore.getItemAsync(TOKEN_KEY);
  if (tokenCache) return tokenCache;
  // First launch: create this device's store.
  const res = await fetch(`${API_URL}/api/sellers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ store_name: "My Snapfront Store" }),
  });
  if (!res.ok) throw new ApiError("Couldn't reach Snapfront. Check your connection and try again.", res.status);
  const data = (await res.json()) as { token: string };
  await SecureStore.setItemAsync(TOKEN_KEY, data.token);
  tokenCache = data.token;
  return data.token;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    const store = await currentStore();
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}`, ...(store ? { "X-Store": store } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("Couldn't reach Snapfront. Check your connection and try again.", 0);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const { error, upgrade } = data as { error?: string; upgrade?: PlanId | null };
    const err = new ApiError(error || "Something went wrong. Try again.", res.status, upgrade ?? null);
    if (res.status === 402 && upgrade && upgradeListener) upgradeListener(upgrade, err.message);
    throw err;
  }
  return data as T;
}

async function setStore(id: string | null) {
  storeCache = id;
  if (id) await SecureStore.setItemAsync(STORE_KEY, id); else await SecureStore.deleteItemAsync(STORE_KEY);
}

export const api = {
  me: () => request<Me>("GET", "/api/me"),
  updateStore: (patch: StorePatch) => request<Me>("PATCH", "/api/me", patch),
  setBanner: (imageBase64: string, mediaType = "image/jpeg") => request<Me>("PUT", "/api/me/banner", { imageBase64, mediaType }),
  removeBanner: () => request<Me>("DELETE", "/api/me/banner"),
  studioPresets: () => request<StudioPresets>("GET", "/api/studio"),
  studio: (input: { image_file?: string; imageBase64?: string; mediaType?: string; style: StudioStyle }) => request<StudioResult>("POST", "/api/studio", input),
  sources: () => request<SourceDirectory>("GET", "/api/sources"),
  marketing: () => request<MarketingOptions>("GET", "/api/marketing"),
  postCopy: (input: { product_id: string; platform: "instagram" | "tiktok"; offer?: string; tone?: string }) => request<PostCopy>("POST", "/api/marketing/copy", input),
  renderPost: (input: { product_id: string; kind: PostKind; template: string; format: PostFormat; copy: Partial<PostCopy>; offer?: string; image_url?: string }) =>
    request<RenderedPost>("POST", "/api/marketing/render", input),
  aiMedia: () => request<AiPresets & { jobs: AiJob[] }>("GET", "/api/ai-media"),
  startAiMedia: (input: { kind: "video" | "scene"; image_file: string; preset?: string; prompt?: string }) => request<AiJob>("POST", "/api/ai-media", input),
  aiJob: (id: string) => request<AiJob>("GET", `/api/ai-media/${id}`),
  insights: (days: 7 | 30 | 90) => request<Insights>("GET", `/api/insights?days=${days}`),
  reviews: () => request<Review[]>("GET", "/api/reviews"),
  setReview: (id: string, status: "published" | "hidden") => request<Review[]>("PATCH", `/api/reviews/${id}`, { status }),
  qrUrl: (url: string) => `${API_URL}/qr.png?url=${encodeURIComponent(url)}`,
  themes: () => request<{ themes: StoreTheme[] }>("GET", "/api/themes").then((r) => r.themes),
  async deleteAccount() {
    await request<void>("DELETE", "/api/me");
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await setStore(null);
    tokenCache = null;
  },
  /** Work on another of this account's stores. */
  switchStore: (id: string) => setStore(id),
  async createStore(store_name: string) {
    const s = await request<Me>("POST", "/api/stores", { store_name });
    await setStore(s.id);
    return s;
  },
  async deleteStore(id: string) {
    await request<void>("DELETE", `/api/stores/${id}`);
    if (storeCache === id) await setStore(null);
  },
  billingSync: () => request<Me>("POST", "/api/billing/sync"),
  billingGoogle: (product_id: string, purchase_token: string) => request<Me>("POST", "/api/billing/google", { product_id, purchase_token }),
  priceCheck: (input: PriceCheckInput) => request<PriceCheck>("POST", "/api/research/price-check", input),
  plans: () => request<Record<PlanId, PlanLimits>>("GET", "/api/plans"),
  emailStart: (email: string) => request<{ sent: boolean; email: string }>("POST", "/api/auth/email/start", { email }),
  async emailVerify(email: string, code: string) {
    const r = await request<{ status: "linked" | "switched"; email: string; token?: string }>("POST", "/api/auth/email/verify", { email, code });
    if (r.status === "switched" && r.token) {
      await SecureStore.setItemAsync(TOKEN_KEY, r.token);
      tokenCache = r.token;
      await setStore(null);
    }
    return r;
  },
  legalUrl: (page: "privacy" | "terms") => `${API_URL}/${page}`,
  productFromPhoto: (input: { imageBase64: string; mediaType: string; kind: string; hint?: string; price?: string; tone?: string }) =>
    request<Draft>("POST", "/api/ai/product-from-photo", input),
  generate: (input: { type: string; niche: string; color: string; price?: number }) => request<Product>("POST", "/api/ai/generate", input),
  productTypes: () => request<ProductType[]>("GET", "/api/product-types"),
  trends: () => request<Trend[]>("GET", "/api/trends"),
  products: () => request<Product[]>("GET", "/api/products"),
  product: (id: string) => request<Product>("GET", `/api/products/${id}`),
  createProduct: (d: Draft) => request<Product>("POST", "/api/products", d),
  updateProduct: (id: string, patch: ProductPatch) => request<Product>("PATCH", `/api/products/${id}`, patch),
  deleteProduct: (id: string) => request<void>("DELETE", `/api/products/${id}`),
  publish: (id: string) => request<Product>("POST", `/api/products/${id}/publish`),
  orders: () => request<Order[]>("GET", "/api/orders"),
  orderSupplier: (id: string) => request<Order>("POST", `/api/orders/${id}/supplier`),
  catalogSearch: (source: SupplierId, q: string, page = 1) =>
    request<CatalogPage>("GET", `/api/catalog/search?source=${source}&q=${encodeURIComponent(q)}&page=${page}`),
  catalogProduct: (source: SupplierId, pid: string) => request<CatalogProduct>("GET", `/api/catalog/products/${encodeURIComponent(pid)}?source=${source}`),
  importProduct: (source: SupplierId, pid: string, body: { price?: number; vids?: string[]; price_check?: boolean }) =>
    request<ImportResult>("POST", `/api/catalog/products/${encodeURIComponent(pid)}/import?source=${source}`, body),
  connectSupplier: (source: SupplierId, input: SupplierConnectInput) => request<Suppliers & { authorize_url?: string }>("PUT", `/api/suppliers/${source}`, input),
  setSupplierAutoPay: (source: SupplierId, auto_pay: boolean) => request<Suppliers>("PATCH", `/api/suppliers/${source}`, { auto_pay }),
  disconnectSupplier: (source: SupplierId) => request<Suppliers>("DELETE", `/api/suppliers/${source}`),
  supplierAuthorizeUrl: (source: SupplierId) => request<{ url: string }>("POST", `/api/suppliers/${source}/authorize`),
  fulfillOrder: (id: string) => request<Order>("POST", `/api/orders/${id}/fulfill`),
  discounts: () => request<Discount[]>("GET", "/api/discounts"),
  createDiscount: (d: DiscountInput) => request<Discount>("POST", "/api/discounts", d),
  setDiscountActive: (id: string, active: boolean) => request<Discount>("PATCH", `/api/discounts/${id}`, { active }),
  deleteDiscount: (id: string) => request<void>("DELETE", `/api/discounts/${id}`),
  agentStart: (messages: ChatMessage[]) => request<{ id: string; status: string }>("POST", "/api/agent/runs", { messages }),
  agentRun: (id: string, after: number) => request<AgentRun>("GET", `/api/agent/runs/${id}?after=${after}`),
  domain: () => request<DomainView>("GET", "/api/domain"),
  setDomain: (domain: string) => request<DomainView>("PUT", "/api/domain", { domain }),
  refreshDomain: () => request<DomainView>("POST", "/api/domain/refresh"),
  removeDomain: () => request<DomainView>("DELETE", "/api/domain"),
  stripeOnboard: () => request<{ url: string }>("POST", "/api/stripe/onboard"),
  stripeStatus: () => request<{ connected: boolean; ready: boolean }>("GET", "/api/stripe/status"),
  taxSetup: () => request<{ url: string }>("POST", "/api/stripe/tax-setup"),
  taxStatus: () => request<{ active: boolean; missing: string[]; registrations: string[] }>("GET", "/api/stripe/tax"),
  stripeDashboard: () => request<{ url: string }>("POST", "/api/stripe/dashboard"),
};

export const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;
