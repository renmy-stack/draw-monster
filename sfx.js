// 효과음·배경음악 — 파일 없이 Web Audio로 직접 합성 (8비트풍)
// SFX.play(이름, 값) / SFX.music('title'|'battle'|'ura'|null) / SFX.toggle()
'use strict';
const SFX = (() => {
  let ctx = null, master = null, sfxBus = null, musBus = null, noiseBuf = null;
  let muted = false;
  try { muted = localStorage.getItem('dm.muted') === '1'; } catch (e) {}
  const lastAt = {};

  function init() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ctx.destination);
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.8; sfxBus.connect(comp);
    musBus = ctx.createGain(); musBus.gain.value = 0.22; musBus.connect(comp);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  // 브라우저는 사용자가 한 번 터치해야 소리를 낼 수 있음
  function unlock() {
    if (!init()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (want && !cur) startMusic(want);
  }
  ['pointerdown', 'touchend', 'keydown'].forEach(ev => window.addEventListener(ev, unlock, { passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });

  const ready = () => ctx && ctx.state === 'running' && !muted;

  // ---------- 기본 음원 ----------
  function tone(o) {   // {type,f,f2,t,dur,vol,at,bus}
    const t = (o.at != null ? o.at : ctx.currentTime), dur = o.dur || 0.1;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + dur);
    if (o.detune) osc.detune.value = o.detune;
    const v = o.vol == null ? 0.3 : o.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.atk || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(o.bus || sfxBus);
    osc.start(t); osc.stop(t + dur + 0.02);
  }
  function noise(o) {  // {dur,vol,f,f2,q,type,at,bus}
    const t = (o.at != null ? o.at : ctx.currentTime), dur = o.dur || 0.1;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const fl = ctx.createBiquadFilter(); fl.type = o.type || 'lowpass'; fl.Q.value = o.q || 1;
    fl.frequency.setValueAtTime(o.f || 2000, t);
    if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
    const g = ctx.createGain(); const v = o.vol == null ? 0.3 : o.vol;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(fl); fl.connect(g); g.connect(o.bus || sfxBus);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  function notes(list, type, vol, step, at) {   // 짧은 멜로디: [midi|null, ...]
    const t0 = at || ctx.currentTime;
    list.forEach((n, i) => { if (n != null) tone({ type: type || 'square', f: midi(n), t: 0, at: t0 + i * step, dur: step * 1.6, vol: vol || 0.18 }); });
  }

  // ---------- 효과음 ----------
  const S = {
    tap() { tone({ type: 'square', f: 1250, f2: 900, dur: 0.045, vol: 0.08 }); },
    pop() { tone({ type: 'sine', f: 320, f2: 980, dur: 0.11, vol: 0.35 }); tone({ type: 'triangle', f: 640, f2: 1500, dur: 0.08, vol: 0.12 }); },
    done() { notes([72, 76, 79, 84], 'square', 0.14, 0.07); },   // 몸·팔·다리 완성
    erase() { noise({ type: 'bandpass', f: 3000, f2: 600, q: 2, dur: 0.18, vol: 0.25 }); },
    hit(dmg) {
      const k = Math.min(1, (dmg || 5) / 20);
      tone({ type: 'sine', f: 190 - k * 60, f2: 45, dur: 0.14 + k * 0.1, vol: 0.55 + k * 0.35 });
      noise({ f: 2600 - k * 1200, f2: 300, dur: 0.07 + k * 0.08, vol: 0.35 + k * 0.3 });
      tone({ type: 'square', f: 900 + Math.random() * 200, f2: 300, dur: 0.04, vol: 0.08 });
    },
    down() {
      tone({ type: 'square', f: 620, f2: 110, dur: 0.35, vol: 0.14 });
      const t = ctx.currentTime + 0.3;
      tone({ type: 'sine', f: 120, f2: 38, dur: 0.3, vol: 0.8, at: t });
      noise({ f: 700, f2: 120, dur: 0.25, vol: 0.4, at: t });
    },
    round() {   // 라운드 소개: 쓱 올라가는 소리 + 북
      noise({ type: 'bandpass', f: 400, f2: 4000, q: 1.5, dur: 0.5, vol: 0.3 });
      const t = ctx.currentTime + 0.45; tone({ type: 'sine', f: 110, f2: 50, dur: 0.25, vol: 0.7, at: t }); noise({ f: 1500, f2: 200, dur: 0.15, vol: 0.3, at: t });
    },
    fight() {   // 징
      [110, 164.8, 233, 311].forEach((f, i) => tone({ type: 'sine', f, f2: f * 0.985, dur: 1.6 - i * 0.2, vol: 0.28 - i * 0.05, atk: 0.01 }));
      noise({ f: 5000, f2: 800, dur: 0.25, vol: 0.25 });
    },
    ko() {
      tone({ type: 'sine', f: 90, f2: 28, dur: 1.0, vol: 1 });
      noise({ f: 3500, f2: 90, dur: 0.9, vol: 0.7 });
      const t = ctx.currentTime + 0.25;   // 종
      [1046.5, 1568, 2093].forEach((f, i) => tone({ type: 'triangle', f, dur: 1.4 - i * 0.3, vol: 0.2 - i * 0.05, at: t + i * 0.02 }));
    },
    timeup() { const t = ctx.currentTime; tone({ type: 'square', f: 1760, dur: 0.12, vol: 0.14, at: t }); tone({ type: 'square', f: 1760, dur: 0.12, vol: 0.14, at: t + 0.16 }); tone({ type: 'square', f: 1318, dur: 0.4, vol: 0.14, at: t + 0.32 }); },
    win() { notes([72, 76, 79, 84, null, 79, 84], 'square', 0.16, 0.1); notes([48, null, 55, null, 60, null, 60], 'triangle', 0.3, 0.1); },
    clear() { notes([67, 72, 76, 79, 76, 79, 84, null, 84, 86, 88], 'square', 0.16, 0.1); notes([48, 55, 60, 55, 53, 57, 60, null, 55, 59, 60], 'triangle', 0.3, 0.1); },
    lose() { const t = ctx.currentTime; [67, 66, 65, 64].forEach((n, i) => tone({ type: 'sawtooth', f: midi(n), f2: i === 3 ? midi(n) * 0.8 : 0, dur: i === 3 ? 0.7 : 0.26, vol: 0.12, at: t + i * 0.28 })); },
    draw() { notes([64, 62, 64, null, 60], 'square', 0.13, 0.12); },
    fanfare() { notes([60, 60, 60, 60, null, 56, null, 58, null, 60, null, 58, 60, null, null, null, 67, 67, 67, 72], 'square', 0.16, 0.11); notes([48, null, 48, null, 44, null, 46, null, 48, null, 46, 48, null, null, null, null, 55, null, 55, 60], 'triangle', 0.3, 0.11); },
  };
  const GAP = { hit: 0.05, tap: 0.03, pop: 0.05 };
  function play(name, arg) {
    if (!ready() || !S[name]) return;
    const now = ctx.currentTime;
    if (GAP[name] && lastAt[name] && now - lastAt[name] < GAP[name]) return;   // 빨리 감기 때 너무 겹치지 않게
    lastAt[name] = now;
    try { S[name](arg); } catch (e) {}
  }

  // ---------- 배경음악 (16분음표 단위 순서기) ----------
  // 음 이름 → midi. '-' = 앞 음 이어짐, '.' = 쉼
  const NN = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function parse(str) {
    return str.trim().split(/\s+/).map(s => {
      if (s === '.' || s === '-') return s;
      const m = /^([A-G])(#|b)?(\d)$/.exec(s); if (!m) return '.';
      return 12 * (+m[3] + 1) + NN[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    });
  }
  const SONGS = {
    title: { bpm: 112,
      lead: parse(`
        E5 - G5 - C6 - - - B5 - G5 - E5 - - -    A5 - C6 - E6 - - - D6 - C6 - A5 - - -
        F5 - A5 - C6 - - - D6 - C6 - A5 - F5 -   G5 - - - B5 - - - D6 - - - . . . .
        E5 - G5 - C6 - - - B5 - G5 - E5 - - -    A5 - C6 - E6 - - - G6 - E6 - C6 - - -
        F5 - E5 - D5 - - - G5 - F5 - E5 - D5 -   C5 - - - - - - - . . . . . . . .`),
      bassN: parse(`
        C3 . G3 . C3 . G3 . C3 . G3 . C3 . G3 .  A2 . E3 . A2 . E3 . A2 . E3 . A2 . E3 .
        F2 . C3 . F2 . C3 . F2 . C3 . F2 . C3 .  G2 . D3 . G2 . D3 . G2 . D3 . G2 . B2 .
        C3 . G3 . C3 . G3 . C3 . G3 . C3 . G3 .  A2 . E3 . A2 . E3 . A2 . E3 . A2 . E3 .
        F2 . C3 . F2 . C3 . G2 . D3 . G2 . D3 .  C3 . G3 . C3 . G3 . C3 . - . . . . .`) },
    battle: { bpm: 152,
      lead: parse(`
        A4 - . A4 C5 - E5 - D5 - C5 - B4 - G4 -  A4 - . A4 C5 - E5 - A5 - - - G5 - E5 -
        F5 - . F5 E5 - D5 - C5 - D5 - E5 - - -   D5 - . D5 C5 - B4 - G#4 - B4 - E5 - - -
        A5 - . A5 G5 - E5 - C5 - D5 - E5 - G5 -  A5 - . A5 B5 - C6 - B5 - A5 - G5 - E5 -
        F5 - E5 - D5 - C5 - B4 - C5 - D5 - E5 -  E5 - - - G#5 - - - B5 - - - E6 - - -`),
      bassN: parse(`
        A2 A3 A2 A3 A2 A3 A2 A3 A2 A3 A2 A3 G2 G3 G2 G3   A2 A3 A2 A3 A2 A3 A2 A3 A2 A3 A2 A3 C3 C4 C3 C4
        F2 F3 F2 F3 F2 F3 F2 F3 F2 F3 F2 F3 F2 F3 F2 F3   E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 E2 E3
        A2 A3 A2 A3 A2 A3 A2 A3 C3 C4 C3 C4 C3 C4 C3 C4   F2 F3 F2 F3 F2 F3 F2 F3 G2 G3 G2 G3 G2 G3 G2 G3
        D3 D4 D3 D4 D3 D4 D3 D4 D3 D4 D3 D4 D3 D4 D3 D4   E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 E2 E3`),
      drum: true },
    ura: { bpm: 138,
      lead: parse(`
        D5 - - - Eb5 - - - D5 - C5 - A4 - - -   D5 - - - F5 - - - Eb5 - D5 - C5 - - -
        Bb4 - - - C5 - - - D5 - - - A4 - - -    G4 - A4 - Bb4 - C5 - D5 - - - . . . .
        D6 - - - C6 - Bb5 - A5 - - - F5 - - -   G5 - - - A5 - Bb5 - A5 - G5 - F5 - - -
        Eb5 - - - D5 - C5 - D5 - - - - - - -    Eb5 - D5 - C#5 - - - D5 - - - . . . .`),
      bassN: parse(`
        D2 D2 D3 D2 D2 D2 D3 D2 D2 D2 D3 D2 Eb2 Eb2 Eb3 Eb2  D2 D2 D3 D2 D2 D2 D3 D2 D2 D2 D3 D2 C2 C2 C3 C2
        Bb1 Bb1 Bb2 Bb1 Bb1 Bb1 Bb2 Bb1 A1 A1 A2 A1 A1 A1 A2 A1  G1 G1 G2 G1 G1 G1 G2 G1 A1 A1 A2 A1 A1 A1 A2 A1
        D2 D2 D3 D2 D2 D2 D3 D2 D2 D2 D3 D2 D2 D2 D3 D2  G1 G1 G2 G1 G1 G1 G2 G1 G1 G1 G2 G1 G1 G1 G2 G1
        Eb2 Eb2 Eb3 Eb2 Eb2 Eb2 Eb3 Eb2 D2 D2 D3 D2 D2 D2 D3 D2  A1 A1 A2 A1 A1 A1 A2 A1 D2 D2 D3 D2 D2 D2 D3 D2`),
      drum: true },
  };
  let want = null, cur = null, step = 0, nextT = 0, timer = null, songGain = null;
  function startMusic(name) {
    stopMusic();
    if (!ctx || !SONGS[name]) return;
    cur = name; step = 0; nextT = ctx.currentTime + 0.08;
    songGain = ctx.createGain(); songGain.gain.value = 1; songGain.connect(musBus);
    timer = setInterval(tick, 25);
  }
  function stopMusic() {
    if (timer) clearInterval(timer); timer = null;
    if (songGain && ctx) { const g = songGain; g.gain.setTargetAtTime(0, ctx.currentTime, 0.08); setTimeout(() => g.disconnect(), 600); }
    songGain = null; cur = null;
  }
  function tick() {
    const song = SONGS[cur]; if (!song || !ctx) return;
    const sp = 60 / song.bpm / 4, len = song.lead.length;
    while (nextT < ctx.currentTime + 0.12) {
      const i = step % len;
      const ln = song.lead[i];
      if (typeof ln === 'number') {
        let n = 1; while (song.lead[(i + n) % len] === '-' && n < 16) n++;
        tone({ type: 'square', f: midi(ln), at: nextT, dur: sp * n * 0.95, vol: 0.13, bus: songGain });
        tone({ type: 'square', f: midi(ln), at: nextT, dur: sp * n * 0.95, vol: 0.05, detune: 12, bus: songGain });
      }
      const bn = song.bassN[i % song.bassN.length];
      if (typeof bn === 'number') {
        let n = 1; while (song.bassN[(i + n) % len] === '-' && n < 16) n++;
        tone({ type: 'triangle', f: midi(bn), at: nextT, dur: sp * Math.max(1, n) * 0.9, vol: 0.4, bus: songGain });
      }
      if (song.drum) {
        if (i % 8 === 0) tone({ type: 'sine', f: 150, f2: 40, at: nextT, dur: 0.12, vol: 0.55, bus: songGain });
        if (i % 8 === 4) noise({ f: 3000, f2: 900, at: nextT, dur: 0.1, vol: 0.28, bus: songGain });
        if (i % 2 === 0) noise({ type: 'highpass', f: 7000, at: nextT, dur: 0.03, vol: 0.12, bus: songGain });
      }
      nextT += sp; step++;
    }
  }
  function music(name) {
    want = name || null;
    if (!ctx || ctx.state !== 'running') return;   // 첫 터치 뒤에 시작
    if (want === cur) return;
    if (want) startMusic(want); else stopMusic();
  }

  function setMuted(m) {
    muted = m;
    try { localStorage.setItem('dm.muted', m ? '1' : '0'); } catch (e) {}
    if (ctx) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.03);
  }
  return { play, music, toggle() { setMuted(!muted); return muted; }, get muted() { return muted; } };
})();
