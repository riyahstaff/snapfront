import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-finance",
  "name": "The Money Edit",
  "category": "Personal finance & budgeting",
  "group": "digital",
  "vibe": "Ledger composition, expressive typography and cinematic optional hero motion",
  "display": "DM Serif Display",
  "body": "Manrope",
  "colors": {
    "bg": "#F2F0E8",
    "surface": "#FFFCF6",
    "ink": "#203B36",
    "muted": "#625F5B",
    "line": "#CDC8BF",
    "accent": "#B5CF6B",
    "onAccent": "#203B36",
    "panel": "#F2F0E8",
    "onPanel": "#203B36",
    "foot": "#203B36",
    "onFoot": "#F2F0E8",
    "bar": "#F2F0E8",
    "onBar": "#203B36",
    "badge": "#B5CF6B",
    "onBadge": "#FFFFFF"
  },
  "motion": "pan",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Personal finance & budgeting",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "Give your money a clearer direction.",
    "subtitle": "Budget workbooks, financial education and practical planning resources."
  }
}, "ledger", ".dg-grid{grid-template-columns:1.5fr .7fr}.dg-copy{border-bottom:2px solid var(--ink);padding-bottom:40px}.dg-image{height:460px;box-shadow:18px 18px 0 var(--badge)}.dg-side{grid-column:1/-1;display:flex;justify-content:space-between;border-block:1px solid var(--line);padding:20px 0}");
export const { theme, hero, discovery, css } = module;
