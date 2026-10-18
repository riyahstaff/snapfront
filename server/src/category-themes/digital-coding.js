import { createDigitalTheme } from '../digital-theme-kit.js';
const module = createDigitalTheme({
  "id": "p-digital-coding",
  "name": "SOURCE SCHOOL",
  "category": "Coding & technology courses",
  "group": "digital",
  "vibe": "Terminal composition, expressive typography and cinematic optional hero motion",
  "display": "Space Grotesk",
  "body": "Manrope",
  "colors": {
    "bg": "#101924",
    "surface": "#202C2E",
    "ink": "#ECF5F0",
    "muted": "#C5CBC7",
    "line": "#536260",
    "accent": "#A8ED72",
    "onAccent": "#16221E",
    "panel": "#101924",
    "onPanel": "#ECF5F0",
    "foot": "#0B1213",
    "onFoot": "#ECF5F0",
    "bar": "#101924",
    "onBar": "#ECF5F0",
    "badge": "#A8ED72",
    "onBadge": "#17201B"
  },
  "motion": "drift",
  "hero": "editorial",
  "rCard": 16,
  "rBtn": 999,
  "copy": {
    "eyebrow": "Coding & technology courses",
    "collection": "Explore the collection",
    "cta": "Explore resources",
    "title": "Build what comes next.",
    "subtitle": "Code walkthroughs, developer guides and tools for your next project."
  }
}, "terminal", ".dg-grid{grid-template-columns:.85fr 1.15fr}.dg-image{border:1px solid var(--accent);border-radius:12px;padding:22px 8px 8px;background:var(--surface)}.dg-side{grid-column:2;font-family:monospace;border-left:2px solid var(--accent);padding-left:20px}");
export const { theme, hero, discovery, css } = module;
