import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-photography",
  "name": "AFTER / LIGHT",
  "category": "Photography & presets",
  "group": "digital",
  "vibe": "Contact composition, expressive typography and cinematic optional hero motion",
  "display": "Space Grotesk",
  "body": "Manrope",
  "colors": {
    "bg": "#161617",
    "surface": "#202C2E",
    "ink": "#F5F2EC",
    "muted": "#C5CBC7",
    "line": "#536260",
    "accent": "#D8AE7F",
    "onAccent": "#16221E",
    "panel": "#161617",
    "onPanel": "#F5F2EC",
    "foot": "#0B1213",
    "onFoot": "#F5F2EC",
    "bar": "#161617",
    "onBar": "#F5F2EC",
    "badge": "#D8AE7F",
    "onBadge": "#17201B"
  },
  "motion": "drift",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Photography & presets",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "See the ordinary differently.",
    "subtitle": "Photography lessons, editing presets and field notes for your creative eye."
  }
}, "contact", ".dg-grid{grid-template-columns:.8fr 1.5fr}.dg-image{border:18px solid var(--surface);height:520px}.dg-side{grid-column:1/-1;display:flex;gap:20px;font-family:monospace}.dg-copy h1{font-size:clamp(46px,5vw,76px)}");
export const { theme, hero, discovery, css } = module;
