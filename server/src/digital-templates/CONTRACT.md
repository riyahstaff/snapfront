# Original Snapfront digital template contract

Each template is an original `.json` file named `<id>.json`, with exactly the assigned `id` and `format` (`guide`, `checklist`, `hooks`, `quotes`, `planner`). It is a data definition for an editable product renderer, not a screenshot or independently executable code. No scripts, raw SVG, remote URLs, copyrighted Canva/provider assets or seller data. Do not edit other files or run git.

Top-level schema:

```json
{
  "id": "guide-01",
  "name": "Quiet Authority",
  "format": "guide",
  "description": "A calm editorial guide with a striking side rail and spacious reading pages.",
  "tags": ["editorial", "calm", "coaching"],
  "palette": {"paper":"#F8F5EF","ink":"#202A28","accent":"#466352","muted":"#62706A","soft":"#E7E9E0"},
  "fonts": {"heading":"serif","body":"sans"},
  "cover": {
    "background":"paper",
    "title": {"x":0.10,"y":0.24,"w":0.72,"h":0.40,"size":52,"align":"left"},
    "subtitle": {"x":0.10,"y":0.68,"w":0.72,"h":0.13,"size":16,"align":"left"},
    "eyebrow": {"x":0.10,"y":0.15,"w":0.72,"h":0.06,"size":10,"align":"left"},
    "brand": {"x":0.10,"y":0.88,"w":0.72,"h":0.05,"size":11,"align":"left"},
    "textColor":"ink",
    "shapes":[{"kind":"rect","x":0.88,"y":0,"w":0.12,"h":1,"fill":"accent","opacity":1}],
    "image":null
  },
  "interior": {
    "margin":46,"headerStyle":"rule","blockStyle":"plain","headingSize":27,"bodySize":11,"lineHeight":1.45,
    "column":"single","numberStyle":"pill","shapes":[{"kind":"line","x":0.075,"y":0.06,"w":0.85,"h":0,"fill":"accent","stroke":1.5}]
  },
  "sample": {"title":"The Calm Content Guide","subtitle":"A practical rhythm for showing up with confidence","brand":"Your brand","eyebrow":"A FIELD GUIDE"}
}
```

Coordinates for cover text regions, cover image and shapes are normalized 0–1 within the page. Render page dimensions default to letter 612×792 points, quotes to 576×720; normalization supports both. Region x/y/w/h must fit the page. Title size 28–70, subtitle 11–20, eyebrow/brand 8–14. Never make a title region too shallow: h at least 0.26 and w at least 0.58. Leave title/subtitle/eyebrow/brand regions nonoverlapping. The shared renderer measures and shrinks/paginates real text; your layout must have deliberate spacious regions, not a pixel-perfect short-sample-only trick.

Palette roles are hex colors (six digits only). paper vs ink must be high contrast; muted remains readable. Choose artistic, modern, warm or cinematic tones suited to the assigned design. Dark paper is acceptable with light ink. Cover textColor is `ink` or `paper`, compatible with the selected background role. cover.background is a palette role. Fill on shapes is a palette role only; never arbitrary CSS.

Fonts allow `sans`, `serif`, `display`, `mono` using bundled open-license DM Sans, a bundled editorial serif, Bricolage Grotesque and a bundled mono. Body must be sans/serif. `align` left/center/right. Choose a characteristic pairing and relevant hierarchy.

Cover shapes are an ordered original geometric composition (at most 18): kind `rect`, `ellipse`, `line`, `arc` or `polygon`. All have x/y/w/h, fill, optional opacity 0–1, stroke 0–6, radius 0–0.1. Polygon additionally `points` as an array of 3–8 [x,y] coordinates normalized to the local shape box. Arc may have `start` and `end` degrees. At least 3 shapes create a distinctive composition; not merely a solid colored page. Text regions must remain readable. Decoration is behind text. An optional cover.image `{x,y,w,h,radius}` defines a replaceable owned-photo region; no required external stock art or empty photo hole in the sample (the renderer supplies a stylized geometric placeholder only when absent).

Interior enums: headerStyle `rule`, `band`, `side`, `stack`, `pill`; blockStyle `plain`, `cards`, `stripe`, `outline`, `steps`; column `single` or `sidebar` (long text always flows safely); numberStyle `plain`, `pill`, `large`, `none`. margin 34–60, headingSize 22–34, bodySize 10–12.5, lineHeight 1.35–1.65. Interior shapes at most 6, subtle decoration outside reading region. Checklists/planners require printable white/light space for writing even when the cover is dark. These are layout parameters plus original geometric artwork, not a limited preset-name-only design.

Sample copy is original, neutral, useful, and explicitly illustrative in the app. No fabricated results, medical/financial/legal claims, quotes from real people, copyright logos or fixed seller inventory. For quote designs use an original short uplifting sentence as title; for planner/checklist/guide/hooks use a recognizable product use case. Each worker independently chooses purposeful composition, contrasting type/palette, and motif arrangement; do not copy another item's JSON with a palette change.
