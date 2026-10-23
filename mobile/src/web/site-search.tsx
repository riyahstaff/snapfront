import React, { useId, useState } from "react";
import { router, type Href } from "expo-router";
import { fonts, useColors } from "@/lib/theme";

import { useMe } from "@/lib/account-store";

const pages = [
  ["My store", "/store", "Manage your store and products", "dashboard inventory shop products"],
  ["Store look & themes", "/looks", "Choose your store’s design", "themes colors fonts appearance templates design"],
  ["Storefront setup & Mira", "/storefront-setup", "Customize your storefront with Mira", "hero pictures images text logo ai assistant"],
  ["Bundles & subscriptions", "/store-offers", "Sell bundles and recurring memberships", "bundle subscription recurring monthly yearly offers"],
  ["Email marketing", "/email", "Build your list and send emails", "email capture subscribers newsletter welcome automation list signup campaign"],
  ["Orders", "/orders", "View and manage customer orders", "purchases customers shipping fulfillment tracking"],
  ["Sales & profit", "/business", "Track your store’s performance", "revenue earnings expenses money reports tax"],
  ["Create a product", "/snap", "Start a new product listing", "upload photo snap add product sell"],
  ["Digital products", "/create", "Create digital products to sell", "ebook download course planner printable ideas cooking finance tutorials 500"],
  ["Find products", "/find", "Discover products for your store", "sourcing search products dropshipping"],
  ["Marketing posts", "/marketing", "Create and publish promotional posts", "social media facebook instagram advertising schedule content"],
  ["Instagram AutoDM", "/autodm", "Automate Instagram messages", "automatic dm direct messages comments replies"],
  ["Affiliates", "/affiliates", "Let partners promote your products", "affiliate commission referral partners"],
  ["Ad pixels", "/pixels", "Connect advertising tracking", "facebook meta tiktok google analytics pixel"],
  ["Academy", "/academy", "Learn how to grow your business", "tutorials lessons courses training help learning"],
  ["Bonus: 1k Prompts", "/prompts", "1,000 prompts to send to Claude or ChatGPT", "prompts claude chatgpt ai bonus copy library ideas"],
  ["UGC creator kit", "/ugc", "Find brand work and manage creator deals", "insense joinbrands ugc portfolio scripts pitches brands"],
  ["Faceless videos", "/faceless", "Create videos without appearing on camera", "youtube shorts faceless video"],
  ["Help & support", "/support", "Chat with SnapCare: it checks your account and fixes common problems", "help support problem broken bug contact snapcare chat"],
  ["YouTube Shorts", "/youtube", "Post your videos straight to your YouTube channel", "youtube shorts post upload channel publish"],
  ["Create an Avatar", "/avatars", "Design your avatar and create photos or talking videos", "ai avatars talking avatar spokesperson presenter character face blend"],
  ["AI photos & video", "/ai-media", "Generate images and video", "ai image photo video generator models"],
  ["Credits", "/credits", "Check and buy generation credits", "balance top up tokens credits"],
  ["Community", "/community", "Connect with other store owners", "members discussions coaching discord whop"],
  ["Earn with Snapfront", "/earn", "Refer people to Snapfront", "snapfront referral affiliate earn commission"],
  ["Get more buyers", "/channels", "Connect sales channels", "buyers shopping channels traffic"],
  ["Insights", "/insights", "Explore your store’s analytics", "visitors views conversion stats analytics"],
  ["Reviews", "/reviews", "Manage customer reviews", "ratings testimonials feedback stars"],
  ["Suppliers", "/sources", "Browse the supplier directory", "suppliers wholesale vendors sourcing"],
  ["Discount codes", "/discounts", "Create offers for your customers", "coupon promo discounts sale"],
  ["Account & store settings", "/settings", "Manage your account and store details", "password email address payments stripe payout settings profile"],
  ["Membership", "/plans", "View your Snapfront plan", "billing upgrade cancel plan pro launch membership"],
  ["Product photo cleanup", "/studio", "Improve your product photos", "background remove cleanup studio"],
  ["Digital photo studio", "/digital-photo-studio", "Create digital product imagery", "digital photos mockup studio"],
  ["Digital designs", "/digital-designs", "Manage your digital designs", "saved designs graphics"],
];

export function SiteSearch() {
  const c = useColors();
  const id = useId();
  const me = useMe();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const available = me?.owner ? [...pages, ["AI Marketing Center (owner)", "/marketing-center", "Plan and publish Snapfront campaigns", "admin video social blog seo calendar analytics"]] : pages;
  const results = available.map((page) => {
    const title = page[0].toLowerCase();
    const searchable = `${title} ${page[2]} ${page[3]}`.toLowerCase();
    const score = terms.every((term) => searchable.includes(term)) ? terms.reduce((n, term) => n + (title.includes(term) ? 3 : 1), 0) : -1;
    return { page, score };
  }).filter(({ score }) => score >= 0).sort((a, b) => b.score - a.score).slice(0, 7);
  const visit = (href: string) => { setOpen(false); setQuery(""); setActive(0); router.push(href as Href); };
  return <div style={{ position: "relative", width: "100%", maxWidth: 640, fontFamily: fonts.body }} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${open ? c.accent : c.line}`, borderRadius: 12, background: c.surface, padding: "0 12px" }}>
      <span aria-hidden="true" style={{ color: c.muted, fontSize: 20 }}>⌕</span>
      <input role="combobox" aria-label="Search tools and pages" aria-expanded={open} aria-controls={`${id}-results`} aria-autocomplete="list" aria-activedescendant={open && results.length ? `${id}-${active}` : undefined}
        placeholder="Search tools and pages…" value={query} onFocus={() => setOpen(true)}
        onChange={(event) => { setQuery(event.target.value); setActive(0); setOpen(true); }}
        onKeyDown={(event) => {
          if (event.key === "Escape") { setOpen(false); event.preventDefault(); }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); setActive((n) => results.length ? (n + (event.key === "ArrowDown" ? 1 : -1) + results.length) % results.length : 0); }
          if (event.key === "Enter" && open && results[active]) { event.preventDefault(); visit(results[active].page[1]); }
        }} style={{ width: "100%", minWidth: 0, height: 42, border: 0, outline: "none", background: "transparent", color: c.ink, fontFamily: fonts.body, fontSize: 15 }} />
      {query ? <button aria-label="Clear search" onClick={() => { setQuery(""); setActive(0); }} style={{ background: "none", border: 0, color: c.muted, cursor: "pointer", padding: 8 }}>✕</button> : null}
    </div>
    {open ? <div style={{ position: "absolute", top: 50, left: 0, right: 0, zIndex: 100, background: c.bg, border: `1px solid ${c.line}`, borderRadius: 14, boxShadow: "0 16px 48px rgba(0,0,0,.3)", padding: 6, maxHeight: "60vh", overflowY: "auto" }}>
      <div style={{ padding: "8px 10px", color: c.muted, fontSize: 12 }}>{terms.length ? "Matching pages" : "Popular destinations"}</div>
      <div id={`${id}-results`} role="listbox" aria-label="Pages">
        {results.map(({ page }, index) => <button key={page[1]} id={`${id}-${index}`} role="option" aria-selected={active === index} onMouseEnter={() => setActive(index)} onClick={() => visit(page[1])}
          style={{ display: "block", width: "100%", border: 0, borderRadius: 8, padding: "12px 10px", textAlign: "left", cursor: "pointer", background: active === index ? c.sunk : "transparent", color: c.ink, fontFamily: fonts.body }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{page[0]} <span aria-hidden="true" style={{ float: "right" }}>→</span></div>
          <div style={{ fontSize: 13, color: c.muted, marginTop: 4 }}>{page[2]}</div>
        </button>)}
      </div>
      {!results.length ? <div role="status" style={{ padding: 14, color: c.muted, fontSize: 14 }}>No matching pages. Try “email,” “themes,” “orders,” or “videos.”</div> : null}
    </div> : null}
  </div>;
}
