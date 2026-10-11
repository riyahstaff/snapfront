// Storefront themes. Each one sets colours and fonts, plus the shape of the page:
//   header  bar | center | block        hero   left | center | banner | split
//   card    border | shadow | flat | frame | pop | glow | pastel
//   price   badge (chip on the photo) | inline (under the title)
//   ratio   photo shape, radius for cards/buttons, upper = capitals for titles and buttons
// Colours are fixed per theme (a store's look shouldn't flip with the visitor's phone),
// except Classic, which follows the visitor's light or dark setting like the app does.

const T = (o) => o;
export const THEMES = [
  T({ id: "classic", name: "Classic", for: "Anything", vibe: "Clean and confident, the Snapfront look",
    fonts: { display: ["Bricolage Grotesque", "opsz,wght@12..96,800", 800, "-.03em"], body: ["Figtree", "wght@400;600;700"] },
    c: { bg: "#F2F3F7", surface: "#FFFFFF", ink: "#16152E", muted: "#5D5F78", line: "#D6D9E5", accent: "#2C47F5", onAccent: "#FFFFFF", badge: "#FFD84A", onBadge: "#16152E" },
    darkC: { bg: "#0F0F1C", surface: "#191A2B", ink: "#EEEEF7", muted: "#A3A5BE", line: "#2F3149", accent: "#7C8CFF", onAccent: "#0F0F1C", badge: "#FFD84A", onBadge: "#16152E" },
    header: "bar", hero: "left", card: "border", price: "badge", ratio: "1/1", rCard: 16, rBtn: 999, corners: true }),

  T({ id: "atelier", name: "Atelier", for: "Fashion and jewelry", vibe: "Quiet luxury: white space, fine serif, tall photos",
    fonts: { display: ["Cormorant Garamond", "wght@500;600", 500, "0"], body: ["Jost", "wght@400;500"] },
    c: { bg: "#FFFFFF", surface: "#F6F4F1", ink: "#1C1A17", muted: "#6E6860", line: "#E6E1DA", accent: "#1C1A17", onAccent: "#FFFFFF", badge: "#1C1A17", onBadge: "#FFFFFF" },
    header: "center", hero: "center", card: "flat", price: "inline", ratio: "4/5", rCard: 0, rBtn: 0, upper: "buttons", heroScale: 1.25, ts: 1.2 }),

  T({ id: "noir", name: "Noir", for: "Luxury and fragrance", vibe: "Black and gold, framed like a gallery",
    fonts: { display: ["Playfair Display", "ital,wght@0,600;1,500", 600, "-.01em"], body: ["Raleway", "wght@400;600"] },
    c: { bg: "#0F0E0D", surface: "#181614", ink: "#F1ECE4", muted: "#A79F94", line: "#2E2A26", accent: "#C9A86A", onAccent: "#14110D", badge: "#C9A86A", onBadge: "#14110D" },
    dark: true, header: "center", hero: "center", card: "frame", price: "inline", ratio: "4/5", rCard: 0, rBtn: 0, upper: "buttons", italicHero: true }),

  T({ id: "citrus", name: "Citrus Pop", for: "Snacks, gifts and fun stuff", vibe: "Loud orange, chunky cards with hard shadows",
    fonts: { display: ["Syne", "wght@700;800", 800, "-.02em"], body: ["DM Sans", "wght@400;500;700"] },
    c: { bg: "#FFF3D6", surface: "#FFFFFF", ink: "#1A1A1A", muted: "#5E5648", line: "#1A1A1A", accent: "#FF4F1F", onAccent: "#FFFFFF", badge: "#B8F34A", onBadge: "#1A1A1A", panel: "#B8F34A", onPanel: "#1A1A1A" },
    header: "block", hero: "banner", card: "pop", price: "badge", ratio: "1/1", rCard: 18, rBtn: 999, ts: 0.85 }),

  T({ id: "bloom", name: "Bloom", for: "Beauty, skincare and flowers", vibe: "Blush pink, soft shadows, rounded and gentle",
    fonts: { display: ["Fraunces", "opsz,wght@9..144,600", 600, "-.02em"], body: ["Nunito Sans", "wght@400;600;700"] },
    c: { bg: "#FFF4F5", surface: "#FFFFFF", ink: "#3A1D2B", muted: "#875F70", line: "#F3D9E1", accent: "#C92A6B", onAccent: "#FFFFFF", badge: "#FFE0EA", onBadge: "#3A1D2B" },
    header: "center", hero: "center", card: "shadow", price: "badge", ratio: "4/5", rCard: 22, rBtn: 999 }),

  T({ id: "studio", name: "Studio", for: "Design objects and accessories", vibe: "Gallery white, hairlines, one electric blue",
    fonts: { display: ["Space Grotesk", "wght@500;700", 700, "-.035em"], body: ["IBM Plex Sans", "wght@400;500;600"] },
    c: { bg: "#FFFFFF", surface: "#FFFFFF", ink: "#111111", muted: "#666666", line: "#E4E4E4", accent: "#2F5BFF", onAccent: "#FFFFFF", badge: "#111111", onBadge: "#FFFFFF" },
    header: "bar", hero: "split", card: "border", price: "inline", ratio: "1/1", rCard: 0, rBtn: 0 }),

  T({ id: "grove", name: "Grove", for: "Plants, wellness and natural goods", vibe: "Sage paper, forest green, mustard tags",
    fonts: { display: ["Young Serif", "wght@400", 400, "-.01em"], body: ["Work Sans", "wght@400;500;600"] },
    c: { bg: "#EEF0E6", surface: "#F8F9F3", ink: "#1E2A1E", muted: "#56644F", line: "#D3D9C7", accent: "#2F6B3F", onAccent: "#FFFFFF", badge: "#E7C54A", onBadge: "#1E2A1E", panel: "#2F6B3F", onPanel: "#F8F9F3" },
    header: "bar", hero: "banner", card: "border", price: "badge", ratio: "4/5", rCard: 14, rBtn: 999 }),

  T({ id: "arcade", name: "Arcade", for: "Gaming, LED and gadgets", vibe: "Midnight violet, cyan glow, magenta tags",
    fonts: { display: ["Chakra Petch", "wght@600;700", 700, "0"], body: ["Rubik", "wght@400;500;700"] },
    c: { bg: "#0B0A1A", surface: "#15132B", ink: "#EDEBFF", muted: "#9C97C9", line: "#2A2650", accent: "#22D3EE", onAccent: "#04131A", badge: "#F472D0", onBadge: "#19041A" },
    dark: true, header: "bar", hero: "left", card: "glow", price: "badge", ratio: "1/1", rCard: 6, rBtn: 6, upper: "titles" }),

  T({ id: "market", name: "Sunday Market", for: "Food, bakery and local crafts", vibe: "Tomato red, navy, sunny price tags",
    fonts: { display: ["Lilita One", "wght@400", 400, "0"], body: ["Outfit", "wght@400;500;700"] },
    c: { bg: "#FFFFFF", surface: "#FFF1E6", ink: "#1F2A44", muted: "#5A6378", line: "#F1D9C6", accent: "#D62F3D", onAccent: "#FFFFFF", badge: "#FFD166", onBadge: "#1F2A44" },
    header: "block", hero: "center", card: "shadow", price: "badge", ratio: "1/1", rCard: 20, rBtn: 999, ts: 1.05 }),

  T({ id: "coastal", name: "Coastal", for: "Swim, home and travel", vibe: "Sea teal and navy, light and airy",
    fonts: { display: ["DM Serif Display", "wght@400", 400, "-.01em"], body: ["Karla", "wght@400;500;700"] },
    c: { bg: "#F4F9FB", surface: "#FFFFFF", ink: "#0B2545", muted: "#4C6178", line: "#D6E6EE", accent: "#0B7C88", onAccent: "#FFFFFF", badge: "#0B2545", onBadge: "#FFFFFF", panel: "#DCEFF2" },
    header: "center", hero: "banner", card: "border", price: "inline", ratio: "3/4", rCard: 12, rBtn: 999 }),

  T({ id: "velvet", name: "Velvet", for: "Candles, lingerie and evening wear", vibe: "Deep plum with rose-quartz light",
    fonts: { display: ["Bodoni Moda", "opsz,wght@6..96,600", 600, "-.01em"], body: ["Lato", "wght@400;700"] },
    c: { bg: "#24102E", surface: "#311A3D", ink: "#F7EEF8", muted: "#C4AFCB", line: "#4A2D57", accent: "#F5A8C8", onAccent: "#24102E", badge: "#F5A8C8", onBadge: "#24102E" },
    dark: true, header: "center", hero: "center", card: "frame", price: "inline", ratio: "4/5", rCard: 4, rBtn: 4, upper: "buttons" }),

  T({ id: "kraft", name: "Kraft", for: "Handmade, leather and coffee", vibe: "Brown paper, slab type, photos in a mat",
    fonts: { display: ["Zilla Slab", "wght@600;700", 700, "-.01em"], body: ["Source Sans 3", "wght@400;600;700"] },
    c: { bg: "#E8D9C4", surface: "#F4EBDD", ink: "#3A2A1C", muted: "#6A5643", line: "#CDB89C", accent: "#1F5F5B", onAccent: "#FFFFFF", badge: "#A23E26", onBadge: "#FFFFFF" },
    header: "bar", hero: "left", card: "frame", price: "badge", ratio: "1/1", rCard: 6, rBtn: 6 }),

  T({ id: "candy", name: "Candy", for: "Kids, toys and sweets", vibe: "Lavender and violet, bubbly and round",
    fonts: { display: ["Fredoka", "wght@600;700", 700, "-.01em"], body: ["Nunito", "wght@400;600;800"] },
    c: { bg: "#F6F1FF", surface: "#FFFFFF", ink: "#2B1B4A", muted: "#6E5F8E", line: "#E5DBFA", accent: "#6B3DF5", onAccent: "#FFFFFF", badge: "#FFC1DF", onBadge: "#2B1B4A", panel: "#E9DEFF" },
    header: "center", hero: "banner", card: "shadow", price: "badge", ratio: "1/1", rCard: 28, rBtn: 999 }),

  T({ id: "editorial", name: "Editorial", for: "Books, prints and zines", vibe: "Magazine black and white with one red",
    fonts: { display: ["Instrument Serif", "ital@0;1", 400, "-.02em"], body: ["Inter Tight", "wght@400;500;600"] },
    c: { bg: "#FFFFFF", surface: "#FFFFFF", ink: "#0A0A0A", muted: "#5C5C5C", line: "#0A0A0A", accent: "#D90429", onAccent: "#FFFFFF", badge: "#0A0A0A", onBadge: "#FFFFFF" },
    header: "center", hero: "split", card: "flat", price: "inline", ratio: "3/4", rCard: 0, rBtn: 0, heroScale: 1.3, rules: true, ts: 1.15 }),

  T({ id: "street", name: "Street", for: "Streetwear and sneakers", vibe: "Concrete grey, giant capitals, yellow tags",
    fonts: { display: ["Anton", "wght@400", 400, ".01em"], body: ["Barlow", "wght@400;500;700"] },
    c: { bg: "#EDEDEA", surface: "#FFFFFF", ink: "#0E0E0E", muted: "#55554F", line: "#CFCFCB", accent: "#0E0E0E", onAccent: "#FFFFFF", badge: "#FFE500", onBadge: "#0E0E0E" },
    header: "bar", hero: "split", card: "flat", price: "badge", ratio: "4/5", rCard: 0, rBtn: 0, upper: "all", heroScale: 1.5, ts: 1.15 }),

  T({ id: "sahara", name: "Sahara", for: "Home, ceramics and textiles", vibe: "Warm sand with indigo and saffron",
    fonts: { display: ["Marcellus", "wght@400", 400, ".01em"], body: ["Mulish", "wght@400;600;700"] },
    c: { bg: "#F1E4D3", surface: "#FAF3EA", ink: "#2E2117", muted: "#725E4D", line: "#E0CBB2", accent: "#2B3A67", onAccent: "#FFFFFF", badge: "#E9B44C", onBadge: "#2E2117" },
    header: "center", hero: "center", card: "border", price: "badge", ratio: "4/5", rCard: 10, rBtn: 999 }),

  T({ id: "orbit", name: "Orbit", for: "Tech and electronics", vibe: "Deep navy, electric blue, mint highlights",
    fonts: { display: ["Sora", "wght@600;700", 700, "-.03em"], body: ["Manrope", "wght@400;500;700"] },
    c: { bg: "#0A1020", surface: "#121A2E", ink: "#E8EEFF", muted: "#8D9AC0", line: "#23304F", accent: "#5B8CFF", onAccent: "#FFFFFF", badge: "#2EE6A8", onBadge: "#04130D", panel: "#1A2A5E", onPanel: "#E8EEFF" },
    dark: true, header: "bar", hero: "banner", card: "border", price: "badge", ratio: "1/1", rCard: 16, rBtn: 999 }),

  T({ id: "sorbet", name: "Sorbet", for: "Stationery and accessories", vibe: "A different pastel behind every product",
    fonts: { display: ["Baloo 2", "wght@600;800", 800, "-.02em"], body: ["Quicksand", "wght@500;600;700"] },
    c: { bg: "#F2FBF7", surface: "#FFFFFF", ink: "#2D3142", muted: "#5D6278", line: "#D9E7E1", accent: "#E5486B", onAccent: "#FFFFFF", badge: "#2D3142", onBadge: "#FFFFFF" },
    header: "center", hero: "center", card: "pastel", price: "badge", ratio: "1/1", rCard: 24, rBtn: 999 }),

  T({ id: "heritage", name: "Heritage", for: "Menswear and leather goods", vibe: "Stone, bottle green and oxblood, engraved capitals",
    fonts: { display: ["Cinzel", "wght@600;700", 600, ".04em"], body: ["Lora", "wght@400;600"] },
    c: { bg: "#EFEDE6", surface: "#F8F7F2", ink: "#1B2A21", muted: "#59645B", line: "#D2CEC2", accent: "#1B2A21", onAccent: "#F8F7F2", badge: "#7E2633", onBadge: "#FFFFFF" },
    header: "center", hero: "center", card: "frame", price: "badge", ratio: "4/5", rCard: 0, rBtn: 0, upper: "buttons", rules: true, ts: 0.9 }),

  T({ id: "volt", name: "Volt", for: "Fitness and sportswear", vibe: "Black panels, volt-yellow type, built for speed",
    fonts: { display: ["Bebas Neue", "wght@400", 400, ".02em"], body: ["Archivo", "wght@400;500;700"] },
    c: { bg: "#F4F4F1", surface: "#FFFFFF", ink: "#0D0D0D", muted: "#57574F", line: "#DADAD4", accent: "#0D0D0D", onAccent: "#E4FF3A", badge: "#E4FF3A", onBadge: "#0D0D0D", panel: "#0D0D0D", onPanel: "#E4FF3A" },
    header: "block", hero: "banner", card: "border", price: "badge", ratio: "1/1", rCard: 4, rBtn: 4, upper: "all", heroScale: 1.6, ts: 1.3 }),
];

export const THEME_IDS = new Set(THEMES.map((t) => t.id));
export const themeOf = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

/** What the app shows in the theme picker. */
export const publicThemes = () => THEMES.map((t) => ({
  id: t.id, name: t.name, for: t.for, vibe: t.vibe, dark: Boolean(t.dark),
  fonts: { display: t.fonts.display[0], body: t.fonts.body[0] },
  colors: { bg: t.c.bg, surface: t.c.surface, ink: t.c.ink, muted: t.c.muted, accent: t.c.accent, onAccent: t.c.onAccent, badge: t.c.badge, onBadge: t.c.onBadge, line: t.c.line },
  shape: { radius: t.rCard, button: t.rBtn, ratio: t.ratio, card: t.card, header: t.header },
}));

const stack = (family, kind) => `"${family}",${kind === "serif" ? "Georgia,'Times New Roman',serif" : "system-ui,-apple-system,'Segoe UI',sans-serif"}`;
const SERIFS = /Garamond|Playfair|Fraunces|Young Serif|DM Serif|Bodoni|Zilla|Instrument Serif|Marcellus|Cinzel|Lora/;

export function fontsUrl(t) {
  const fam = (f) => `family=${f[0].replace(/ /g, "+")}:${f[1]}`;
  const list = [t.fonts.display, ...(t.fonts.body[0] === t.fonts.display[0] ? [] : [t.fonts.body])];
  return `https://fonts.googleapis.com/css2?${list.map(fam).join("&")}&display=swap`;
}

function vars(c) {
  return `--bg:${c.bg};--surface:${c.surface};--ink:${c.ink};--muted:${c.muted};--line:${c.line};--accent:${c.accent};--on-accent:${c.onAccent};` +
    `--badge:${c.badge};--on-badge:${c.onBadge};--panel:${c.panel || c.surface};--on-panel:${c.onPanel || c.ink}`;
}

/** The theme's :root variables (and Classic's dark mode). */
export function themeCss(t) {
  const [dFam, , dW, dTrack] = t.fonts.display;
  const bFam = t.fonts.body[0];
  const shape = `--display:${stack(dFam, SERIFS.test(dFam) ? "serif" : "sans")};--body:${stack(bFam, SERIFS.test(bFam) ? "serif" : "sans")};` +
    `--dw:${dW};--dt:${dTrack};--r-card:${t.rCard}px;--r-btn:${t.rBtn}px;--r-in:${Math.min(t.rCard, 12)}px;--ratio:${t.ratio};--hero:${t.heroScale || 1};--ts:${t.ts || 1};--r-chip:${t.rCard >= 20 ? 999 : Math.min(t.rBtn, 6)}px`;
  const danger = t.dark ? "#FF8A7A" : "#B02E23", good = t.dark ? "#5ED39A" : "#157049";
  let css = `:root{${vars(t.c)};${shape};--danger:${danger};--good:${good}${t.dark ? ";color-scheme:dark" : ""}}`;
  if (t.darkC) css += `@media(prefers-color-scheme:dark){:root{${vars(t.darkC)};--danger:#FF7A6B;--good:#4CC88C;color-scheme:dark}}`;
  return css;
}

/** Classes on <body> that switch the page's structure. */
export const bodyClass = (t) => [`th-${t.id}`, `hd-${t.header}`, `hero-${t.hero}`, `cd-${t.card}`, `pr-${t.price}`,
  t.upper ? `up-${t.upper}` : "", t.corners ? "corners" : "", t.italicHero ? "ital" : "", t.rules ? "rules" : ""].filter(Boolean).join(" ");
