// "Start here": a few one-tap questions turn into a personal plan of 4-6 steps, each with the tool to
// open and the Academy lesson that teaches it. Rules, not AI: instant, free and the same every time.
// Visitors can preview a plan before signing up; signed-in people keep theirs on their home screen.
import { db } from "./db.js";
import { httpError } from "./claude.js";

db.exec(`CREATE TABLE IF NOT EXISTS start_plans (
  account_id TEXT PRIMARY KEY, answers TEXT NOT NULL, steps TEXT NOT NULL, done TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

export const QUESTIONS = [
  { id: "level", title: "Where are you starting from?", options: [
    { id: "beginner", label: "Brand new", hint: "I've never sold anything online" },
    { id: "affiliate", label: "Affiliate or creator", hint: "I promote other people's products" },
    { id: "seller", label: "Already selling", hint: "I have a shop or sell on social" },
  ] },
  { id: "sell", title: "What do you want to sell?", options: [
    { id: "own", label: "A product I have", hint: "Something I make, stock or resell" },
    { id: "digital", label: "Digital products", hint: "E-books, planners, guides, printables" },
    { id: "none", label: "I don't know yet", hint: "Help me find something" },
    { id: "others", label: "Other brands' products", hint: "Earn commissions or get paid for videos" },
  ] },
  { id: "face", title: "Are you comfortable on camera?", options: [
    { id: "yes", label: "Yes", hint: "I'm happy to show my face" },
    { id: "no", label: "I'd rather not", hint: "Keep me off camera" },
  ] },
  { id: "audience", title: "Do you have followers already?", options: [
    { id: "none", label: "Not really", hint: "Starting from zero" },
    { id: "small", label: "A few hundred", hint: "Friends, family and some fans" },
    { id: "big", label: "Thousands", hint: "An audience that listens" },
  ] },
  { id: "time", title: "How much time can you give it each week?", options: [
    { id: "few", label: "1–3 hours", hint: "Around a busy schedule" },
    { id: "some", label: "4–10 hours", hint: "A serious side hustle" },
    { id: "lots", label: "10+ hours", hint: "I'm going all in" },
  ] },
];
const VALID = Object.fromEntries(QUESTIONS.map((q) => [q.id, new Set(q.options.map((o) => o.id))]));

// Every step a plan can contain: what to do, why, which screen opens it and which lesson teaches it.
const STEP = {
  welcome: { title: "Watch how Snapfront makes you money", why: "Five minutes that show you the whole path from first product to first sale.", route: "/lesson/welcome", lesson: "welcome", action: "Watch the lesson" },
  niche: { title: "Pick a niche people pay for", why: "Choose who you'll sell to before you make anything, so everything you post speaks to them.", route: "/lesson/niche", lesson: "niche", action: "Watch the lesson" },
  digital: { title: "Make your first digital product", why: "The studio writes and designs it for you. No stock, no shipping, sell it forever.", route: "/create", lesson: "digital", action: "Open the studio" },
  snap: { title: "Snap your product", why: "One photo becomes a full product page with a price and checkout.", route: "/snap", lesson: "physical", action: "Snap a product" },
  store: { title: "Pick your store look", why: "Choose from over 100 designs and add your own cover photo, so strangers trust you.", route: "/storefront-setup", lesson: "premium-store", action: "Choose a look" },
  earn: { title: "Get your Snapfront partner link", why: "Earn a commission every time someone you send joins Snapfront.", route: "/earn", lesson: "partner", action: "Get my link" },
  ugc: { title: "Set up your UGC creator kit", why: "A portfolio, rates and pitches so brands pay you for short videos.", route: "/ugc", lesson: "ugc", action: "Open the kit" },
  faceless: { title: "Post a faceless video", why: "Your product photos, big captions and a natural voice. You never appear on camera.", route: "/faceless", lesson: "faceless", action: "Make a video" },
  avatar: { title: "Create your AI avatar", why: "An original character that presents your products in posts and stories, instead of you.", route: "/avatars", lesson: "faceless", action: "Make an avatar" },
  posts: { title: "Post every day", why: "Ready-made posts with your price and link, plus a fresh idea each morning.", route: "/marketing", lesson: "daily-content", action: "Make a post" },
  live: { title: "Go LIVE on TikTok", why: "Live selling turns viewers into buyers fast. The lesson walks you through your first one.", route: "/lesson/tiktok-live", lesson: "tiktok-live", action: "Watch the lesson" },
  link: { title: "Put your store link everywhere", why: "Link in bio, QR codes and Google Shopping, so people can actually find you.", route: "/channels", lesson: "top-10", action: "Get my links" },
  autodm: { title: "Turn on AutoDM", why: "Someone comments a keyword and Instagram sends them your link automatically.", route: "/autodm", lesson: "autodm", action: "Set it up" },
  email: { title: "Start your email list", why: "Collect buyers' emails and let welcome and win-back emails sell for you.", route: "/email", lesson: "email", action: "Open email" },
  affiliates: { title: "Let fans sell for you", why: "Fans and creators share their own link and earn on each sale.", route: "/affiliates", lesson: "store-affiliates", action: "Start a program" },
  pixels: { title: "Connect your ad pixels", why: "Meta, TikTok and Google learn who buys, so your ads find more buyers.", route: "/pixels", lesson: "ads", action: "Connect pixels" },
  community: { title: "Say hi in the community", why: "Share your store, ask questions and join the live coaching calls.", route: "/community", lesson: null, action: "Open the community" },
};

/** The plan for a set of answers: 4-6 steps in the order to do them. */
export function buildPlan(answers = {}) {
  for (const [k, set] of Object.entries(VALID)) if (!set.has(answers[k])) throw httpError(400, "Answer every question to see your plan.");
  const a = answers;
  const ids = [];
  const add = (...xs) => { for (const x of xs) if (!ids.includes(x)) ids.push(x); };
  if (a.level === "beginner") add("welcome");

  // 1. Something to sell.
  if (a.sell === "others" || (a.level === "affiliate" && a.sell !== "own" && a.sell !== "digital")) add("earn", "ugc");
  else if (a.sell === "none") add("niche", "digital");
  else if (a.sell === "digital") add("digital");
  else add("snap");
  // 2. A store people trust (not needed when you only promote other brands).
  if (a.sell !== "others") add("store");

  // 3. Content that fits how they want to show up.
  if (a.face === "no") add("faceless", ...(a.time !== "few" ? ["avatar"] : []));
  else add("posts", ...(a.time === "lots" ? ["live"] : []));

  // 4. Getting it in front of buyers.
  if (a.audience === "none") add("link");
  else add("autodm");
  if (a.audience === "big" || a.level === "seller") add("email");
  if (a.level === "seller") add("pixels", "affiliates");
  if (a.level === "affiliate" && a.sell !== "others") add("earn");
  add("community");

  // Keep it short enough to finish: busy people get the essentials first.
  const cap = a.time === "few" ? 4 : a.time === "some" ? 5 : 6;
  const keep = ids.slice(0, Math.max(cap - 1, 3));
  if (!keep.includes("community") && ids.includes("community")) keep.push("community");
  const label = { beginner: "beginner", affiliate: "affiliate and creator", seller: "seller" }[a.level];
  const focus = a.sell === "others" ? "earn from other brands" : a.sell === "none" ? "find your first product and sell it" : a.sell === "digital" ? "sell digital products" : "sell your product";
  return {
    title: a.level === "beginner" ? "Your first-sale plan" : a.level === "seller" ? "Your grow-your-sales plan" : "Your plan",
    summary: `A ${label} plan to ${focus}${a.face === "no" ? " without showing your face" : ""}. Do one step at a time, in order.`,
    steps: keep.map((id) => ({ id, ...STEP[id] })),
  };
}

const parse = (s, d) => { try { return JSON.parse(s); } catch { return d; } };
function view(row) {
  if (!row) return null;
  const plan = { ...buildPlan(parse(row.answers, {})) };
  const done = new Set(parse(row.done, []));
  plan.steps = plan.steps.map((s) => ({ ...s, done: done.has(s.id) }));
  return { ...plan, answers: parse(row.answers, {}), done_count: plan.steps.filter((s) => s.done).length, created_at: row.created_at };
}
export const get = (account) => view(db.prepare("SELECT * FROM start_plans WHERE account_id = ?").get(account.id));
/** Save (or redo) someone's plan. Steps they already finished stay ticked if they're still in it. */
export function save(account, answers) {
  buildPlan(answers);   // validates
  const clean = Object.fromEntries(QUESTIONS.map((q) => [q.id, answers[q.id]]));
  db.prepare(`INSERT INTO start_plans (account_id, answers, steps) VALUES (?,?,?)
    ON CONFLICT(account_id) DO UPDATE SET answers = excluded.answers, steps = excluded.steps, updated_at = datetime('now')`)
    .run(account.id, JSON.stringify(clean), JSON.stringify(buildPlan(clean).steps.map((s) => s.id)));
  return get(account);
}
export function setDone(account, stepId, done) {
  const row = db.prepare("SELECT * FROM start_plans WHERE account_id = ?").get(account.id);
  if (!row) throw httpError(404, "Take the Start here quiz first.");
  const set = new Set(parse(row.done, []));
  if (!STEP[stepId]) throw httpError(404, "That step isn't in your plan.");
  if (done) set.add(stepId); else set.delete(stepId);
  db.prepare("UPDATE start_plans SET done = ?, updated_at = datetime('now') WHERE account_id = ?").run(JSON.stringify([...set]), account.id);
  return get(account);
}
export function reset(account) { db.prepare("DELETE FROM start_plans WHERE account_id = ?").run(account.id); return null; }
