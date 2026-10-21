// Website pages for the Claude/ChatGPT connector: the sign-in and approval screens it opens, the
// "Use Snapfront with Claude or ChatGPT" guide (/connect-ai), "Tools that work with Snapfront" (/tools)
// and the page shell for the prompt library (/prompts, built in prompt-library.js).
// Same look as the home page: dark, platinum buttons, Figtree.
import { config } from "./config.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const MCP_URL = () => `${config.publicUrl}/mcp`;
const webApp = () => (config.storeDomain ? `https://app.${config.storeDomain}` : `${config.publicUrl}/app`);

const BASE_CSS = `
:root{--bg:#090B0E;--surface:#14171C;--sunk:#1D2128;--ink:#F5F6F8;--muted:#ADB4BF;--line:#363C46;--platinum:#E5E9F0;--on-platinum:#11151B;--copper:#D99568;--good:#76D8B3;--bad:#FFA89C;color-scheme:dark}
*{box-sizing:border-box}html{background:var(--bg)}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.6 Figtree,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit}.wrap{max-width:1840px;margin:0 auto;padding-inline:clamp(20px,3vw,48px)}
header{padding-block:18px;border-bottom:1px solid rgba(54,60,70,.5)}header .wrap{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:700;font-size:21px;letter-spacing:-.02em}.brand img{width:30px;height:30px}
header nav{display:flex;gap:20px;font-weight:500;font-size:15px;flex-wrap:wrap}header nav a{text-decoration:none;color:var(--muted)}header nav a:hover,header nav a[aria-current]{color:var(--ink)}
h1{font-size:clamp(34px,5vw,54px);line-height:1.05;letter-spacing:-.03em;margin:0 0 16px;text-wrap:balance}
h2{font-size:clamp(24px,3vw,32px);line-height:1.15;letter-spacing:-.02em;margin:0 0 14px;text-wrap:balance}
h3{font-size:19px;margin:0 0 6px;letter-spacing:-.01em}
p{margin:0 0 14px}.lead{font-size:clamp(18px,2vw,21px);color:var(--muted);max-width:62ch}.muted{color:var(--muted)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:12px 24px;border-radius:12px;font:700 16px/1 Figtree,system-ui,sans-serif;text-decoration:none;border:1px solid var(--platinum);background:var(--platinum);color:var(--on-platinum);cursor:pointer}
.btn.ghost{background:transparent;color:var(--ink);border-color:var(--line)}.btn:focus-visible,a:focus-visible,input:focus-visible{outline:2px solid var(--platinum);outline-offset:3px}
section{padding-block:44px;border-top:1px solid rgba(54,60,70,.5)}section:first-of-type{border-top:0}
footer{border-top:1px solid rgba(54,60,70,.5);padding-block:28px;color:var(--muted);font-size:14px}footer .wrap{display:flex;gap:18px;flex-wrap:wrap;justify-content:space-between}footer nav{display:flex;gap:18px;flex-wrap:wrap}
code,.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.92em}
`;
function shell({ title, description, body, current = "", css = "", plain = false }) {
  const nav = plain ? "" : `<nav aria-label="Site"><a href="/">Home</a><a href="/connect-ai"${current === "connect" ? ' aria-current="page"' : ""}>Claude &amp; ChatGPT</a><a href="/prompts"${current === "prompts" ? ' aria-current="page"' : ""}>Prompts</a><a href="/tools"${current === "tools" ? ' aria-current="page"' : ""}>Tools</a><a href="/help"${current === "help" ? ' aria-current="page"' : ""}>Help</a><a href="${webApp()}/sign-in">Sign in</a></nav>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>${description ? `<meta name="description" content="${esc(description)}">` : ""}
<meta name="theme-color" content="#090B0E"><meta name="color-scheme" content="dark"><link rel="icon" href="/site/mark.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;700;800&display=swap">
<style>${BASE_CSS}${css}</style></head><body>
<header><div class="wrap"><a class="brand" href="/"><img src="/site/mark.png" alt="" width="30" height="30">snapfront</a>${nav}</div></header>
<main>${body}</main>
${plain ? "" : `<footer><div class="wrap"><span>© ${new Date().getFullYear()} Snapfront · support@snapfront.app</span><nav><a href="/help">Help</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/delete-account">Delete account</a></nav></div></footer>`}
</body></html>`;
}

/* ---------- the sign-in and approval screens the connector opens ---------- */
const CONNECT_CSS = `
main{padding-block:40px 64px}.card{max-width:480px;margin:0 auto;background:var(--surface);border:1px solid var(--line);border-radius:22px;padding:28px}
.card h1{font-size:28px;margin-bottom:8px}.who{display:flex;align-items:center;gap:12px;margin-bottom:18px;color:var(--muted);font-size:15px}
.who b{color:var(--ink)}.site{display:inline-block;padding:2px 10px;border-radius:999px;background:var(--sunk);color:var(--ink);font-weight:600}
label{display:block;font-weight:700;margin:18px 0 6px}input{font:inherit;width:100%;padding:13px 14px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink)}
.code{letter-spacing:.3em;font-size:22px;text-align:center}.err{color:var(--bad);font-weight:600;margin-top:14px}
.btn{width:100%;margin-top:18px}.row{display:grid;gap:10px;grid-template-columns:1fr 1fr;margin-top:8px}.row .btn{margin-top:10px}
ul.can{margin:12px 0 0;padding:0;list-style:none;display:grid;gap:8px}ul.can li{padding-left:26px;position:relative}ul.can li::before{content:"";position:absolute;left:4px;top:.55em;width:10px;height:10px;border-radius:50%;background:var(--good)}
ul.cannot li::before{background:var(--line)}.small{font-size:14px;color:var(--muted);margin-top:16px}
@media(max-width:420px){.card{padding:22px}.row{grid-template-columns:1fr}}`;
export function connectPage({ step, rid, app, site, email, error, message, consent, stores = [] }) {
  const appName = esc(app || "Your AI assistant");
  const intro = `<div class="who"><span>Connecting <b>${appName}</b> to Snapfront${site ? ` · returns to <span class="site">${esc(site)}</span>` : ""}</span></div>`;
  let inner;
  if (step === "error") inner = `<h1>Can't connect</h1><p class="muted">${esc(message)}</p><p class="small">Help: <a href="/connect-ai">Use Snapfront with Claude or ChatGPT</a></p>`;
  else if (step === "email") inner = `${intro}<h1>Sign in to Snapfront</h1><p class="muted">Use the email you joined Snapfront with. We'll email you a 6-digit code.</p>
<form method="post" action="/oauth/authorize/email"><input type="hidden" name="rid" value="${esc(rid)}"><label for="e">Email</label><input id="e" name="email" type="email" required autocomplete="email" value="${esc(email || "")}" autofocus>
${error ? `<p class="err" role="alert">${esc(error)}</p>` : ""}<button class="btn">Email me a code</button></form>
<p class="small">No account yet? <a href="${webApp()}/sign-in">Create one in Snapfront</a> first, then come back.</p>`;
  else if (step === "code") inner = `${intro}<h1>Enter your code</h1><p class="muted">If a Snapfront account uses <b>${esc(email)}</b>, we just sent it a 6-digit code. It works for 15 minutes.</p>
<form method="post" action="/oauth/authorize/code"><input type="hidden" name="rid" value="${esc(rid)}"><label for="c">6-digit code</label><input id="c" class="code" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 ]{6,8}" maxlength="8" required autofocus>
${error ? `<p class="err" role="alert">${esc(error)}</p>` : ""}<button class="btn">Continue</button></form>
<form method="post" action="/oauth/authorize/email"><input type="hidden" name="rid" value="${esc(rid)}"><input type="hidden" name="email" value="${esc(email)}"><button class="btn ghost">Send a new code</button></form>`;
  else inner = `${intro}<h1>Allow ${appName} to work on your store?</h1><p class="muted">Signed in as <b>${esc(email)}</b>${stores.length ? ` · ${stores.length === 1 ? esc(stores[0]) : `${stores.length} stores`}` : ""}.</p>
<p style="margin:16px 0 0;font-weight:700">It will be able to</p><ul class="can"><li>Read your stores, products and store look</li><li>Check your store for problems and preview new designs privately</li><li>Change your store's look and words, and product words, prices and photos</li><li>Create draft products and make faceless videos</li></ul>
<p style="margin:16px 0 0;font-weight:700">It can't</p><ul class="can cannot"><li>Publish or delete products, or see buyers' details</li><li>Change payments, payouts or your membership</li></ul>
<form method="post" action="/oauth/authorize/decision"><input type="hidden" name="rid" value="${esc(rid)}"><input type="hidden" name="consent" value="${esc(consent)}">
<div class="row"><button class="btn ghost" name="decision" value="deny">Cancel</button><button class="btn" name="decision" value="allow">Allow</button></div></form>
<p class="small">Changes to a live store show to buyers right away. You can disconnect anytime in Snapfront: Settings, Connected AI apps.</p>`;
  return shell({ title: "Connect to Snapfront", body: `<div class="wrap"><div class="card">${inner}</div></div>`, css: CONNECT_CSS, plain: true });
}

/* ---------- /connect-ai: the guide ---------- */
const GUIDE_CSS = `
.hero{padding-block:56px 36px}.urlbox{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:22px;padding:10px 10px 10px 18px;border:1px solid var(--line);border-radius:16px;background:var(--surface);max-width:620px}
.urlbox code{flex:1 1 220px;font-size:18px;word-break:break-all;color:var(--ink)}.urlbox .btn{min-height:42px;padding:8px 18px;font-size:15px}
.grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}.grid.four{grid-template-columns:repeat(auto-fit,minmax(210px,1fr))}@media(min-width:620px) and (max-width:899px){.grid.four{grid-template-columns:1fr 1fr}}
.panel{background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:24px;min-width:0}
ol.steps{margin:14px 0 0;padding:0;list-style:none;counter-reset:s;display:grid;gap:12px}
ol.steps li{counter-increment:s;display:grid;grid-template-columns:32px 1fr;gap:12px;align-items:start}
ol.steps li::before{content:counter(s);display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--sunk);border:1px solid var(--line);font-weight:700;font-size:14px}
.k{display:inline-block;padding:0 8px;border-radius:7px;background:var(--sunk);border:1px solid var(--line);font-weight:600;font-size:.92em;white-space:nowrap}
.prompts{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
.prompt{border:1px solid var(--line);border-radius:16px;padding:16px 18px;background:linear-gradient(180deg,var(--surface),var(--bg))}.prompt b{display:block;font-size:13px;color:var(--copper);letter-spacing:.04em;margin-bottom:6px}
.note{border-left:3px solid var(--copper);padding:4px 0 4px 16px;color:var(--muted);max-width:70ch}
ul.plain{margin:10px 0 0;padding-left:20px}ul.plain li{margin-bottom:6px}
.tut{margin:0 0 22px;max-width:1100px}.tut video{display:block;width:100%;aspect-ratio:16/9;height:auto;border-radius:20px;border:1px solid var(--line);background:#000}
.tut figcaption{margin-top:10px;font-size:15px;color:var(--muted)}`;
export function connectAiPage() {
  const url = MCP_URL();
  const body = `<div class="wrap">
<section class="hero"><h1>Use Snapfront with Claude or ChatGPT</h1>
<p class="lead">Connect Snapfront once, then ask your own assistant to check your store, try new designs, write product pages and make faceless videos. It runs on your Claude or ChatGPT plan.</p>
<div class="urlbox"><code id="u">${esc(url)}</code><button class="btn" type="button" id="copy">Copy link</button></div>
<p class="muted" style="margin-top:10px">This is the connector link you'll paste in.</p></section>

<section><h2>What your assistant can do</h2><div class="grid four">
<div class="panel"><h3>Look and fix</h3><p class="muted">Read your stores and products, and check them for problems that cost sales, like missing photos or files, short descriptions or payments not set up.</p></div>
<div class="panel"><h3>Design</h3><p class="muted">Pick from every Snapfront store look, write your headline and About, and show you a private preview link before anything changes.</p></div>
<div class="panel"><h3>Products and sales</h3><p class="muted">Draft new products, rewrite descriptions, set prices and a crossed-out original price, and use a picture from a link as a product or cover photo.</p></div>
<div class="panel"><h3>Faceless videos</h3><p class="muted">Write the script for a product and have Snapfront make the vertical video with your product photos, captions and a voiceover.</p></div>
</div>
<p class="note" style="margin-top:20px">It can't publish or delete products, see your buyers' details, or touch payments and your membership. Changes to a live store show to buyers right away, so your assistant should tell you what it's about to change. Ask it to preview first.</p></section>

<section id="claude"><h2>Connect Claude</h2><figure class="tut"><video controls preload="none" playsinline poster="/site/tutorials/connect-claude.jpg" aria-label="Video: how to connect Snapfront to Claude"><source src="/site/tutorials/connect-claude.mp4" type="video/mp4"></video>
<figcaption>Watch it first: connecting Snapfront to Claude, step by step (1 minute). The Claude screens are illustrations, so yours may look a little different. Presented by an AI avatar.</figcaption></figure><div class="grid">
<div class="panel"><h3>Free, Pro and Max plans</h3><ol class="steps">
<li><span>On <a href="https://claude.ai">claude.ai</a> or in the Claude app, open <span class="k">Customize</span> then <span class="k">Connectors</span>.</span></li>
<li><span>Click <span class="k">Add custom connector</span>. Name it <b>Snapfront</b> and paste <code>${esc(url)}</code> as the URL.</span></li>
<li><span>If it asks how Claude should identify itself, keep <b>Use Claude's published identity</b> (or choose <b>Register automatically</b>). You don't need a client ID or secret. Click <span class="k">Add</span>.</span></li>
<li><span>Click <span class="k">Connect</span>. A Snapfront page opens: enter your Snapfront email, then the 6-digit code we email you, then tap <span class="k">Allow</span>.</span></li>
<li><span>In a chat, click <span class="k">+</span>, open <span class="k">Connectors</span> and make sure Snapfront is on.</span></li></ol>
<p class="muted" style="margin-top:14px">The Free plan allows one custom connector.</p></div>
<div class="panel"><h3>Team and Enterprise plans</h3><ol class="steps">
<li><span>An Owner opens <span class="k">Organization settings</span> then <span class="k">Connectors</span>, clicks <span class="k">Add</span>, then <span class="k">Custom</span>, and pastes the Snapfront link.</span></li>
<li><span>Each person then goes to <span class="k">Customize</span>, <span class="k">Connectors</span>, finds Snapfront and clicks <span class="k">Connect</span> to sign in with their own Snapfront email.</span></li></ol>
<p class="muted" style="margin-top:14px">Claude asks before each tool runs. Choose <b>Always allow</b> only for the read tools if you like to approve every change.</p></div>
</div></section>

<section id="chatgpt"><h2>Connect ChatGPT</h2><figure class="tut"><video controls preload="none" playsinline poster="/site/tutorials/connect-chatgpt.jpg" aria-label="Video: how to connect Snapfront to ChatGPT"><source src="/site/tutorials/connect-chatgpt.mp4" type="video/mp4"></video>
<figcaption>Watch it first: connecting Snapfront to ChatGPT, step by step (1 minute). The ChatGPT screens are illustrations, so yours may look a little different. Presented by an AI avatar.</figcaption></figure><div class="panel"><ol class="steps">
<li><span>In ChatGPT on the web, open <span class="k">Settings</span>, then <span class="k">Apps &amp; Connectors</span>, then <span class="k">Advanced settings</span>, and turn on <span class="k">Developer mode</span>. On Business and Enterprise plans an admin may need to allow it first.</span></li>
<li><span>Back in <span class="k">Apps &amp; Connectors</span>, click <span class="k">Create</span>. Name it <b>Snapfront</b>, paste <code>${esc(url)}</code>, and set Authentication to <b>OAuth</b>.</span></li>
<li><span>Sign in on the Snapfront page that opens with your email and the 6-digit code, then tap <span class="k">Allow</span>, and finish with <span class="k">Create</span>.</span></li>
<li><span>In a new chat, click <span class="k">+</span>, then <span class="k">More</span>, choose <span class="k">Developer mode</span> and pick Snapfront.</span></li></ol>
<p class="note" style="margin-top:18px">OpenAI decides which plans can use custom connectors and whether they can make changes or only read. On some plans ChatGPT can only use Snapfront's read tools (like checking your store). ChatGPT's menu names also change often: if one doesn't match, look for Connectors or Apps in Settings.</p></div></section>

<section><h2>Things to ask</h2><p class="muted" style="margin-bottom:16px">Want more? The <a href="/prompts">prompt library</a> has hundreds of full prompts to copy, many written for the Snapfront connector.</p><div class="prompts">
<div class="prompt"><b>Check my store</b>Check my Snapfront store and list the three changes that would help sales most. Fix the product descriptions for me after I say yes.</div>
<div class="prompt"><b>Redesign</b>Show me three Snapfront store looks that fit a cozy candle shop, preview the best one with a new headline, and wait for my OK before changing the live store.</div>
<div class="prompt"><b>Sale</b>Put my two best sellers on a fall sale: 20% off, with the current price shown crossed out as the original price.</div>
<div class="prompt"><b>Faceless video</b>Write a 30-second faceless video script for my recipe e-book in a problem-then-solution style, then make the video with the Bella voice.</div>
<div class="prompt"><b>New product idea</b>I want to sell a printable wedding planner. Draft the product in Snapfront with a description, five selling points, an FAQ and a price around $15.</div>
<div class="prompt"><b>Use another app's picture</b>Use the picture at this link as the photo for my Meal Prep Guide: (paste a link from another app or connector)</div>
</div></section>

<section><h2>Disconnect or troubleshoot</h2><ul class="plain">
<li>To disconnect, open Snapfront, go to <b>Settings</b>, then <b>Connected AI apps</b>, and tap <b>Disconnect</b>. You can also remove the connector in Claude or ChatGPT.</li>
<li>If sign-in fails, remove the connector in your assistant and add it again with the exact link above.</li>
<li>If you have more than one store, tell your assistant which store to work on. It can list them.</li>
<li>Faceless videos take a few minutes. Ask your assistant to check on the video, or find it in Snapfront under Faceless videos.</li>
<li>More tools that pair well with Snapfront are on the <a href="/tools">tools page</a>. Questions? Email support@snapfront.app.</li></ul></section>
</div>
<script>(function(){var b=document.getElementById("copy"),u=document.getElementById("u");b.addEventListener("click",function(){var t=u.textContent;function done(){b.textContent="Copied";setTimeout(function(){b.textContent="Copy link"},2000)}
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,select)}else select();function select(){var r=document.createRange();r.selectNodeContents(u);var s=getSelection();s.removeAllRanges();s.addRange(r)}})})();</script>`;
  return shell({ title: "Use Snapfront with Claude or ChatGPT", description: "Connect Snapfront to Claude or ChatGPT so your own assistant can check your store, design it, write product pages and make faceless videos.", body, current: "connect", css: GUIDE_CSS });
}

/* ---------- /tools ---------- */
const TOOLS = [
  { name: "Claude", site: "claude.ai", href: "https://claude.ai", kind: "AI assistant", what: "Anthropic's assistant. Add the Snapfront connector and it can check your store, try new looks, write product pages and make faceless videos.", how: "Connect it with the guide", guide: "/connect-ai#claude" },
  { name: "ChatGPT", site: "chatgpt.com", href: "https://chatgpt.com", kind: "AI assistant", what: "OpenAI's assistant. Add Snapfront as a custom connector in Developer mode; on some plans it can only use the read tools.", how: "Connect it with the guide", guide: "/connect-ai#chatgpt" },
  { name: "Eromify", site: "eromify.com", href: "https://www.eromify.com/mcp", kind: "AI influencers and avatars", what: "Trains custom AI models and makes realistic influencer-style images and videos. It has its own MCP connector, so you can add it to the same Claude or ChatGPT chat as Snapfront and ask for a picture, then have Snapfront use it as a product or cover photo.", how: "Eromify's connector page", note: "Check Eromify's terms for selling and ad use, and label AI people as AI where a platform asks you to." },
  { name: "Canva", site: "canva.com", href: "https://www.canva.com", kind: "Graphics", what: "Make sale banners, flyers and social graphics. Download as PNG or JPG and upload it in Snapfront as a cover or product photo.", how: "Open Canva" },
  { name: "CapCut", site: "capcut.com", href: "https://www.capcut.com", kind: "Video editing", what: "Trim, add music and extra captions to the faceless and AI videos you make in Snapfront before posting them.", how: "Open CapCut" },
  { name: "Stripe", site: "stripe.com", href: "https://stripe.com", kind: "Payments (built in)", what: "Buyers pay you through Stripe and the money goes straight to your account. Connect it in Snapfront: Settings, Connect Stripe.", how: "Stripe's site" },
  { name: "CJdropshipping", site: "cjdropshipping.com", href: "https://cjdropshipping.com", kind: "Suppliers (built in)", what: "Find products to sell without holding stock; CJ ships each order. Connect it in Snapfront: Settings, Suppliers.", how: "CJ's site" },
  { name: "Printful", site: "printful.com", href: "https://www.printful.com", kind: "Print on demand (built in)", what: "Sell your own designs on shirts, mugs and more, printed and shipped for each order. Connect it in Snapfront: Settings, Suppliers.", how: "Printful's site" },
];
const TOOLS_CSS = `
.hero{padding-block:56px 30px}.tools{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));padding-bottom:20px}
.tool{display:flex;flex-direction:column;gap:6px;background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:22px;min-width:0}
.tool .kind{font-size:13px;font-weight:700;color:var(--copper);letter-spacing:.04em}.tool h2{font-size:24px;margin:0}.tool .site{font-size:14px;color:var(--muted)}
.tool p{color:var(--muted);margin:6px 0 0}.tool .warn{font-size:14px;border-left:2px solid var(--line);padding-left:12px}
.tool .links{display:flex;gap:10px;flex-wrap:wrap;margin-top:auto;padding-top:14px}.tool .btn{min-height:42px;padding:8px 18px;font-size:15px}
.fine{color:var(--muted);font-size:14px;max-width:72ch;padding-bottom:48px}`;
export function toolsPage() {
  const cards = TOOLS.map((t) => `<article class="tool"><span class="kind">${esc(t.kind)}</span><h2>${esc(t.name)}</h2><span class="site">${esc(t.site)}</span><p>${esc(t.what)}</p>${t.note ? `<p class="warn">${esc(t.note)}</p>` : ""}
<div class="links">${t.guide ? `<a class="btn" href="${esc(t.guide)}">${esc(t.how)}</a><a class="btn ghost" href="${esc(t.href)}" rel="noopener" target="_blank">Open ${esc(t.name)}</a>` : `<a class="btn ghost" href="${esc(t.href)}" rel="noopener" target="_blank">${esc(t.how)}</a>`}</div></article>`).join("");
  const body = `<div class="wrap"><section class="hero"><h1>Tools that work with Snapfront</h1>
<p class="lead">Apps that pair well with your store. Start with the Snapfront connector for Claude or ChatGPT, then add the others where they help.</p>
<p style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap"><a class="btn" href="/connect-ai">Use Snapfront with Claude or ChatGPT</a><a class="btn ghost" href="/prompts">Browse the prompt library</a></p></section>
<div class="tools">${cards}</div>
<p class="fine">Snapfront isn't affiliated with these companies. Their prices, plans and rules are their own, so check them before you sign up. Built in means Snapfront connects to it for you.</p></div>`;
  return shell({ title: "Tools that work with Snapfront", description: "Claude, ChatGPT, Eromify, Canva, CapCut and the suppliers built into Snapfront: what each is for and how it works with your store.", body, current: "tools", css: TOOLS_CSS });
}

/* ---------- /prompts (the body comes from prompt-library.js) ---------- */
export function promptsShell(body, { count, css }) {
  return shell({ title: `${count} prompts for Claude and ChatGPT | Snapfront`, description: `${count} full, copy-and-paste prompts for Claude and ChatGPT: digital products, your Snapfront store, short videos, AI agents, side hustles, money, health and career.`, body, current: "prompts", css });
}

/* ---------- /help (the body comes from help-page.js) ---------- */
export function helpShell(body, { css }) {
  return shell({ title: "Help and FAQ | Snapfront", description: "How Snapfront works: what each feature does, how to set it up and where to find it, with a glossary.", body, current: "help", css });
}
