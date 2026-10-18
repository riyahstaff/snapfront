// The home page's 90-second promo: plays on its own (muted, as browsers require) when someone arrives,
// with "Tap for sound", play/pause, mute, volume, seek, captions and full screen, and ends on Start here.
// The video itself is made by tools/promo (see its README); files live in assets/site/promo/.
import fs from "node:fs";
import path from "node:path";

const DIR = path.resolve(new URL("../assets/site/promo/", import.meta.url).pathname);
const FILES = ["promo-1080.mp4", "promo-720.mp4", "promo.jpg", "promo.vtt"];
const hasWebm = () => fs.existsSync(path.join(DIR, "promo-720.webm"));   // optional fallback for browsers without H.264

/** A short version string from the files, so browsers fetch a new cut as soon as it ships. */
function version() {
  try { return FILES.map((f) => fs.statSync(path.join(DIR, f))).map((s) => (s.size % 46656).toString(36)).join("").slice(0, 12); }
  catch { return null; }
}

export const PROMO_CSS = `
.promo{padding-block:56px 72px}
.promo .head{display:flex;align-items:end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:22px}
.promo h2{margin:6px 0 0}
.player{position:relative;border-radius:22px;overflow:hidden;background:#000;aspect-ratio:16/9;border:1px solid var(--line);
  box-shadow:0 30px 90px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.03),0 0 120px rgba(217,60,170,.16)}
.player video{display:block;width:100%;height:100%;object-fit:cover;background:#000}
.player video::cue{font:600 clamp(15px,1.8vw,22px)/1.35 Figtree,system-ui,sans-serif;background:rgba(0,0,0,.72);color:#fff}
.player button{font:inherit;cursor:pointer}
.player [hidden]{display:none!important}
.p-sound{position:absolute;left:18px;top:18px;display:inline-flex;align-items:center;gap:10px;padding:12px 20px 12px 16px;border-radius:999px;border:0;
  background:rgba(255,255,255,.94);color:#11151B;font-weight:800;font-size:16px;box-shadow:0 10px 30px rgba(0,0,0,.45);animation:p-pulse 2.2s ease-in-out infinite}
.p-sound svg{width:22px;height:22px}
@keyframes p-pulse{0%,100%{box-shadow:0 10px 30px rgba(0,0,0,.45),0 0 0 0 rgba(255,255,255,.55)}50%{box-shadow:0 10px 30px rgba(0,0,0,.45),0 0 0 12px rgba(255,255,255,0)}}
.p-big{position:absolute;inset:0;margin:auto;width:92px;height:92px;border-radius:50%;border:0;background:rgba(255,255,255,.94);color:#11151B;
  display:grid;place-items:center;box-shadow:0 14px 40px rgba(0,0,0,.5)}
.p-big svg{width:38px;height:38px;margin-left:5px}
.p-bar{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;gap:6px;padding:28px 12px 10px;
  background:linear-gradient(180deg,transparent,rgba(0,0,0,.78));opacity:1;transition:opacity .25s}
.player.idle .p-bar{opacity:0}
.p-bar button{width:42px;height:42px;border:0;border-radius:50%;background:transparent;color:#fff;display:grid;place-items:center;flex:none}
.p-bar button:hover,.p-bar button:focus-visible{background:rgba(255,255,255,.16)}
.p-bar button[aria-pressed="true"]{color:#FFB37A}
.p-bar svg{width:24px;height:24px}
.p-time{color:#fff;font-size:14px;font-variant-numeric:tabular-nums;min-width:86px;text-align:center;flex:none}
.player input[type=range]{-webkit-appearance:none;appearance:none;height:6px;border-radius:6px;cursor:pointer;
  background:linear-gradient(90deg,#FF3CAC,#FF8A00 var(--p,0%),rgba(255,255,255,.28) var(--p,0%))}
.player input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#fff;border:0;box-shadow:0 1px 6px rgba(0,0,0,.5)}
.player input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:#fff;border:0}
.p-seek{flex:1;min-width:60px}
.p-vol{width:96px;flex:none}
.p-end{position:absolute;left:0;right:0;bottom:0;display:none;justify-content:center;padding:40px 16px 5%;
  background:linear-gradient(180deg,transparent,rgba(0,0,0,.7))}
.player.ended .p-end{display:flex}
.player.ended .p-bar,.player.ended .p-sound{display:none}
.p-end .row{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
.p-end .again{min-height:48px;padding:12px 22px;border-radius:999px;border:1px solid rgba(255,255,255,.5);background:transparent;color:#fff;font-weight:700}
@media (max-width:640px){.p-end{top:0;align-items:center;padding:12px;background:rgba(0,0,0,.66)}.p-end .btn,.p-end .again{min-height:42px;padding:9px 16px;font-size:14px}.player{border-radius:14px}.p-vol,.p-time{display:none}.p-sound{left:10px;top:10px;padding:9px 14px 9px 12px;font-size:14px}.p-bar{padding:22px 4px 4px;gap:2px}.p-bar button{width:38px;height:38px}}
@media (prefers-reduced-motion:reduce){.p-sound{animation:none}}
`;

const icon = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.8-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
  sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  muted: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor"/><path d="m22 9-6 6M16 9l6 6"/></svg>',
  cc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M10 10.2a2.5 2.5 0 1 0 0 3.6M17 10.2a2.5 2.5 0 1 0 0 3.6" stroke-linecap="round"/></svg>',
  full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
};

/** The film's file paths (on this host) for the web app's home page, or null if it hasn't been made. */
export function promoFiles() {
  const v = version();
  if (!v) return null;
  let duration = null;
  try { duration = JSON.parse(fs.readFileSync(path.join(DIR, "promo.json"), "utf8")).duration ?? null; } catch { /* optional */ }
  const src = (f) => `/site/promo/${f}?v=${v}`;
  return { hd: src("promo-1080.mp4"), sd: src("promo-720.mp4"), webm: hasWebm() ? src("promo-720.webm") : null, poster: src("promo.jpg"), captions: src("promo.vtt"), duration };
}

/** The promo section, or nothing if the video hasn't been made yet. */
export function promoSection() {
  const v = version();
  if (!v) return "";
  const src = (f) => `/site/promo/${f}?v=${v}`;
  return `<section class="promo" id="watch" aria-labelledby="promo-title"><div class="wrap">
<div class="head"><div><p class="eyebrow">See it in 90 seconds</p><h2 id="promo-title">Everything Snapfront does, in one quick film.</h2></div></div>
<div class="player" id="player" data-hd="${src("promo-1080.mp4")}" data-sd="${src("promo-720.mp4")}" ${hasWebm() ? `data-webm="${src("promo-720.webm")}"` : ""}>
 <video id="promo" playsinline muted preload="metadata" poster="${src("promo.jpg")}" aria-label="Snapfront promo video">
  <track kind="captions" src="${src("promo.vtt")}" srclang="en" label="English">
 </video>
 <button class="p-sound" type="button" id="p-sound" hidden>${icon.sound}<span>Tap for sound</span></button>
 <button class="p-big" type="button" id="p-big" aria-label="Play the video" hidden>${icon.play}</button>
 <div class="p-bar" id="p-bar">
  <button type="button" id="p-play" aria-label="Pause">${icon.pause}</button>
  <input class="p-seek" id="p-seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Seek">
  <span class="p-time" id="p-time">0:00 / 0:00</span>
  <button type="button" id="p-mute" aria-label="Unmute">${icon.muted}</button>
  <input class="p-vol" id="p-vol" type="range" min="0" max="100" value="80" step="1" aria-label="Volume">
  <button type="button" id="p-cc" aria-label="Captions" aria-pressed="false">${icon.cc}</button>
  <button type="button" id="p-full" aria-label="Full screen">${icon.full}</button>
 </div>
 <div class="p-end"><div class="row"><button class="btn" type="button" id="p-start">Start here: find your first step <span aria-hidden="true">→</span></button><button class="again" type="button" id="p-again">Watch again</button></div></div>
</div>
</div></section>
<script>
(function(){
 const box=document.getElementById('player'), v=document.getElementById('promo'); if(!box||!v)return;
 const $=(id)=>document.getElementById(id), I=${JSON.stringify({ play: icon.play, pause: icon.pause, sound: icon.sound, muted: icon.muted })};
 const conn=navigator.connection||{}, small=Math.min(screen.width,innerWidth)<900||conn.saveData;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 // H.264 (the 720p cut on phones and data saver); a WebM fallback if one ships and the browser lacks H.264.
 v.src=(!v.canPlayType('video/mp4; codecs="avc1.640028"')&&box.dataset.webm)||(small?box.dataset.sd:box.dataset.hd);
 const play=$('p-play'), mute=$('p-mute'), vol=$('p-vol'), seek=$('p-seek'), time=$('p-time'), cc=$('p-cc'), sound=$('p-sound'), big=$('p-big');
 let userPaused=false, heard=false, idle;
 const fmt=(s)=>{s=Math.max(0,Math.floor(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
 const fill=(r)=>r.style.setProperty('--p',(r.value/r.max*100)+'%');
 function paint(){
  play.innerHTML=v.paused?I.play:I.pause; play.setAttribute('aria-label',v.paused?'Play':'Pause');
  const off=v.muted||v.volume===0; mute.innerHTML=off?I.muted:I.sound; mute.setAttribute('aria-label',off?'Unmute':'Mute');
  sound.hidden=!(v.muted&&!v.paused&&!heard); big.hidden=!v.paused||box.classList.contains('ended');
 }
 function tick(){ if(v.duration){seek.value=Math.round(v.currentTime/v.duration*1000);fill(seek);time.textContent=fmt(v.currentTime)+' / '+fmt(v.duration);} }
 const go=()=>{box.classList.remove('ended');v.play().catch(()=>paint());};
 function unmute(restart){ heard=true; v.muted=false; if(v.volume===0){v.volume=.8;vol.value=80;fill(vol);} if(restart){v.currentTime=0;} go(); paint(); }
 sound.onclick=()=>unmute(true);
 big.onclick=()=>{userPaused=false;go();};
 play.onclick=()=>{ if(v.paused){userPaused=false;go();} else {userPaused=true;v.pause();} };
 v.addEventListener('click',()=>{ if(v.muted&&!heard)unmute(true); else play.click(); });
 mute.onclick=()=>{ if(v.muted||v.volume===0)unmute(false); else {v.muted=true;paint();} };
 vol.oninput=()=>{ v.volume=vol.value/100; v.muted=vol.value==0; if(vol.value>0)heard=true; fill(vol); paint(); };
 seek.oninput=()=>{ if(v.duration){v.currentTime=seek.value/1000*v.duration;fill(seek);} };
 cc.onclick=()=>{ const t=v.textTracks[0]; if(!t)return; const on=t.mode!=='showing'; t.mode=on?'showing':'hidden'; cc.setAttribute('aria-pressed',String(on)); };
 $('p-full').onclick=()=>{ const el=box; if(document.fullscreenElement)document.exitFullscreen(); else if(el.requestFullscreen)el.requestFullscreen(); else if(v.webkitEnterFullscreen)v.webkitEnterFullscreen(); };
 $('p-again').onclick=()=>{v.currentTime=0;userPaused=false;go();};
 $('p-start').onclick=()=>{const s=document.getElementById('start-here'); if(s)s.click(); else location.href='#pricing';};
 ['play','pause','volumechange','loadedmetadata'].forEach(e=>v.addEventListener(e,()=>{paint();tick();}));
 v.addEventListener('timeupdate',tick);
 v.addEventListener('ended',()=>{box.classList.add('ended');paint();});
 // Controls fade away while it plays and come back on any movement or focus.
 const wake=()=>{box.classList.remove('idle');clearTimeout(idle);idle=setTimeout(()=>{if(!v.paused)box.classList.add('idle');},2600);};
 ['mousemove','touchstart','focusin','keydown'].forEach(e=>box.addEventListener(e,wake,{passive:true}));
 box.addEventListener('keydown',(e)=>{ if(e.target.tagName==='INPUT')return; if(e.key===' '||e.key==='k'){e.preventDefault();play.click();} else if(e.key==='m'){mute.click();} });
 v.volume=.8; fill(vol);
 // Plays on its own (muted) when someone arrives, pauses while it's scrolled out of view.
 const auto=!reduce&&!conn.saveData;
 if('IntersectionObserver' in window){
  new IntersectionObserver(([en])=>{ if(en.isIntersecting){ if(auto&&!userPaused&&!box.classList.contains('ended'))go(); } else if(!v.paused){ v.pause(); } },{threshold:.35}).observe(box);
 } else if(auto) go();
 paint(); wake();
})();
</script>`;
}
