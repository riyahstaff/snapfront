const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
function helpers() {
  const filename = path.join(root, "src/lib/social-publishing.ts");
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${output}\n})`, { filename })((id) => { throw new Error(`Unexpected dependency ${id}`); }, module, module.exports);
  return module.exports;
}

test("strict local scheduling rejects rollover, past, and overlong dates while retaining exact local/UTC feedback", () => {
  const h = helpers();
  const now = new Date(2026, 9, 12, 12, 0, 0);
  assert.equal(h.parseStrictLocalSchedule("2026-02-31", "10:00", now).ok, false);
  assert.match(h.parseStrictLocalSchedule("2026-10-12", "12:00", now).error, /future/i);
  assert.match(h.parseStrictLocalSchedule("2027-02-01", "10:00", now).error, /within 90 days/i);
  const planned = h.parseStrictLocalSchedule("2026-10-13", "14:30", now);
  assert.equal(planned.ok, true);
  assert.match(planned.utc, /Z$/);
  assert.ok(planned.local.length > 0 && planned.timeZone.length > 0);
  const local = new Date(planned.publishAt);
  assert.equal(local.getFullYear(), 2026); assert.equal(local.getMonth(), 9); assert.equal(local.getDate(), 13);
  assert.equal(local.getHours(), 14); assert.equal(local.getMinutes(), 30);
});

test("scheduling reads everyday dates and 12-hour times (AM/PM), and still accepts 24-hour", () => {
  const h = helpers();
  const now = new Date(2026, 9, 12, 12, 0, 0);
  const at = (date, time) => { const r = h.parseStrictLocalSchedule(date, time, now); assert.equal(r.ok, true, `${date} ${time}: ${r.error}`); const d = new Date(r.publishAt); return [d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()]; };
  assert.deepEqual(at("10/13/2026", "2:30 PM"), [10, 13, 14, 30]);
  assert.deepEqual(at("10/13/2026", "2:30pm"), [10, 13, 14, 30]);
  assert.deepEqual(at("10/13/2026", "2 p.m."), [10, 13, 14, 0]);
  assert.deepEqual(at("10/13/2026", "12:15 AM"), [10, 13, 0, 15]);
  assert.deepEqual(at("10/13/2026", "12:15 PM"), [10, 13, 12, 15]);
  assert.deepEqual(at("10/13/2026", "9:05 am"), [10, 13, 9, 5]);
  assert.deepEqual(at("2026-10-13", "14:30"), [10, 13, 14, 30]);
  for (const bad of ["13:00 PM", "0:30 AM", "2:60 PM", "noon", ""]) assert.equal(h.parseStrictLocalSchedule("10/13/2026", bad, now).ok, false, bad);
  assert.equal(h.parseStrictLocalSchedule("2/31/2027", "2:00 PM", now).ok, false, "no rolled-over dates");
  assert.match(h.parseStrictLocalSchedule("13/45/2026", "2 PM", now).error, /real date/);
  assert.match(h.parseStrictLocalSchedule("10/13", "2 PM", now).error, /10\/20\/2026.*2:30 PM/);
  // The review shows 12-hour time.
  assert.match(h.parseStrictLocalSchedule("10/13/2026", "2:30 PM", now).local, /2:30\s?PM/);

  // The AM/PM buttons: added to a plain time; a typed AM/PM or a 24-hour time wins.
  assert.equal(h.withMeridiem("2:30", "PM"), "2:30 PM");
  assert.equal(h.withMeridiem(" 9 ", "AM"), "9 AM");
  assert.equal(h.withMeridiem("2:30 am", "PM"), "2:30 am");
  assert.equal(h.withMeridiem("14:30", "AM"), "14:30");
  assert.equal(h.withMeridiem("0:30", "PM"), "0:30");
  assert.equal(h.withMeridiem("", "PM"), "");
});

test("frozen publishing payloads are ordered, materially fingerprinted, and require protected media", () => {
  const h = helpers();
  const render = { kind: "carousel", render_id: "render_store_a_1", files: [{ file: "one.jpg", url: "https://example.test/one.jpg" }, { file: "two.jpg", url: "https://example.test/two.jpg" }] };
  const payload = h.frozenPayload(render, "Exact caption", ["page-b", "page-a"], "2026-10-13T18:30:00.000Z");
  assert.deepEqual(payload.account_ids, ["page-a", "page-b"]);
  const sameAccountsDifferentOrder = { ...payload, account_ids: ["page-b", "page-a"] };
  assert.equal(h.publishingFingerprint(payload), h.publishingFingerprint(sameAccountsDifferentOrder));
  assert.notEqual(h.publishingFingerprint(payload), h.publishingFingerprint({ ...payload, caption: "Edited caption" }));
  assert.equal(h.frozenPayload({ ...render, render_id: undefined }, "Exact caption", ["page-a"], null), null);
  assert.equal(h.canPublishRenderedPost(render, "post"), true);
  assert.equal(h.canPublishRenderedPost(render, "story"), false, "Stories remain manual export only");
  assert.equal(h.canPublishRenderedPost({ ...render, kind: "reel" }, "story"), true, "Vertical Reels use the native Reel route");
  const key = h.createIdempotencyKey();
  assert.match(key, /^sf_/); assert.ok(key.length <= 72);
});

test("store ownership guards drop stale async results and old social routes remain a graceful manual-export fallback", () => {
  const h = helpers();
  assert.equal(h.ownsStoreResponse({ storeId: "store-a", revision: 4 }, { storeId: "store-a", revision: 4 }), true);
  assert.equal(h.ownsStoreResponse({ storeId: "store-a", revision: 4 }, { storeId: "store-b", revision: 5 }), false);
  assert.equal(h.ownsStoreResponse({ storeId: "store-a", revision: 4 }, { storeId: "store-a", revision: 5 }), false);
  assert.equal(h.isOlderSocialBackend({ status: 404 }), true);
  assert.equal(h.isOlderSocialBackend({ status: 500 }), false);
  assert.equal(h.isAllowedMetaPermalink("https://www.instagram.com/p/example/"), true);
  assert.equal(h.isAllowedMetaPermalink("http://facebook.com/not-secure"), false);
  assert.equal(h.isAllowedMetaPermalink("https://facebook.example.test/post"), false);
});

test("API source binds marketing and social reads/mutations to an explicit initiating store", () => {
  const source = fs.readFileSync(path.join(root, "src/lib/api.ts"), "utf8");
  assert.match(source, /postCopy: \(input: \{ product_id: string; platform: "instagram" \| "facebook" \| "tiktok"; offer\?: string; tone\?: string \}, storeId\?: string\)/);
  assert.match(source, /renderPost: \(input: \{ product_id: string; kind: PostKind; template: string; format: PostFormat; copy: Partial<PostCopy>; offer\?: string; image_url\?: string \}, storeId\?: string\)/);
  assert.match(source, /products: \(storeId\?: string\) => request<Product\[]>\("GET", "\/api\/products", undefined, storeId\)/);
  assert.match(source, /socialAccounts: \(storeId\?: string\) => request<SocialAccounts>\("GET", "\/api\/social\/accounts", undefined, storeId\)/);
  assert.match(source, /createSocialPosts: \(input: SocialPublishInput, storeId\?: string\) => request<SocialPosts>\("POST", "\/api\/social\/posts", input, storeId\)/);
});

test("publishing review is scrollable, frozen media is visible, and status reads cannot overwrite newer mutations", () => {
  const source = fs.readFileSync(path.join(root, "src/components/social-publishing.tsx"), "utf8");
  assert.ok(source.includes("mediaUrls: renderedPost.files.map"));
  assert.ok(source.includes('<FrozenReel key={confirmation.mediaUrls[0]} url={confirmation.mediaUrls[0]} />'));
  assert.ok(source.includes("nativeControls contentFit=\"contain\""));
  assert.ok(source.includes('maxHeight: "90%"'));
  assert.ok(source.includes("request !== readGeneration.current"));
  assert.ok(source.includes("setPollAttempt((value) => value + 1)"), "a quiet failure still advances bounded polling");
  assert.ok(source.includes("standard Page video post, not a Facebook Reel"));
  assert.ok(source.includes("caption.trim().length > 2200"));
});
