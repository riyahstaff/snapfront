import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-baking",
  "name": "Butter & Fold",
  "category": "Baking tutorials",
  "group": "digital",
  "vibe": "Arch composition, expressive typography and cinematic optional hero motion",
  "display": "Fraunces",
  "body": "Manrope",
  "colors": {
    "bg": "#FFF5ED",
    "surface": "#FFFCF6",
    "ink": "#513225",
    "muted": "#625F5B",
    "line": "#CDC8BF",
    "accent": "#A6483F",
    "onAccent": "#FFFFFF",
    "panel": "#FFF5ED",
    "onPanel": "#513225",
    "foot": "#513225",
    "onFoot": "#FFF5ED",
    "bar": "#FFF5ED",
    "onBar": "#513225",
    "badge": "#A6483F",
    "onBadge": "#FFFFFF"
  },
  "motion": "drift",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Baking tutorials",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "A little flour. A little wonder.",
    "subtitle": "Thoughtful baking guides, pastry lessons and recipes to keep."
  }
}, "arch", ".dg-grid{grid-template-columns:1fr 1.1fr}.dg-copy{text-align:center}.dg-image{border-radius:48% 48% 0 0}.dg-side{grid-column:1/-1;text-align:center;border-top:1px solid var(--line);padding-top:20px}");
export const { theme, hero, discovery, css } = module;
