import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-gaming-guides",
  "name": "LEVEL / LAB",
  "category": "Gaming guides & creator resources",
  "group": "digital",
  "vibe": "Portal composition, expressive typography and cinematic optional hero motion",
  "display": "Chakra Petch",
  "body": "Manrope",
  "colors": {
    "bg": "#141327",
    "surface": "#202C2E",
    "ink": "#F0ECFF",
    "muted": "#C5CBC7",
    "line": "#536260",
    "accent": "#B4F276",
    "onAccent": "#16221E",
    "panel": "#141327",
    "onPanel": "#F0ECFF",
    "foot": "#0B1213",
    "onFoot": "#F0ECFF",
    "bar": "#141327",
    "onBar": "#F0ECFF",
    "badge": "#B4F276",
    "onBadge": "#17201B"
  },
  "motion": "pan",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Gaming guides & creator resources",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "Make your next move count.",
    "subtitle": "Strategy guides, creator resources and learning tools for your next session."
  }
}, "portal", ".dg-grid{grid-template-columns:1.2fr 1fr}.dg-image{border-radius:35% 35% 8px 8px;box-shadow:0 0 70px color-mix(in srgb,var(--accent) 20%,transparent);border:2px solid var(--accent)}.dg-copy h1{text-transform:uppercase}.dg-side{grid-column:1/-1;border-block:1px solid var(--accent);padding:18px;display:flex;gap:30px}");
export const { theme, hero, discovery, css } = module;
