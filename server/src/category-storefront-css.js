// The storefront stylesheet. Every colour, font and radius comes from the theme's :root variables
// (themes.js); body classes (hd-*, cd-*, up-*) and section classes (h-ov, h-sp...) switch the structure.
export const CATEGORY_CSS = `
*{box-sizing:border-box}[hidden]{display:none!important}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 var(--body);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;overflow-x:hidden}
img{max-width:100%;display:block}a{color:inherit}p{margin:0}
h1,h2,h3{font-family:var(--display);font-weight:var(--dw);letter-spacing:var(--dt);line-height:1.04;margin:0;text-wrap:balance;overflow-wrap:break-word}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.wrap{width:100%;max-width:1320px;margin-inline:auto;padding-inline:clamp(16px,4vw,48px)}
.up-titles :is(h1,h2,h3),.up-all :is(h1,h2,h3,.brand,.band span){text-transform:uppercase}
.btn,.buy{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 32px;border-radius:var(--r-btn);background:var(--accent);color:var(--on-accent);
  font:600 15px/1.1 var(--body);text-decoration:none;border:1.5px solid transparent;cursor:pointer;transition:transform .15s,opacity .2s;text-align:center}
.btn:hover,.buy:hover{transform:translateY(-1px)}.btn:active,.buy:active{transform:none}
.btn.ghost,.buy.alt{background:transparent;color:inherit;border-color:currentColor}
.up-buttons :is(.btn,.buy,.nav a,.chip),.up-all :is(.btn,.buy,.nav a,.chip){text-transform:uppercase;letter-spacing:.12em;font-size:13px}
.sec{padding-block:clamp(56px,7vw,104px)}.sec.tight{padding-top:0}
.sec-h{display:flex;align-items:end;justify-content:space-between;gap:16px 24px;flex-wrap:wrap;margin-bottom:clamp(24px,3vw,40px)}
.sec-h h2{font-size:calc(clamp(30px,3.4vw,46px)*var(--ts))}.sec-h .more{font-weight:600;font-size:15px;text-underline-offset:4px}
.fine{font-size:13px;color:var(--muted)}

/* announcement strip */
.ann{background:var(--bar);color:var(--on-bar);font:600 13px/1.3 var(--body);letter-spacing:.02em;text-align:center;padding:10px 16px}
.ann.mq{padding:0;overflow:hidden;white-space:nowrap;text-align:left}
.trk{display:inline-flex;width:max-content;animation:mq 40s linear infinite}.ann .trk span{padding:10px 26px}
.trk i{font-style:normal;opacity:.7}
@keyframes mq{to{transform:translateX(-50%)}}

/* header */
.hd{position:sticky;top:0;z-index:30;background:color-mix(in srgb,var(--bg) 88%,transparent);-webkit-backdrop-filter:blur(14px) saturate(1.5);backdrop-filter:blur(14px) saturate(1.5);border-bottom:1px solid var(--line)}
.hd .wrap{display:grid;grid-template-columns:auto 1fr auto;grid-template-areas:"brand nav acts";align-items:center;gap:8px 32px;min-height:74px}
.brand{grid-area:brand;font-family:var(--display);font-weight:var(--dw);letter-spacing:var(--dt);font-size:calc(25px*var(--ts));line-height:1.1;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:min(60vw,440px);padding-block:4px}.premium .brand{letter-spacing:clamp(.025em,.35vw,.085em);font-weight:var(--dw)}.premium.fam-cinema .brand,.premium.fam-gallery .brand{letter-spacing:.04em}
.nav{grid-area:nav;display:flex;gap:30px;align-items:center;justify-content:center;font:500 15px var(--body)}
.nav a{text-decoration:none;padding-block:6px;background:linear-gradient(currentColor,currentColor) 0 100%/0 1.5px no-repeat;transition:background-size .25s;white-space:nowrap}
.nav a:hover,.nav a[aria-current]{background-size:100% 1.5px}
.acts{grid-area:acts;display:flex;justify-content:flex-end}
.cart{position:relative;display:inline-grid;place-items:center;width:46px;height:46px;border-radius:999px;text-decoration:none}
.cart:hover{background:color-mix(in srgb,var(--ink) 7%,transparent)}.cart svg{width:24px;height:24px}
.cart b{position:absolute;top:3px;right:1px;min-width:19px;height:19px;padding:0 5px;border-radius:99px;background:var(--accent);color:var(--on-accent);font:700 11px/19px var(--body);text-align:center}
.cart b:empty{display:none}
.hd-center .hd .wrap{grid-template-columns:1fr auto 1fr;grid-template-areas:"nav brand acts"}.hd-center .nav{justify-content:flex-start}
.hd-stack .hd .wrap{grid-template-columns:1fr auto 1fr;grid-template-areas:". brand acts" "nav nav nav";padding-block:14px 4px}.hd-stack .brand{font-size:calc(32px*var(--ts))}
.hd-center .brand,.hd-stack .brand{text-align:center}
@media(max-width:900px){.nav{display:none}.hd .wrap{min-height:64px}.hd-center .hd .wrap,.hd-stack .hd .wrap{grid-template-areas:". brand acts";padding-block:0}.hd-stack .brand{font-size:calc(25px*var(--ts))}.brand{max-width:62vw}}

/* hero: shared */
.hero{position:relative}
.hero .txt{display:grid;gap:clamp(18px,2vw,26px);justify-items:start;align-content:center}
.hero h1{font-size:calc(clamp(42px,6.2vw,96px)*var(--hero))}
.hero h1.long{font-size:calc(clamp(32px,4.2vw,62px)*min(var(--hero),1.15));line-height:1.08}
.hero .eyebrow{font-size:12px;font-weight:700;letter-spacing:.15em;line-height:1.3;text-transform:uppercase;opacity:.78}
.hero .sub{font-size:clamp(16px,1.35vw,19px);max-width:46ch;opacity:.84;white-space:pre-line}
.ctas{display:flex;flex-wrap:wrap;gap:12px}
.ital .hero h1{font-style:italic}
.motion-toggle{position:absolute;z-index:3;right:clamp(16px,4vw,48px);bottom:clamp(16px,3vw,32px);min-height:38px;padding:0 13px;border:1px solid currentColor;border-radius:999px;background:color-mix(in srgb,var(--bg) 82%,transparent);color:var(--ink);font:600 12px/1 var(--body);letter-spacing:.02em;cursor:pointer;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.h-ov .motion-toggle{background:rgba(15,15,15,.48);color:#fff}.hero:not(.has-hero-motion) .motion-toggle{display:none}
@media(prefers-reduced-motion:no-preference){
  .hero.has-hero-motion .hero-media{will-change:transform;animation:hero-drift 9s ease-in-out infinite alternate}
  .hero.has-hero-motion[data-hero-motion="pan"] .hero-media{animation-name:hero-pan;animation-duration:16s;animation-timing-function:linear}
  .hero.is-motion-paused .hero-media{animation-play-state:paused}
}
@keyframes hero-drift{from{transform:translate3d(0,0,0) scale(1)}to{transform:translate3d(0,-1.25%,0) scale(1.025)}}
@keyframes hero-pan{from{transform:scale(1.01);transform-origin:45% 50%}to{transform:scale(1.09);transform-origin:58% 50%}}
@media(prefers-reduced-motion:reduce){.trk,.hero .hero-media{animation:none!important;transform:none!important}.motion-toggle{display:none!important}}

/* hero: full-width photo with text on it */
.h-ov{position:relative;isolation:isolate;min-height:clamp(540px,84vh,860px);display:grid;align-items:end;color:#fff;overflow:hidden}
.h-ov>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2}
.h-ov::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(0,0,0,.08) 20%,rgba(0,0,0,.72)),linear-gradient(90deg,rgba(0,0,0,.35),transparent 65%)}
.h-ov .sub{opacity:.95;text-shadow:0 1px 12px rgba(0,0,0,.5)}
.h-ov .txt{padding-block:clamp(48px,8vw,112px)}.h-ov h1{max-width:15ch;text-shadow:0 2px 40px rgba(0,0,0,.25)}
.h-ov.center{align-items:center}.h-ov.center::after{background:radial-gradient(70% 70% at 50% 50%,rgba(0,0,0,.55),rgba(0,0,0,.3))}
.h-ov.center .txt{justify-items:center;text-align:center}.h-ov.center h1{max-width:17ch}
.h-ov .btn.ghost{color:#fff}

/* hero: photo beside a colour panel */
.h-sp{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);min-height:clamp(500px,80vh,780px);background:var(--panel);color:var(--on-panel)}
.h-sp .txt{padding:clamp(48px,6vw,104px) clamp(16px,5vw,88px);max-width:680px;justify-self:end;width:100%}
.h-sp .pic{position:relative;overflow:hidden}.h-sp .pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.h-sp .btn{background:var(--on-panel);color:var(--panel)}
.h-sp .btn.ghost{background:transparent;color:var(--on-panel);border-color:color-mix(in srgb,var(--on-panel) 45%,transparent)}.premium .h-sp .btn,.premium .h-plain .btn{background:var(--accent);color:var(--on-accent)}.premium .h-sp .btn.ghost,.premium .h-plain .btn.ghost{background:transparent;color:var(--accent);border-color:color-mix(in srgb,var(--accent) 45%,transparent)}
@media(max-width:820px){.h-sp{grid-template-columns:1fr;min-height:0}.h-sp .pic{order:-1;aspect-ratio:4/3}.h-sp .txt{justify-self:stretch;max-width:none}}

/* hero: three-photo collage */
.h-co .wrap{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:clamp(28px,5vw,80px);align-items:center;padding-block:clamp(32px,5vw,72px)}
.h-co .pics{display:grid;grid-template-columns:1.25fr 1fr;grid-template-rows:1fr 1fr;gap:clamp(8px,1.2vw,16px);height:clamp(440px,58vw,700px)}
.h-co .pics img{width:100%;height:100%;object-fit:cover;border-radius:var(--r-card);background:var(--surface)}
.h-co .pics img:first-child{grid-row:span 2}.h-co .pics.n2 img{grid-row:span 2}
@media(max-width:820px){.h-co .wrap{grid-template-columns:1fr}.h-co .pics{height:clamp(360px,110vw,520px);order:-1}}

/* hero: centred headline over a wide photo */
.h-ed{padding-top:clamp(48px,7vw,104px)}
.h-ed .txt{justify-items:center;text-align:center;max-width:980px;padding-bottom:clamp(36px,4vw,60px)}
.h-ed .pic{aspect-ratio:21/9;border-radius:var(--r-card);overflow:hidden;background:var(--surface)}.h-ed .pic img{width:100%;height:100%;object-fit:cover}
@media(max-width:720px){.h-ed .pic{aspect-ratio:4/5}}

/* hero: giant type and a product strip */
.h-ty{padding-top:clamp(28px,4vw,56px);overflow:hidden}
.h-ty h1{font-size:calc(clamp(60px,13.5vw,230px)*var(--hero));line-height:.86;letter-spacing:calc(var(--dt) - .01em)}
.h-ty h1.long{font-size:calc(clamp(40px,6.5vw,104px)*var(--hero));line-height:.95}
.h-ty .row{display:flex;justify-content:space-between;align-items:end;gap:20px 32px;flex-wrap:wrap;padding-block:28px 32px;border-bottom:1px solid var(--line)}
.strip{display:flex;gap:clamp(10px,1.2vw,16px);overflow-x:auto;scroll-snap-type:x mandatory;padding:28px clamp(16px,4vw,48px) 8px;scrollbar-width:none}
.strip::-webkit-scrollbar{display:none}
.strip a{flex:0 0 clamp(200px,23vw,320px);scroll-snap-align:start;text-decoration:none;display:grid;gap:10px}
.strip img,.strip .noimg{aspect-ratio:var(--ratio);width:100%;object-fit:cover;border-radius:var(--r-card);background:var(--surface)}
.strip span{display:flex;justify-content:space-between;gap:12px;font-size:14px;font-weight:500}

/* hero: product in the spotlight */
.h-spot{position:relative;overflow:hidden;background:radial-gradient(55% 75% at 72% 50%,color-mix(in srgb,var(--accent) 22%,transparent),transparent 72%),var(--bg)}
.h-spot::before{content:"";position:absolute;inset:0;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:64px 64px;
  -webkit-mask-image:radial-gradient(70% 70% at 50% 40%,#000,transparent);mask-image:radial-gradient(70% 70% at 50% 40%,#000,transparent);opacity:.55;pointer-events:none}
.h-spot .wrap{position:relative;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:center;gap:40px;min-height:clamp(520px,78vh,760px);padding-block:56px}
.h-spot .pic{position:relative;width:100%;max-width:540px;aspect-ratio:1;justify-self:center}
.h-spot .pic::before{content:"";position:absolute;inset:6%;border-radius:50%;background:color-mix(in srgb,var(--accent) 55%,transparent);filter:blur(70px);opacity:.7}
.h-spot .pic img{position:relative;width:100%;height:100%;object-fit:cover;border-radius:calc(var(--r-card) * 1.6);box-shadow:0 0 0 1px color-mix(in srgb,var(--accent) 40%,transparent),0 40px 90px -30px color-mix(in srgb,var(--accent) 70%,transparent)}
@media(max-width:820px){.h-spot .wrap{grid-template-columns:1fr;min-height:0}.h-spot .pic{max-width:420px}}

/* hero: no photos yet */
.h-plain{background:var(--panel);color:var(--on-panel);padding-block:clamp(72px,12vw,160px)}
.h-plain .txt{justify-items:center;text-align:center}.h-plain .btn{background:var(--on-panel);color:var(--panel)}

/* New category themes use independent module layouts; this sheet supplies only commerce and motion primitives. */
.premium .hero .btn{border-radius:var(--r-btn)}.premium .hero .eyebrow{letter-spacing:.18em}
.premium .trk{animation:none}.premium :is(.cat-c:hover img,.cat-t:hover img,.pc:hover .im img,.btn:hover,.buy:hover){transform:none}
.premium .pc .go{display:none}

/* reasons to buy */
.perks{border-block:1px solid var(--line)}
.perks .wrap{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
.perk{display:flex;gap:14px;align-items:center;justify-content:center;padding:24px 12px}
.perk svg{flex:none;width:30px;height:30px;color:var(--accent)}
.perk b{display:block;font-weight:600;font-size:15px;line-height:1.3}.perk span{display:block;color:var(--muted);font-size:13.5px;line-height:1.4}
@media(min-width:800px){.perk+.perk{border-left:1px solid var(--line)}}
@media(max-width:799px){.perks .wrap{grid-template-columns:1fr}.perk{justify-content:flex-start;padding:16px 4px}.perk+.perk{border-top:1px solid var(--line)}}

/* shop by category */
.cats-c{display:flex;gap:clamp(18px,3vw,44px);overflow-x:auto;justify-content:safe center;scrollbar-width:none;padding:6px 4px}
.cats-c::-webkit-scrollbar{display:none}
.cat-c{flex:0 0 auto;width:clamp(108px,12vw,164px);text-align:center;text-decoration:none;display:grid;gap:14px;justify-items:center}
.cat-c img,.cat-c .noimg{width:100%;aspect-ratio:1;border-radius:50%;object-fit:cover;background:var(--surface);transition:transform .4s}
.dark .cat-c img{outline:1px solid color-mix(in srgb,var(--accent) 55%,transparent);outline-offset:5px}
.cat-c:hover img{transform:scale(1.05)}.cat-c span{font-weight:600;font-size:15px;line-height:1.25}
.cats-t{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,44%),1fr));gap:clamp(10px,1.5vw,20px)}
.cat-t{position:relative;aspect-ratio:4/5;border-radius:var(--r-card);overflow:hidden;color:#fff;text-decoration:none;isolation:isolate;background:var(--surface)}
.cat-t img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2;transition:transform .8s cubic-bezier(.2,.7,.2,1)}
.cat-t::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(transparent 45%,rgba(0,0,0,.6))}
.cat-t:hover img{transform:scale(1.05)}
.cat-t span{position:absolute;left:clamp(14px,2vw,24px);right:14px;bottom:clamp(14px,2vw,22px);font-family:var(--display);font-weight:var(--dw);letter-spacing:var(--dt);font-size:calc(clamp(20px,2.2vw,30px)*var(--ts));line-height:1.1}
.cat-t small{display:block;font:500 13px var(--body);letter-spacing:0;text-transform:none;opacity:.85;margin-top:6px}

/* product grid */
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chip{padding:9px 18px;border-radius:var(--r-btn);border:1px solid var(--line);font:500 14px/1.2 var(--body);text-decoration:none;white-space:nowrap;transition:border-color .2s}
.chip:hover{border-color:var(--ink)}.chip[aria-current]{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(30px,3.4vw,48px) clamp(12px,1.6vw,24px)}
@media(max-width:1060px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:720px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
.pc{position:relative;display:grid;gap:14px;align-content:start;text-decoration:none}
.pc .im{position:relative;aspect-ratio:var(--ratio);overflow:hidden;border-radius:var(--r-card);background:var(--surface)}
.pc .im img{width:100%;height:100%;object-fit:cover;transition:transform .8s cubic-bezier(.2,.7,.2,1)}
.pc .tag{position:absolute;top:12px;left:12px;padding:4px 11px;border-radius:var(--r-chip);background:var(--badge);color:var(--on-badge);font:700 12px/1.45 var(--body);letter-spacing:.02em}
.pc .tag.out{background:var(--ink);color:var(--bg)}
.pc .go{display:none}
@media(hover:hover){.pc:hover .im img{transform:scale(1.06)}
  .pc .go{display:flex;position:absolute;left:12px;right:12px;bottom:12px;justify-content:center;padding:13px;border-radius:var(--r-btn);background:var(--bg);color:var(--ink);font:600 14px/1 var(--body);
    box-shadow:0 10px 30px rgba(0,0,0,.14);opacity:0;transform:translateY(10px);transition:opacity .25s,transform .25s}
  .pc:hover .go{opacity:1;transform:none}}
.pc .bd{display:grid;gap:4px}
.pc h3{font:500 15.5px/1.35 var(--body);letter-spacing:0}
.pc .pr{font-variant-numeric:tabular-nums;font-size:15px;font-weight:600}
.pc .ct{color:var(--muted);font-size:13px}
.cd-minimal .pc{text-align:center}.cd-minimal .pc h3{font-family:var(--display);font-weight:var(--dw);letter-spacing:var(--dt);font-size:calc(19px*var(--ts));line-height:1.2}
.cd-minimal .pc .pr{font-weight:500;color:var(--muted)}.cd-minimal .pc .tag{left:50%;transform:translateX(-50%)}
.cd-boxed .pc,.cd-bold .pc{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-card);overflow:hidden;gap:0}
.cd-boxed .pc .im,.cd-bold .pc .im{border-radius:0}.cd-boxed .pc .bd,.cd-bold .pc .bd{padding:14px 16px 18px}
.cd-boxed .pc{transition:box-shadow .3s}.cd-boxed .pc:hover{box-shadow:0 18px 40px -18px color-mix(in srgb,var(--ink) 30%,transparent)}
.cd-bold .pc{border:2px solid var(--ink);box-shadow:5px 5px 0 var(--ink);transition:transform .15s,box-shadow .15s}
.cd-bold .pc .im{border-bottom:2px solid var(--ink)}.cd-bold .pc:hover{transform:translate(-2px,-2px);box-shadow:7px 7px 0 var(--ink)}
.cd-bold .pc h3{font-family:var(--display);font-weight:var(--dw);letter-spacing:var(--dt);font-size:calc(18px*var(--ts))}
.cd-glass .pc{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-card);padding:10px;gap:12px;transition:border-color .25s,box-shadow .35s}
.cd-glass .pc .im{border-radius:calc(var(--r-card) - 6px);background:color-mix(in srgb,var(--ink) 6%,transparent)}.cd-glass .pc .bd{padding:2px 6px 8px}
.cd-glass .pc:hover{border-color:color-mix(in srgb,var(--accent) 65%,transparent);box-shadow:0 24px 60px -24px color-mix(in srgb,var(--accent) 70%,transparent)}
.cd-glass .pc .pr{color:var(--accent)}
.cd-pastel .pc{padding:10px;border-radius:var(--r-card);gap:12px}.cd-pastel .pc .im{border-radius:calc(var(--r-card) - 8px);background:#ffffff80}
.cd-pastel .pc .bd{padding:0 8px 8px}.cd-pastel .pc h3{font-family:var(--display);font-weight:var(--dw);font-size:calc(17px*var(--ts))}
.cd-pastel .pc:nth-child(5n+1){background:#FFE3EA}.cd-pastel .pc:nth-child(5n+2){background:#DDEFFF}.cd-pastel .pc:nth-child(5n+3){background:#FFF1BF}.cd-pastel .pc:nth-child(5n+4){background:#DDF5E4}.cd-pastel .pc:nth-child(5n){background:#ECE2FF}
.empty{padding:56px 24px;text-align:center;border:1px dashed var(--line);border-radius:var(--r-card);color:var(--muted)}

/* featured product */
.feat{background:var(--surface)}
.feat .wrap{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:clamp(28px,6vw,96px);align-items:center}
.feat .pic{aspect-ratio:var(--ratio);border-radius:var(--r-card);overflow:hidden;background:var(--bg)}.feat .pic img{width:100%;height:100%;object-fit:cover}
.feat .txt{display:grid;gap:20px;justify-items:start}
.feat h2{font-size:calc(clamp(34px,4.2vw,60px)*var(--ts))}.feat .tl{color:var(--muted);font-size:18px;max-width:42ch}
.feat .kick{color:var(--muted);font-size:14px;font-weight:500}
.price{font-family:var(--display);font-weight:var(--dw);letter-spacing:var(--dt);font-size:calc(30px*var(--ts));font-variant-numeric:tabular-nums;line-height:1.1}
@media(max-width:820px){.feat .wrap{grid-template-columns:1fr}}

/* scrolling statement band */
.band{background:var(--accent);color:var(--on-accent);overflow:hidden;white-space:nowrap;padding-block:clamp(16px,2.2vw,26px)}
.band .trk{animation-duration:34s}
.band span{font-family:var(--display);font-weight:var(--dw);letter-spacing:var(--dt);font-size:clamp(30px,4.6vw,68px);line-height:1;padding-inline:clamp(18px,2.4vw,36px)}
.band i{font-size:clamp(20px,2.6vw,36px);vertical-align:middle}

/* about */
.story .wrap{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(28px,6vw,96px);align-items:center}
.story .pic{aspect-ratio:4/5;border-radius:var(--r-card);overflow:hidden;background:var(--surface)}.story .pic img{width:100%;height:100%;object-fit:cover}
.story .txt{display:grid;gap:20px}.story h2{font-size:calc(clamp(32px,3.8vw,54px)*var(--ts))}
.story p{font-size:clamp(17px,1.45vw,20px);line-height:1.65;color:var(--muted);max-width:56ch;white-space:pre-line}
.story.solo .wrap{grid-template-columns:1fr;text-align:center;justify-items:center;max-width:900px}.story.solo p{margin-inline:auto}
@media(max-width:820px){.story .wrap{grid-template-columns:1fr}}

/* footer */
.ft{background:var(--foot);color:var(--on-foot)}
.ft .top{display:grid;grid-template-columns:minmax(0,1.7fr) repeat(2,minmax(0,1fr));gap:40px;padding-block:clamp(56px,7vw,96px) clamp(40px,5vw,64px)}
.ft .brand{display:block;font-size:calc(32px*var(--ts));white-space:normal;max-width:none}
.ft .top>div>p{opacity:.72;max-width:40ch;margin-top:16px}
.ft h4{font:600 14px var(--body);margin:0 0 16px;opacity:.6}
.ft nav{display:grid;gap:11px;align-content:start;font-size:15px}.ft nav a{text-decoration:none;opacity:.9}.ft nav a:hover{text-decoration:underline;text-underline-offset:3px}.ft nav span{opacity:.75}
.ft .bot{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px 24px;padding-block:24px;border-top:1px solid color-mix(in srgb,var(--on-foot) 16%,transparent);font-size:13px;opacity:.72}
@media(max-width:760px){.ft .top{grid-template-columns:1fr 1fr}.ft .top>div:first-child{grid-column:1/-1}}

/* page heading (cart, categories) */
.pagehead{padding-block:clamp(36px,5vw,72px) clamp(20px,2.4vw,32px)}.pagehead h1{font-size:calc(clamp(36px,5vw,68px)*var(--ts))}
.pagehead p{color:var(--muted);margin-top:10px}

/* product page */
.crumbs{display:flex;gap:8px;flex-wrap:wrap;font-size:13.5px;color:var(--muted);padding-block:22px}
.crumbs a{text-decoration:none}.crumbs a:hover{text-decoration:underline}
.pd{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:clamp(28px,5vw,80px);align-items:start;padding-bottom:clamp(56px,7vw,104px)}
.pd .media{position:sticky;top:100px}
.pd .pic .tag{position:absolute;top:16px;left:16px;padding:6px 14px;border-radius:var(--r-chip);background:var(--badge);color:var(--on-badge);font:700 14px/1.4 var(--body)}
.pd .pic{position:relative;aspect-ratio:var(--ratio);border-radius:var(--r-card);overflow:hidden;background:var(--surface)}.pd .pic img{width:100%;height:100%;object-fit:cover}
.pd .info{display:grid;gap:22px;align-content:start}
.pd .cat{color:var(--muted);font-size:14px;font-weight:500}
.pd h1{font-size:calc(clamp(34px,3.8vw,56px)*var(--ts));line-height:1.06}
.pd .tl{color:var(--muted);font-size:18px}
.pd .mini{display:grid;gap:10px;padding:18px 0;border-block:1px solid var(--line);font-size:14.5px}
.pd .mini div{display:flex;gap:12px;align-items:center}.pd .mini svg{flex:none;width:22px;height:22px;color:var(--accent)}
.pd .desc{display:grid;gap:14px;color:color-mix(in srgb,var(--ink) 84%,var(--bg))}
.pd .desc p{white-space:pre-line;overflow-wrap:anywhere}
.pd .desc a{text-decoration:underline;text-underline-offset:3px;color:inherit}
@media(max-width:820px){.pd{grid-template-columns:1fr}.pd .media{position:static}}
ul.b{list-style:none;padding:0;margin:0;display:grid;gap:10px}ul.b li{padding-left:28px;position:relative}
ul.b li::before{content:"";position:absolute;left:2px;top:.45em;width:12px;height:7px;border-left:2px solid var(--accent);border-bottom:2px solid var(--accent);transform:rotate(-45deg)}
details{border-bottom:1px solid var(--line)}details:first-of-type{border-top:1px solid var(--line)}
summary{display:flex;justify-content:space-between;gap:16px;padding:18px 0;font-weight:600;cursor:pointer;list-style:none}summary::-webkit-details-marker{display:none}
summary::after{content:"+";font-size:22px;line-height:1;font-weight:400;transition:transform .2s}details[open] summary::after{transform:rotate(45deg)}
details p{color:var(--muted);padding-bottom:18px}
.tags{display:flex;flex-wrap:wrap;gap:6px}.tags span{border:1px solid var(--line);border-radius:99px;padding:3px 12px;font-size:13px;color:var(--muted)}
fieldset{border:0;padding:0;margin:0;display:grid;gap:10px}legend{font-weight:600;margin-bottom:10px;padding:0}
.opts{display:flex;flex-wrap:wrap;gap:8px}.opts label{position:relative}.opts input{position:absolute;opacity:0;inset:0}
.opts span{display:inline-block;min-width:52px;text-align:center;border:1.5px solid var(--line);background:var(--bg);border-radius:var(--r-in);padding:10px 18px;font-weight:600;cursor:pointer}
.opts input:checked+span{border-color:var(--ink);box-shadow:inset 0 0 0 1px var(--ink)}.opts input:focus-visible+span{outline:2px solid var(--accent);outline-offset:2px}
.opts input:disabled+span{opacity:.4;text-decoration:line-through;cursor:not-allowed}
.qty{display:inline-flex;align-items:center;border:1.5px solid var(--line);border-radius:var(--r-btn);background:var(--bg);min-height:52px}
.qty button{all:unset;cursor:pointer;width:44px;height:44px;display:grid;place-items:center;font-size:20px;font-weight:600}.qty button:focus-visible{outline:2px solid var(--accent);border-radius:99px}
.qty output{min-width:28px;text-align:center;font-weight:700;font-variant-numeric:tabular-nums}
.actions{display:flex;flex-wrap:wrap;gap:10px;align-items:stretch}.actions .buy{flex:1 1 170px}
button.buy{font-family:var(--body)}button.buy:disabled{opacity:.45;cursor:not-allowed}.buy.off{opacity:.45;pointer-events:none}
.stock{font-size:14px;font-weight:600}.stock.low{color:var(--danger)}
.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:40;background:var(--ink);color:var(--bg);padding:14px 20px;border-radius:var(--r-in);font-weight:600;display:flex;gap:16px;align-items:center;max-width:calc(100% - 32px);box-shadow:0 20px 50px rgba(0,0,0,.25)}
.toast a{color:inherit;font-weight:800;text-underline-offset:3px}

/* cart and order pages */
.page{padding-bottom:clamp(56px,7vw,96px)}
.cartw{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:32px;align-items:start}@media(max-width:820px){.cartw{grid-template-columns:1fr}}
.lines{display:grid;gap:12px}.line{display:grid;grid-template-columns:80px minmax(0,1fr) auto;gap:16px;align-items:center;background:var(--surface);border:1px solid var(--line);border-radius:var(--r-in);padding:12px}
.line img,.line .noimg{width:80px;height:80px;border-radius:min(10px,var(--r-in));object-fit:cover;background:var(--line)}.line h3{margin:0;font:600 16px/1.3 var(--body);letter-spacing:0;text-transform:none}.line .v{color:var(--muted);font-size:14px}
.line .r{display:grid;justify-items:end;gap:6px}.line .qty{min-height:0}.line .qty button{width:34px;height:34px}
.rm{all:unset;cursor:pointer;color:var(--muted);font-size:13px;text-decoration:underline}.rm:focus-visible{outline:2px solid var(--accent)}
.sum{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-card);padding:24px;display:grid;gap:14px;position:sticky;top:100px}
.sum h2{font-size:24px}.row{display:flex;justify-content:space-between;gap:12px;font-variant-numeric:tabular-nums}.row.t{font-weight:700;font-size:20px;border-top:1px solid var(--line);padding-top:14px}
.code{display:flex;gap:8px}.code input{flex:1;min-width:0;font:inherit;padding:12px;border:1.5px solid var(--line);border-radius:var(--r-in);background:var(--bg);color:var(--ink);text-transform:uppercase}.code input::placeholder{text-transform:none;color:var(--muted)}
.code button{font:inherit;font-weight:600;border:1.5px solid var(--ink);background:transparent;color:var(--ink);border-radius:var(--r-in);padding:0 16px;cursor:pointer}
.err{color:var(--danger);font-weight:600}.ok{color:var(--good);font-weight:600}
.order{max-width:660px;margin:0 auto;display:grid;gap:20px;padding-top:clamp(36px,5vw,72px)}.order h1{font-size:calc(clamp(34px,5vw,56px)*var(--ts))}.dl{display:grid;gap:10px}
.note{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-card);padding:32px;max-width:640px;margin:56px auto;display:grid;gap:16px;text-align:center;justify-items:center}
.pv{background:#14142B;color:#fff;font:600 14px/1.4 system-ui,sans-serif;padding:10px 16px;text-align:center}
/* ratings and reviews */
.stars{color:color-mix(in srgb,var(--ink) 18%,transparent);letter-spacing:1px;white-space:nowrap}.stars i{font-style:normal}.stars i.on{color:#E8A317}
.stars i.half{background:linear-gradient(90deg,#E8A317 50%,color-mix(in srgb,var(--ink) 18%,transparent) 50%);-webkit-background-clip:text;background-clip:text;color:transparent}
.rt{display:inline-flex;gap:6px;align-items:center;font-size:13px;color:var(--muted);text-decoration:none}.rt.big{font-size:16px}
.revs{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr));gap:16px}
.rev{margin:0;background:var(--surface);border:1px solid var(--line);border-radius:var(--r-in);padding:20px;display:grid;gap:10px}
.rev blockquote{margin:0;line-height:1.6}.rev figcaption{font-size:13px;color:var(--muted)}
.pd .ai{margin-top:10px}
.revf{display:grid;gap:14px;padding:24px;background:var(--surface);border:1px solid var(--line);border-radius:var(--r-card)}
.revf label{display:grid;gap:6px;font-weight:600}.revf textarea,.revf input[name=name]{font:inherit;font-weight:400;padding:12px;border:1.5px solid var(--line);border-radius:var(--r-in);background:var(--bg);color:var(--ink)}
.starpick{display:flex;flex-direction:row-reverse;justify-content:flex-end;gap:4px}.starpick legend{width:100%;margin-bottom:6px}
.starpick input{position:absolute;opacity:0}.starpick label{font-size:38px;line-height:1;cursor:pointer;color:color-mix(in srgb,var(--ink) 20%,transparent)}
.starpick input:checked~label,.starpick label:hover,.starpick label:hover~label{color:#E8A317}.starpick input:focus-visible+label{outline:2px solid var(--accent);border-radius:4px}
/* link in bio */
.links{max-width:560px;display:grid;gap:12px;padding-block:40px 64px}
.links header{text-align:center;display:grid;gap:8px;justify-items:center;margin-bottom:12px}.links h1{font-size:calc(34px*var(--ts))}.links header p{color:var(--muted)}
.links .av{width:96px;height:96px;border-radius:50%;object-fit:cover}
.lk{display:flex;align-items:center;justify-content:center;gap:14px;min-height:58px;padding:10px 18px;border:1.5px solid var(--ink);border-radius:var(--r-btn);text-decoration:none;font-weight:600;text-align:center;background:var(--bg)}
.lk.main{background:var(--accent);color:var(--on-accent);border-color:var(--accent)}
.lk.prod{justify-content:flex-start;text-align:left;border-color:var(--line);background:var(--surface);border-radius:var(--r-in)}
.lk.prod img,.lk.prod .noimg{width:52px;height:52px;border-radius:min(10px,var(--r-in));object-fit:cover;flex:none}.lk.prod span{flex:1}.lk.prod b{font-variant-numeric:tabular-nums}
/* motion: content rises in as it scrolls into view (added by script, so pages work without it) */
@media(prefers-reduced-motion:no-preference){
  .rv{opacity:0;transform:translateY(26px);transition:opacity .8s cubic-bezier(.2,.7,.2,1) var(--d,0s),transform .9s cubic-bezier(.2,.7,.2,1) var(--d,0s)}
  .rv.in{opacity:1;transform:none}
  .mo-lively .rv{transform:translateY(40px) scale(.97);transition-timing-function:cubic-bezier(.34,1.56,.64,1)}
  .mo-lively .rv.in{transform:none}
  .mo-lively .pc:hover{transform:translateY(-6px) rotate(-.6deg)}
  .mo-lively .pc{transition:transform .35s cubic-bezier(.34,1.56,.64,1)}
}`;
