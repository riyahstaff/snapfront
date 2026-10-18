import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-business",
  "name": "FOUNDER NOTES",
  "category": "Business & entrepreneurship",
  "group": "digital",
  "vibe": "Brief composition, expressive typography and cinematic optional hero motion",
  "display": "Bricolage Grotesque",
  "body": "Manrope",
  "colors": {
    "bg": "#F5EFEB",
    "surface": "#FFFCF6",
    "ink": "#302627",
    "muted": "#625F5B",
    "line": "#CDC8BF",
    "accent": "#A43E35",
    "onAccent": "#FFFFFF",
    "panel": "#F5EFEB",
    "onPanel": "#302627",
    "foot": "#302627",
    "onFoot": "#F5EFEB",
    "bar": "#F5EFEB",
    "onBar": "#302627",
    "badge": "#A43E35",
    "onBadge": "#FFFFFF"
  },
  "motion": "pan",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Business & entrepreneurship",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "Turn your next idea into a plan.",
    "subtitle": "Business playbooks, launch templates and tools to help you get started."
  }
}, "brief", ".dg-grid{grid-template-columns:.45fr 1.3fr 1fr}.dg-side{grid-column:1;grid-row:1;border-top:5px solid var(--accent);padding-top:18px}.dg-copy{grid-column:2;grid-row:1}.dg-image{grid-column:3;grid-row:1;height:470px;transform:rotate(3deg)}");
export const { theme, hero, discovery, css } = module;
