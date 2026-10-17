# Academy lessons taught by an avatar

The owner can have one of their own avatars teach Academy lessons. Each slide is read in the chosen voice, the avatar lip-syncs it (InfiniteTalk on Runpod, 480p, about $0.25 a slide), and the slide is shown next to her. Slides that walk through the app show a phone screen recording of the real Snapfront app instead (taps, scrolling, typing), made with demo data.

## Turning it on

Academy → **Lesson presenter** (only the owner sees it; the owner is any account in `OWNER_EMAILS`):

1. Pick the avatar (only avatars with a face can talk: your photo, a blend, Soft 3D, Illustrated, Mascot).
2. Pick her voice (free Kokoro voices, or ElevenLabs voices if `ELEVENLABS_API_KEY` is set).
3. Try one lesson first, or choose every lesson. Saving starts making those videos in the background.

The old video stays up until the new one is ready. Talking-head clips and voices are cached by their words, voice and avatar, so remaking a lesson only pays for slides that changed. Lessons that aren't chosen keep their plain narrated slides.

## App demos (screen recordings)

A slide's `screen` in `server/src/academy-content.js` describes the demo: the route to open, text that shows the page is ready, and steps:

- `["wait", seconds]`
- `["tap", "Text on screen"]` or `["tap", { label: "Field label" }]` (shows a highlight and a tap)
- `["scroll", "Text on screen"]` (smooth scroll to it)
- `["highlight", "Text on screen"]` (rings the card it's in)
- `["type", "text"]`

`tools/academy-screens` records them: it runs a private copy of the server with a demo store ("Glow Lab", example data only), opens the web app at phone size, plays the steps and saves an H.264 MP4 per slide.

```
cd tools/academy-screens && npm install
node record.mjs --lesson partner                 # into ./out
ACADEMY_STUDIO_TOKEN=... node record.mjs --lesson partner --upload
```

Uploads go to `PUT /api/academy-presenter/screens/:lesson/:slide` on `ACADEMY_API` (default https://snapfront.app) with the `ACADEMY_STUDIO_TOKEN` set on Railway. A new recording makes the lesson rebuild.

## API (owner, or `ACADEMY_STUDIO_TOKEN`)

- `GET /api/academy-presenter`: settings, the owner's avatars, voices, lessons, demos, build progress, preview links.
- `PUT /api/academy-presenter {avatar_id, voice, lessons: ["partner"] | "all"}`: save and build.
- `POST /api/academy-presenter/build`: build again (e.g. after a failure).
- `PUT /api/academy-presenter/screens/:lesson/:slide` (video/mp4).
