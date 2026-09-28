// モンスターの かざり（見た目だけ。強さは 変わらない）: 品ぞろえ・絵・えふぇくと・コイン・ガチャ
// コインは 勝つと もらえる。同じ形で 同じ相手に 勝つたび 半分（形を 少しでも 変えれば 元どおり、形は 最近 30 こ 覚える）
// ガチャは 1 回 100 コイン、★ 60%・★★ 30%・★★★ 10%、かぶったら 30 コイン もどる
// 見た目の 格: ★ ていねいな 絵 / ★★ つや・光り・きらめき / ★★★ ずっと 動く（光る・あふれる・舞う）
(function (root) {
'use strict';
const SLOTS = ['head', 'face', 'body', 'fx'];
const SLOT_LABEL = { head: 'あたま', face: 'かお', body: 'からだ', fx: 'えふぇくと' };
const ITEMS = [
  null,
  { id: 1, slot: 'head', name: 'つの', r: 1 },
  { id: 2, slot: 'head', name: 'リボン', r: 1 },
  { id: 3, slot: 'head', name: 'はちまき', r: 1 },
  { id: 4, slot: 'head', name: 'シルクハット', r: 2 },
  { id: 5, slot: 'head', name: 'まほうの ぼうし', r: 2 },
  { id: 6, slot: 'head', name: 'てんしの わ', r: 3 },
  { id: 7, slot: 'face', name: 'ぐるぐるめ', r: 1 },
  { id: 8, slot: 'face', name: 'サングラス', r: 1 },
  { id: 9, slot: 'face', name: 'ちょびひげ', r: 1 },
  { id: 10, slot: 'face', name: 'でっかい きば', r: 2 },
  { id: 11, slot: 'face', name: 'ひとつめ', r: 2 },
  { id: 12, slot: 'face', name: 'ハートの め', r: 3 },
  { id: 13, slot: 'body', name: 'しましま', r: 1 },
  { id: 14, slot: 'body', name: 'みずたま', r: 1 },
  { id: 15, slot: 'body', name: 'ほしぞら', r: 2 },
  { id: 16, slot: 'body', name: 'きんいろ', r: 2 },
  { id: 17, slot: 'body', name: 'にじいろ', r: 3 },
  { id: 18, slot: 'body', name: 'クリスタル', r: 3 },
  { id: 19, slot: 'fx', name: 'あしあとに はな', r: 1 },
  { id: 20, slot: 'fx', name: 'パンチで ほし', r: 1 },
  { id: 21, slot: 'fx', name: 'あせ', r: 1 },
  { id: 22, slot: 'fx', name: 'ほのお', r: 2 },
  { id: 23, slot: 'fx', name: 'かみなり', r: 2 },
  { id: 24, slot: 'fx', name: 'オーラ', r: 3 },
];
const PRICE = 100, DUP_BACK = 30, RATE = [0, 0.6, 0.3, 0.1];
const WIN = { omote: 10, ura: 30, minna: 60 }, CLEAR = { omote: 50, ura: 150, minna: 300 }, HIST_MAX = 30;
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

// ---------- 持ちもの（get/set は 呼ぶ側の localStorage） ----------
function store(get, set) {
  const J = (k, d) => { try { const v = get(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  return {
    coins: () => +(get('kz.coins') || 0),
    addCoins: n => { const c = Math.max(0, +(get('kz.coins') || 0) + n); set('kz.coins', String(c)); return c; },
    own: () => J('kz.own', []),
    eq: () => { const e = J('kz.eq', [0, 0, 0, 0]); return SLOTS.map((s, i) => { const it = ITEMS[e[i]]; return it && it.slot === s ? e[i] : 0; }); },
    setEq: e => set('kz.eq', JSON.stringify(e)),
    hist: () => J('kz.hist', []),
    setHist: h => set('kz.hist', JSON.stringify(h.slice(0, HIST_MAX))),
    setOwn: o => set('kz.own', JSON.stringify(o)),
  };
}
// 勝ったときの コイン。code = 形（かざり・王冠ぬき）、key = 相手（'omote3' など）。同じ形で 同じ相手に 勝った 回数 n で 半分ずつ
function earn(st, code, key, base) {
  const h = st.hist(); let e = h.find(x => x.c === code);
  if (!e) e = { c: code, w: {} };
  const n = e.w[key] || 0, got = Math.floor(base * Math.pow(0.5, n));
  e.w[key] = n + 1;
  st.setHist([e].concat(h.filter(x => x !== e && x.c !== code)));
  if (got > 0) st.addCoins(got);
  return { got, n, base };
}
function winReward(st, code, side, stage, clear) {
  const w = earn(st, code, side + stage, WIN[side] || 0);
  const c = clear ? earn(st, code, side + 'c', CLEAR[side] || 0) : null;
  return { got: w.got + (c ? c.got : 0), n: w.n, win: w, clear: c };
}
function pull(st, rand) {
  if (st.coins() < PRICE) return null;
  st.addCoins(-PRICE);
  const u = rand(); const r = u < RATE[3] ? 3 : u < RATE[3] + RATE[2] ? 2 : 1;
  const pool = ITEMS.filter(it => it && it.r === r), it = pool[Math.floor(rand() * pool.length) % pool.length];
  const own = st.own(), dup = own.includes(it.id);
  if (dup) st.addCoins(DUP_BACK); else { own.push(it.id); st.setOwn(own); }
  return { item: it, dup };
}

// ---------- 小さな 絵の 道具 ----------
const INK = '#0d1030';
function star(g, x, y, r, fill, line, rot) {
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (rot || 0) + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.fillStyle = fill; g.fill(); if (line) { g.lineWidth = Math.max(1, r * 0.15); g.strokeStyle = line; g.stroke(); }
}
function heart(g, x, y, r, fill) {
  g.beginPath(); g.moveTo(x, y + r * 0.9);
  g.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.3, x, y - r * 0.4);
  g.bezierCurveTo(x + r * 0.6, y - r * 1.3, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
  g.fillStyle = fill; g.fill();
}
// きらっ（4 本の 光の すじ）
function twinkle(g, x, y, r, a, col) {
  if (a <= 0.02) return;
  g.save(); g.globalAlpha *= Math.min(1, a); g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col || '#ffffff'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 0.55, 0, 7); g.fill();
  g.fillStyle = col || '#ffffff';
  g.beginPath(); g.moveTo(x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r, y); g.fill();
  g.restore();
}
// 0..1 を なめらかに 行き来（i ごとに ずらす）
const wave = (t, sp, i) => 0.5 + 0.5 * Math.sin(t * sp + i * 2.39);

// ---------- あたま: x, y = 体の てっぺんの まんなか、s = はば。戻り値 = 上に 積んだ 高さ ----------
function drawHead(g, id, x, y, s) {
  const t = now();
  g.save(); g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = Math.max(2, s * 0.07);
  let top = s * 0.55;
  if (id === 1) {   // つの（★）: 骨の いろの グラデーション
    for (const k of [-1, 1]) {
      const gr = g.createLinearGradient(x, y, x + k * s * 0.35, y - s * 0.62); gr.addColorStop(0, '#d7ccc8'); gr.addColorStop(1, '#fffaf0');
      g.beginPath(); g.moveTo(x + k * s * 0.2, y + 2); g.quadraticCurveTo(x + k * s * 0.48, y - s * 0.3, x + k * s * 0.34, y - s * 0.64); g.quadraticCurveTo(x + k * s * 0.22, y - s * 0.3, x + k * s * 0.04, y + 2); g.closePath(); g.fillStyle = gr; g.fill(); g.stroke();
    }
    top = s * 0.6;
  } else if (id === 2) {   // リボン（★）
    const cx = x + s * 0.2, cy = y - s * 0.12;
    for (const k of [-1, 1]) {
      g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(cx + k * s * 0.2, cy - s * 0.3, cx + k * s * 0.36, cy - s * 0.2); g.lineTo(cx + k * s * 0.36, cy + s * 0.2); g.quadraticCurveTo(cx + k * s * 0.2, cy + s * 0.22, cx, cy); g.fillStyle = '#ff5c8a'; g.fill(); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = Math.max(1, s * 0.04); g.beginPath(); g.moveTo(cx + k * s * 0.08, cy - s * 0.06); g.lineTo(cx + k * s * 0.26, cy - s * 0.14); g.stroke(); g.strokeStyle = INK; g.lineWidth = Math.max(2, s * 0.07);
    }
    g.beginPath(); g.arc(cx, cy, s * 0.08, 0, 7); g.fillStyle = '#ff2d6f'; g.fill(); g.stroke();
    top = s * 0.35;
  } else if (id === 3) {   // はちまき（★）: 体の 上のほうに まく
    g.fillStyle = '#fff'; g.beginPath(); g.rect(x - s * 0.62, y + s * 0.02, s * 1.24, s * 0.16); g.fill(); g.stroke();
    g.fillStyle = '#e53935'; g.beginPath(); g.arc(x, y + s * 0.1, s * 0.055, 0, 7); g.fill();
    const fl = Math.sin(t * 8) * s * 0.05;   // はしが ひらひら
    g.beginPath(); g.moveTo(x - s * 0.62, y + s * 0.08); g.quadraticCurveTo(x - s * 0.78, y - s * 0.02 + fl, x - s * 0.95, y - s * 0.04 - fl); g.moveTo(x - s * 0.62, y + s * 0.12); g.quadraticCurveTo(x - s * 0.76, y + s * 0.2 - fl, x - s * 0.92, y + s * 0.22 + fl); g.stroke();
    g.restore(); return 0;
  } else if (id === 4) {   // シルクハット（★★）: つや・金の バックル・きらっ
    const w = s * 0.62, h = s * 0.62, by = y - s * 0.1;
    const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0); gr.addColorStop(0, '#111'); gr.addColorStop(0.35, '#4a4a55'); gr.addColorStop(0.5, '#1c1c22'); gr.addColorStop(1, '#0a0a0a');
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, by + s * 0.05, s * 0.5, s * 0.1, 0, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.rect(x - w / 2, by - h, w, h); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(x, by - h, w / 2, s * 0.06, 0, 0, 7); g.fillStyle = '#2b2b33'; g.fill(); g.stroke();
    g.fillStyle = '#c62828'; g.fillRect(x - w / 2 + 1, by - s * 0.2, w - 2, s * 0.11);
    g.fillStyle = '#ffd54f'; g.strokeStyle = '#8d6e00'; g.lineWidth = Math.max(1, s * 0.03); g.beginPath(); g.rect(x - s * 0.07, by - s * 0.21, s * 0.14, s * 0.13); g.fill(); g.stroke();
    twinkle(g, x - w * 0.25, by - h * 0.7, s * 0.16, wave(t, 2.2, 1) > 0.8 ? (wave(t, 2.2, 1) - 0.8) * 5 : 0);
    twinkle(g, x + s * 0.05, by - s * 0.15, s * 0.12, wave(t, 3.1, 4) > 0.85 ? (wave(t, 3.1, 4) - 0.85) * 6 : 0, '#fff8e1');
    top = s * 0.78;
  } else if (id === 5) {   // まほうの ぼうし（★★）: 夜空の グラデーション・またたく星・三日月
    const gr = g.createLinearGradient(x, y, x, y - s); gr.addColorStop(0, '#311b92'); gr.addColorStop(1, '#7c4dff');
    g.fillStyle = gr; g.beginPath(); g.moveTo(x - s * 0.46, y); g.quadraticCurveTo(x - s * 0.1, y - s * 0.55, x + s * 0.06, y - s * 0.9); g.quadraticCurveTo(x + s * 0.3, y - s * 1.0, x + s * 0.42, y - s * 0.86); g.quadraticCurveTo(x + s * 0.2, y - s * 0.6, x + s * 0.46, y); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#4527a0'; g.beginPath(); g.ellipse(x, y, s * 0.55, s * 0.09, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#fff59d'; g.beginPath(); g.arc(x - s * 0.08, y - s * 0.34, s * 0.09, 0, 7); g.fill(); g.fillStyle = '#4a2ca3'; g.beginPath(); g.arc(x - s * 0.04, y - s * 0.36, s * 0.08, 0, 7); g.fill();
    [[0.14, -0.5, 0], [-0.2, -0.16, 1], [0.2, -0.2, 2], [0.02, -0.68, 3]].forEach(([dx, dy, i]) => star(g, x + dx * s, y + dy * s, s * (0.05 + 0.03 * wave(t, 4, i)), 'rgba(255,241,118,' + (0.5 + 0.5 * wave(t, 4, i)).toFixed(2) + ')'));
    twinkle(g, x + s * 0.42, y - s * 0.86, s * 0.18, 0.6 + 0.4 * wave(t, 3, 2), '#e1bee7');
    top = s * 1.0;
  } else if (id === 6) {   // てんしの わ（★★★）: 光る 二重の わ・回る 光・こぼれる 光の つぶ・下へ 光の すじ
    const hy = y - s * 0.38 + Math.sin(t * 2.2) * s * 0.04, rx = s * 0.36, ry = s * 0.11;
    g.save(); g.globalCompositeOperation = 'lighter';
    const beam = g.createLinearGradient(x, hy, x, y + s * 0.2); beam.addColorStop(0, 'rgba(255,248,200,.35)'); beam.addColorStop(1, 'rgba(255,248,200,0)');
    g.fillStyle = beam; g.beginPath(); g.moveTo(x - rx * 0.9, hy); g.lineTo(x + rx * 0.9, hy); g.lineTo(x + rx * 1.3, y + s * 0.2); g.lineTo(x - rx * 1.3, y + s * 0.2); g.fill();
    g.shadowColor = '#fff176'; g.shadowBlur = 18 + 8 * wave(t, 3, 0);
    g.lineWidth = Math.max(3, s * 0.13); g.strokeStyle = '#ffe082'; g.beginPath(); g.ellipse(x, hy, rx, ry, 0, 0, 7); g.stroke();
    g.lineWidth = Math.max(1.5, s * 0.05); g.strokeStyle = '#fffde7'; g.beginPath(); g.ellipse(x, hy, rx, ry, 0, 0, 7); g.stroke();
    g.shadowBlur = 0;
    for (let i = 0; i < 3; i++) { const a = t * 2.4 + i * 2.09; twinkle(g, x + Math.cos(a) * rx, hy + Math.sin(a) * ry, s * 0.14, 0.9); }
    for (let i = 0; i < 5; i++) { const ph = (t * 0.6 + i / 5) % 1, px = x + Math.sin(i * 7.3 + t) * rx * 0.8; g.globalAlpha = (1 - ph) * 0.8; g.fillStyle = '#fff9c4'; g.beginPath(); g.arc(px, hy + ph * s * 0.6, s * 0.03, 0, 7); g.fill(); }
    g.restore();
    top = s * 0.62;
  }
  g.restore(); return top;
}

// ---------- かお: ex, ey = 目の まんなか（目は ex ± 1.4r）、口は (ex + facing × 0.4r, ey + 2.2r) ----------
function drawFace(g, id, ex, ey, r, facing) {
  const t = now();
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  const eyesAt = [ex - r * 1.4, ex + r * 1.4];
  if (id === 7) {   // ぐるぐるめ（★）: うずが 回る
    for (const x of eyesAt) { g.fillStyle = '#fff'; g.beginPath(); g.arc(x, ey, r * 1.05, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = Math.max(1, r * 0.22); g.beginPath(); for (let a = 0; a < 12; a += 0.3) { const rr = r * a / 12, aa = a + t * 6; g.lineTo(x + Math.cos(aa) * rr, ey + Math.sin(aa) * rr); } g.stroke(); }
  } else if (id === 8) {   // サングラス（★）
    g.fillStyle = '#111'; g.strokeStyle = '#111'; g.lineWidth = Math.max(1.5, r * 0.35);
    for (const x of eyesAt) { g.beginPath(); g.ellipse(x, ey, r * 1.35, r * 1.05, 0, 0, 7); g.fill(); }
    g.beginPath(); g.moveTo(eyesAt[0] + r, ey - r * 0.3); g.lineTo(eyesAt[1] - r, ey - r * 0.3); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.55)'; for (const x of eyesAt) { g.beginPath(); g.ellipse(x - r * 0.45, ey - r * 0.35, r * 0.35, r * 0.2, -0.4, 0, 7); g.fill(); }
  } else if (id === 9) {   // ちょびひげ（★）
    const mx = ex + facing * r * 0.4, my = ey + r * 1.5, wg = Math.sin(t * 5) * 0.08;
    g.fillStyle = INK; g.beginPath(); g.ellipse(mx - r * 0.7, my, r * 0.75, r * 0.35, 0.2 + wg, 0, 7); g.ellipse(mx + r * 0.7, my, r * 0.75, r * 0.35, -0.2 - wg, 0, 7); g.fill();
  } else if (id === 10) {   // でっかい きば（★★）: つやの ある きば・きらっ
    const mx = ex + facing * r * 0.4, my = ey + r * 2.2, mw = r * 1.6;
    for (const fx of [-0.6, 0.6]) {
      const cx = mx + mw * fx, gr = g.createLinearGradient(cx - r * 0.45, my, cx + r * 0.45, my); gr.addColorStop(0, '#fffde7'); gr.addColorStop(0.4, '#ffffff'); gr.addColorStop(1, '#cfd8dc');
      g.fillStyle = gr; g.strokeStyle = INK; g.lineWidth = Math.max(1, r * 0.18);
      g.beginPath(); g.moveTo(cx - r * 0.5, my); g.lineTo(cx + r * 0.5, my); g.quadraticCurveTo(cx + r * 0.2, my + r * 1.1, cx, my + r * 1.7); g.quadraticCurveTo(cx - r * 0.2, my + r * 1.1, cx - r * 0.5, my); g.closePath(); g.fill(); g.stroke();
    }
    twinkle(g, mx + mw * 0.6 + r * 0.1, my + r * 0.5, r * 1.1, wave(t, 2.6, 3) > 0.82 ? (wave(t, 2.6, 3) - 0.82) * 5.5 : 0);
  } else if (id === 11) {   // ひとつめ（★★）: 虹彩の グラデーション・ときどき まばたき
    const cx = ex + facing * r * 0.2, R = r * 2.3, blink = (t % 3.2) < 0.12 ? 0.1 : 1;
    g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = Math.max(1.5, r * 0.25);
    g.beginPath(); g.ellipse(cx, ey, R, R * blink, 0, 0, 7); g.fill(); g.stroke();
    if (blink > 0.5) {
      const ix = cx + facing * r * 0.6, gr = g.createRadialGradient(ix, ey, r * 0.2, ix, ey, r * 1.15); gr.addColorStop(0, '#b9f6ca'); gr.addColorStop(0.6, '#43a047'); gr.addColorStop(1, '#1b5e20');
      g.fillStyle = gr; g.beginPath(); g.arc(ix, ey, r * 1.15, 0, 7); g.fill();
      g.fillStyle = INK; g.beginPath(); g.arc(ix + facing * r * 0.1, ey, r * 0.55, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ix - r * 0.35, ey - r * 0.4, r * 0.28, 0, 7); g.fill();
    }
  } else if (id === 12) {   // ハートの め（★★★）: どきどき・光る・ハートが ふわふわ のぼる
    const beat = 1 + 0.18 * Math.max(0, Math.sin(t * 7)) ** 3;
    g.save(); g.shadowColor = '#ff4081'; g.shadowBlur = 10 + 8 * beat;
    for (const x of eyesAt) heart(g, x, ey, r * 1.2 * beat, '#ff4081');
    g.restore();
    for (const x of eyesAt) { g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(x - r * 0.45, ey - r * 0.35, r * 0.28, 0, 7); g.fill(); }
    for (let i = 0; i < 3; i++) { const ph = (t * 0.5 + i / 3) % 1; g.globalAlpha = Math.sin(ph * Math.PI) * 0.9; heart(g, ex + Math.sin(ph * 9 + i) * r * 2.2, ey - r * 1.5 - ph * r * 6, r * (0.45 + ph * 0.3), '#ff80ab'); }
    g.globalAlpha = 1;
  }
  g.restore();
}

// ---------- からだの もよう（体の 形で clip した あとに 呼ぶ）。x0..y1 = 体の 四角 ----------
function shine(g, x0, y0, w, h, t, sp, a) {   // ななめの 光の おび が ときどき 走る
  const ph = (t * sp) % 1.6; if (ph > 1) return;
  const cx = x0 - w * 0.3 + (w * 1.6) * ph;
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createLinearGradient(cx - 18, 0, cx + 18, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,' + a + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.translate(cx, y0 + h / 2); g.rotate(0.35); g.fillRect(-18, -h, 36, h * 2);
  g.restore();
}
function drawBody(g, id, x0, y0, x1, y1) {
  const t = now(), w = x1 - x0, h = y1 - y0;
  g.save();
  if (id === 13) { g.fillStyle = 'rgba(13,16,48,.28)'; for (let y = y0 + 6; y < y1; y += 18) g.fillRect(x0 - 5, y, w + 10, 8); }
  else if (id === 14) { g.fillStyle = 'rgba(255,255,255,.62)'; let k = 0; for (let y = y0 + 10; y < y1; y += 22) { for (let x = x0 + (k % 2 ? 16 : 5); x < x1; x += 22) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); } k++; } }
  else if (id === 15) {   // ほしぞら（★★）: 夜の グラデーション に またたく 星
    const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, 'rgba(26,35,126,.75)'); gr.addColorStop(1, 'rgba(74,20,140,.75)');
    g.fillStyle = gr; g.fillRect(x0 - 5, y0 - 5, w + 10, h + 10);
    let i = 0; for (let y = y0 + 10; y < y1; y += 20) for (let x = x0 + ((i * 7) % 14); x < x1; x += 24) { i++; const a = wave(t, 2 + (i % 3), i); if (i % 3 === 0) star(g, x, y, 3 + a * 3, 'rgba(255,241,118,' + (0.4 + 0.6 * a).toFixed(2) + ')'); else { g.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.7 * a).toFixed(2) + ')'; g.beginPath(); g.arc(x, y, 1.2 + a, 0, 7); g.fill(); } }
    twinkle(g, x0 + w * wave(t, 0.7, 1), y0 + h * 0.3, 10, wave(t, 3, 2));
  } else if (id === 16) {   // きんいろ（★★）: 金の グラデーション・光の おびが 走る
    const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, '#fff3b0'); gr.addColorStop(0.35, '#ffc107'); gr.addColorStop(0.55, '#ffe082'); gr.addColorStop(0.75, '#e0a800'); gr.addColorStop(1, '#a67c00');
    g.fillStyle = gr; g.fillRect(x0 - 5, y0 - 5, w + 10, h + 10);
    shine(g, x0, y0, w, h, t, 0.55, 0.85);
    twinkle(g, x0 + w * 0.25, y0 + h * 0.2, 9, wave(t, 2.5, 5) > 0.8 ? (wave(t, 2.5, 5) - 0.8) * 5 : 0);
  } else if (id === 17) {   // にじいろ（★★★）: 流れる 虹・光の おび・きらきら
    const sh = (t * 60) % (w + h);
    const gr = g.createLinearGradient(x0 - sh, y0, x1 + w - sh, y1); ['#ff5252', '#ffab40', '#ffee58', '#69f0ae', '#40c4ff', '#b388ff', '#ff5252', '#ffab40', '#ffee58'].forEach((c, i, a) => gr.addColorStop(i / (a.length - 1), c));
    g.globalAlpha = 0.9; g.fillStyle = gr; g.fillRect(x0 - 5, y0 - 5, w + 10, h + 10); g.globalAlpha = 1;
    shine(g, x0, y0, w, h, t, 0.8, 0.9);
    for (let i = 0; i < 5; i++) twinkle(g, x0 + w * ((i * 0.37 + 0.1) % 1), y0 + h * ((i * 0.61 + 0.15) % 1), 7, wave(t, 3.5, i) > 0.6 ? (wave(t, 3.5, i) - 0.6) * 2.5 : 0);
  } else if (id === 18) {   // クリスタル（★★★）: すきとおった 面・光の おび・中を のぼる あわ
    g.fillStyle = 'rgba(200,245,255,.35)'; g.fillRect(x0 - 5, y0 - 5, w + 10, h + 10);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x0, y0 + h * 0.3); g.lineTo(x0 + w * 0.45, y0); g.moveTo(x0 + w * 0.2, y1); g.lineTo(x1, y0 + h * 0.25); g.moveTo(x0 + w * 0.55, y1); g.lineTo(x1, y0 + h * 0.7); g.stroke();
    for (let i = 0; i < 6; i++) { const ph = (t * 0.35 + i / 6) % 1; g.strokeStyle = 'rgba(255,255,255,' + (0.8 * Math.sin(ph * Math.PI)).toFixed(2) + ')'; g.beginPath(); g.arc(x0 + w * ((i * 0.29 + 0.12) % 1) + Math.sin(t * 2 + i) * 3, y1 - ph * h, 2 + (i % 3), 0, 7); g.stroke(); }
    shine(g, x0, y0, w, h, t, 0.5, 1);
    for (let i = 0; i < 3; i++) twinkle(g, x0 + w * (0.2 + i * 0.3), y0 + h * (0.25 + (i % 2) * 0.4), 9, wave(t, 2.8, i + 3) > 0.7 ? (wave(t, 2.8, i + 3) - 0.7) * 3.3 : 0, '#e0f7fa');
  }
  g.restore();
}

// ---------- えふぇくと（バトル中）: 体の 座標で。back は 体の 前に 描く（うしろ）、front は あと（まえ）----------
// info = { x0, x1, y0, y1, pts: 体の 点 {x, y}, spawn(lx, ly, かけら) = 体の 座標で かけらを 出す }
// 体の 上の ふち: x の 近くの 点で いちばん 上
function topAt(pts, x, x0, x1) { let best = null; const lim = Math.max(8, (x1 - x0) * 0.12); for (const p of pts) if (Math.abs(p.x - x) < lim && (best == null || p.y < best)) best = p.y; return best; }
function fxBack(g, id, info) {
  const t = now(), { x0, x1, y0, y1, pts } = info, w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  if (id === 22) {   // ほのお（★★）: 体の 上の ふちから ゆらめく ほのお、火の粉
    g.save(); g.globalCompositeOperation = 'lighter';
    const n = Math.max(4, Math.round(w / 16));
    for (let i = 0; i < n; i++) {
      const fx = x0 + (i + 0.5) / n * w, ty = topAt(pts, fx, x0, x1); if (ty == null) continue;
      const fh = (22 + 16 * wave(t, 9, i) + 10 * wave(t, 13, i * 3)) * Math.min(1.4, 0.6 + w / 120), fw = w / n * 0.9, sway = Math.sin(t * 6 + i) * fw * 0.5;
      for (const [k, c0, c1] of [[1, 'rgba(255,87,34,.75)', 'rgba(255,87,34,0)'], [0.6, 'rgba(255,193,7,.9)', 'rgba(255,193,7,0)'], [0.3, 'rgba(255,253,231,.95)', 'rgba(255,253,231,0)']]) {
        const gr = g.createLinearGradient(fx, ty + 6, fx, ty - fh * k); gr.addColorStop(0, c0); gr.addColorStop(1, c1);
        g.fillStyle = gr; g.beginPath(); g.moveTo(fx - fw * k, ty + 6); g.quadraticCurveTo(fx - fw * k * 0.9, ty - fh * k * 0.5, fx + sway * k, ty - fh * k); g.quadraticCurveTo(fx + fw * k * 0.9, ty - fh * k * 0.5, fx + fw * k, ty + 6); g.fill();
      }
    }
    const gl = g.createRadialGradient(cx, y0, 4, cx, y0, w * 0.9); gl.addColorStop(0, 'rgba(255,152,0,.25)'); gl.addColorStop(1, 'rgba(255,152,0,0)'); g.fillStyle = gl; g.fillRect(cx - w, y0 - w, w * 2, w * 2);
    g.restore();
    if (Math.random() < 0.5) info.spawn(x0 + Math.random() * w, y0 + Math.random() * 10, { vx: (Math.random() - 0.5) * 60, vy: -80 - Math.random() * 80, g: -0.1, c: Math.random() < 0.5 ? '#ffab40' : '#fff176', life: 40, k: 'ember' });
  } else if (id === 24) {   // オーラ（★★★）: どくどく 光る 気・回る わ・のぼる 光・足もとの 波
    const R = Math.max(w, h) * 0.8, pulse = 0.5 + 0.5 * Math.sin(t * 4);
    g.save(); g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(cx, cy, R * 0.3, cx, cy, R * (1.05 + 0.12 * pulse)); gr.addColorStop(0, 'rgba(179,136,255,' + (0.35 + 0.2 * pulse).toFixed(2) + ')'); gr.addColorStop(0.6, 'rgba(124,77,255,.18)'); gr.addColorStop(1, 'rgba(124,77,255,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, R * 1.2, R * 1.3, 0, 0, 7); g.fill();
    // 上へ 伸びる 気の ほのお
    for (let i = 0; i < 7; i++) {
      const fx = x0 - w * 0.1 + (i + 0.5) / 7 * w * 1.2, fh = h * (0.5 + 0.35 * wave(t, 5, i)), fw = w * 0.12;
      const g2 = g.createLinearGradient(fx, y1, fx, y0 - fh); g2.addColorStop(0, 'rgba(234,128,252,0)'); g2.addColorStop(0.5, 'rgba(234,128,252,.35)'); g2.addColorStop(1, 'rgba(234,128,252,0)');
      g.fillStyle = g2; g.beginPath(); g.moveTo(fx - fw, y1); g.quadraticCurveTo(fx - fw * 1.3, y0, fx + Math.sin(t * 3 + i) * fw, y0 - fh); g.quadraticCurveTo(fx + fw * 1.3, y0, fx + fw, y1); g.fill();
    }
    // 回る わ
    g.lineWidth = 2.5;
    for (let i = 0; i < 2; i++) { g.strokeStyle = 'rgba(225,190,255,' + (0.5 + 0.4 * wave(t, 3, i)).toFixed(2) + ')'; g.beginPath(); g.ellipse(cx, cy, R * (0.95 + i * 0.18), R * (0.3 + i * 0.05), Math.sin(t * 0.8 + i) * 0.4, t * (i ? -2 : 2.5), t * (i ? -2 : 2.5) + 4); g.stroke(); }
    g.restore();
    if (Math.random() < 0.4) info.spawn(x0 + Math.random() * w, y1 - Math.random() * h, { vx: (Math.random() - 0.5) * 30, vy: -60 - Math.random() * 60, g: -0.05, c: Math.random() < 0.5 ? '#ea80fc' : '#b388ff', life: 45, k: 'wisp' });
  }
}
function fxFront(g, id, info) {
  const t = now(), { x0, x1, y0, y1, pts } = info, w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  if (id === 23) {   // かみなり（★★）: 体の まわりを 走る でんき・ときどき 空から いなずま
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineJoin = 'miter'; g.lineCap = 'round';
    const zig = (ax, ay, bx, by, n, amp) => { g.beginPath(); g.moveTo(ax, ay); for (let i = 1; i < n; i++) { const k = i / n; g.lineTo(ax + (bx - ax) * k + (Math.random() - 0.5) * amp, ay + (by - ay) * k + (Math.random() - 0.5) * amp); } g.lineTo(bx, by); g.stroke(); };
    for (let k = 0; k < 3; k++) {
      if (Math.random() < 0.45) continue;
      const i = Math.floor(Math.random() * pts.length), a = pts[i], b = pts[(i + 2 + Math.floor(Math.random() * 3)) % pts.length];
      const ox = (a.x - cx) * 0.12, oy = (a.y - cy) * 0.12;
      g.strokeStyle = 'rgba(128,216,255,.9)'; g.lineWidth = 3; g.shadowColor = '#40c4ff'; g.shadowBlur = 12; zig(a.x + ox, a.y + oy, b.x + ox, b.y + oy, 5, 10);
      g.strokeStyle = '#ffffff'; g.lineWidth = 1.2; g.shadowBlur = 0; zig(a.x + ox, a.y + oy, b.x + ox, b.y + oy, 5, 6);
    }
    const ph = (t * 0.55) % 1;
    if (ph < 0.09) {   // 空から ドーン
      const bx = cx + Math.sin(Math.floor(t * 0.55) * 7.7) * w * 0.3;
      g.globalAlpha = 1 - ph / 0.09;
      g.strokeStyle = 'rgba(255,241,118,.95)'; g.lineWidth = 7; g.shadowColor = '#ffeb3b'; g.shadowBlur = 24; zig(bx + 30, y0 - 420, bx, y0, 9, 40);
      g.strokeStyle = '#ffffff'; g.lineWidth = 2.5; g.shadowBlur = 0; zig(bx + 30, y0 - 420, bx, y0, 9, 20);
      const fl = g.createRadialGradient(bx, y0, 0, bx, y0, w * 1.2); fl.addColorStop(0, 'rgba(255,255,200,.7)'); fl.addColorStop(1, 'rgba(255,255,200,0)'); g.fillStyle = fl; g.fillRect(bx - w * 1.2, y0 - w * 1.2, w * 2.4, w * 2.4);
    }
    g.restore();
  } else if (id === 24) {   // オーラ（まえ）: まわりを 回る 光の つぶ
    const R = Math.max(w, h) * 0.75;
    for (let i = 0; i < 5; i++) { const a = t * 2 + i * 1.257; twinkle(g, cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.45, 9, 0.6 + 0.4 * wave(t, 4, i), '#f3e5f5'); }
  }
}
// かけらの 絵（ゲームの parts）。描いたら true
function drawPart(g, p) {
  const a = Math.min(1, p.life / 15);
  if (p.k === 'star') { g.save(); g.globalAlpha = a; star(g, p.x, p.y, 7, p.c, '#b8860b', (p.life || 0) * 0.25); g.restore(); twinkle(g, p.x, p.y, 10, a * 0.6); return true; }
  if (p.k === 'flower') {
    const age = (p.age = (p.age || 0) + 1), s = Math.min(1, age / 8) * (age < 8 ? 1.25 - age / 32 : 1);
    g.save(); g.globalAlpha = a; g.fillStyle = p.c;
    for (let i = 0; i < 5; i++) { const an = i * 1.2566 + (p.rot || 0); g.beginPath(); g.ellipse(p.x + Math.cos(an) * 4.5 * s, p.y - 4 + Math.sin(an) * 4.5 * s, 3.6 * s, 2.6 * s, an, 0, 7); g.fill(); }
    g.fillStyle = '#ffeb3b'; g.beginPath(); g.arc(p.x, p.y - 4, 2.4 * s, 0, 7); g.fill(); g.restore();
    return true;
  }
  if (p.k === 'drop') { g.save(); g.globalAlpha = a; g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, 3.5, 0, 7); g.fill(); g.beginPath(); g.moveTo(p.x - 3.4, p.y - 1); g.lineTo(p.x, p.y - 8); g.lineTo(p.x + 3.4, p.y - 1); g.fill(); g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(p.x - 1.2, p.y - 0.5, 1, 0, 7); g.fill(); g.restore(); return true; }
  if (p.k === 'ember' || p.k === 'wisp') {
    const r = (p.k === 'wisp' ? 5 : 3.2) * Math.min(1, p.life / 25);
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
    const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.2); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, p.c); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, r * 2.2, 0, 7); g.fill(); g.restore();
    return true;
  }
  return false;
}

root.KZ = { SLOTS, SLOT_LABEL, ITEMS, PRICE, DUP_BACK, RATE, WIN, CLEAR, store, earn, winReward, pull, drawHead, drawFace, drawBody, fxBack, fxFront, drawPart, star, heart, twinkle };
})(typeof module !== 'undefined' ? module.exports : window);
