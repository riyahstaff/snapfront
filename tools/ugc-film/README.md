# UGC film: "Get paid for UGC videos"

About five minutes, narrated by Cecily (the Academy narrator). It teaches how UGC works, filming yourself or using an AI avatar, formats, hooks, scripts, your Snapfront UGC page, what to charge, finding brands, and delivering well. It plays as the Academy lesson **ugc** (`film: "ugc-income"` in `server/src/academy-content.js`). It also works on YouTube, with the chapters in `out/final/chapters.txt`.

## Files

| File | What it does |
|------|--------------|
| `scenes.mjs` | The script, scene by scene: `ai` (first frame + motion), `card` (motion graphics), `screen` (the app in a phone), `loop` (tool animations). |
| `make.mjs` | Voices (ElevenLabs, Cecily), stills and clips (Runpod), all through the owner-only studio routes on snapfront.app. |
| `record.mjs` | Records the app scenes from a private demo server ("Glow Lab", example data only). The Scripts tab shows `demo-script.json`, a real script from the live Scripts tool. |
| `cards.mjs` | Works out the timing, then draws the cards, phone frames and caption pills frame by frame in Figtree. |
| `edit.py` | Cuts it together, adds music (`tools/promo/music.py`) and exports to `out/final/`. |
| `upload.mjs` | Sends the finished film to the live server for the Academy lesson (`GET /api/academy-films` lists them). |

## Remaking it

```bash
cd tools/ugc-film
export STUDIO_TOKEN=…          # an owner's session token or ACADEMY_STUDIO_TOKEN; never commit it
node make.mjs voice            # do a few at a time if ElevenLabs answers 500 (too many at once)
node make.mjs stills && node make.mjs sheet && node make.mjs animate     # Runpod: about $1.50 a clip
node record.mjs                # app scenes
node cards.mjs                 # timing, cards, overlays
python3 edit.py                # → out/final/ugc-film-1080.mp4, -720.mp4, .jpg, .vtt, chapters.txt
node upload.mjs                # → the Academy lesson
```

A changed line needs `make.mjs voice <key>`, then `cards.mjs` and `edit.py`. Changed card wording needs `cards.mjs <key>` and `edit.py --only=<key>`.

## What the facts rest on (checked October 2026)

**Rates, portfolio, pitching, delivery.** These are typical ranges that creators report, never promises.
- [ChatCut: rate ladder](https://chatcut.io/blog/how-to-become-a-ugc-creator-2026)
- [DansUGC: starting out](https://dansugc.com/blog/how-to-start-ugc-creator-2026)
- [Influee guide](https://influee.co/blog/how-to-become-ugc-creator)

**Hooks, formats and structure.**
- [Captions: UGC tips](https://captions.ai/blog/tips-for-great-ugc)
- [inBeat: TikTok UGC](https://inbeat.agency/blog/tiktok-ugc)

**AI avatars.** Label AI. An avatar never claims personal use or results. Never use a real person's likeness without consent.
- [The Social Outline](https://thesocialoutline.com/blog/ai-ugc-disclosure-rules)
- [Oakgen checklist](https://oakgen.ai/blog/ai-ugc-legal-disclosure-checklist-2026)
- [Vantaige on AI UGC](https://vantaige.io/blog/how-to-make-money-selling-ai-ugc-content-brands-2026)

**Amazon Influencer Program.** Approved creators upload review videos and earn onsite commissions.
- [Ad Badger](https://www.adbadger.com/blog/amazon-influencer-program/)
- [Amazon's Creators API](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction) covers product data and links for Associates only. It has nothing for uploading videos.
