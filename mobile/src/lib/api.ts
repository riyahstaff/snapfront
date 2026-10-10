import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const API_URL: string = (Constants.expoConfig?.extra?.apiUrl as string) || "http://localhost:8080";
const TOKEN_KEY = "snapfront.token";

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
  stripe_connected: boolean;
  stripe_ready: boolean;
  shipping_flat: number;
  free_shipping_over: number | null;
  ship_countries: string[];
  tax_enabled: boolean;
};
export type StorePatch = Partial<Pick<Seller, "store_name" | "tagline" | "shipping_flat" | "free_shipping_over" | "ship_countries" | "tax_enabled">>;
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
  constructor(message: string, public status: number) {
    super(message);
  }
}

let tokenCache: string | null = null;
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
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("Couldn't reach Snapfront. Check your connection and try again.", 0);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error || "Something went wrong. Try again.", res.status);
  return data as T;
}

export const api = {
  me: () => request<Seller>("GET", "/api/me"),
  updateStore: (patch: StorePatch) => request<Seller>("PATCH", "/api/me", patch),
  async deleteAccount() {
    await request<void>("DELETE", "/api/me");
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    tokenCache = null;
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
  fulfillOrder: (id: string) => request<Order>("POST", `/api/orders/${id}/fulfill`),
  discounts: () => request<Discount[]>("GET", "/api/discounts"),
  createDiscount: (d: DiscountInput) => request<Discount>("POST", "/api/discounts", d),
  setDiscountActive: (id: string, active: boolean) => request<Discount>("PATCH", `/api/discounts/${id}`, { active }),
  deleteDiscount: (id: string) => request<void>("DELETE", `/api/discounts/${id}`),
  agentStart: (messages: ChatMessage[]) => request<{ id: string; status: string }>("POST", "/api/agent/runs", { messages }),
  agentRun: (id: string, after: number) => request<AgentRun>("GET", `/api/agent/runs/${id}?after=${after}`),
  stripeOnboard: () => request<{ url: string }>("POST", "/api/stripe/onboard"),
  stripeStatus: () => request<{ connected: boolean; ready: boolean }>("GET", "/api/stripe/status"),
  stripeDashboard: () => request<{ url: string }>("POST", "/api/stripe/dashboard"),
};

export const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;
