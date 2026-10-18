import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-productivity",
  "name": "DAY / SYSTEM",
  "category": "Productivity & digital planners",
  "group": "digital",
  "vibe": "Dashboard composition, expressive typography and cinematic optional hero motion",
  "display": "Space Grotesk",
  "body": "Manrope",
  "colors": {
    "bg": "#F0F0EB",
    "surface": "#FFFCF6",
    "ink": "#242A32",
    "muted": "#625F5B",
    "line": "#CDC8BF",
    "accent": "#435EAF",
    "onAccent": "#FFFFFF",
    "panel": "#F0F0EB",
    "onPanel": "#242A32",
    "foot": "#242A32",
    "onFoot": "#F0F0EB",
    "bar": "#F0F0EB",
    "onBar": "#242A32",
    "badge": "#435EAF",
    "onBadge": "#FFFFFF"
  },
  "motion": "drift",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Productivity & digital planners",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "Create space for what matters.",
    "subtitle": "Digital planners, workflow templates and tools for a more intentional day."
  }
}, "dashboard", ".dg-grid{grid-template-columns:1fr 1fr}.dg-image{border-radius:20px;border:12px solid var(--surface);box-shadow:0 18px 65px #0002}.dg-side{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.dg-side a{background:var(--surface);padding:20px;border-radius:12px}");
export const { theme, hero, discovery, css } = module;
