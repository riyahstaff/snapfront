import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-fitness",
  "name": "FORM / METHOD",
  "category": "Fitness & training plans",
  "group": "digital",
  "vibe": "Athletic composition, expressive typography and cinematic optional hero motion",
  "display": "Bebas Neue",
  "body": "Manrope",
  "colors": {
    "bg": "#171919",
    "surface": "#202C2E",
    "ink": "#F4F7EF",
    "muted": "#C5CBC7",
    "line": "#536260",
    "accent": "#C7F252",
    "onAccent": "#16221E",
    "panel": "#171919",
    "onPanel": "#F4F7EF",
    "foot": "#0B1213",
    "onFoot": "#F4F7EF",
    "bar": "#171919",
    "onBar": "#F4F7EF",
    "badge": "#C7F252",
    "onBadge": "#17201B"
  },
  "motion": "drift",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Fitness & training plans",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "Find your next level.",
    "subtitle": "Training plans, movement guides and tools to support your routine."
  }
}, "athletic", ".dg-grid{grid-template-columns:1.3fr 1fr}.dg-copy h1{text-transform:uppercase;font-size:clamp(70px,9vw,140px);line-height:.9}.dg-image{clip-path:polygon(15% 0,100% 0,85% 100%,0 100%);height:580px}.dg-side{grid-column:1/-1;border-top:8px solid var(--accent);padding-top:12px}");
export const { theme, hero, discovery, css } = module;
