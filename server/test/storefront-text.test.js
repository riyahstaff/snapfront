import { test } from "node:test";
import assert from "node:assert/strict";
import { linkedDescription } from "../src/storefront-text.js";

test("Amazon short links are clickable and sentence punctuation stays outside the link", () => {
  const html = linkedDescription("Get the coloring book here:\nhttps://a.co/d/03F3C84Y.\n\nThank you!");
  assert.equal(html, '<p>Get the coloring book here:\n<a href="https://a.co/d/03F3C84Y" target="_blank" rel="noopener noreferrer ugc">https://a.co/d/03F3C84Y</a>.</p><p>Thank you!</p>');
});

test("links preserve query parameters and balanced parentheses without swallowing surrounding text", () => {
  const html = linkedDescription("(https://example.com/book_(color)?tag=tavi&edition=1), or www.amazon.com/dp/ABC. Next.");
  assert.match(html, /href="https:\/\/example.com\/book_\(color\)\?tag=tavi&amp;edition=1"/);
  assert.match(html, /<\/a>\), or /);
  assert.match(html, /href="https:\/\/www.amazon.com\/dp\/ABC"/);
  assert.match(html, /<\/a>\. Next\.<\/p>$/);
});

test("seller HTML stays escaped and executable or credential-bearing URLs are never links", () => {
  const html = linkedDescription('<img src=x onerror="alert(1)"> javascript:alert(1) data:text/html,bad https://user:password@example.com/path https://example.com/?q=<script>bad</script>');
  assert.doesNotMatch(html, /<img|<script|href="(?:javascript:|data:|https:\/\/user)/);
  assert.match(html, /&lt;img/);
  assert.match(html, /href="https:\/\/example.com\/\?q="/);
});
