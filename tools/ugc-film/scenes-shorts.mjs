// "From product to YouTube Short": the Academy film on the video flow. Pick a product, put an AI
// avatar in a photo with it, turn the photo into a video, then post it to YouTube Shorts with a
// title and description the AI writes. About three minutes, narrated by Cecily.
//
//   FILM=shorts node make.mjs stills product avatar && FILM=shorts node make.mjs stills shot
//   FILM=shorts node make.mjs animate clip hook && FILM=shorts node make.mjs voice
//   FILM=shorts node record.mjs && FILM=shorts node cards.mjs && FILM=shorts python3 edit.py
//   FILM=shorts node upload.mjs
//
// Scene types are the same as the UGC film (scenes.mjs), plus "asset": pictures and a clip the demo
// store uses in the recordings (the product photo, the avatar, its photo with the product and the
// finished avatar video). Assets are made like "ai" scenes but never shown on their own.
//
// Facts checked in October 2026: YouTube treats vertical or square videos of up to 3 minutes as Shorts,
// and asks creators to disclose realistic AI-made content. Snapfront labels avatar videos as AI-made.
export const LOOK = "Bright, warm, colourful lifestyle commercial film still. Natural daylight mixed with soft coloured accent light in tangerine, coral, violet and teal, glossy and inviting, crisp detail. Widescreen 16:9 frame. No watermark, no logos, no brand names, no readable text.";
const PRODUCT_LOOK = "Premium e-commerce product photograph, photorealistic, crisp focus, soft shadow, no text, no logo, no watermark.";
const CHARACTER = "an original friendly stylised 3D animated character, a young woman with a short wavy copper bob, big warm brown eyes, freckles and a soft smile, wearing a mustard yellow knit sweater, animated feature film style";

export const META = {
  name: "shorts-film", academy: "youtube-shorts",
  eyebrow: "SNAPFRONT ACADEMY · YOUTUBE SHORTS",
  tag: "From one product to a YouTube Short.",
  cta: "Open a product, tap Make a video",
  chapters: [["hook", "One product, one YouTube Short"], ["flow", "The four steps"], ["product", "Start from a product"], ["avatar", "Step 1: your avatar"], ["photo", "Step 2: a photo with the product"],
    ["video", "Step 3: turn it into a video"], ["ready", "Send it to YouTube Shorts"], ["addon", "The YouTube Shorts add-on"], ["write", "Write with AI"], ["post", "Post it"], ["upload", "Or upload your own video"], ["tips", "Tips for Shorts"], ["end", "Your first Short"]],
};

export const SCENES = [
  /* ---------- the demo store's pictures and clip (not shown on their own) ---------- */
  { key: "product", type: "asset", size: "2048*2048", look: PRODUCT_LOOK,
    still: "A premium amber glass serum dropper bottle with a brushed gold cap and a plain cream label with no writing, standing on a round peach stone pedestal against a soft warm peach backdrop, a sprig of dried flowers beside it, warm studio light." },
  { key: "avatar", type: "asset", size: "1536*1920", look: "Animated feature film character render, soft studio lighting, clean pastel background, no text, no logo.",
    still: `Portrait of ${CHARACTER}, from the chest up, looking at the camera and smiling, plain soft lilac background.` },
  { key: "shot", type: "asset", from: ["avatar", "product"], size: "1024*1280",
    still: `The character from image 1, exactly as she looks there (same face, hair, freckles and mustard sweater), in a bright cosy studio, holding the serum bottle from image 2 up toward the viewer and presenting it proudly. Keep the bottle exactly like image 2: amber glass, gold cap, plain cream label. Animated feature film style, warm soft light, pastel background, no text.` },
  { key: "clip", type: "asset", model: "vidu", duration: 6, still_of: "shot",
    motion: "she smiles and gently turns the serum bottle toward the camera, then gives a small friendly nod, soft light shimmers on the amber glass, slight slow push-in" },

  /* ---------- the film ---------- */
  { key: "hook", type: "ai", model: "vidu", duration: 10,
    say: "Here's how to turn one product into a YouTube Short, without ever being on camera. An AI avatar presents it for you, and Snapfront posts it straight to your channel.",
    captions: [["One product → one YouTube Short", "turn one"], ["No camera needed", "without ever"]],
    still: `In a bright, colourful studio with coral, violet and teal light, ${CHARACTER} holds up an amber glass serum bottle with a gold cap and smiles. Around her float three glowing vertical rectangles made of soft light, like video frames, each showing a tiny copy of her holding the bottle, with little sparkles drifting between them. No phones, no screens, no words.`,
    motion: "she holds the bottle up toward the camera and smiles warmly, the glowing vertical frames drift and slowly rotate around her, sparkles float upward, slow push-in" },
  { key: "flow", type: "card",
    say: "There are four steps. Pick a product. Put your avatar in a photo with it. Turn that photo into a video. Then post it to YouTube Shorts, with a title and description the AI writes for you.",
    card: { kind: "steps", title: "From product to Short", items: ["Pick a product", "Avatar photo", "Make the video", "Post the Short"], foot: "No filming. No editing app.", at: ["Pick a product", "Put your avatar", "Turn that", "Then post", "Then post", "with a title"] } },
  { key: "product", type: "screen",
    say: "Start in your store. Open a product, scroll down to Make a video, and tap Make a video with an AI avatar. The avatar studio opens with that product already picked.",
    captions: [["Open a product", "Open a product"], ["Make a video →", "scroll down"]],
    screen: { route: "/product/{product}", ready: "Make a video", steps: [["wait", 1], ["scroll", "Make a video"], ["wait", 1.2], ["highlight", "Make a video with an AI avatar"], ["wait", 1.4], ["tap", "Make a video with an AI avatar"], ["wait", 3]] } },
  { key: "avatar", type: "screen",
    say: "Step one: choose your avatar. Use one you've already made, or make a new one. An original character, your own photo, or a blend of two photos.",
    captions: [["Step 1: your avatar", "Step one"], ["Original, your photo or a blend", "An original"]],
    screen: { route: "/avatars?product={product}", ready: "Choose your avatar", steps: [["wait", 1.2], ["highlight", "Choose your avatar"], ["wait", 2.2], ["highlight", "New avatar"], ["wait", 2.5]] } },
  { key: "photo", type: "screen",
    say: "Step two: put your avatar in a photo with the product. Pick a pose, like showing it off, and make the photo. It takes about twenty seconds. Check the product looks right, because AI can change small details.",
    captions: [["Step 2: avatar + product", "Step two"], ["Check the details", "Check the"]],
    screen: { route: "/avatars?product={product}", ready: "Choose your avatar", steps: [["wait", 0.8], ["scroll", "Put Juniper in a photo"], ["wait", 1.2], ["highlight", "Showing it off"], ["wait", 2.2], ["scroll", "Photos of Juniper (1)"], ["wait", 1], ["highlight", "Juniper photo"], ["wait", 3]] } },
  { key: "video", type: "screen",
    say: "Step three: turn the photo into a video. Tap Make a video and choose how it moves, or Make it talk, with a voice and a short script. It takes one to five minutes, and videos use credits.",
    captions: [["Step 3: make the video", "Step three"], ["Move or talk", "choose how"]],
    screen: { route: "/avatars?product={product}", ready: "Choose your avatar", steps: [["scroll", "Videos from this photo (1)"], ["wait", 3], ["scroll", "Turn this photo into a video"], ["wait", 1], ["highlight", "Make a video"], ["wait", 2], ["highlight", "Make it talk"], ["wait", 3]] } },
  { key: "ready", type: "screen",
    say: "When your video is ready, it shows up right under the photo. Watch it, then tap Post to YouTube Shorts.",
    captions: [["Ready in a few minutes", "When your"], ["Post to YouTube Shorts", "tap Post"]],
    screen: { route: "/avatars?product={product}", ready: "Choose your avatar", steps: [["wait", 0.6], ["scroll", "Videos from this photo (1)"], ["wait", 2.5], ["highlight", "Post to YouTube Shorts"], ["wait", 1], ["tap", "Post to YouTube Shorts"], ["wait", 3]] } },
  { key: "addon", type: "card",
    say: "Posting to YouTube is an add-on for members, at twenty four ninety nine a month. Switch it on, then connect your channel once, with Google. If your channel is a Brand Account, pick the channel itself when Google asks.",
    card: { kind: "note", eyebrow: "THE YOUTUBE SHORTS ADD-ON", title: "Switch it on once", items: ["YouTube Shorts add-on", "$24.99 a month, cancel any time", "Connect your channel once with Google", "Brand Account? Pick the channel itself"], foot: "Your videos go to your own channel.", at: ["Posting to", "twenty four", "connect your", "If your channel"] } },
  { key: "write", type: "screen",
    say: "Your video is already picked. Add a few words about it if you like, and tap Write with AI. It looks at your video and writes a title, a description and hashtags, made to be found in YouTube search. Change anything you want.",
    captions: [["Write with AI", "tap Write"], ["Title, description, hashtags", "writes a title"]],
    screen: { route: "/youtube?source=avatar&id={video}", ready: "Write with AI", steps: [["wait", 1], ["highlight", "Write it with AI"], ["wait", 1], ["tap", { label: "What's it about? (optional)" }], ["type", "My Glow Serum, for dry skin"], ["wait", 0.6], ["tap", "Write with AI"], ["wait", 5], ["scroll", "Description"], ["wait", 3.5]] } },
  { key: "post", type: "screen",
    say: "Avatar videos are always labelled as made with AI, as YouTube asks. Choose public, unlisted or private, and tap Post to YouTube. It shows up under Posted, with a link to your Short.",
    captions: [["Labelled as AI", "always labelled"], ["Post to YouTube", "tap Post"]],
    screen: { route: "/youtube?source=avatar&id={video}", ready: "Write with AI", steps: [["tap", "Write with AI"], ["wait", 4], ["scroll", "Made with AI"], ["wait", 0.8], ["highlight", "Made with AI"], ["wait", 1.6], ["tap", "Public"], ["wait", 1], ["tap", "Post to YouTube"], ["wait", 2.2], ["scroll", "Posted"], ["wait", 3]] } },
  { key: "upload", type: "screen",
    say: "Made a video somewhere else, or filmed one yourself? Tap Upload a video, and pick it from your phone or your computer. Vertical, and up to three minutes long. Then write it with AI and post it the same way.",
    captions: [["Or upload your own", "Tap Upload"], ["Vertical, up to 3 minutes", "Vertical"]],
    screen: { route: "/youtube", ready: "Upload a video", steps: [["wait", 0.8], ["scroll", "Upload a video"], ["wait", 1], ["highlight", "Upload a video"], ["wait", 4]] } },
  { key: "tips", type: "card",
    say: "A few tips for Shorts. Hook people in the first two seconds. Post often: one Short a day builds up fast. Put your store link on your channel page. And keep it honest, with no made up results.",
    card: { kind: "rules", title: "Shorts that work", marks: ["ok", "ok", "ok", "ok"], items: ["Hook in the first 2 seconds", "Post often: one Short a day", "Your store link on your channel page", "Honest: no made-up results"], at: ["Hook people", "Post often", "Put your", "keep it honest"] } },
  { key: "end", type: "ai", model: "vidu", duration: 10, end: true, reuse: "../out/raw/end.mp4",
    say: "Ready? Open a product, tap Make a video, and post your first Short today.",
    captions: [] },
];
