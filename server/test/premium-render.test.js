import test from "node:test";
import assert from "node:assert/strict";
import { THEMES, publicThemes, themeOf } from "../src/themes.js";
import { CATEGORY_REGISTRY } from "../src/premium-themes.js";
import { CATEGORY_CSS } from "../src/category-storefront-css.js";
import { CATEGORY_BASE_CSS } from "../src/category-theme-kit.js";
import { storePage } from "../src/render.js";

const product = {
  id: "", slug: "pendant", title: "Pendant", image_url: "https://img.test/pendant.jpg?tone=warm&v=1",
  alt_text: 'Pendant "No. 1" <limited>', price_cents: 12000, currency: "usd", variants: [], in_stock: true,
  status: "live", kind: "physical", tagline: "", category: "Objects", bullets: [], tags: [], faq: [], description: "",
};
const baseStore = { store_name: "Aster & Co", store_slug: "aster", _base: "", stripe_ready: true, tagline: "Old storefront heading", about: "A considered note about the collection.", announcement: "" };

test("premium metadata has 85 independent category directions alongside the original 20", () => {
  const listed = publicThemes();
  assert.equal(listed.length, 105);
  assert.equal(listed.filter((t) => t.collection === "classic").length, 20);
  const premium = listed.filter((t) => t.collection === "premium");
  assert.equal(premium.length, 85);
  assert.equal(new Set(premium.map((t) => t.family)).size, 85);
  for (const t of premium) {
    assert.match(t.id, /^p-/);
    assert.ok(t.category && t.group && t.family, t.id);
    assert.ok(["still", "drift", "pan"].includes(t.motion), t.id);
    assert.ok(t.copy.eyebrow && t.copy.collection && t.copy.cta && t.copy.title, t.id);
    assert.ok(["overlay", "split", "collage", "editorial", "type", "spotlight"].includes(t.shape.hero));
    assert.ok(CATEGORY_REGISTRY.has(t.id));
    assert.match(t.preview_url, /theme-assets\/.+-preview\.webp$/);
  }
  assert.equal(themeOf("classic").collection, undefined);
});

test("category heroes render safe seller wording and opt-in photo-only pan controls", () => {
  const html = storePage({ ...baseStore, theme: "p-womenswear", hero_title: 'A <better> & "quieter" edit', hero_subtitle: "Words sellers can change", hero_eyebrow: "Season <one>", hero_cta: "See & shop", hero_motion: "pan" }, [product]);
  assert.match(html, /<body class="th-p-womenswear [^"]*premium fam-womenswear/);
  assert.match(html, /data-hero-motion="pan"/);
  assert.match(html, /class="hero-media"/);
  assert.match(html, /data-hero-motion-control aria-pressed="false" aria-label="Pause hero motion">Pause motion/);
  assert.match(html, /A &lt;better&gt; &amp; &quot;quieter&quot; edit/);
  assert.match(html, /Season &lt;one&gt;/);
  assert.match(html, /See &amp; shop/);
  assert.match(html, /https:\/\/img\.test\/pendant\.jpg\?tone=warm&amp;v=1/);
  assert.doesNotMatch(html, /<better>|<one>/);
  assert.match(html, /hero\.classList\.toggle\("is-motion-paused"\)/);
  assert.match(CATEGORY_CSS, /\.hero\.has-hero-motion \.hero-media/);
  assert.match(CATEGORY_BASE_CSS, /animation-play-state:paused!important/);
  assert.match(CATEGORY_BASE_CSS, /prefers-reduced-motion:reduce/);
});

test("saved still wins over suggested motion and seller copy remains the fallback", () => {
  const html = storePage({ ...baseStore, theme: "p-womenswear", hero_motion: "still", hero_title: "", hero_subtitle: "", hero_eyebrow: "", hero_cta: "" }, [product]);
  assert.doesNotMatch(html, /<button[^>]*data-hero-motion-control/);
  assert.doesNotMatch(html, /<section[^>]*data-hero-motion=/);
  assert.match(html, /<h1[^>]*>Old storefront heading<\/h1>/);
  assert.match(html, /A considered note about the collection\./);
});

test("all original hero shapes retain their stable no-photo fallback", () => {
  const noImage = { ...product, image_url: "", alt_text: "" };
  for (const hero of ["overlay", "split", "collage", "editorial", "type", "spotlight"]) {
    const t = THEMES.slice(0, 20).find((candidate) => candidate.hero === hero);
    const html = storePage({ ...baseStore, theme: t.id }, [noImage]);
    assert.doesNotMatch(html, /src="(?:undefined|null)"/);
    if (hero === "type") assert.match(html, /class="hero h-ty/);
    else assert.match(html, /class="hero h-plain/);
  }
});
