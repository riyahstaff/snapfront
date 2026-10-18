import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-writing",
  "name": "The Open Draft",
  "category": "Writing & publishing",
  "group": "digital",
  "vibe": "Folio composition, expressive typography and cinematic optional hero motion",
  "display": "Newsreader",
  "body": "Manrope",
  "colors": {
    "bg": "#F6F1E5",
    "surface": "#FFFCF6",
    "ink": "#332B25",
    "muted": "#625F5B",
    "line": "#CDC8BF",
    "accent": "#9B4330",
    "onAccent": "#FFFFFF",
    "panel": "#F6F1E5",
    "onPanel": "#332B25",
    "foot": "#332B25",
    "onFoot": "#F6F1E5",
    "bar": "#F6F1E5",
    "onBar": "#332B25",
    "badge": "#9B4330",
    "onBadge": "#FFFFFF"
  },
  "motion": "pan",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Writing & publishing",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "Every story starts somewhere.",
    "subtitle": "Writing workbooks, publishing guides and prompts for the page ahead."
  }
}, "folio", ".dg-grid{grid-template-columns:1.2fr .75fr}.dg-copy{padding:30px 5vw 30px 0;border-right:1px solid var(--line)}.dg-image{height:530px;border:14px solid var(--surface);box-shadow:5px 5px 0 var(--line)}.dg-side{grid-column:1/-1;font-style:italic;text-align:center}");
export const { theme, hero, discovery, css } = module;
