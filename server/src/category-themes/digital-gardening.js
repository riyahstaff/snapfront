import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-gardening",
  "name": "GROW JOURNAL",
  "category": "Gardening & nature guides",
  "group": "digital",
  "vibe": "Botanical composition, expressive typography and cinematic optional hero motion",
  "display": "Young Serif",
  "body": "Manrope",
  "colors": {
    "bg": "#EEF0DB",
    "surface": "#FFFCF6",
    "ink": "#2C4332",
    "muted": "#625F5B",
    "line": "#CDC8BF",
    "accent": "#5E7133",
    "onAccent": "#FFFFFF",
    "panel": "#EEF0DB",
    "onPanel": "#2C4332",
    "foot": "#2C4332",
    "onFoot": "#EEF0DB",
    "bar": "#EEF0DB",
    "onBar": "#2C4332",
    "badge": "#5E7133",
    "onBadge": "#FFFFFF"
  },
  "motion": "pan",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Gardening & nature guides",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "Good things take growing.",
    "subtitle": "Plant journals, seasonal guides and gardening lessons for every space."
  }
}, "botanical", ".dg-grid{grid-template-columns:1.2fr .8fr}.dg-copy{grid-column:1;grid-row:1}.dg-image{border-radius:50% 0 50% 0;height:560px}.dg-side{grid-column:1/-1;display:flex;gap:30px;padding:20px;background:var(--surface)}");
export const { theme, hero, discovery, css } = module;
