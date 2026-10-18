import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-education",
  "name": "BRIGHT NOTES",
  "category": "Education & study resources",
  "group": "digital",
  "vibe": "Notebook composition, expressive typography and cinematic optional hero motion",
  "display": "Bricolage Grotesque",
  "body": "Manrope",
  "colors": {
    "bg": "#FFF6DD",
    "surface": "#FFFCF6",
    "ink": "#33314B",
    "muted": "#625F5B",
    "line": "#CDC8BF",
    "accent": "#5754A0",
    "onAccent": "#FFFFFF",
    "panel": "#FFF6DD",
    "onPanel": "#33314B",
    "foot": "#33314B",
    "onFoot": "#FFF6DD",
    "bar": "#FFF6DD",
    "onBar": "#33314B",
    "badge": "#5754A0",
    "onBadge": "#FFFFFF"
  },
  "motion": "drift",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Education & study resources",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "Small lessons. Big discoveries.",
    "subtitle": "Study guides, learning activities and printable classroom resources."
  }
}, "notebook", ".dg-grid{grid-template-columns:1.2fr .85fr}.dg-copy{background:repeating-linear-gradient(transparent 0 39px,var(--line) 40px);padding:30px}.dg-image{border-radius:30px;transform:rotate(4deg)}.dg-side{grid-column:1/-1;display:flex;gap:15px}.dg-side a{border-radius:99px;background:var(--badge);padding:12px 22px}");
export const { theme, hero, discovery, css } = module;
