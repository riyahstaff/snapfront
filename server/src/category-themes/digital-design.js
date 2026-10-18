import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-design",
  "name": "SHAPE LIBRARY",
  "category": "Design assets & templates",
  "group": "digital",
  "vibe": "Canvas composition, expressive typography and cinematic optional hero motion",
  "display": "Syne",
  "body": "Manrope",
  "colors": {
    "bg": "#EFEAFD",
    "surface": "#FFFCF6",
    "ink": "#302458",
    "muted": "#625F5B",
    "line": "#CDC8BF",
    "accent": "#6245C5",
    "onAccent": "#FFFFFF",
    "panel": "#EFEAFD",
    "onPanel": "#302458",
    "foot": "#302458",
    "onFoot": "#EFEAFD",
    "bar": "#EFEAFD",
    "onBar": "#302458",
    "badge": "#6245C5",
    "onBadge": "#FFFFFF"
  },
  "motion": "pan",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Design assets & templates",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "Good ideas deserve great form.",
    "subtitle": "Design resources, creative templates and visual tools for your next project."
  }
}, "canvas", ".dg-grid{grid-template-columns:1fr 1fr;gap:50px}.dg-image{border-radius:100px 0 100px 0;transform:rotate(-4deg);box-shadow:24px 24px 0 var(--accent)}.dg-copy h1{font-size:clamp(55px,7vw,108px)}.dg-side{grid-column:1/-1;text-align:right}");
export const { theme, hero, discovery, css } = module;
