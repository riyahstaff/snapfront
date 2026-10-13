import type { Me, Product, StorePatch, StoreTheme } from "./api";
import { newStorefrontDraft, type StorefrontDraft } from "./storefront-draft";
import { remainingTemplateContent } from "./template-setup";

export function restoreStorefrontDraft(seller: Me, themes: StoreTheme[], saved: StorefrontDraft | null) {
  const fallback = themes.find((theme) => theme.id === seller.theme)?.id ?? themes[0]?.id ?? seller.theme;
  const initial = newStorefrontDraft({ theme: fallback, hero_motion: seller.hero_motion, store_name: seller.store_name,
    hero_title: seller.hero_title, hero_subtitle: seller.hero_subtitle, hero_eyebrow: seller.hero_eyebrow, hero_cta: seller.hero_cta,
    tagline: seller.tagline, about: seller.about, announcement: seller.announcement,
    banner_file: seller.banner_file ?? null, banner_url: seller.banner_url ?? null,
    photo_files: seller.design_photos?.map((photo) => photo?.image_file ?? null),
    photo_urls: seller.design_photos?.map((photo) => photo?.image_url ?? null) });
  const restored = newStorefrontDraft({ ...initial, ...(saved ?? {}) });
  const replaced = !themes.some((theme) => theme.id === restored.theme);
  return { draft: newStorefrontDraft({ ...restored, theme: replaced ? fallback : restored.theme }), replaced: Boolean(saved && replaced) };
}

/** Preview and final deployment must send exactly the same reviewable seller-owned fields. */
export function storefrontPatchBody(draft: StorefrontDraft, seller: Me, includeSamples = false): StorePatch {
  return {
    ...remainingTemplateContent(draft, includeSamples),
    store_name: draft.store_name.trim() || seller.store_name, theme: draft.theme,
    ...(draft.banner_file ? { banner_file: draft.banner_file } : {}),
    ...(draft.photo_files ? { design_photos: draft.photo_files } : {}),
  };
}

export function storefrontReadiness(seller: Me, products: Product[]) {
  const liveProducts = products.filter((product) => product.status === "live").length;
  const liveAllowed = seller.account.stores.find((store) => store.id === seller.id)?.live_allowed ?? false;
  return { liveProducts, draftProducts: products.length - liveProducts, liveAllowed, stripeReady: seller.stripe_ready,
    canTakeOrders: liveAllowed && seller.stripe_ready && liveProducts > 0 };
}
