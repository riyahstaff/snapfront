// Five promo Shorts (vertical 1080×1920, about 30 seconds each) for Snapfront's own YouTube channel.
//
// Honest by design: every app shot is a real recording of Snapfront with demo data, and Juniper, the
// presenter in the openers, is an original AI character. She's labelled "AI presenter" on screen and
// never claims to be a customer or to have used anything. Upload with YouTube's "altered or
// synthetic content" box ticked. Claims stick to what the app does today.
//
//   FILM=promo node make.mjs stills && FILM=promo node make.mjs animate   (openers, from Juniper's portrait)
//   FILM=promo node make.mjs voice                                         (Cecily, one line per beat)
//   FILM=promo node record.mjs                                             (the new app recordings)
//   node shorts.mjs                                                        (→ out-promo/final/<short>.mp4)
const JUNIPER = "the character from the image, exactly as she looks there: same face, short wavy copper bob, freckles, big warm brown eyes and mustard yellow knit sweater, animated feature film style";
const VERTICAL = "Vertical 9:16 frame, the character centred in the upper two thirds, soft cinematic light, colourful background, no text, no logos, no phones or screens with writing.";

export const META = { name: "promo", academy: "-", eyebrow: "SNAPFRONT", tag: "", cta: "Start free at snapfront.app", chapters: [] };
export const LOOK = "";

// Each Short: an opener (Juniper), two or three app beats, and the end card. `say` lines are voiced
// by Cecily; `caption` is the pill at the bottom; `headline` sits above the phone.
export const SHORTS = [
  { key: "looks", title: "Your online store, designed in one tap",
    opener: { caption: "Look premium in one tap", say: "Your online store can look this good, in one tap." },
    beats: [
      { headline: "130 store designs", caption: "Search by category or mood", rec: "looks", say: "Snapfront has a hundred and thirty finished store designs. Search by category or mood, and see each one with real photos." },
      { headline: "Your photos, your words", caption: "Checkout through Stripe", rec: "store", say: "Pick one, swap in your photos and words, and your store is ready to sell, with checkout through Stripe." },
    ] },
  { key: "digital", title: "No product to sell? Make one",
    opener: { caption: "No product? Make one", say: "No product to sell? Make one." },
    beats: [
      { headline: "500 product ideas", caption: "E-books, planners, checklists", rec: "create", say: "Snapfront has five hundred digital product ideas, with what each kind usually sells for." },
      { headline: "50 designer layouts", caption: "No design app needed", rec: "designs", say: "Pick one of fifty designer layouts, put in your own words, and sell it as a download. No design app needed." },
    ] },
  { key: "youtube", title: "Turn one product into a YouTube Short",
    opener: { caption: "Product → YouTube Short", say: "Turn one product into a YouTube Short, without filming yourself." },
    beats: [
      { headline: "An AI avatar presents it", caption: "Make a video", rec: "../out-shorts/screens/ready", say: "Open a product, tap Make a video, and an AI avatar presents it for you." },
      { headline: "Write with AI", caption: "Title, description, hashtags", rec: "../out-shorts/screens/write", from: 4, say: "Write with AI fills in the title, description and hashtags." },
      { headline: "Posted to your channel", caption: "Labelled as AI-made", rec: "../out-shorts/screens/post", from: 9.6, say: "Then it posts straight to your channel, labelled as AI made." },
    ] },
  { key: "ugc", title: "Get paid to make UGC videos",
    opener: { caption: "Get paid for UGC videos", say: "Brands pay creators for short videos. Here's how to start." },
    beats: [
      { headline: "Scripts written for you", caption: "Hooks, script, shot list", rec: "../out/screens/scripts", from: 3, say: "Snapfront writes your UGC scripts: hook options, the full script and a shot list." },
      { headline: "Your UGC portfolio", caption: "One link for brands", rec: "../out/screens/page", say: "Then put your videos and rates on your own portfolio page, and send brands one link." },
    ] },
  { key: "care", title: "Support that fixes things for you",
    opener: { caption: "Help that fixes things", say: "Stuck on something late at night? Snapfront's support can fix it." },
    beats: [
      { headline: "Tap Help", caption: "SnapCare checks your account", rec: "care", say: "Tap Help and tell SnapCare what's wrong. It checks your account and fixes common problems, like a buyer's download link." },
      { headline: "People when you need them", caption: "Passed to the team", rec: "care", from: 13, say: "Anything it can't fix goes straight to the Snapfront team, who answer by email and in the chat." },
    ] },
];
export const END = { say: "Start free at snapfront dot app.", caption: "snapfront.app" };

const opener = (key, scene, motion) => [
  { key: `${key}-still`, type: "asset", from: ["avatar"], size: "1440*2560", still: `${JUNIPER}, ${scene} ${VERTICAL}` },
  { key: `${key}-clip`, type: "asset", model: "vidu", duration: 5, still_of: `${key}-still`, motion },
];
export const SCENES = [
  { key: "avatar", type: "asset" },   // Juniper's portrait, copied from the shorts film (state.json)
  // Product photos for the demo store's other two products.
  { key: "mist", type: "asset", size: "2048*2048", look: "Premium e-commerce product photograph, photorealistic, crisp focus, soft shadow, no text, no logo, no watermark.",
    still: "A frosted glass spray bottle of facial sunscreen mist with a soft peach cap and a plain label with no writing, standing on a pale sand-coloured stone block against a warm cream backdrop, a few dried grasses beside it, soft morning light." },
  { key: "mask", type: "asset", size: "2048*2048", look: "Premium e-commerce product photograph, photorealistic, crisp focus, soft shadow, no text, no logo, no watermark.",
    still: "A folded lilac silk sleep eye mask resting on a smooth lavender silk pillow, soft satin sheen, gentle shadows, calm pastel light, no packaging." },
  ...opener("looks", "standing in a bright boutique full of pastel shelves, spreading her arms proudly as if presenting the beautiful shop around her.", "she smiles and sweeps one arm out to present the shop, soft sparkles drift, slow push-in"),
  ...opener("digital", "sitting at a sunny desk holding up a beautifully designed printed planner and a small booklet, delighted.", "she holds up the planner, flips a page and smiles at the camera, warm light, slow push-in"),
  ...opener("youtube", "holding an amber glass serum bottle with a gold cap toward the viewer, three glowing vertical frames of soft light floating around her.", "she raises the bottle toward the camera and smiles, the glowing frames drift around her, slow push-in"),
  ...opener("ugc", "in a cosy room with a ring light glowing behind her, holding a small plain skincare bottle and smiling like she's about to film.", "she lifts the bottle and gives an excited little nod, the ring light glows, slow push-in"),
  ...opener("care", "in a calm, cosy room at night with a warm desk lamp, giving a reassuring smile and a thumbs up.", "she gives a warm reassuring smile and a thumbs up, the lamp glows softly, slow push-in"),
  // Cecily's lines: one per beat.
  ...SHORTS.flatMap((s) => [{ key: `${s.key}-0`, type: "line", say: s.opener.say }, ...s.beats.map((b, i) => ({ key: `${s.key}-${i + 1}`, type: "line", say: b.say }))]),
  { key: "end", type: "line", say: END.say },
  // The new app recordings (record.mjs).
  { key: "looks", type: "screen", screen: { route: "/looks", ready: "Browse store looks", steps: [["wait", 0.6], ["scroll", "Browse store looks"], ["wait", 0.8], ["tap", "Premium 110"], ["wait", 1.6], ["scroll", "Next"], ["wait", 1.2], ["tap", "Beauty"], ["wait", 2.4]] } },
  { key: "store", type: "screen", screen: { store: true, route: "/", ready: "Glow Serum", steps: [["wait", 1.5], ["scroll", "Glow Routine Planner"], ["wait", 2.5], ["scroll", "Silk Sleep Mask"], ["wait", 3]] } },
  { key: "create", type: "screen", screen: { route: "/create", ready: "Need an idea? Start here.", steps: [["wait", 0.8], ["scroll", "Need an idea? Start here."], ["wait", 1.2], ["highlight", "Mini e-book"], ["wait", 1.4], ["scroll", "Mini planner"], ["wait", 2]] } },
  { key: "designs", type: "screen", screen: { route: "/digital-designs", ready: "50 signature designs", steps: [["wait", 1], ["scroll", "The Quiet Advantage"], ["wait", 2.2], ["scroll", "Emerald Signal"], ["wait", 2.2], ["scroll", "The Silverline Launch"], ["wait", 2]] } },
  { key: "care", type: "screen", screen: { route: "/store", ready: "Help", steps: [["wait", 0.8], ["tap", "Help"], ["wait", 1.4], ["tap", "A buyer didn't get their download"], ["wait", 6.5], ["tap", { label: "Message SnapCare" }], ["type", "Can someone also check my payouts?"], ["wait", 0.4], ["tap", { label: "Send" }], ["wait", 6]] } },
];
