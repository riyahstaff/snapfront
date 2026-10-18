// The 90-second promo film on the website's home page, right under the hero. It plays on its own (muted, as
// browsers require) when it scrolls into view and pauses when it leaves; "Tap for sound" restarts it with
// audio. Play/pause, seek, mute, volume, captions and full screen; it ends on Start here. Web-only.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { API_URL } from "@/lib/api";
import { fonts, useColors } from "@/lib/theme";

type Promo = { hd: string; sd: string; webm: string | null; poster: string; captions: string; duration: number | null };

// Files live on the site host (both snapfront.app and app.snapfront.app serve /site).
const local = (p: string) => (typeof window !== "undefined" && window.location.hostname !== "localhost" ? p : `${API_URL}${p}`);
const fmt = (s: number) => { const t = Math.max(0, Math.floor(s || 0)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };

const ICON = {
  play: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.8-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14z" /></svg>,
  pause: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>,
  sound: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>,
  muted: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" /><path d="m22 9-6 6M16 9l6 6" /></svg>,
  cc: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="3" /><path d="M10 10.2a2.5 2.5 0 1 0 0 3.6M17 10.2a2.5 2.5 0 1 0 0 3.6" strokeLinecap="round" /></svg>,
  full: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>,
};

const CSS = `
.sfp{position:relative;border-radius:22px;overflow:hidden;background:#000;aspect-ratio:16/9;font-family:Figtree,system-ui,sans-serif}
.sfp video{display:block;width:100%;height:100%;object-fit:cover;background:#000}
.sfp video::cue{font:600 clamp(15px,1.8vw,22px)/1.35 Figtree,system-ui,sans-serif;background:rgba(0,0,0,.72);color:#fff}
.sfp button{font:inherit;cursor:pointer}
.sfp-sound{position:absolute;left:18px;top:18px;display:inline-flex;align-items:center;gap:10px;padding:12px 20px 12px 16px;border-radius:999px;border:0;background:rgba(255,255,255,.94);color:#11151B;font-weight:800;font-size:16px;animation:sfp-pulse 2.2s ease-in-out infinite}
.sfp-sound svg{width:22px;height:22px}
@keyframes sfp-pulse{0%,100%{box-shadow:0 10px 30px rgba(0,0,0,.45),0 0 0 0 rgba(255,255,255,.55)}50%{box-shadow:0 10px 30px rgba(0,0,0,.45),0 0 0 12px rgba(255,255,255,0)}}
.sfp-big{position:absolute;inset:0;margin:auto;width:92px;height:92px;border-radius:50%;border:0;background:rgba(255,255,255,.94);color:#11151B;display:grid;place-items:center;box-shadow:0 14px 40px rgba(0,0,0,.5)}
.sfp-big svg{width:38px;height:38px;margin-left:5px}
.sfp-bar{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;gap:6px;padding:28px 12px 10px;background:linear-gradient(180deg,transparent,rgba(0,0,0,.78));transition:opacity .25s}
.sfp.idle .sfp-bar{opacity:0}
.sfp-bar button{width:42px;height:42px;border:0;border-radius:50%;background:transparent;color:#fff;display:grid;place-items:center;flex:none}
.sfp-bar button:hover,.sfp-bar button:focus-visible{background:rgba(255,255,255,.16)}
.sfp-bar button[aria-pressed="true"]{color:#FFB37A}
.sfp-bar svg{width:24px;height:24px}
.sfp-time{color:#fff;font-size:14px;font-variant-numeric:tabular-nums;min-width:86px;text-align:center;flex:none}
.sfp input[type=range]{-webkit-appearance:none;appearance:none;height:6px;border-radius:6px;cursor:pointer;margin:0;background:linear-gradient(90deg,#FF3CAC,#FF8A00 var(--p,0%),rgba(255,255,255,.28) var(--p,0%))}
.sfp input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#fff;border:0;box-shadow:0 1px 6px rgba(0,0,0,.5)}
.sfp input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:#fff;border:0}
.sfp-seek{flex:1;min-width:60px}.sfp-vol{width:96px;flex:none}
.sfp-end{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:center;gap:12px;flex-wrap:wrap;padding:40px 16px 5%;background:linear-gradient(180deg,transparent,rgba(0,0,0,.7))}
.sfp-end button{min-height:48px;padding:12px 24px;border-radius:999px;font-weight:700;font-size:16px}
.sfp-go{border:0;background:#F5F6F8;color:#11151B}.sfp-again{border:1px solid rgba(255,255,255,.5);background:transparent;color:#fff}
@media (max-width:640px){.sfp{border-radius:14px}.sfp-vol,.sfp-time{display:none}.sfp-sound{left:10px;top:10px;padding:9px 14px 9px 12px;font-size:14px}.sfp-bar{padding:22px 4px 4px;gap:2px}.sfp-bar button{width:38px;height:38px}
 .sfp-end{top:0;align-items:center;align-content:center;padding:12px;background:rgba(0,0,0,.66)}.sfp-end button{min-height:42px;padding:9px 16px;font-size:14px}}
@media (prefers-reduced-motion:reduce){.sfp-sound{animation:none}}
`;

export function PromoFilm() {
  const c = useColors();
  const [promo, setPromo] = useState<Promo | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`${API_URL}/api/promo`).then((r) => r.json()).then((j) => { if (alive && j?.promo) setPromo(j.promo); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  if (!promo) return null;
  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 2.4, color: c.brand }}>SEE IT IN 90 SECONDS</Text>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 36, lineHeight: 40, letterSpacing: -1.2, color: c.ink }}>Everything Snapfront does, in one quick film.</Text>
      </View>
      <View style={{ borderRadius: 22, borderWidth: 1, borderColor: c.line, boxShadow: c.dark ? "0 30px 90px rgba(0,0,0,.55), 0 0 120px rgba(217,60,170,.16)" : "0 30px 80px rgba(15,18,23,.18)" } as object}>
        <Player promo={promo} />
      </View>
    </View>
  );
}

function Player({ promo }: { promo: Promo }) {
  const box = useRef<HTMLDivElement | null>(null);
  const v = useRef<HTMLVideoElement | null>(null);
  const userPaused = useRef(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(true);
  const [heard, setHeard] = useState(false);
  const [volume, setVolume] = useState(80);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(promo.duration || 0);
  const [ended, setEnded] = useState(false);
  const [cc, setCc] = useState(false);
  const [idle, setIdle] = useState(false);

  const go = useCallback(() => { const el = v.current; if (!el) return; setEnded(false); el.play().catch(() => setPaused(true)); }, []);

  // Pick the file once: the 720p cut on small screens and data saver; WebM only if H.264 can't play.
  useEffect(() => {
    const el = v.current; if (!el) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const small = Math.min(window.screen.width, window.innerWidth) < 900 || Boolean(conn?.saveData);
    const h264 = el.canPlayType('video/mp4; codecs="avc1.640028"');
    el.src = local(!h264 && promo.webm ? promo.webm : small ? promo.sd : promo.hd);
    el.muted = true; el.volume = 0.8;
    const auto = !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches && !conn?.saveData;
    if (typeof IntersectionObserver === "undefined") { if (auto) go(); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (auto && !userPaused.current && !el.ended) go(); }
      else if (!el.paused) el.pause();
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [promo, go]);

  const wake = useCallback(() => {
    setIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => { if (v.current && !v.current.paused) setIdle(true); }, 2600);
  }, []);
  useEffect(() => () => { if (idleTimer.current) clearTimeout(idleTimer.current); }, []);

  const el = () => v.current!;
  const unmute = (restart: boolean) => {
    const e = el(); setHeard(true); e.muted = false;
    if (e.volume === 0) { e.volume = 0.8; setVolume(80); }
    if (restart) e.currentTime = 0;
    userPaused.current = false; go();
  };
  const toggle = () => { const e = el(); if (e.paused) { userPaused.current = false; go(); } else { userPaused.current = true; e.pause(); } };
  const toggleMute = () => { const e = el(); if (e.muted || e.volume === 0) unmute(false); else e.muted = true; };
  const toggleCc = () => { const t = el().textTracks[0]; if (!t) return; const on = t.mode !== "showing"; t.mode = on ? "showing" : "hidden"; setCc(on); };
  const full = () => {
    const b = box.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    const vid = v.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (b?.requestFullscreen) b.requestFullscreen();
    else vid?.webkitEnterFullscreen?.();
  };
  const pct = (n: number, of: number) => `${of ? Math.min(100, (n / of) * 100) : 0}%`;

  return (
    <div ref={box} className={`sfp${idle ? " idle" : ""}`} onMouseMove={wake} onTouchStart={wake} onFocus={wake}
      onKeyDown={(e) => { if ((e.target as HTMLElement).tagName === "INPUT") return; if (e.key === " " || e.key === "k") { e.preventDefault(); toggle(); } else if (e.key === "m") toggleMute(); }}>
      <style>{CSS}</style>
      <video ref={v} playsInline muted preload="metadata" poster={local(promo.poster)} aria-label="Snapfront promo video" crossOrigin="anonymous"
        onClick={() => (muted && !heard ? unmute(true) : toggle())}
        onPlay={() => { setPaused(false); wake(); }} onPause={() => { setPaused(true); setIdle(false); }}
        onVolumeChange={(e) => setMuted(e.currentTarget.muted || e.currentTarget.volume === 0)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => { setEnded(true); setPaused(true); }}>
        <track kind="captions" src={local(promo.captions)} srcLang="en" label="English" />
      </video>
      {muted && !paused && !heard && !ended ? (
        <button className="sfp-sound" type="button" onClick={() => unmute(true)}>{ICON.sound}<span>Tap for sound</span></button>
      ) : null}
      {paused && !ended ? <button className="sfp-big" type="button" aria-label="Play the video" onClick={() => { userPaused.current = false; go(); }}>{ICON.play}</button> : null}
      {ended ? (
        <div className="sfp-end">
          <button className="sfp-go" type="button" onClick={() => router.push("/start")}>Start here: find your first step →</button>
          <button className="sfp-again" type="button" onClick={() => { el().currentTime = 0; userPaused.current = false; go(); }}>Watch again</button>
        </div>
      ) : (
        <div className="sfp-bar">
          <button type="button" aria-label={paused ? "Play" : "Pause"} onClick={toggle}>{paused ? ICON.play : ICON.pause}</button>
          <input className="sfp-seek" type="range" min={0} max={1000} step={1} aria-label="Seek" value={duration ? Math.round((time / duration) * 1000) : 0}
            style={{ "--p": pct(time, duration) } as React.CSSProperties}
            onChange={(e) => { if (duration) el().currentTime = (Number(e.target.value) / 1000) * duration; }} />
          <span className="sfp-time">{fmt(time)} / {fmt(duration)}</span>
          <button type="button" aria-label={muted ? "Unmute" : "Mute"} onClick={toggleMute}>{muted ? ICON.muted : ICON.sound}</button>
          <input className="sfp-vol" type="range" min={0} max={100} step={1} aria-label="Volume" value={muted ? 0 : volume}
            style={{ "--p": `${muted ? 0 : volume}%` } as React.CSSProperties}
            onChange={(e) => { const n = Number(e.target.value); const vid = el(); setVolume(n); vid.volume = n / 100; vid.muted = n === 0; if (n > 0) setHeard(true); }} />
          <button type="button" aria-label="Captions" aria-pressed={cc} onClick={toggleCc}>{ICON.cc}</button>
          <button type="button" aria-label="Full screen" onClick={full}>{ICON.full}</button>
        </div>
      )}
    </div>
  );
}
