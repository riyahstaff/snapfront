import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import type { DigitalDocument, DigitalFormat, DigitalTemplateSummary } from "./digital-design";
export type { DigitalBlock, DigitalBlockKind, DigitalDocument, DigitalFormat, DigitalFonts, DigitalPage, DigitalPageKind, DigitalPalette, DigitalTemplateSummary } from "./digital-design";

export const API_URL: string = (Constants.expoConfig?.extra?.apiUrl as string) || "http://localhost:8080";
const TOKEN_KEY = "snapfront.token";
const STORE_KEY = "snapfront.store";

export type Faq = { q: string; a: string };
/** Server-rendered SVGs remain private, owner-bound preview content. They are never a product attachment. */
export type DigitalPreview = {
  pages: { index: number; source_page_id: string | null; svg: string; width: number; height: number }[];
  page_count: number;
  document_hash: string;
};
export type DigitalExport = { id: string; revision: number; document_hash: string; page_count: number; pdf_url: string; cover_url: string; created_at: string };
export type DigitalDesignRecord = { product_id: string; source_available: boolean; document: DigitalDocument | null; revision: number; export: DigitalExport | null; legacy_message: string | null };
export type DigitalDesignCatalog = { templates: DigitalTemplateSummary[]; formats: { id: DigitalFormat; name: string }[]; version: 1 | 2 };
export type CreateDigitalDesignInput = { template_id: string; design_revision?: 1 | 2; title?: string; subtitle?: string; brand?: string };
export type SaveDigitalDesignInput = { document: DigitalDocument; revision: number; rebuild_legacy?: true };
export type AttachDigitalDesignInput = { export_id: string; revision: number; acknowledge_live: boolean };
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
  /** What one item costs the seller, for Sales & profit. null clears it. */
  cost?: number | null;
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
  /** Optional premium storefront copy; blank values use that look's defaults. */
  hero_title: string;
  hero_subtitle: string;
  hero_eyebrow: string;
  hero_cta: string;
  hero_motion: "still" | "drift" | "pan";
  /** "About us" text on the storefront */
  about: string;
  /** Short line in the strip above the storefront header; blank = shipping info */
  announcement: string;
  /** Storefront cover photo */
  banner_url: string | null;
  /** Server-owned reference for the currently applied storefront cover, when available. */
  banner_file?: string | null;
  /** Main and detail images selected for a template-first storefront. Null entries are intentionally empty slots. */
  design_photos?: (null | { image_file: string; image_url: string })[];
  /** Link-in-bio buttons */
  links: { label: string; url: string }[];
  links_url: string;
  feeds: { google: string; meta: string };
  /** Pro: email buyers who leave checkout (needs email set up on the server) */
  abandoned_emails: boolean;
};
/** A storefront look the seller can pick (server/src/themes.js). */
export type ThemeGroup = "fashion" | "beauty" | "home" | "technology" | "outdoor" | "lifestyle";
export type StoreTheme = {
  id: string; name: string; for: string; vibe: string; dark: boolean;
  /** Classic looks omit these fields; premium looks provide them for the setup wizard. */
  collection?: "premium" | "classic";
  category?: string;
  family?: string;
  /** A broad catalog filter. Omitted by older catalogs. */
  group?: ThemeGroup;
  /** HTTPS-rendered catalog artwork; it is illustrative rather than seller storefront content. */
  preview_url?: string;
  /** Optional illustrative theme demo route, distinct from a seller's own store preview. */
  demo_url?: string;
  motion?: "still" | "drift" | "pan";
  /** Suggested wording is never copied into seller fields until the seller explicitly chooses it. */
  copy?: { title?: string; subtitle?: string; eyebrow?: string; collection?: string; cta?: string };
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
/** `render_id`/`format` are additive: a pre-Meta backend can still return the original shape. */
export type RenderedPost = { kind: PostKind; files: { file: string; url: string }[]; render_id?: string; format?: PostFormat };
export type SocialAccount = {
  id: string;
  platform: "instagram" | "facebook";
  name: string;
  status: "connected" | "reconnect_required";
};
export type SocialAccounts = { enabled: boolean; setup_required: string | null; accounts: SocialAccount[] };
export type SocialPost = {
  id: string;
  platform: "instagram" | "facebook";
  account_name: string;
  status: "queued" | "processing" | "published" | "failed" | "uncertain" | "canceled";
  caption: string;
  kind: PostKind;
  publish_at: string;
  created_at: string;
  error: string | null;
  permalink: string | null;
  retryable: boolean;
};
export type SocialPosts = { posts: SocialPost[] };
export type SocialPublishInput = { render_id: string; caption: string; account_ids: string[]; publish_at?: string | null; idempotency_key: string };
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
  lifetime?: boolean;
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
/** A seller-owned cover image that is safe to reference later in the final storefront PATCH. */
export type StagedStorefrontPhoto = { image_file: string; image_url: string };
/** An unauthenticated, temporary URL that renders a staged storefront without saving it. */
export type StorefrontPreview = { url: string; expires_in: number };
/** A self-contained, owner-bound storefront frame for the setup wizard. It is never a public storefront URL. */
export type TemplatePreview = {
  html: string;
  photo_slots: { index: 0 | 1 | 2; label: string; image_url: string | null; sample: boolean }[];
  sample_products: number;
  mode: "template" | "final";
  theme: { id: string; name: string };
};
/** Suggestions are intentionally separate from saved seller data until the seller chooses to apply them. */
export type StorefrontCopy = {
  hero_title: string; hero_subtitle: string; hero_eyebrow: string; hero_cta: string;
  tagline: string; about: string; announcement: string;
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
export type StorePatch = Partial<Pick<Seller, "store_name" | "store_slug" | "tagline" | "shipping_flat" | "free_shipping_over" | "ship_countries" | "tax_enabled" | "theme" | "hero_title" | "hero_subtitle" | "hero_eyebrow" | "hero_cta" | "hero_motion" | "about" | "announcement" | "links" | "abandoned_emails">> & {
  /** Only a staged storefront photo owned by this seller, or the current banner, is accepted by the server. */
  banner_file?: string;
  /** Detail photo references in template slot order. `null` deliberately clears that detail slot. */
  design_photos?: (string | null)[];
};
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
let tokenPromise: Promise<string> | null = null;
let storeCache: string | null | undefined;
let selectionRevision = 0;
async function currentStore(): Promise<string | null> {
  if (storeCache === undefined) {
    const stored = await SecureStore.getItemAsync(STORE_KEY);
    if (storeCache === undefined) storeCache = stored;
  }
  return storeCache ?? null;
}
async function token(): Promise<string> {
  if (tokenCache) return tokenCache;
  if (!tokenPromise) tokenPromise = initializeToken().finally(() => { tokenPromise = null; });
  return tokenPromise;
}
async function initializeToken(): Promise<string> {
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

// The phone app says so: memberships are sold on the website only, so the server words
// "needs a membership" messages for the app without prices or buying.
const APP_OS = Constants.platform?.android ? "android" : Constants.platform?.ios ? "ios" : null;
const APP_HEADER: Record<string, string> = APP_OS ? { "X-Snapfront-App": APP_OS } : {};

async function request<T>(method: string, path: string, body?: unknown, storeId?: string, timeoutMs?: number): Promise<T> {
  const controller = timeoutMs ? new AbortController() : null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const work = async (): Promise<T> => {
    const store = storeId ?? await currentStore();
    const auth = await token();
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth}`, ...(store ? { "X-Store": store } : {}), ...APP_HEADER },
      body: body === undefined ? undefined : JSON.stringify(body),
      ...(controller ? { signal: controller.signal } : {}),
    });
    if (res.status === 204) return undefined as T;
    const data = await res.json().catch((error: unknown) => { if (controller?.signal.aborted) throw error; return {}; });
    if (!res.ok) {
      const { error, upgrade } = data as { error?: string; upgrade?: PlanId | null };
      const err = new ApiError(error || "Something went wrong. Try again.", res.status, upgrade ?? null);
      if (res.status === 402 && upgrade && upgradeListener) upgradeListener(upgrade, err.message);
      throw err;
    }
    return data as T;
  };
  try {
    if (!timeoutMs || !controller) return await work();
    const timeout = new Promise<T>((_resolve, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new ApiError("Snapfront took too long to respond. Your draft is safe. Retry without regenerating any image.", 0));
      }, timeoutMs);
    });
    return await Promise.race([work(), timeout]);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Couldn't reach Snapfront. Check your connection and try again.", 0);
  } finally {
    if (timer !== null) clearTimeout(timer);
  }
}

/** Short owner-bound image job/control requests; generation itself runs durably on the server. */
export const imageRequest = <T>(method: string, path: string, body: unknown, storeId: string): Promise<T> => request<T>(method, path, body, storeId, 45_000);

/** This endpoint is public: catalog discovery must not wait for or create a seller token. */
async function themeCatalog(): Promise<StoreTheme[]> {
  try {
    const response = await fetch(`${API_URL}/api/themes`);
    if (!response.ok) throw new ApiError("Couldn't load themes. Check your connection and retry.", response.status);
    const data = await response.json() as { themes?: StoreTheme[] };
    if (!Array.isArray(data.themes)) throw new ApiError("The theme catalog couldn't be read. Please retry.", 0);
    return data.themes;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Couldn't load themes. Check your connection and retry.", 0);
  }
}

/** Public discovery lets the packaged 50-design library refresh when the backend is available. */
async function digitalDesignCatalog(): Promise<DigitalDesignCatalog> {
  try {
    const response = await fetch(`${API_URL}/api/digital-designs?revision=2`);
    if (!response.ok) throw new ApiError("Couldn't load digital designs. You can still browse the included library.", response.status);
    const data = await response.json() as Partial<DigitalDesignCatalog>;
    if (!Array.isArray(data.templates) || !Array.isArray(data.formats) || (data.version !== 1 && data.version !== 2)) {
      throw new ApiError("The digital design catalog couldn't be read. You can still browse the included library.", 0);
    }
    return data as DigitalDesignCatalog;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Couldn't load digital designs. You can still browse the included library.", 0);
  }
}

async function setStore(id: string | null) {
  selectionRevision++;
  storeCache = id;
  if (id) await SecureStore.setItemAsync(STORE_KEY, id); else await SecureStore.deleteItemAsync(STORE_KEY);
}

export const api = {
  storeRevision: () => selectionRevision,
  selectedStore: () => storeCache ?? null,
  me: () => request<Me>("GET", "/api/me"),
  updateStore: (patch: StorePatch, storeId?: string) => request<Me>("PATCH", "/api/me", patch, storeId),
  /** Create a 30-minute browser preview without changing the public storefront. */
  previewStorefront: (patch: StorePatch, storeId?: string) => request<StorefrontPreview>("POST", "/api/storefront/preview", patch, storeId),
  /** Render an owner-bound setup frame. The returned HTML remains local to the app's constrained preview frame. */
  templatePreview: (patch: StorePatch, mode: "template" | "final", storeId?: string) =>
    request<TemplatePreview>("POST", "/api/storefront/template-preview", { ...patch, mode }, storeId, 30_000),
  /** Upload a cover photo without changing the live storefront. The returned file is applied only in updateStore. */
  stageStorefrontPhoto: (imageBase64: string, mediaType = "image/jpeg", storeId?: string) =>
    request<StagedStorefrontPhoto>("POST", "/api/storefront/photo", { imageBase64, mediaType }, storeId),
  /** Discard an unused staged cover; server protects the currently applied banner. */
  discardStorefrontPhoto: (file: string, storeId?: string) => request<void>("DELETE", `/api/storefront/photo/${encodeURIComponent(file)}`, undefined, storeId),
  /** AI storefront wording is suggestions only; the caller decides whether to put it into an editable local draft. */
  storefrontCopy: (input: { notes?: string; tone?: string; theme?: string; store_name?: string }, storeId?: string) =>
    request<StorefrontCopy>("POST", "/api/storefront/copy", input, storeId),
  setBanner: (imageBase64: string, mediaType = "image/jpeg") => request<Me>("PUT", "/api/me/banner", { imageBase64, mediaType }),
  removeBanner: () => request<Me>("DELETE", "/api/me/banner"),
  studioPresets: () => request<StudioPresets>("GET", "/api/studio"),
  /** The explicit owner keeps a late studio result bound to the store that initiated it. */
  studio: (input: { image_file?: string; imageBase64?: string; mediaType?: string; style: StudioStyle }, storeId?: string) => request<StudioResult>("POST", "/api/studio", input, storeId),
  sources: () => request<SourceDirectory>("GET", "/api/sources"),
  marketing: (storeId?: string) => request<MarketingOptions>("GET", "/api/marketing", undefined, storeId),
  /** The explicit store binds copy generation to the initiating seller even when the selector changes in flight. */
  postCopy: (input: { product_id: string; platform: "instagram" | "facebook" | "tiktok"; offer?: string; tone?: string }, storeId?: string) => request<PostCopy>("POST", "/api/marketing/copy", input, storeId),
  renderPost: (input: { product_id: string; kind: PostKind; template: string; format: PostFormat; copy: Partial<PostCopy>; offer?: string; image_url?: string }, storeId?: string) =>
    request<RenderedPost>("POST", "/api/marketing/render", input, storeId),
  /** Public connection metadata only; the server keeps OAuth tokens and state. */
  socialAccounts: (storeId?: string) => request<SocialAccounts>("GET", "/api/social/accounts", undefined, storeId),
  socialAuthorize: (storeId?: string) => request<{ url: string; redirect_url: "snapfront://marketing" }>("POST", "/api/social/authorize", undefined, storeId),
  disconnectSocialAccount: (id: string, storeId?: string) => request<SocialAccounts>("DELETE", `/api/social/accounts/${encodeURIComponent(id)}`, undefined, storeId),
  socialPosts: (storeId?: string) => request<SocialPosts>("GET", "/api/social/posts", undefined, storeId),
  createSocialPosts: (input: SocialPublishInput, storeId?: string) => request<SocialPosts>("POST", "/api/social/posts", input, storeId),
  cancelSocialPost: (id: string, storeId?: string) => request<SocialPosts>("POST", `/api/social/posts/${encodeURIComponent(id)}/cancel`, undefined, storeId),
  retrySocialPost: (id: string, storeId?: string) => request<SocialPosts>("POST", `/api/social/posts/${encodeURIComponent(id)}/retry`, undefined, storeId),
  aiMedia: () => request<AiPresets & { jobs: AiJob[] }>("GET", "/api/ai-media"),
  startAiMedia: (input: { kind: "video" | "scene"; image_file: string; preset?: string; prompt?: string }) => request<AiJob>("POST", "/api/ai-media", input),
  aiJob: (id: string) => request<AiJob>("GET", `/api/ai-media/${id}`),
  insights: (days: 7 | 30 | 90) => request<Insights>("GET", `/api/insights?days=${days}`),
  reviews: () => request<Review[]>("GET", "/api/reviews"),
  setReview: (id: string, status: "published" | "hidden") => request<Review[]>("PATCH", `/api/reviews/${id}`, { status }),
  qrUrl: (url: string) => `${API_URL}/qr.png?url=${encodeURIComponent(url)}`,
  themes: themeCatalog,
  /** This public list has no seller data; all document/product operations below require an explicit owner. */
  digitalDesigns: digitalDesignCatalog,
  createDigitalDesign: (storeId: string, input: CreateDigitalDesignInput) =>
    request<{ product: Product; design: DigitalDesignRecord }>("POST", "/api/digital-designs/create", input, storeId),
  digitalDesign: (storeId: string, productId: string) =>
    request<DigitalDesignRecord>("GET", `/api/products/${encodeURIComponent(productId)}/digital-design`, undefined, storeId),
  saveDigitalDesign: (storeId: string, productId: string, input: SaveDigitalDesignInput) =>
    request<DigitalDesignRecord>("PUT", `/api/products/${encodeURIComponent(productId)}/digital-design`, input, storeId),
  previewDigitalDesign: (storeId: string, productId: string, document: DigitalDocument) =>
    request<DigitalPreview>("POST", `/api/products/${encodeURIComponent(productId)}/digital-design/preview`, { document }, storeId),
  exportDigitalDesign: (storeId: string, productId: string, revision: number) =>
    request<DigitalExport>("POST", `/api/products/${encodeURIComponent(productId)}/digital-design/export`, { revision }, storeId),
  attachDigitalDesign: (storeId: string, productId: string, input: AttachDigitalDesignInput) =>
    request<{ product: Product; design: DigitalDesignRecord }>("POST", `/api/products/${encodeURIComponent(productId)}/digital-design/attach`, input, storeId),
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
  /** `template_id` preserves the generated full source under the selected editable digital template. */
  generate: (input: { type: string; niche: string; color: string; price?: number; template_id?: string; design_revision?: 1 | 2 }) => request<Product>("POST", "/api/ai/generate", input),
  productTypes: () => request<ProductType[]>("GET", "/api/product-types"),
  trends: () => request<Trend[]>("GET", "/api/trends"),
  products: (storeId?: string) => request<Product[]>("GET", "/api/products", undefined, storeId),
  product: (id: string, storeId?: string) => request<Product>("GET", `/api/products/${id}`, undefined, storeId),
  createProduct: (d: Draft) => request<Product>("POST", "/api/products", d),
  updateProduct: (id: string, patch: ProductPatch, storeId?: string) => request<Product>("PATCH", `/api/products/${id}`, patch, storeId),
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

/* ---------- Sales & profit ---------- */
export type BizRange = { range?: string; from?: string; to?: string };
export type BizSummary = {
  range: { from: string; to: string; label: string };
  totals: { revenue: number; orders: number; average_order: number; net_profit: number; margin: number; customers: number; new_customers: number; returning_customers: number; visitors: number; views: number; conversion: number };
  pnl: { gross_sales: number; discounts: number; shipping_charged: number; revenue: number; refunds: number; stripe_fees: number; product_costs: number; expenses: number; net_profit: number; tax_collected: number; refunded_orders: number; estimated_fee_orders: number; expense_categories: { category: string; amount: number }[] };
  series: { bucket: "day" | "week" | "month"; points: { period: string; revenue: number; profit: number; orders: number; visitors: number }[] };
  products: { id: string; title: string; units: number; revenue: number; cost: number; profit: number; visitors: number; conversion: number }[];
  sources: { source: string; visitors: number }[];
  missing_costs: number;
};
export type BizSale = { id: string; paid_at: string; status: string; customer_name: string | null; email: string | null; items: { title: string; variant: string | null; qty: number }[]; total: number; tax: number; discount: number; shipping: number; refunded: number; fee: number; fee_estimated: boolean; cost: number; profit: number; discount_code: string | null };
export type BizCustomer = { email: string; name: string | null; orders: number; spent: number; first_order: string; last_order: string; repeat: boolean; location: string | null; tags: string[]; note: string };
export type BizExpense = { id: string; day: string; label: string; category: string; amount: number };
export type BizBalance = { connected: boolean; available?: number; pending?: number; payouts?: { id: string; amount: number; status: string; arrival_date: string | null }[]; dashboard_url?: string; error?: string };
const bizQuery = (q: Record<string, string | number | undefined>) => {
  const p = Object.entries(q).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
  return p ? `?${p}` : "";
};
export const business = {
  summary: (r: BizRange) => request<BizSummary>("GET", `/api/business/summary${bizQuery(r)}`),
  sales: (r: BizRange & { q?: string; status?: string; page?: number }) => request<{ total: number; page: number; page_size: number; orders: BizSale[] }>("GET", `/api/business/sales${bizQuery(r)}`),
  customers: (q: { q?: string; sort?: string; tag?: string; filter?: string }) => request<{ total: number; stats: { customers: number; repeat: number; lifetime_value: number }; tags: string[]; customers: BizCustomer[] }>("GET", `/api/business/customers${bizQuery(q)}`),
  customer: (email: string) => request<BizCustomer & { orders_list: BizSale[] }>("GET", `/api/business/customers/${encodeURIComponent(email)}`),
  updateCustomer: (email: string, patch: { tags?: string[]; note?: string }) => request<BizCustomer & { orders_list: BizSale[] }>("PATCH", `/api/business/customers/${encodeURIComponent(email)}`, patch),
  expenses: (r: BizRange) => request<{ categories: string[]; expenses: BizExpense[] }>("GET", `/api/business/expenses${bizQuery(r)}`),
  addExpense: (e: { label: string; amount: number; category: string; day?: string }) => request<BizExpense>("POST", "/api/business/expenses", e),
  deleteExpense: (id: string) => request<void>("DELETE", `/api/business/expenses/${encodeURIComponent(id)}`),
  balance: () => request<BizBalance>("GET", "/api/business/balance"),
  exportLink: (kind: "sales" | "customers" | "expenses" | "subscribers" | "affiliates", r: BizRange = {}) => request<{ url: string }>("POST", "/api/business/export", { kind, ...r }),
};

/* ---------- email list and email marketing ---------- */
export type EmailOverview = {
  signup: { enabled: boolean; title: string; text: string; offer_code: string; defaults: { title: string; text: string } };
  mail_address: string; from_name: string; plan: PlanId; monthly_limit: number; used_this_month: number; can_broadcast: boolean; can_automate: boolean;
  counts: { subscribed: number; unsubscribed: number; new_30d: number }; sending_ready: boolean;
};
export type Subscriber = { id: string; email: string; name: string; source: string; status: "subscribed" | "unsubscribed"; created_at: string; orders: number; spent: number; last_order: string | null };
export type CampaignStats = { sent: number; failed: number; queued: number; opened: number; clicked: number; unsubscribed: number; open_rate: number; click_rate: number };
export type Campaign = {
  id: string; subject: string; preheader: string; body: string; cta_label: string; cta_url: string; product_id: string | null; discount_code: string; audience: string;
  status: "draft" | "scheduled" | "sending" | "sent"; send_at: string | null; recipients: number; created_at: string; updated_at: string; sent_at: string | null; stats: CampaignStats | null;
};
export type CampaignInput = Partial<Pick<Campaign, "subject" | "preheader" | "body" | "cta_label" | "cta_url" | "product_id" | "discount_code" | "audience">>;
export type Audience = { id: string; label: string; count: number };
export type EmailFlow = { kind: "welcome" | "after_purchase" | "winback"; name: string; when: string; enabled: boolean; subject: string; body: string; cta_label: string; discount_code: string; delay_days: number; stats: { sent: number; opened: number; clicked: number } };
export const email = {
  overview: () => request<EmailOverview>("GET", "/api/email"),
  settings: (patch: { signup_enabled?: boolean; signup_title?: string; signup_text?: string; signup_offer_code?: string; mail_address?: string; from_name?: string }) => request<EmailOverview>("PUT", "/api/email/settings", patch),
  subscribers: (q: { q?: string; status?: string; page?: number }) => request<{ total: number; page: number; page_size: number; subscribers: Subscriber[]; counts: EmailOverview["counts"] }>("GET", `/api/email/subscribers${bizQuery(q)}`),
  addSubscribers: (emails: string, consent: boolean) => request<{ added: number; skipped: number; invalid: number }>("POST", "/api/email/subscribers", { emails, consent }),
  unsubscribe: (id: string) => request<Subscriber>("PATCH", `/api/email/subscribers/${encodeURIComponent(id)}`, { status: "unsubscribed" }),
  removeSubscriber: (id: string) => request<void>("DELETE", `/api/email/subscribers/${encodeURIComponent(id)}`),
  campaigns: () => request<{ campaigns: Campaign[]; audiences: Audience[] }>("GET", "/api/email/campaigns"),
  createCampaign: (c: CampaignInput) => request<Campaign>("POST", "/api/email/campaigns", c),
  updateCampaign: (id: string, c: CampaignInput) => request<Campaign>("PATCH", `/api/email/campaigns/${encodeURIComponent(id)}`, c),
  deleteCampaign: (id: string) => request<void>("DELETE", `/api/email/campaigns/${encodeURIComponent(id)}`),
  duplicateCampaign: (id: string) => request<Campaign>("POST", `/api/email/campaigns/${encodeURIComponent(id)}/duplicate`),
  testCampaign: (id: string, to?: string) => request<{ sent_to: string }>("POST", `/api/email/campaigns/${encodeURIComponent(id)}/test`, { to }),
  sendCampaign: (id: string, sendAt?: string) => request<Campaign>("POST", `/api/email/campaigns/${encodeURIComponent(id)}/send`, sendAt ? { send_at: sendAt } : {}),
  cancelCampaign: (id: string) => request<Campaign>("POST", `/api/email/campaigns/${encodeURIComponent(id)}/cancel`),
  flows: () => request<{ can_automate: boolean; flows: EmailFlow[] }>("GET", "/api/email/flows"),
  updateFlow: (kind: EmailFlow["kind"], patch: Partial<Pick<EmailFlow, "enabled" | "subject" | "body" | "cta_label" | "discount_code" | "delay_days">>) => request<EmailFlow>("PUT", `/api/email/flows/${kind}`, patch),
};

/* ---------- affiliate program ---------- */
export type Affiliate = {
  id: string; name: string; email: string; code: string; rate: number; custom_rate: boolean; status: "active" | "pending" | "paused"; about: string; created_at: string;
  link: string; portal_url: string; clicks: number; orders: number; revenue: number; earned: number; paid: number; owed: number;
};
export type AffiliateOverview = {
  pro: boolean; join_url: string;
  settings: { enabled: boolean; rate: number; cookie_days: number; auto_approve: boolean; blurb: string };
  totals: { affiliates: number; pending: number; clicks: number; orders: number; revenue: number; earned: number; paid: number; owed: number };
  affiliates: Affiliate[];
};
export const affiliates = {
  overview: () => request<AffiliateOverview>("GET", "/api/affiliates"),
  settings: (patch: Partial<AffiliateOverview["settings"]>) => request<AffiliateOverview>("PUT", "/api/affiliates/settings", patch),
  add: (a: { name: string; email: string; code?: string; rate?: number | null }) => request<Affiliate>("POST", "/api/affiliates", a),
  detail: (id: string) => request<{ affiliate: Affiliate; orders: { id: string; paid_at: string; amount: number; commission: number; refunded: boolean }[]; payouts: { id: string; amount: number; note: string; created_at: string }[] }>("GET", `/api/affiliates/${encodeURIComponent(id)}`),
  update: (id: string, patch: { status?: "active" | "paused"; rate?: number | null; name?: string; code?: string }) => request<Affiliate>("PATCH", `/api/affiliates/${encodeURIComponent(id)}`, patch),
  remove: (id: string) => request<void>("DELETE", `/api/affiliates/${encodeURIComponent(id)}`),
  payout: (id: string, amount: number, note: string) => request<Affiliate>("POST", `/api/affiliates/${encodeURIComponent(id)}/payouts`, { amount, note }),
};

/* ---------- ad pixels ---------- */
export type PixelKey = "meta_pixel_id" | "tiktok_pixel_id" | "ga4_id" | "pinterest_tag_id";
export type PixelsView = { allowed: boolean; pixels: { key: PixelKey; name: string; hint: string; id: string }[] };
export const pixels = {
  get: () => request<PixelsView>("GET", "/api/pixels"),
  save: (patch: Partial<Record<PixelKey, string>>) => request<PixelsView>("PUT", "/api/pixels", patch),
};

/* ---------- Instagram AutoDM ---------- */
export type AutoDmRule = { id: string; keywords: string[]; match: "contains" | "exact"; trigger: "dm" | "comment" | "both"; reply: string; link_url: string; product_id: string | null; comment_reply: string; enabled: boolean; sent: number; created_at: string };
export type AutoDmRuleInput = Partial<Omit<AutoDmRule, "id" | "sent" | "created_at" | "keywords">> & { keywords?: string[] | string };
export type AutoDmStatus = {
  pro: boolean; live: boolean; accounts: { id: string; name: string; status: string }[];
  blocker: null | "pending_meta" | "connect_instagram" | "reconnect_instagram" | "upgrade";
  stats: { sent: number; sent_7d: number };
  activity: { kind: "dm" | "comment"; who: string; text: string; status: "sent" | "skipped" | "failed"; error: string | null; at: string }[];
  rules: AutoDmRule[];
};
export const autodm = {
  get: () => request<AutoDmStatus>("GET", "/api/autodm"),
  create: (r: AutoDmRuleInput) => request<AutoDmRule>("POST", "/api/autodm/rules", r),
  update: (id: string, r: AutoDmRuleInput) => request<AutoDmRule>("PATCH", `/api/autodm/rules/${encodeURIComponent(id)}`, r),
  remove: (id: string) => request<void>("DELETE", `/api/autodm/rules/${encodeURIComponent(id)}`),
  connect: () => request<{ pages: { name: string; ok: boolean }[] }>("POST", "/api/autodm/connect"),
};

export const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;

/* ---------- Snapfront Partners (earn by sharing Snapfront) ---------- */
export type PartnerProgram = { rate: number; monthly_per_month: number; monthly_price: number; hold_days: number; play_hold_days: number; window_days: number; lifetime_price: number; per_sale: number; terms: string[] };
export type PartnerCommission = { id: string; created_at: string; plan: string; sale: number; commission: number; status: "pending" | "approved" | "paid" | "void"; available_at: string; paid_at: string | null; note: string };
export type PartnerView = {
  joined: boolean; has_email?: boolean; program: PartnerProgram;
  code?: string; status?: "active" | "suspended"; link?: string; home_link?: string;
  stats?: { clicks: number; signups: number; sales: number; pending: number; ready: number; paid: number };
  payout?: { method: "stripe" | "paypal" | "none"; detail: string; paypal_email: string | null };
  commissions?: PartnerCommission[];
};
export const partners = {
  me: () => request<PartnerView>("GET", "/api/partners/me"),
  join: (b: { agree: boolean; paypal_email?: string; code?: string }) => request<PartnerView>("POST", "/api/partners/join", b),
  update: (b: { paypal_email?: string | null; code?: string }) => request<PartnerView>("PATCH", "/api/partners/me", b),
};

/** Send a file's bytes as the request body (videos and other large uploads). */
export async function uploadRaw<T>(path: string, body: Blob, contentType: string): Promise<T> {
  const store = await currentStore();
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST", headers: { "Content-Type": contentType, Authorization: `Bearer ${await token()}`, ...(store ? { "X-Store": store } : {}) }, body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error || "The upload didn't go through. Try again.", res.status);
  return data as T;
}

/* ---------- Snapfront Academy, today's post, community ---------- */
export type AcademyLessonRow = { id: string; title: string; summary: string; done: boolean; locked: boolean; minutes: number };
export type AcademyCatalog = { member: boolean; done: number; total: number; modules: { id: string; title: string; free: boolean; lessons: AcademyLessonRow[] }[] };
export type AcademyLesson = { id: string; title: string; summary: string; module: string; action: { label: string; route: string } | null; video: string | null; video_status: "ready" | "making";
  guide: { heading: string; points: string[] }[]; transcript: string; done: boolean; next: { id: string; title: string } | null };
export type DailyPrompt = { day: string; kind: string; kind_name: string; hook: string; film: string[]; on_screen: string; caption: string; hashtags: string[]; cta: string;
  product: { id: string; title: string; image_url: string | null; url: string } | null; more_left: number };
export type Community = { member: boolean; discord: string | null; has_discord: boolean; whop: string | null; live_schedule: string | null };
export const academy = {
  catalog: () => request<AcademyCatalog>("GET", "/api/academy"),
  lesson: (id: string) => request<AcademyLesson>("GET", `/api/academy/${encodeURIComponent(id)}`),
  setDone: (id: string, done: boolean) => request<AcademyCatalog>("POST", `/api/academy/${encodeURIComponent(id)}/done`, { done }),
  daily: (fresh = false) => request<DailyPrompt>("GET", `/api/daily-prompt${fresh ? "?fresh=1" : ""}`),
  community: () => request<Community>("GET", "/api/community"),
};

/* ---------- UGC creator kit ---------- */
export type UgcItem = { id: string; kind: "video" | "link"; file?: string; poster?: string | null; url?: string; title: string };
export type UgcProfile = { enabled: boolean; name: string; headline: string; bio: string; niches: string[]; email: string; rates: { label: string; price: number }[];
  socials: { tiktok: string; instagram: string; youtube: string }; items: UgcItem[]; page_url: string };
export type UgcPlatform = { name: string; url: string; pay?: string; fee?: string; what: string };
export type UgcDeal = { id: string; brand: string; contact: string; status: "pitched" | "talking" | "booked" | "delivered" | "paid" | "lost"; amount: number; due: string | null; note: string; created_at: string; updated_at: string };
export type UgcScript = { style: string; seconds: number; hooks: string[]; scenes: { shot: string; line: string; text: string }[]; cta: string; tips: string[] };
export type UgcKit = { profile: UgcProfile; platforms: { creators: UgcPlatform[]; stores: UgcPlatform[]; note: string }; deals: UgcDeal[]; totals: { paid: number; owed: number; booked: number; pipeline: number } };
export const ugcApi = {
  kit: () => request<UgcKit>("GET", "/api/ugc"),
  saveProfile: (p: Partial<Omit<UgcProfile, "items" | "page_url">> & { items?: { id?: string; url?: string; title?: string }[] }) => request<UgcProfile>("PUT", "/api/ugc/profile", p),
  uploadVideo: (blob: Blob, contentType: string, title: string) => uploadRaw<UgcProfile>(`/api/ugc/videos?title=${encodeURIComponent(title)}`, blob, contentType),
  script: (b: { brand: string; product: string; style: string; seconds: number; points?: string }) => request<UgcScript>("POST", "/api/ugc/script", b),
  addDeal: (d: Partial<Omit<UgcDeal, "id">>) => request<UgcDeal>("POST", "/api/ugc/deals", d),
  updateDeal: (id: string, d: Partial<Omit<UgcDeal, "id">>) => request<UgcDeal>("PATCH", `/api/ugc/deals/${encodeURIComponent(id)}`, d),
  deleteDeal: (id: string) => request<void>("DELETE", `/api/ugc/deals/${encodeURIComponent(id)}`),
};

/* ---------- faceless videos ---------- */
export type FacelessScene = { text: string; say: string };
export type FacelessScript = { product_id: string; style: string; hook: string; scenes: FacelessScene[]; cta: string; caption: string; hashtags: string[] };
export type FacelessJob = { id: string; status: "queued" | "working" | "done" | "failed"; product_id: string | null; seconds: number | null; error: string | null; created_at: string; url: string | null; download_url: string | null; script: Omit<FacelessScript, "product_id" | "style"> };
export const facelessApi = {
  list: () => request<{ voices: { id: string; name: string; accent: string }[]; styles: { id: string; name: string }[]; jobs: FacelessJob[] }>("GET", "/api/faceless"),
  script: (product_id: string, style: string) => request<FacelessScript>("POST", "/api/faceless/script", { product_id, style }),
  make: (b: { product_id: string; voice: string; script: Omit<FacelessScript, "product_id" | "style"> }) => request<FacelessJob>("POST", "/api/faceless/videos", b),
  job: (id: string) => request<FacelessJob>("GET", `/api/faceless/videos/${encodeURIComponent(id)}`),
  remove: (id: string) => request<void>("DELETE", `/api/faceless/videos/${encodeURIComponent(id)}`),
};
