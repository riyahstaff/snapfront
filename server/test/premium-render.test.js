import test from "node:test";
import assert from "node:assert/strict";

import { THEMES, publicThemes, themeOf } from "../src/themes.js";
import { CSS } from "../src/storefront-css.js";
import { storePage } from "../src/render.js";

const product = {
  id: "premium-product", slug: "pendant", title: "Pendant", image_url: "https://img.test/pendant.jpg?tone=warm&v=1",
  alt_text: 'Pendant "No. 1" <limited>', price_cents: 12000, currency: "usd", variants: [], in_stock: true,
  status: "live", kind: "physical", tagline: "", category: "Objects", bullets: [], tags: [], faq: [], description: "",
};

const baseStore = {
  store_name: "Aster & Co", store_slug: "aster", _base: "", stripe_ready: true,
  tagline: "Old storefront heading", about: "A considered note about the collection.", announcement: "",
};

test("premium public metadata is complete and is distinct from the classic collection", () => {
  const listed = publicThemes();
  assert.equal(listed.length, 45);
  assert.equal(listed.filter((t) => t.collection === "classic").length, 20);
  const premium = listed.filter((t) => t.collection === "premium");
  assert.equal(premium.length, 25);
  for (const t of premium) {
    assert.match(t.id, /^p-/);
    assert.ok(t.category, `${t.id} category`);
    assert.ok(t.family, `${t.id} family`);
    assert.ok(["still", "drift", "pan"].includes(t.motion), `${t.id} suggested motion`);
    assert.ok(t.copy.eyebrow && t.copy.collection && t.copy.cta, `${t.id} copy cues`);
    assert.ok(["overlay", "split", "collage", "editorial", "type", "spotlight"].includes(t.shape.hero));
  }
  assert.deepEqual([...new Set(premium.map((t) => t.family))].sort(), ["cinema", "gallery", "journal", "luminous", "maison"]);
  assert.equal(themeOf("classic").collection, undefined, "classic data remains compatible");
});

test("premium hero renders seller copy safely with opt-in photo-only pan controls", () => {
  const html = storePage({
    ...baseStore, theme: "p-maison-aurel", hero_title: 'A <better> & "quieter" edit',
    hero_subtitle: "Words sellers can change", hero_eyebrow: "Season <one>", hero_cta: "See & shop", hero_motion: "pan",
  }, [product]);

  assert.match(html, /<body class="th-p-maison-aurel [^"]*premium fam-maison/);
  assert.match(html, /class="hero p-hero p-maison has-hero-motion h-sp" data-hero-motion="pan"/);
  assert.match(html, /class="hero-media"/);
  assert.match(html, /data-hero-motion-control aria-pressed="false" aria-label="Pause hero motion">Pause motion/);
  assert.match(html, /A &lt;better&gt; &amp; &quot;quieter&quot; edit/);
  assert.match(html, /Season &lt;one&gt;/);
  assert.match(html, /See &amp; shop/);
  assert.match(html, /alt="Pendant &quot;No. 1&quot; &lt;limited&gt;"/);
  assert.match(html, /https:\/\/img\.test\/pendant\.jpg\?tone=warm&amp;v=1/);
  assert.doesNotMatch(html, /<better>|<one>/);
  assert.match(html, /hero\.classList\.toggle\("is-motion-paused"\)/);
  assert.match(html, /btn\.textContent=paused\?"Play motion":"Pause motion"/);
  assert.match(CSS, /\.hero\.has-hero-motion \.hero-media/);
  assert.match(CSS, /@media\(prefers-reduced-motion:reduce\)\{\.trk,\.hero \.hero-media\{animation:none!important;transform:none!important\}/);
});

test("saved still wins over a premium theme's suggested motion and blank fields retain the legacy copy fallback", () => {
  const html = storePage({ ...baseStore, theme: "p-maison-aurel", hero_motion: "still", hero_title: "", hero_subtitle: "", hero_eyebrow: "", hero_cta: "" }, [product]);
  // The page-wide motion script remains in the document; only the still hero itself must omit motion state and controls.
  assert.doesNotMatch(html, /<section class="hero[^>]*(?:has-hero-motion|data-hero-motion)=/);
  assert.doesNotMatch(html, /<button[^>]*data-hero-motion-control/);
  assert.match(html, /<h1>Old storefront heading<\/h1>/);
  assert.match(html, /A considered note about the collection\./);
  assert.match(html, /The considered edit/);
  assert.match(html, />Explore pieces<\/a>/);
});

test("all six existing hero shapes have a stable no-photo fallback", () => {
  const noImage = { ...product, image_url: "", alt_text: "" };
  for (const hero of ["overlay", "split", "collage", "editorial", "type", "spotlight"]) {
    const t = THEMES.find((candidate) => candidate.hero === hero);
    assert.ok(t, hero);
    const html = storePage({ ...baseStore, theme: t.id }, [noImage]);
    assert.doesNotMatch(html, /undefined|null/);
    if (hero === "type") assert.match(html, /class="hero h-ty/);
    else assert.match(html, /class="hero h-plain/);
  }
});
