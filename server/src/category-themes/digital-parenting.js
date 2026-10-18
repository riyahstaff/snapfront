import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-parenting",
  "name": "Little Chapters",
  "category": "Parenting & family guides",
  "group": "digital",
  "vibe": "Scrapbook composition, expressive typography and cinematic optional hero motion",
  "display": "Fraunces",
  "body": "Manrope",
  "colors": {
    "bg": "#F1EDE8",
    "surface": "#FFFCF6",
    "ink": "#49374B",
    "muted": "#625F5B",
    "line": "#CDC8BF",
    "accent": "#8E5473",
    "onAccent": "#FFFFFF",
    "panel": "#F1EDE8",
    "onPanel": "#49374B",
    "foot": "#49374B",
    "onFoot": "#F1EDE8",
    "bar": "#F1EDE8",
    "onBar": "#49374B",
    "badge": "#8E5473",
    "onBadge": "#FFFFFF"
  },
  "motion": "pan",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Parenting & family guides",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "For all the little firsts.",
    "subtitle": "Family planners, activity guides and thoughtful parenting resources."
  }
}, "scrapbook", ".dg-grid{grid-template-columns:1fr 1fr}.dg-image{border:20px solid var(--surface);transform:rotate(-5deg);border-radius:3px;box-shadow:0 15px 50px #0002}.dg-copy{padding-left:30px}.dg-side{grid-column:1/-1;text-align:center;font-size:23px;font-family:var(--display)}");
export const { theme, hero, discovery, css } = module;
