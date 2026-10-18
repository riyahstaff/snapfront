import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-lifestyle",
  "name": "The Sunday Edit",
  "category": "Lifestyle guides",
  "group": "digital",
  "vibe": "Magazine composition, expressive typography and cinematic optional hero motion",
  "display": "Instrument Serif",
  "body": "Manrope",
  "colors": {
    "bg": "#F9F0E9",
    "surface": "#FFFCF6",
    "ink": "#503E38",
    "muted": "#625F5B",
    "line": "#CDC8BF",
    "accent": "#AC5949",
    "onAccent": "#FFFFFF",
    "panel": "#F9F0E9",
    "onPanel": "#503E38",
    "foot": "#503E38",
    "onFoot": "#F9F0E9",
    "bar": "#F9F0E9",
    "onBar": "#503E38",
    "badge": "#AC5949",
    "onBadge": "#FFFFFF"
  },
  "motion": "drift",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Lifestyle guides",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "Make room for a life you love.",
    "subtitle": "Considered guides, rituals and inspiration for everyday living."
  }
}, "magazine", ".dg-grid{grid-template-columns:1.3fr 1fr}.dg-copy{grid-column:1/-1;text-align:center;max-width:1100px;margin:auto}.dg-image{height:360px}.dg-side{font-family:var(--display);font-size:28px;padding:36px;border-left:1px solid var(--line)}");
export const { theme, hero, discovery, css } = module;
