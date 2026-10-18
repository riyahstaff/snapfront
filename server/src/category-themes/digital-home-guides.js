import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-home-guides",
  "name": "ROOM / THEORY",
  "category": "Home & interior tutorials",
  "group": "digital",
  "vibe": "Blueprint composition, expressive typography and cinematic optional hero motion",
  "display": "Marcellus",
  "body": "Manrope",
  "colors": {
    "bg": "#EDE7DA",
    "surface": "#FFFCF6",
    "ink": "#343A30",
    "muted": "#625F5B",
    "line": "#CDC8BF",
    "accent": "#6A734D",
    "onAccent": "#FFFFFF",
    "panel": "#EDE7DA",
    "onPanel": "#343A30",
    "foot": "#343A30",
    "onFoot": "#EDE7DA",
    "bar": "#EDE7DA",
    "onBar": "#343A30",
    "badge": "#6A734D",
    "onBadge": "#FFFFFF"
  },
  "motion": "drift",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Home & interior tutorials",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "A new perspective on home.",
    "subtitle": "Room planning guides, styling lessons and practical design workbooks."
  }
}, "blueprint", ".dg-grid{grid-template-columns:1fr 1.3fr}.dg-image{height:570px;border:1px solid var(--ink);padding:12px}.dg-copy h1{font-size:clamp(42px,5vw,76px)}.dg-side{grid-column:1/-1;display:flex;justify-content:space-around;border-top:1px solid var(--ink);padding:20px}");
export const { theme, hero, discovery, css } = module;
