# Home-page promo

The 90-second film on snapfront.app (the "See it in 90 seconds" section under the hero).
Ten colourful animated scenes, Cecily's narration, big on-screen captions, a music bed and an end card
that points to **Start here**.

## Files

- `scenes.mjs` — one entry per scene: the first frame (`still`), what the video model does with it
  (`motion`), Cecily's line (`say`) and the captions with the second each one appears.
- `make.mjs` — makes the raw material through the owner-only studio routes on snapfront.app:
  `stills`, `animate`, `voice`, `sheet`. Needs `STUDIO_TOKEN`.
- `overlays.py` — renders the captions, end card and corner mark as transparent PNGs in Figtree.
- `music.py` — synthesises the music bed (made here, so there's nothing to license).
- `edit.py` — cuts it all together and writes the web files to `server/assets/site/promo/`.

## Remaking it

```bash
cd tools/promo
export STUDIO_TOKEN=…                 # never commit it
node make.mjs stills                  # or: node make.mjs stills snap end
node make.mjs sheet                   # look at out/sheet.jpg
node make.mjs animate                 # Runpod: about $1.50 per 10-second scene at 1080p (Vidu Q3)
node make.mjs voice                   # ElevenLabs, Cecily
python3 overlays.py && python3 edit.py
```

Changing only words (a caption, the end card) needs just `overlays.py` and `edit.py`, with no AI cost.
Changing a line of narration needs `node make.mjs voice <key>` and the caption times for that scene.
`edit.py` keeps scenes whose clips only work for a few seconds usable with `FIX` (slow motion or
back-and-forth). The page picks up a new cut by itself: the file URLs carry a version from the files.
