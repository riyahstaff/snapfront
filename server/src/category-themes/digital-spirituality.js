import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-spirituality",
  "name": "ROOTED PAGES",
  "category": "Faith & spiritual study",
  "group": "digital",
  "vibe": "Chapel composition, expressive typography and cinematic optional hero motion",
  "display": "Cormorant Garamond",
  "body": "Manrope",
  "colors": {
    "bg": "#EEEADA",
    "surface": "#FFFCF6",
    "ink": "#3E442E",
    "muted": "#625F5B",
    "line": "#CDC8BF",
    "accent": "#707344",
    "onAccent": "#FFFFFF",
    "panel": "#EEEADA",
    "onPanel": "#3E442E",
    "foot": "#3E442E",
    "onFoot": "#EEEADA",
    "bar": "#EEEADA",
    "onBar": "#3E442E",
    "badge": "#707344",
    "onBadge": "#FFFFFF"
  },
  "motion": "drift",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Faith & spiritual study",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "Space for deeper understanding.",
    "subtitle": "Study journals, reflection prompts and resources for meaningful reading."
  }
}, "chapel", ".dg-grid{grid-template-columns:.7fr 1.3fr}.dg-copy{grid-column:1/-1;text-align:center;max-width:850px;margin:auto}.dg-image{height:340px;border-radius:160px 160px 0 0}.dg-side{border-block:1px solid var(--line);padding:40px;font-family:var(--display);font-size:30px}");
export const { theme, hero, discovery, css } = module;
