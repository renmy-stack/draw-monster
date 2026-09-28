// ガチャの 演出（見た目だけ）: ガチャマシン → カプセル → タップで あける → しょうかく → ★★★ の 大演出。スキップ できる
// KZStage.play({ rs: [{ item: { r, name } , dup }], multi, onDone }) — 結果は 先に 決まっている（演出は 見せ方だけ）
(function (root) {
'use strict';
const COL = { 1: ['#ffffff', '#b0bec5', '#eceff1'], 2: ['#90caf9', '#1565c0', '#42a5f5'], 3: ['#fff59d', '#ff8f00', '#ffca28'] };
const now = () => performance.now() / 1000;
let box, cv, g, skipBtn, hint, dpr = 1, W = 0, H = 0, st = null;

function ensure() {
  if (box) return;
  box = document.createElement('div'); box.id = 'kzstage';
  box.style.cssText = 'position:fixed;inset:0;z-index:39;touch-action:none;-webkit-user-select:none;user-select:none';
  cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  skipBtn = document.createElement('button'); skipBtn.textContent = 'スキップ ▶▶';
  skipBtn.style.cssText = 'position:absolute;right:12px;top:calc(env(safe-area-inset-top) + 12px);margin:0;padding:6px 14px;font:800 14px sans-serif;border:2px solid #fff;border-radius:999px;background:rgba(0,0,0,.35);color:#fff;box-shadow:none;z-index:2';
  hint = document.createElement('div');
  hint.style.cssText = 'position:absolute;left:0;right:0;bottom:calc(env(safe-area-inset-bottom) + 40px);text-align:center;font:900 22px sans-serif;color:#fff;text-shadow:0 2px 0 #0d1030,0 0 12px rgba(255,255,255,.6);pointer-events:none;z-index:2';
  box.appendChild(cv); box.appendChild(skipBtn); box.appendChild(hint);
  document.body.appendChild(box);
  g = cv.getContext('2d');
  cv.addEventListener('pointerdown', e => { e.preventDefault(); tap(); });
  skipBtn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); finish(); });
}
function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1); W = window.innerWidth; H = window.innerHeight;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
}

// ---------- はじめる ----------
function play(opts) {
  ensure(); resize(); box.hidden = false; box.style.display = '';
  const multi = !!opts.multi, rs = opts.rs, n = rs.length;
  // カプセルの 見た目の 色（しょうかく: ★★★ でも 最初は 青や 白の ことが ある）
  const caps = rs.map((r, i) => {
    const R = r.item.r; let show = R;
    if (R === 3) { const u = Math.random(); show = u < 0.15 ? 1 : u < 0.5 ? 2 : 3; }
    else if (R === 2 && Math.random() < 0.25) show = 1;
    return { r: R, show, shown: show, open: -1, promoT: -1, x: 0, y: 0, tx: 0, ty: 0, land: 0, idx: i };
  });
  // 置き場所
  const cols = multi ? 4 : 1, cellW = Math.min(W / 4.4, 90), rows = multi ? Math.ceil(n / cols) : 1;
  caps.forEach((c, i) => {
    if (!multi) { c.tx = W / 2; c.ty = H * 0.62; return; }
    const row = Math.floor(i / cols), inRow = Math.min(cols, n - row * cols), col = i % cols;
    c.tx = W / 2 + (col - (inRow - 1) / 2) * cellW; c.ty = H * 0.52 + (row - (rows - 1) / 2) * cellW * 0.95;
  });
  st = { t0: now(), multi, caps, onDone: opts.onDone, phase: 'machine', pt: now(), parts: [], big: null, dark: 0, openList: null, openI: 0, nextOpen: 0, speed: 1, top: Math.max(...rs.map(r => r.item.r)) };
  hint.textContent = multi ? 'ガラガラガラ…' : 'ガラガラ…';
  requestAnimationFrame(loop);
}
function tap() {
  if (!st) return;
  if (st.phase === 'wait') startOpen();
  else if (st.phase === 'opening') st.speed = 3;   // 10 連: タップで はやく
  else if (st.phase === 'big' && now() - st.pt > 0.8) finish();
  else if (st.phase === 'machine' || st.phase === 'roll') { st.phase = 'wait'; st.pt = now(); for (const c of st.caps) c.land = 1; hint.textContent = 'タップで あける！'; }
}
function startOpen() {
  st.phase = 'opening'; st.pt = now(); st.nextOpen = now();
  // ★★★ は さいごまで とっておく（光りつづける）
  st.openList = st.caps.map((c, i) => i).sort((a, b) => (st.caps[a].r === 3) - (st.caps[b].r === 3) || a - b);
  st.openI = 0; hint.textContent = '';
}
function finish() {
  if (!st) return;
  const done = st.onDone; st = null; box.hidden = true; box.style.display = 'none';
  if (done) done();
}

// ---------- すすめる ----------
function update(t, dt) {
  const s = st, el = t - s.pt;
  if (s.phase === 'machine' && el > (s.multi ? 1.0 : 1.1)) { s.phase = 'roll'; s.pt = t; }
  else if (s.phase === 'roll') {
    s.caps.forEach((c, i) => { const d = el - i * (s.multi ? 0.07 : 0); c.land = Math.max(0, Math.min(1, d / 0.7)); });
    if (s.caps.every(c => c.land >= 1)) { s.phase = 'wait'; s.pt = t; hint.textContent = 'タップで あける！'; }
  } else if (s.phase === 'opening') {
    if (s.openI >= s.openList.length) {
      if (s.caps.every(c => c.open >= 0 && t - c.open > 0.5)) { if (s.top === 3) { s.phase = 'big'; s.pt = t; bigBurst(); } else { s.phase = 'end'; s.pt = t; } }
      return;
    }
    const c = s.caps[s.openList[s.openI]], gap = (s.multi ? (c.r === 3 ? 0.9 : 0.28) : 0) / s.speed;
    if (t < s.nextOpen) return;
    if (c.shown < c.r) {   // しょうかく: ガタガタ ふるえて 色が 上がる
      if (c.promoT < 0) { c.promoT = t; hint.textContent = '…!?'; }
      if (t - c.promoT > (s.multi ? 0.45 : 0.9) / s.speed) { c.shown++; c.promoT = -1; flash(c, c.shown); if (c.shown === 3) hint.textContent = 'きんいろに なった！！'; else hint.textContent = 'いろが かわった！'; }
      return;
    }
    c.open = t; burst(c); s.openI++; s.nextOpen = t + gap;
    if (!s.multi) s.nextOpen = t;
  } else if (s.phase === 'end' && el > 0.5) finish();
  else if (s.phase === 'big') { if (el < 0.1) hint.textContent = ''; else if (el > 1.2 && !s.bigHint) { s.bigHint = 1; hint.textContent = 'タップで つぎへ'; } if (el > 3.2) finish(); }
  // かけら
  for (let i = s.parts.length - 1; i >= 0; i--) {
    const p = s.parts[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; p.rot += (p.spin || 0) * dt; p.life -= dt;
    if (p.life <= 0) s.parts.splice(i, 1);
  }
}
function burst(c) {
  const [hi, , mid] = COL[c.r];
  for (let i = 0; i < (c.r === 3 ? 40 : c.r === 2 ? 22 : 12); i++) { const a = Math.random() * 6.28, v = 120 + Math.random() * (c.r === 3 ? 420 : 260); st.parts.push({ x: c.tx, y: c.ty, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, g: 380, life: 0.7 + Math.random() * 0.5, c: Math.random() < 0.5 ? hi : mid, k: 'spark', rot: 0 }); }
}
function flash(c, r) { for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28; st.parts.push({ x: c.tx, y: c.ty, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, g: 0, life: 0.4, c: COL[r][0], k: 'spark', rot: 0 }); } }
function bigBurst() {
  const cs = ['#ff5252', '#ffab40', '#ffee58', '#69f0ae', '#40c4ff', '#b388ff', '#ff4081'];
  for (let i = 0; i < 140; i++) st.parts.push({ x: Math.random() * W, y: -20 - Math.random() * H * 0.6, vx: (Math.random() - 0.5) * 120, vy: 120 + Math.random() * 160, g: 60, life: 2.6 + Math.random(), c: cs[i % cs.length], k: 'confetti', rot: Math.random() * 6, spin: (Math.random() - 0.5) * 10 });
}

// ---------- 描く ----------
function drawMachine(t, el) {
  const cx = W / 2, cy = H * 0.3, R = Math.min(W * 0.28, 120), spin = st.phase === 'machine' ? el * (st.multi ? 14 : 9) : 0;
  const shake = st.phase === 'machine' ? Math.sin(el * 40) * 3 : 0;
  g.save(); g.translate(shake, 0);
  // からだ
  g.fillStyle = '#e53935'; g.strokeStyle = '#0d1030'; g.lineWidth = 5;
  rr(cx - R * 0.95, cy + R * 0.55, R * 1.9, R * 1.25, 18); g.fill(); g.stroke();
  g.fillStyle = '#212121'; rr(cx - R * 0.28, cy + R * 1.35, R * 0.56, R * 0.3, 10); g.fill();   // 出口
  // ハンドル
  g.save(); g.translate(cx + R * 0.55, cy + R * 1.05); g.rotate(spin);
  g.fillStyle = '#ffd54f'; g.beginPath(); g.arc(0, 0, R * 0.2, 0, 7); g.fill(); g.stroke();
  g.lineWidth = 7; g.strokeStyle = '#0d1030'; g.beginPath(); g.moveTo(-R * 0.3, 0); g.lineTo(R * 0.3, 0); g.stroke(); g.restore();
  g.fillStyle = '#fff'; g.font = '900 ' + Math.round(R * 0.22) + 'px sans-serif'; g.textAlign = 'center'; g.fillText('ガチャ', cx - R * 0.35, cy + R * 1.1);
  // ガラスの まる（中の カプセルは 大きめを 少しだけ）
  g.fillStyle = 'rgba(200,235,255,.25)'; g.strokeStyle = '#0d1030'; g.lineWidth = 5; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); g.stroke();
  g.save(); g.beginPath(); g.arc(cx, cy, R - 4, 0, 7); g.clip();
  for (let i = 0; i < 7; i++) { const a = i * 0.9 + spin * 0.3, rr2 = R * (0.3 + (i % 3) * 0.2), x = cx + Math.cos(a) * rr2 * 0.9, y = cy + R * 0.35 - Math.abs(Math.sin(a * 1.3)) * R * 0.5; capsule(x, y, R * 0.24, [1, 2, 1, 3, 1, 2, 1][i], 0, t, 1); }
  g.restore();
  g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 6; g.beginPath(); g.arc(cx - R * 0.1, cy - R * 0.1, R * 0.72, Math.PI * 1.1, Math.PI * 1.45); g.stroke();
  g.restore();
}
function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
// カプセル: 上半分が 星の 色、下半分が 白。half = 0（とじている）〜 1（ひらいた）
function capsule(x, y, r, rare, half, t, alpha, glow) {
  const [hi, lo, mid] = COL[rare];
  g.save(); g.globalAlpha = alpha == null ? 1 : alpha;
  if (glow) { g.shadowColor = rare === 3 ? '#ffd740' : rare === 2 ? '#64b5f6' : '#ffffff'; g.shadowBlur = glow; }
  const up = half * r * 1.6;
  // 上
  g.save(); g.translate(x, y - up); g.rotate(-half * 0.6);
  const gr = g.createLinearGradient(-r, -r, r, 0); gr.addColorStop(0, hi); gr.addColorStop(1, lo);
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, Math.PI, 0); g.closePath(); g.fill();
  if (rare === 3) { g.globalCompositeOperation = 'lighter'; const sh = (t * 1.5) % 2 - 0.5; const g2 = g.createLinearGradient(-r + sh * 2 * r, -r, -r + sh * 2 * r + r * 0.6, 0); g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(0.5, 'rgba(255,255,255,.8)'); g2.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = g2; g.beginPath(); g.arc(0, 0, r, Math.PI, 0); g.fill(); g.globalCompositeOperation = 'source-over'; }
  g.shadowBlur = 0; g.strokeStyle = '#0d1030'; g.lineWidth = Math.max(2, r * 0.1); g.beginPath(); g.arc(0, 0, r, Math.PI, 0); g.closePath(); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-r * 0.4, -r * 0.55, r * 0.25, r * 0.12, -0.5, 0, 7); g.fill();
  g.restore();
  // 下
  g.save(); g.translate(x, y + up * 0.4);
  g.fillStyle = '#fafafa'; g.beginPath(); g.arc(0, 0, r, 0, Math.PI); g.closePath(); g.fill(); g.strokeStyle = '#0d1030'; g.lineWidth = Math.max(2, r * 0.1); g.stroke();
  g.restore();
  g.restore();
}
function render(t) {
  const s = st, el = t - s.pt;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  // うしろ（★★★ の 大演出は くらく）
  const bg = g.createRadialGradient(W / 2, H * 0.45, 20, W / 2, H * 0.45, Math.max(W, H) * 0.8);
  bg.addColorStop(0, '#2a2f7a'); bg.addColorStop(1, '#0a0c28'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  if (s.phase === 'machine' || s.phase === 'roll') drawMachine(t, s.phase === 'machine' ? el : 99);
  // カプセル
  const R = s.multi ? Math.min(W / 11, 34) : Math.min(W * 0.16, 70);
  s.caps.forEach(c => {
    if (s.phase === 'machine') return;
    const k = c.land, ease = 1 - Math.pow(1 - k, 3);
    const sx = W / 2, sy = H * 0.3 + Math.min(W * 0.28, 120) * 1.45;
    let x = sx + (c.tx - sx) * ease, y = sy + (c.ty - sy) * ease - Math.sin(k * Math.PI) * 60 * (1 - k * 0.5);
    let shake = 0; if (c.promoT >= 0) shake = Math.sin((t - c.promoT) * 60) * R * 0.18;
    if (s.phase === 'wait') y += Math.sin(t * 4 + c.idx) * 3;
    const opened = c.open >= 0 ? Math.min(1, (t - c.open) / 0.35) : 0;
    const waitingTop = s.phase === 'opening' && c.open < 0 && c.r === 3 && c.shown === 3;
    if (opened > 0) { const lg = g.createRadialGradient(x, y, 0, x, y, R * 2.5); lg.addColorStop(0, COL[c.r][0]); lg.addColorStop(1, 'rgba(0,0,0,0)'); g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.max(0, 1 - opened * 0.7); g.fillStyle = lg; g.beginPath(); g.arc(x, y, R * 2.5, 0, 7); g.fill(); g.restore(); }
    capsule(x + shake, y, R, c.shown, opened, t, opened > 0 ? 1 - opened * 0.6 : 1, waitingTop ? 30 + Math.sin(t * 8) * 12 : c.shown === 3 ? 18 : c.shown === 2 ? 10 : 0);
    if (opened > 0 && s.multi) { g.save(); g.globalAlpha = opened; g.font = '900 ' + Math.round(R * 0.5) + 'px sans-serif'; g.textAlign = 'center'; g.fillStyle = c.r === 3 ? '#ffd740' : c.r === 2 ? '#90caf9' : '#eceff1'; g.fillText('★'.repeat(c.r), x, y + R * 0.2); g.restore(); }
  });
  // ★★★ の 大演出: くらく → 光の 柱 → 紙ふぶき → 大きな 文字
  if (s.phase === 'big') {
    const k = Math.min(1, el / 0.3);
    g.fillStyle = 'rgba(0,0,0,' + (0.55 * k).toFixed(2) + ')'; g.fillRect(0, 0, W, H);
    if (el > 0.25) {
      const pw = Math.min(W * 0.5, 220) * (0.6 + 0.4 * Math.sin(t * 10) * 0.2 + Math.min(1, (el - 0.25) * 3) * 0.4);
      g.save(); g.globalCompositeOperation = 'lighter';
      const pg = g.createLinearGradient(W / 2 - pw / 2, 0, W / 2 + pw / 2, 0); pg.addColorStop(0, 'rgba(255,215,64,0)'); pg.addColorStop(0.5, 'rgba(255,248,200,.95)'); pg.addColorStop(1, 'rgba(255,215,64,0)');
      g.fillStyle = pg; g.fillRect(W / 2 - pw / 2, 0, pw, H);
      for (let i = 0; i < 12; i++) { const a = t * 0.8 + i * 0.524; g.fillStyle = 'rgba(255,236,179,.18)'; g.beginPath(); g.moveTo(W / 2, H * 0.45); g.lineTo(W / 2 + Math.cos(a - 0.06) * H, H * 0.45 + Math.sin(a - 0.06) * H); g.lineTo(W / 2 + Math.cos(a + 0.06) * H, H * 0.45 + Math.sin(a + 0.06) * H); g.fill(); }
      g.restore();
    }
    if (el > 0.45) {
      const sc = Math.min(1, (el - 0.45) / 0.25), pop = sc < 1 ? 0.4 + sc * 0.8 : 1 + Math.sin(t * 6) * 0.04;
      g.save(); g.translate(W / 2, H * 0.2); g.scale(pop, pop); g.textAlign = 'center'; g.textBaseline = 'middle';
      const fs = Math.min(W * 0.14, 60);
      const tg = g.createLinearGradient(-W * 0.4, 0, W * 0.4, 0); ['#ff5252', '#ffab40', '#ffee58', '#69f0ae', '#40c4ff', '#b388ff'].forEach((c, i, a) => tg.addColorStop(((i / (a.length - 1)) + t * 0.3) % 1, c));
      g.lineWidth = 10; g.strokeStyle = '#0d1030'; g.lineJoin = 'round'; g.fillStyle = tg;
      g.font = '900 ' + Math.round(fs * 0.9) + 'px sans-serif'; g.strokeText('★★★', 0, -fs * 0.55); g.fillText('★★★', 0, -fs * 0.55);   // 2 ぎょうに（せまい 画面でも はみ出さない）
      g.font = '900 ' + fs + 'px sans-serif'; g.strokeText('ゲット！！', 0, fs * 0.5); g.fillText('ゲット！！', 0, fs * 0.5);
      g.restore();
    }
  }
  // かけら
  for (const p of s.parts) {
    g.save(); g.globalAlpha = Math.min(1, p.life * 2);
    if (p.k === 'confetti') { g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = p.c; g.fillRect(-5, -3, 10, 6); }
    else { g.globalCompositeOperation = 'lighter'; g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, 3.5, 0, 7); g.fill(); }
    g.restore();
  }
}
let last = 0;
function frame() {   // 1 コマ（確認用の ブラウザでは rAF が 進まないので 外から 呼べる ように）
  if (!st) return;
  const t = now(), dt = Math.min(0.05, t - (last || t)); last = t;
  update(t, dt); if (st) render(t);
}
function loop() { if (!st) return; frame(); requestAnimationFrame(loop); }
root.KZStage = { play, finish, tap, phase: () => st && st.phase, frame };
})(window);
