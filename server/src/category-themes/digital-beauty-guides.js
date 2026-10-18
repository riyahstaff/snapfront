import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-beauty-guides",
  "name": "RITUAL NOTES",
  "category": "Beauty & styling tutorials",
  "group": "digital",
  "vibe": "Mirror composition, expressive typography and cinematic optional hero motion",
  "display": "Bodoni Moda",
  "body": "Manrope",
  "colors": {
    "bg": "#F2E6E9",
    "surface": "#FFFCF6",
    "ink": "#482B3E",
    "muted": "#625F5B",
    "line": "#CDC8BF",
    "accent": "#93496D",
    "onAccent": "#FFFFFF",
    "panel": "#F2E6E9",
    "onPanel": "#482B3E",
    "foot": "#482B3E",
    "onFoot": "#F2E6E9",
    "bar": "#F2E6E9",
    "onBar": "#482B3E",
    "badge": "#93496D",
    "onBadge": "#FFFFFF"
  },
  "motion": "pan",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Beauty & styling tutorials",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "Discover your own kind of glow.",
    "subtitle": "Beauty lessons, styling guides and personal-care journals."
  }
}, "mirror", ".dg-grid{grid-template-columns:1fr 1fr}.dg-image{grid-column:1;grid-row:1;border-radius:50% 50% 45% 45%;border:12px double var(--accent);height:580px}.dg-copy{grid-column:2;grid-row:1;text-align:center}.dg-side{grid-column:1/-1;text-align:center}");
export const { theme, hero, discovery, css } = module;
