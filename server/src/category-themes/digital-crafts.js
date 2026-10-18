import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-crafts",
  "name": "HAND / MADE",
  "category": "Crafts & DIY patterns",
  "group": "digital",
  "vibe": "Patchwork composition, expressive typography and cinematic optional hero motion",
  "display": "Fraunces",
  "body": "Manrope",
  "colors": {
    "bg": "#F3E7DE",
    "surface": "#FFFCF6",
    "ink": "#4D332C",
    "muted": "#625F5B",
    "line": "#CDC8BF",
    "accent": "#AB4D37",
    "onAccent": "#FFFFFF",
    "panel": "#F3E7DE",
    "onPanel": "#4D332C",
    "foot": "#4D332C",
    "onFoot": "#F3E7DE",
    "bar": "#F3E7DE",
    "onBar": "#4D332C",
    "badge": "#AB4D37",
    "onBadge": "#FFFFFF"
  },
  "motion": "drift",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Crafts & DIY patterns",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "Make it with your own hands.",
    "subtitle": "Craft patterns, project guides and creative tutorials for slow afternoons."
  }
}, "patchwork", ".dg-grid{grid-template-columns:1fr 1fr}.dg-image{border-radius:0 80px 0 80px;border:15px solid var(--badge)}.dg-copy{padding:30px;border:1px dashed var(--accent)}.dg-side{grid-column:1/-1;text-align:center;letter-spacing:.15em}");
export const { theme, hero, discovery, css } = module;
