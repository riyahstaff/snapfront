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
export type Product = Draft & {
  id: string;
  slug: string;
  status: "draft" | "live";
  price_cents: number;
  payment_link_url: string | null;
  page_url?: string;
  has_delivery: boolean;
  created_at: string;
};
export type Seller = {
  id: string;
  store_name: string;
  store_slug: string;
  tagline: string;
  store_url: string;
  stripe_connected: boolean;
  stripe_ready: boolean;
};
export type ProductType = { id: string; name: string; sub: string; price: number };
export type Trend = { name: string; why: string; where: string };

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
  updateStore: (patch: Partial<Pick<Seller, "store_name" | "tagline">>) => request<Seller>("PATCH", "/api/me", patch),
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
  updateProduct: (id: string, patch: Partial<Draft>) => request<Product>("PATCH", `/api/products/${id}`, patch),
  deleteProduct: (id: string) => request<void>("DELETE", `/api/products/${id}`),
  publish: (id: string) => request<Product>("POST", `/api/products/${id}/publish`),
  stripeOnboard: () => request<{ url: string }>("POST", "/api/stripe/onboard"),
  stripeStatus: () => request<{ connected: boolean; ready: boolean }>("GET", "/api/stripe/status"),
  stripeDashboard: () => request<{ url: string }>("POST", "/api/stripe/dashboard"),
};

export const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;
