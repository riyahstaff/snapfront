import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-real-estate",
  "name": "PROPERTY / FIELD",
  "category": "Real estate education",
  "group": "digital",
  "vibe": "Property composition, expressive typography and cinematic optional hero motion",
  "display": "Manrope",
  "body": "Manrope",
  "colors": {
    "bg": "#E9ECED",
    "surface": "#FFFCF6",
    "ink": "#243844",
    "muted": "#625F5B",
    "line": "#CDC8BF",
    "accent": "#285F80",
    "onAccent": "#FFFFFF",
    "panel": "#E9ECED",
    "onPanel": "#243844",
    "foot": "#243844",
    "onFoot": "#E9ECED",
    "bar": "#E9ECED",
    "onBar": "#243844",
    "badge": "#285F80",
    "onBadge": "#FFFFFF"
  },
  "motion": "pan",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Real estate education",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "A clearer view of property.",
    "subtitle": "Property research workbooks, planning templates and educational guides."
  }
}, "property", ".dg-grid{grid-template-columns:1fr 1.4fr}.dg-image{height:570px}.dg-copy{padding:30px;background:var(--surface);margin-right:-80px;z-index:2;box-shadow:0 15px 50px #0001}.dg-side{grid-column:1/-1;display:flex;gap:40px;padding:20px;border-top:2px solid var(--accent)}");
export const { theme, hero, discovery, css } = module;
