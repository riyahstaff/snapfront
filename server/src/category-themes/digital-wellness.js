import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-wellness",
  "name": "STILL PRACTICE",
  "category": "Wellness & mindfulness",
  "group": "digital",
  "vibe": "Sanctuary composition, expressive typography and cinematic optional hero motion",
  "display": "Cormorant Garamond",
  "body": "Manrope",
  "colors": {
    "bg": "#E9EFE5",
    "surface": "#FFFCF6",
    "ink": "#2F493A",
    "muted": "#625F5B",
    "line": "#CDC8BF",
    "accent": "#587549",
    "onAccent": "#FFFFFF",
    "panel": "#E9EFE5",
    "onPanel": "#2F493A",
    "foot": "#2F493A",
    "onFoot": "#E9EFE5",
    "bar": "#E9EFE5",
    "onBar": "#2F493A",
    "badge": "#587549",
    "onBadge": "#FFFFFF"
  },
  "motion": "pan",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Wellness & mindfulness",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "A softer place to begin.",
    "subtitle": "Mindfulness journals and gentle resources for your daily practice."
  }
}, "sanctuary", ".dg-grid{grid-template-columns:1fr 1fr;gap:8vw}.dg-image{grid-column:1;grid-row:1;border-radius:50% 50% 0 0;height:580px}.dg-copy{grid-column:2;grid-row:1}.dg-side{grid-column:2;border-top:1px solid var(--line);padding-top:20px}");
export const { theme, hero, discovery, css } = module;
