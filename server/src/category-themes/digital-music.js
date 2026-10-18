import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-music",
  "name": "SOUND / STUDIES",
  "category": "Music & audio resources",
  "group": "digital",
  "vibe": "Wave composition, expressive typography and cinematic optional hero motion",
  "display": "Space Grotesk",
  "body": "Manrope",
  "colors": {
    "bg": "#111724",
    "surface": "#202C2E",
    "ink": "#F4ECF7",
    "muted": "#C5CBC7",
    "line": "#536260",
    "accent": "#B8A4EF",
    "onAccent": "#16221E",
    "panel": "#111724",
    "onPanel": "#F4ECF7",
    "foot": "#0B1213",
    "onFoot": "#F4ECF7",
    "bar": "#111724",
    "onBar": "#F4ECF7",
    "badge": "#B8A4EF",
    "onBadge": "#17201B"
  },
  "motion": "drift",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Music & audio resources",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "Make room for your sound.",
    "subtitle": "Production guides, music lessons and audio resources for your studio."
  }
}, "wave", ".dg-grid{grid-template-columns:1.2fr 1fr}.dg-image{border-radius:50%;aspect-ratio:1;height:auto;border:24px solid var(--surface);box-shadow:0 0 0 1px var(--accent)}.dg-side{grid-column:1/-1;letter-spacing:.15em;border-bottom:3px solid var(--accent);padding:20px 0}");
export const { theme, hero, discovery, css } = module;
