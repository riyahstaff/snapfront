import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-cooking",
  "name": "Supper School",
  "category": "Cooking & recipe ebooks",
  "group": "digital",
  "vibe": "Recipe composition, expressive typography and cinematic optional hero motion",
  "display": "Young Serif",
  "body": "Manrope",
  "colors": {
    "bg": "#F5F0DF",
    "surface": "#FFFCF6",
    "ink": "#24382A",
    "muted": "#625F5B",
    "line": "#CDC8BF",
    "accent": "#C04F2B",
    "onAccent": "#FFFFFF",
    "panel": "#F5F0DF",
    "onPanel": "#24382A",
    "foot": "#24382A",
    "onFoot": "#F5F0DF",
    "bar": "#F5F0DF",
    "onBar": "#24382A",
    "badge": "#C04F2B",
    "onBadge": "#FFFFFF"
  },
  "motion": "pan",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Cooking & recipe ebooks",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "Make something worth sharing.",
    "subtitle": "Recipes, kitchen lessons and everyday inspiration for your next great meal."
  }
}, "recipe", ".dg-grid{grid-template-columns:1.05fr 1fr .32fr}.dg-image{border-radius:50% 50% 12px 12px}.dg-side{writing-mode:vertical-rl;justify-self:center}");
export const { theme, hero, discovery, css } = module;
