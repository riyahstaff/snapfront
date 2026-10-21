/* Ask Vierra: Snapfront's voice guide. A launcher in the corner and a voice/typing panel.
   Talks to an ElevenLabs agent through @elevenlabs/client, which loads only when the panel opens.
   The page passes the SDK address in data-sdk; /api/vierra/session hands out one-time tokens. */
(function () {
  "use strict";
  if (window.Vierra) return;
  var script = document.currentScript;
  var SDK = (script && script.getAttribute("data-sdk")) || "";
  var API = (script && script.getAttribute("data-api")) || "/api/vierra/session";
  // In the web app the launcher starts hidden and the Home screen shows it (Vierra.show / Vierra.hide).
  var allowed = !(script && script.hasAttribute("data-hidden"));
  var GREETING = "Hey, I'm Vierra. Ask me anything about Snapfront: how something works, where to find it, or what to do next.";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- the mango (an original drawing) ---------- */
  var uid = 0;
  function mango(size) {
    var id = "vm" + (++uid);
    var body = "M11.8 33.2C7.6 26.6 10.2 16.4 18.2 11.6c7.2-4.3 16.6-3.2 20.4 2.9 3.4 5.4.4 12.3-5.6 17.6-6.4 5.6-17 8.1-21.2 1.1z";
    return '<svg class="mango" width="' + size + '" height="' + size + '" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="' + id + 'b" x1="0.85" y1="0.05" x2="0.15" y2="0.95"><stop offset="0" stop-color="#8CC63F"/><stop offset=".28" stop-color="#E9D642"/><stop offset=".55" stop-color="#FFB23A"/><stop offset=".8" stop-color="#FF7B32"/><stop offset="1" stop-color="#E5483B"/></linearGradient>' +
      '<radialGradient id="' + id + 'g" cx="38%" cy="34%" r="55%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + id + 'l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8EDB6A"/><stop offset="1" stop-color="#2F9A4E"/></linearGradient>' +
      '<linearGradient id="' + id + 's" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<clipPath id="' + id + 'c"><path d="' + body + '"/></clipPath></defs><g transform="translate(-3.5 3)">' +
      '<path d="' + body + '" fill="url(#' + id + 'b)"/>' +
      '<path d="' + body + '" fill="url(#' + id + 'g)"/>' +
      '<path d="M35.4 10.9c.4-1.6 1.2-2.8 2.4-3.7" fill="none" stroke="#6B4A2B" stroke-width="1.7" stroke-linecap="round"/>' +
      '<path d="M37.4 7.6c2.9-3.4 7.4-4.1 10.2-2.3-2.4 3.5-6.9 4.7-10.2 2.3z" fill="url(#' + id + 'l)"/>' +
      '<path d="M37.9 7.3c2.6-1 5-1.5 7.6-1.7" fill="none" stroke="#1F6E36" stroke-opacity=".5" stroke-width=".7" stroke-linecap="round"/>' +
      '<g clip-path="url(#' + id + 'c)"><rect class="shine" x="-30" y="-4" width="14" height="56" fill="url(#' + id + 's)" transform="skewX(-20)"/></g>' +
      '</g></svg>';
  }

  var icons = {
    mic: '<svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true"><path d="M12 14.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 1 0-7 0v5a3.5 3.5 0 0 0 3.5 3.5z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M18.5 11a6.5 6.5 0 0 1-13 0M12 17.5V21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    stop: '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2.5" fill="currentColor"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    sound: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    muted: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M16 9.5l5 5M21 9.5l-5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    wave: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    keys: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M7 10h.01M10 10h.01M13 10h.01M16 10h.01M8 14h8" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
    send: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  var CSS = [
    ":host{all:initial;font-family:Figtree,system-ui,-apple-system,'Segoe UI',sans-serif;--ink:#F5F6F8;--muted:#A7AFBC;--line:rgba(255,255,255,.1);--panel:#0C0F15;--card:rgba(255,255,255,.04);--m1:#FFC24A;--m2:#FF8A2B;--m3:#F2613A;--good:#4ADE9B;color:var(--ink)}",
    "*{box-sizing:border-box}button{font:inherit;color:inherit;cursor:pointer}[hidden]{display:none!important}",
    ".launch{position:fixed;right:max(18px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));z-index:2147483000;display:flex;align-items:center;gap:10px;padding:7px 20px 7px 7px;border:0;border-radius:999px;background:linear-gradient(135deg,var(--m1),var(--m2) 60%,var(--m3));color:#2A1405;font-weight:800;font-size:16px;letter-spacing:-.01em;box-shadow:0 10px 30px rgba(255,138,43,.35),0 2px 6px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.45)}",
    ".launch .badge{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.32);box-shadow:inset 0 0 0 1px rgba(255,255,255,.4)}",
    ".launch:hover{filter:brightness(1.05)}.launch:focus-visible,button:focus-visible,input:focus-visible{outline:2px solid #fff;outline-offset:3px}",
    ".launch[hidden]{display:none}",
    ".mango .shine{animation:none}",
    ".launch.shimmer .mango .shine{animation:vshine 1.6s cubic-bezier(.4,0,.2,1) 3 .6s}",
    "@keyframes vshine{0%{transform:skewX(-20deg) translateX(0)}70%,100%{transform:skewX(-20deg) translateX(80px)}}",
    ".launch.shimmer{animation:vglow 1.6s ease-in-out 3 .6s}",
    "@keyframes vglow{50%{box-shadow:0 10px 36px rgba(255,170,60,.6),0 2px 6px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.5)}}",
    ".panel{position:fixed;right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));z-index:2147483001;width:min(400px,calc(100vw - 28px));height:min(700px,calc(100vh - 28px));display:flex;flex-direction:column;gap:14px;padding:16px;border-radius:26px;background:radial-gradient(120% 60% at 50% 0%,rgba(255,150,50,.16),transparent 60%),var(--panel);border:1px solid var(--line);box-shadow:0 30px 80px rgba(0,0,0,.6);overflow:hidden}",
    ".panel[hidden]{display:none}",
    "header{display:flex;align-items:center;gap:12px}",
    ".av{position:relative;width:52px;height:52px;border-radius:16px;display:grid;place-items:center;background:linear-gradient(145deg,#2A2118,#16120E);border:1px solid rgba(255,190,90,.25)}",
    ".av .dot{position:absolute;right:-3px;bottom:-3px;width:14px;height:14px;border-radius:50%;background:var(--good);border:3px solid var(--panel)}",
    ".who{flex:1;min-width:0}.who b{display:block;font-size:19px;letter-spacing:-.01em}.who span{font-size:13px;color:var(--muted)}.who i{font-style:normal;color:var(--good)}",
    ".ib{width:42px;height:42px;border-radius:13px;border:1px solid var(--line);background:var(--card);display:grid;place-items:center}",
    ".ib:hover{background:rgba(255,255,255,.08)}",
    ".tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:5px;border-radius:16px;border:1px solid var(--line);background:rgba(255,255,255,.03)}",
    ".tab{display:flex;align-items:center;justify-content:center;gap:8px;height:46px;border:0;border-radius:12px;background:transparent;color:var(--muted);font-weight:700;font-size:16px}",
    ".tab[aria-selected=true]{color:var(--ink);background:linear-gradient(180deg,rgba(255,170,60,.28),rgba(255,120,40,.14));box-shadow:inset 0 0 0 1px rgba(255,180,80,.35)}",
    ".voice{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:8px 0}",
    ".voice>*{flex-shrink:0}",
    ".stage{position:relative;display:flex;align-items:center;justify-content:center;gap:14px;width:100%}",
    ".bars{display:flex;align-items:center;gap:4px;height:80px}.bars i{display:block;width:4px;border-radius:3px;background:linear-gradient(180deg,var(--m1),var(--m3));opacity:.75;height:12px;transition:height .08s linear}",
    ".mic{position:relative;width:132px;height:132px;border-radius:50%;border:0;display:grid;place-items:center;color:#2A1405;background:radial-gradient(circle at 35% 30%,#FFD877,var(--m2) 55%,var(--m3));box-shadow:0 0 0 10px rgba(255,150,50,.10),0 0 0 22px rgba(255,150,50,.06),0 0 0 36px rgba(255,150,50,.035),0 14px 40px rgba(255,120,40,.35),inset 0 2px 0 rgba(255,255,255,.4)}",
    ".mic.live{animation:vpulse 1.8s ease-in-out infinite}",
    "@keyframes vpulse{50%{box-shadow:0 0 0 14px rgba(255,150,50,.16),0 0 0 30px rgba(255,150,50,.08),0 0 0 46px rgba(255,150,50,.04),0 14px 40px rgba(255,120,40,.4),inset 0 2px 0 rgba(255,255,255,.4)}}",
    ".mic:disabled{filter:grayscale(.4) brightness(.8);cursor:wait}",
    ".say{display:flex;align-items:center;gap:8px;font-weight:700;font-size:18px;color:#FFD28A;text-align:center}",
    ".states{display:flex;gap:10px;font-size:14px;color:#6E7684}.states span[aria-current=true]{color:var(--ink);font-weight:700}.states b{color:#444B57}",
    ".latest{width:100%;text-align:left;border:1px solid var(--line);background:var(--card);border-radius:16px;padding:12px 16px;max-height:150px;overflow:auto}",
    ".latest small{display:block;font-size:11px;letter-spacing:.08em;color:var(--muted);margin-bottom:4px;text-transform:uppercase}",
    ".latest p{margin:0;font-size:15px;line-height:1.45}",
    ".chat{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:10px;padding:2px}",
    ".msg{max-width:88%;padding:10px 14px;border-radius:16px;font-size:15px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}",
    ".msg.agent{align-self:flex-start;background:rgba(255,255,255,.06);border-bottom-left-radius:6px}",
    ".msg.user{align-self:flex-end;background:linear-gradient(135deg,var(--m1),var(--m2));color:#2A1405;border-bottom-right-radius:6px}",
    ".msg.note{align-self:center;background:transparent;color:var(--muted);font-size:13px;text-align:center}",
    ".typing{align-self:flex-start;color:var(--muted);font-size:14px;padding:4px 6px}",
    ".backrow{display:flex;align-items:center;gap:6px;border:0;background:none;color:var(--muted);font-size:14px;padding:0}",
    ".compose{display:flex;align-items:center;gap:8px;padding:8px;border-radius:18px;border:1px solid var(--line);background:rgba(255,255,255,.03)}",
    ".compose input{flex:1;min-width:0;height:44px;border:0;background:transparent;color:var(--ink);font:inherit;font-size:16px;outline:none;padding:0 6px}",
    ".compose input::placeholder{color:#7C8492}",
    ".send{width:46px;height:46px;border-radius:14px;border:0;display:grid;place-items:center;background:linear-gradient(135deg,var(--m1),var(--m2));color:#2A1405}",
    ".send:disabled{opacity:.45;cursor:default}",
    ".fine{margin:0;text-align:center;font-size:12px;color:#7C8492}",
    ".err{color:#FFB4A8}",
    "@media (max-width:480px){.panel{right:0;bottom:0;width:100vw;height:100dvh;border-radius:0;padding:14px}.mic{width:118px;height:118px}.bars{height:64px}}",
    "@media (prefers-reduced-motion:reduce){.mic.live,.launch.shimmer,.launch.shimmer .mango .shine{animation:none}.bars i{transition:none}}",
  ].join("\n");

  /* ---------- state ---------- */
  var host, root, el = {}, conv = null, convMode = null, starting = false, muted = false, mode = "listening", thinking = false, raf = 0;
  var messages = [{ role: "agent", text: GREETING }], view = "voice", showTranscript = false, pendingText = null;

  function h(tag, attrs, html) {
    var n = document.createElement(tag);
    for (var k in attrs || {}) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function build() {
    host = h("div", { id: "ask-vierra" });
    document.body.appendChild(host);
    root = host.attachShadow({ mode: "open" });
    root.appendChild(h("style", {}, CSS));
    el.launch = h("button", { class: "launch", type: "button", "aria-haspopup": "dialog", "aria-label": "Ask Vierra, Snapfront's voice guide" },
      '<span class="badge">' + mango(30) + '</span><span>Ask Vierra</span>');
    el.launch.addEventListener("click", open);
    el.launch.hidden = !allowed;
    root.appendChild(el.launch);
    if (!reduceMotion) {
      if (allowed) shimmer();
      // A gentle reminder every so often, never while the panel is open.
      setInterval(function () { if (el.panel.hidden && document.visibilityState === "visible") { el.launch.classList.remove("shimmer"); void el.launch.offsetWidth; el.launch.classList.add("shimmer"); setTimeout(function () { el.launch.classList.remove("shimmer"); }, 6000); } }, 45000);
    }

    el.panel = h("section", { class: "panel", role: "dialog", "aria-modal": "false", "aria-label": "Ask Vierra", hidden: "" });
    el.panel.innerHTML =
      '<header><div class="av">' + mango(34) + '<span class="dot" aria-hidden="true"></span></div>' +
      '<div class="who"><b>Vierra</b><span>Snapfront guide &middot; <i>&#9679; Online</i></span></div>' +
      '<button class="ib" type="button" data-act="sound" aria-label="Mute Vierra" aria-pressed="false">' + icons.sound + '</button>' +
      '<button class="ib" type="button" data-act="close" aria-label="Close">' + icons.close + '</button></header>' +
      '<div class="tabs" role="tablist" aria-label="Talk or type">' +
      '<button class="tab" role="tab" type="button" data-tab="voice" aria-selected="true">' + icons.wave + 'Voice</button>' +
      '<button class="tab" role="tab" type="button" data-tab="type" aria-selected="false">' + icons.keys + 'Type</button></div>' +
      '<div class="voice" data-view="voice">' +
      '<div class="stage"><div class="bars" aria-hidden="true" data-bars="l"></div>' +
      '<button class="mic" type="button" data-act="mic" aria-label="Start talking to Vierra">' + icons.mic + '</button>' +
      '<div class="bars" aria-hidden="true" data-bars="r"></div></div>' +
      '<div class="say" aria-live="polite" data-say>' + icons.wave + '<span>Tap the mic to talk</span></div>' +
      '<div class="states" aria-hidden="true"><span data-st="listening">Listening</span><b>&bull;</b><span data-st="thinking">Thinking</span><b>&bull;</b><span data-st="responding">Responding</span></div>' +
      '<button class="latest" type="button" data-act="transcript" aria-label="Read the full conversation"><small>Latest message &middot; tap for the full chat</small><p aria-live="polite" data-latest></p></button></div>' +
      '<div class="chat" data-view="chat" hidden role="log" aria-live="polite"></div>' +
      '<form class="compose" data-form><button class="ib" type="button" data-act="keys" aria-label="Type a message">' + icons.keys + '</button>' +
      '<input data-input type="text" autocomplete="off" maxlength="500" placeholder="Type your message…" aria-label="Message to Vierra">' +
      '<button class="send" type="submit" aria-label="Send" disabled>' + icons.send + '</button></form>' +
      '<p class="fine">Vierra can make mistakes. For anything important, check the <a href="/help" style="color:inherit">Help page</a> or email support@snapfront.app.</p>';
    root.appendChild(el.panel);

    ["l", "r"].forEach(function (side) {
      var box = el.panel.querySelector('[data-bars="' + side + '"]');
      for (var i = 0; i < 9; i++) box.appendChild(h("i"));
    });
    el.bars = [].slice.call(el.panel.querySelectorAll(".bars i"));
    el.mic = el.panel.querySelector('[data-act="mic"]');
    el.say = el.panel.querySelector("[data-say] span");
    el.latest = el.panel.querySelector("[data-latest]");
    el.chat = el.panel.querySelector('[data-view="chat"]');
    el.voice = el.panel.querySelector('[data-view="voice"]');
    el.input = el.panel.querySelector("[data-input]");
    el.send = el.panel.querySelector(".send");
    el.sound = el.panel.querySelector('[data-act="sound"]');
    el.tabs = [].slice.call(el.panel.querySelectorAll(".tab"));
    el.states = [].slice.call(el.panel.querySelectorAll("[data-st]"));
    idleBars();

    el.panel.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act],[data-tab]");
      if (!b) return;
      if (b.dataset.tab) return setView(b.dataset.tab === "type" ? "type" : "voice");
      var act = b.dataset.act;
      if (act === "close") close();
      else if (act === "mic") toggleVoice();
      else if (act === "sound") setMuted(!muted);
      else if (act === "keys") { setView("type"); el.input.focus(); }
      else if (act === "transcript") { showTranscript = true; render(); }
      else if (act === "back") { showTranscript = false; render(); }
    });
    el.input.addEventListener("input", function () { el.send.disabled = !el.input.value.trim(); if (conv && conv.sendUserActivity) try { conv.sendUserActivity(); } catch (_) {} });
    el.panel.querySelector("[data-form]").addEventListener("submit", function (e) { e.preventDefault(); sendText(); });
    root.addEventListener("keydown", function (e) { if (e.key === "Escape" && !el.panel.hidden) close(); });
    render();
  }

  /* ---------- views ---------- */
  function setView(v) { view = v; showTranscript = false; render(); if (v === "type") el.input.focus(); }
  function render() {
    var chatView = view === "type" || showTranscript;
    el.tabs.forEach(function (t) { t.setAttribute("aria-selected", String(t.dataset.tab === (view === "type" ? "type" : "voice"))); });
    el.voice.hidden = chatView; el.chat.hidden = !chatView;
    var last = messages.filter(function (m) { return m.role === "agent"; }).slice(-1)[0];
    el.latest.textContent = last ? last.text : "";
    if (chatView) {
      el.chat.innerHTML = (showTranscript && view !== "type" ? '<button class="backrow" type="button" data-act="back">' + icons.back + 'Back to voice</button>' : "") +
        messages.map(function (m) { return '<div class="msg ' + m.role + '">' + esc(m.text) + "</div>"; }).join("") +
        (thinking ? '<div class="typing">Vierra is thinking…</div>' : "");
      el.chat.scrollTop = el.chat.scrollHeight;
    }
    var live = conv && convMode === "voice";
    el.mic.classList.toggle("live", Boolean(live) && !reduceMotion);
    el.mic.innerHTML = live ? icons.stop : icons.mic;
    el.mic.setAttribute("aria-label", live ? "Stop talking to Vierra" : "Start talking to Vierra");
    el.mic.disabled = starting;
    var st = !live ? "" : thinking ? "thinking" : mode === "speaking" ? "responding" : "listening";
    el.states.forEach(function (s) { s.setAttribute("aria-current", String(s.dataset.st === st)); });
    el.say.textContent = starting ? "Connecting…" : !live ? "Tap the mic to talk" : st === "responding" ? "Vierra is talking. Tap to stop." : st === "thinking" ? "Thinking…" : "Listening… tap to stop";
  }
  function add(role, text) {
    text = String(text || "").trim();
    if (!text) return;
    var prev = messages[messages.length - 1];
    if (prev && prev.role === role && prev.text === text) return;
    messages.push({ role: role, text: text });
    if (messages.length > 80) messages.splice(1, messages.length - 80);
    render();
  }
  function note(text) { messages.push({ role: "note", text: text }); render(); }

  /* ---------- the bars ---------- */
  function idleBars() { el.bars.forEach(function (b, i) { var k = i % 9; b.style.height = (10 + 26 * Math.sin((k + 1) / 10 * Math.PI)) + "px"; }); }
  function animate() {
    cancelAnimationFrame(raf);
    if (!conv || convMode !== "voice") return idleBars();
    var data = null;
    try { data = mode === "speaking" ? conv.getOutputByteFrequencyData() : conv.getInputByteFrequencyData(); } catch (_) { data = null; }
    el.bars.forEach(function (b, i) {
      var k = i % 9, v = data && data.length ? data[Math.floor((k + 1) / 10 * data.length * 0.6)] / 255 : 0;
      b.style.height = Math.max(8, Math.round(8 + v * 72 * (0.5 + 0.5 * Math.sin((k + 1) / 10 * Math.PI)))) + "px";
    });
    if (!reduceMotion) raf = requestAnimationFrame(animate);
  }

  /* ---------- talking to the agent ---------- */
  var sdkPromise = null;
  function loadSdk() {
    if (window.ElevenLabsClient) return Promise.resolve(window.ElevenLabsClient);
    if (!sdkPromise) sdkPromise = new Promise(function (resolve, reject) {
      var s = document.createElement("script"); s.src = SDK; s.async = true;
      s.onload = function () { window.ElevenLabsClient ? resolve(window.ElevenLabsClient) : reject(new Error("sdk")); };
      s.onerror = function () { sdkPromise = null; reject(new Error("sdk")); };
      document.head.appendChild(s);
    });
    return sdkPromise;
  }
  function ticket(kind) {
    return fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: kind }), credentials: "omit" })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || "Vierra couldn't start. Try again in a minute."); return j; }); });
  }
  function callbacks(kind) {
    return {
      onConnect: function () { starting = false; render(); },
      onDisconnect: function () { if (convMode === kind) { conv = null; convMode = null; thinking = false; mode = "listening"; animate(); render(); } },
      onError: function (message) { console.warn("[vierra]", message); },
      onModeChange: function (p) { mode = p && p.mode === "speaking" ? "speaking" : "listening"; if (mode === "speaking") thinking = false; render(); },
      onMessage: function (p) {
        var role = p && (p.role || (p.source === "ai" ? "agent" : "user"));
        // Her greeting is already on screen; skip it when a new conversation repeats it.
        if (role === "agent") { thinking = false; if (String(p.message || "").trim() !== GREETING) add("agent", p.message); else render(); }
        else if (role === "user") { add("user", p.message); thinking = true; render(); }
      },
    };
  }
  function start(kind) {
    if (starting) return Promise.reject(new Error("busy"));
    starting = true; render();
    var end = conv ? conv.endSession().catch(function () {}) : Promise.resolve();
    conv = null; convMode = null;
    return end.then(function () { return Promise.all([loadSdk(), ticket(kind)]); }).then(function (r) {
      var SDKNS = r[0], t = r[1], opts = callbacks(kind);
      if (kind === "voice") { opts.conversationToken = t.conversation_token; opts.connectionType = "webrtc"; }
      else { opts.signedUrl = t.signed_url; opts.connectionType = "websocket"; opts.textOnly = true; opts.overrides = { conversation: { textOnly: true } }; }
      return SDKNS.Conversation.startSession(opts);
    }).then(function (c) {
      conv = c; convMode = kind; starting = false;
      if (kind === "voice") { try { c.setVolume({ volume: muted ? 0 : 1 }); } catch (_) {} animate(); }
      if (pendingText) { var t = pendingText; pendingText = null; try { c.sendUserMessage(t); } catch (_) {} }
      render();
      return c;
    }).catch(function (e) {
      starting = false; conv = null; convMode = null; pendingText = null; thinking = false; render();
      var msg = /permission|notallowed|denied/i.test(String(e && (e.name + " " + e.message))) ? "Vierra needs your microphone to talk. Allow it in your browser, or switch to Type." : (e && e.message && e.message !== "sdk" ? e.message : "Vierra couldn't start. Check your connection and try again.");
      note(msg);
      throw e;
    });
  }
  function toggleVoice() {
    if (conv && convMode === "voice") { var c = conv; conv = null; convMode = null; thinking = false; c.endSession().catch(function () {}); animate(); render(); return; }
    start("voice").catch(function () {});
  }
  function sendText() {
    var text = el.input.value.trim();
    if (!text) return;
    el.input.value = ""; el.send.disabled = true;
    if (view !== "type" && !(conv && convMode === "voice")) setView("type");
    add("user", text); thinking = true; render();
    if (conv) { try { conv.sendUserMessage(text); } catch (_) { thinking = false; note("That didn't send. Try again."); } return; }
    // Not connected yet: send it as soon as the conversation opens.
    pendingText = pendingText ? pendingText + "\n" + text : text;
    if (!starting) start("text").catch(function () {});
  }
  function setMuted(m) {
    muted = m;
    el.sound.innerHTML = m ? icons.muted : icons.sound;
    el.sound.setAttribute("aria-pressed", String(m));
    el.sound.setAttribute("aria-label", m ? "Unmute Vierra" : "Mute Vierra");
    if (conv && convMode === "voice") try { conv.setVolume({ volume: m ? 0 : 1 }); } catch (_) {}
  }

  /* ---------- open and close ---------- */
  function open() {
    if (!el.panel) return;
    el.panel.hidden = false; el.launch.hidden = true;
    render();
    (view === "type" ? el.input : el.mic).focus();
    loadSdk().catch(function () {});   // warm up while they read
  }
  function close() {
    if (conv) { var c = conv; conv = null; convMode = null; c.endSession().catch(function () {}); }
    thinking = false; animate();
    el.panel.hidden = true; el.launch.hidden = !allowed;
    if (allowed) el.launch.focus();
  }
  function shimmer() {
    if (reduceMotion || !el.launch) return;
    el.launch.classList.remove("shimmer"); void el.launch.offsetWidth; el.launch.classList.add("shimmer");
    setTimeout(function () { el.launch.classList.remove("shimmer"); }, 6000);
  }
  /** Show the launcher (with its shimmer) or hide it; an open panel stays open until it's closed. */
  function setAllowed(on) {
    var was = allowed; allowed = on;
    if (!el.launch || !el.panel.hidden) return;
    el.launch.hidden = !on;
    if (on && !was) shimmer();
  }
  window.addEventListener("pagehide", function () { if (conv) try { conv.endSession(); } catch (_) {} });

  window.Vierra = { open: function () { open(); }, close: function () { close(); }, ask: function () { open(); setView("type"); },
    show: function () { setAllowed(true); }, hide: function () { setAllowed(false); } };
  try { window.dispatchEvent(new Event("vierra-ready")); } catch (_) {}
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();
  document.addEventListener("click", function (e) { var t = e.target.closest && e.target.closest("[data-open-vierra]"); if (t) { e.preventDefault(); open(); } });
})();
