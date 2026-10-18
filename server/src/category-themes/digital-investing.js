import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-investing",
  "name": "LONG VIEW",
  "category": "Investing education",
  "group": "digital",
  "vibe": "Horizon composition, expressive typography and cinematic optional hero motion",
  "display": "Manrope",
  "body": "Manrope",
  "colors": {
    "bg": "#142825",
    "surface": "#202C2E",
    "ink": "#F5F0E2",
    "muted": "#C5CBC7",
    "line": "#536260",
    "accent": "#DBB97B",
    "onAccent": "#16221E",
    "panel": "#142825",
    "onPanel": "#F5F0E2",
    "foot": "#0B1213",
    "onFoot": "#F5F0E2",
    "bar": "#142825",
    "onBar": "#F5F0E2",
    "badge": "#DBB97B",
    "onBadge": "#17201B"
  },
  "motion": "drift",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Investing education",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "Think beyond the next headline.",
    "subtitle": "Research frameworks and investing education for a more informed perspective."
  }
}, "horizon", ".dg-grid{grid-template-columns:1fr 1fr}.dg-copy{grid-column:1/-1;max-width:900px}.dg-image{grid-column:1/-1;height:300px}.dg-side{position:absolute;right:7%;top:65px;max-width:180px}.dg-copy h1{max-width:12ch}");
export const { theme, hero, discovery, css } = module;
