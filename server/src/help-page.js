// The help centre (/help): plain answers to what each Snapfront feature is, why you'd use it, how it
// works and where to find it, plus a glossary. Every answer is written from what the app really does;
// when a feature changes, change its answer here (the tests check the links and the structure).
import zlib from "node:zlib";
import { config } from "./config.js";
import { vierraTag } from "./vierra-widget.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const webApp = () => (config.storeDomain ? `https://app.${config.storeDomain}` : `${config.publicUrl}/app`);

// `where` is [label, path in the web app] so people can jump straight there ([label, path, "site"] for a
// page on snapfront.app itself). Links inside answers use
// [text](/path) for site pages or [text](app:/path) for app pages.
export const SECTIONS = [
  { id: "start", name: "Getting started", items: [
    { q: "What is Snapfront?", a: "Snapfront is an app for starting and running an online store. It writes your product pages from a photo, gives you a storefront with checkout, makes posts and short videos to promote it, and connects to suppliers who ship products for you. It also has lessons (the Academy) and a members' community.\n\nIt works in your browser on a phone or computer at app.snapfront.app, and as an Android app.", where: ["Home", "/"] },
    { q: "Do I need experience, my own products or followers?", a: "No. Everything starts as a draft that Snapfront writes for you to check and change. You can sell digital products you make in Snapfront, products from suppliers like CJdropshipping, Printful or AliExpress, or your own stock. You don't need followers to start, but people can only buy what they see, so plan to share your store: Snapfront makes the posts and videos, and posting them is your part." },
    { q: "What can I do for free, and what needs membership?", a: "A free account lets you try the tools: build a store, write a few AI product pages, try price checks and photo cleanup, and make a few marketing posts. Publishing your store so buyers can pay, connecting Stripe and the bigger AI allowances come with Snapfront membership (Pro).", where: ["Membership", "/plans"] },
    { q: "How do I sign in or sign out?", a: "Sign in with your email: Snapfront emails you a 6-digit code, so there's no password to remember. To sign out on the website, open the menu at the top right and choose Sign out. In the app, open Settings and tap Sign out in the Sign in section.", where: ["Sign in", "/sign-in"] },
    { q: "Can I run more than one store?", a: "Yes. Pro includes up to 10 stores on one account. Each store has its own products, look and address. Your stores share one Stripe account, so a new store can take payments straight away. Switch stores at the top of My store." },
    { q: "Where's the Android app?", a: "It's on Google Play: search for Snapfront. The app and the website use the same account, so sign in with the same email and everything is there. Membership bought in either place works in both." },
  ] },
  { id: "store", name: "Your store", items: [
    { q: "How do I create a product?", a: "Open Snap a product, take or choose a photo, say whether it's a physical item or a digital download, and tap Build product page. Snapfront writes the title, description, selling points, FAQ and a suggested price. You check the draft, change anything you like, and add it to your store. You can also add a product by hand from My store.", where: ["Snap a product", "/snap"] },
    { q: "What's the difference between a draft and a live product?", a: "A draft is only visible to you while you work on it. A live product shows in your store and can be bought. You choose when a product goes live. Publishing needs Snapfront membership and Stripe connected, so buyers can pay you." },
    { q: "What's the difference between a physical and a digital product?", a: "A physical product is something that gets shipped, like a candle or a T-shirt. You set shipping in Settings, and you (or your supplier) send it. A digital product is a file the buyer downloads straight after paying, like an e-book, planner or template. There's nothing to ship." },
    { q: "How do I change how my store looks?", a: "Open Store look to pick from more than 100 designs, each made for a kind of shop. Then use Storefront setup (with Mira, the design assistant) to change the headline, cover picture, words and logo. You can preview a look before you switch.", where: ["Store look", "/looks"] },
    { q: "What's my store's web address, and can I use my own domain?", a: "Every store gets a free address on snapfront.app, shown in Settings and at the top of My store. With Pro you can use a domain you own, like shop.yourstore.com: buy one from any domain company, type it in Settings under Your own domain, then add the one record Snapfront shows you at your domain company. Settings shows when it's working; that can take from a few minutes to a few hours.", where: ["Settings", "/settings"] },
    { q: "How do I show a sale price with the old price crossed out?", a: "Open the product and fill in Original price with the price you normally charge. Your store shows the original price crossed out next to the current price. Only use a real price you've charged or will charge again." },
    { q: "How do sizes, colors and stock work?", a: "On a product, open Stock and options. Add options like sizes or colors, each with its own price and stock if you need. When stock reaches zero, buyers see it's sold out. Leave stock empty if you don't want to track it." },
    { q: "How do discount codes work?", a: "Open Discount codes and create a code, like WELCOME15. Choose a percentage or a fixed amount off, and optionally a minimum order, a maximum number of uses and an end date. Buyers type the code at checkout.", where: ["Discount codes", "/discounts"] },
    { q: "What are bundles and subscriptions?", a: "A bundle sells several of your products together at one price. A subscription charges buyers every month or year, for example a monthly planner drop or a membership. Set both up in Bundles and subscriptions.", where: ["Bundles and subscriptions", "/store-offers"] },
    { q: "How do reviews work?", a: "After an order, Snapfront can email the buyer asking for a review. Only real buyers can leave one. New reviews show on your product page straight away, and you can hide any review in Reviews.", where: ["Reviews", "/reviews"] },
    { q: "Where do I see and manage orders?", a: "Open Orders. Each order shows what was bought, the buyer's details and the shipping address, its status, and for supplier products whether it's been sent to the supplier.", where: ["Orders", "/orders"] },
  ] },
  { id: "paid", name: "Getting paid", items: [
    { q: "How do buyers pay me?", a: "Buyers pay at checkout through Stripe, with a card or, on devices that support them, Apple Pay or Google Pay. The money goes straight into your own Stripe account, not to Snapfront. Connect Stripe in Settings under Payments: Stripe asks for your details and a bank account so it can pay you out.", where: ["Settings", "/settings"] },
    { q: "Does Snapfront take a cut of my sales?", a: "No. Snapfront doesn't charge fees on your sales. Stripe charges its standard card processing fee on each payment, and you can see those fees in Sales and profit." },
    { q: "When do I get my money?", a: "Stripe pays your money into your bank account on its payout schedule, usually a few days after each sale. Open your Stripe dashboard from Settings, under Payments, to see your balance and payouts." },
    { q: "How do I refund a buyer?", a: "Refunds are made in your Stripe dashboard: find the payment and choose Refund. Your refund policy is up to you, so write it clearly in your product FAQs." },
    { q: "How do I set shipping and tax?", a: "In Settings, under Shipping and tax, set a flat shipping price, an order amount above which shipping is free, the countries you ship to, and whether to collect sales tax at checkout (Stripe works out the tax). Check with a tax professional about what you need to collect where you live." },
    { q: "Where can I see my profit?", a: "Open Sales and profit. It shows your sales, discounts, refunds, Stripe fees, product costs and any expenses you add, and the net profit you keep. Add what each product costs you on the product, so the profit is right.", where: ["Sales and profit", "/business"] },
  ] },
  { id: "digital", name: "Digital products", items: [
    { q: "How do I make a digital product?", a: "Open Digital products. Pick an idea from hundreds of ready-made ones (planners, guides, workbooks, recipe books and more) or describe your own. Snapfront writes it, lays it out with a design you choose, and makes the PDF. You can edit every page in the designer before you sell it.", where: ["Digital products", "/create"] },
    { q: "How do buyers get their download?", a: "Right after paying, the buyer sees a confirmation page with their download, and gets an email with the same links. If a download link has expired, they can open the confirmation page from the email again to get a fresh one." },
    { q: "Can I sell a file I already made?", a: "Yes. Create a digital product and, under Download link, paste a link to your file, for example a Google Drive or Dropbox share link. Buyers get that link after paying. It must start with https://, and the file must be shared so anyone with the link can open it." },
    { q: "What's the Digital photo studio for?", a: "It makes pictures for digital products, like mockups that show your planner on a tablet or your e-book as a printed book, so buyers can see what they're getting.", where: ["Digital photo studio", "/digital-photo-studio"] },
  ] },
  { id: "suppliers", name: "Suppliers and finding products", items: [
    { q: "What does Find products do?", a: "Find shows products you can sell without holding stock. Choose CJdropshipping, Printful or AliExpress, search or paste a link, and add a product to your store. When a buyer orders it, Snapfront sends the order to your supplier account, and the supplier ships it to your buyer.", where: ["Find products", "/find"] },
    { q: "How do I connect CJdropshipping?", a: "Create a free CJdropshipping account. Then in CJ, open My CJ, then Authorization, then API, and generate an API key. Paste it in Snapfront under Settings, then Suppliers, then CJdropshipping. It takes about 2 minutes.", where: ["Settings", "/settings"] },
    { q: "How do I connect Printful?", a: "1. In Printful, add a store for Snapfront: open Stores, choose Add store, then pick Manual order platform / API.\n2. Add your designs to that store as products.\n3. Open Printful's Developer Portal (developers.printful.com), go to Your tokens and create a private token for that store, with the Orders and Sync products permissions.\n4. Copy the token straight away (Printful only shows it once) and paste it in Snapfront: Find, then Printful, or Settings, then Suppliers.\n\nTokens have an expiry date. When yours expires, make a new one and paste it in again.", where: ["Find products", "/find"] },
    { q: "How do I connect AliExpress, and why does it take a few days?", a: "AliExpress only lets apps order on your behalf through its Open Platform, and it reviews new developers first (usually 2 to 5 working days).\n1. Use an AliExpress account with your shipping details and a payment method saved.\n2. Register as a developer on the AliExpress Open Platform (openservice.aliexpress.com) with that account.\n3. Once you're approved, create an app of the Dropshipping type.\n4. Set the app's Callback URL to the address Snapfront shows you.\n5. Paste the App Key and App Secret in Snapfront and tap Save and authorize.\n6. Approve Snapfront on the AliExpress page that opens.\nAfter that, paste any AliExpress product link in Find to add it to your store.", where: ["Find products", "/find"] },
    { q: "Who pays the supplier, and what's auto-pay?", a: "You do. The supplier charges your own supplier account for each order (your CJ wallet, the card on your Printful account, or your AliExpress payment method). You keep the difference between your price and their cost. With auto-pay on, orders are paid and shipped straight away. With it off, orders wait in your supplier account until you pay for them there." },
    { q: "What is Price check?", a: "Price check finds what the same item sells for at big stores like Amazon, Walmart and Target, from a supplier screenshot or a photo. It then suggests a price that beats them. Add what the item costs you to see your profit.", where: ["Price check", "/price-check"] },
    { q: "What's the Supplier directory?", a: "A list of supplier companies you could use, with what each is good at, how fast they ship and which ones Snapfront connects to directly.", where: ["Supplier directory", "/sources"] },
  ] },
  { id: "creative", name: "Photos, videos and AI", items: [
    { q: "What does Product photo cleanup do?", a: "It makes new versions of a physical product's photo: a plain background in a colour you pick, or a scene like marble, wood or a kitchen counter. Your original photo stays until you choose to use a new one. AI can change small details, so check the product still looks right first. Open it from a product, or open Product photo cleanup and pick the product.", where: ["Product photo cleanup", "/studio"] },
    { q: "What's in AI photos and video?", a: "Lifestyle photos that show your product in a real-life scene with people, and short video clips made from your product photo. Choose the scene and the AI model; some premium models use credits.", where: ["AI photos and video", "/ai-media"] },
    { q: "What are faceless videos?", a: "Short vertical videos for TikTok, Reels and Shorts that use your product photos, words on screen and an AI voiceover, so you never have to film yourself. Pick a product and a style, check the script Snapfront writes, and it makes the video in a few minutes.", where: ["Faceless videos", "/faceless"] },
    { q: "What are AI avatars?", a: "An AI-made person or character that can present your products in photos and talking videos, so your content has a face that isn't yours. Avatar videos and talking avatars use credits. Label AI people as AI where a platform asks you to.", where: ["AI avatars", "/avatars"] },
    { q: "What are credits?", a: "Credits pay for the premium AI videos: avatar videos and talking avatars. Buy them in packs; they never expire, and if a video fails, its credits come back. Everything else in Snapfront uses your plan's monthly allowances instead.", where: ["Credits", "/credits"] },
  ] },
  { id: "marketing", name: "Marketing and buyers", items: [
    { q: "How do marketing posts work?", a: "Pick a product and a platform (Instagram, Facebook or TikTok), and Snapfront writes the post and makes the picture. Copy it to post yourself, or connect your Instagram and Facebook accounts to publish or schedule posts from Snapfront.", where: ["Marketing posts", "/marketing"] },
    { q: "What is Instagram AutoDM?", a: "AutoDM sends a direct message automatically when someone comments a keyword on your Instagram post. For example, a comment of LINK gets your product link sent to them. It needs an Instagram professional (business or creator) account connected in Marketing. Each person gets a reply once a day per keyword, and Instagram only allows replies within 7 days of the comment.", where: ["Instagram AutoDM", "/autodm"] },
    { q: "How does email marketing work?", a: "Add a sign-up form to your store to collect emails, then send newsletters and offers. You can also turn on automatic emails: a welcome email, a thank-you after a purchase, and a win-back email for buyers who haven't ordered in a while. Snapfront also sends review requests and checkout reminders.", where: ["Email marketing", "/email"] },
    { q: "What are ad pixels and do I need them?", a: "A pixel is a small code from an ad platform (Meta, TikTok, Google Analytics, Pinterest) that tells it when people visit your store and buy. You only need one if you run ads. Paste the pixel ID in Ad pixels and Snapfront adds it to your store for you.", where: ["Ad pixels", "/pixels"] },
    { q: "What's in Get more buyers?", a: "A link-in-bio page for your Instagram or TikTok bio, a QR code to print on packaging or a market stall sign, and a Google product feed that lists your products for free in Google Shopping.", where: ["Get more buyers", "/channels"] },
    { q: "How do affiliates work?", a: "Affiliates are people who share your products for a commission. Turn on your affiliate program, set the commission and how long a click counts, and invite people. Each affiliate gets their own link. You pay affiliates yourself (PayPal, Venmo or bank transfer), then mark them paid in Snapfront.", where: ["Affiliates", "/affiliates"] },
    { q: "What's the UGC creator kit?", a: "UGC (user-generated content) means videos and photos that creators make for brands. The kit helps you get paid brand work: a portfolio, scripts, pitch messages and a list of places brands hire creators.", where: ["UGC creator kit", "/ugc"] },
    { q: "Where do I see how my store is doing?", a: "Insights shows visitors, where they came from, which products they looked at and how many bought. Sales and profit shows the money side.", where: ["Insights", "/insights"] },
  ] },
  { id: "ai", name: "Claude, ChatGPT and the store assistant", items: [
    { q: "What does the Claude and ChatGPT connector do?", a: "It lets your own Claude or ChatGPT assistant work on your store: check it for problems, try new looks with a private preview, write and update product pages, set prices and sale prices, draft new products and make faceless videos. You connect it once with your Snapfront email. It runs on your Claude or ChatGPT plan.", where: ["How to connect", "/connect-ai", "site"] },
    { q: "What can't the connector do?", a: "It can't publish or delete products, see your buyers' details, or touch payments and your membership. Changes to a live store show to buyers right away, so ask your assistant to show you a preview first." },
    { q: "Where do I find prompts to use with it?", a: "The prompt library has 1,000 prompts to copy into Claude or ChatGPT, many written for the Snapfront connector. Fill in the parts in [BRACKETS] with your own details.", where: ["Prompt library", "/prompts", "site"] },
    { q: "How do I disconnect Claude or ChatGPT?", a: "In Snapfront, open Settings, then Connected AI apps, and tap Disconnect. You can also remove the connector inside Claude or ChatGPT.", where: ["Settings", "/settings"] },
    { q: "What's the store assistant?", a: "A chat inside Snapfront (with Pro) that can research what's selling, write and design digital products, edit listings, set prices and stock, create discount codes and check your orders. You ask in plain words.", where: ["Store assistant", "/assistant"] },
  ] },
  { id: "learn", name: "Academy, community and earning", items: [
    { q: "What's in the Academy?", a: "Short video lessons on building your store, making content, going live and earning more. Each one ends with a button that opens the tool it talks about, so you can do it straight away.", where: ["Academy", "/academy"] },
    { q: "What's the community?", a: "A members' space inside Snapfront where you can post wins and questions, get feedback on your store, climb the leaderboard and join live coaching calls.", where: ["Community", "/community"] },
    { q: "How does Earn with Snapfront work?", a: "Share your own Snapfront link. When someone you send buys Snapfront within 60 days of first using your link, you earn a commission: 40% of a Lifetime sale, or a set amount every month they pay for Monthly. You're paid about 4 days after a website sale, or about 45 days after a Google Play sale, to your Stripe or PayPal. Say you earn a commission whenever you share the link.", where: ["Earn", "/earn"] },
  ] },
  { id: "billing", name: "Membership and billing", items: [
    { q: "How much is Snapfront?", a: "Snapfront Pro is $299 once for life (Lifetime) or $69 a month (Monthly). Both include everything: publishing up to 10 stores, payments with no fees on your sales, the bigger AI allowances, the store assistant and the Android app. The prices shown in Membership are the current ones.", where: ["Membership", "/plans"] },
    { q: "What are the monthly allowances?", a: "Each plan includes a number of AI actions every month, like AI product pages, digital products, price checks, photo edits, marketing posts, lifestyle photos and video clips. Membership and each tool show how many you have left. Free accounts get a small number to try things." },
    { q: "How do I cancel Monthly?", a: "On the website, open Membership and choose Manage subscription. If you subscribed in the Android app, cancel in Google Play under Subscriptions. Monthly keeps working until the end of the month you've paid for. When it ends, your stores stop taking orders until you renew.", where: ["Membership", "/plans"] },
    { q: "Can I get a refund?", a: "All sales are final, for membership and for credits. That's why there's a free account: try the tools before you pay. If you think you were charged by mistake, email support@snapfront.app with the email you used and the date. Refunds to your own buyers are up to you, made in your Stripe dashboard." },
  ] },
  { id: "account", name: "Account, privacy and support", items: [
    { q: "How do I delete my account or one store?", a: "In Settings, under About, tap Delete my account. That removes your account and every store, product and photo for good. Your Stripe account and past payouts aren't affected. To remove just one store, tap Delete this store only. You can also delete your account from the website at snapfront.app/delete-account.", where: ["Settings", "/settings"] },
    { q: "What do you do with my data?", a: "Snapfront keeps what it needs to run your store, and it never sells your data. The privacy policy says exactly what's stored and which services are used (for example Stripe for payments and Resend for emails).", link: ["Privacy policy", "/privacy"] },
    { q: "How do I get help?", a: "Email support@snapfront.app with your store's address and what happened (a screenshot helps). For how-to questions, the Academy and this page are the fastest answers." },
  ] },
];

export const GLOSSARY = [
  ["Affiliate", "Someone who shares your products with their own link and earns a commission on the sales they bring."],
  ["Announcement banner", "The thin strip across the top of your store, for things like Free shipping over $50."],
  ["Auto-pay", "A supplier setting. When it's on, orders are paid from your supplier account straight away so they ship without waiting."],
  ["AutoDM", "An automatic Instagram direct message sent when someone comments a keyword on your post."],
  ["Average order value", "Your total sales divided by the number of orders. It shows how much a typical buyer spends."],
  ["Bundle", "Several products sold together at one price."],
  ["Chargeback", "When a buyer asks their bank to reverse a card payment. Stripe handles it and tells you how to respond."],
  ["Checkout", "The page where a buyer enters their details and pays. Snapfront uses Stripe Checkout."],
  ["CNAME record", "The setting you add at your domain company so your own domain points to your Snapfront store."],
  ["Connector", "A link between an AI assistant (Claude or ChatGPT) and Snapfront that lets the assistant work on your store. It's also called an MCP connector."],
  ["Conversion rate", "The share of visitors who buy. 100 visitors and 2 orders is a 2% conversion rate."],
  ["Credits", "What you spend on premium AI videos (avatar videos and talking avatars). They never expire."],
  ["Custom domain", "A web address you own, like shop.yourstore.com, used instead of the free snapfront.app address."],
  ["Digital product", "A file buyers download after paying, like an e-book, planner or template."],
  ["Draft", "A product that only you can see. It isn't for sale until you make it live."],
  ["Dropshipping", "Selling products that a supplier ships straight to your buyer, so you don't keep stock."],
  ["Faceless video", "A short video made from your product photos, words on screen and an AI voice, with no one on camera."],
  ["Hero", "The big section at the top of your store with the headline, cover picture and main button."],
  ["Lead magnet", "Something free, like a checklist, that people get in return for joining your email list."],
  ["Link in bio", "One page with your store and links, made for the single link Instagram and TikTok let you put in your profile."],
  ["Live", "A product that's in your store and can be bought."],
  ["Mira", "Snapfront's storefront design assistant, in Storefront setup."],
  ["Original price", "The usual price, shown crossed out next to a lower sale price."],
  ["Payout", "Money Stripe sends from your Stripe balance to your bank account."],
  ["Physical product", "Something that gets shipped to the buyer."],
  ["Pixel", "A small piece of code from an ad platform that measures visits and sales from your ads."],
  ["Print on demand", "Your designs printed on a product (like a shirt or mug) only after someone orders it. Printful does this."],
  ["Product feed", "A list of your products in a format Google Shopping reads, so they can show up in Google for free."],
  ["Prompt", "The instructions you type or paste into an AI assistant like Claude or ChatGPT."],
  ["SKU", "A short code you give a product or option so you can tell them apart, like CANDLE-8OZ."],
  ["Store look", "The design of your store: layout, colours, fonts and style. Also called a theme."],
  ["Stripe", "The payment company that takes card payments for your store and pays the money into your bank."],
  ["Subscription", "A product buyers pay for every month or year."],
  ["Supplier", "A company that makes or stocks products and ships them for you, like CJdropshipping, Printful or AliExpress."],
  ["UGC", "User-generated content: photos and videos made by creators or customers instead of the brand."],
  ["Variant", "One version of a product, like a size or colour, which can have its own price and stock."],
];

const linkify = (s) => esc(s).replace(/\[([^\]]+)\]\((app:)?(\/[^)\s]*)\)/g, (_m, text, app, path) => `<a href="${esc(app ? webApp() + path : path)}">${text}</a>`);
const para = (s) => s.split(/\n{2,}/).map((p) => {
  const lines = p.split("\n");
  if (lines.every((l) => /^\d+\. /.test(l))) return `<ol>${lines.map((l) => `<li>${linkify(l.replace(/^\d+\. /, ""))}</li>`).join("")}</ol>`;
  if (lines.length > 1 && /^\d+\. /.test(lines[1])) return `<p>${linkify(lines[0])}</p><ol>${lines.slice(1).map((l) => `<li>${linkify(l.replace(/^\d+\. /, ""))}</li>`).join("")}</ol>`;
  return `<p>${linkify(lines.join(" "))}</p>`;
}).join("");
export const qid = (q) => q.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);

export const HELP_CSS = `
.hero{padding-block:56px 22px}.hero .lead{max-width:66ch}
.ask{display:flex;gap:18px;align-items:center;justify-content:space-between;flex-wrap:wrap;max-width:760px;margin-top:22px;padding:18px 20px;border-radius:18px;border:1px solid rgba(255,170,60,.35);background:linear-gradient(135deg,rgba(255,178,58,.10),rgba(242,97,58,.06))}
.ask b{display:block;font-size:18px;margin-bottom:2px}.ask p{margin:0;color:var(--muted);max-width:52ch}
.ask .btn{background:linear-gradient(135deg,#FFC24A,#FF8A2B);border-color:transparent;color:#2A1405}
.bar{position:sticky;top:0;z-index:5;background:rgba(9,11,14,.94);backdrop-filter:blur(8px);border-block:1px solid rgba(54,60,70,.5);padding-block:14px;margin-top:18px}
.bar input{width:100%;font:inherit;font-size:16px;padding:12px 14px;border-radius:12px;border:1px solid var(--line);background:var(--surface);color:var(--ink)}
.layout{display:grid;grid-template-columns:240px minmax(0,1fr);gap:48px;align-items:start;padding-block:28px 40px}
.toc{position:sticky;top:96px;display:flex;flex-direction:column;gap:2px;font-size:15px}
.toc a{text-decoration:none;color:var(--muted);padding:7px 10px;border-radius:8px}.toc a:hover{color:var(--ink);background:var(--surface)}
.sec{padding:0 0 26px;border:0;scroll-margin-top:96px}.sec h2{font-size:26px;margin:0 0 12px}
.q{border:1px solid var(--line);border-radius:14px;background:var(--surface);margin-bottom:10px;scroll-margin-top:96px}
.q summary{cursor:pointer;list-style:none;padding:16px 46px 16px 18px;font-weight:700;font-size:17px;line-height:1.35;position:relative}
.q summary::-webkit-details-marker{display:none}
.q summary::after{content:"+";position:absolute;right:18px;top:13px;font-size:22px;font-weight:500;color:var(--muted)}
.q[open] summary::after{content:"\\2212"}
.q .ans{padding:0 18px 16px;color:#D5DAE1;max-width:72ch}.q .ans p{margin:0 0 10px}.q .ans ol{margin:0 0 10px;padding-left:22px}.q .ans li{margin-bottom:4px}
.where{display:inline-flex;gap:8px;align-items:center;font-size:14px;margin-top:4px;color:var(--muted)}.where a{color:var(--ink);font-weight:600}
.q:target{border-color:var(--platinum)}
dl{display:grid;grid-template-columns:minmax(150px,220px) minmax(0,1fr);gap:0;margin:0;border:1px solid var(--line);border-radius:14px;overflow:hidden}
dt,dd{margin:0;padding:12px 16px;border-top:1px solid var(--line)}dt{font-weight:700;background:var(--surface)}dd{color:#D5DAE1}
dt:first-of-type,dt:first-of-type+dd{border-top:0}
.none{color:var(--muted);padding:20px 0}
.contact{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:20px;margin-top:10px}
@media(max-width:900px){.layout{grid-template-columns:1fr;gap:12px}.toc{position:static;flex-direction:row;flex-wrap:wrap;gap:6px}.toc a{border:1px solid var(--line);font-size:14px}}
@media(max-width:560px){dl{grid-template-columns:1fr}dd{border-top:0;padding-top:0;background:var(--surface)}dt{padding-bottom:4px}}`;

const HELP_JS = `(function(){var q=document.getElementById("hq"),items=[].slice.call(document.querySelectorAll(".q")),secs=[].slice.call(document.querySelectorAll(".sec")),terms=[].slice.call(document.querySelectorAll("dt")),none=document.getElementById("hnone");
var text=items.map(function(d){return d.textContent.toLowerCase()});
function apply(){var w=q.value.toLowerCase().split(/\\s+/).filter(Boolean),n=0;items.forEach(function(d,i){var ok=w.every(function(x){return text[i].indexOf(x)>=0});d.hidden=!ok;if(ok)n++;if(w.length&&ok)d.open=true});
terms.forEach(function(t){var dd=t.nextElementSibling,ok=w.every(function(x){return (t.textContent+" "+dd.textContent).toLowerCase().indexOf(x)>=0});t.hidden=dd.hidden=!ok;if(ok)n++});
secs.forEach(function(s){s.hidden=!s.querySelector(".q:not([hidden]),dt:not([hidden])")});none.hidden=n>0}
var t;q.addEventListener("input",function(){clearTimeout(t);t=setTimeout(apply,120)});
function route(){var h=decodeURIComponent(location.hash.slice(1)),el=h&&document.getElementById(h);if(el&&el.tagName==="DETAILS"){el.open=true;setTimeout(function(){el.scrollIntoView({block:"start"})},0)}}
window.addEventListener("hashchange",route);route()})();`;

export function helpBody() {
  const count = SECTIONS.reduce((n, s) => n + s.items.length, 0);
  const toc = SECTIONS.map((s) => `<a href="#${s.id}">${esc(s.name)}</a>`).join("") + `<a href="#glossary">Glossary</a><a href="#contact">Contact support</a>`;
  const sections = SECTIONS.map((s) => `<section class="sec" id="${s.id}"><h2>${esc(s.name)}</h2>${s.items.map((it) => {
    const where = it.where ? `<p class="where">Where: <a href="${esc(it.where[2] === "site" ? it.where[1] : webApp() + it.where[1])}">${esc(it.where[0])}</a></p>` : it.link ? `<p class="where">Read: <a href="${esc(it.link[1])}">${esc(it.link[0])}</a></p>` : "";
    return `<details class="q" id="${qid(it.q)}"><summary>${esc(it.q)}</summary><div class="ans">${para(it.a)}${where}</div></details>`;
  }).join("")}</section>`).join("");
  const glossary = `<section class="sec" id="glossary"><h2>Glossary</h2><dl>${GLOSSARY.map(([t, d]) => `<dt id="term-${qid(t)}">${esc(t)}</dt><dd>${esc(d)}</dd>`).join("")}</dl></section>`;
  return `<div class="wrap"><section class="hero"><h1>Help and FAQ</h1>
<p class="lead">How Snapfront works: what each feature does, why you'd use it, how to set it up and where to find it. ${count} answers, plus a glossary of the words you'll see.</p>
${vierraTag() ? `<div class="ask"><div><b>Rather just ask?</b><p>Talk to Vierra, our voice guide. She knows everything on this page and the app, and she'll tell you the quickest way to do it.</p></div><button class="btn" type="button" data-open-vierra>Ask Vierra</button></div>` : ""}</section></div>
<div class="bar"><div class="wrap"><input id="hq" type="search" placeholder="Search help: Stripe, AutoDM, Printful, refunds…" aria-label="Search help" autocomplete="off"></div></div>
<div class="wrap"><div class="layout"><nav class="toc" aria-label="Help topics">${toc}</nav><div>
<p class="none" id="hnone" hidden>No answers match that. Try a shorter word, or email support@snapfront.app.</p>
${sections}${glossary}
<section class="sec" id="contact"><h2>Contact support</h2><div class="contact"><p>Email <b>support@snapfront.app</b> with your store's address, what you were doing and what happened. A screenshot helps. We answer as soon as we can.</p>
<p style="margin:0">Using Claude or ChatGPT with Snapfront? See <a href="/connect-ai">the connector guide</a> and <a href="/prompts">the prompt library</a>.</p></div></section>
</div></div></div><script>${HELP_JS}</script>`;
}

let cache = null;
/** The page and its gzip and brotli versions, made once. */
export function helpPage(render) {
  if (!cache) {
    const html = Buffer.from(render(helpBody()));
    cache = { html, gzip: zlib.gzipSync(html, { level: 9 }), br: zlib.brotliCompressSync(html) };
  }
  return cache;
}
