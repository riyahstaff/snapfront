import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-travel",
  "name": "ELSEWHERE ATLAS",
  "category": "Travel & destination guides",
  "group": "digital",
  "vibe": "Atlas composition, expressive typography and cinematic optional hero motion",
  "display": "DM Serif Display",
  "body": "Manrope",
  "colors": {
    "bg": "#EEE9DD",
    "surface": "#FFFCF6",
    "ink": "#203D47",
    "muted": "#625F5B",
    "line": "#CDC8BF",
    "accent": "#B75539",
    "onAccent": "#FFFFFF",
    "panel": "#EEE9DD",
    "onPanel": "#203D47",
    "foot": "#203D47",
    "onFoot": "#EEE9DD",
    "bar": "#EEE9DD",
    "onBar": "#203D47",
    "badge": "#B75539",
    "onBadge": "#FFFFFF"
  },
  "motion": "pan",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Travel & destination guides",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "Go beyond the usual.",
    "subtitle": "City guides, destination notes and itineraries for curious travelers."
  }
}, "atlas", ".dg-grid{grid-template-columns:1fr 1.3fr}.dg-image{height:560px;border-radius:160px 0 0 0}.dg-side{grid-column:1/-1;display:flex;gap:40px;border-block:1px dashed var(--ink);padding:18px}.dg-copy{border-left:1px solid var(--ink);padding-left:25px}");
export const { theme, hero, discovery, css } = module;
