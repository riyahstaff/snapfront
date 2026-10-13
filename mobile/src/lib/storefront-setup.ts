import type { Me, Product, StorePatch, StoreTheme } from "./api";
import { newStorefrontDraft, type StorefrontDraft } from "./storefront-draft";

export function restoreStorefrontDraft(seller: Me, themes: StoreTheme[], saved: StorefrontDraft | null) {
  const fallback = themes.find((theme) => theme.id === seller.theme)?.id ?? themes[0]?.id ?? seller.theme;
  const initial = newStorefrontDraft({ theme: fallback, hero_motion: seller.hero_motion, store_name: seller.store_name,
    hero_title: seller.hero_title, hero_subtitle: seller.hero_subtitle, hero_eyebrow: seller.hero_eyebrow, hero_cta: seller.hero_cta,
    tagline: seller.tagline, about: seller.about, announcement: seller.announcement });
  const restored = newStorefrontDraft({ ...initial, ...(saved ?? {}) });
  const replaced = !themes.some((theme) => theme.id === restored.theme);
  return { draft: newStorefrontDraft({ ...restored, theme: replaced ? fallback : restored.theme }), replaced: Boolean(saved && replaced) };
}

/** Preview and final deployment must send exactly the same reviewable seller-owned fields. */
export function storefrontPatchBody(draft: StorefrontDraft, seller: Me): StorePatch {
  return {
    store_name: draft.store_name.trim() || seller.store_name, theme: draft.theme,
    hero_title: draft.hero_title.trim(), hero_subtitle: draft.hero_subtitle.trim(), hero_eyebrow: draft.hero_eyebrow.trim(),
    hero_cta: draft.hero_cta.trim(), hero_motion: draft.hero_motion, tagline: draft.tagline.trim(),
    about: draft.about.trim(), announcement: draft.announcement.trim(), ...(draft.banner_file ? { banner_file: draft.banner_file } : {}),
  };
}

export function storefrontReadiness(seller: Me, products: Product[]) {
  const liveProducts = products.filter((product) => product.status === "live").length;
  const liveAllowed = seller.account.stores.find((store) => store.id === seller.id)?.live_allowed ?? false;
  return { liveProducts, draftProducts: products.length - liveProducts, liveAllowed, stripeReady: seller.stripe_ready,
    canTakeOrders: liveAllowed && seller.stripe_ready && liveProducts > 0 };
}
