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
  { id: 19, slot: 'fx', name: 'あしあとに はな', r: 1, desc: 'あるくと あしあとに はなが さく' },
  { id: 20, slot: 'fx', name: 'パンチで ほし', r: 1, desc: 'パンチが あたると ほしが とびちる' },
  { id: 21, slot: 'fx', name: 'あせ', r: 1, desc: 'たたかって いると あせが とぶ' },
  { id: 22, slot: 'fx', name: 'ほのお', r: 2, desc: 'からだから ほのおが もえあがる' },
  { id: 23, slot: 'fx', name: 'かみなり', r: 2, desc: 'でんきが はしって ときどき かみなりが おちる' },
  { id: 24, slot: 'fx', name: 'オーラ', r: 3, desc: 'むらさきの オーラが あふれだす' },
  // v81: 各 20 こに（★ 6・★★ 5・★★★ 3 を 足した）。番号は 変えない（URL・持ちものが そのまま つかえる）
  { id: 25, slot: 'head', name: 'ねこみみ', r: 1 },
  { id: 26, slot: 'head', name: 'うさみみ', r: 1 },
  { id: 27, slot: 'head', name: 'ヘルメット', r: 1 },
  { id: 28, slot: 'head', name: 'アンテナ', r: 1 },
  { id: 29, slot: 'head', name: 'はっぱ', r: 1 },
  { id: 30, slot: 'head', name: 'ベレーぼう', r: 1 },
  { id: 31, slot: 'head', name: 'かぼちゃの ぼうし', r: 2 },
  { id: 32, slot: 'head', name: 'ナイトの かぶと', r: 2 },
  { id: 33, slot: 'head', name: 'サンタぼう', r: 2 },
  { id: 34, slot: 'head', name: 'きょうりゅうの とさか', r: 2 },
  { id: 35, slot: 'head', name: 'ヘッドホン', r: 2 },
  { id: 36, slot: 'head', name: 'ほのおの かみ', r: 3 },
  { id: 37, slot: 'head', name: 'ユニコーンの つの', r: 3 },
  { id: 38, slot: 'head', name: 'うちゅうの ヘルメット', r: 3 },
  { id: 39, slot: 'face', name: 'ほっぺ', r: 1 },
  { id: 40, slot: 'face', name: 'まゆげ', r: 1 },
  { id: 41, slot: 'face', name: 'ばんそうこう', r: 1 },
  { id: 42, slot: 'face', name: 'べろ', r: 1 },
  { id: 43, slot: 'face', name: 'まるメガネ', r: 1 },
  { id: 44, slot: 'face', name: 'ねむいめ', r: 1 },
  { id: 45, slot: 'face', name: 'ピエロの はな', r: 2 },
  { id: 46, slot: 'face', name: 'かいぞくの アイパッチ', r: 2 },
  { id: 47, slot: 'face', name: 'ロボの め', r: 2 },
  { id: 48, slot: 'face', name: 'キラキラの め', r: 2 },
  { id: 49, slot: 'face', name: 'ヒーローマスク', r: 2 },
  { id: 50, slot: 'face', name: 'レーザーアイ', r: 3 },
  { id: 51, slot: 'face', name: 'ぎんがの め', r: 3 },
  { id: 52, slot: 'face', name: 'ほのおの め', r: 3 },
  { id: 53, slot: 'body', name: 'チェック', r: 1 },
  { id: 54, slot: 'body', name: 'ハートもよう', r: 1 },
  { id: 55, slot: 'body', name: 'ひょうがら', r: 1 },
  { id: 56, slot: 'body', name: 'うろこ', r: 1 },
  { id: 57, slot: 'body', name: 'ツギハギ', r: 1 },
  { id: 58, slot: 'body', name: 'めいさい', r: 1 },
  { id: 59, slot: 'body', name: 'マグマ', r: 2 },
  { id: 60, slot: 'body', name: 'こおり', r: 2 },
  { id: 61, slot: 'body', name: 'メカ', r: 2 },
  { id: 62, slot: 'body', name: 'ドラゴンの うろこ', r: 2 },
  { id: 63, slot: 'body', name: 'さくら', r: 2 },
  { id: 64, slot: 'body', name: 'うちゅう', r: 3 },
  { id: 65, slot: 'body', name: 'ホログラム', r: 3 },
  { id: 66, slot: 'body', name: 'オーロラ', r: 3 },
  { id: 67, slot: 'fx', name: 'ハート', r: 1, desc: 'ハートが ふわふわ でてくる' },
  { id: 68, slot: 'fx', name: 'おんぷ', r: 1, desc: 'おんぷが ぽんぽん とびだす' },
  { id: 69, slot: 'fx', name: 'しゃぼんだま', r: 1, desc: 'しゃぼんだまが ふわっと うかぶ' },
  { id: 70, slot: 'fx', name: 'すなぼこり', r: 1, desc: 'あるくと すなぼこりが たつ' },
  { id: 71, slot: 'fx', name: 'はっぱ', r: 1, desc: 'はっぱが まわりを まう' },
  { id: 72, slot: 'fx', name: 'ゆき', r: 1, desc: 'まわりに ゆきが ふる' },
  { id: 73, slot: 'fx', name: 'ふぶき', r: 2, desc: 'こおりの かけらが まわりを まわる' },
  { id: 74, slot: 'fx', name: 'どく', r: 2, desc: 'みどりの どくの もやと あわ' },
  { id: 75, slot: 'fx', name: 'かぜ', r: 2, desc: 'かぜが うずを まいて まわる' },
  { id: 76, slot: 'fx', name: 'みず', r: 2, desc: 'みずの おびが まわって しぶきが とぶ' },
  { id: 77, slot: 'fx', name: 'かげぶんしん', r: 2, desc: 'うしろに かげの ぶんしんが ついてくる' },
  { id: 78, slot: 'fx', name: 'ドラゴンの つばさ', r: 3, desc: 'せなかに ドラゴンの つばさが はえて はばたく' },
  { id: 79, slot: 'fx', name: 'ブラックホール', r: 3, desc: 'うしろで ブラックホールが うずまく' },
  { id: 80, slot: 'fx', name: 'きんいろの ひかり', r: 3, desc: 'そらから きんいろの ひかりが さしこむ' },
  // ちけい ぼうけんの ごほうび（ガチャには 出ない。lim ＝ うらを クリアした 地形の 数）
  { id: 81, slot: 'head', name: 'たんけんぼう', r: 3, lim: 3, desc: 'ちけいの うらを 3 つ クリアで もらえる（水平も 1 つ）' },
  { id: 82, slot: 'head', name: 'ちけいの かんむり', r: 3, lim: 6, desc: 'ちけいの うらを 6 つ クリアで もらえる（水平も 1 つ）' },
  { id: 83, slot: 'head', name: 'せかいの かんむり', r: 3, lim: 9, desc: 'ちけいの うらを 9 つ クリアで もらえる（水平も 1 つ）' },
  // おうえん（OFUSE）の お礼（2026-10-03）。ガチャには 出ない・もって いない 人には 見せない。コードを 入れると もらえる（game.js）
  { id: 84, slot: 'fx', name: 'きんの はね', r: 3, sup: true, desc: 'おうえん して くれた 人だけの きんの はね。せなかで はばたく' },
  // 配布イベントの かざり（2026-10-06〜）は gift: true（ガチャには 出ない・もって いない 人には 見せない）。コードは tools/event_codes.js
  { id: 85, slot: 'head', name: 'スタンプかんむり', r: 3, stamp: true, desc: 'まいにちの ミッションで スタンプを 7 こ あつめると もらえる' },   // 2026-10-04 ガチャには 出ない
  // ハロウィン（配布イベント 2026-10、オーナーが 5 案から C を えらんだ）
  { id: 86, slot: 'fx', name: 'ランタンおばけ', r: 3, gift: true, desc: 'かぼちゃの ランタンを もった おばけが ついてくる' },
  // 1 万人の おいわい（配布イベント 2026-10、オーナーが 4 案から B を えらんだ）
  { id: 87, slot: 'fx', name: 'おいわいふうせん', r: 3, gift: true, desc: '1万人 ありがとう！ 金の「1万」と 赤・青の ふうせん' },
  // 2026-10-06 ガチャに 40 種 ふやした（場所ごとに 10 種・★ 4・★★ 4・★★★ 2。オーナー）
  { id: 88, slot: 'head', name: 'キャップ', r: 1 },
  { id: 89, slot: 'head', name: 'むぎわらぼう', r: 1 },
  { id: 90, slot: 'head', name: 'ニットぼう', r: 1 },
  { id: 91, slot: 'head', name: 'ちょんまげ', r: 1 },
  { id: 92, slot: 'head', name: 'コックぼう', r: 2 },
  { id: 93, slot: 'head', name: 'かいぞくぼう', r: 2 },
  { id: 94, slot: 'head', name: 'ティアラ', r: 2 },
  { id: 95, slot: 'head', name: 'きつねの おめん', r: 2 },
  { id: 96, slot: 'head', name: 'まわる わくせい', r: 3 },
  { id: 97, slot: 'head', name: 'まほうじんの わ', r: 3 },
  { id: 98, slot: 'face', name: 'マスク', r: 1 },
  { id: 99, slot: 'face', name: 'ウインク', r: 1 },
  { id: 100, slot: 'face', name: 'ねこひげ', r: 1 },
  { id: 101, slot: 'face', name: 'にっこりめ', r: 1 },
  { id: 102, slot: 'face', name: 'ゴーグル', r: 2 },
  { id: 103, slot: 'face', name: 'モノクル', r: 2 },
  { id: 104, slot: 'face', name: 'せんしの ペイント', r: 2 },
  { id: 105, slot: 'face', name: 'ほしがたサングラス', r: 2 },
  { id: 106, slot: 'face', name: 'ドラゴンの め', r: 3 },
  { id: 107, slot: 'face', name: 'ホログラムの バイザー', r: 3 },
  { id: 108, slot: 'body', name: 'ほしの マーク', r: 1 },
  { id: 109, slot: 'body', name: 'いなずまの マーク', r: 1 },
  { id: 110, slot: 'body', name: 'ゼッケン', r: 1 },
  { id: 111, slot: 'body', name: 'エプロン', r: 1 },
  { id: 112, slot: 'body', name: 'よろい', r: 2 },
  { id: 113, slot: 'body', name: 'きもの', r: 2 },
  { id: 114, slot: 'body', name: 'でんしかいろ', r: 2 },
  { id: 115, slot: 'body', name: 'わたあめ', r: 2 },
  { id: 116, slot: 'body', name: 'ステンドグラス', r: 3 },
  { id: 117, slot: 'body', name: 'みずの からだ', r: 3 },
  { id: 118, slot: 'fx', name: 'ちょうちょ', r: 1, desc: 'ちょうちょが 2 ひき まわりを ひらひら' },
  { id: 119, slot: 'fx', name: 'くも', r: 1, desc: 'からだの したに ふわふわの くも' },
  { id: 120, slot: 'fx', name: 'ほたる', r: 1, desc: 'ほたるの 光が ゆっくり まう' },
  { id: 121, slot: 'fx', name: 'はなびら', r: 1, desc: 'はなびらが すこし まう' },
  { id: 122, slot: 'fx', name: 'にじ', r: 2, desc: 'うしろに にじの アーチ' },
  { id: 123, slot: 'fx', name: 'まわる ほし', r: 2, desc: 'ほしが まわりを ぐるぐる' },
  { id: 124, slot: 'fx', name: 'ひのたま', r: 2, desc: 'ひのたまが 2 つ まわる' },
  { id: 125, slot: 'fx', name: 'さくらふぶき', r: 2, desc: 'かぜと いっしょに さくらが ながれる' },
  { id: 126, slot: 'fx', name: 'フェニックス', r: 3, desc: 'ほのおの つばさで はばたく 火の鳥' },
  { id: 127, slot: 'fx', name: 'おうごんの りゅう', r: 3, desc: '金の りゅうが 上を うねって とぶ' },
];
const PRICE = 100, DUP_BACK = 30, RATE = [0, 0.6, 0.3, 0.1];
const WIN = { omote: 10, ura: 30, minna: 60, kami: 120 }, CLEAR = { omote: 50, ura: 150, minna: 300, kami: 600 }, HIST_MAX = 30;   // かみ（v173）: ここに なくて コイン 0・毎回「かちすぎ」と 出て いた
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
function winReward(st, code, side, stage, clear, pre) {   // pre: ちけいの 地形（'t.yama.'）。水平は ''
  const w = earn(st, code, (pre || '') + side + stage, WIN[side] || 0);
  const c = clear ? earn(st, code, (pre || '') + side + 'c', CLEAR[side] || 0) : null;
  return { got: w.got + (c ? c.got : 0), n: w.n, win: w, clear: c };
}
function pull(st, rand) {
  if (st.coins() < PRICE) return null;
  st.addCoins(-PRICE);
  return roll(st, rand);
}
// 10 連＋1: 1000 コインで 11 回（1 回ずつより 100 コイン おとく）
const MULTI_PRICE = 1000, MULTI_N = 11;
function pullMulti(st, rand) {
  if (st.coins() < MULTI_PRICE) return null;
  st.addCoins(-MULTI_PRICE);
  const out = []; for (let i = 0; i < MULTI_N; i++) out.push(roll(st, rand));
  return out;
}
function roll(st, rand) {
  const u = rand(); const r = u < RATE[3] ? 3 : u < RATE[3] + RATE[2] ? 2 : 1;
  const pool = ITEMS.filter(it => it && it.r === r && !it.lim && !it.sup && !it.stamp && !it.gift), it = pool[Math.floor(rand() * pool.length) % pool.length];
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
  } else if (id === 85) { top = headStamp(g, x, y, s, t);
  } else if (id >= 81 && id <= 83) top = headTerrain(g, id, x, y, s, t);
  else if (id >= 88 && id <= 97) top = headNew(g, id, x, y, s, t);
  else if (id >= 25) top = headMore(g, id, x, y, s, t);
  g.restore(); return top;
}
// スタンプかんむり（85、毎日の ミッションの スタンプ 7 こ。2026-10-05 オーナーが 4 案から D）: 金の 王冠に 7 色の スタンプ、ときどき キラッ
function headStamp(g, x, y, s, t) {
  g.save(); g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = Math.max(2, s * 0.06);
  const gr = g.createLinearGradient(0, y - s * 0.7, 0, y); gr.addColorStop(0, '#fff59d'); gr.addColorStop(1, '#ffb300');
  g.fillStyle = gr; g.beginPath(); g.moveTo(x - s * 0.55, y); g.lineTo(x - s * 0.58, y - s * 0.42);
  for (let i = 0; i < 7; i++) { const px = x - s * 0.58 + (i + 0.5) / 7 * s * 1.16; g.lineTo(px, y - s * (i % 2 ? 0.5 : 0.72)); g.lineTo(px + s * 0.083, y - s * 0.42); }
  g.lineTo(x + s * 0.55, y); g.closePath(); g.fill(); g.stroke();
  const cs = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#5e35b1', '#d81b60'];
  g.lineWidth = Math.max(1, s * 0.03); for (let i = 0; i < 7; i++) { g.fillStyle = cs[i]; g.beginPath(); g.arc(x - s * 0.5 + i / 6 * s, y - s * 0.18, s * 0.075, 0, 7); g.fill(); g.stroke(); }
  twinkle(g, x + s * 0.3, y - s * 0.6, s * 0.2, (Math.sin(t * 2.5) + 1) / 2);
  g.restore(); return s * 0.75;
}
// ちけいの ごほうびの ぼうし（81 たんけんぼう・82 ちけいの かんむり・83 せかいの かんむり）
function headTerrain(g, id, x, y, s, t) {
  if (id === 81) {   // たんけんぼう: カーキの まるい ぼうし＋つば＋あかい バンド
    const gr = g.createLinearGradient(x, y - s * 0.6, x, y); gr.addColorStop(0, '#e6d3a3'); gr.addColorStop(1, '#b89b5e');
    g.fillStyle = '#a8894d'; g.beginPath(); g.ellipse(x, y - s * 0.02, s * 0.62, s * 0.12, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = gr; g.beginPath(); g.moveTo(x - s * 0.42, y - s * 0.04); g.quadraticCurveTo(x - s * 0.44, y - s * 0.62, x, y - s * 0.64); g.quadraticCurveTo(x + s * 0.44, y - s * 0.62, x + s * 0.42, y - s * 0.04); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#c62828'; g.fillRect(x - s * 0.41, y - s * 0.2, s * 0.82, s * 0.1);
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = Math.max(1, s * 0.04); g.beginPath(); g.moveTo(x - s * 0.22, y - s * 0.5); g.quadraticCurveTo(x - s * 0.1, y - s * 0.58, x + s * 0.06, y - s * 0.57); g.stroke();
    return s * 0.66;
  }
  if (id === 82) {   // ちけいの かんむり: 山の かたちの ぎざぎざ（みどり→きん）と あおい 石
    const gr = g.createLinearGradient(x, y - s * 0.7, x, y); gr.addColorStop(0, '#ffe082'); gr.addColorStop(1, '#43a047');
    g.fillStyle = gr; g.beginPath(); g.moveTo(x - s * 0.5, y);
    const pk = [[-0.36, -0.48], [-0.2, -0.24], [0, -0.7], [0.2, -0.24], [0.36, -0.48]];
    g.lineTo(x - s * 0.5, y - s * 0.22); for (const [px, py] of pk) g.lineTo(x + px * s, y + py * s); g.lineTo(x + s * 0.5, y - s * 0.22); g.lineTo(x + s * 0.5, y); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#fff'; for (const [px, py] of [pk[0], pk[2], pk[4]]) { g.beginPath(); g.moveTo(x + px * s, y + py * s); g.lineTo(x + px * s - s * 0.07, y + py * s + s * 0.1); g.lineTo(x + px * s + s * 0.07, y + py * s + s * 0.1); g.closePath(); g.fill(); }   // 山の ゆき
    g.fillStyle = '#29b6f6'; g.beginPath(); g.arc(x, y - s * 0.11, s * 0.08, 0, 7); g.fill(); g.stroke();
    twinkle(g, x + s * 0.03, y - s * 0.14, s * 0.1, wave(t, 2.6, 1) > 0.8 ? (wave(t, 2.6, 1) - 0.8) * 5 : 0);
    return s * 0.72;
  }
  // 83 せかいの かんむり: きんの わの 上に ちきゅう、まわりを ほしが まわる
  g.fillStyle = '#ffca28'; g.beginPath(); g.rect(x - s * 0.42, y - s * 0.2, s * 0.84, s * 0.2); g.fill(); g.stroke();
  g.fillStyle = '#e53935'; for (const k of [-0.25, 0, 0.25]) { g.beginPath(); g.arc(x + k * s, y - s * 0.1, s * 0.045, 0, 7); g.fill(); }
  const cy = y - s * 0.46, r = s * 0.26;
  g.fillStyle = '#1e88e5'; g.beginPath(); g.arc(x, cy, r, 0, 7); g.fill();
  g.save(); g.beginPath(); g.arc(x, cy, r, 0, 7); g.clip(); g.fillStyle = '#66bb6a';
  const sh = (t * 0.25 % 1) * r * 2;   // 大陸が ゆっくり まわる
  for (const [ox, oy, w] of [[-0.5, -0.3, 0.55], [0.4, 0.2, 0.5], [1.3, -0.1, 0.6]]) { g.beginPath(); g.ellipse(x - r + ((ox * r + sh) % (r * 2.6)), cy + oy * r, w * r, w * r * 0.6, 0.4, 0, 7); g.fill(); }
  g.restore(); g.beginPath(); g.arc(x, cy, r, 0, 7); g.stroke();
  g.strokeStyle = '#fff8e1'; g.lineWidth = Math.max(1, s * 0.035); g.beginPath(); g.ellipse(x, cy, r * 1.5, r * 0.45, -0.3, 0, 7); g.stroke();
  const a = t * 1.6; star(g, x + Math.cos(a) * r * 1.5, cy + Math.sin(a) * r * 0.45 - Math.cos(a) * r * 0.3 * 0.3, s * 0.07, '#fff59d', INK, 0);
  return s * 0.76;
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
  } else if (id >= 98 && id <= 107) faceNew(g, id, ex, ey, r, facing, t, eyesAt);
  else if (id >= 39) faceMore(g, id, ex, ey, r, facing, t, eyesAt);
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
  // 集合体が こわい 人にも つらくない ように、もようは「大きく・少なく・ばらばら」（ぎっしり 並べない）
  else if (id === 14) { g.fillStyle = 'rgba(255,255,255,.62)'; let k = 0; for (let y = y0 + 14; y < y1 + 6; y += 38) { for (let x = x0 + (k % 2 ? 30 : 10); x < x1 + 6; x += 42) { g.beginPath(); g.arc(x, y, 10, 0, 7); g.fill(); } k++; } }
  else if (id === 15) {   // ほしぞら（★★）: 夜の グラデーション に またたく 星
    const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, 'rgba(26,35,126,.75)'); gr.addColorStop(1, 'rgba(74,20,140,.75)');
    g.fillStyle = gr; g.fillRect(x0 - 5, y0 - 5, w + 10, h + 10);
    for (let i = 0; i < 7; i++) { const a = wave(t, 2 + (i % 3), i), x = x0 + w * (0.1 + 0.8 * hash(i + 200)), y = y0 + h * (0.1 + 0.8 * hash(i + 230)); if (i % 2 === 0) star(g, x, y, 5 + a * 3, 'rgba(255,241,118,' + (0.5 + 0.5 * a).toFixed(2) + ')'); else { g.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.6 * a).toFixed(2) + ')'; g.beginPath(); g.arc(x, y, 1.6 + a, 0, 7); g.fill(); } }
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
    for (let i = 0; i < 3; i++) { const ph = (t * 0.3 + i / 3) % 1; g.strokeStyle = 'rgba(255,255,255,' + (0.8 * Math.sin(ph * Math.PI)).toFixed(2) + ')'; g.beginPath(); g.arc(x0 + w * (0.2 + i * 0.3) + Math.sin(t * 2 + i) * 3, y1 - ph * h, 4 + (i % 2) * 2, 0, 7); g.stroke(); }
    shine(g, x0, y0, w, h, t, 0.5, 1);
    for (let i = 0; i < 3; i++) twinkle(g, x0 + w * (0.2 + i * 0.3), y0 + h * (0.25 + (i % 2) * 0.4), 9, wave(t, 2.8, i + 3) > 0.7 ? (wave(t, 2.8, i + 3) - 0.7) * 3.3 : 0, '#e0f7fa');
  } else if (id >= 108 && id <= 117) bodyNew(g, id, x0, y0, x1, y1, w, h, t);
  else if (id >= 53) bodyMore(g, id, x0, y0, x1, y1, w, h, t);
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
  } else if (id >= 118 && id <= 127) fxNew(g, id, info, t, w, h, cx, cy, false);
  else if (id >= 67) fxBackMore(g, id, info, t, w, h, cx, cy);
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
  } else if (id >= 118 && id <= 127) fxNew(g, id, info, t, w, h, cx, cy, true);
  else if (id >= 67) fxFrontMore(g, id, info, t, w, h, cx, cy);
}
// ---------- v81 で ふえた かざりの 絵 ----------
// 決まった 並びの ばらつき（毎フレーム 同じ 位置に なるように）
const hash = i => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
function lin(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); return gr; }
function flame(g, fx, by, fw, fh, sway, cols) {   // 3 色 重ねの ほのお（g は lighter に して 呼ぶ）
  [[1, cols[0]], [0.62, cols[1]], [0.32, cols[2]]].forEach(([k, c]) => {
    const gr = g.createLinearGradient(fx, by, fx, by - fh * k); gr.addColorStop(0, c); gr.addColorStop(1, c.replace(/[\d.]+\)$/, '0)'));
    g.fillStyle = gr; g.beginPath(); g.moveTo(fx - fw * k, by); g.quadraticCurveTo(fx - fw * k * 0.9, by - fh * k * 0.5, fx + sway * k, by - fh * k); g.quadraticCurveTo(fx + fw * k * 0.9, by - fh * k * 0.5, fx + fw * k, by); g.fill();
  });
}
function headMore(g, id, x, y, s, t) {
  if (id === 25) {   // ねこみみ（★）
    for (const k of [-1, 1]) {
      g.beginPath(); g.moveTo(x + k * s * 0.1, y + 1); g.lineTo(x + k * s * 0.4, y - s * 0.46); g.lineTo(x + k * s * 0.52, y + 1); g.closePath(); g.fillStyle = '#6d4c41'; g.fill(); g.stroke();
      g.beginPath(); g.moveTo(x + k * s * 0.2, y - 1); g.lineTo(x + k * s * 0.39, y - s * 0.3); g.lineTo(x + k * s * 0.45, y - 1); g.closePath(); g.fillStyle = '#f8bbd0'; g.fill();
    }
    return s * 0.48;
  }
  if (id === 26) {   // うさみみ（★）: ぴょこぴょこ
    for (const k of [-1, 1]) {
      g.save(); g.translate(x + k * s * 0.2, y - s * 0.42); g.rotate(k * (0.18 + Math.sin(t * 3 + k) * 0.06));
      g.beginPath(); g.ellipse(0, 0, s * 0.13, s * 0.48, 0, 0, 7); g.fillStyle = '#fafafa'; g.fill(); g.stroke();
      g.beginPath(); g.ellipse(0, s * 0.04, s * 0.06, s * 0.34, 0, 0, 7); g.fillStyle = '#f8bbd0'; g.fill(); g.restore();
    }
    return s * 0.92;
  }
  if (id === 27) {   // ヘルメット（★）
    g.beginPath(); g.ellipse(x, y + 2, s * 0.55, s * 0.44, 0, Math.PI, 0); g.closePath(); g.fillStyle = lin(g, x - s * 0.5, 0, x + s * 0.5, 0, ['#fff176', '#fdd835', '#f9a825']); g.fill(); g.stroke();
    g.fillStyle = '#fbc02d'; g.beginPath(); g.rect(x - s * 0.64, y - 2, s * 1.28, s * 0.09); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = Math.max(1.5, s * 0.05); g.beginPath(); g.arc(x - s * 0.1, y - s * 0.05, s * 0.3, Math.PI * 1.15, Math.PI * 1.45); g.stroke();
    return s * 0.46;
  }
  if (id === 28) {   // アンテナ（★）: ゆれる 玉
    const tx = x + Math.sin(t * 4) * s * 0.12, ty = y - s * 0.7;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x, y - s * 0.4, tx, ty); g.stroke();
    g.beginPath(); g.arc(tx, ty, s * 0.11, 0, 7); g.fillStyle = '#e53935'; g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(tx - s * 0.035, ty - s * 0.035, s * 0.035, 0, 7); g.fill();
    return s * 0.84;
  }
  if (id === 29) {   // はっぱ（★）: そよそよ
    const ex = x + s * 0.05, ey = y - s * 0.28;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - s * 0.04, y - s * 0.15, ex, ey); g.strokeStyle = '#33691e'; g.stroke();
    g.save(); g.translate(ex, ey); g.rotate(-0.5 + Math.sin(t * 2.5) * 0.18);
    g.beginPath(); g.ellipse(s * 0.2, 0, s * 0.22, s * 0.1, 0, 0, 7); g.fillStyle = lin(g, 0, -s * 0.1, 0, s * 0.1, ['#aed581', '#558b2f']); g.fill(); g.strokeStyle = INK; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = Math.max(1, s * 0.03); g.beginPath(); g.moveTo(0, 0); g.lineTo(s * 0.38, 0); g.stroke(); g.restore();
    return s * 0.45;
  }
  if (id === 30) {   // ベレーぼう（★）
    g.beginPath(); g.ellipse(x + s * 0.08, y - s * 0.1, s * 0.52, s * 0.17, -0.12, 0, 7); g.fillStyle = lin(g, x - s * 0.5, 0, x + s * 0.6, 0, ['#ef5350', '#c62828']); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x + s * 0.1, y - s * 0.26); g.lineTo(x + s * 0.13, y - s * 0.36); g.stroke();
    return s * 0.36;
  }
  if (id === 31) {   // かぼちゃの ぼうし（★★）: 中で ろうそくが ゆらめく
    const cy = y - s * 0.3;
    const gr = g.createRadialGradient(x - s * 0.15, cy - s * 0.12, s * 0.05, x, cy, s * 0.55); gr.addColorStop(0, '#ffcc80'); gr.addColorStop(0.5, '#fb8c00'); gr.addColorStop(1, '#e65100');
    g.beginPath(); g.ellipse(x, cy, s * 0.52, s * 0.36, 0, 0, 7); g.fillStyle = gr; g.fill(); g.stroke();
    g.strokeStyle = 'rgba(191,54,12,.7)'; g.lineWidth = Math.max(1.2, s * 0.04);
    for (const k of [-0.5, 0, 0.5]) { g.beginPath(); g.ellipse(x + k * s * 0.45, cy, s * 0.14, s * 0.34, 0, 0, 7); g.stroke(); }
    g.strokeStyle = INK; g.lineWidth = Math.max(2, s * 0.07);
    g.fillStyle = '#558b2f'; g.beginPath(); g.rect(x - s * 0.05, cy - s * 0.48, s * 0.1, s * 0.14); g.fill(); g.stroke();
    const fl = 0.7 + 0.3 * Math.sin(t * 13) * Math.sin(t * 7);
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,235,59,' + fl.toFixed(2) + ')'; g.shadowColor = '#ffeb3b'; g.shadowBlur = 10;
    for (const k of [-1, 1]) { g.beginPath(); g.moveTo(x + k * s * 0.3, cy - s * 0.02); g.lineTo(x + k * s * 0.12, cy - s * 0.02); g.lineTo(x + k * s * 0.2, cy - s * 0.16); g.closePath(); g.fill(); }
    g.beginPath(); g.moveTo(x - s * 0.28, cy + s * 0.1); for (let i = 1; i <= 6; i++) g.lineTo(x - s * 0.28 + i * s * 0.093, cy + s * (i % 2 ? 0.18 : 0.1)); g.lineTo(x + s * 0.28, cy + s * 0.22); g.lineTo(x - s * 0.28, cy + s * 0.22); g.fill();
    g.restore();
    return s * 0.8;
  }
  if (id === 32) {   // ナイトの かぶと（★★）: 銀の つや・ゆれる 赤い はね
    g.beginPath(); g.moveTo(x - s * 0.5, y + 2); g.lineTo(x - s * 0.5, y - s * 0.32); g.quadraticCurveTo(x, y - s * 0.86, x + s * 0.5, y - s * 0.32); g.lineTo(x + s * 0.5, y + 2); g.closePath();
    g.fillStyle = lin(g, x - s * 0.5, 0, x + s * 0.5, 0, ['#78909c', '#eceff1', '#b0bec5', '#eceff1', '#546e7a']); g.fill(); g.stroke();
    g.strokeStyle = INK; g.lineWidth = Math.max(2, s * 0.06);
    for (const dy of [0.12, 0.22]) { g.beginPath(); g.moveTo(x - s * 0.36, y - s * dy); g.lineTo(x + s * 0.36, y - s * dy); g.stroke(); }
    const sw = Math.sin(t * 4) * s * 0.08;
    g.beginPath(); g.moveTo(x, y - s * 0.6); g.bezierCurveTo(x - s * 0.05, y - s * 1.05, x - s * 0.45 + sw, y - s * 1.0, x - s * 0.55 + sw, y - s * 0.72); g.bezierCurveTo(x - s * 0.35 + sw, y - s * 0.82, x - s * 0.15, y - s * 0.8, x, y - s * 0.6);
    g.fillStyle = lin(g, x, y - s, x - s * 0.5, y - s * 0.6, ['#ff5252', '#b71c1c']); g.fill(); g.stroke();
    twinkle(g, x - s * 0.2, y - s * 0.45, s * 0.2, wave(t, 2.4, 2) > 0.78 ? (wave(t, 2.4, 2) - 0.78) * 4.5 : 0);
    return s * 1.0;
  }
  if (id === 33) {   // サンタぼう（★★）: ゆれる ぽんぽん・きらきら
    const tx = x + s * 0.55 + Math.sin(t * 3) * s * 0.06, ty = y - s * 0.62 + Math.cos(t * 3) * s * 0.03;
    g.beginPath(); g.moveTo(x - s * 0.5, y); g.quadraticCurveTo(x - s * 0.2, y - s * 0.95, tx, ty); g.quadraticCurveTo(x + s * 0.2, y - s * 0.4, x + s * 0.5, y); g.closePath();
    g.fillStyle = lin(g, x - s * 0.5, 0, x + s * 0.5, 0, ['#e53935', '#ff5252', '#b71c1c']); g.fill(); g.stroke();
    g.fillStyle = '#fafafa'; g.beginPath(); g.rect(x - s * 0.58, y - s * 0.12, s * 1.16, s * 0.17); g.fill(); g.stroke();
    g.beginPath(); g.arc(tx, ty, s * 0.13, 0, 7); g.fill(); g.stroke();
    twinkle(g, tx - s * 0.04, ty - s * 0.05, s * 0.18, 0.4 + 0.6 * wave(t, 3, 1), '#e3f2fd');
    return s * 0.85;
  }
  if (id === 34) {   // きょうりゅうの とさか（★★）: 光る トゲ
    for (let i = 0; i < 4; i++) {
      const cx = x + (i - 1.5) * s * 0.26, hh = s * (i === 1 || i === 2 ? 0.46 : 0.32);
      g.beginPath(); g.moveTo(cx - s * 0.13, y + 1); g.quadraticCurveTo(cx - s * 0.02, y - hh * 0.6, cx + s * 0.04, y - hh); g.quadraticCurveTo(cx + s * 0.04, y - hh * 0.4, cx + s * 0.13, y + 1); g.closePath();
      g.fillStyle = lin(g, cx, y, cx, y - hh, ['#1b5e20', '#43a047', '#b2ff59']); g.fill(); g.stroke();
    }
    const k = Math.floor(t * 1.5) % 4; twinkle(g, x + (k - 1.5) * s * 0.26 + s * 0.03, y - s * 0.3, s * 0.18, 1 - (t * 1.5 % 1));
    return s * 0.48;
  }
  if (id === 35) {   // ヘッドホン（★★）: 光る リング
    g.lineWidth = Math.max(3, s * 0.11); g.strokeStyle = '#37474f'; g.beginPath(); g.arc(x, y + s * 0.2, s * 0.58, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    g.strokeStyle = INK; g.lineWidth = Math.max(2, s * 0.06);
    const glow = 0.5 + 0.5 * wave(t, 4, 0);
    for (const k of [-1, 1]) {
      const cx = x + k * s * 0.56, cy = y + s * 0.12;
      g.beginPath(); g.ellipse(cx, cy, s * 0.14, s * 0.2, 0, 0, 7); g.fillStyle = '#263238'; g.fill(); g.stroke();
      g.save(); g.shadowColor = '#18ffff'; g.shadowBlur = 8 + 8 * glow; g.strokeStyle = 'rgba(24,255,255,' + (0.5 + 0.5 * glow).toFixed(2) + ')'; g.lineWidth = Math.max(1.5, s * 0.05); g.beginPath(); g.ellipse(cx, cy, s * 0.08, s * 0.12, 0, 0, 7); g.stroke(); g.restore();
    }
    return s * 0.42;
  }
  if (id === 36) {   // ほのおの かみ（★★★）: あたまが もえている
    g.save(); g.globalCompositeOperation = 'lighter';
    const gl = g.createRadialGradient(x, y - s * 0.3, 2, x, y - s * 0.3, s * 0.9); gl.addColorStop(0, 'rgba(255,145,0,.45)'); gl.addColorStop(1, 'rgba(255,145,0,0)'); g.fillStyle = gl; g.fillRect(x - s, y - s * 1.3, s * 2, s * 1.4);
    for (let i = 0; i < 5; i++) { const fx = x + (i - 2) * s * 0.22, fh = s * (0.55 + 0.35 * wave(t, 10, i) + (i === 2 ? 0.25 : 0)); flame(g, fx, y + 3, s * 0.16, fh, Math.sin(t * 7 + i) * s * 0.1, ['rgba(255,61,0,.85)', 'rgba(255,196,0,.95)', 'rgba(255,255,230,1)']); }
    g.restore();
    return s * 1.05;
  }
  if (id === 37) {   // ユニコーンの つの（★★★）: にじいろ・らせん・まわる ひかり
    const hue = (t * 80) % 360;
    g.save(); g.shadowColor = 'hsl(' + hue + ',100%,70%)'; g.shadowBlur = 16;
    g.beginPath(); g.moveTo(x - s * 0.14, y + 1); g.lineTo(x + s * 0.02, y - s * 1.0); g.lineTo(x + s * 0.14, y + 1); g.closePath();
    const gr = g.createLinearGradient(x, y, x, y - s); for (let i = 0; i <= 4; i++) gr.addColorStop(i / 4, 'hsl(' + ((hue + i * 70) % 360) + ',90%,75%)');
    g.fillStyle = gr; g.fill(); g.restore(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = Math.max(1.2, s * 0.035);
    for (let i = 1; i <= 4; i++) { const yy = y - s * 0.2 * i, hw = s * 0.14 * (1 - i * 0.2); g.beginPath(); g.moveTo(x - hw, yy + s * 0.05); g.lineTo(x + hw, yy - s * 0.05); g.stroke(); }
    for (let i = 0; i < 3; i++) { const a = t * 3 + i * 2.09; twinkle(g, x + Math.cos(a) * s * 0.3, y - s * 0.55 + Math.sin(a) * s * 0.15, s * 0.16, 0.9, 'hsl(' + ((hue + i * 120) % 360) + ',100%,85%)'); }
    return s * 1.05;
  }
  if (id === 38) {   // うちゅうの ヘルメット（★★★）: ガラスの ドーム・中に 星・うごく 光
    const cy = y + s * 0.2, R = s * 0.72;
    g.save(); g.beginPath(); g.arc(x, cy, R, Math.PI, 0); g.closePath(); g.clip();
    const gr = g.createRadialGradient(x - R * 0.3, cy - R * 0.5, R * 0.1, x, cy, R); gr.addColorStop(0, 'rgba(225,245,254,.35)'); gr.addColorStop(1, 'rgba(79,195,247,.18)');
    g.fillStyle = gr; g.fillRect(x - R, cy - R, R * 2, R);
    for (let i = 0; i < 7; i++) { const a = wave(t, 2 + i % 3, i); g.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.7 * a).toFixed(2) + ')'; g.beginPath(); g.arc(x + (hash(i) - 0.5) * R * 1.5, cy - hash(i + 9) * R * 0.9, 0.8 + a * 1.2, 0, 7); g.fill(); }
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = Math.max(2, s * 0.06); g.beginPath(); g.arc(x, cy, R, Math.PI, 0); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = Math.max(2, s * 0.08); const ph = (t * 0.5) % 1; g.beginPath(); g.arc(x, cy, R * 0.82, Math.PI * (1.1 + ph * 0.6), Math.PI * (1.25 + ph * 0.6)); g.stroke();
    g.fillStyle = lin(g, x - R, 0, x + R, 0, ['#90a4ae', '#eceff1', '#78909c']); g.strokeStyle = INK; g.lineWidth = Math.max(2, s * 0.06); g.beginPath(); g.rect(x - R - 2, cy - 2, R * 2 + 4, s * 0.12); g.fill(); g.stroke();
    const ax = x + R * 0.6, ay = cy - R * 0.9; g.beginPath(); g.moveTo(x + R * 0.5, cy - R * 0.85); g.lineTo(ax + s * 0.1, ay - s * 0.25); g.stroke();
    const on = Math.floor(t * 2) % 2; g.save(); g.shadowColor = '#ff1744'; g.shadowBlur = on ? 12 : 0; g.fillStyle = on ? '#ff5252' : '#b71c1c'; g.beginPath(); g.arc(ax + s * 0.1, ay - s * 0.25, s * 0.07, 0, 7); g.fill(); g.restore();
    return s * 0.95;
  }
  return s * 0.5;
}
function faceMore(g, id, ex, ey, r, facing, t, eyesAt) {
  const mx = ex + facing * r * 0.4, my = ey + r * 2.2;
  if (id === 39) { g.fillStyle = 'rgba(255,128,171,.6)'; for (const k of [-1, 1]) { g.beginPath(); g.ellipse(ex + k * r * 2.3, ey + r * 1.4, r * 0.85, r * 0.5, 0, 0, 7); g.fill(); } }   // ほっぺ
  else if (id === 40) {   // まゆげ: ぴくぴく
    const b = Math.sin(t * 6) * r * 0.12; g.strokeStyle = INK; g.lineWidth = Math.max(2, r * 0.5);
    for (const x of eyesAt) { const inner = (x - ex) > 0 ? -1 : 1; g.beginPath(); g.moveTo(x - inner * r * 1.1, ey - r * 1.7 + b); g.lineTo(x + inner * r * 0.9, ey - r * 1.25 + b); g.stroke(); }
  } else if (id === 41) {   // ばんそうこう
    g.save(); g.translate(ex - facing * r * 2.3, ey + r * 1.4); g.rotate(0.6);
    g.fillStyle = '#ffe0b2'; g.strokeStyle = INK; g.lineWidth = Math.max(1, r * 0.15); g.beginPath(); g.rect(-r * 1.3, -r * 0.45, r * 2.6, r * 0.9); g.fill(); g.stroke();
    g.fillStyle = '#ffcc80'; g.fillRect(-r * 0.45, -r * 0.45, r * 0.9, r * 0.9); g.fillStyle = 'rgba(0,0,0,.25)'; for (const d of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) { g.beginPath(); g.arc(d[0] * r, d[1] * r, r * 0.06, 0, 7); g.fill(); } g.restore();
  } else if (id === 42) {   // べろ: ぺろぺろ
    g.save(); g.translate(mx, my + r * 0.5); g.rotate(Math.sin(t * 8) * 0.18);
    g.beginPath(); g.ellipse(0, r * 0.7, r * 0.8, r * 1.0, 0, 0, Math.PI); g.lineTo(-r * 0.8, 0); g.closePath(); g.fillStyle = '#ff6f91'; g.fill(); g.strokeStyle = INK; g.lineWidth = Math.max(1, r * 0.18); g.stroke();
    g.strokeStyle = 'rgba(160,0,60,.5)'; g.beginPath(); g.moveTo(0, r * 0.15); g.lineTo(0, r * 1.1); g.stroke(); g.restore();
  } else if (id === 43) {   // まるメガネ
    g.strokeStyle = '#6d4c41'; g.lineWidth = Math.max(1.5, r * 0.3);
    for (const x of eyesAt) { g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(x, ey, r * 1.45, 0, 7); g.fill(); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = Math.max(1, r * 0.2); g.beginPath(); g.arc(x, ey, r * 1.05, Math.PI * 1.15, Math.PI * 1.45); g.stroke(); g.strokeStyle = '#6d4c41'; g.lineWidth = Math.max(1.5, r * 0.3); }
    g.beginPath(); g.moveTo(eyesAt[0] + r * 1.45, ey); g.quadraticCurveTo(ex, ey - r * 0.6, eyesAt[1] - r * 1.45, ey); g.stroke();
  } else if (id === 44) {   // ねむいめ: まぶたと Zzz
    for (const x of eyesAt) { g.fillStyle = 'rgba(13,16,48,.92)'; g.beginPath(); g.arc(x, ey, r * 1.08, Math.PI, 0); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = Math.max(1, r * 0.2); g.beginPath(); g.moveTo(x - r * 1.1, ey); g.lineTo(x + r * 1.1, ey); g.stroke(); }
    for (let i = 0; i < 2; i++) { const ph = (t * 0.5 + i * 0.5) % 1; g.globalAlpha = Math.sin(ph * Math.PI); g.fillStyle = '#e3f2fd'; g.font = '900 ' + (r * (1.3 + ph)).toFixed(1) + 'px sans-serif'; g.fillText('z', ex + r * 3 + ph * r * 2, ey - r * 1.5 - ph * r * 4); }
    g.globalAlpha = 1;
  } else if (id === 45) {   // ピエロの はな（★★）
    const nx = ex + facing * r * 0.5, ny = ey + r * 1.25, gr = g.createRadialGradient(nx - r * 0.35, ny - r * 0.35, r * 0.1, nx, ny, r * 1.0); gr.addColorStop(0, '#ff8a80'); gr.addColorStop(0.6, '#ff1744'); gr.addColorStop(1, '#b71c1c');
    g.beginPath(); g.arc(nx, ny, r * 0.95, 0, 7); g.fillStyle = gr; g.fill(); g.strokeStyle = INK; g.lineWidth = Math.max(1, r * 0.18); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(nx - r * 0.35, ny - r * 0.38, r * 0.28, r * 0.18, -0.6, 0, 7); g.fill();
    twinkle(g, nx - r * 0.3, ny - r * 0.35, r * 1.3, wave(t, 2.8, 1) > 0.8 ? (wave(t, 2.8, 1) - 0.8) * 5 : 0);
  } else if (id === 46) {   // かいぞくの アイパッチ（★★）
    const px = ex + facing * r * 1.4;
    g.strokeStyle = INK; g.lineWidth = Math.max(1.5, r * 0.25); g.beginPath(); g.moveTo(px - r * 3.4 * facing, ey - r * 2.2); g.lineTo(px + r * 2.6 * facing, ey + r * 1.2); g.stroke();
    g.beginPath(); g.ellipse(px, ey, r * 1.35, r * 1.15, 0, 0, 7); g.fillStyle = lin(g, px - r, ey - r, px + r, ey + r, ['#424242', '#111']); g.fill(); g.stroke();
    g.fillStyle = '#fafafa'; g.beginPath(); g.arc(px, ey - r * 0.1, r * 0.35, 0, 7); g.fill(); g.fillRect(px - r * 0.2, ey + r * 0.15, r * 0.4, r * 0.2);
    const ox = ex - facing * r * 1.4; g.strokeStyle = 'rgba(183,28,28,.8)'; g.lineWidth = Math.max(1, r * 0.2); g.beginPath(); g.moveTo(ox - r * 0.6, ey - r * 1.6); g.lineTo(ox + r * 0.6, ey + r * 1.4); for (const k of [-0.6, 0, 0.6]) { g.moveTo(ox - r * 0.5 + k * r * 0.4, ey + k * r * 1.2); g.lineTo(ox + r * 0.5 + k * r * 0.4, ey + k * r * 1.2 - r * 0.2); } g.stroke();
    twinkle(g, px - r * 0.5, ey - r * 0.5, r * 1.2, wave(t, 2.2, 3) > 0.82 ? (wave(t, 2.2, 3) - 0.82) * 5.5 : 0);
  } else if (id === 47) {   // ロボの め（★★）: LED が 左右に 走る
    const vx = ex - r * 2.8, vy = ey - r * 0.95, vw = r * 5.6, vh = r * 1.9;
    g.fillStyle = lin(g, 0, vy, 0, vy + vh, ['#37474f', '#101418']); g.strokeStyle = INK; g.lineWidth = Math.max(1.5, r * 0.25);
    g.beginPath(); g.moveTo(vx + vh / 2, vy); g.lineTo(vx + vw - vh / 2, vy); g.arc(vx + vw - vh / 2, ey, vh / 2, -Math.PI / 2, Math.PI / 2); g.lineTo(vx + vh / 2, vy + vh); g.arc(vx + vh / 2, ey, vh / 2, Math.PI / 2, Math.PI * 1.5); g.fill(); g.stroke();
    const lx = ex + Math.sin(t * 3) * r * 2.1;
    g.save(); g.globalCompositeOperation = 'lighter'; g.shadowColor = '#ff1744'; g.shadowBlur = 14;
    for (let k = 3; k >= 0; k--) { g.fillStyle = 'rgba(255,23,68,' + (0.2 + 0.8 * (k === 0)).toFixed(2) + ')'; g.beginPath(); g.ellipse(lx - Math.cos(t * 3) * k * r * 0.35, ey, r * 0.7, r * 0.45, 0, 0, 7); g.fill(); }
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(vx + vh * 0.4, vy + vh * 0.25); g.lineTo(vx + vw - vh * 0.4, vy + vh * 0.25); g.stroke();
  } else if (id === 48) {   // キラキラの め（★★）: 星の ひとみ
    for (const [i, x] of eyesAt.entries()) {
      g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = Math.max(1, r * 0.2); g.beginPath(); g.arc(x, ey, r * 1.12, 0, 7); g.fill(); g.stroke();
      star(g, x + facing * r * 0.2, ey, r * (0.75 + 0.12 * wave(t, 5, i)), '#ffc400', '#e65100', t * 1.5);
      twinkle(g, x - r * 0.7, ey - r * 0.8, r * 1.1, wave(t, 3, i * 2), '#fffde7');
    }
  } else if (id === 49) {   // ヒーローマスク（★★）: なびく ひも
    g.fillStyle = lin(g, ex - r * 3, ey - r, ex + r * 3, ey + r, ['#1e88e5', '#0d47a1']); g.strokeStyle = INK; g.lineWidth = Math.max(1.5, r * 0.22);
    g.beginPath(); g.moveTo(ex - r * 3.2, ey - r * 0.3); g.quadraticCurveTo(ex - r * 2.8, ey - r * 1.7, ex, ey - r * 0.9); g.quadraticCurveTo(ex + r * 2.8, ey - r * 1.7, ex + r * 3.2, ey - r * 0.3); g.quadraticCurveTo(ex + r * 2.6, ey + r * 1.5, ex + r * 0.4, ey + r * 0.6); g.lineTo(ex, ey + r * 0.9); g.lineTo(ex - r * 0.4, ey + r * 0.6); g.quadraticCurveTo(ex - r * 2.6, ey + r * 1.5, ex - r * 3.2, ey - r * 0.3); g.fill(); g.stroke();
    const bx = ex - facing * r * 3.1, fl = Math.sin(t * 9);
    g.beginPath(); g.moveTo(bx, ey - r * 0.3); g.quadraticCurveTo(bx - facing * r * 2, ey - r * 0.5 + fl * r * 0.6, bx - facing * r * 3.4, ey + fl * r * 0.8); g.lineTo(bx - facing * r * 3.1, ey + r * 0.6 + fl * r * 0.6); g.quadraticCurveTo(bx - facing * r * 1.8, ey + r * 0.3, bx, ey + r * 0.2); g.fill(); g.stroke();
    for (const x of eyesAt) { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, ey - r * 0.1, r * 0.95, r * 0.6, 0, 0, 7); g.fill(); g.fillStyle = INK; g.beginPath(); g.arc(x + facing * r * 0.35, ey - r * 0.05, r * 0.4, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = Math.max(1, r * 0.15); g.beginPath(); g.moveTo(ex - r * 2.6, ey - r * 0.9); g.quadraticCurveTo(ex - r * 1.6, ey - r * 1.3, ex - r * 0.6, ey - r * 1.0); g.stroke();
  } else if (id === 50) {   // レーザーアイ（★★★）: 目から ビーム
    const pulse = 0.6 + 0.4 * Math.sin(t * 22), L = r * 26;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const x of eyesAt) {
      const gr = g.createLinearGradient(x, ey, x + facing * L, ey + r * 4); gr.addColorStop(0, 'rgba(255,23,68,' + (0.9 * pulse).toFixed(2) + ')'); gr.addColorStop(1, 'rgba(255,23,68,0)');
      g.strokeStyle = gr; g.lineWidth = r * (1.1 + 0.5 * pulse); g.beginPath(); g.moveTo(x, ey); g.lineTo(x + facing * L, ey + r * 4); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,' + (0.8 * pulse).toFixed(2) + ')'; g.lineWidth = r * 0.35; g.beginPath(); g.moveTo(x, ey); g.lineTo(x + facing * L * 0.8, ey + r * 3.2); g.stroke();
      const eg = g.createRadialGradient(x, ey, 0, x, ey, r * 2.2); eg.addColorStop(0, 'rgba(255,255,255,1)'); eg.addColorStop(0.35, 'rgba(255,23,68,.9)'); eg.addColorStop(1, 'rgba(255,23,68,0)');
      g.fillStyle = eg; g.beginPath(); g.arc(x, ey, r * 2.2, 0, 7); g.fill();
    }
    g.restore();
  } else if (id === 51) {   // ぎんがの め（★★★）: うずまく 銀河
    for (const [i, x] of eyesAt.entries()) {
      g.save(); g.shadowColor = '#b388ff'; g.shadowBlur = 12;
      const gr = g.createRadialGradient(x, ey, 0, x, ey, r * 1.25); gr.addColorStop(0, '#fce4ff'); gr.addColorStop(0.3, '#7c4dff'); gr.addColorStop(0.75, '#1a237e'); gr.addColorStop(1, '#0d0221');
      g.fillStyle = gr; g.beginPath(); g.arc(x, ey, r * 1.25, 0, 7); g.fill(); g.restore();
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(234,128,252,.8)'; g.lineWidth = Math.max(1, r * 0.2);
      for (const k of [0, Math.PI]) { g.beginPath(); for (let a = 0; a < 5; a += 0.25) { const rr = r * 0.12 * a * 2, aa = a + k + t * 2.5 * (i ? -1 : 1); g.lineTo(x + Math.cos(aa) * rr, ey + Math.sin(aa) * rr); } g.stroke(); }
      for (let j = 0; j < 4; j++) { g.fillStyle = 'rgba(255,255,255,' + wave(t, 4, j + i * 4).toFixed(2) + ')'; const a = j * 1.6 + t * (i ? -1 : 1); g.beginPath(); g.arc(x + Math.cos(a) * r * 0.85, ey + Math.sin(a) * r * 0.85, r * 0.12, 0, 7); g.fill(); }
      g.restore();
    }
  } else if (id === 52) {   // ほのおの め（★★★）: あおい ほのお が 目から
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const [i, x] of eyesAt.entries()) {
      flame(g, x, ey + r * 0.3, r * 1.0, r * (4.2 + 1.2 * wave(t, 11, i)), Math.sin(t * 8 + i) * r * 0.6, ['rgba(41,121,255,.85)', 'rgba(0,229,255,.9)', 'rgba(255,255,255,1)']);
      const eg = g.createRadialGradient(x, ey, 0, x, ey, r * 1.6); eg.addColorStop(0, 'rgba(255,255,255,1)'); eg.addColorStop(0.4, 'rgba(0,229,255,.8)'); eg.addColorStop(1, 'rgba(0,229,255,0)');
      g.fillStyle = eg; g.beginPath(); g.arc(x, ey, r * 1.6, 0, 7); g.fill();
    }
    g.restore();
  }
}
function bodyMore(g, id, x0, y0, x1, y1, w, h, t) {
  if (id === 53) {   // チェック（★）
    g.fillStyle = 'rgba(183,28,28,.22)'; for (let x = x0; x < x1; x += 18) g.fillRect(x, y0 - 5, 8, h + 10); for (let y = y0; y < y1; y += 18) g.fillRect(x0 - 5, y, w + 10, 8);
    g.fillStyle = 'rgba(255,255,255,.18)'; for (let x = x0 + 12; x < x1; x += 18) g.fillRect(x, y0 - 5, 2, h + 10);
  } else if (id === 54) { let k = 0; for (let y = y0 + 16; y < y1 + 6; y += 36) { for (let x = x0 + (k % 2 ? 30 : 10); x < x1 + 6; x += 40) heart(g, x, y, 8, 'rgba(255,64,129,.7)'); k++; } }   // ハートもよう（★）: 大きく・少なく
  else if (id === 55) {   // ひょうがら（★）: 大きい 斑を ばらばらに 少し
    const n = Math.max(3, Math.min(6, Math.round(w * h / 3500)));
    const cols = Math.ceil(Math.sqrt(n * w / Math.max(1, h))), rows = Math.ceil(n / cols);
    for (let i = 0; i < n; i++) { const x = x0 + w * ((i % cols + 0.5 + (hash(i + 300) - 0.5) * 0.5) / cols), y = y0 + h * ((Math.floor(i / cols) + 0.5 + (hash(i + 330) - 0.5) * 0.5) / rows), rx = 9 + hash(i) * 5, ry = 7 + hash(i + 5) * 4, rot = hash(i + 9) * 3; g.fillStyle = 'rgba(255,213,79,.55)'; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, 7); g.fill(); g.strokeStyle = 'rgba(62,39,35,.8)'; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y, rx + 1, ry + 1, rot, 0.4, 2.6); g.stroke(); g.beginPath(); g.ellipse(x, y, rx + 1, ry + 1, rot, 3.3, 5.4); g.stroke(); }
  } else if (id === 56) {   // うろこ（★）: 大きい うろこ
    g.lineWidth = 2; let k = 0; for (let y = y0 + 8; y < y1 + 14; y += 16) { for (let x = x0 - 12 + (k % 2) * 13; x < x1 + 14; x += 26) { g.strokeStyle = 'rgba(13,16,48,.35)'; g.beginPath(); g.arc(x, y, 13, 0.15, Math.PI - 0.15); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(x, y + 3, 8, 0.4, Math.PI - 0.4); g.stroke(); } k++; }
  } else if (id === 57) {   // ツギハギ（★）
    [[0.1, 0.15, 0.35, 0.3, 'rgba(255,255,255,.25)'], [0.55, 0.45, 0.35, 0.3, 'rgba(13,16,48,.18)'], [0.15, 0.62, 0.3, 0.25, 'rgba(255,241,118,.3)']].forEach(([fx, fy, fw, fh, c]) => {
      const px = x0 + w * fx, py = y0 + h * fy, pw = w * fw, ph = h * fh; g.fillStyle = c; g.fillRect(px, py, pw, ph);
      g.strokeStyle = 'rgba(13,16,48,.7)'; g.lineWidth = 1.5; g.setLineDash([4, 3]); g.strokeRect(px + 2, py + 2, pw - 4, ph - 4); g.setLineDash([]);
    });
    g.strokeStyle = 'rgba(13,16,48,.7)'; g.lineWidth = 1.5; for (let i = 0; i < 5; i++) { const sx = x0 + w * 0.62 + i * 5, sy = y0 + h * 0.2; g.beginPath(); g.moveTo(sx - 2, sy - 3); g.lineTo(sx + 2, sy + 3); g.moveTo(sx + 2, sy - 3); g.lineTo(sx - 2, sy + 3); g.stroke(); }
  } else if (id === 58) {   // めいさい（★）
    const cs = ['rgba(85,107,47,.55)', 'rgba(139,119,77,.55)', 'rgba(46,64,33,.6)'];
    for (let i = 0; i < 16; i++) { g.fillStyle = cs[i % 3]; g.beginPath(); g.ellipse(x0 + w * hash(i), y0 + h * hash(i + 30), 7 + hash(i + 7) * 9, 5 + hash(i + 3) * 6, hash(i + 11) * 3, 0, 7); g.fill(); }
  } else if (id === 59) {   // マグマ（★★）: 光る ひび
    g.fillStyle = 'rgba(40,10,0,.55)'; g.fillRect(x0 - 5, y0 - 5, w + 10, h + 10);
    const pulse = 0.6 + 0.4 * Math.sin(t * 3);
    g.save(); g.globalCompositeOperation = 'lighter'; g.shadowColor = '#ff6d00'; g.shadowBlur = 10; g.lineCap = 'round'; g.lineJoin = 'round';
    for (let c = 0; c < 5; c++) {
      let x = x0 + w * hash(c + 1), y = y0 + h * hash(c + 20);
      g.strokeStyle = 'rgba(255,145,0,' + pulse.toFixed(2) + ')'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 5; s++) { x += (hash(c * 10 + s) - 0.5) * 26; y += 6 + hash(c * 7 + s) * 10; g.lineTo(x, y); }
      g.stroke(); g.strokeStyle = 'rgba(255,241,118,' + (pulse * 0.8).toFixed(2) + ')'; g.lineWidth = 1.2; g.stroke();
    }
    g.restore();
  } else if (id === 60) {   // こおり（★★）: しもの 結晶
    g.fillStyle = lin(g, x0, y0, x1, y1, ['rgba(225,245,254,.8)', 'rgba(129,212,250,.6)', 'rgba(225,245,254,.75)']); g.fillRect(x0 - 5, y0 - 5, w + 10, h + 10);
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.3;
    for (let i = 0; i < 6; i++) { const cx = x0 + w * hash(i + 4), cy = y0 + h * hash(i + 44), R = 4 + hash(i) * 4; g.beginPath(); for (let a = 0; a < 3; a++) { const an = a * Math.PI / 3; g.moveTo(cx - Math.cos(an) * R, cy - Math.sin(an) * R); g.lineTo(cx + Math.cos(an) * R, cy + Math.sin(an) * R); } g.stroke(); }
    shine(g, x0, y0, w, h, t, 0.6, 0.9);
    twinkle(g, x0 + w * 0.7, y0 + h * 0.25, 9, wave(t, 2.6, 1) > 0.75 ? (wave(t, 2.6, 1) - 0.75) * 4 : 0, '#e1f5fe');
  } else if (id === 61) {   // メカ（★★）: パネル・びょう・ランプ
    g.fillStyle = lin(g, x0, y0, x1, y1, ['rgba(207,216,220,.85)', 'rgba(120,144,156,.85)', 'rgba(176,190,197,.85)']); g.fillRect(x0 - 5, y0 - 5, w + 10, h + 10);
    g.strokeStyle = 'rgba(38,50,56,.6)'; g.lineWidth = 1.5; for (let x = x0 + 22; x < x1; x += 26) { g.beginPath(); g.moveTo(x, y0 - 5); g.lineTo(x, y1 + 5); g.stroke(); } for (let y = y0 + 20; y < y1; y += 24) { g.beginPath(); g.moveTo(x0 - 5, y); g.lineTo(x1 + 5, y); g.stroke(); }
    g.fillStyle = 'rgba(55,71,79,.8)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(x0 + w * (0.15 + 0.7 * (i % 2)), y0 + h * (0.15 + 0.35 * (i >> 1)), 2.4, 0, 7); g.fill(); }
    for (let i = 0; i < 3; i++) { const on = (Math.floor(t * 2 + i * 0.7) % 3) === i % 3; g.save(); g.fillStyle = on ? ['#76ff03', '#ff1744', '#ffea00'][i] : 'rgba(0,0,0,.4)'; if (on) { g.shadowColor = g.fillStyle; g.shadowBlur = 8; } g.beginPath(); g.arc(x0 + w * (0.25 + i * 0.12), y0 + h * 0.72, 2.6, 0, 7); g.fill(); g.restore(); }
    shine(g, x0, y0, w, h, t, 0.45, 0.6);
  } else if (id === 62) {   // ドラゴンの うろこ（★★）: エメラルドの つや
    g.fillStyle = lin(g, x0, y0, x1, y1, ['rgba(105,240,174,.75)', 'rgba(0,150,136,.8)', 'rgba(0,77,64,.85)']); g.fillRect(x0 - 5, y0 - 5, w + 10, h + 10);
    g.lineWidth = 2.4; let k = 0; for (let y = y0 + 8; y < y1 + 16; y += 18) { for (let x = x0 - 14 + (k % 2) * 15; x < x1 + 16; x += 30) { g.strokeStyle = 'rgba(0,40,30,.55)'; g.beginPath(); g.arc(x, y, 15, 0.15, Math.PI - 0.15); g.stroke(); g.strokeStyle = 'rgba(200,255,230,.35)'; g.beginPath(); g.arc(x, y + 4, 9, 0.45, Math.PI - 0.45); g.stroke(); } k++; }
    shine(g, x0, y0, w, h, t, 0.5, 0.8);
    twinkle(g, x0 + w * 0.3, y0 + h * 0.35, 9, wave(t, 2.3, 4) > 0.78 ? (wave(t, 2.3, 4) - 0.78) * 4.5 : 0, '#b9f6ca');
  } else if (id === 63) {   // さくら（★★）: 中で はなびらが まう
    g.fillStyle = lin(g, 0, y0, 0, y1, ['rgba(255,205,225,.75)', 'rgba(248,187,208,.65)']); g.fillRect(x0 - 5, y0 - 5, w + 10, h + 10);
    for (let i = 0; i < 9; i++) { const ph = (t * 0.25 + hash(i)) % 1, px = x0 + w * hash(i + 5) + Math.sin(t * 2 + i) * 8, py = y0 - 5 + ph * (h + 10); g.save(); g.translate(px, py); g.rotate(t * 2 + i); g.fillStyle = 'rgba(236,64,122,.75)'; g.beginPath(); g.ellipse(0, 0, 3.5, 2, 0, 0, 7); g.fill(); g.restore(); }
    twinkle(g, x0 + w * 0.65, y0 + h * 0.3, 8, wave(t, 2.5, 2) > 0.75 ? (wave(t, 2.5, 2) - 0.75) * 4 : 0, '#fce4ec');
  } else if (id === 64) {   // うちゅう（★★★）: うごく 星雲・またたく 星・ながれぼし
    g.fillStyle = lin(g, x0, y0, x1, y1, ['#0d0221', '#26104f', '#0b1a3f']); g.fillRect(x0 - 5, y0 - 5, w + 10, h + 10);
    g.save(); g.globalCompositeOperation = 'lighter';
    [['rgba(234,64,251,.45)', 0], ['rgba(0,229,255,.35)', 2], ['rgba(255,64,129,.3)', 4]].forEach(([c, k]) => { const nx = x0 + w * (0.5 + 0.35 * Math.sin(t * 0.4 + k)), ny = y0 + h * (0.5 + 0.3 * Math.cos(t * 0.33 + k)), R = Math.max(w, h) * 0.45; const gr = g.createRadialGradient(nx, ny, 0, nx, ny, R); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x0 - 5, y0 - 5, w + 10, h + 10); });
    for (let i = 0; i < 18; i++) { const a = wave(t, 2 + (i % 4), i); g.fillStyle = 'rgba(255,255,255,' + (0.25 + 0.75 * a).toFixed(2) + ')'; g.beginPath(); g.arc(x0 + w * hash(i + 3), y0 + h * hash(i + 33), 0.7 + a * 1.1, 0, 7); g.fill(); }
    const ph = (t * 0.4) % 1; if (ph < 0.25) { const sx = x0 + w * (1.1 - ph * 5), sy = y0 + h * (0.1 + ph * 2); const gr = g.createLinearGradient(sx, sy, sx + 26, sy - 12); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.strokeStyle = gr; g.lineWidth = 2; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + 26, sy - 12); g.stroke(); }
    g.restore();
    twinkle(g, x0 + w * 0.3, y0 + h * 0.3, 10, wave(t, 3, 1), '#e1bee7');
  } else if (id === 65) {   // ホログラム（★★★）: 色が うつりかわる・走査線・ときどき ずれる
    const hue = (t * 70) % 360;
    g.fillStyle = lin(g, x0, y0, x1, y1, ['hsla(' + hue + ',100%,75%,.75)', 'hsla(' + ((hue + 80) % 360) + ',100%,70%,.75)', 'hsla(' + ((hue + 160) % 360) + ',100%,75%,.75)', 'hsla(' + ((hue + 240) % 360) + ',100%,72%,.75)']);
    g.fillRect(x0 - 5, y0 - 5, w + 10, h + 10);
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,255,255,.14)'; const off = (t * 30) % 5; for (let y = y0 - 5 + off; y < y1 + 5; y += 5) g.fillRect(x0 - 5, y, w + 10, 1.5);
    if ((t * 1.3) % 1 < 0.12) { const gy = y0 + h * hash(Math.floor(t * 1.3)); g.fillStyle = 'hsla(' + ((hue + 180) % 360) + ',100%,80%,.6)'; g.fillRect(x0 - 5 + 4, gy, w + 10, 6); }
    g.restore();
    shine(g, x0, y0, w, h, t, 0.9, 0.9);
    for (let i = 0; i < 3; i++) twinkle(g, x0 + w * (0.2 + i * 0.3), y0 + h * (0.3 + (i % 2) * 0.35), 8, wave(t, 3.2, i) > 0.65 ? (wave(t, 3.2, i) - 0.65) * 2.8 : 0);
  } else if (id === 66) {   // オーロラ（★★★）: ながれる 光の おび
    g.fillStyle = lin(g, 0, y0, 0, y1, ['rgba(5,10,40,.85)', 'rgba(10,30,60,.85)']); g.fillRect(x0 - 5, y0 - 5, w + 10, h + 10);
    for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.6 * wave(t, 2, i)).toFixed(2) + ')'; g.beginPath(); g.arc(x0 + w * hash(i + 60), y0 + h * hash(i + 70), 0.9, 0, 7); g.fill(); }
    g.save(); g.globalCompositeOperation = 'lighter';
    [['rgba(105,240,174,', 0], ['rgba(64,196,255,', 1.7], ['rgba(234,128,252,', 3.3]].forEach(([c, k], i) => {
      const base = y0 + h * (0.28 + i * 0.2), band = h * 0.22;
      const gr = g.createLinearGradient(0, base - band, 0, base + band); gr.addColorStop(0, c + '0)'); gr.addColorStop(0.5, c + '.6)'); gr.addColorStop(1, c + '0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(x0 - 5, base + band);
      for (let x = x0 - 5; x <= x1 + 5; x += 4) g.lineTo(x, base - band + Math.sin(x * 0.07 + t * 1.8 + k) * h * 0.08);
      for (let x = x1 + 5; x >= x0 - 5; x -= 4) g.lineTo(x, base + band + Math.sin(x * 0.07 + t * 1.8 + k + 0.8) * h * 0.08);
      g.fill();
    });
    g.restore();
  }
}
// えふぇくと（v81）
// きんの はね（id 84、おうえんの お礼。2026-10-03 オーナーが 5 案 から D「セラフの 金翼」を えらんだ）
// 参考: 骨 → つけねは 小さい 羽根・外ほど 長い 羽根（3 段）、根もと 濃い金 → 先は 白、上の ふちが 光る、うしろから 光の すじ、上下 2 対
// 羽根 1 枚: 根もと (0,0) → 先 (L,0)。先が とがって すこし そる。色は 根もと 濃い金 → 先 白
function feather(g, L, W, cols, edge) {
  g.beginPath(); g.moveTo(0, -W * 0.5);
  g.bezierCurveTo(L * 0.35, -W * 0.75, L * 0.75, -W * 0.55, L, -W * 0.08);
  g.bezierCurveTo(L * 0.8, W * 0.35, L * 0.35, W * 0.6, 0, W * 0.5); g.closePath();
  const gr = g.createLinearGradient(0, 0, L, 0); cols.forEach((c, i) => gr.addColorStop(i / (cols.length - 1), c)); g.fillStyle = gr; g.fill();
  if (edge) { g.strokeStyle = edge; g.lineWidth = 1; g.stroke(); }
  g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(L * 0.05, -W * 0.05); g.quadraticCurveTo(L * 0.5, -W * 0.18, L * 0.92, -W * 0.08); g.stroke();
}
// 翼 1 枚（右むき・肩が 原点）。S = 大きさ、up = 立ちあがり（ラジアン）
// 1 枚ずつ 羽根を 描くと 重い（1 回 約 1ms・羽根 120 枚）ので、大きさごとに 1 回だけ 絵に して 使い回す。はばたきは 絵を まわす だけ
const WING_CACHE = new Map();
function wing(g, S, up, flap, t, dim) {
  const s = Math.max(16, Math.round(S / 16) * 16), key = s + (dim ? "d" : ""), pad = s * 1.85, sc = 1.5;   // 大きさは 16px きざみ（戦いで かたむいても 作りなおさない）・1.5 倍で 描いて ぼやけない ように
  let c = WING_CACHE.get(key);
  if (!c && typeof document !== 'undefined') {
    c = document.createElement('canvas'); c.width = c.height = Math.ceil(pad * 2 * sc);
    const cg = c.getContext('2d'); cg.scale(sc, sc); cg.translate(pad, pad); wingPaint(cg, s, 0, 0, 0, dim);
    if (WING_CACHE.size > 40) WING_CACHE.clear(); WING_CACHE.set(key, c);
  }
  if (!c) return wingPaint(g, S, up, flap, t, dim);
  g.save(); g.rotate(-up + flap); g.scale(S / s / sc, S / s / sc); g.drawImage(c, -pad * sc, -pad * sc); g.restore();
}
function wingPaint(g, S, up, flap, t, dim) {
  g.save(); g.rotate(-up + flap);
  const E = [S * 0.32, -S * 0.18], Wr = [S * 0.72, -S * 0.02];   // ひじ・手首（立ちあがりは 外の rotate で）
  const P = dim ? ['#6d4500', '#b8860b', '#f6c344', '#fff3c4'] : ['#8a5a00', '#d9a400', '#ffd54f', '#fffdf0'];
  const Sd = dim ? ['#5a3a00', '#9c7200', '#e0ad2e', '#fbe7a6'] : ['#704800', '#c18f00', '#f9cb3c', '#fff6d8'];
  // 長い 羽根（初列）: 手首から 扇に。外ほど 長い
  for (let i = 0; i < 8; i++) {
    const k = i / 7, a = -0.55 + k * 1.05 + Math.sin(t * 2 + i) * 0.015, L = S * (0.95 - k * 0.38);
    g.save(); g.translate(Wr[0] - k * S * 0.12, Wr[1] + k * S * 0.05); g.rotate(a); feather(g, L, S * 0.13, P, 'rgba(90,55,0,.55)'); g.restore();
  }
  // 中くらいの 羽根（次列）: 前腕に そって 下・外へ
  for (let i = 0; i < 9; i++) {
    const k = i / 8, x = E[0] + (Wr[0] - E[0]) * (1 - k) * 0.85, y = E[1] + (Wr[1] - E[1]) * (1 - k) * 0.85;
    g.save(); g.translate(x - k * S * 0.2, y + k * S * 0.05); g.rotate(0.55 + k * 0.55); feather(g, S * (0.5 - k * 0.12), S * 0.12, Sd, 'rgba(80,50,0,.5)'); g.restore();
  }
  // つけねの 小さい 羽根（2 列、うろこ）
  for (let row = 0; row < 2; row++) for (let i = 0; i < 7; i++) {
    const k = i / 6, x = k * Wr[0] * 0.9, y = E[1] * Math.sin(k * Math.PI) * 0.9 + row * S * 0.06;
    g.save(); g.translate(x, y + S * 0.02); g.rotate(0.9 + row * 0.15); feather(g, S * (0.2 + row * 0.06), S * 0.09, ['#a87400', '#f2c230', '#fff1b8'], null); g.restore();
  }
  // 上の ふち（骨）: 白金の 光
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = '#7a5200'; g.lineWidth = S * 0.05; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(E[0], E[1] - S * 0.04, Wr[0], Wr[1]); g.stroke();
  g.strokeStyle = '#fff3c4'; g.lineWidth = S * 0.025; g.stroke();
  g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,236,160,' + (0.18 + 0.15 * wave(t, 3, 1)).toFixed(2) + ')'; g.lineWidth = S * 0.12; g.stroke(); g.lineWidth = S * 0.06; g.stroke(); g.restore();   // ぼかし（shadowBlur）は 重いので 太い 線 2 本で
  g.restore();
}
function rays(g, x, y, S, t) {
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 12; i++) { const a = -Math.PI / 2 + (i - 5.5) * 0.24 + Math.sin(t * 0.5) * 0.03, L = S * (1.5 + 0.3 * wave(t, 1.5, i)), wd = 0.05;
    const gr = g.createLinearGradient(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L); gr.addColorStop(0, 'rgba(255,240,190,.35)'); gr.addColorStop(1, 'rgba(255,215,64,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a - wd) * L, y + Math.sin(a - wd) * L); g.lineTo(x + Math.cos(a + wd) * L, y + Math.sin(a + wd) * L); g.closePath(); g.fill(); }
  const gl = g.createRadialGradient(x, y, 0, x, y, S * 0.9); gl.addColorStop(0, 'rgba(255,248,220,.5)'); gl.addColorStop(1, 'rgba(255,215,64,0)'); g.fillStyle = gl; g.beginPath(); g.arc(x, y, S * 0.9, 0, 7); g.fill();
  g.restore();
}
function goldWingsDraw(g, info, t, pairs) {
  const { x0, x1, y0, y1 } = info, w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, ay = y0 + h * 0.3, S = Math.max(h * 1.2, w * 0.95), R = Math.random;
  rays(g, cx, ay, S, t);
  for (const s of [-1, 1]) {
    const ax = s < 0 ? x0 + w * 0.3 : x1 - w * 0.3;
    g.save(); g.translate(ax, ay); g.scale(s, 1);
    if (pairs === 2) wing(g, S * 0.62, -0.35, Math.sin(t * 2.4 + 1.2) * 0.08, t, true);   // 下の 小さい 翼（先に 描いて うしろへ）
    wing(g, S, pairs === 2 ? 0.75 : 0.55, Math.sin(t * 2.4) * 0.1, t, false);
    g.restore();
  }
  if (info.spawn) {
    if (R() < 0.25) info.spawn(cx + (R() - 0.5) * w * 3, y0 - R() * h * 0.6, { vx: (R() - 0.5) * 20, vy: -15 - R() * 25, g: -0.02, c: R() < 0.5 ? '#fff8e1' : '#ffe082', life: 60, k: 'ember' });
    if (R() < 0.06) info.spawn(cx + (R() - 0.5) * w * 2.8, y0, { vx: (R() - 0.5) * 30, vy: 15 + R() * 20, g: 0.01, c: '#ffe9a8', life: 100, k: 'feather', rot: R() * 6, spin: (R() - 0.5) * 0.12 });
  }
}
function goldWings(g, info, t) { goldWingsDraw(g, info, t, 2); }
// ---------- ランタンおばけ（id 86、ハロウィンの 配布。2026-10-06 オーナーが 5 案から C）----------
// おばけ 1 ぴき: 原点が からだの まんなか、S = 高さの めやす、dir = 向き（1 右）。うしろの 手に かぼちゃの ランタン
function ghostPaint(g, S, t, dir) {
  const top = -S * 0.5, hw = S * 0.42, hem = S * 0.42, line = 'rgba(70,60,120,.55)';
  g.save(); g.scale(dir, 1);
  // ふんわり 光る まわり
  g.save(); g.globalCompositeOperation = 'lighter';
  const gl = g.createRadialGradient(0, 0, S * 0.2, 0, 0, S * 0.95); gl.addColorStop(0, 'rgba(220,230,255,.35)'); gl.addColorStop(1, 'rgba(220,230,255,0)'); g.fillStyle = gl; g.beginPath(); g.arc(0, 0, S * 0.95, 0, 7); g.fill();
  g.restore();
  // うで（ちいさい だえん）: ふる
  const arm = sx => { g.save(); g.translate(sx * hw * 0.95, S * 0.02); g.rotate(sx * (-0.3 + Math.sin(t * 5 + sx) * 0.25)); g.beginPath(); g.ellipse(sx * S * 0.1, 0, S * 0.14, S * 0.08, 0, 0, 7); g.fillStyle = '#e8ecfb'; g.fill(); g.strokeStyle = line; g.lineWidth = S * 0.035; g.stroke(); g.restore(); };
  arm(1);
  // からだ: まるい あたま・すその なみ 3 つ（ゆれる）
  g.beginPath(); g.moveTo(-hw, hem * 0.2);
  g.bezierCurveTo(-hw, top - S * 0.08, hw, top - S * 0.08, hw, hem * 0.2);
  g.lineTo(hw, hem);
  for (let i = 0, wv = S * 0.09; i < 3; i++) { const xa = hw - (i + 0.5) / 3 * hw * 2, xb = hw - (i + 1) / 3 * hw * 2; g.quadraticCurveTo(xa, hem + wv * 1.6 + Math.sin(t * 4 + i * 1.7) * wv, xb, hem); }
  g.closePath();
  g.globalAlpha = 0.95; g.fillStyle = lin(g, 0, top, 0, hem + S * 0.2, ['#ffffff', '#e3e7f8']); g.fill();
  g.globalAlpha = 1; g.strokeStyle = line; g.lineWidth = S * 0.04; g.stroke();
  // かお（ときどき まばたき）
  const blink = (t % 3.7) < 0.13 ? 0.15 : 1, ex = S * 0.06, ey = -S * 0.1;
  g.fillStyle = '#2a2440';
  for (const k of [-1, 1]) { g.beginPath(); g.ellipse(ex + k * S * 0.15, ey, S * 0.055, S * 0.085 * blink, 0, 0, 7); g.fill(); }
  g.fillStyle = '#fff'; for (const k of [-1, 1]) { g.beginPath(); g.arc(ex + k * S * 0.15 + S * 0.02, ey - S * 0.035, S * 0.018, 0, 7); g.fill(); }
  g.fillStyle = 'rgba(255,128,171,.55)'; for (const k of [-1, 1]) { g.beginPath(); g.ellipse(ex + k * S * 0.25, ey + S * 0.1, S * 0.06, S * 0.035, 0, 0, 7); g.fill(); }
  g.fillStyle = '#2a2440'; g.beginPath(); g.ellipse(ex, ey + S * 0.13, S * 0.035, S * 0.045, 0, 0, 7); g.fill();
  // かぼちゃの ランタン（うしろの 手に ぶらさげる。モンスターの からだに かくれない ように）
  const pr = S * 0.2, py = S * 0.38;
  g.save(); g.translate(-hw * 1.05, S * 0.05); g.rotate(Math.sin(t * 2.2) * 0.25);
  g.strokeStyle = '#4e342e'; g.lineWidth = S * 0.03; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, S * 0.22); g.stroke();
  g.save(); g.globalCompositeOperation = 'lighter'; const lg = g.createRadialGradient(0, py, pr * 0.3, 0, py, pr * 3.2); lg.addColorStop(0, 'rgba(255,171,64,' + (0.45 + 0.15 * wave(t, 6, 2)).toFixed(2) + ')'); lg.addColorStop(1, 'rgba(255,145,0,0)'); g.fillStyle = lg; g.beginPath(); g.arc(0, py, pr * 3.2, 0, 7); g.fill(); g.restore();
  g.fillStyle = lin(g, 0, py - pr, 0, py + pr, ['#ffa726', '#ef6c00']); g.strokeStyle = '#8d3c00'; g.lineWidth = S * 0.025;
  g.beginPath(); g.ellipse(0, py, pr * 1.2, pr, 0, 0, 7); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(0, py - pr); g.quadraticCurveTo(-pr * 0.45, py, 0, py + pr); g.moveTo(0, py - pr); g.quadraticCurveTo(pr * 0.45, py, 0, py + pr); g.stroke();
  g.fillStyle = '#5d4037'; g.fillRect(-pr * 0.1, py - pr * 1.3, pr * 0.2, pr * 0.35);
  g.fillStyle = '#fff59d';
  for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * pr * 0.45, py - pr * 0.35); g.lineTo(k * pr * 0.2, py - pr * 0.05); g.lineTo(k * pr * 0.7, py - pr * 0.05); g.closePath(); g.fill(); }
  g.beginPath(); g.moveTo(-pr * 0.6, py + pr * 0.25); g.quadraticCurveTo(0, py + pr * 0.75, pr * 0.6, py + pr * 0.25); g.quadraticCurveTo(0, py + pr * 0.45, -pr * 0.6, py + pr * 0.25); g.fill();
  g.restore();
  arm(-1);
  g.restore();
}
// モンスターの うしろ・上を ふわふわ ついてくる
function ghostFx(g, info, t) {
  const { x0, x1, y0, y1 } = info, w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, f = info.facing || 1;
  const S = Math.max(40, Math.min(95, Math.max(w, h) * 0.8));
  const gx = cx - f * (w * 0.5 + S * 0.35) + Math.sin(t * 1.1) * S * 0.15, gy = y0 + S * 0.1 + Math.sin(t * 2.2) * S * 0.12;
  g.save(); g.translate(gx, gy); g.rotate(Math.sin(t * 1.6) * 0.12); ghostPaint(g, S, t, f); g.restore();
}
// ---------- おいわいふうせん（id 87、1 万人の おいわいの 配布。2026-10-06 オーナーが 4 案から B）----------
// 金の 文字ふうせん: 字の 形に ふくらんだ アルミの ふうせん。x, y = 字の まんなか
function foilText(g, txt, x, y, size, rot, t, cols) {
  const c = cols || ['#fff6c8', '#ffd54f', '#e0a800', '#a86b00'];
  g.save(); g.translate(x, y); g.rotate(rot);
  g.font = '900 ' + size + 'px "M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.strokeStyle = 'rgba(80,45,0,.85)'; g.lineWidth = size * 0.3; g.strokeText(txt, 0, 0);
  const gr = g.createLinearGradient(-size * 0.4, -size * 0.5, size * 0.4, size * 0.5); gr.addColorStop(0, c[0]); gr.addColorStop(0.35, c[1]); gr.addColorStop(0.75, c[2]); gr.addColorStop(1, c[3]);
  g.strokeStyle = gr; g.lineWidth = size * 0.2; g.strokeText(txt, 0, 0);
  g.fillStyle = gr; g.fillText(txt, 0, 0);
  // つや: 左上に 白い すじ（ゆっくり 光る）
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35 + 0.25 * wave(t, 2, size);
  g.strokeStyle = '#fff'; g.lineWidth = size * 0.05; g.beginPath(); g.ellipse(-size * 0.12, -size * 0.2, size * 0.12, size * 0.05, -0.6, 0, 7); g.stroke();
  g.restore();
  g.restore();
}
// まるい ふうせん
function roundBalloon(g, x, y, r, rot, col) {
  g.save(); g.translate(x, y); g.rotate(rot);
  const gr = g.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.15); gr.addColorStop(0, col[0]); gr.addColorStop(0.5, col[1]); gr.addColorStop(1, col[2]);
  g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, r * 0.88, r, 0, 0, 7); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = r * 0.06; g.stroke();
  g.fillStyle = col[2]; g.beginPath(); g.moveTo(-r * 0.12, r * 1.08); g.lineTo(r * 0.12, r * 1.08); g.lineTo(0, r * 0.95); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-r * 0.35, -r * 0.45, r * 0.16, r * 0.26, -0.5, 0, 7); g.fill();
  g.restore();
}
// ひも: (ax, ay) → (bx, by)、すこし たるませて ゆらす
function balloonString(g, ax, ay, bx, by, t, i) {
  const mx = (ax + bx) / 2 + Math.sin(t * 2 + i) * 6, my = (ay + by) / 2 + 6;
  g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(mx, my, bx, by); g.stroke();
}
// 金の「1」「万」と 赤・青の まる ふうせん。ひもは からだの うしろ・上に むすぶ
function balloonFx(g, info, t) {
  const { x0, x1, y0, y1 } = info, w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, f = info.facing || 1;
  const S = Math.max(40, Math.min(95, Math.max(w, h) * 0.8)), sz = S * 0.8, r = S * 0.32;
  const ax = cx - f * w * 0.3, ay = y0 + h * 0.15;   // ひもを むすぶ ところ
  const bx = cx - f * (w * 0.35 + S * 0.25), by = y0 - S * 0.95;   // ふうせんの まんなか
  const sway = i => Math.sin(t * 1.4 + i * 1.3) * 0.12, en = typeof window !== 'undefined' && window.LANG === 'en';   // 英語は「10」「K」
  const list = [   // [x, y, ひもの 先までの 下, 絵]
    [bx - S * 1.0, by + S * 0.15 + Math.sin(t * 1.6 + 2) * 4, r * 1.1, (x, y, i) => roundBalloon(g, x, y, r, sway(i), ['#ffcdd2', '#e53935', '#8e0000'])],
    [bx + S * 1.0, by + S * 0.1 + Math.sin(t * 1.6 + 3) * 4, r * 1.1, (x, y, i) => roundBalloon(g, x, y, r, sway(i), ['#bbdefb', '#1e88e5', '#0d3c7a'])],
    [bx - sz * 0.5, by - S * 0.1 + Math.sin(t * 1.8) * 4, sz * 0.5, (x, y, i) => foilText(g, en ? '10' : '1', x - (en ? sz * 0.08 : 0), y, en ? sz * 0.8 : sz, sway(i), t)],
    [bx + sz * 0.5, by - S * 0.2 + Math.sin(t * 1.8 + 1) * 4, sz * 0.5, (x, y, i) => foilText(g, en ? 'K' : '万', x, y, sz, sway(i), t)],
  ];
  list.forEach(([x, y, dy], i) => balloonString(g, ax, ay, x, y + dy, t, i));
  list.forEach(([x, y, , draw], i) => draw(x, y, i));
}
// ---------- 2026-10 に ふえた ガチャの かざり（88〜127、場所ごとに 10 種）----------
// あたま（88〜97）: x, y = 体の てっぺんの まんなか、s = はば。戻り値 = 上に 積んだ 高さ
function headNew(g, id, x, y, s, t) {
  const lw = Math.max(2, s * 0.07);
  if (id === 88) {   // キャップ（★）: まえに つば
    g.fillStyle = lin(g, x, y - s * 0.45, x, y, ['#ef5350', '#c62828']);
    g.beginPath(); g.moveTo(x - s * 0.42, y); g.quadraticCurveTo(x - s * 0.44, y - s * 0.46, x, y - s * 0.46); g.quadraticCurveTo(x + s * 0.44, y - s * 0.46, x + s * 0.42, y); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#b71c1c'; g.beginPath(); g.moveTo(x + s * 0.3, y - s * 0.02); g.quadraticCurveTo(x + s * 0.62, y - s * 0.1, x + s * 0.78, y + s * 0.02); g.quadraticCurveTo(x + s * 0.6, y + s * 0.07, x + s * 0.3, y + s * 0.04); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = Math.max(1, s * 0.035); g.beginPath(); g.moveTo(x, y - s * 0.45); g.quadraticCurveTo(x + s * 0.12, y - s * 0.22, x + s * 0.1, y - s * 0.02); g.stroke();
    g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = lw * 0.6; g.beginPath(); g.arc(x, y - s * 0.46, s * 0.05, 0, 7); g.fill(); g.stroke();
    return s * 0.5;
  }
  if (id === 89) {   // むぎわらぼう（★）: ひろい つば・あかい リボン
    g.fillStyle = lin(g, x - s * 0.7, y, x + s * 0.7, y, ['#e9c46a', '#f6dd9c', '#d4a84b']);
    g.beginPath(); g.ellipse(x, y - s * 0.02, s * 0.74, s * 0.15, 0, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x - s * 0.36, y - s * 0.04); g.quadraticCurveTo(x - s * 0.38, y - s * 0.42, x, y - s * 0.43); g.quadraticCurveTo(x + s * 0.38, y - s * 0.42, x + s * 0.36, y - s * 0.04); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#d32f2f'; g.fillRect(x - s * 0.36, y - s * 0.16, s * 0.72, s * 0.1);
    g.strokeStyle = 'rgba(140,100,30,.55)'; g.lineWidth = Math.max(1, s * 0.025); g.beginPath(); g.ellipse(x, y - s * 0.02, s * 0.56, s * 0.1, 0, 0.2, Math.PI - 0.2); g.stroke();
    return s * 0.45;
  }
  if (id === 90) {   // ニットぼう（★）: しましま・ぽんぽんが ゆれる
    const top = y - s * 0.55;
    g.fillStyle = '#42a5f5'; g.beginPath(); g.moveTo(x - s * 0.4, y - s * 0.08); g.quadraticCurveTo(x - s * 0.42, top, x, top); g.quadraticCurveTo(x + s * 0.42, top, x + s * 0.4, y - s * 0.08); g.closePath(); g.fill(); g.stroke();
    g.save(); g.clip(); g.fillStyle = '#fff'; g.fillRect(x - s * 0.5, y - s * 0.33, s, s * 0.08); g.restore();
    g.fillStyle = '#1e88e5'; g.beginPath(); g.rect(x - s * 0.44, y - s * 0.16, s * 0.88, s * 0.16); g.fill(); g.stroke();
    const px = x + Math.sin(t * 3) * s * 0.04; g.strokeStyle = INK; g.lineWidth = lw;
    g.fillStyle = '#fafafa'; g.beginPath(); g.arc(px, top - s * 0.06, s * 0.11, 0, 7); g.fill(); g.stroke();
    return s * 0.72;
  }
  if (id === 91) {   // ちょんまげ（★）: くろい まげが 上に のる
    g.fillStyle = '#212121'; g.beginPath(); g.ellipse(x, y, s * 0.4, s * 0.14, 0, Math.PI, 0); g.fill(); g.stroke();
    g.save(); g.translate(x, y - s * 0.2); g.rotate(-0.1 + Math.sin(t * 2) * 0.04);
    g.beginPath(); g.moveTo(-s * 0.3, s * 0.08); g.quadraticCurveTo(-s * 0.1, -s * 0.12, s * 0.4, -s * 0.06); g.quadraticCurveTo(s * 0.46, s * 0.04, s * 0.38, s * 0.1); g.quadraticCurveTo(0, s * 0.1, -s * 0.3, s * 0.18); g.closePath(); g.fillStyle = '#212121'; g.fill(); g.stroke();
    g.fillStyle = '#fafafa'; g.strokeStyle = INK; g.lineWidth = Math.max(1, lw * 0.5); g.beginPath(); g.rect(-s * 0.12, -s * 0.07, s * 0.09, s * 0.19); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = Math.max(1, s * 0.03); g.beginPath(); g.moveTo(s * 0.02, -s * 0.04); g.quadraticCurveTo(s * 0.18, -s * 0.08, s * 0.34, -s * 0.05); g.stroke();
    g.restore();
    return s * 0.36;
  }
  if (id === 92) {   // コックぼう（★★）: ふくらんだ 上・ときどき きらっ
    g.fillStyle = '#fafafa'; g.beginPath(); g.rect(x - s * 0.28, y - s * 0.28, s * 0.56, s * 0.28); g.fill(); g.stroke();
    g.fillStyle = lin(g, x, y - s * 1.0, x, y - s * 0.3, ['#ffffff', '#e8eaf6']);
    g.beginPath(); g.arc(x - s * 0.22, y - s * 0.46, s * 0.2, Math.PI * 0.5, Math.PI * 1.6); g.arc(x, y - s * 0.66, s * 0.24, Math.PI * 1.05, Math.PI * 1.95); g.arc(x + s * 0.22, y - s * 0.46, s * 0.2, Math.PI * 1.4, Math.PI * 0.5); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(120,130,170,.5)'; g.lineWidth = Math.max(1, s * 0.03); for (const k of [-0.12, 0.12]) { g.beginPath(); g.moveTo(x + k * s, y - s * 0.27); g.lineTo(x + k * s, y - s * 0.03); g.stroke(); }
    twinkle(g, x + s * 0.18, y - s * 0.72, s * 0.16, wave(t, 2.4, 3) > 0.8 ? (wave(t, 2.4, 3) - 0.8) * 5 : 0);
    return s * 0.92;
  }
  if (id === 93) {   // かいぞくぼう（★★）: 金の ふち・ほねの マーク
    g.fillStyle = lin(g, x, y - s * 0.6, x, y, ['#3a3a3a', '#111']);
    g.beginPath(); g.moveTo(x - s * 0.62, y - s * 0.12); g.quadraticCurveTo(x - s * 0.5, y - s * 0.62, x, y - s * 0.6); g.quadraticCurveTo(x + s * 0.5, y - s * 0.62, x + s * 0.62, y - s * 0.12); g.quadraticCurveTo(x, y + s * 0.08, x - s * 0.62, y - s * 0.12); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = '#ffca28'; g.lineWidth = Math.max(1.5, s * 0.04); g.beginPath(); g.moveTo(x - s * 0.56, y - s * 0.14); g.quadraticCurveTo(x, y + s * 0.02, x + s * 0.56, y - s * 0.14); g.stroke();
    const sy = y - s * 0.34; g.fillStyle = '#fafafa'; g.beginPath(); g.arc(x, sy, s * 0.1, 0, 7); g.fill(); g.fillRect(x - s * 0.06, sy + s * 0.06, s * 0.12, s * 0.06);
    g.fillStyle = '#111'; for (const k of [-1, 1]) { g.beginPath(); g.arc(x + k * s * 0.04, sy - s * 0.01, s * 0.025, 0, 7); g.fill(); }
    g.strokeStyle = '#fafafa'; g.lineWidth = Math.max(1.5, s * 0.035); g.beginPath(); g.moveTo(x - s * 0.17, sy - s * 0.12); g.lineTo(x + s * 0.17, sy + s * 0.14); g.moveTo(x + s * 0.17, sy - s * 0.12); g.lineTo(x - s * 0.17, sy + s * 0.14); g.stroke();
    twinkle(g, x - s * 0.4, y - s * 0.16, s * 0.14, wave(t, 2.2, 2) > 0.82 ? (wave(t, 2.2, 2) - 0.82) * 5.5 : 0, '#fff8e1');
    return s * 0.62;
  }
  if (id === 94) {   // ティアラ（★★）: ぎんの かざり・ピンクの 石が 光る
    g.fillStyle = lin(g, x - s * 0.5, y, x + s * 0.5, y - s * 0.5, ['#b0bec5', '#ffffff', '#90a4ae']);
    g.beginPath(); g.moveTo(x - s * 0.5, y); g.lineTo(x - s * 0.44, y - s * 0.22); g.lineTo(x - s * 0.24, y - s * 0.14); g.lineTo(x, y - s * 0.52); g.lineTo(x + s * 0.24, y - s * 0.14); g.lineTo(x + s * 0.44, y - s * 0.22); g.lineTo(x + s * 0.5, y); g.closePath(); g.fill(); g.stroke();
    const gl = 0.5 + 0.5 * wave(t, 3, 1);
    g.save(); g.shadowColor = '#ff4081'; g.shadowBlur = 6 + 8 * gl; g.fillStyle = '#ff4f9a'; g.beginPath(); g.moveTo(x, y - s * 0.4); g.lineTo(x + s * 0.1, y - s * 0.25); g.lineTo(x, y - s * 0.1); g.lineTo(x - s * 0.1, y - s * 0.25); g.closePath(); g.fill(); g.lineWidth = Math.max(1, lw * 0.5); g.stroke(); g.restore();
    g.fillStyle = '#4dd0e1'; g.lineWidth = Math.max(1, lw * 0.4); for (const k of [-1, 1]) { g.beginPath(); g.arc(x + k * s * 0.36, y - s * 0.09, s * 0.05, 0, 7); g.fill(); g.stroke(); }
    twinkle(g, x + s * 0.04, y - s * 0.32, s * 0.22, gl > 0.75 ? (gl - 0.75) * 4 : 0, '#fce4ec');
    return s * 0.52;
  }
  if (id === 95) {   // きつねの おめん（★★）: よこに ずらして かぶる
    g.save(); g.translate(x + s * 0.28, y - s * 0.22); g.rotate(0.35 + Math.sin(t * 1.5) * 0.04);
    const fw = s * 0.3;
    g.fillStyle = '#fafafa';
    g.beginPath(); g.moveTo(-fw, -fw * 0.3); g.lineTo(-fw * 0.85, -fw * 1.25); g.lineTo(-fw * 0.35, -fw * 0.6); g.lineTo(fw * 0.35, -fw * 0.6); g.lineTo(fw * 0.85, -fw * 1.25); g.lineTo(fw, -fw * 0.3); g.quadraticCurveTo(fw * 0.9, fw * 0.6, 0, fw * 1.05); g.quadraticCurveTo(-fw * 0.9, fw * 0.6, -fw, -fw * 0.3); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#e53935'; for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * fw * 0.8, -fw * 1.0); g.lineTo(k * fw * 0.5, -fw * 0.62); g.lineTo(k * fw * 0.78, -fw * 0.55); g.closePath(); g.fill(); }
    g.strokeStyle = '#e53935'; g.lineWidth = Math.max(1.5, s * 0.035);
    for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * fw * 0.65, -fw * 0.05); g.quadraticCurveTo(k * fw * 0.4, -fw * 0.25, k * fw * 0.15, -fw * 0.08); g.stroke(); }
    g.fillStyle = INK; g.beginPath(); g.arc(0, fw * 0.75, fw * 0.1, 0, 7); g.fill();
    g.strokeStyle = '#e53935'; g.beginPath(); g.moveTo(-fw * 0.15, -fw * 0.35); g.lineTo(0, -fw * 0.2); g.lineTo(fw * 0.15, -fw * 0.35); g.stroke();
    g.restore();
    g.strokeStyle = '#c62828'; g.lineWidth = Math.max(1.5, s * 0.03); g.beginPath(); g.moveTo(x - s * 0.4, y - s * 0.06); g.quadraticCurveTo(x - s * 0.1, y - s * 0.14, x + s * 0.12, y - s * 0.18); g.stroke();
    return s * 0.55;
  }
  if (id === 96) {   // まわる わくせい（★★★）: 頭の 上に うかぶ わくせい・まわる 月・きらきら
    const cy = y - s * 0.5 + Math.sin(t * 2) * s * 0.05, R = s * 0.22;
    g.save(); g.globalCompositeOperation = 'lighter'; const gw = g.createRadialGradient(x, cy, R * 0.5, x, cy, R * 2.4); gw.addColorStop(0, 'rgba(255,183,77,.35)'); gw.addColorStop(1, 'rgba(255,183,77,0)'); g.fillStyle = gw; g.beginPath(); g.arc(x, cy, R * 2.4, 0, 7); g.fill(); g.restore();
    const ring = (back) => { g.save(); g.strokeStyle = 'rgba(255,224,178,.95)'; g.lineWidth = Math.max(2, s * 0.05); g.beginPath(); g.ellipse(x, cy, R * 1.75, R * 0.45, -0.3, back ? Math.PI : 0, back ? Math.PI * 2 : Math.PI); g.stroke(); g.restore(); };
    ring(true);
    const gp = g.createRadialGradient(x - R * 0.4, cy - R * 0.4, R * 0.1, x, cy, R); gp.addColorStop(0, '#ffe0b2'); gp.addColorStop(0.55, '#ff8a65'); gp.addColorStop(1, '#8e24aa');
    g.fillStyle = gp; g.beginPath(); g.arc(x, cy, R, 0, 7); g.fill(); g.lineWidth = Math.max(1.5, s * 0.04); g.stroke();
    g.save(); g.beginPath(); g.arc(x, cy, R, 0, 7); g.clip(); g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = R * 0.18; g.beginPath(); g.moveTo(x - R, cy - R * 0.25); g.quadraticCurveTo(x, cy - R * 0.05, x + R, cy - R * 0.35); g.stroke(); g.restore();
    ring(false);
    const a = t * 1.8, mx = x + Math.cos(a) * R * 2.1, my = cy + Math.sin(a) * R * 0.6;
    g.fillStyle = '#eceff1'; g.lineWidth = Math.max(1, s * 0.03); g.beginPath(); g.arc(mx, my, R * 0.28, 0, 7); g.fill(); g.stroke();
    for (let i = 0; i < 3; i++) twinkle(g, x + Math.cos(i * 2.1 + 0.5) * R * 2.2, cy + Math.sin(i * 2.1 + 0.5) * R * 1.3, s * 0.1, wave(t, 3, i) > 0.7 ? (wave(t, 3, i) - 0.7) * 3.3 : 0);
    return s * 0.85;
  }
  if (id === 97) {   // まほうじんの わ（★★★）: 頭の 上で 光る 魔法陣が まわる・光が たちのぼる
    const cy = y - s * 0.32 + Math.sin(t * 2.2) * s * 0.03, rx = s * 0.5, ry = s * 0.14, a0 = t * 0.9;
    g.save(); g.globalCompositeOperation = 'lighter';
    const beam = g.createLinearGradient(0, cy, 0, cy - s * 0.7); beam.addColorStop(0, 'rgba(124,77,255,.35)'); beam.addColorStop(1, 'rgba(124,77,255,0)');
    g.fillStyle = beam; g.beginPath(); g.moveTo(x - rx, cy); g.lineTo(x - rx * 0.7, cy - s * 0.7); g.lineTo(x + rx * 0.7, cy - s * 0.7); g.lineTo(x + rx, cy); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(179,136,255,.95)'; g.lineWidth = Math.max(1.5, s * 0.04); g.shadowColor = '#b388ff'; g.shadowBlur = 10;
    g.beginPath(); g.ellipse(x, cy, rx, ry, 0, 0, 7); g.stroke();
    g.lineWidth = Math.max(1, s * 0.025); g.beginPath(); g.ellipse(x, cy, rx * 0.8, ry * 0.8, 0, 0, 7); g.stroke();
    g.beginPath(); for (let i = 0; i <= 6; i++) { const a = a0 + i * Math.PI * 2 / 6 * 2; g.lineTo(x + Math.cos(a) * rx * 0.8, cy + Math.sin(a) * ry * 0.8); } g.stroke();   // 六つの とがり
    g.beginPath(); for (let i = 0; i <= 6; i++) { const a = a0 + Math.PI / 6 + i * Math.PI * 2 / 6 * 2; g.lineTo(x + Math.cos(a) * rx * 0.8, cy + Math.sin(a) * ry * 0.8); } g.stroke();
    g.shadowBlur = 0;
    for (let i = 0; i < 4; i++) { const ph = (t * 0.5 + i / 4) % 1, px = x + Math.cos(i * 1.7 + 1) * rx * 0.6; g.globalAlpha = Math.sin(ph * Math.PI) * 0.9; g.fillStyle = '#e1bee7'; g.beginPath(); g.arc(px, cy - ph * s * 0.6, s * 0.03, 0, 7); g.fill(); }
    g.restore();
    return s * 0.5;
  }
  return s * 0.5;
}
// かお（98〜107）: ex, ey = 目の まんなか（目は ex ± 1.4r）、口は (ex + facing × 0.4r, ey + 2.2r)
function faceNew(g, id, ex, ey, r, facing, t, eyesAt) {
  const mx = ex + facing * r * 0.4, my = ey + r * 2.2, back = eyesAt[facing > 0 ? 0 : 1], front = eyesAt[facing > 0 ? 1 : 0];
  const eyeWhite = (x, k) => { g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = Math.max(1, r * 0.2); g.beginPath(); g.arc(x, ey, r * (k || 1.12), 0, 7); g.fill(); g.stroke(); };
  if (id === 98) {   // マスク（★）
    const w = r * 2.5, h = r * 1.5, cx = mx, cy = my + r * 0.45;
    g.strokeStyle = 'rgba(200,210,230,.95)'; g.lineWidth = Math.max(1, r * 0.15); g.beginPath(); g.moveTo(cx - w, cy - h * 0.6); g.lineTo(cx - w * 1.6, ey - r * 0.2); g.moveTo(cx + w, cy - h * 0.6); g.lineTo(cx + w * 1.6, ey - r * 0.2); g.stroke();
    g.fillStyle = lin(g, 0, cy - h, 0, cy + h, ['#ffffff', '#e3eaf5']); g.strokeStyle = INK; g.lineWidth = Math.max(1, r * 0.18);
    g.beginPath(); g.moveTo(cx - w, cy - h * 0.75); g.quadraticCurveTo(cx, cy - h * 1.2, cx + w, cy - h * 0.75); g.lineTo(cx + w * 0.9, cy + h * 0.7); g.quadraticCurveTo(cx, cy + h * 1.15, cx - w * 0.9, cy + h * 0.7); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(120,140,180,.6)'; g.lineWidth = Math.max(1, r * 0.12); for (const k of [-0.3, 0.15]) { g.beginPath(); g.moveTo(cx - w * 0.85, cy + k * h); g.quadraticCurveTo(cx, cy + k * h + h * 0.25, cx + w * 0.85, cy + k * h); g.stroke(); }
  } else if (id === 99) {   // ウインク（★）: まえの 目を つぶって ときどき ほしが とぶ
    eyeWhite(back); g.fillStyle = INK; g.beginPath(); g.arc(back + facing * r * 0.25, ey, r * 0.5, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(back + facing * r * 0.05, ey - r * 0.25, r * 0.17, 0, 7); g.fill();
    eyeWhite(front); g.strokeStyle = INK; g.lineWidth = Math.max(1.5, r * 0.32); g.beginPath(); g.moveTo(front - r * 0.65, ey + r * 0.05); g.quadraticCurveTo(front, ey - r * 0.6, front + r * 0.65, ey + r * 0.05); g.stroke();
    const ph = (t * 0.6) % 1; if (ph < 0.5) { const k = Math.sin(ph / 0.5 * Math.PI); star(g, front + facing * r * (1.8 + ph * 2), ey - r * (0.8 + ph * 1.5), r * 0.55 * k, '#ffd54f', '#e65100', ph * 4); }
  } else if (id === 100) {   // ねこひげ（★）: ぴくぴく
    const cx = mx, cy = ey + r * 1.4, wg = Math.sin(t * 6) * 0.06;
    g.strokeStyle = INK; g.lineWidth = Math.max(1, r * 0.13);
    for (const k of [-1, 1]) for (const a of [-0.25, 0, 0.25]) { g.beginPath(); g.moveTo(cx + k * r * 0.9, cy + a * r); g.lineTo(cx + k * r * 3.2, cy + a * r * 3 + (a + wg) * r * 1.5 - r * 0.1); g.stroke(); }
    g.fillStyle = '#f48fb1'; g.beginPath(); g.moveTo(cx - r * 0.35, cy - r * 0.25); g.lineTo(cx + r * 0.35, cy - r * 0.25); g.lineTo(cx, cy + r * 0.15); g.closePath(); g.fill();
    g.lineWidth = Math.max(1, r * 0.16); g.beginPath(); g.moveTo(cx, cy + r * 0.15); g.quadraticCurveTo(cx - r * 0.1, cy + r * 0.55, cx - r * 0.5, cy + r * 0.45); g.moveTo(cx, cy + r * 0.15); g.quadraticCurveTo(cx + r * 0.1, cy + r * 0.55, cx + r * 0.5, cy + r * 0.45); g.stroke();
  } else if (id === 101) {   // にっこりめ（★）: ∩ の 目と ほっぺ
    for (const x of eyesAt) { eyeWhite(x); g.strokeStyle = INK; g.lineWidth = Math.max(1.5, r * 0.34); g.beginPath(); g.moveTo(x - r * 0.62, ey + r * 0.25); g.quadraticCurveTo(x, ey - r * 0.75, x + r * 0.62, ey + r * 0.25); g.stroke(); }
    g.fillStyle = 'rgba(255,128,171,.55)'; for (const k of [-1, 1]) { g.beginPath(); g.ellipse(ex + k * r * 2.4, ey + r * 1.3, r * 0.75, r * 0.45, 0, 0, 7); g.fill(); }
  } else if (id === 102) {   // ゴーグル（★★）: まるい レンズに 光が すべる
    g.strokeStyle = '#5d4037'; g.lineWidth = Math.max(2, r * 0.45); g.beginPath(); g.moveTo(eyesAt[0] - r * 1.3, ey); g.lineTo(eyesAt[0] - r * 3.2, ey - r * 0.4); g.moveTo(eyesAt[1] + r * 1.3, ey); g.lineTo(eyesAt[1] + r * 3.2, ey - r * 0.4); g.stroke();
    for (const [i, x] of eyesAt.entries()) {
      g.fillStyle = '#ff8f00'; g.strokeStyle = INK; g.lineWidth = Math.max(1, r * 0.2); g.beginPath(); g.arc(x, ey, r * 1.45, 0, 7); g.fill(); g.stroke();
      const gl = g.createLinearGradient(x - r, ey - r, x + r, ey + r); gl.addColorStop(0, '#b3e5fc'); gl.addColorStop(0.5, '#0288d1'); gl.addColorStop(1, '#01579b');
      g.fillStyle = gl; g.beginPath(); g.arc(x, ey, r * 1.05, 0, 7); g.fill();
      g.save(); g.beginPath(); g.arc(x, ey, r * 1.05, 0, 7); g.clip(); const sx = x - r * 1.6 + ((t * 0.7 + i * 0.15) % 1.6) * r * 2.4; g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(sx, ey - r * 1.2); g.lineTo(sx + r * 0.4, ey - r * 1.2); g.lineTo(sx - r * 0.2, ey + r * 1.2); g.lineTo(sx - r * 0.6, ey + r * 1.2); g.fill(); g.restore();
    }
    g.strokeStyle = '#ff8f00'; g.lineWidth = Math.max(1.5, r * 0.3); g.beginPath(); g.moveTo(eyesAt[0] + r * 1.4, ey - r * 0.2); g.lineTo(eyesAt[1] - r * 1.4, ey - r * 0.2); g.stroke();
  } else if (id === 103) {   // モノクル（★★）: 金の わと くさり
    const x = front;
    g.strokeStyle = '#c9a227'; g.lineWidth = Math.max(1, r * 0.14); g.beginPath(); g.moveTo(x + r * 0.9, ey + r * 0.9); g.bezierCurveTo(x + r * 1.6, ey + r * 3.5, x - r * 0.5, ey + r * 4.2, x - r * 1.6, ey + r * 3.3 + Math.sin(t * 2) * r * 0.2); g.stroke();
    g.fillStyle = 'rgba(200,230,255,.3)'; g.beginPath(); g.arc(x, ey, r * 1.35, 0, 7); g.fill();
    g.strokeStyle = INK; g.lineWidth = Math.max(1.5, r * 0.42); g.stroke(); g.strokeStyle = '#ffd54f'; g.lineWidth = Math.max(1, r * 0.26); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(x - r * 0.45, ey - r * 0.5, r * 0.32, r * 0.16, -0.6, 0, 7); g.fill();
    twinkle(g, x + r * 0.9, ey - r * 0.9, r * 1.2, wave(t, 2.3, 1) > 0.82 ? (wave(t, 2.3, 1) - 0.82) * 5.5 : 0);
  } else if (id === 104) {   // せんしの ペイント（★★）: ほっぺに あかと しろの すじ
    for (const k of [-1, 1]) {
      const cx = ex + k * r * 2.3, cy = ey + r * 1.3;
      g.lineCap = 'round'; g.strokeStyle = '#d32f2f'; g.lineWidth = Math.max(2, r * 0.38);
      for (const d of [-0.45, 0.45]) { g.beginPath(); g.moveTo(cx - r * 0.7, cy + d * r - r * 0.2 * k); g.lineTo(cx + r * 0.7, cy + d * r + r * 0.2 * k); g.stroke(); }
      g.strokeStyle = '#fafafa'; g.lineWidth = Math.max(1.5, r * 0.22); g.beginPath(); g.moveTo(cx - r * 0.55, cy - r * 0.05 * k); g.lineTo(cx + r * 0.55, cy + r * 0.25 * k); g.stroke();
    }
    g.strokeStyle = '#d32f2f'; g.lineWidth = Math.max(2, r * 0.3); g.beginPath(); g.moveTo(ex, ey - r * 2.2); g.lineTo(ex, ey - r * 1.2); g.stroke();
  } else if (id === 105) {   // ほしがたサングラス（★★）: ほしの レンズ・きらっ
    g.strokeStyle = '#ec407a'; g.lineWidth = Math.max(1.5, r * 0.3); g.beginPath(); g.moveTo(eyesAt[0] + r * 1.0, ey - r * 0.2); g.lineTo(eyesAt[1] - r * 1.0, ey - r * 0.2); g.stroke();
    for (const [i, x] of eyesAt.entries()) {
      const gr = g.createLinearGradient(x - r, ey - r, x + r, ey + r); gr.addColorStop(0, '#f48fb1'); gr.addColorStop(0.5, '#ad1457'); gr.addColorStop(1, '#4a148c');
      star(g, x, ey, r * 1.75, gr, INK, Math.sin(t * 2 + i) * 0.08);
      g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(x - r * 0.4, ey - r * 0.45, r * 0.3, r * 0.15, -0.6, 0, 7); g.fill();
    }
    twinkle(g, front + r * 0.8, ey - r * 1.0, r * 1.3, wave(t, 2.5, 2) > 0.8 ? (wave(t, 2.5, 2) - 0.8) * 5 : 0, '#fce4ec');
  } else if (id === 106) {   // ドラゴンの め（★★★）: 金の ひとみに たての ひとみ・光る・ときどき ほそく なる
    const nar = 0.35 + 0.25 * Math.max(0, Math.sin(t * 1.3)) ** 4;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const x of eyesAt) { const gw = g.createRadialGradient(x, ey, r * 0.5, x, ey, r * 2.4); gw.addColorStop(0, 'rgba(255,171,0,' + (0.45 + 0.2 * wave(t, 3, 0)).toFixed(2) + ')'); gw.addColorStop(1, 'rgba(255,87,34,0)'); g.fillStyle = gw; g.beginPath(); g.arc(x, ey, r * 2.4, 0, 7); g.fill(); }
    g.restore();
    for (const x of eyesAt) {
      g.save(); g.translate(x, ey);
      g.beginPath(); g.moveTo(-r * 1.35, r * 0.05); g.quadraticCurveTo(0, -r * 1.25, r * 1.35, -r * 0.25 * facing); g.quadraticCurveTo(0, r * 1.15, -r * 1.35, r * 0.05); g.closePath();
      const gi = g.createRadialGradient(0, 0, r * 0.1, 0, 0, r * 1.2); gi.addColorStop(0, '#fff59d'); gi.addColorStop(0.5, '#ffb300'); gi.addColorStop(1, '#e65100');
      g.fillStyle = gi; g.fill(); g.strokeStyle = INK; g.lineWidth = Math.max(1, r * 0.22); g.stroke();
      g.fillStyle = '#1a0a00'; g.beginPath(); g.ellipse(facing * r * 0.1, 0, r * nar, r * 0.85, 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(-r * 0.45, -r * 0.35, r * 0.16, 0, 7); g.fill();
      g.restore();
    }
  } else if (id === 107) {   // ホログラムの バイザー（★★★）: すける 光の バイザー・走る 線・ちらつく もじ
    const vx = ex - r * 3.0, vy = ey - r * 1.15, vw = r * 6.0, vh = r * 2.3, fl = (Math.floor(t * 12) % 17 === 0) ? 0.5 : 1;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = fl;
    const gv = g.createLinearGradient(0, vy, 0, vy + vh); gv.addColorStop(0, 'rgba(0,229,255,.55)'); gv.addColorStop(0.5, 'rgba(41,121,255,.3)'); gv.addColorStop(1, 'rgba(213,0,249,.45)');
    g.fillStyle = gv; g.beginPath(); g.moveTo(vx, vy + vh * 0.3); g.quadraticCurveTo(vx + vw / 2, vy - vh * 0.25, vx + vw, vy + vh * 0.3); g.lineTo(vx + vw - r * 0.4, vy + vh); g.quadraticCurveTo(vx + vw / 2, vy + vh * 1.15, vx + r * 0.4, vy + vh); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(178,255,255,.95)'; g.lineWidth = Math.max(1, r * 0.15); g.stroke();
    g.save(); g.clip();
    const sy = vy + ((t * 0.8) % 1) * vh * 1.2; g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(vx, sy - r * 0.15, vw, r * 0.3);
    g.fillStyle = 'rgba(178,255,255,.8)'; for (let i = 0; i < 3; i++) { const bw = r * (0.6 + 1.2 * wave(t, 5, i)); g.fillRect(vx + r * 0.9 + i * r * 1.6, vy + vh * 0.62, bw, r * 0.18); }
    g.restore();
    for (const x of eyesAt) { g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = Math.max(1, r * 0.14); g.beginPath(); g.arc(x, ey, r * 0.7, 0, 7); g.stroke(); g.beginPath(); g.moveTo(x - r * 0.95, ey); g.lineTo(x + r * 0.95, ey); g.moveTo(x, ey - r * 0.95); g.lineTo(x, ey + r * 0.95); g.stroke(); }
    g.restore();
  }
}
// からだ（108〜117）: 体の 形で clip した あと。x0..y1 = 体の 四角。もようは 大きく・少なく
function bodyNew(g, id, x0, y0, x1, y1, w, h, t) {
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, m = Math.min(w, h), my = y0 + h * 0.66;   // マークは 顔に かからない よう 下の ほう
  if (id === 108) {   // ほしの マーク（★）: おなかに 大きい ほし 1 つ
    star(g, cx, my, m * 0.27, '#ffd54f', '#f57f17', 0); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(cx - m * 0.07, my - m * 0.1, m * 0.06, m * 0.03, -0.6, 0, 7); g.fill();
  } else if (id === 109) {   // いなずまの マーク（★）
    const s = m * 0.3; g.save(); g.translate(cx, my);
    g.beginPath(); g.moveTo(s * 0.2, -s); g.lineTo(-s * 0.45, s * 0.1); g.lineTo(-s * 0.02, s * 0.1); g.lineTo(-s * 0.25, s); g.lineTo(s * 0.5, -s * 0.15); g.lineTo(s * 0.05, -s * 0.15); g.closePath();
    g.fillStyle = '#ffeb3b'; g.fill(); g.strokeStyle = '#e65100'; g.lineWidth = Math.max(2, s * 0.09); g.lineJoin = 'round'; g.stroke(); g.restore();
  } else if (id === 110) {   // ゼッケン（★）: しろい ぬのに「1」
    const bw = Math.min(w * 0.6, m * 0.7), bh = Math.min(h * 0.4, bw * 0.7), bx = cx - bw / 2, by = my - bh / 2;
    g.fillStyle = 'rgba(255,255,255,.95)'; g.strokeStyle = 'rgba(13,16,48,.6)'; g.lineWidth = 2; g.beginPath(); g.rect(bx, by, bw, bh); g.fill(); g.stroke();
    g.fillStyle = '#d32f2f'; g.font = '900 ' + Math.round(bh * 0.75) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1', cx, my + bh * 0.04);
    g.fillStyle = '#9e9e9e'; for (const [px, py] of [[bx + 5, by + 5], [bx + bw - 5, by + 5]]) { g.beginPath(); g.arc(px, py, 2.2, 0, 7); g.fill(); }
  } else if (id === 111) {   // エプロン（★）: したの ほうに ポケットつき
    const ew = w * 0.62, top = y0 + h * 0.32;
    g.strokeStyle = 'rgba(13,16,48,.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - ew * 0.3, top); g.lineTo(cx - ew * 0.45, y0 - 4); g.moveTo(cx + ew * 0.3, top); g.lineTo(cx + ew * 0.45, y0 - 4); g.stroke();
    g.fillStyle = 'rgba(255,236,240,.95)'; g.beginPath(); g.moveTo(cx - ew * 0.35, top); g.lineTo(cx + ew * 0.35, top); g.lineTo(cx + ew * 0.5, y1 + 4); g.lineTo(cx - ew * 0.5, y1 + 4); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(244,143,177,.9)'; g.beginPath(); g.rect(cx - ew * 0.2, top + (y1 - top) * 0.35, ew * 0.4, (y1 - top) * 0.25); g.fill(); g.stroke();
    heart(g, cx, top + (y1 - top) * 0.47, Math.max(3, ew * 0.06), '#ffffff');
  } else if (id === 112) {   // よろい（★★）: はがねの 板・大きい びょう・光が 走る
    const n = Math.max(2, Math.min(4, Math.round(h / 28))), bh = h / n;
    for (let i = 0; i < n; i++) {
      const py = y0 + i * bh; g.fillStyle = lin(g, 0, py, 0, py + bh, ['#cfd8dc', '#78909c', '#455a64']); g.fillRect(x0 - 5, py, w + 10, bh);
      g.strokeStyle = 'rgba(13,16,48,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0 - 5, py + bh); g.lineTo(x1 + 5, py + bh); g.stroke();
      g.fillStyle = '#cfd8dc'; for (const fx of [0.18, 0.82]) { g.beginPath(); g.arc(x0 + w * fx, py + bh * 0.5, Math.max(2.5, bh * 0.12), 0, 7); g.fill(); g.strokeStyle = 'rgba(13,16,48,.5)'; g.lineWidth = 1; g.stroke(); }
    }
    shine(g, x0, y0, w, h, t, 0.5, 0.7);
  } else if (id === 113) {   // きもの（★★）: えりの V・金の おび・大きい はな 2 つ
    g.fillStyle = 'rgba(198,40,40,.85)'; g.fillRect(x0 - 5, y0 - 5, w + 10, h + 10);
    g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.moveTo(cx - w * 0.3, y0 - 5); g.lineTo(cx + w * 0.05, cy); g.lineTo(cx + w * 0.15, cy - h * 0.05); g.lineTo(cx - w * 0.15, y0 - 5); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(13,16,48,.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx + w * 0.3, y0 - 5); g.lineTo(cx - w * 0.02, cy + h * 0.02); g.stroke();
    const oy = y0 + h * 0.58, oh = Math.max(8, h * 0.16); g.fillStyle = lin(g, 0, oy, 0, oy + oh, ['#ffe082', '#ffb300']); g.fillRect(x0 - 5, oy, w + 10, oh); g.strokeStyle = 'rgba(13,16,48,.5)'; g.strokeRect(x0 - 5, oy, w + 10, oh);
    const flower = (fx, fy, r) => { g.fillStyle = 'rgba(255,205,210,.9)'; for (let i = 0; i < 5; i++) { const a = i * 1.2566 + t * 0.3; g.beginPath(); g.ellipse(fx + Math.cos(a) * r * 0.6, fy + Math.sin(a) * r * 0.6, r * 0.5, r * 0.32, a, 0, 7); g.fill(); } g.fillStyle = '#ffeb3b'; g.beginPath(); g.arc(fx, fy, r * 0.22, 0, 7); g.fill(); };
    flower(x0 + w * 0.75, y0 + h * 0.3, Math.max(7, m * 0.14)); flower(x0 + w * 0.25, y0 + h * 0.85, Math.max(6, m * 0.12));
  } else if (id === 114) {   // でんしかいろ（★★）: みどりの 板に 線・光が 走る
    g.fillStyle = 'rgba(27,94,32,.65)'; g.fillRect(x0 - 5, y0 - 5, w + 10, h + 10);
    const lines = [[0.15, 0.25, 0.6, 0.25, 0.6, 0.55], [0.85, 0.15, 0.85, 0.5, 0.35, 0.5], [0.2, 0.8, 0.5, 0.8, 0.5, 0.95], [0.1, 0.55, 0.3, 0.55, 0.3, 0.7]];
    g.lineWidth = 2.5; g.strokeStyle = 'rgba(255,213,79,.85)';
    for (const L of lines) { g.beginPath(); g.moveTo(x0 + w * L[0], y0 + h * L[1]); g.lineTo(x0 + w * L[2], y0 + h * L[3]); g.lineTo(x0 + w * L[4], y0 + h * L[5]); g.stroke(); }
    g.fillStyle = '#ffd54f'; for (const L of lines) { g.beginPath(); g.arc(x0 + w * L[0], y0 + h * L[1], 3.5, 0, 7); g.fill(); g.beginPath(); g.arc(x0 + w * L[4], y0 + h * L[5], 3.5, 0, 7); g.fill(); }
    g.save(); g.globalCompositeOperation = 'lighter';
    lines.forEach((L, i) => { const ph = (t * 0.7 + i * 0.27) % 1, seg = ph < 0.5 ? 0 : 1, k = (ph % 0.5) * 2, ax = L[seg * 2], ay = L[seg * 2 + 1], bx = L[seg * 2 + 2], by = L[seg * 2 + 3]; const px = x0 + w * (ax + (bx - ax) * k), py = y0 + h * (ay + (by - ay) * k); const gl = g.createRadialGradient(px, py, 0, px, py, 8); gl.addColorStop(0, 'rgba(178,255,89,1)'); gl.addColorStop(1, 'rgba(178,255,89,0)'); g.fillStyle = gl; g.beginPath(); g.arc(px, py, 8, 0, 7); g.fill(); });
    g.restore();
  } else if (id === 115) {   // わたあめ（★★）: ふわふわの 大きな くも
    g.fillStyle = 'rgba(255,240,246,.55)'; g.fillRect(x0 - 5, y0 - 5, w + 10, h + 10);
    const blobs = [[0.25, 0.3, '#f8bbd0'], [0.7, 0.25, '#b3e5fc'], [0.45, 0.65, '#e1bee7'], [0.85, 0.75, '#f8bbd0'], [0.12, 0.85, '#b3e5fc']];
    blobs.forEach(([fx, fy, c], i) => { const bx = x0 + w * fx + Math.sin(t * 1.2 + i) * 3, by = y0 + h * fy + Math.cos(t * 1.1 + i) * 3, R = m * 0.28; const gr = g.createRadialGradient(bx, by, 0, bx, by, R); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(bx, by, R, 0, 7); g.fill(); });
    twinkle(g, x0 + w * 0.6, y0 + h * 0.45, 8, wave(t, 2.4, 1) > 0.8 ? (wave(t, 2.4, 1) - 0.8) * 5 : 0);
  } else if (id === 116) {   // ステンドグラス（★★★）: 大きい 色ガラス・光が とおる
    const P = [[0, 0], [0.55, 0], [1, 0], [0, 0.45], [0.4, 0.4], [0.75, 0.5], [1, 0.4], [0, 1], [0.35, 1], [0.7, 1], [1, 1]].map(([a, b]) => [x0 - 5 + (w + 10) * a, y0 - 5 + (h + 10) * b]);
    const panes = [[0, 1, 4, 3, '#e53935'], [1, 2, 6, 5, 4, '#1e88e5'], [3, 4, 8, 7, '#fdd835'], [4, 5, 9, 8, '#43a047'], [5, 6, 10, 9, '#8e24aa']];
    for (const pn of panes) { const c = pn[pn.length - 1]; g.globalAlpha = 0.6 + 0.15 * wave(t, 1.5, pn[0]); g.fillStyle = c; g.beginPath(); pn.slice(0, -1).forEach((k, i) => i ? g.lineTo(P[k][0], P[k][1]) : g.moveTo(P[k][0], P[k][1])); g.closePath(); g.fill(); }
    g.globalAlpha = 1; g.strokeStyle = 'rgba(30,20,10,.85)'; g.lineWidth = 3; g.lineJoin = 'round';
    for (const pn of panes) { g.beginPath(); pn.slice(0, -1).forEach((k, i) => i ? g.lineTo(P[k][0], P[k][1]) : g.moveTo(P[k][0], P[k][1])); g.closePath(); g.stroke(); }
    g.save(); g.globalCompositeOperation = 'lighter'; const lx = x0 + w * wave(t, 0.6, 0); const gl = g.createRadialGradient(lx, y0 + h * 0.3, 0, lx, y0 + h * 0.3, m * 0.8); gl.addColorStop(0, 'rgba(255,255,240,.55)'); gl.addColorStop(1, 'rgba(255,255,240,0)'); g.fillStyle = gl; g.fillRect(x0 - 5, y0 - 5, w + 10, h + 10); g.restore();
    for (let i = 0; i < 2; i++) twinkle(g, x0 + w * (0.3 + i * 0.4), y0 + h * (0.3 + i * 0.35), 9, wave(t, 2.6, i + 2) > 0.75 ? (wave(t, 2.6, i + 2) - 0.75) * 4 : 0);
  } else if (id === 117) {   // みずの からだ（★★★）: ゆれる 水面・光の もよう・あわが のぼる
    const sy = y0 + h * 0.18;
    g.fillStyle = lin(g, 0, y0, 0, y1, ['rgba(129,212,250,.75)', 'rgba(2,136,209,.85)', 'rgba(1,87,155,.9)']);
    g.beginPath(); g.moveTo(x0 - 5, y1 + 5); for (let x = x0 - 5; x <= x1 + 5; x += 4) g.lineTo(x, sy + Math.sin(x * 0.09 + t * 3) * 4 + Math.sin(x * 0.05 - t * 2) * 3); g.lineTo(x1 + 5, y1 + 5); g.closePath(); g.fill();
    g.fillStyle = 'rgba(179,229,252,.5)'; g.fillRect(x0 - 5, y0 - 5, w + 10, sy - y0 + 2);
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2; g.beginPath(); for (let x = x0 - 5; x <= x1 + 5; x += 4) g.lineTo(x, sy + Math.sin(x * 0.09 + t * 3) * 4 + Math.sin(x * 0.05 - t * 2) * 3); g.stroke();
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 3;
    for (let i = 0; i < 3; i++) { const yy = sy + (h - (sy - y0)) * (0.3 + i * 0.25); g.beginPath(); for (let x = x0; x <= x1; x += 5) g.lineTo(x, yy + Math.sin(x * 0.12 + t * 2 + i * 2) * 5); g.stroke(); }
    g.restore();
    for (let i = 0; i < 3; i++) { const ph = (t * 0.4 + i / 3) % 1, bx = x0 + w * (0.25 + i * 0.25) + Math.sin(t * 3 + i) * 3, by = y1 - ph * (y1 - sy); g.strokeStyle = 'rgba(255,255,255,' + (0.85 * Math.sin(ph * Math.PI)).toFixed(2) + ')'; g.lineWidth = 1.5; g.beginPath(); g.arc(bx, by, 3 + (i % 2) * 2, 0, 7); g.stroke(); }
  }
}
// えふぇくと（118〜127）: front = まえ（体の あと）か うしろ（体の まえ）か
function fxNew(g, id, info, t, w, h, cx, cy, front) {
  const { x0, x1, y0, y1 } = info, f = info.facing || 1, R = Math.random, M = Math.max(w, h);
  if (id === 118 && front) {   // ちょうちょ（★）: 2 ひきが まわりを ひらひら
    for (let i = 0; i < 2; i++) {
      const a = t * (0.9 + i * 0.25) + i * 3, bx = cx + Math.cos(a) * M * 0.8, by = cy - h * 0.2 + Math.sin(a * 1.7) * h * 0.45, fl = Math.abs(Math.sin(t * 14 + i * 2)) * 0.8 + 0.2, s = 11;
      g.save(); g.translate(bx, by); g.rotate(Math.cos(a) * 0.3);
      for (const k of [-1, 1]) { g.fillStyle = i ? '#ffb74d' : '#4fc3f7'; g.beginPath(); g.ellipse(k * s * 0.7 * fl, -s * 0.3, s * 0.8 * fl, s * 0.65, k * 0.4, 0, 7); g.fill(); g.fillStyle = i ? '#ff7043' : '#29b6f6'; g.beginPath(); g.ellipse(k * s * 0.5 * fl, s * 0.45, s * 0.5 * fl, s * 0.4, -k * 0.3, 0, 7); g.fill(); }
      g.fillStyle = INK; g.beginPath(); g.ellipse(0, 0, s * 0.14, s * 0.7, 0, 0, 7); g.fill();
      g.strokeStyle = INK; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -s * 0.6); g.lineTo(-s * 0.3, -s * 1.1); g.moveTo(0, -s * 0.6); g.lineTo(s * 0.3, -s * 1.1); g.stroke();
      g.restore();
    }
  } else if (id === 119 && !front) {   // くも（★）: からだの したに ふわふわの くも
    const by = y1 + 4 + Math.sin(t * 1.8) * 3, cw = w * 0.85 + 30;
    g.save(); g.fillStyle = 'rgba(255,255,255,.95)'; g.strokeStyle = 'rgba(150,170,200,.7)'; g.lineWidth = 2;
    g.beginPath(); g.arc(cx - cw * 0.32, by, cw * 0.2, Math.PI * 0.5, Math.PI * 1.5); g.arc(cx - cw * 0.1, by - cw * 0.12, cw * 0.24, Math.PI, Math.PI * 1.9); g.arc(cx + cw * 0.18, by - cw * 0.08, cw * 0.22, Math.PI * 1.15, Math.PI * 2); g.arc(cx + cw * 0.36, by + cw * 0.02, cw * 0.17, Math.PI * 1.4, Math.PI * 0.5); g.closePath(); g.fill(); g.stroke();
    g.restore();
  } else if (id === 120 && front) {   // ほたる（★）: 3 つの 光が ゆっくり まう
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { const a = t * (0.5 + i * 0.13) + i * 2.1, px = cx + Math.cos(a) * M * (0.7 + 0.15 * Math.sin(t + i)), py = cy + Math.sin(a * 1.3) * h * 0.6, b = 0.3 + 0.7 * wave(t, 2.2, i); const gl = g.createRadialGradient(px, py, 0, px, py, 12); gl.addColorStop(0, 'rgba(244,255,129,' + b.toFixed(2) + ')'); gl.addColorStop(0.3, 'rgba(198,255,0,' + (b * 0.6).toFixed(2) + ')'); gl.addColorStop(1, 'rgba(198,255,0,0)'); g.fillStyle = gl; g.beginPath(); g.arc(px, py, 12, 0, 7); g.fill(); }
    g.restore();
  } else if (id === 121 && !front) {   // はなびら（★）: ピンクと きいろの はなびらが すこし まう
    if (R() < 0.06) info.spawn(x0 - w * 0.2 + R() * w * 1.4, y0 - h * 0.4 - R() * 20, { vx: (R() - 0.5) * 50, vy: 20 + R() * 15, g: 0.02, c: ['#f8bbd0', '#fff59d', '#f48fb1'][R() * 3 | 0], life: 100, k: 'leaf', rot: R() * 6, spin: (R() - 0.5) * 0.2 });
  } else if (id === 122 && !front) {   // にじ（★★）: うしろに にじの アーチ・はしに くも
    const R0 = M * 0.95, ay = y1 + 2, bw = Math.max(4, M * 0.07);
    g.save(); g.globalAlpha = 0.75 + 0.15 * wave(t, 1.5, 0); g.lineWidth = bw;
    ['#ef5350', '#ffa726', '#ffee58', '#66bb6a', '#42a5f5', '#7e57c2'].forEach((c, i) => { g.strokeStyle = c; g.beginPath(); g.arc(cx, ay, R0 - i * bw, Math.PI, 0); g.stroke(); });
    g.globalAlpha = 1; g.fillStyle = 'rgba(255,255,255,.95)';
    for (const k of [-1, 1]) { const px = cx + k * (R0 - bw * 2.5); g.beginPath(); g.arc(px - 7, ay, 8, 0, 7); g.arc(px + 4, ay - 5, 10, 0, 7); g.arc(px + 12, ay + 1, 7, 0, 7); g.fill(); }
    g.restore();
    twinkle(g, cx + Math.cos(t * 0.8) * R0 * 0.9, ay - Math.abs(Math.sin(t * 0.8)) * R0 * 0.9, 10, 0.7);
  } else if (id === 123) {   // まわる ほし（★★）: ほしが 1 つ まわる。まえを とおる ときは まえに
    const a = t * 2.2, sx = cx + Math.cos(a) * M * 0.8, sy = cy + Math.sin(a) * h * 0.35 - h * 0.1;
    if ((Math.sin(a) > 0) !== front) return;
    for (let k = 1; k <= 3; k++) { const b = a - k * 0.22; twinkle(g, cx + Math.cos(b) * M * 0.8, cy + Math.sin(b) * h * 0.35 - h * 0.1, 7 - k, 0.6 - k * 0.15, '#fff59d'); }
    g.save(); g.shadowColor = '#ffd54f'; g.shadowBlur = 10; star(g, sx, sy, 9, '#ffe082', '#f57f17', t * 3); g.restore();
  } else if (id === 124) {   // ひのたま（★★）: 2 つの ひのたまが まわる
    for (let i = 0; i < 2; i++) {
      const a = t * 1.8 + i * Math.PI, px = cx + Math.cos(a) * M * 0.75, py = cy + Math.sin(a) * h * 0.3 - h * 0.05;
      if ((Math.sin(a) > 0) !== front) continue;
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let k = 4; k >= 1; k--) { const b = a - k * 0.12, qx = cx + Math.cos(b) * M * 0.75, qy = cy + Math.sin(b) * h * 0.3 - h * 0.05; g.fillStyle = 'rgba(255,112,67,' + (0.3 - k * 0.05).toFixed(2) + ')'; g.beginPath(); g.arc(qx, qy, 7 - k, 0, 7); g.fill(); }
      const gl = g.createRadialGradient(px, py, 0, px, py, 13); gl.addColorStop(0, 'rgba(255,255,255,1)'); gl.addColorStop(0.3, 'rgba(255,213,79,.95)'); gl.addColorStop(0.7, 'rgba(255,87,34,.6)'); gl.addColorStop(1, 'rgba(255,87,34,0)');
      g.fillStyle = gl; g.beginPath(); g.arc(px, py, 13, 0, 7); g.fill(); g.restore();
    }
  } else if (id === 125 && !front) {   // さくらふぶき（★★）: ときどき かぜと いっしょに さくらが ながれる
    const ph = (t * 0.35) % 1;
    if (ph < 0.35) {
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,205,230,' + (0.35 * Math.sin(ph / 0.35 * Math.PI)).toFixed(2) + ')'; g.lineWidth = 3; g.lineCap = 'round';
      for (let i = 0; i < 2; i++) { const yy = y0 + h * (0.2 + i * 0.5); g.beginPath(); g.moveTo(x0 - w * 0.8, yy); g.quadraticCurveTo(cx, yy - h * 0.3, x1 + w * 0.8, yy - h * 0.1); g.stroke(); }
      g.restore();
      if (R() < 0.3) info.spawn(x0 - w * 0.7, y0 - h * 0.2 + R() * h * 1.2, { vx: 120 + R() * 60, vy: (R() - 0.6) * 30, g: 0.01, c: R() < 0.6 ? '#f8bbd0' : '#fce4ec', life: 70, k: 'leaf', rot: R() * 6, spin: (R() - 0.5) * 0.3 });
    }
  } else if (id === 126 && !front) {   // フェニックス（★★★）: ほのおの つばさが はばたく・ほのおの しっぽ・火の粉
    const ay = y0 + h * 0.3, span = Math.max(h * 1.1, w * 0.95), flap = Math.sin(t * 4.5);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const k of [-1, 1]) {
      const ax = k < 0 ? x0 + w * 0.3 : x1 - w * 0.3;
      g.save(); g.translate(ax, ay); g.scale(k, 1); g.rotate(-0.35 + flap * 0.3);
      for (let i = 0; i < 5; i++) {   // 羽根 5 まい（ほのおの いろ）
        const a = -0.9 + i * 0.32, L = span * (1.05 - i * 0.12), wd = span * 0.13;
        g.save(); g.rotate(a); const gr = g.createLinearGradient(0, 0, L, 0); gr.addColorStop(0, 'rgba(255,87,34,.9)'); gr.addColorStop(0.55, 'rgba(255,193,7,.85)'); gr.addColorStop(1, 'rgba(255,255,200,0)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(0, -wd * 0.4); g.quadraticCurveTo(L * 0.5, -wd * (1 + 0.2 * Math.sin(t * 8 + i)), L, Math.sin(t * 6 + i) * wd * 0.4); g.quadraticCurveTo(L * 0.5, wd * 0.8, 0, wd * 0.4); g.closePath(); g.fill(); g.restore();
      }
      g.restore();
    }
    for (let i = 0; i < 3; i++) { const tx = cx - f * w * 0.3, sw = Math.sin(t * 3 + i) * h * 0.08, L = Math.max(w, h) * (0.55 + i * 0.08); g.strokeStyle = ['rgba(255,87,34,.6)', 'rgba(255,193,7,.55)', 'rgba(255,241,118,.5)'][i]; g.lineWidth = 7 - i * 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(tx, y0 + h * 0.5); g.quadraticCurveTo(tx - f * L * 0.5, y0 + h * 0.6 + sw, tx - f * L, y0 + h * (0.3 + i * 0.15) + sw); g.stroke(); }   // ほのおの しっぽ（うしろへ 3 本）
    g.restore();
    if (R() < 0.25) info.spawn(cx + (R() - 0.5) * span * 2, ay + (R() - 0.5) * h * 0.5, { vx: (R() - 0.5) * 40, vy: -50 - R() * 50, g: -0.05, c: R() < 0.5 ? '#ff7043' : '#ffd54f', life: 40, k: 'ember' });
  } else if (id === 127) {   // おうごんの りゅう（★★★）: 金の 龍が モンスターの 上を うねりながら とぶ
    // かお（角・たてがみ・ながい はな・ひらいた 口・ひげ）、おなかは うすい 色、せなかに とげ、足 2 本、しっぽの 先に 毛
    // 頭は モンスターの 上・まえ、からだは うしろへ うねりながら のびる（ぜんぶ うしろに 描く）
    if (front) return;
    const N = 30, L = M * 1.75, base = Math.max(8, M * 0.13), hx = cx + f * M * 0.25, hy = y0 - M * 0.55 + Math.sin(t * 2) * M * 0.06, segs = [];
    for (let i = 0; i <= N; i++) { const u = i / N; segs.push({ a: 1, x: hx - f * u * L, y: hy + u * M * 0.6 + Math.sin(u * Math.PI * 2.2 - t * 3) * M * 0.25 * Math.min(1, u * 3), r: base * (i < 3 ? 0.85 + i * 0.05 : 1 - (i - 3) / (N - 3) * 0.72) }); }
    for (let i = 0; i <= N; i++) { const p = segs[Math.max(0, i - 1)], q = segs[Math.min(N, i + 1)], dx = q.x - p.x, dy = q.y - p.y, L2 = Math.hypot(dx, dy) || 1; segs[i].nx = -dy / L2; segs[i].ny = dx / L2; if (segs[i].ny < 0) { segs[i].nx *= -1; segs[i].ny *= -1; } }   // した むきの 法線（おなかの がわ）
    const vis = () => true;
    { g.save(); g.globalCompositeOperation = 'lighter'; const gl = g.createRadialGradient(hx, hy, base, hx, hy, M * 1.2); gl.addColorStop(0, 'rgba(255,215,64,.25)'); gl.addColorStop(1, 'rgba(255,215,64,0)'); g.fillStyle = gl; g.beginPath(); g.arc(hx, hy, M * 1.2, 0, 7); g.fill(); g.restore(); }
    // せなかの とげ（からだの 上がわ・オレンジ）
    for (let i = 4; i < N - 3; i += 3) { if (!vis(i)) continue; const p = segs[i]; g.fillStyle = '#ff8f00'; g.strokeStyle = '#7a4a00'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(p.x - p.nx * p.r * 0.7 - p.ny * p.r * 0.5, p.y - p.ny * p.r * 0.7 + p.nx * p.r * 0.5); g.lineTo(p.x - p.nx * p.r * 1.9, p.y - p.ny * p.r * 1.9); g.lineTo(p.x - p.nx * p.r * 0.7 + p.ny * p.r * 0.5, p.y - p.ny * p.r * 0.7 - p.nx * p.r * 0.5); g.closePath(); g.fill(); g.stroke(); }
    // 足（2 本・3 本の つめ）
    for (const i of [7, 17]) { if (!vis(i)) continue; const p = segs[i], kx = p.x + p.nx * p.r * 1.9, ky = p.y + p.ny * p.r * 1.9 + Math.sin(t * 4 + i) * 2; g.strokeStyle = '#7a4a00'; g.lineWidth = p.r * 0.7 + 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(kx, ky); g.stroke(); g.strokeStyle = '#ffca28'; g.lineWidth = p.r * 0.7; g.stroke(); g.strokeStyle = '#fff8e1'; g.lineWidth = 1.6; for (const d of [-0.6, 0, 0.6]) { g.beginPath(); g.moveTo(kx, ky); g.lineTo(kx + Math.cos(d + 1.2) * p.r * 0.7, ky + Math.sin(d + 1.2) * p.r * 0.7); g.stroke(); } }
    // からだ: ふちどり → 金 → おなか（うすい 色、した がわ）→ つや
    const run = (lw, col, off) => { g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; for (let i = N; i >= 1; i--) { if (!vis(i) && !vis(i - 1)) continue; const p = segs[i], q = segs[i - 1], k = off || 0; g.lineWidth = lw(p); g.beginPath(); g.moveTo(p.x + p.nx * p.r * k, p.y + p.ny * p.r * k); g.lineTo(q.x + q.nx * q.r * k, q.y + q.ny * q.r * k); g.stroke(); } };
    run(p => p.r * 2 + 3, '#7a4a00'); run(p => p.r * 2, '#ffc107'); run(p => p.r * 0.8, '#fff3c4', 0.5); run(p => p.r * 0.45, 'rgba(255,255,230,.65)', -0.5);
    // しっぽの 先の 毛（ほのおの かたち）
    { const p = segs[N], q = segs[N - 2]; if (vis(N)) { const dx = p.x - q.x, dy = p.y - q.y, a = Math.atan2(dy, dx); g.save(); g.translate(p.x, p.y); g.rotate(a); g.fillStyle = '#ff8f00'; g.strokeStyle = '#7a4a00'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, -base * 0.3); g.quadraticCurveTo(base * 1.2, -base * (1.1 + 0.3 * Math.sin(t * 6)), base * 1.6, 0); g.quadraticCurveTo(base * 1.2, base * (1.1 + 0.3 * Math.sin(t * 6 + 1)), 0, base * 0.3); g.closePath(); g.fill(); g.stroke(); g.restore(); } }
    // あたま
    const hd = segs[0]; if (vis(0)) {
      const nb = segs[2], dir = f, hr = base * 1.35, tilt = Math.atan2(hd.y - nb.y, Math.abs(hd.x - nb.x) || 1) * 0.6;
      g.save(); g.translate(hd.x, hd.y); g.scale(dir, 1); g.rotate(tilt); g.lineJoin = 'round'; g.lineCap = 'round';
      // たてがみ（うしろに なびく）
      g.fillStyle = '#ff8f00'; g.strokeStyle = '#7a4a00'; g.lineWidth = 1.5;
      for (let k = 0; k < 3; k++) { const ph = Math.sin(t * 5 + k) * hr * 0.25; g.beginPath(); g.moveTo(-hr * 0.3, -hr * 0.6 + k * hr * 0.45); g.quadraticCurveTo(-hr * 1.3, -hr * 0.9 + k * hr * 0.5 + ph, -hr * 2.0, -hr * 0.5 + k * hr * 0.6 + ph); g.quadraticCurveTo(-hr * 1.2, -hr * 0.2 + k * hr * 0.45, -hr * 0.3, -hr * 0.1 + k * hr * 0.45); g.closePath(); g.fill(); g.stroke(); }
      // つの（えだ わかれ）
      g.strokeStyle = '#7a4a00'; g.lineWidth = 3.2; g.beginPath(); g.moveTo(-hr * 0.1, -hr * 0.75); g.quadraticCurveTo(-hr * 0.6, -hr * 1.7, -hr * 1.3, -hr * 1.9); g.moveTo(-hr * 0.55, -hr * 1.45); g.lineTo(-hr * 0.35, -hr * 1.95); g.stroke();
      g.strokeStyle = '#fff8e1'; g.lineWidth = 1.8; g.stroke();
      // した あご（ひらいた 口）
      const open = 0.15 + 0.12 * wave(t, 3, 0);
      g.fillStyle = '#ffca28'; g.strokeStyle = '#7a4a00'; g.lineWidth = 2;
      g.save(); g.rotate(open); g.beginPath(); g.moveTo(-hr * 0.2, hr * 0.15); g.quadraticCurveTo(hr * 1.0, hr * 0.55, hr * 1.9, hr * 0.25); g.lineTo(hr * 1.85, hr * 0.05); g.quadraticCurveTo(hr * 0.9, hr * 0.2, -hr * 0.2, 0); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#fff'; for (const tx of [0.9, 1.4]) { g.beginPath(); g.moveTo(hr * tx, hr * 0.12); g.lineTo(hr * (tx + 0.12), hr * -0.08); g.lineTo(hr * (tx + 0.24), hr * 0.12); g.fill(); } g.restore();
      // あたまと 上の はな（ながい）
      g.fillStyle = lin(g, 0, -hr, 0, hr * 0.3, ['#fff59d', '#ffca28', '#e0a000']);
      g.beginPath(); g.moveTo(-hr * 0.6, hr * 0.1); g.quadraticCurveTo(-hr * 0.7, -hr * 0.95, hr * 0.2, -hr * 0.85); g.quadraticCurveTo(hr * 0.7, -hr * 0.75, hr * 1.1, -hr * 0.4); g.quadraticCurveTo(hr * 1.9, -hr * 0.45, hr * 2.05, -hr * 0.05); g.quadraticCurveTo(hr * 2.0, hr * 0.15, hr * 1.7, hr * 0.12); g.quadraticCurveTo(hr * 0.8, hr * 0.15, -hr * 0.6, hr * 0.1); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#fff'; for (const tx of [1.0, 1.5]) { g.beginPath(); g.moveTo(hr * tx, hr * 0.12); g.lineTo(hr * (tx + 0.12), hr * 0.32); g.lineTo(hr * (tx + 0.24), hr * 0.12); g.fill(); }   // うえの きば
      g.fillStyle = '#7a4a00'; g.beginPath(); g.arc(hr * 1.85, -hr * 0.22, hr * 0.07, 0, 7); g.fill();   // はなの あな
      // め（まゆの したに あかい ひとみ）
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(hr * 0.35, -hr * 0.45, hr * 0.26, hr * 0.2, -0.2, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#d50000'; g.beginPath(); g.arc(hr * 0.42, -hr * 0.45, hr * 0.12, 0, 7); g.fill();
      g.strokeStyle = '#7a4a00'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(hr * 0.05, -hr * 0.68); g.quadraticCurveTo(hr * 0.4, -hr * 0.85, hr * 0.7, -hr * 0.6); g.stroke();
      // ひげ（ながく なびく）
      g.strokeStyle = '#fff3c4'; g.lineWidth = 1.8; const wv = Math.sin(t * 4) * hr * 0.4;
      g.beginPath(); g.moveTo(hr * 1.75, -hr * 0.2); g.quadraticCurveTo(hr * 2.3, -hr * 1.0 + wv, hr * 1.6, -hr * 1.5 + wv); g.moveTo(hr * 1.6, hr * 0.0); g.quadraticCurveTo(hr * 2.4, hr * 0.7 - wv, hr * 1.8, hr * 1.3 - wv); g.stroke();
      g.restore();
      twinkle(g, hd.x + dir * hr * 0.4, hd.y - hr * 0.5, 12, wave(t, 3, 1) > 0.7 ? (wave(t, 3, 1) - 0.7) * 3.3 : 0, '#fff8e1');
    }
  }
}
function fxBackMore(g, id, info, t, w, h, cx, cy) {
  const { x0, x1, y0, y1, pts } = info, facing = info.facing || 1, R = Math.random;
  if (id === 67 && R() < 0.1) info.spawn(x0 + R() * w, y0 + R() * h * 0.4, { vx: (R() - 0.5) * 40, vy: -50 - R() * 40, g: -0.03, c: R() < 0.5 ? '#ff4081' : '#ff80ab', life: 60, k: 'heart' });
  else if (id === 68 && R() < 0.08) info.spawn(x0 + R() * w, y0 + R() * h * 0.4, { vx: (R() - 0.5) * 60, vy: -60 - R() * 40, g: -0.03, c: ['#7c4dff', '#00b0ff', '#ff4081', '#ffab00'][R() * 4 | 0], life: 60, k: 'note', rot: (R() - 0.5) * 0.6 });
  else if (id === 69 && R() < 0.07) info.spawn(R() < 0.5 ? x0 : x1, y0 + R() * h, { vx: (R() - 0.5) * 50, vy: -30 - R() * 30, g: -0.02, c: '#b3e5fc', life: 100, k: 'bubble', r: 4 + R() * 5 });
  else if (id === 71 && R() < 0.08) info.spawn(x0 - w * 0.4 + R() * w * 1.8, y0 - h * 0.5 - R() * 20, { vx: (R() - 0.5) * 70, vy: 20 + R() * 20, g: 0.04, c: ['#7cb342', '#aed581', '#ffb300'][R() * 3 | 0], life: 90, k: 'leaf', rot: R() * 6, spin: (R() - 0.5) * 0.3 });
  else if (id === 72 && R() < 0.2) info.spawn(x0 - w * 0.6 + R() * w * 2.2, y0 - h * 0.8 - R() * 30, { vx: (R() - 0.5) * 20, vy: 30 + R() * 20, g: 0.01, c: '#ffffff', life: 120, k: 'snow', r: 1.5 + R() * 2 });
  else if (id === 74) {   // どく（★★）: みどりの もや・あわ
    const pulse = 0.5 + 0.5 * Math.sin(t * 3), Rr = Math.max(w, h) * 0.9;
    const gr = g.createRadialGradient(cx, cy, Rr * 0.2, cx, cy, Rr * (1 + 0.1 * pulse)); gr.addColorStop(0, 'rgba(118,255,3,' + (0.25 + 0.15 * pulse).toFixed(2) + ')'); gr.addColorStop(1, 'rgba(51,105,30,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, Rr * 1.1, Rr, 0, 0, 7); g.fill();
    if (R() < 0.08) info.spawn(x0 + R() * w, y1 - R() * h * 0.8, { vx: (R() - 0.5) * 30, vy: -40 - R() * 50, g: -0.03, c: R() < 0.5 ? '#76ff03' : '#b2ff59', life: 50, k: 'poison', r: 5 + R() * 4 });
  } else if (id === 76) {   // みず（★★）: まわる 水の おび・しぶき
    const Rr = Math.max(w, h) * 0.75;
    g.save(); g.lineCap = 'round';
    for (let i = 0; i < 2; i++) { const a0 = t * (3 + i) + i * 2; const gr = g.createLinearGradient(cx - Rr, cy, cx + Rr, cy); gr.addColorStop(0, 'rgba(129,212,250,0)'); gr.addColorStop(0.5, 'rgba(41,182,246,.8)'); gr.addColorStop(1, 'rgba(225,245,254,.9)'); g.strokeStyle = gr; g.lineWidth = 6 - i * 2; g.beginPath(); g.ellipse(cx, cy, Rr * (1 + i * 0.15), Rr * 0.35, (i ? -0.3 : 0.25), a0, a0 + 3.2); g.stroke(); }
    g.restore();
    if (R() < 0.15) { const a = R() * 6.28; info.spawn(cx + Math.cos(a) * Rr, cy + Math.sin(a) * Rr * 0.35, { vx: Math.cos(a) * 80, vy: -90 - R() * 60, c: '#4fc3f7', life: 35, k: 'drop' }); }
  } else if (id === 77) {   // かげぶんしん（★★）: うしろに かげの コピー
    for (let k = 3; k >= 1; k--) {
      const off = -facing * k * (12 + Math.sin(t * 7) * 3);
      g.save(); g.translate(off, Math.sin(t * 5 + k) * 2); g.globalAlpha = 0.28 / k + 0.06;
      g.beginPath(); g.moveTo(pts[0].x, pts[0].y); for (const p of pts) g.lineTo(p.x, p.y); g.closePath(); g.fillStyle = '#4a148c'; g.fill(); g.strokeStyle = '#ea80fc'; g.lineWidth = 2; g.stroke(); g.restore();
    }
  } else if (id === 78) {   // ドラゴンの つばさ（★★★）: はばたく つばさ・ふちが 光る
    const ay = y0 + h * 0.3, span = Math.max(h * 1.05, w * 0.9), flap = Math.sin(t * 5);
    for (const k of [-1, 1]) {
      const ax = k < 0 ? x0 + w * 0.25 : x1 - w * 0.25;
      g.save(); g.translate(ax, ay); g.scale(k, 1); g.rotate(-0.15 + flap * 0.28);
      const tips = [[span * 0.95, -span * 0.55], [span * 1.05, -span * 0.05], [span * 0.8, span * 0.35]];
      g.beginPath(); g.moveTo(0, 0); g.lineTo(span * 0.45, -span * 0.75); g.lineTo(tips[0][0], tips[0][1]);
      g.quadraticCurveTo(span * 0.72, -span * 0.2, tips[1][0], tips[1][1]); g.quadraticCurveTo(span * 0.62, span * 0.12, tips[2][0], tips[2][1]); g.quadraticCurveTo(span * 0.35, span * 0.25, 0, span * 0.15); g.closePath();
      g.fillStyle = lin(g, 0, -span * 0.7, span, span * 0.3, ['#4a148c', '#b71c1c', '#1a0033']); g.fill();
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,145,0,' + (0.55 + 0.35 * wave(t, 4, k)).toFixed(2) + ')'; g.lineWidth = 3; g.shadowColor = '#ff6d00'; g.shadowBlur = 12; g.stroke(); g.restore();
      g.strokeStyle = '#1a0010'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(span * 0.45, -span * 0.75); for (const tp of tips) { g.moveTo(span * 0.45, -span * 0.75); g.lineTo(tp[0], tp[1]); } g.stroke();
      g.restore();
    }
    if (R() < 0.2) info.spawn(cx + (R() - 0.5) * w * 2.4, y0 + R() * h * 0.5, { vx: (R() - 0.5) * 40, vy: -50 - R() * 50, g: -0.06, c: R() < 0.5 ? '#ff6d00' : '#ffab40', life: 40, k: 'ember' });
  } else if (id === 84) {   // きんの はね（おうえんの お礼）
    goldWings(g, info, t);
  } else if (id === 86) {   // ランタンおばけ（ハロウィンの 配布）
    ghostFx(g, info, t);
  } else if (id === 87) {   // おいわいふうせん（1 万人の おいわいの 配布）
    balloonFx(g, info, t);
  } else if (id === 79) {   // ブラックホール（★★★）: うずまく ひかりの わ・すいこまれる つぶ
    const Rr = Math.max(w, h) * 0.9;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { const a0 = t * (2.2 - i * 0.5) + i * 2; g.strokeStyle = ['rgba(255,145,0,.75)', 'rgba(234,64,251,.6)', 'rgba(255,241,118,.5)'][i]; g.lineWidth = 7 - i * 2; g.shadowColor = g.strokeStyle; g.shadowBlur = 16; g.beginPath(); g.ellipse(cx, cy, Rr * (1 - i * 0.12), Rr * 0.3 * (1 - i * 0.1), -0.25, a0, a0 + 4.2); g.stroke(); }
    g.restore();
    const hole = g.createRadialGradient(cx, cy, Rr * 0.1, cx, cy, Rr * 0.62); hole.addColorStop(0, 'rgba(0,0,0,1)'); hole.addColorStop(0.7, 'rgba(10,0,20,.95)'); hole.addColorStop(0.85, 'rgba(124,77,255,.6)'); hole.addColorStop(1, 'rgba(124,77,255,0)');
    g.fillStyle = hole; g.beginPath(); g.arc(cx, cy, Rr * 0.62, 0, 7); g.fill();
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) { const ph = (t * 0.45 + hash(i)) % 1, a = hash(i + 7) * 6.28 + ph * 7, rr = Rr * 1.5 * (1 - ph); g.fillStyle = 'rgba(255,' + (180 + (i % 3) * 25) + ',255,' + (1 - ph).toFixed(2) + ')'; g.beginPath(); g.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.55, 1.2 + (1 - ph) * 1.6, 0, 7); g.fill(); }
    g.restore();
  } else if (id === 80) {   // きんいろの ひかり（★★★）: そらからの 光の すじ・金の かがやき
    const sx = cx, sy = y0 - h * 1.6, len = h * 3.2;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) { const a = Math.PI / 2 + (i - 3) * 0.12 + Math.sin(t * 0.8 + i) * 0.04, wd = 0.045 + 0.02 * wave(t, 2, i); const gr = g.createLinearGradient(sx, sy, sx + Math.cos(a) * len, sy + Math.sin(a) * len); gr.addColorStop(0, 'rgba(255,236,179,' + (0.35 + 0.2 * wave(t, 3, i)).toFixed(2) + ')'); gr.addColorStop(1, 'rgba(255,215,64,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a - wd) * len, sy + Math.sin(a - wd) * len); g.lineTo(sx + Math.cos(a + wd) * len, sy + Math.sin(a + wd) * len); g.closePath(); g.fill(); }
    const gl = g.createRadialGradient(cx, cy, Math.max(w, h) * 0.2, cx, cy, Math.max(w, h) * 1.0); gl.addColorStop(0, 'rgba(255,215,64,' + (0.3 + 0.15 * wave(t, 2.5, 0)).toFixed(2) + ')'); gl.addColorStop(1, 'rgba(255,215,64,0)'); g.fillStyle = gl; g.beginPath(); g.arc(cx, cy, Math.max(w, h), 0, 7); g.fill();
    g.restore();
  }
}
function fxFrontMore(g, id, info, t, w, h, cx, cy) {
  const { x0, x1, y0, y1 } = info, R = Math.random;
  if (id === 73) {   // ふぶき（★★）: まわる こおりの かけら・つめたい もや
    const Rr = Math.max(w, h) * 0.8;
    g.save(); g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(cx, cy, Rr * 0.3, cx, cy, Rr * 1.1); gr.addColorStop(0, 'rgba(179,229,252,0)'); gr.addColorStop(0.7, 'rgba(179,229,252,.18)'); gr.addColorStop(1, 'rgba(179,229,252,0)'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, Rr * 1.1, 0, 7); g.fill();
    for (let i = 0; i < 8; i++) { const a = t * 2.6 + i * 0.785, px = cx + Math.cos(a) * Rr, py = cy + Math.sin(a) * Rr * 0.4; g.save(); g.translate(px, py); g.rotate(a * 2); g.fillStyle = 'rgba(225,245,254,.9)'; g.beginPath(); g.moveTo(0, -6); g.lineTo(3, 0); g.lineTo(0, 6); g.lineTo(-3, 0); g.closePath(); g.fill(); g.restore(); }
    g.restore();
    if (R() < 0.2) info.spawn(cx + (R() - 0.5) * w * 1.6, cy + (R() - 0.5) * h, { vx: (R() - 0.5) * 160, vy: -30 - R() * 40, g: 0.2, c: '#e1f5fe', life: 30, k: 'shard', rot: R() * 6 });
  } else if (id === 75) {   // かぜ（★★）: まわる かぜの すじ
    const Rr = Math.max(w, h) * 0.78;
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const a0 = t * 4 + i * 2.09, rx = Rr * (0.95 + i * 0.1), ry = Rr * (0.3 + i * 0.08), yy = cy + (i - 1) * h * 0.25; for (let s = 0; s < 6; s++) { const a = a0 - s * 0.12; g.strokeStyle = 'rgba(224,247,250,' + (0.7 * (1 - s / 6)).toFixed(2) + ')'; g.lineWidth = 3.5 - s * 0.4; g.beginPath(); g.ellipse(cx, yy, rx, ry, 0.1, a, a + 0.14); g.stroke(); } }
    g.restore();
  } else if (id === 80) {   // きんいろの ひかり（まえ）: ふりそそぐ 金の きらきら
    for (let i = 0; i < 8; i++) { const ph = (t * 0.35 + hash(i + 90)) % 1; twinkle(g, x0 - w * 0.4 + w * 1.8 * hash(i + 91), y0 - h * 0.8 + ph * h * 2.1, 7 + 4 * hash(i), Math.sin(ph * Math.PI), '#ffe57f'); }
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
  if (p.k === 'feather') {   // きんの はね の 舞う 羽根
    p.rot = (p.rot || 0) + (p.spin || 0);
    g.save(); g.globalAlpha = a; g.translate(p.x, p.y); g.rotate(p.rot + Math.sin(p.life * 0.15) * 0.5);
    g.fillStyle = p.c; g.beginPath(); g.ellipse(0, 0, 7, 2.6, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(141,90,0,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-7, 0); g.lineTo(7, 0); g.stroke(); g.restore();
    return true;
  }
  if (p.k === 'ember' || p.k === 'wisp') {
    const r = (p.k === 'wisp' ? 5 : 3.2) * Math.min(1, p.life / 25);
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
    const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.2); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, p.c); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, r * 2.2, 0, 7); g.fill(); g.restore();
    return true;
  }
  const age = (p.age = (p.age || 0) + 1);
  g.save(); g.globalAlpha = a;
  if (p.k === 'heart') { heart(g, p.x + Math.sin(age * 0.15) * 3, p.y, 5, p.c); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(p.x - 2 + Math.sin(age * 0.15) * 3, p.y - 2, 1.2, 0, 7); g.fill(); }
  else if (p.k === 'note') {
    g.translate(p.x + Math.sin(age * 0.12) * 4, p.y); g.rotate(p.rot || 0); g.fillStyle = p.c; g.strokeStyle = p.c; g.lineWidth = 1.8;
    g.beginPath(); g.ellipse(0, 0, 3.6, 2.6, -0.4, 0, 7); g.fill(); g.beginPath(); g.moveTo(3, -1); g.lineTo(3, -12); g.quadraticCurveTo(7, -9, 8, -5); g.stroke();
  } else if (p.k === 'bubble') {
    const r = (p.r || 6) * (1 + age * 0.004);
    const gr = g.createRadialGradient(p.x - r * 0.3, p.y - r * 0.3, 0, p.x, p.y, r); gr.addColorStop(0, 'rgba(255,255,255,.05)'); gr.addColorStop(0.8, 'rgba(179,229,252,.18)'); gr.addColorStop(1, 'rgba(234,128,252,.35)');
    g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, r, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.ellipse(p.x - r * 0.4, p.y - r * 0.4, r * 0.25, r * 0.15, -0.7, 0, 7); g.fill();
  } else if (p.k === 'leaf') { p.rot = (p.rot || 0) + (p.spin || 0.1); p.vx += Math.sin(age * 0.08) * 3; g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = p.c; g.beginPath(); g.ellipse(0, 0, 5.5, 2.6, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-5, 0); g.lineTo(5, 0); g.stroke(); }
  else if (p.k === 'snow') { p.vx += Math.sin(age * 0.07 + p.x) * 2; g.fillStyle = '#ffffff'; g.shadowColor = '#e1f5fe'; g.shadowBlur = 4; g.beginPath(); g.arc(p.x, p.y, p.r || 2, 0, 7); g.fill(); }
  else if (p.k === 'poison') { const r = p.r || 4; g.fillStyle = 'rgba(118,255,3,.35)'; g.strokeStyle = p.c; g.lineWidth = 1.2; g.beginPath(); g.arc(p.x, p.y, r, 0, 7); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(p.x - r * 0.35, p.y - r * 0.35, r * 0.25, 0, 7); g.fill(); }
  else if (p.k === 'shard') { p.rot = (p.rot || 0) + 0.3; g.globalCompositeOperation = 'lighter'; g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = p.c; g.beginPath(); g.moveTo(0, -5); g.lineTo(2.2, 0); g.lineTo(0, 5); g.lineTo(-2.2, 0); g.closePath(); g.fill(); }
  else if (p.k === 'dust') { const r = 3 + age * 0.35; g.globalAlpha = a * 0.55; g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, r, 0, 7); g.arc(p.x + r * 0.7, p.y + 1, r * 0.7, 0, 7); g.arc(p.x - r * 0.6, p.y + 1.5, r * 0.6, 0, 7); g.fill(); }
  else { g.restore(); return false; }
  g.restore(); return true;
}

root.KZ = { SLOTS, SLOT_LABEL, ITEMS, PRICE, DUP_BACK, RATE, WIN, CLEAR, MULTI_PRICE, MULTI_N, store, earn, winReward, pull, pullMulti, drawHead, drawFace, drawBody, fxBack, fxFront, drawPart, star, heart, twinkle };
})(typeof module !== 'undefined' ? module.exports : window);
