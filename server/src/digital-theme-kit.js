import { defineTheme } from './category-theme-kit.js';

/** Shared accessible behavior; the genre modules own their composition and design tokens. */
export function createDigitalTheme(spec, composition, layoutCss) {
  const theme = defineTheme(spec);
  const scope = `.th-${theme.id}`;
  const hero = (ctx) => {
    const links = ctx.cats.slice(0, 3).map((cat, i) => `<a href="${ctx.esc(ctx.categoryLink(cat.name))}"><small>${String(i + 1).padStart(2, '0')}</small> ${ctx.esc(cat.name)} <span aria-hidden="true">↗</span></a>`).join('');
    return `<section class="hero category-hero dg-hero dg-${composition}${ctx.heroClass}"${ctx.heroAttrs}><div class="dg-top"><span>${ctx.esc(ctx.store.store_name)}</span><span aria-hidden="true">✦</span><a href="#shop">Explore collection ↗</a></div><div class="dg-grid"><div class="dg-copy">${ctx.copy()}</div><div class="dg-image">${ctx.media(0, { priority: true, lazy: false })}</div>${links ? `<nav class="dg-side" aria-label="Browse collections">${links}</nav>` : ''}</div>${ctx.controls}</section>`;
  };
  const discovery = (ctx) => {
    if (!ctx.products.length) return '';
    return `<section class="theme-discovery dg-discovery wrap" aria-label="Featured resources"><div class="dg-discovery-head"><span>${ctx.esc(ctx.store.store_name)}</span><h2>${ctx.esc(ctx.t.copy.collection)}</h2><a href="#shop">View all ↗</a></div><div class="dg-resources">${ctx.products.slice(0, 3).map((p, i) => `<a class="dg-resource" href="${ctx.esc(ctx.productLink(p))}"><span class="dg-number" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><div><small>${ctx.esc(p.category || '')}</small><h3>${ctx.esc(p.title)}</h3><p>${ctx.esc(ctx.money(p.price_cents, p.currency)+(p.billing_interval ? " / "+p.billing_interval : ""))}</p></div><span aria-hidden="true">↗</span></a>`).join('')}</div></section>`;
  };
  const scoped = layoutCss.replace(/(^|})([^{}]+){/g, (_, end, selector) => `${end}${selector.split(',').map(s => `${scope} ${s.trim()}`).join(',')}{`);
  const css = `
${scope} .dg-hero{position:relative;isolation:isolate;overflow:hidden;padding:24px clamp(20px,5vw,90px) 64px;background:var(--bg);color:var(--ink)}
${scope} .dg-top{display:flex;align-items:center;justify-content:space-between;gap:20px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;border-bottom:1px solid var(--line);padding-bottom:18px;margin-bottom:40px}
${scope} .dg-top a{text-decoration:none;letter-spacing:0;font-size:12px}
${scope} .dg-grid{display:grid;align-items:center;gap:32px;position:relative;max-width:1500px;margin:auto}
${scope} .dg-grid>*{min-width:0}
${scope} .dg-copy .txt{padding:0;position:relative;max-width:none;background:none;color:inherit}
${scope} .dg-copy h1{font:var(--dw) clamp(48px,6.4vw,102px)/1.01 var(--display);letter-spacing:-.045em;overflow-wrap:anywhere;text-wrap:balance}
${scope} .dg-copy h1.long{font-size:clamp(38px,5.1vw,78px)}
${scope} .dg-copy .eyebrow{font-size:11px;letter-spacing:.13em;text-transform:uppercase;margin-bottom:26px;color:var(--muted)}
${scope} .dg-copy .sub{font-size:clamp(16px,1.5vw,20px);line-height:1.65;color:var(--muted);max-width:48ch;margin:24px 0}
${scope} .dg-copy .ctas{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}
${scope} .dg-image{height:510px;overflow:hidden;position:relative;background:var(--surface)}
${scope} .dg-image .hero-media{width:100%;height:100%;object-fit:cover}
${scope} .dg-image .theme-empty-media{min-height:100%}
${scope} .dg-side a{display:block;text-decoration:none;padding:10px 0;overflow-wrap:anywhere}
${scope} .dg-side small{opacity:.6;margin-right:10px;font:11px var(--body)}
${scope} .dg-discovery{padding-top:65px;padding-bottom:65px}
${scope} .dg-discovery-head{display:flex;justify-content:space-between;align-items:center;gap:24px;margin-bottom:26px;flex-wrap:wrap}
${scope} .dg-discovery-head>span{font-size:11px;text-transform:uppercase;letter-spacing:.1em}
${scope} .dg-discovery-head h2{font-size:clamp(28px,3vw,45px)}
${scope} .dg-resources{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
${scope} .dg-resource{display:flex;align-items:flex-start;gap:18px;text-decoration:none;padding:28px 18px;border-top:1px solid var(--line);background:var(--surface)}
${scope} .dg-resource>div{min-width:0;flex:1}
${scope} .dg-resource h3{font-size:26px;margin:14px 0;overflow-wrap:anywhere}
${scope} .dg-resource small{font-size:11px;color:var(--muted)}
${scope} .dg-number{font:22px var(--display);color:var(--muted)}
${scoped}
@keyframes dg-enter{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes dg-pan{from{transform:scale(1.08) translateX(-1.5%)}to{transform:scale(1.08) translateX(1.5%)}}
@keyframes dg-drift{from{transform:scale(1.06) translateY(-1%)}to{transform:scale(1.06) translateY(1%)}}
@media(prefers-reduced-motion:no-preference){
${scope} .dg-copy h1{animation:dg-enter .85s both}
${scope} .dg-hero[data-hero-motion="pan"] .hero-media{animation:dg-pan 16s ease-in-out infinite alternate}
${scope} .dg-hero[data-hero-motion="drift"] .hero-media{animation:dg-drift 12s ease-in-out infinite alternate}}
${scope} .dg-hero.is-motion-paused .hero-media{animation-play-state:paused!important}
@media(max-width:760px){
${scope} .dg-hero{padding:20px 20px 40px}
${scope} .dg-top{gap:12px;margin-bottom:28px;letter-spacing:0;font-size:10px}
${scope} .dg-grid{display:flex;flex-direction:column;gap:28px}
${scope} .dg-copy{width:100%;padding:0;margin:0;border:0;text-align:left;order:0}
${scope} .dg-copy h1,${scope} .dg-copy h1.long{font-size:clamp(36px,10.5vw,68px);line-height:1.05}
${scope} .dg-image{width:100%;height:360px;aspect-ratio:auto;transform:none;order:1;box-shadow:none}
${scope} .dg-side{position:static;display:flex;flex-wrap:wrap;gap:12px;width:100%;writing-mode:horizontal-tb;max-width:none;padding:12px 0;order:2;font:14px var(--body);text-align:left}
${scope} .dg-side a{padding:10px}
${scope} .dg-resources{grid-template-columns:1fr}
${scope} .dg-discovery{padding-top:38px;padding-bottom:38px}}
@media(prefers-reduced-motion:reduce){${scope} .dg-hero *{animation:none!important;scroll-behavior:auto}}
`;
  return { theme, hero, discovery, css };
}
