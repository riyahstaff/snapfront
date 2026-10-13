import { PREMIUM_THEMES } from "./premium-themes.js";
import { config } from "./config.js";

// Storefront themes. A theme is a palette and a font pair plus a set of section designs:
//   header    split (logo left, menu beside it) | center (menu left, logo centred) | stack (logo above menu)
//   hero      overlay (full-width photo, text on top) | split (photo beside a colour panel) | collage (three photos)
//             | editorial (centred headline over a wide photo) | type (giant headline + product strip) | spotlight (product glowing on dark)
//   cats      circle | tile | pill (pill = category chips only, no picture tiles)
//   card      clean | boxed | minimal | bold | glass | pastel
//   announce  static | marquee (the strip above the header scrolls)
//   band      a scrolling statement band between sections
// Colours: bar = announcement strip, panel = hero colour panel, foot = footer.

const T = (o) => o;
export const THEMES = [
  T({ id: "classic", name: "Classic", for: "Anything", vibe: "Crisp and confident, the Snapfront look",
    fonts: { display: ["Bricolage Grotesque", "opsz,wght@12..96,700;12..96,800", 800, "-.035em"], body: ["Figtree", "wght@400;500;600;700"] },
    c: { bg: "#FFFFFF", surface: "#F3F4F8", ink: "#14142B", muted: "#5B5E76", line: "#E3E5EE", accent: "#2C47F5", onAccent: "#FFFFFF", badge: "#FFD84A", onBadge: "#14142B",
      panel: "#2C47F5", onPanel: "#FFFFFF", foot: "#14142B", onFoot: "#E9EAF5", bar: "#14142B", onBar: "#FFFFFF" },
    header: "split", hero: "split", cats: "circle", card: "clean", ratio: "1/1", rCard: 16, rBtn: 999 }),

  T({ id: "atelier", name: "Atelier", for: "Fashion and jewelry", vibe: "Quiet luxury: white space, fine serif, tall photos",
    fonts: { display: ["Cormorant Garamond", "ital,wght@0,500;0,600;1,500", 500, "-.01em"], body: ["Jost", "wght@400;500"] },
    c: { bg: "#FFFFFF", surface: "#F5F3EF", ink: "#111111", muted: "#6B6760", line: "#E8E4DD", accent: "#111111", onAccent: "#FFFFFF", badge: "#111111", onBadge: "#FFFFFF",
      panel: "#F5F3EF", onPanel: "#111111", foot: "#F5F3EF", onFoot: "#111111", bar: "#111111", onBar: "#FFFFFF" },
    header: "center", hero: "editorial", cats: "tile", card: "minimal", ratio: "3/4", rCard: 0, rBtn: 0, upper: "buttons", ts: 1.25, heroScale: 1.15 }),

  T({ id: "noir", name: "Noir", for: "Luxury, fragrance and chocolate", vibe: "Black and gold, lit like a boutique window",
    fonts: { display: ["Playfair Display", "ital,wght@0,500;0,600;1,500", 500, "-.01em"], body: ["Raleway", "wght@400;500;600"] },
    c: { bg: "#0E0D0C", surface: "#181614", ink: "#F3EEE6", muted: "#A39B8F", line: "#2E2A25", accent: "#C8A46A", onAccent: "#15100A", badge: "#C8A46A", onBadge: "#15100A",
      panel: "#181614", onPanel: "#F3EEE6", foot: "#080706", onFoot: "#CFC7BA", bar: "#C8A46A", onBar: "#15100A" },
    dark: true, header: "center", hero: "overlay", heroAlign: "center", cats: "circle", card: "minimal", ratio: "4/5", rCard: 0, rBtn: 0, upper: "buttons", italicHero: true }),

  T({ id: "citrus", name: "Citrus Pop", for: "Snacks, gifts and fun stuff", vibe: "Loud orange and lime, chunky cards, scrolling banners",
    fonts: { display: ["Syne", "wght@700;800", 800, "-.03em"], body: ["DM Sans", "opsz,wght@9..40,400;9..40,500;9..40,700"] },
    c: { bg: "#FFF8EC", surface: "#FFFFFF", ink: "#161616", muted: "#5A5246", line: "#161616", accent: "#FF5A1F", onAccent: "#FFFFFF", badge: "#C6F432", onBadge: "#161616",
      panel: "#FF5A1F", onPanel: "#FFFFFF", foot: "#161616", onFoot: "#FFF8EC", bar: "#C6F432", onBar: "#161616" },
    header: "split", hero: "split", cats: "pill", card: "bold", ratio: "1/1", rCard: 20, rBtn: 999, ts: 0.85, heroScale: 0.78, announce: "marquee", band: true }),

  T({ id: "bloom", name: "Bloom", for: "Beauty, skincare and flowers", vibe: "Blush tones, soft curves, big beauty photography",
    fonts: { display: ["Fraunces", "opsz,wght@9..144,500;9..144,600", 500, "-.02em"], body: ["Nunito Sans", "opsz,wght@6..12,400;6..12,600;6..12,700"] },
    c: { bg: "#FFF8F7", surface: "#FFFFFF", ink: "#3B1E2A", muted: "#8A6573", line: "#F2DFE2", accent: "#B83265", onAccent: "#FFFFFF", badge: "#FFFFFF", onBadge: "#3B1E2A",
      panel: "#F9E4E8", onPanel: "#3B1E2A", foot: "#3B1E2A", onFoot: "#FBE9EC", bar: "#F9E4E8", onBar: "#3B1E2A" },
    header: "center", hero: "split", cats: "circle", card: "clean", ratio: "4/5", rCard: 18, rBtn: 999 }),

  T({ id: "studio", name: "Studio", for: "Design objects and accessories", vibe: "Gallery white, oversized type, one electric blue",
    fonts: { display: ["Space Grotesk", "wght@500;700", 700, "-.045em"], body: ["IBM Plex Sans", "wght@400;500;600"] },
    c: { bg: "#FFFFFF", surface: "#F3F3F3", ink: "#0A0A0A", muted: "#6B6B6B", line: "#E6E6E6", accent: "#2F5BFF", onAccent: "#FFFFFF", badge: "#0A0A0A", onBadge: "#FFFFFF",
      panel: "#0A0A0A", onPanel: "#FFFFFF", foot: "#0A0A0A", onFoot: "#EDEDED", bar: "#0A0A0A", onBar: "#FFFFFF" },
    header: "split", hero: "type", cats: "pill", card: "clean", ratio: "1/1", rCard: 4, rBtn: 4 }),

  T({ id: "grove", name: "Grove", for: "Plants, wellness and natural goods", vibe: "Earthy greens, warm paper, photo-first",
    fonts: { display: ["Young Serif", "wght@400", 400, "-.015em"], body: ["Work Sans", "wght@400;500;600"] },
    c: { bg: "#F4F2EA", surface: "#FBFAF5", ink: "#1D2A1F", muted: "#5B6658", line: "#DDDCCF", accent: "#2F5D3A", onAccent: "#FFFFFF", badge: "#E5C35A", onBadge: "#1D2A1F",
      panel: "#2F5D3A", onPanel: "#F4F2EA", foot: "#1D2A1F", onFoot: "#E7E6DA", bar: "#2F5D3A", onBar: "#F4F2EA" },
    header: "split", hero: "overlay", heroAlign: "left", cats: "tile", card: "clean", ratio: "4/5", rCard: 12, rBtn: 999 }),

  T({ id: "arcade", name: "Arcade", for: "Gaming, LED and gadgets", vibe: "Midnight violet, neon cyan glow, magenta tags",
    fonts: { display: ["Chakra Petch", "wght@600;700", 700, "0"], body: ["Rubik", "wght@400;500;700"] },
    c: { bg: "#0A0918", surface: "#14122A", ink: "#EEEBFF", muted: "#9C97C9", line: "#29254F", accent: "#22D3EE", onAccent: "#04131A", badge: "#F472D0", onBadge: "#19041A",
      panel: "#14122A", onPanel: "#EEEBFF", foot: "#06050F", onFoot: "#B9B4E6", bar: "#F472D0", onBar: "#19041A" },
    dark: true, header: "split", hero: "spotlight", cats: "pill", card: "glass", ratio: "1/1", rCard: 10, rBtn: 8, upper: "titles", band: true }),

  T({ id: "market", name: "Sunday Market", for: "Food, bakery and local crafts", vibe: "Warm and friendly, tomato red and sunshine",
    fonts: { display: ["Lilita One", "wght@400", 400, ".005em"], body: ["Outfit", "wght@400;500;700"] },
    c: { bg: "#FFFBF5", surface: "#FFFFFF", ink: "#1F2A44", muted: "#5A6378", line: "#F0E2D2", accent: "#D62F3D", onAccent: "#FFFFFF", badge: "#FFD166", onBadge: "#1F2A44",
      panel: "#FFF0DD", onPanel: "#1F2A44", foot: "#1F2A44", onFoot: "#FFF0DD", bar: "#D62F3D", onBar: "#FFFFFF" },
    header: "stack", hero: "overlay", heroAlign: "center", cats: "circle", card: "boxed", ratio: "1/1", rCard: 18, rBtn: 999, ts: 1.05 }),

  T({ id: "coastal", name: "Coastal", for: "Swim, home and travel", vibe: "Sea teal and navy, airy and bright",
    fonts: { display: ["DM Serif Display", "ital@0;1", 400, "-.01em"], body: ["Karla", "wght@400;500;700"] },
    c: { bg: "#F7FBFC", surface: "#FFFFFF", ink: "#0B2545", muted: "#4C6178", line: "#D9E8EE", accent: "#0B7C88", onAccent: "#FFFFFF", badge: "#FFFFFF", onBadge: "#0B2545",
      panel: "#DCEFF2", onPanel: "#0B2545", foot: "#0B2545", onFoot: "#DCEFF2", bar: "#0B7C88", onBar: "#FFFFFF" },
    header: "center", hero: "split", cats: "tile", card: "clean", ratio: "3/4", rCard: 10, rBtn: 999 }),

  T({ id: "velvet", name: "Velvet", for: "Candles, lingerie and evening wear", vibe: "Deep plum, rose-quartz light, editorial collage",
    fonts: { display: ["Bodoni Moda", "opsz,wght@6..96,500;6..96,600", 500, "-.01em"], body: ["Lato", "wght@400;700"] },
    c: { bg: "#1E0E27", surface: "#2A1736", ink: "#F7EEF8", muted: "#C4AFCB", line: "#43294F", accent: "#F3A6C6", onAccent: "#1E0E27", badge: "#F3A6C6", onBadge: "#1E0E27",
      panel: "#2A1736", onPanel: "#F7EEF8", foot: "#150A1C", onFoot: "#D9C6DE", bar: "#F3A6C6", onBar: "#1E0E27" },
    dark: true, header: "center", hero: "collage", cats: "circle", card: "minimal", ratio: "4/5", rCard: 2, rBtn: 2, upper: "buttons" }),

  T({ id: "kraft", name: "Kraft", for: "Handmade, leather and coffee", vibe: "Brown paper, slab type, a maker's collage",
    fonts: { display: ["Zilla Slab", "wght@600;700", 700, "-.015em"], body: ["Source Sans 3", "wght@400;600;700"] },
    c: { bg: "#EFE5D6", surface: "#F8F2E8", ink: "#33261A", muted: "#6E5B48", line: "#D8C8B0", accent: "#1F5F5B", onAccent: "#FFFFFF", badge: "#A23E26", onBadge: "#FFFFFF",
      panel: "#E3D3BC", onPanel: "#33261A", foot: "#33261A", onFoot: "#EFE5D6", bar: "#1F5F5B", onBar: "#FFFFFF" },
    header: "split", hero: "collage", cats: "tile", card: "boxed", ratio: "1/1", rCard: 8, rBtn: 6 }),

  T({ id: "candy", name: "Candy", for: "Kids, toys and sweets", vibe: "Violet and bubblegum, round and bouncy",
    fonts: { display: ["Fredoka", "wght@600;700", 700, "-.01em"], body: ["Nunito", "wght@400;600;800"] },
    c: { bg: "#F7F2FF", surface: "#FFFFFF", ink: "#2B1B4A", muted: "#6E5F8E", line: "#E6DCFA", accent: "#6B3DF5", onAccent: "#FFFFFF", badge: "#FFC1DF", onBadge: "#2B1B4A",
      panel: "#6B3DF5", onPanel: "#FFFFFF", foot: "#2B1B4A", onFoot: "#EDE5FF", bar: "#FFC1DF", onBar: "#2B1B4A" },
    header: "split", hero: "split", cats: "circle", card: "boxed", ratio: "1/1", rCard: 26, rBtn: 999, announce: "marquee", band: true }),

  T({ id: "editorial", name: "Editorial", for: "Fashion, books and prints", vibe: "Magazine cover: huge serif over a full-bleed photo",
    fonts: { display: ["Instrument Serif", "ital@0;1", 400, "-.025em"], body: ["Inter Tight", "wght@400;500;600"] },
    c: { bg: "#FFFFFF", surface: "#F2F2F0", ink: "#0A0A0A", muted: "#5C5C5C", line: "#E2E2E2", accent: "#0A0A0A", onAccent: "#FFFFFF", badge: "#D90429", onBadge: "#FFFFFF",
      panel: "#F2F2F0", onPanel: "#0A0A0A", foot: "#0A0A0A", onFoot: "#EDEDED", bar: "#F2F2F0", onBar: "#0A0A0A" },
    header: "center", hero: "overlay", heroAlign: "center", cats: "tile", card: "minimal", ratio: "3/4", rCard: 0, rBtn: 0, heroScale: 1.45, ts: 1.2 }),

  T({ id: "street", name: "Street", for: "Streetwear and sneakers", vibe: "Concrete grey, giant capitals, yellow tags",
    fonts: { display: ["Anton", "wght@400", 400, ".005em"], body: ["Barlow", "wght@400;500;700"] },
    c: { bg: "#EDEDEA", surface: "#FFFFFF", ink: "#0E0E0E", muted: "#55554F", line: "#D3D3CE", accent: "#0E0E0E", onAccent: "#FFFFFF", badge: "#FFE500", onBadge: "#0E0E0E",
      panel: "#0E0E0E", onPanel: "#FFE500", foot: "#0E0E0E", onFoot: "#EDEDEA", bar: "#FFE500", onBar: "#0E0E0E" },
    header: "split", hero: "type", cats: "pill", card: "clean", ratio: "4/5", rCard: 0, rBtn: 0, upper: "all", heroScale: 1.2, ts: 1.15, announce: "marquee" }),

  T({ id: "sahara", name: "Sahara", for: "Home, ceramics and textiles", vibe: "Warm sand, indigo and saffron, calm and centred",
    fonts: { display: ["Marcellus", "wght@400", 400, ".01em"], body: ["Mulish", "wght@400;600;700"] },
    c: { bg: "#F6EEE3", surface: "#FBF6EF", ink: "#2E2117", muted: "#725E4D", line: "#E4D3BE", accent: "#2B3A67", onAccent: "#FFFFFF", badge: "#E9B44C", onBadge: "#2E2117",
      panel: "#EBDCC8", onPanel: "#2E2117", foot: "#2B3A67", onFoot: "#F4EBDF", bar: "#2B3A67", onBar: "#F4EBDF" },
    header: "center", hero: "editorial", cats: "circle", card: "clean", ratio: "4/5", rCard: 10, rBtn: 999 }),

  T({ id: "orbit", name: "Orbit", for: "Tech and electronics", vibe: "Deep navy, electric blue, products in the spotlight",
    fonts: { display: ["Sora", "wght@600;700", 700, "-.035em"], body: ["Manrope", "wght@400;500;700"] },
    c: { bg: "#090F1F", surface: "#111A2E", ink: "#E8EEFF", muted: "#8D9AC0", line: "#22304F", accent: "#5B8CFF", onAccent: "#FFFFFF", badge: "#2EE6A8", onBadge: "#04130D",
      panel: "#111A2E", onPanel: "#E8EEFF", foot: "#060A15", onFoot: "#AAB6D8", bar: "#5B8CFF", onBar: "#FFFFFF" },
    dark: true, header: "split", hero: "spotlight", cats: "tile", card: "glass", ratio: "1/1", rCard: 16, rBtn: 999 }),

  T({ id: "sorbet", name: "Sorbet", for: "Stationery and accessories", vibe: "A different pastel behind every product",
    fonts: { display: ["Baloo 2", "wght@600;800", 800, "-.025em"], body: ["Quicksand", "wght@500;600;700"] },
    c: { bg: "#FFFFFF", surface: "#F6F7FB", ink: "#2D3142", muted: "#5D6278", line: "#E7E9F0", accent: "#E5486B", onAccent: "#FFFFFF", badge: "#2D3142", onBadge: "#FFFFFF",
      panel: "#FFE1E8", onPanel: "#2D3142", foot: "#2D3142", onFoot: "#F6F7FB", bar: "#DDEFFF", onBar: "#2D3142" },
    header: "center", hero: "split", cats: "circle", card: "pastel", ratio: "1/1", rCard: 24, rBtn: 999 }),

  T({ id: "heritage", name: "Heritage", for: "Menswear and leather goods", vibe: "Stone, bottle green and oxblood, engraved capitals",
    fonts: { display: ["Cinzel", "wght@500;600", 500, ".05em"], body: ["Lora", "wght@400;500;600"] },
    c: { bg: "#F1EFE8", surface: "#F9F8F3", ink: "#1B2A21", muted: "#59645B", line: "#D6D2C6", accent: "#1B2A21", onAccent: "#F9F8F3", badge: "#7E2633", onBadge: "#FFFFFF",
      panel: "#1B2A21", onPanel: "#F1EFE8", foot: "#1B2A21", onFoot: "#D6D2C6", bar: "#1B2A21", onBar: "#F1EFE8" },
    header: "stack", hero: "collage", cats: "tile", card: "minimal", ratio: "4/5", rCard: 0, rBtn: 0, upper: "buttons", ts: 0.9, heroScale: 0.85 }),

  T({ id: "volt", name: "Volt", for: "Fitness and sportswear", vibe: "Black, volt yellow, huge condensed capitals",
    fonts: { display: ["Bebas Neue", "wght@400", 400, ".01em"], body: ["Archivo", "wght@400;500;700"] },
    c: { bg: "#0B0B0B", surface: "#161616", ink: "#F5F5F0", muted: "#A3A39A", line: "#2A2A2A", accent: "#E4FF3A", onAccent: "#0B0B0B", badge: "#E4FF3A", onBadge: "#0B0B0B",
      panel: "#161616", onPanel: "#F5F5F0", foot: "#000000", onFoot: "#BDBDB5", bar: "#E4FF3A", onBar: "#0B0B0B" },
    dark: true, header: "split", hero: "overlay", heroAlign: "left", cats: "circle", card: "boxed", ratio: "4/5", rCard: 6, rBtn: 4, upper: "all", heroScale: 1.5, ts: 1.3, announce: "marquee", band: true }),
  ...PREMIUM_THEMES,
];

export const THEME_IDS = new Set(THEMES.map((t) => t.id));
export const themeOf = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

/** What the app shows in the theme picker. */
export const publicThemes = () => THEMES.map((t) => ({
  id: t.id, name: t.name, for: t.for, vibe: t.vibe, dark: Boolean(t.dark),
  collection: t.collection || "classic", category: t.category || t.for, family: t.family || null,
  motion: t.motion || "still", copy: { eyebrow: t.copy?.eyebrow || "", collection: t.copy?.collection || "Shop all", cta: t.copy?.cta || "Shop now", ...(t.collection === "premium" ? { title: t.copy?.title || "", subtitle: t.copy?.subtitle || "" } : {}) },
  ...(t.group ? { group: t.group } : {}),
  ...(t.preview ? { preview_url: `${config.publicUrl}${t.preview}` } : {}),
  ...(t.demo ? { demo_url: `${config.publicUrl}${t.demo}` } : {}),
  fonts: { display: t.fonts.display[0], body: t.fonts.body[0] },
  colors: { bg: t.c.bg, surface: t.c.surface, ink: t.c.ink, muted: t.c.muted, accent: t.c.accent, onAccent: t.c.onAccent, badge: t.c.badge, onBadge: t.c.onBadge,
    line: t.c.line, panel: t.c.panel, onPanel: t.c.onPanel, bar: t.c.bar, onBar: t.c.onBar, foot: t.c.foot },
  shape: { radius: t.rCard, button: t.rBtn, ratio: t.ratio, card: t.card, header: t.header, hero: t.hero, upper: t.upper || null },
}));

const SERIFS = /Garamond|Cormorant Infant|Playfair|Fraunces|Young Serif|DM Serif|Bodoni|Zilla|Instrument Serif|Marcellus|Cinzel|Lora|Newsreader|Libre Baskerville/;
const stack = (family) => `"${family}",${SERIFS.test(family) ? "Georgia,'Times New Roman',serif" : "system-ui,-apple-system,'Segoe UI',sans-serif"}`;

export function fontsUrl(t) {
  const fam = (f) => `family=${f[0].replace(/ /g, "+")}:${f[1]}`;
  return `https://fonts.googleapis.com/css2?${[t.fonts.display, t.fonts.body].map(fam).join("&")}&display=swap`;
}

/** The theme's :root variables. */
export function themeCss(t) {
  const c = t.c, [dFam, , dW, dTrack] = t.fonts.display;
  const v = {
    bg: c.bg, surface: c.surface, ink: c.ink, muted: c.muted, line: c.line, accent: c.accent, "on-accent": c.onAccent, badge: c.badge, "on-badge": c.onBadge,
    panel: c.panel, "on-panel": c.onPanel, foot: c.foot, "on-foot": c.onFoot, bar: c.bar, "on-bar": c.onBar,
    danger: t.dark ? "#FF8A7A" : "#B02E23", good: t.dark ? "#5ED39A" : "#157049",
    display: stack(dFam), body: stack(t.fonts.body[0]), dw: dW, dt: dTrack,
    "r-card": `${t.rCard}px`, "r-btn": `${t.rBtn}px`, "r-in": `${Math.min(t.rCard, 12)}px`, "r-chip": `${t.rBtn >= 999 ? 999 : Math.min(t.rBtn, 6)}px`,
    ratio: t.ratio, hero: t.heroScale || 1, ts: t.ts || 1,
  };
  return `:root{${Object.entries(v).map(([k, x]) => `--${k}:${x}`).join(";")}${t.dark ? ";color-scheme:dark" : ""}}`;
}

/** Classes on <body> that switch the page's structure. */
const LIVELY = new Set(["citrus", "candy", "arcade", "volt", "street", "market", "sorbet"]);
export const bodyClass = (t) => [`th-${t.id}`, `hd-${t.header}`, `cd-${t.card}`, LIVELY.has(t.id) ? "mo-lively" : "mo-calm", t.collection === "premium" ? "premium" : "", t.family ? `fam-${t.family}` : "", t.upper ? `up-${t.upper}` : "", t.italicHero ? "ital" : "", t.dark ? "dark" : ""].filter(Boolean).join(" ");
