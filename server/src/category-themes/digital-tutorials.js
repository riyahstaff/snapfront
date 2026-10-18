import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-tutorials",
  "name": "NEXT / LESSON",
  "category": "Tutorials & online learning",
  "group": "digital",
  "vibe": "Lesson composition, expressive typography and cinematic optional hero motion",
  "display": "Space Grotesk",
  "body": "Manrope",
  "colors": {
    "bg": "#EBEFED",
    "surface": "#FFFCF6",
    "ink": "#102D37",
    "muted": "#625F5B",
    "line": "#CDC8BF",
    "accent": "#245AE0",
    "onAccent": "#FFFFFF",
    "panel": "#EBEFED",
    "onPanel": "#102D37",
    "foot": "#102D37",
    "onFoot": "#EBEFED",
    "bar": "#EBEFED",
    "onBar": "#102D37",
    "badge": "#245AE0",
    "onBadge": "#FFFFFF"
  },
  "motion": "pan",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Tutorials & online learning",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "Your next chapter starts here.",
    "subtitle": "Practical tutorials and useful resources for curious minds."
  }
}, "lesson", ".dg-grid{grid-template-columns:1fr 1fr}.dg-image{border:12px solid var(--surface);box-shadow:16px 16px 0 var(--accent)}.dg-side{grid-column:1/-1;display:flex;gap:18px}.dg-copy h1{font-size:clamp(44px,6vw,90px)}");
export const { theme, hero, discovery, css } = module;
