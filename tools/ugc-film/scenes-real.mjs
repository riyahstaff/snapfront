// Five more promo Shorts (vertical 1080×1920, about 25-30 seconds each), with realistic presenters
// filmed in an iPhone look: natural light, real rooms, handheld feel.
//
// Honest by design, like the promo set: each presenter is an original AI person (not a real one),
// labelled "AI presenter" on screen and on the end card. They speak to the viewer in the second
// person and never say they use, bought or love Snapfront. Every app shot is a real recording of
// Snapfront with demo data. Upload with YouTube's "altered or synthetic content" box ticked.
//
//   FILM=real node make.mjs stills          the presenters (Seedream) and the snapped product photo
//   FILM=real node make.mjs voice           every line, each in its presenter's voice (ElevenLabs)
//   FILM=real node make.mjs talk            the openers: the presenter saying their line (InfiniteTalk)
//   FILM=real node record.mjs               the app recordings
//   FILM=real node shorts.mjs               → out-real/final/snapfront-short-<key>.mp4
const IPHONE = "Vertical 9:16 candid photo, shot on an iPhone 15 Pro main camera in 4K, natural available light, true-to-life colour, real skin texture with pores and fine lines, no retouching, no beauty filter, slight handheld framing, background softly out of focus. The person looks straight into the lens with a relaxed, friendly expression, lips gently closed, framed from mid-chest up with the face in the upper half of the frame. An ordinary real person, not a model and not a celebrity. No text, no logos, no phones or screens.";
const TALK = "talking naturally to the camera like a casual selfie video filmed on a phone, relaxed and friendly, natural blinking, small head movements and an easy smile, the handheld camera sways very slightly";

export const META = { name: "real", academy: "-", eyebrow: "SNAPFRONT", tag: "", cta: "Start free at snapfront.app", chapters: [] };
export const LOOK = "";

// Each Short: a presenter saying the opener, two app beats in the same voice, and the end card.
// `say` lines are spoken by the presenter; `caption` is the pill at the bottom; `headline` sits above the phone.
export const SHORTS = [
  { key: "snap", title: "One photo is all it takes to start selling online", presenter: "Dani", voice: "el:Z5JpFCNFIz8Nhe4KEikq",
    opener: { caption: "One photo → a product page", say: "You can start selling online with one photo. Here's how." },
    beats: [
      { headline: "Snap one photo", caption: "No writing needed", rec: "snap", say: "Take a photo of what you sell, tap Build product page, and Snapfront writes the page for you." },
      { headline: "Ready to sell", caption: "Title, price and FAQ", rec: "snap", from: "draft", say: "You get a title, a description, bullet points, an FAQ and a suggested price. Change anything you like." },
    ] },
  { key: "faceless", title: "Make product videos without showing your face", presenter: "Marcus", voice: "el:O25OBJSCm417f6WHn13t",
    opener: { caption: "No face? No problem", say: "Don't want to show your face online? Your videos don't need it." },
    beats: [
      { headline: "AI writes the script", caption: "Hook, scenes and caption", rec: "faceless", say: "Pick a product and a style, and Snapfront writes the script, from the hook to the caption." },
      { headline: "Your photos, a real video", caption: "Captions and a voiceover", rec: "faceless", from: "video", say: "Then it turns your product photos into a vertical video with big captions and a voiceover, ready for Reels and Shorts." },
    ] },
  { key: "post", title: "Never wonder what to post again", presenter: "Sofia", voice: "el:cgSgspJ2msm6clMCkdW9",
    opener: { caption: "Stuck on what to post?", say: "Stuck on what to post today? Let Snapfront write it for you." },
    beats: [
      { headline: "Write it for me", caption: "Headline, caption, hashtags", rec: "post", say: "Pick a product and tap Write it for me. You get a headline, a caption and hashtags." },
      { headline: "A finished graphic", caption: "Save it or share it", rec: "post", from: "graphic", say: "Then pick a look, tap Make the post, and your graphic is ready to save and share." },
    ] },
  { key: "email", title: "Your followers aren't yours. Your email list is.", presenter: "Priya", voice: "el:EXAVITQu4vr4xnSDxMaL",
    opener: { caption: "Own your audience", say: "Your followers belong to the app. Your email list belongs to you." },
    beats: [
      { headline: "Your own email list", caption: "Sign-ups and buyers", rec: "email", say: "Snapfront grows your list from your store's sign-up box and from buyers who opt in at checkout." },
      { headline: "Emails that send themselves", caption: "Automatic emails on Pro", rec: "email", from: "auto", say: "Then turn on automatic emails, like a welcome note for new subscribers, and they go out on their own." },
    ] },
  { key: "earn", title: "Get paid for sharing Snapfront", presenter: "Andre", voice: "el:rWyjfFeMZ6PxkHqD3wGC",
    opener: { caption: "Share it. Get paid.", say: "Know someone who wants to sell online? You can get paid for sharing Snapfront." },
    beats: [
      { headline: "40% of every payment", caption: "From people you refer", rec: "earn", say: "Join the partner program and share your link. You earn forty percent of every payment from people who join through it." },
      { headline: "A share kit, ready to go", caption: "Hooks and captions", rec: "earn", from: "kit", say: "Your clicks and sales show up right in the app, with a share kit of hooks and captions to get you started." },
    ] },
];
export const END = { say: "Start free at snapfront dot app.", caption: "snapfront.app" };

const PEOPLE = {
  snap: "A woman in her late twenties with deep brown skin and natural shoulder-length curly hair, small gold hoop earrings, wearing a cream ribbed sweater, standing in her bright home kitchen with soft morning sunlight coming through a window beside her, a few amber glass candle jars on the counter behind her.",
  faceless: "A man in his early thirties with fair skin, short brown hair and a trimmed beard, wearing a dark green flannel shirt over a grey t-shirt, sitting at a wooden desk in a small home workroom with houseplants and warm daylight from a side window.",
  post: "A Latina woman in her mid twenties with long dark wavy hair and light tan skin, wearing a white linen shirt, sitting at a window table in a cosy neighbourhood coffee shop, afternoon light on her face, a latte on the table in front of her.",
  email: "A South Asian woman around forty with shoulder-length black hair and warm brown skin, wearing a mustard cardigan and a thin gold necklace, in her home office with a full bookshelf and a warm desk lamp behind her, soft overcast window light on her face.",
  earn: "A Black man in his early thirties with a short fade and a neat beard, wearing a navy hoodie, sitting on the front steps of a brownstone at golden hour, warm low sun on his face, a quiet tree-lined street softly blurred behind him.",
};
const voiceOf = Object.fromEntries(SHORTS.map((s) => [s.key, s.voice]));

export const SCENES = [
  // The presenters, and the product photo the "snap" recording uploads (a seller's own phone photo).
  ...SHORTS.map((s) => ({ key: `${s.key}-still`, type: "asset", size: "1440*2560", look: IPHONE, still: PEOPLE[s.key] })),
  { key: "candle", type: "asset", size: "2048*2048", look: "Square photo taken on an iPhone, natural window light, true-to-life colour, slight grain, no text, no logo, no watermark.",
    still: "A hand-poured soy candle in an amber glass jar with a wooden wick and a plain kraft paper label with no writing, sitting on a light oak kitchen counter next to a sprig of dried lavender, soft morning light from a window, shallow depth of field." },
  // Every line, in its presenter's voice. The opener lines are also what the talking clips say.
  ...SHORTS.flatMap((s) => [{ key: `${s.key}-0`, type: "line", voice: s.voice, say: s.opener.say }, ...s.beats.map((b, i) => ({ key: `${s.key}-${i + 1}`, type: "line", voice: s.voice, say: b.say }))]),
  ...SHORTS.map((s) => ({ key: `end-${s.key}`, type: "line", voice: voiceOf[s.key], say: END.say })),
  // The openers: each presenter saying their first line.
  ...SHORTS.map((s) => ({ key: `${s.key}-clip`, type: "asset", still_of: `${s.key}-still`, talk: { line: `${s.key}-0`, prompt: `The person from the image ${TALK}.` } })),
  // App recordings (record.mjs, FILM=real). `mark` names a moment that a beat's `from` can start at.
  { key: "snap", type: "screen", screen: { route: "/snap", ready: "Build product page", steps: [["wait", 0.8], ["photo", "Tap to take or choose a product photo"], ["wait", 1.4], ["tap", "Build product page"], ["wait", 4.2], ["mark", "draft"], ["wait", 1.2], ["scroll", "Description"], ["wait", 2.2], ["scroll", "Add to my store"], ["wait", 2.6]] } },
  { key: "faceless", type: "screen", screen: { route: "/faceless", ready: "Write the script", steps: [["wait", 0.8], ["tap", "Glow Serum"], ["wait", 0.5], ["tap", "Problem, then solution"], ["wait", 0.8], ["tap", "Write the script"], ["wait", 2.6], ["scroll", "Scene 2"], ["wait", 2.4], ["mark", "video"], ["scroll", "Your videos"], ["play"], ["wait", 6]] } },
  { key: "post", type: "screen", screen: { route: "/marketing", ready: "Write it for me", steps: [["wait", 0.8], ["tap", "Glow Serum"], ["wait", 0.6], ["tap", "Write it for me"], ["wait", 2.6], ["scroll", "Caption"], ["wait", 2.2], ["mark", "graphic"], ["scroll", "Make the post"], ["wait", 0.8], ["tap", "Make the post"], ["wait", 4.5], ["scroll", "Your post"], ["wait", 3.5]] } },
  { key: "email", type: "screen", screen: { route: "/email", ready: "Export CSV", steps: [["wait", 1.4], ["scroll", "dev@example.com"], ["wait", 1.6], ["tap", "Emails"], ["wait", 2.6], ["mark", "auto"], ["tap", "Automatic"], ["wait", 2.4], ["scroll", "After a purchase"], ["wait", 3]] } },
  { key: "earn", type: "screen", screen: { route: "/earn", ready: "Your sales page", steps: [["wait", 2.4], ["highlight", "Your link"], ["wait", 2.4], ["mark", "kit"], ["scroll", "Clicks"], ["wait", 2.2], ["scroll", "Posts that sell"], ["wait", 2.4], ["scroll", "A 35-second video plan"], ["wait", 2.4]] } },
];
