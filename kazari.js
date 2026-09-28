// モンスターの かざり（見た目だけ。強さは 変わらない）: 品ぞろえ・絵・コイン・ガチャ
// コインは 勝つと もらえる。同じ形で 同じ相手に 勝つたび 半分（形を 少しでも 変えれば 元どおり、形は 最近 30 こ 覚える）
// ガチャは 1 回 100 コイン、★ 60%・★★ 30%・★★★ 10%、かぶったら 30 コイン もどる
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
  { id: 5, slot: 'head', name: 'とんがりぼうし', r: 2 },
  { id: 6, slot: 'head', name: 'てんしの わ', r: 3 },
  { id: 7, slot: 'face', name: 'ぐるぐるめ', r: 1 },
  { id: 8, slot: 'face', name: 'サングラス', r: 1 },
  { id: 9, slot: 'face', name: 'ちょびひげ', r: 1 },
  { id: 10, slot: 'face', name: 'でっかい きば', r: 2 },
  { id: 11, slot: 'face', name: 'ひとつめ', r: 2 },
  { id: 12, slot: 'face', name: 'ハートの め', r: 3 },
  { id: 13, slot: 'body', name: 'しましま', r: 1 },
  { id: 14, slot: 'body', name: 'みずたま', r: 1 },
  { id: 15, slot: 'body', name: 'ほしもよう', r: 2 },
  { id: 16, slot: 'body', name: 'きんいろ', r: 2 },
  { id: 17, slot: 'body', name: 'にじいろ', r: 3 },
  { id: 18, slot: 'body', name: 'すけすけ', r: 3 },
  { id: 19, slot: 'fx', name: 'あしあとに はな', r: 1 },
  { id: 20, slot: 'fx', name: 'パンチで ほし', r: 1 },
  { id: 21, slot: 'fx', name: 'あせ', r: 1 },
  { id: 22, slot: 'fx', name: 'ひのこ', r: 2 },
  { id: 23, slot: 'fx', name: 'かみなり', r: 2 },
  { id: 24, slot: 'fx', name: 'オーラ', r: 3 },
];
const PRICE = 100, DUP_BACK = 30, RATE = [0, 0.6, 0.3, 0.1];
const WIN = { omote: 10, ura: 30, minna: 60 }, CLEAR = { omote: 50, ura: 150, minna: 300 }, HIST_MAX = 30;

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

// ---------- 絵（体の 座標のまま 描く。g は 体の 向き・位置に 合わせて ある）----------
function star(g, x, y, r, fill, line) {
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.fillStyle = fill; g.fill(); if (line) { g.lineWidth = Math.max(1, r * 0.15); g.strokeStyle = line; g.stroke(); }
}
function heart(g, x, y, r, fill) {
  g.beginPath(); g.moveTo(x, y + r * 0.9);
  g.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.3, x, y - r * 0.4);
  g.bezierCurveTo(x + r * 0.6, y - r * 1.3, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
  g.fillStyle = fill; g.fill();
}
const INK = '#0d1030';
// あたま: x, y = 体の てっぺんの まんなか、s = はば。戻り値 = 上に 積んだ 高さ（王冠の 上に 重ねない ため）
function drawHead(g, id, x, y, s) {
  g.save(); g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = Math.max(2, s * 0.07);
  if (id === 1) {   // つの 2 本
    for (const k of [-1, 1]) { g.beginPath(); g.moveTo(x + k * s * 0.18, y + 2); g.quadraticCurveTo(x + k * s * 0.45, y - s * 0.3, x + k * s * 0.32, y - s * 0.62); g.lineTo(x + k * s * 0.05, y + 2); g.closePath(); g.fillStyle = '#fff3e0'; g.fill(); g.stroke(); }
  } else if (id === 2) {   // リボン
    const cx = x + s * 0.2, cy = y - s * 0.12;
    for (const k of [-1, 1]) { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + k * s * 0.34, cy - s * 0.22); g.lineTo(cx + k * s * 0.34, cy + s * 0.2); g.closePath(); g.fillStyle = '#ff5c8a'; g.fill(); g.stroke(); }
    g.beginPath(); g.arc(cx, cy, s * 0.08, 0, 7); g.fillStyle = '#ff2d6f'; g.fill(); g.stroke();
  } else if (id === 3) {   // はちまき（体の 上のほうに まく）
    g.fillStyle = '#fff'; g.beginPath(); g.rect(x - s * 0.62, y + s * 0.02, s * 1.24, s * 0.16); g.fill(); g.stroke();
    g.fillStyle = '#e53935'; g.beginPath(); g.arc(x, y + s * 0.1, s * 0.05, 0, 7); g.fill();
    g.beginPath(); g.moveTo(x - s * 0.62, y + s * 0.08); g.lineTo(x - s * 0.92, y - s * 0.04); g.moveTo(x - s * 0.62, y + s * 0.12); g.lineTo(x - s * 0.9, y + s * 0.2); g.stroke();
    g.restore(); return 0;
  } else if (id === 4) {   // シルクハット
    const w = s * 0.62, h = s * 0.62;
    g.fillStyle = '#212121'; g.beginPath(); g.rect(x - s * 0.46, y - s * 0.1, s * 0.92, s * 0.12); g.fill(); g.stroke();
    g.beginPath(); g.rect(x - w / 2, y - s * 0.1 - h, w, h); g.fill(); g.stroke();
    g.fillStyle = '#e53935'; g.fillRect(x - w / 2 + 1, y - s * 0.26, w - 2, s * 0.1);
    g.restore(); return s * 0.72;
  } else if (id === 5) {   // とんがりぼうし（まほうつかい）
    g.fillStyle = '#5e35b1'; g.beginPath(); g.moveTo(x - s * 0.42, y); g.lineTo(x + s * 0.42, y); g.lineTo(x + s * 0.12, y - s * 0.95); g.closePath(); g.fill(); g.stroke();
    star(g, x - s * 0.02, y - s * 0.34, s * 0.1, '#ffeb3b');
    g.restore(); return s * 0.9;
  } else if (id === 6) {   // てんしの わ（うかんで いる）
    g.lineWidth = Math.max(3, s * 0.12); g.strokeStyle = '#fff59d'; g.shadowColor = '#fff176'; g.shadowBlur = 12;
    g.beginPath(); g.ellipse(x, y - s * 0.34, s * 0.34, s * 0.1, 0, 0, 7); g.stroke();
    g.restore(); return s * 0.5;
  }
  g.restore(); return s * 0.55;
}
// かお: ex, ey = 目の まんなか（目は ex ± 1.4r）、口は (ex + facing × 0.4r, ey + 2.2r)
function drawFace(g, id, ex, ey, r, facing) {
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  const eyesAt = [ex - r * 1.4, ex + r * 1.4];
  if (id === 7) {   // ぐるぐるめ
    for (const x of eyesAt) { g.fillStyle = '#fff'; g.beginPath(); g.arc(x, ey, r * 1.05, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = Math.max(1, r * 0.22); g.beginPath(); for (let a = 0; a < 12; a += 0.3) { const rr = r * a / 12; g.lineTo(x + Math.cos(a) * rr, ey + Math.sin(a) * rr); } g.stroke(); }
  } else if (id === 8) {   // サングラス
    g.fillStyle = '#111'; g.strokeStyle = '#111'; g.lineWidth = Math.max(1.5, r * 0.35);
    for (const x of eyesAt) { g.beginPath(); g.ellipse(x, ey, r * 1.35, r * 1.05, 0, 0, 7); g.fill(); }
    g.beginPath(); g.moveTo(eyesAt[0] + r, ey - r * 0.3); g.lineTo(eyesAt[1] - r, ey - r * 0.3); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.55)'; for (const x of eyesAt) { g.beginPath(); g.ellipse(x - r * 0.45, ey - r * 0.35, r * 0.35, r * 0.2, -0.4, 0, 7); g.fill(); }
  } else if (id === 9) {   // ちょびひげ
    const mx = ex + facing * r * 0.4, my = ey + r * 1.5;
    g.fillStyle = INK; g.beginPath(); g.ellipse(mx - r * 0.7, my, r * 0.75, r * 0.35, 0.2, 0, 7); g.ellipse(mx + r * 0.7, my, r * 0.75, r * 0.35, -0.2, 0, 7); g.fill();
  } else if (id === 10) {   // でっかい きば
    const mx = ex + facing * r * 0.4, my = ey + r * 2.2, mw = r * 1.6;
    g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = Math.max(1, r * 0.18);
    for (const fx of [-0.6, 0.6]) { g.beginPath(); g.moveTo(mx + mw * fx - r * 0.45, my); g.lineTo(mx + mw * fx + r * 0.45, my); g.lineTo(mx + mw * fx, my + r * 1.5); g.closePath(); g.fill(); g.stroke(); }
  } else if (id === 11) {   // ひとつめ（2 つの 目を かくして 大きい目 1 つ）
    const cx = ex + facing * r * 0.2;
    g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = Math.max(1.5, r * 0.25);
    g.beginPath(); g.arc(cx, ey, r * 2.3, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#43a047'; g.beginPath(); g.arc(cx + facing * r * 0.6, ey, r * 1.1, 0, 7); g.fill();
    g.fillStyle = INK; g.beginPath(); g.arc(cx + facing * r * 0.7, ey, r * 0.55, 0, 7); g.fill();
  } else if (id === 12) {   // ハートの め
    for (const x of eyesAt) heart(g, x, ey, r * 1.15, '#ff4081');
  }
  g.restore();
}
// からだの もよう（体の 形で clip した あとに 呼ぶ）。x0..y1 = 体の 四角
function drawBody(g, id, x0, y0, x1, y1, t) {
  const w = x1 - x0, h = y1 - y0;
  g.save();
  if (id === 13) { g.fillStyle = 'rgba(13,16,48,.28)'; for (let y = y0 + 6; y < y1; y += 18) g.fillRect(x0 - 5, y, w + 10, 8); }
  else if (id === 14) { g.fillStyle = 'rgba(255,255,255,.6)'; let k = 0; for (let y = y0 + 10; y < y1; y += 22) { for (let x = x0 + (k % 2 ? 16 : 5); x < x1; x += 22) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); } k++; } }
  else if (id === 15) { let k = 0; for (let y = y0 + 12; y < y1; y += 28) { for (let x = x0 + (k % 2 ? 20 : 6); x < x1; x += 28) star(g, x, y, 6, 'rgba(255,235,59,.9)'); k++; } }
  else if (id === 16) { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, '#fff3b0'); gr.addColorStop(0.45, '#ffc107'); gr.addColorStop(0.55, '#ffe082'); gr.addColorStop(1, '#c79100'); g.fillStyle = gr; g.fillRect(x0 - 5, y0 - 5, w + 10, h + 10); }
  else if (id === 17) { const sh = ((t || 0) * 40) % (w + h); const gr = g.createLinearGradient(x0 - sh, y0, x1 + w - sh, y1); ['#ff5252', '#ffab40', '#ffee58', '#69f0ae', '#40c4ff', '#b388ff', '#ff5252'].forEach((c, i, a) => gr.addColorStop(i / (a.length - 1), c)); g.globalAlpha = 0.85; g.fillStyle = gr; g.fillRect(x0 - 5, y0 - 5, w + 10, h + 10); }
  g.restore();
}
function glowColor(fx) { return fx === 24 ? '#b388ff' : null; }

root.KZ = { SLOTS, SLOT_LABEL, ITEMS, PRICE, DUP_BACK, RATE, WIN, CLEAR, store, earn, winReward, pull, drawHead, drawFace, drawBody, glowColor, star, heart };
})(typeof module !== 'undefined' ? module.exports : window);
