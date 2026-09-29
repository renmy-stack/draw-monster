// かいて！モンスターバトル — 描く画面（からだ・うで・あし）・バトルの描画・勝ち抜き・モンスターを送る
'use strict';
const VERSION = '117';
// あそびの きろく（/t.js。なくても うごく）
window.T_VER = VERSION;
function TR(e, d) { try { if (window.T) window.T(e, d); } catch (err) {} }
// Safari が おぼえていた 古い ページ（index.html）と 新しい game.js が まざると、部品（kazari.js など）が なくて 止まる
// → 1 回だけ、URL に 印を つけて ページごと 読みなおす（2026-09-29 の 解析で 見つかった）
if (!window.KZ || !window.KZStage || !window.RB || !window.eventThemeOf || !document.getElementById('langbtn') || !document.getElementById('evbtn')) {   // 古い index.html（あたらしい ボタン・event.js が ない）も
  let tried = ''; try { tried = sessionStorage.getItem('mon.fix') || ''; } catch (e) {}
  if (tried !== VERSION) {
    try { sessionStorage.setItem('mon.fix', VERSION); } catch (e) {}
    TR('stalefix', { k: !!window.KZ, s: !!window.KZStage, b: !!document.getElementById('langbtn') });
    location.replace(location.pathname + (location.search ? location.search + '&' : '?') + 'nc=' + Date.now() + location.hash);
    throw new Error('reload for new version');
  }
}
// 記録を 軽く（2026-09-28）: モンスターの 形は この セッションで はじめての ときだけ 'design' で 送り、たたかいの 記録には 番号（d）だけ 入れる
// 強さ（形から 計算できる）・当てた回数・ダメージ・残り HP は 送らない。たたかいは 終わった とき（result）か やめた とき（quit）に 1 件
const sentDesigns = new Map();
function designRef(d) { const c = RB.encodeDesign(d); let k = sentDesigns.get(c); if (!k) { k = sentDesigns.size + 1; sentDesigns.set(c, k); TR('design', { d: k, c }); } return k; }
// ホーム画面から開いていないとき（Safari の中）は 下のバーぶん あける
if (!(window.navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches))) document.body.classList.add('browser');   // version.txt と合わせる。更新したら index.html の ?v= も上げる
const SITE_URL = 'https://renmygames.com/draw-monster/';

const $ = id => document.getElementById(id);
const cv = $('game'), ctx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
const ME = { name: 'じぶん', color: '#1e88e5' };
const FRIEND = { name: 'ともだち', color: '#2e7d32' };
const P2 = { name: '2P', color: '#e53935' };
// ふたりで たたかう（ひとつの端末で 1P → 2P の順に描く）。vs = { step: 1|2, d1, d2, backup }。この間は 勝ち抜き・保存中のモンスターに さわらない
let vs = null;
// 王冠: うら 5 人抜きした モンスター（形そのもの）。1 本でも 描きなおすと べつの モンスター
function plainCode(d) { return RB.encodeDesign({ body: d.body, arm: d.arm, leg: d.leg }); }
// 王冠・でんせつの 一覧は 形の 短い 印（11 もじ前後）で おぼえる。形 そのもの（〜400 もじ）だと 遊びこむほど データが 大きく なる（2026-09-29）
function codeTag(c) { let a = 0x811c9dc5, b = 0x9e3779b9; for (let i = 0; i < c.length; i++) { const x = c.charCodeAt(i); a = Math.imul(a ^ x, 16777619) >>> 0; b = Math.imul(b ^ x, 2246822519) >>> 0; } return a.toString(36) + b.toString(36).slice(0, 5); }
function tagList(k) { try { return JSON.parse(lsGet(k) || '[]').map(c => String(c).length > 16 ? codeTag(String(c)) : String(c)); } catch (e) { return []; } }
function crownedList() { return tagList('crowned'); }
function isCrowned(d) { return !!d && crownedList().includes(codeTag(plainCode(d))); }
function legendList() { return tagList('legend'); }
// チャンピオン メダル: ランクせんで 1 位に なった 形 → 日数（{ 形: 日数 }）
function champMap() { try { return JSON.parse(lsGet('champ') || '{}'); } catch (e) { return {}; } }
function withCrown(d) { if (d) { const c = plainCode(d); d.crown = d.crown || isCrowned(d); d.legend = d.legend || legendList().includes(codeTag(c)); d.champ = Math.max(d.champ || 0, champMap()[c] || 0); } return d; }
const PARTS = { body: 'からだ', arm: 'うで', leg: 'あし' };
const PART_HINT = {
  body: '<b>からだ</b> を かこむように かいてね',
  arm: '<b>かた</b>（きいろい ●）から <b>うで</b> を かいてね',
  leg: '<b>こし</b>（きいろい ●）から <b>あし</b> を かいてね',
};

// ---------- 記録 ----------
const KEY = 'drawrobot.';
function lsGet(k) { try { return localStorage.getItem(KEY + k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(KEY + k, v); } catch (e) {} }
// うら の並びを 変えたときは うら の途中経過と「倒したことがある」を 消す
const URA_VER = '2';
try { if (lsGet('uraver') !== URA_VER) { localStorage.removeItem(KEY + 'ura.stage'); localStorage.removeItem(KEY + 'ura.beaten'); lsSet('uraver', URA_VER); } } catch (e) {}
// でんどういり・でんせつの 記録は 形つきで 最新 HALL_KEEP こ だけ のこし、数は 〜.n に。王冠・でんせつの 一覧は 印に（前の 版の データを 1 回だけ 直す）
const HALL_KEEP = 24;
try {
  for (const k of ['crowned', 'legend']) { const a = JSON.parse(lsGet(k) || '[]'); if (a.some(c => String(c).length > 16)) lsSet(k, JSON.stringify([...new Set(tagList(k))])); }
  for (const k of ['hall', 'legendhall']) { const a = JSON.parse(lsGet(k) || '[]'); if (lsGet(k + '.n') == null) lsSet(k + '.n', String(a.length)); if (a.length > HALL_KEEP) lsSet(k, JSON.stringify(a.slice(-HALL_KEEP))); }
} catch (e) {}
try { if (lsGet('simv') !== String(RB.SIM_VERSION)) { localStorage.removeItem(KEY + 'stage'); localStorage.removeItem(KEY + 'ura.stage'); lsSet('simv', String(RB.SIM_VERSION)); } } catch (e) {}
// 描きかけの線（3 本）と、完成したモンスター
let strokes = { body: null, arm: null, leg: null };
let myRobot = null;
{ const w = lsGet('robot'); if (w) { const d = RB.decodeDesign(w); if (d) { myRobot = d; strokes = { body: d.body, arm: d.arm, leg: d.leg }; } } }
// 勝ち抜きは おもて と うら（おもてを クリアすると 出る）。記録は べつべつ（うらは キーの頭に 'ura.'）
// うら は おもてクリアで 出る（2026-09-26 に一般公開）。?uratest を開いた端末は クリア前でも 出る（オーナーのテスト用）
if (/[?&]uratest(=|&|$)/.test(location.search)) lsSet('uratest', '1');
let URA_TEST = lsGet('uratest') === '1';
let uraOpen = URA_TEST || lsGet('cleared') === '1';   // おもてを クリアしたら 出る（オーナーの端末は テスト用に いつでも）
// みんなの さいきょう ぐんだん（3 つめの 勝ち抜き）: うらを クリアした 人に 出る（?minnatest の 端末は いつでも）
if (/[?&]minnatest(=|&|$)/.test(location.search)) lsSet('minnatest', '1');
let MINNA_OPEN = lsGet('minnatest') === '1' || lsGet('ura.cleared') === '1';   // うらを クリアしたら 出る
const SIDE_LABEL = { omote: 'おもて', ura: 'うら', minna: 'みんな' };
// タイトルの 整理（v75）: おもて → うら → みんな を「ぼうけん」の 1 本道に。v77 で 全員に 公開（前は ?titletest の 端末だけ）
const TITLE_TEST = true;
// かざり（v78〜）: コインと ガチャで 見た目だけの かざり。v93 で 全員に 公開（オーナー OK）
// ?gachatest を 開いた 端末（オーナー）だけ 確認用の 一覧（?kzgallery）と 当たりの 見本（?kzreveal）が 使える
if (/[?&]gachatest(=|&|$)/.test(location.search)) lsSet('gachatest', '1');
const KZ_ON = true, KZ_OWNER = lsGet('gachatest') === '1';
// ランクせんの「じゅんい カード」: 2026-09-29 全員に 公開（前は ?cardtest の 端末だけ）
if (/[?&]cardtest(=|&|$)/.test(location.search)) lsSet('cardtest', '1');
const CARD_ON = true;
// モンスターの ほぞん 12 こ（2026-09-29 全員に。前は 3 こ）
const SLOT_N = 12;
// 「データの ひきつぎ」: 2026-09-29 全員に 公開（前は ?backuptest の 端末だけ）
if (/[?&]backuptest(=|&|$)/.test(location.search)) lsSet('backuptest', '1');
const BK_ON = true;
const kzs = KZ.store(k => lsGet(k), (k, v) => lsSet(k, v));
function withKz(d) { if (d && KZ_ON) { const e = kzs.eq(); d.kz = e.some(Boolean) ? e : null; } return d; }
let side = uraOpen && lsGet('side') === 'ura' ? 'ura' : MINNA_OPEN && lsGet('side') === 'minna' ? 'minna' : 'omote';
const sk = n => (side === 'omote' ? '' : side + '.') + n;
function CPUS() { return side === 'ura' ? RB.URA : side === 'minna' ? RB.MINNA : RB.CPU; }
let stage = 0, cleared = false, best = 0, beaten = [];
function loadSide() {
  stage = Math.min(CPUS().length - 1, +(lsGet(sk('stage')) || 0));
  cleared = lsGet(sk('cleared')) === '1';
  best = +(lsGet(sk('best')) || 0);   // さいこう 何人抜き
  try { beaten = JSON.parse(lsGet(sk('beaten')) || '[]'); } catch (e) { beaten = []; }
}
loadSide();
// 一度でも倒した CPU（はやおくり が使える）は beaten
let fast = lsGet('fast') === '1';
const FAST = 4;
// 勝ち抜き: 途中でモンスターを変えたら 1 体目から。負けたら その挑戦は おわり
function resetRun() { stage = 0; lsSet(sk('stage'), '0'); }
// モンスターを描きかえたら おもて・うら 両方の途中経過を 1 たいめに
function resetAllRuns() { stage = 0; lsSet('stage', '0'); lsSet('ura.stage', '0'); }
let friendRobot = null;
{ const m = /[#&]r=([A-Za-z0-9_-]+)/.exec(location.hash); if (m) friendRobot = RB.decodeDesign(m[1]); }

// ---------- 画面 ----------
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  sizePad(); if (mode === 'draw') drawPad();
}
window.addEventListener('resize', resize);
function show(id) { for (const k of ['title', 'draw', 'result', 'sharebox', 'slotbox', 'handoff', 'rank', 'ev', 'more']) $(k).hidden = k !== id; $('quit').hidden = id !== 'none'; $('fast').hidden = id !== 'none' || !canFast(); updateFastBtn(); navSync(id); }
// はやおくり: 一度でも倒した CPU との戦いだけ
function canFast() { return mode === 'battle' && !isFriend && !!beaten[S && S.stage != null ? S.stage : stage]; }
function updateFastBtn() { $('fast').textContent = fast ? '▶ ふつう' : '▶▶ はやおくり'; $('fast').classList.toggle('on', fast); }

let mode = 'title', part = 'body';
function showTitle() {
  mode = 'title'; show('title');
  $('friendbox').hidden = !friendRobot;
  if (friendRobot) drawPreview($('friendprev'), friendRobot, FRIEND.color);
  renderHall();
  // じぶんの モンスター（絵・すすみぐあい・ランクせん）
  $('tmycard').hidden = !myRobot;
  if (myRobot) drawPreview($('tmon'), withRibbon(withKz(withCrown(myRobot))), ME.color);
  $('kzrow').hidden = !KZ_ON || !myRobot;
  if (KZ_ON) $('kzcoins').textContent = '🪙 ' + kzs.coins();
  const ob = +(lsGet('best') || 0), ub = +(lsGet('ura.best') || 0), mb = +(lsGet('minna.best') || 0);
  const chip = (label, n, done, cls) => '<span class="chip ' + cls + (done ? ' done' : '') + '">' + label + ' ' + (done ? 'クリア' : n + '/5') + '</span>';
  $('trecord').hidden = !ob && !uraOpen;   // この スマホで どこまで 進んだか（モンスター ごとでは ない）
  $('tprog').innerHTML = chip('おもて', ob, uraOpen, 'c-omote') + (uraOpen ? chip('うら', ub, lsGet('ura.cleared') === '1', 'c-ura') : '') + (MINNA_OPEN ? chip('みんな', mb, lsGet('minna.cleared') === '1', 'c-minna') : '');
  $('start').textContent = myRobot ? 'たたかう・なおす' : 'モンスターを つくる';
  if (TITLE_TEST) renderRoad();
  // モード
  $('minnabtn').hidden = !MINNA_OPEN;
  $('minnacap').textContent = lsGet('minna.cleared') === '1' ? 'たおした！ もういちど ちょうせん' : 'うらを クリアした みんなの 5 たい';
  $('minnaabout').hidden = !MINNA_OPEN;
  $('rankbtn').hidden = !RANK_ON;
  if (RANK_ON) titleRank();
  $('evbtn').hidden = !EV_ON;
  if (EV_ON) { const t = evTheme(); $('evcap').textContent = '🎀 ' + PART_DAY[t.part] + evq(t.name); }
  if (TITLE_TEST) { $('minnabtn').hidden = true; $('minnaabout').hidden = !MINNA_OPEN || side !== 'minna'; }
  { const n = [...document.querySelectorAll('.modes > .mode')].filter(el => !el.hidden).length; document.querySelector('.modes').classList.toggle('odd', n % 2 === 1); }
  // コレクション（でんせつ・でんどういり）
  const nl = hallCount('legendhall'), nh = hallCount('hall');
  $('collection').hidden = !nl && !nh;
  $('collsum').textContent = 'コレクション　' + (nl ? '⭐ でんせつ ' + nl + '　' : '') + (nh ? '👑 でんどういり ' + nh : '');
  drawTitleBg();
}
// ぼうけんの 道: 出ている 段は タップで えらべる（えらんだ 段が「たたかう」の 相手）。まだの 段は ？？？
function renderRoad() {
  $('trecord').hidden = true; $('start').parentNode.style.display = 'none'; $('adv').hidden = false;
  $('tmchint').textContent = '✏ タップで なおす・えらぶ';
  const open = { omote: true, ura: uraOpen, minna: MINNA_OPEN };
  const road = $('road'); road.innerHTML = '';
  ['omote', 'ura', 'minna'].forEach((s, i) => {
    if (i) { const ln = document.createElement('i'); ln.className = 'rd-line' + (open[s] ? ' on' : ''); road.appendChild(ln); }
    const k = n => (s === 'omote' ? '' : s + '.') + n;
    const done = lsGet(k('cleared')) === '1' || (s === 'omote' && uraOpen && !URA_TEST);
    const b = document.createElement('button');
    b.className = 'rd-node rd-' + s + (open[s] ? '' : ' locked') + (done ? ' done' : '') + (open[s] && side === s ? ' sel' : '');
    const st = +(lsGet(k('stage')) || 0);
    b.innerHTML = open[s] ? '<b>' + SIDE_LABEL[s] + '</b><small>' + (done ? '✓ クリア' : (st + 1) + ' / 5') + '</small>' : '<b>？？？</b><small>&nbsp;</small>';
    b.disabled = !open[s];
    if (open[s]) onTap(b, () => { if (side === s) return; side = s; lsSet('side', s); loadSide(); TR('road', { s }); showTitle(); });
    road.appendChild(b);
  });
  const go = $('advgo');
  if (!myRobot) { go.innerHTML = 'モンスターを つくる'; go.className = 'main advgo'; return; }
  go.innerHTML = '▶ たたかう<small>' + SIDE_LABEL[side] + ' ' + (stage + 1) + ' / ' + CPUS().length + ' ' + CPUS()[stage].name + '</small>';
  go.className = 'main advgo' + (side === 'ura' ? ' ura' : side === 'minna' ? ' minna' : '');
}
onTap($('advgo'), () => {
  if (!myRobot) { showDraw(); return; }
  TR('advgo', { side, stage });
  if (side === 'minna' && lsGet('minna.intro') !== '1') { minnaStartAfterInfo = true; showMinnaInfo(); return; }
  startBattle(false);
});
function showDraw() {
  TR('draw', null);
  mode = 'draw'; show('draw');
  if (!strokes.body) part = 'body'; else if (!strokes.arm) part = 'arm'; else if (!strokes.leg) part = 'leg';
  if (evd && part === evd.t.part) part = evd.t.part === 'body' ? 'arm' : 'body';
  $('fightfriend').hidden = !friendRobot;
  updateSideUi();
  setPart(part);
  if (vs) setHint((vs.step === 1 ? '1P' : '2P') + ' の モンスターを かいてね' + (myRobot ? '（まえの モンスターが はいってるよ）' : ''));
  else if (evd) setHint('きょうの お題：' + PARTS[evd.t.part] + ' は' + evq(evd.t.name) + '（かえられない）');
  else if (stage > 0) setHint('かちぬき ちゅう：モンスターを かえると 1 たいめから');
  sizePad(); drawPad();   // 文字やボタンが決まってから 測る
}
function setPart(p) {
  if (evd && p === evd.t.part) { setHint('きょうは ' + PARTS[p] + ' は きまった かたち' + evq(evd.t.name) + 'だよ'); return; }
  part = p;
  for (const t of document.querySelectorAll('.tab')) {
    t.classList.toggle('on', t.dataset.part === p);
    t.classList.toggle('done', !!strokes[t.dataset.part]);
    t.classList.toggle('lock', !!evd && t.dataset.part === evd.t.part);
  }
  $('dhead').innerHTML = PART_HINT[p];
  if (evd) { const sp = document.createElement('span'); sp.className = 'evlock'; sp.textContent = '🔒 ' + PARTS[evd.t.part] + ' は きょうの お題' + evq(evd.t.name); $('dhead').append(sp); }
  setHint(''); drawPad(); updateButtons();
}
for (const t of document.querySelectorAll('.tab')) t.addEventListener('click', e => { e.preventDefault(); setPart(t.dataset.part); });

// ---------- 描くパッド ----------
const pad = $('pad'), pctx = pad.getContext('2d');
const PW = RB.PAD.x1 - RB.PAD.x0, PH = RB.PAD.y1 - RB.PAD.y0;
let PS = 300, raw = null;
function setPadSize(w) {
  PS = w;
  pad.style.width = w + 'px'; pad.style.height = w * PH / PW + 'px';
  pad.width = Math.round(w * DPR); pad.height = Math.round(w * PH / PW * DPR);
}
// パッドを いちど大きめにして、描く画面が はみ出したぶんだけ 縮める（Safari のバー・強さのバー・ボタンの高さは 画面ごとに ちがうので 測る）
function sizePad() {
  let w = Math.min(W - 32, 420 * PW / PH);
  setPadSize(w);
  const d = $('draw');
  if (d.hidden) return;
  const over = d.scrollHeight - d.clientHeight;
  if (over > 0) setPadSize(Math.max(150, w - over * PW / PH - 4));
}
function toWorld(e) { const r = pad.getBoundingClientRect(); const s = PW / r.width; return [(e.clientX - r.left) * s + RB.PAD.x0, (e.clientY - r.top) * s + RB.PAD.y0]; }
function current() {
  // いま見せるモンスター（描いている途中の線も反映）
  const s = Object.assign({}, strokes);
  if (raw) s[part] = RB.cleanStroke(raw, RB.INK[part]);
  if (!s.body || s.body.length < 3) return { body: s.body, arm: null, leg: null };
  return RB.design(s.body, s.arm || [], s.leg || []);
}
function drawPad() {
  const g = pctx, s = PS / PW;
  g.setTransform(DPR * s, 0, 0, DPR * s, -RB.PAD.x0 * DPR * s, -RB.PAD.y0 * DPR * s);
  g.fillStyle = '#1f2250'; g.fillRect(RB.PAD.x0, RB.PAD.y0, PW, PH);
  g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1;
  for (let x = -100; x <= 100; x += 20) { g.beginPath(); g.moveTo(x, RB.PAD.y0); g.lineTo(x, RB.PAD.y1); g.stroke(); }
  for (let y = -220; y <= 20; y += 20) { g.beginPath(); g.moveTo(RB.PAD.x0, y); g.lineTo(RB.PAD.x1, y); g.stroke(); }
  const d = current();
  if (d.body && d.body.length > 1) {
    const full = d.arm !== null;
    drawRobotLocal(g, d, padColor(), full ? 1 : 0.9, raw && part === 'body');
    if (full) {
      const blink = 0.55 + 0.45 * Math.sin(performance.now() / 250);
      for (const [k, jp] of [['arm', d.shoulder], ['leg', d.hip]]) {
        g.fillStyle = part === k ? 'rgba(255,214,0,' + blink + ')' : 'rgba(255,214,0,.35)';
        g.beginPath(); g.arc(jp[0], jp[1], part === k ? 7 : 4, 0, 7); g.fill();
      }
    }
  } else if (raw) { g.strokeStyle = padColor(); g.lineWidth = 4; pline(g, RB.cleanStroke(raw, RB.INK.body)); g.stroke(); }
}
// かざりの からだの もよう と かお（pts = 体の 点 {x, y}、g は 体の 座標。local: 描く画面・絵 と同じ 目の 位置 / でなければ バトル）
function kzBodyFace(g, pts, kz, facing, local, down, t) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
  const path = () => { g.beginPath(); g.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y); g.closePath(); };
  if (kz[2]) {
    g.save(); path(); g.clip();
    KZ.drawBody(g, kz[2], x0, y0, x1, y1);
    g.restore();
    path(); g.strokeStyle = '#0d1030'; g.lineWidth = 4; g.stroke();
    if (local) { const w = x1 - x0; face(g, (x, y) => [x, y], x0 + w * 0.62, y0 + Math.min(22, w * 0.3 + 8), Math.max(3.5, Math.min(8, w * 0.1)), 1, false); }
  }
  if (kz[1] && !down) {
    const w = x1 - x0, r = Math.max(3.5, Math.min(8, w * 0.1));
    const ex = local ? x0 + w * 0.62 : (x0 + x1) / 2 + facing * w * 0.12, ey = y0 + Math.min(22, w * 0.3 + 8);
    KZ.drawFace(g, kz[1], ex, ey, r, facing);
  }
}
// モンスターをパッド座標のまま描く（まっすぐ立った姿）
function drawRobotLocal(g, d, color, alpha, open) {
  g.globalAlpha = alpha; g.lineCap = 'round'; g.lineJoin = 'round';
  // うしろの足（180° 反対）
  if (d.leg && d.leg.length > 1) { const back = d.leg.map(p => [2 * d.hip[0] - p[0], 2 * d.hip[1] - p[1]]); limb(g, back, '#37474f', 0.55); }
  body(g, d.body, color, open, d);
  const kz = d.kz || [0, 0, 0, 0];
  if (!open && d.body && d.body.length > 2 && (kz[1] || kz[2])) kzBodyFace(g, d.body.map(p => ({ x: p[0], y: p[1] })), kz, 1, true, false);
  if (d.leg && d.leg.length > 1) limb(g, d.leg, '#455a64', 1);
  if (d.arm && d.arm.length > 1) arm(g, d.arm, color);
  if ((d.crown || d.legend || kz[0]) && d.body && d.body.length > 2) {
    const c = crownSpot(d.body.map(p => ({ x: p[0], y: p[1] })));
    const hh = kz[0] ? KZ.drawHead(g, kz[0], c.x, c.y - 1, c.hs) : 0;   // かざりの ぼうしの 上に 王冠・星
    if (d.crown) drawCrown(g, c.x, c.y - 1 - hh, c.s);
    if (d.legend) drawStar(g, c.x, c.y - 1 - hh - (d.crown ? c.s * 0.8 : 0) - c.s * 0.45, c.s * 0.45);
  }
  if (d.champ && d.body && d.body.length > 2) { const m = medalSpot(d.body.map(p => ({ x: p[0], y: p[1] })), 1, true); drawMedal(g, m.x, m.y, m.r); }
  if (d.ribbon && d.body && d.body.length > 2) { const m = medalSpot(d.body.map(p => ({ x: p[0], y: p[1] })), 1, true); drawRibbon(g, m.x - (d.champ ? m.r * 2.4 : 0), m.y - m.r * 0.6, m.r * 0.8, d.ribbon); }
  g.globalAlpha = 1;
}
// チャンピオン メダルを さげる所: 口の すぐ 下（首元）。顔と 同じ 計算で 目の 位置を 出す（local: 描く画面・絵 / world: バトル）
function medalSpot(pts, facing, local) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity;
  for (const p of pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); }
  const w = x1 - x0, ex = local ? x0 + w * 0.62 : (x0 + x1) / 2 + facing * w * 0.12, ey = y0 + Math.min(22, w * 0.3 + 8), r = Math.max(3.5, Math.min(8, w * 0.1));
  const mr = Math.max(5, Math.min(11, r * 1.35));
  return { x: ex + facing * r * 0.4, y: ey + r * 3.3 + mr * 1.9, r: mr };
}
// チャンピオン メダル（リボン＋金の 丸＋うきぼりの 星）: x, y が 丸の まんなか。数字は 入れない（順位と まちがえる ため）
function drawMedal(g, x, y, r) {
  g.lineWidth = Math.max(1.2, r * 0.13); g.strokeStyle = '#3e2723'; g.lineJoin = 'round';
  g.fillStyle = '#e53935'; g.beginPath(); g.moveTo(x - r * 0.95, y - r * 1.9); g.lineTo(x - r * 0.15, y - r * 1.9); g.lineTo(x + r * 0.1, y - r * 0.55); g.lineTo(x - r * 0.5, y - r * 0.55); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#1e88e5'; g.beginPath(); g.moveTo(x + r * 0.15, y - r * 1.9); g.lineTo(x + r * 0.95, y - r * 1.9); g.lineTo(x + r * 0.5, y - r * 0.55); g.lineTo(x - r * 0.1, y - r * 0.55); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#ffc107'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke();
  g.strokeStyle = '#ffe082'; g.lineWidth = Math.max(1, r * 0.1); g.beginPath(); g.arc(x, y, r * 0.74, 0, 7); g.stroke();
  g.fillStyle = '#e0a000'; g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.24 : r * 0.55; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.fill();
}
// イベントの リボン（銀の ちょうむすび。メダルより 小さく じみ）: x, y が むすびめ。2 かい いじょう とったら むすびめに 数
function drawRibbon(g, x, y, r, n) {
  g.lineWidth = Math.max(1, r * 0.14); g.strokeStyle = '#37474f'; g.lineJoin = 'round';
  g.fillStyle = '#90a4ae';
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + s * r * 0.9, y + r * 1.9); g.lineTo(x + s * r * 0.35, y + r * 1.6); g.lineTo(x + s * r * 0.1, y + r * 1.9); g.closePath(); g.fill(); g.stroke(); }
  g.fillStyle = '#cfd8dc';
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + s * r * 1.5, y - r * 1.3, x + s * r * 1.5, y); g.quadraticCurveTo(x + s * r * 1.5, y + r * 1.1, x, y); g.fill(); g.stroke(); }
  g.fillStyle = '#eceff1'; g.beginPath(); g.arc(x, y, r * 0.5, 0, 7); g.fill(); g.stroke();
  if (n >= 2) { g.fillStyle = '#263238'; g.font = '900 ' + Math.round(r * 0.8) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(Math.min(n, 99)), x, y + r * 0.04); }
}
// 王冠を のせる所: 体の いちばん上の あたり（上から 8 以内の 点）の まんなか
function crownSpot(pts) {
  let y0 = Infinity, x0 = Infinity, x1 = -Infinity;
  for (const p of pts) { y0 = Math.min(y0, p.y); x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); }
  let sx = 0, n = 0; for (const p of pts) if (p.y <= y0 + 8) { sx += p.x; n++; }
  return { x: sx / n, y: y0, s: Math.max(18, Math.min(40, (x1 - x0) * 0.5)), hs: Math.max(24, Math.min(66, (x1 - x0) * 0.6)) };   // hs = かざりの ぼうしの はば（王冠より 大きめ）
}
// 王冠（見た目だけ）: x, y が 下のまんなか、s が はば
function drawCrown(g, x, y, s) {
  const h = s * 0.75;
  g.beginPath();
  g.moveTo(x - s / 2, y); g.lineTo(x + s / 2, y); g.lineTo(x + s / 2, y - h); g.lineTo(x + s / 4, y - h * 0.45);
  g.lineTo(x, y - h * 1.05); g.lineTo(x - s / 4, y - h * 0.45); g.lineTo(x - s / 2, y - h); g.closePath();
  g.fillStyle = '#ffd54f'; g.fill(); g.lineWidth = Math.max(2, s * 0.08); g.strokeStyle = '#7a5c00'; g.stroke();
  g.fillStyle = '#e53935';
  for (const [px, py] of [[x - s / 2, y - h], [x, y - h * 1.05], [x + s / 2, y - h]]) { g.beginPath(); g.arc(px, py, s * 0.09, 0, 7); g.fill(); }
  g.fillStyle = '#42a5f5'; g.beginPath(); g.arc(x, y - h * 0.3, s * 0.1, 0, 7); g.fill();
}
// でんせつの 星（x, y が まんなか、r が 半径）
function drawStar(g, x, y, r) {
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.fillStyle = '#ffeb3b'; g.fill(); g.lineWidth = Math.max(2, r * 0.14); g.strokeStyle = '#b8860b'; g.stroke();
}
function body(g, pts, color, open, d) {
  pline(g, pts); if (!open) g.closePath();
  if (!open) { g.fillStyle = color; g.fill(); }
  g.strokeStyle = '#0d1030'; g.lineWidth = 4; g.stroke();
  if (open) return;
  // 光
  g.save(); pline(g, pts); g.closePath(); g.clip();
  g.fillStyle = 'rgba(255,255,255,.18)'; let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity;
  for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); }
  g.fillRect(x0, y0, x1 - x0, (y1 - y0) * 0.3);
  g.restore();
  // 目
  if (d && d.shoulder) eyes(g, pts, d.shoulder);
}
function eyes(g, pts, sh) {
  let y0 = Infinity, x0 = Infinity, x1 = -Infinity;
  for (const p of pts) { y0 = Math.min(y0, p[1]); x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); }
  const w = x1 - x0, ex = x0 + w * 0.62, ey = y0 + Math.min(22, w * 0.3 + 8), r = Math.max(3.5, Math.min(8, w * 0.1));
  face(g, (x, y) => [x, y], ex, ey, r, 1, false);
}
// モンスターの顔: 目 2 つ ＋ キバの見える口。down（ダウン中）は バッテン目と あいた口
// tf = 体の座標 → 描く座標（体が傾いていても顔が一緒に回る）
function face(g, tf, ex, ey, r, facing, down) {
  const pt = (x, y) => tf(ex + x, ey + y);
  for (const dx of [-r * 1.4, r * 1.4]) {
    if (down) {
      g.strokeStyle = '#0d1030'; g.lineWidth = Math.max(1.5, r * 0.4); g.lineCap = 'round';
      const a = pt(dx - r * 0.7, -r * 0.7), b = pt(dx + r * 0.7, r * 0.7), c = pt(dx - r * 0.7, r * 0.7), d = pt(dx + r * 0.7, -r * 0.7);
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.moveTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.stroke();
      continue;
    }
    const e = pt(dx, 0), q = pt(dx + facing * r * 0.35, 0);
    g.fillStyle = '#fff'; g.beginPath(); g.arc(e[0], e[1], r, 0, 7); g.fill();
    g.fillStyle = '#0d1030'; g.beginPath(); g.arc(q[0], q[1], r * 0.5, 0, 7); g.fill();
  }
  // 口（前寄り）とキバ
  const mx = facing * r * 0.4, my = r * 2.2, mw = r * 1.6;
  const L = pt(mx - mw, my), R = pt(mx + mw, my), C = pt(mx, my + (down ? r * 1.4 : r * 0.9));
  g.fillStyle = '#0d1030'; g.beginPath(); g.moveTo(L[0], L[1]); g.quadraticCurveTo(C[0], C[1] + (C[1] - L[1]) * 0.6, R[0], R[1]); g.closePath(); g.fill();
  g.fillStyle = '#fff';
  for (const fx of [-0.55, 0.55]) {
    const a = pt(mx + mw * fx - r * 0.3, my), b = pt(mx + mw * fx + r * 0.3, my), c = pt(mx + mw * fx, my + r * 0.55);
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.closePath(); g.fill();
  }
}
function limb(g, pts, color, alpha) {
  const a = g.globalAlpha; g.globalAlpha = a * alpha;
  g.strokeStyle = '#0d1030'; g.lineWidth = 10; pline(g, pts); g.stroke();
  g.strokeStyle = color; g.lineWidth = 6.5; pline(g, pts); g.stroke();
  g.globalAlpha = a;
}
function arm(g, pts, color) {
  g.strokeStyle = '#0d1030'; g.lineWidth = 10; pline(g, pts); g.stroke();
  g.strokeStyle = shade(color, 0.25); g.lineWidth = 6.5; pline(g, pts); g.stroke();
  const e = pts[pts.length - 1];
  g.fillStyle = '#0d1030'; g.beginPath(); g.arc(e[0], e[1], 9, 0, 7); g.fill();
  g.fillStyle = '#ffca28'; g.beginPath(); g.arc(e[0], e[1], 6.5, 0, 7); g.fill();
}
function pline(g, pts) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); }
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return 'rgb(' + f(r) + ',' + f(gg) + ',' + f(b) + ')';
}
// anim: ガチャ画面の 見本（毎フレーム 呼ぶ）。えふぇくとも 動かして 見せる
function drawPreview(c, d, color, anim) {
  const g = c.getContext('2d');
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const k of ['body', 'arm', 'leg']) for (const p of d[k]) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  // 王冠と でんせつの 星の ぶんも 上に 入れる（はみ出さない ように）
  const hat = d.kz && d.kz[0];
  if ((d.crown || d.legend || hat) && d.body && d.body.length > 2) { const cs = crownSpot(d.body.map(p => ({ x: p[0], y: p[1] }))); y0 = Math.min(y0, cs.y - (d.crown ? cs.s * 0.8 : 0) - (d.legend ? cs.s * 0.95 : 0) - (hat ? cs.hs * 1.05 : 0)); }
  const fx = anim && d.kz && d.kz[3] && d.body && d.body.length > 2 ? d.kz[3] : 0;
  if (fx) { const big = [24, 73, 75, 76, 78, 79, 80].includes(fx) ? 60 : 30; y0 -= 55; x0 -= big; x1 += big; y1 += 10; }   // えふぇくとの ぶん 広く（つばさ・ブラックホール などは もっと）
  const s = Math.min(c.width / (x1 - x0 + 40), c.height / (y1 - y0 + 40));
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height);
  g.setTransform(s, 0, 0, s, c.width / 2 - (x0 + x1) / 2 * s, c.height / 2 - (y0 + y1) / 2 * s);
  if (fx) kzPrevFx(c, g, d, fx, false);
  drawRobotLocal(g, d, color, 1, false);
  if (fx) kzPrevFx(c, g, d, fx, true);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}
// 見本の えふぇくと: ほのお・かみなり・オーラ は バトルと 同じ 絵、はな・ほし・あせ は 歩いた／当たった ことに して 出す
const kzPrev = new WeakMap();
function kzPrevFx(c, g, d, fx, front) {
  let st = kzPrev.get(c); if (!st || st.fx !== fx) { st = { parts: [], last: performance.now(), n: 0, fx }; kzPrev.set(c, st); }
  const pts = d.body.map(p => ({ x: p[0], y: p[1] }));
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
  const info = { x0, x1, y0, y1, pts, facing: 1, spawn: (x, y, q) => st.parts.push(Object.assign({ x, y }, q)) };
  if (!front) { KZ.fxBack(g, fx, info); return; }
  KZ.fxFront(g, fx, info);
  let floor = -Infinity; for (const p of d.leg) floor = Math.max(floor, p[1]);
  const foot = d.leg[d.leg.length - 1], fist = d.arm[d.arm.length - 1], w = x1 - x0;
  const now = performance.now(), dt = Math.min(0.05, (now - st.last) / 1000); st.last = now; st.n++;
  if (fx === 19 && st.n % 10 === 0) st.parts.push({ x: foot[0] + (Math.random() - 0.5) * w * 1.2, y: floor, vx: 0, vy: 0, g: 0, c: ['#f48fb1', '#ce93d8', '#fff59d', '#80deea'][Math.random() * 4 | 0], life: 100, k: 'flower', rot: Math.random() * 6 });
  if (fx === 20 && st.n % 35 === 0) for (let i = 0; i < 8; i++) { const a = Math.random() * 6.28, v = 200 * (0.5 + Math.random()); st.parts.push({ x: fist[0], y: fist[1], vx: Math.cos(a) * v, vy: Math.sin(a) * v - 140, c: '#ffeb3b', life: 40, k: 'star' }); }
  if (fx === 21 && st.n % 18 === 0) { const sd = Math.random() < 0.5 ? -1 : 1; st.parts.push({ x: x0 + w * (0.5 + sd * 0.45), y: y0 + 12, vx: sd * 80, vy: -140, c: '#81d4fa', life: 40, k: 'drop' }); }
  if (fx === 70 && st.n % 7 === 0) st.parts.push({ x: foot[0] + (Math.random() - 0.5) * w * 0.8, y: floor - 2, vx: (Math.random() - 0.5) * 40, vy: -15, g: -0.02, c: '#bcaaa4', life: 30, k: 'dust' });
  for (let i = st.parts.length - 1; i >= 0; i--) {
    const p = st.parts[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * (p.g == null ? 1 : p.g) * dt; p.vx *= 0.96;
    if (--p.life <= 0 || p.y > floor + 1) { st.parts.splice(i, 1); continue; }
    KZ.drawPart(g, p);
  }
}
pad.addEventListener('pointerdown', e => { if (evd && part === evd.t.part) return; raw = [toWorld(e)]; try { pad.setPointerCapture(e.pointerId); } catch (er) {} e.preventDefault(); drawPad(); });
pad.addEventListener('pointermove', e => { if (!raw) return; raw.push(toWorld(e)); e.preventDefault(); drawPad(); });
const endStroke = () => {
  if (!raw) return;
  const pts = RB.cleanStroke(raw, RB.INK[part]); raw = null;
  const need = part === 'body' ? 80 : 20;
  if (pts.length < 2 || RB.inkOf(pts) < need) { setHint('もうすこし おおきく かいてね'); drawPad(); return; }
  strokes[part] = pts;
  if (!vs && !evd && (stage > 0 || +(lsGet('stage') || 0) > 0 || +(lsGet('ura.stage') || 0) > 0)) { resetAllRuns(); updateSideUi(); }
  if (part === 'body' && (strokes.arm || strokes.leg)) setHint('からだを かえたので、うで・あしも くっつけなおしたよ');
  else setHint('');
  saveRobot();
  // つぎのパーツへ
  const next = !strokes.body ? 'body' : !strokes.arm ? 'arm' : !strokes.leg ? 'leg' : part;
  setPart(next === part && part !== 'leg' && !strokes[next] ? part : next);
};
pad.addEventListener('pointerup', endStroke); pad.addEventListener('pointercancel', endStroke);
function saveRobot() {
  myRobot = null;
  if (strokes.body && strokes.arm && strokes.leg) {
    const d = RB.design(strokes.body, strokes.arm, strokes.leg);
    if (RB.validDesign(d)) { myRobot = withCrown(d); if (evd) { lsSet('ev.robot', RB.encodeDesign(d)); lsSet('ev.robotday', evd.day); } else if (!vs) lsSet('robot', RB.encodeDesign(d)); }
  }
  updateButtons();
}
function setHint(t) { $('hint').textContent = t; }
function updateButtons() { $('fight').disabled = !myRobot; $('fightfriend').disabled = !myRobot; $('send').disabled = !myRobot; updateStats(); }
// つよさのバー（モンスターができているときだけ）
function updateStats() {
  const st = myRobot ? RB.robotStats(myRobot) : null;
  const set = (k, v, max, txt) => { $('b-' + k).style.width = (st ? Math.min(100, v / max * 100) : 0) + '%'; $('v-' + k).textContent = st ? txt : ''; };
  set('hp', st && st.hp, 250, st && String(st.hp));
  set('punch', st && st.punch, 22, st && st.punch.toFixed(0));
  set('reach', st && st.reach, 150, st && String(Math.round(st.reach)));
  set('speed', st && st.speed, 6, st && st.speed.toFixed(1));
}

// ---------- バトル ----------
let S = null, opp = null, acc = 0, last = 0, stop = 0, shake = 0, parts = [], pops = [], hurt = { A: 0, B: 0 }, endAt = 0, isFriend = false, cam = null;
function startBattle(friend) {
  if (!myRobot) return;
  isFriend = !!friend;
  opp = friend ? { name: FRIEND.name, color: FRIEND.color, d: friendRobot } : { name: CPUS()[stage].name, color: CPUS()[stage].color, d: CPUS()[stage] };
  S = RB.create(myRobot, opp.d); S.stage = stage; S.side = friend ? 'friend' : side; S.crownA = !!myRobot.crown; S.crownB = !!opp.d.crown; S.legendA = !!myRobot.legend; S.legendB = !!opp.d.legend; S.champA = myRobot.champ || 0; S.champB = opp.d.champ || 0;
  S.d = designRef(myRobot);
  S.kzA = withKz(myRobot).kz || null; S.kzB = opp.d.kz || null;
  acc = 0; last = performance.now(); stop = 0; shake = 0; parts = []; pops = []; hurt = { A: 0, B: 0 }; endAt = 0; cam = null;
  mode = 'battle'; show('none');
}
function stepBattle() {
  RB.step(S);
  for (const e of S.fx) {
    if (e.t === 'hit') {
      hurt[e.who === 'A' ? 'B' : 'A'] = 10;
      stop = Math.min(10, 3 + Math.round(e.dmg / 2)); shake = Math.max(shake, 3 + e.dmg * 0.6);
      burst(e.x, e.y, '#ffd54f', 10 + Math.round(e.dmg * 1.5), 320);
      const kzw = e.who === 'A' ? S.kzA : S.kzB;
      if (kzw && kzw[3] === 20) for (let i = 0; i < 7; i++) { const a = rnd() * 6.28, v = 260 * (0.5 + rnd()); parts.push({ x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 160, c: '#ffeb3b', life: 40, k: 'star' }); }   // かざり: パンチで ほし
      pops.push({ x: e.x, y: e.y - 10, t: e.dmg.toFixed(0), c: e.who === 'A' ? '#ffd54f' : '#ff8a80', life: 55, size: 20 + Math.min(20, e.dmg * 1.2) });
    } else if (e.t === 'down') {
      pops.push({ x: e.x, y: e.y - 90, t: 'ダウン！', c: '#ffffff', life: 60, size: 26 });
    } else if (e.t === 'end') { endAt = performance.now(); if (S.reason === 'ko') { stop = 40; shake = 14; } }
  }
  S.fx.length = 0;
}
let seed = 1;
function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
function burst(x, y, c, n, sp) { for (let i = 0; i < n; i++) { const a = rnd() * 6.28, v = sp * (0.3 + rnd()); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 100, c, life: 20 + rnd() * 25 }); } }

function frame(now) {
  if (mode === 'battle') {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (!S.over) {
      const sp = canFast() && fast ? FAST : 1;
      if (stop > 0) stop = sp > 1 ? 0 : stop - 1;   // はやおくり中は ヒットの止め を はぶく
      else { acc += dt * sp; let n = 0; while (acc >= RB.DT && n < 48 * sp) { stepBattle(); acc -= RB.DT; n++; if (S.over || (stop > 0 && sp === 1)) break; } if (n >= 48 * sp) acc = 0; }
    } else if (now - endAt > (canFast() && fast ? 600 : 1800)) showResult();
    renderBattle(dt);
  } else if (mode === 'draw') drawPad();
  else if (mode === 'pause') renderBattle(0);
  else if (mode === 'ending') renderEnding(now);
  requestAnimationFrame(frame);
}

// カメラ: 2 体が入るように寄る
function camera() {
  const x0 = Math.min(S.A.x, S.B.x) - 115, x1 = Math.max(S.A.x, S.B.x) + 115;
  const cx = (x0 + x1) / 2, k = Math.min(W / (x1 - x0), (H - 200) / 300, 1.7);
  if (!cam) cam = { x: cx, k };
  cam.x += (cx - cam.x) * 0.1; cam.k += (k - cam.k) * 0.06;
  return cam;
}
function renderBattle(dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const ura = S.side === 'ura', minna = S.side === 'minna';
  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, ura ? '#1a0610' : minna ? '#04161a' : '#15173a'); sky.addColorStop(1, ura ? '#4a0f1f' : minna ? '#0f3d3a' : '#3a2a63');   // うらは 赤黒い、みんなは 青緑
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  const c = camera(), gy = H * 0.72;
  let sx = 0, sy = 0; if (shake > 0) { sx = (rnd() - .5) * shake; sy = (rnd() - .5) * shake; shake *= 0.86; if (shake < 0.3) shake = 0; }
  ctx.save(); ctx.translate(W / 2 + sx, gy + sy); ctx.scale(c.k, c.k); ctx.translate(-c.x, 0);
  // 観客席のライト
  ctx.fillStyle = 'rgba(124,131,255,.08)';
  for (let x = -RB.HW - 200; x < RB.HW + 200; x += 90) { ctx.beginPath(); ctx.moveTo(x, -420); ctx.lineTo(x + 40, 0); ctx.lineTo(x - 40, 0); ctx.fill(); }
  // かべ
  ctx.fillStyle = '#2b2f6b';
  ctx.fillRect(-RB.HW - 60, -500, 60, 520); ctx.fillRect(RB.HW, -500, 60, 520);
  // ゆか
  ctx.fillStyle = '#4b3f8f'; ctx.fillRect(-RB.HW - 300, 0, 2 * RB.HW + 600, 200);
  ctx.fillStyle = '#7c83ff'; ctx.fillRect(-RB.HW, 0, 2 * RB.HW, 5);
  ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 2;
  for (let x = -RB.HW; x <= RB.HW; x += 60) { ctx.beginPath(); ctx.moveTo(x, 5); ctx.lineTo(x * 1.3, 120); ctx.stroke(); }
  for (const k of ['B', 'A']) drawRobotWorld(S[k], k === 'A' ? (S.leftColor || ME.color) : opp.color, hurt[k] > 0, k === 'A' ? S.crownA : S.crownB);
  for (const k of ['A', 'B']) if (hurt[k] > 0) hurt[k]--;
  // かけら・数字
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * (p.g == null ? 1 : p.g) * dt; p.vx *= 0.96;
    if (--p.life <= 0 || p.y > 0.5) { parts.splice(i, 1); continue; }
    if (p.k && KZ.drawPart(ctx, p)) continue;   // かざりの かけら（ほし・はな・あせ・火の粉・気）
    ctx.fillStyle = p.c; ctx.globalAlpha = Math.min(1, p.life / 15);
    ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
  }
  ctx.globalAlpha = 1;
  for (let i = pops.length - 1; i >= 0; i--) {
    const p = pops[i]; p.y -= 0.8; if (--p.life <= 0) { pops.splice(i, 1); continue; }
    ctx.globalAlpha = Math.min(1, p.life / 15);
    ctx.font = '900 ' + p.size + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 6; ctx.strokeStyle = '#15173a'; ctx.strokeText(p.t, p.x, p.y); ctx.fillStyle = p.c; ctx.fillText(p.t, p.x, p.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  drawHud();
}
// かざりの えふぇくと（バトル中だけ。見た目だけで 強さには 関係ない）: 足もと・あせ は ここで、ほのお・かみなり・オーラ は kazari.js の fxBack / fxFront
function kzFx(fx, tf, w, ex, ey, legA, legB) {
  if (fx === 21 && Math.random() < 0.06) { const s = Math.random() < 0.5 ? -1 : 1, p = tf(ex + s * w * 0.35, ey - 4); parts.push({ x: p[0], y: p[1], vx: s * 90, vy: -150, c: '#81d4fa', life: 40, k: 'drop' }); }   // あせ
  else if (fx === 70) { for (const L of [legA, legB]) { const f = L[L.length - 1]; if (f[1] > -8 && Math.random() < 0.15) parts.push({ x: f[0], y: -2, vx: (Math.random() - 0.5) * 50, vy: -20, g: -0.02, c: '#bcaaa4', life: 30, k: 'dust' }); } }   // すなぼこり
  else if (fx === 19) { for (const L of [legA, legB]) { const f = L[L.length - 1]; if (f[1] > -8 && Math.random() < 0.12) parts.push({ x: f[0], y: 0, vx: 0, vy: 0, g: 0, c: ['#f48fb1', '#ce93d8', '#fff59d', '#80deea'][Math.random() * 4 | 0], life: 110, k: 'flower', rot: Math.random() * 6 }); } }   // あしあとに はな
}
// かざりの ほのお・かみなり・オーラを 体の 座標で（back: 体の うしろ / front: まえ）
function kzFxLayer(b, fx, front) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of b.bodyPts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
  const co = Math.cos(b.th), si = Math.sin(b.th);
  const spawn = (lx, ly, q) => parts.push(Object.assign({ x: b.x + lx * co - ly * si, y: b.y + lx * si + ly * co }, q));
  ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.th);
  (front ? KZ.fxFront : KZ.fxBack)(ctx, fx, { x0, x1, y0, y1, pts: b.bodyPts, spawn, facing: b.facing });
  ctx.restore();
}
// モンスターを ワールドに（シミュレーションの点を そのまま使う）
function drawRobotWorld(b, color, flash, crown) {
  const co = Math.cos(b.th), si = Math.sin(b.th);
  const tf = (lx, ly) => [b.x + lx * co - ly * si, b.y + lx * si + ly * co];
  // 影
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(b.x, 3, 60, 8, 0, 0, 7); ctx.fill();
  const joint = j => {
    const h = tf(j.ox, j.oy), cj = Math.cos(j.a), sj = Math.sin(j.a);
    return j.pts.map(p => [h[0] + p.x * cj - p.y * sj, h[1] + p.x * sj + p.y * cj]);
  };
  const legPts = joint(b.leg), n = Math.ceil(legPts.length / 2);
  const legA = legPts.slice(0, n), legB = [legPts[0]].concat(legPts.slice(n));
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  limb(ctx, legB, '#37474f', 0.6);
  const poly = b.bodyPts.map(p => tf(p.x, p.y));
  const bodyCol = flash ? '#ffffff' : color;
  if (S.side === 'ura' && b === S.B) { ctx.shadowColor = '#ff1744'; ctx.shadowBlur = 26; }
  if ((S.side === 'minna' && b === S.B) || (b === S.A && S.legendA) || (b === S.B && S.legendB)) { ctx.shadowColor = '#ffd54f'; ctx.shadowBlur = 26; }   // みんなの 敵と でんせつの モンスターは 金に 光る   // みんなの 敵は 金に 光る   // うらの敵は 赤く光る
  const kz = (b === S.A ? S.kzA : S.kzB) || null;
  if (kz && kz[3] && (mode === 'battle' || mode === 'pause')) { const sc = ctx.shadowColor, sb = ctx.shadowBlur; ctx.shadowBlur = 0; kzFxLayer(b, kz[3], false); ctx.shadowColor = sc; ctx.shadowBlur = sb; }   // かざり: 体の うしろの えふぇくと
  if (kz && kz[2] === 18) ctx.globalAlpha = 0.45;   // かざり: クリスタル（すきとおる）
  pline(ctx, poly); ctx.closePath(); ctx.fillStyle = bodyCol; ctx.fill();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.save(); pline(ctx, poly); ctx.closePath(); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(b.x - 300, b.y - 300, 600, 300 + (-120));
  ctx.restore();
  ctx.strokeStyle = '#0d1030'; ctx.lineWidth = 4; pline(ctx, poly); ctx.closePath(); ctx.stroke();
  if (kz && kz[2] && !flash) { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.th); kzBodyFace(ctx, b.bodyPts, [0, 0, kz[2], 0], b.facing, false, false, performance.now() / 1000); ctx.restore(); }
  // 目（体の上のほう・前寄り）
  let top = null; for (const p of b.bodyPts) if (!top || p.y < top.y) top = p;
  let x0 = Infinity, x1 = -Infinity; for (const p of b.bodyPts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); }
  const w = x1 - x0, r = Math.max(3.5, Math.min(8, w * 0.1));
  const ex = (x0 + x1) / 2 + b.facing * w * 0.12, ey = top.y + Math.min(22, w * 0.3 + 8);
  const down = b.downT > 0 || b.hp <= 0;
  face(ctx, tf, ex, ey, r, b.facing, down);
  if (kz && kz[1]) { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.th); kzBodyFace(ctx, b.bodyPts, [0, kz[1], 0, 0], b.facing, false, down); ctx.restore(); }
  const legend = (b === S.A && S.legendA) || (b === S.B && S.legendB), hat = kz ? kz[0] : 0;
  if (crown || legend || hat) { const cs = crownSpot(b.bodyPts), c = tf(cs.x, cs.y); ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(b.th); const hh = hat ? KZ.drawHead(ctx, hat, 0, -1, cs.hs) : 0; if (crown) drawCrown(ctx, 0, -1 - hh, cs.s); if (legend) drawStar(ctx, 0, -1 - hh - (crown ? cs.s * 0.8 : 0) - cs.s * 0.45, cs.s * 0.45); ctx.restore(); }
  if (kz && kz[3] && (mode === 'battle' || mode === 'pause')) kzFx(kz[3], tf, w, ex, ey, legA, legB);
  const champ = b === S.A ? S.champA : S.champB;
  if (champ) { const ms = medalSpot(b.bodyPts, b.facing, false), c = tf(ms.x, ms.y); ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(b.th); drawMedal(ctx, 0, 0, ms.r); ctx.restore(); }
  limb(ctx, legA, '#455a64', 1);
  arm(ctx, joint(b.arm), color);
  if (kz && kz[3] && (mode === 'battle' || mode === 'pause')) kzFxLayer(b, kz[3], true);   // かざり: 体の まえの えふぇくと
}
function drawHud() {
  const top = 12, bw = (W - 110) / 2;
  const bar = (x, hp, max, name, col, right) => {
    ctx.font = '800 14px sans-serif'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = right ? 'right' : 'left'; ctx.fillStyle = '#fff';
    ctx.fillText(name, right ? x + bw : x, top + 16);
    ctx.fillStyle = 'rgba(255,255,255,.15)'; round(x, top + 24, bw, 14, 7); ctx.fill();
    const w = bw * hp / max;
    ctx.fillStyle = hp > max / 2 ? col : hp > max / 4 ? '#ffb300' : '#e53935'; round(right ? x + bw - w : x, top + 24, Math.max(0, w), 14, 7); ctx.fill();
    ctx.font = '900 12px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = right ? 'right' : 'left';
    ctx.fillText(Math.ceil(hp), right ? x + bw - 4 : x + 4, top + 35);
  };
  bar(12, S.A.hp, S.A.maxHp, S.leftName || (S.side === 'vs' ? '1P' : ME.name), S.leftColor || ME.color, false);
  bar(W - 12 - bw, S.B.hp, S.B.maxHp, opp.name, S.side === 'ura' ? '#ff5252' : opp.color, true);   // うらの敵は色が暗いので バーは赤
  ctx.textAlign = 'center'; ctx.font = '900 26px sans-serif'; ctx.fillStyle = S.t > RB.TIME - 5 ? '#ff8a80' : '#fff';
  ctx.fillText(Math.max(0, Math.ceil(RB.TIME - S.t)), W / 2, top + 34);
  if (!isFriend) { ctx.font = '700 12px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText((S.side === 'ura' ? 'うら ' : S.side === 'minna' ? 'みんなの さいきょう ' : '') + 'かちぬき ' + (S.stage + 1) + ' / ' + CPUS().length, W / 2, top + 54); }
  if (S.t < 1) big('ファイト！', '#ffd54f', 1 - S.t);
  if (S.over) big(S.reason === 'ko' ? 'KO！' : 'じかんぎれ', S.winner === 'A' ? '#ffd54f' : '#ff8a80', 1);
}
function big(t, c, a) {
  ctx.globalAlpha = Math.max(0, Math.min(1, a));
  ctx.font = '900 ' + Math.min(72, W * 0.16) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 10; ctx.strokeStyle = '#15173a'; ctx.strokeText(t, W / 2, H * 0.32);
  ctx.fillStyle = c; ctx.fillText(t, W / 2, H * 0.32); ctx.globalAlpha = 1;
}
function round(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
// タイトルの後ろ: CPU モンスターを並べる
function drawTitleBg() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#15173a'); sky.addColorStop(1, '#3a2a63');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#4b3f8f'; ctx.fillRect(0, H - 60, W, 60);
}

// ---------- 結果 ----------
function showResult() {
  mode = 'result'; show('result');
  TR('result', { side: S.side, stage: S.stage, opp: opp && opp.name, win: S.winner === 'A' ? 'win' : S.winner === 'B' ? 'lose' : 'draw', reason: S.reason, t: Math.round(S.t * 10) / 10, d: S.d, fast: fast });
  $('share').hidden = false; $('vstitle').hidden = true; $('redraw').hidden = false; $('redraw').textContent = 'モンスターを なおす';
  $('cert').hidden = true; $('torank').hidden = true;
  $('next').textContent = 'つぎの あいてへ'; $('next').classList.remove('ura', 'minna'); $('again').className = 'main'; goUra = false; goMinna = false;
  if (S.side === 'vs') {
    $('rtitle').textContent = S.winner === 'A' ? '1P の かち！' : S.winner === 'B' ? '2P の かち！' : 'ひきわけ';
    $('rtitle').className = 'rtitle ' + (S.winner ? 'win' : '');
    $('rsub').textContent = (S.reason === 'ko' ? 'KO（' + S.t.toFixed(1) + ' びょう）' : 'じかんぎれ') + '\nのこり HP　1P ' + Math.ceil(S.A.hp) + '　2P ' + Math.ceil(S.B.hp);
    $('rprog').innerHTML = '';
    $('next').hidden = false; $('next').innerHTML = 'もういちど<small>なおして たたかう</small>';
    $('again').hidden = false; $('again').textContent = 'おなじ たたかいを みる'; $('again').className = 'sub';
    $('redraw').hidden = true; $('share').hidden = true; $('vstitle').hidden = false;
    return;
  }
  if (S.side === 'rank') {
    const mine = S.winner === S.meSide, draw0 = S.winner == null;
    $('rtitle').textContent = draw0 ? 'ひきわけ' : mine ? 'かち！' : 'まけ…';
    $('rtitle').className = 'rtitle ' + (draw0 ? '' : mine ? 'win' : 'lose');
    $('rsub').textContent = (S.rankKind === 'replay' ? 'リプレイ' : 'れんしゅうじあい（てんすうは かわらない）') + '\n' + (S.reason === 'ko' ? 'KO（' + S.t.toFixed(1) + ' びょう）' : 'じかんぎれ（のこり HP ' + Math.ceil(S.A.hp) + ' たい ' + Math.ceil(S.B.hp) + '）');
    $('rprog').innerHTML = '';
    $('next').hidden = true; $('again').hidden = false; $('again').className = 'main'; $('again').textContent = 'もういちど みる';
    $('share').hidden = true; $('redraw').hidden = S.rankKind !== 'practice'; $('redraw').textContent = 'モンスターを なおす';
    $('vstitle').hidden = false; $('vstitle').textContent = S.evBattle ? 'イベントへ もどる' : 'ランクせんへ もどる';
    return;
  }
  const win = S.winner === 'A', draw = S.winner == null;
  $('rtitle').textContent = win ? 'かち！' : draw ? 'ひきわけ' : 'まけ…';
  $('rtitle').className = 'rtitle ' + (win ? 'win' : draw ? '' : 'lose');
  $('rsub').textContent = (S.reason === 'ko' ? 'KO（' + S.t.toFixed(1) + ' びょう）' : 'じかんぎれ（のこり HP ' + Math.ceil(S.A.hp) + ' たい ' + Math.ceil(S.B.hp) + '）') + '\nパンチ ' + S.A.hits + ' はつ・ダメージ ' + Math.round(S.A.dealt);
  let showNext = false, wins = stage;
  if (!isFriend) {
    if (win) {
      wins = stage + 1;
      if (!beaten[stage]) { beaten[stage] = true; lsSet(sk('beaten'), JSON.stringify(beaten)); }
      if (stage < CPUS().length - 1) { stage++; lsSet(sk('stage'), String(stage)); showNext = true; }
      else {
        cleared = true; lsSet(sk('cleared'), '1'); resetRun();
        if (side === 'ura') { onUraClear(); }
        if (side === 'minna') { onMinnaClear(); $('rsub').textContent += '\nみんなの さいきょう ぐんだん を\nたおした！！！\nでんせつ の モンスター に なった！'; }
        if (side === 'ura') { $('rsub').textContent += '\nうら 5 たい かちぬき たっせい！！\nすごすぎる！'; const firstM = !MINNA_OPEN; MINNA_OPEN = true; $('rsub').textContent += firstM ? '\n…みんなの さいきょう ぐんだん が\nあらわれた！' : '\nみんなの さいきょう ぐんだん が\nまってるぞ…！'; goMinna = true; }
        else if (side === 'omote') { $('rsub').textContent += '\n5 たい かちぬき たっせい！'; const firstUra = !uraOpen; uraOpen = true; $('rsub').textContent += firstUra ? '\n…うら かちぬき が あらわれた！' : '\nうら かちぬき が まってるぞ…！'; goUra = true; }
      }
    } else {
      resetRun();
      $('rsub').textContent += '\n' + wins + ' にんぬき で おわり';
    }
    if (wins > best) { best = wins; lsSet(sk('best'), String(best)); $('rsub').textContent += '\nさいこう きろく！'; }
    // かざりの コイン: 同じ 形で 同じ 相手に 勝つたび 半分（形を 変えれば 元どおり）
    if (KZ_ON && win) {
      const rw = KZ.winReward(kzs, plainCode(myRobot), S.side, S.stage, S.stage === CPUS().length - 1);
      TR('coin', { s: S.side, st: S.stage, got: rw.got, n: rw.n });
      $('rsub').textContent += '\n🪙 +' + rw.got + (rw.got === 0 ? '（おなじ かたちで かちすぎ！ かたちを かえると もどるよ）' : rw.n > 0 ? '（この かたちで ' + (rw.n + 1) + ' かいめ → へったよ）' : '') + '　もちコイン ' + kzs.coins();
    }
  }
  $('rprog').innerHTML = isFriend ? 'ともだちの モンスター と しょうぶ' : CPUS().map((c, i) => '<span class="dot ' + (i < wins ? 'ok' : i === wins && !win ? 'lost' : i === wins ? 'now' : '') + '">' + c.name + '</span>').join('');
  $('next').hidden = !showNext && !goUra && !goMinna;
  $('again').hidden = showNext;
  if (RANK_ON && !isFriend && win && S.stage === 4 && (!rankMe || rankMe.code !== plainCode(myRobot))) $('torank').hidden = false;
  if (goUra) { $('next').innerHTML = 'うら かちぬき へ！<small>とんでもなく つよい 5 たい</small>'; $('next').classList.add('ura'); $('again').className = 'sub'; $('again').textContent = 'おもてを もういちど'; }
  if (goMinna) { $('next').innerHTML = 'みんなの さいきょう<br>ぐんだん へ！<small>うらを クリアした みんなの 5 たい</small>'; $('next').classList.add('minna'); $('again').className = 'sub'; }
  $('again').textContent = isFriend ? 'もういちど' : goUra ? 'おもてを もういちど' : goMinna ? 'うらを もういちど' : '1 たいめから もういちど';
  $('redraw').textContent = !isFriend && stage > 0 ? 'モンスターを なおす（1 たいめから）' : 'モンスターを なおす';
  if (endingPending) startEnding();
}
function shareRobot() {
  if (!myRobot) return;
  withKz(myRobot);
  TR('share', { me: RB.encodeDesign(myRobot) });
  const url = SITE_URL + '#r=' + RB.encodeDesign(myRobot);
  const text = 'ぼくの モンスター と たたかってみて！（かいて！モンスターバトル）\n' + url;
  if (navigator.share) navigator.share({ text }).catch(err => { if (!err || err.name !== 'AbortError') showShareBox(text); });
  else showShareBox(text);
}
function showShareBox(text) { $('sharetext').value = text; $('sharebox').hidden = false; }

// ---------- ボタン ----------
function onTap(el, fn) { el.addEventListener('click', e => { e.preventDefault(); fn(); }); }
onTap($('start'), showDraw);
onTap($('tmycard'), showDraw);
onTap($('minnaabout'), showMinnaInfo);
// ---------- かざり（ガチャ・かざる）----------
function kzSorted(slot) { return KZ.ITEMS.filter(it => it && it.slot === slot).sort((a, b) => a.r - b.r || a.id - b.id); }
const kzOpen = new Set((() => { try { return JSON.parse(lsGet('kz.open') || '[]'); } catch (e) { return []; } })());
// NEW: 手に 入れて から まだ 一覧で タップして いない かざり（ガチャで 自動で ついた ぶんも まだ NEW）。はじめは 持っている ものを ぜんぶ 見た ことに
function kzSeen() { try { const v = lsGet('kz.seen'); if (v == null) { const o = kzs.own(); lsSet('kz.seen', JSON.stringify(o)); return o; } return JSON.parse(v); } catch (e) { return []; } }
function kzMarkSeen(id) { const s = kzSeen(); if (!s.includes(id)) { s.push(id); lsSet('kz.seen', JSON.stringify(s)); } }
function showKz(msg) {
  $('kzbox').hidden = false; navSync('kz');
  $('kzcoins2').textContent = '🪙 ' + kzs.coins();
  $('kzpull').disabled = kzs.coins() < KZ.PRICE;
  $('kzpull10').disabled = kzs.coins() < KZ.MULTI_PRICE;
  if (msg != null) $('kzmsg').innerHTML = msg;
  if (myRobot) drawPreview($('kzprev'), withKz(withCrown(myRobot)), ME.color);
  const own = kzs.own(), eq = kzs.eq(), seen = kzSeen(), list = $('kzlist'); list.innerHTML = '';
  KZ.SLOTS.forEach((slot, si) => {
    // 場所ごとに 折りたたみ（見出しに 集めた数 と いま つけている もの）。開いて いるかは おぼえておく
    const box = document.createElement('details'); box.className = 'kz-slot'; box.open = kzOpen.has(slot);
    box.addEventListener('toggle', () => { if (box.open) kzOpen.add(slot); else kzOpen.delete(slot); lsSet('kz.open', JSON.stringify([...kzOpen])); });
    const cur = KZ.ITEMS[eq[si]], total = KZ.ITEMS.filter(it => it && it.slot === slot), got = total.filter(it => own.includes(it.id)).length;
    const nNew = total.filter(it => own.includes(it.id) && !seen.includes(it.id)).length;
    box.innerHTML = '<summary><b>' + KZ.SLOT_LABEL[slot] + '</b><span class="kz-cnt">' + got + ' / ' + total.length + '</span>' + (nNew ? '<span class="kz-new">NEW ' + nNew + '</span>' : '') + '<span class="kz-cur">' + (cur ? 'いま: ' + cur.name : 'なし') + '</span></summary>' + (cur && cur.desc ? '<small class="kz-desc">' + cur.desc + '</small>' : '') + '<div class="kz-items"></div>';
    const row = box.querySelector('.kz-items');
    const none = document.createElement('button'); none.textContent = 'なし'; none.className = eq[si] ? '' : 'on';
    onTap(none, () => { const e = kzs.eq(); e[si] = 0; kzs.setEq(e); showKz(); }); row.appendChild(none);
    for (const it of kzSorted(slot)) {   // ★ → ★★ → ★★★（同じ 星の 中は 番号じゅん）
      const has = own.includes(it.id), b = document.createElement('button');
      b.className = 'r' + it.r + (eq[si] === it.id ? ' on' : '') + (has ? '' : ' no');
      b.textContent = has ? '★'.repeat(it.r) + ' ' + it.name : '？？？';
      if (has && !seen.includes(it.id)) { const nb = document.createElement('i'); nb.className = 'kz-nb'; nb.textContent = 'NEW'; b.appendChild(nb); }
      if (has) onTap(b, () => { kzMarkSeen(it.id); const e = kzs.eq(); e[si] = e[si] === it.id ? 0 : it.id; kzs.setEq(e); TR('kzeq', { s: slot, id: e[si] }); showKz(); });
      else b.disabled = true;
      row.appendChild(b);
    }
    list.appendChild(box);
  });
}
onTap($('kzopen'), () => { showKz(''); requestAnimationFrame(kzAnim); });
onTap($('kzclose'), () => { $('kzbox').hidden = true; showTitle(); });
onTap($('kzpull'), () => {
  if (kzs.coins() < KZ.PRICE) return;
  const r = KZ.pull(kzs, Math.random); if (!r) { showKz(); return; }   // 先に 引いて、星の 数で 演出を 変える
  TR('gacha', { id: r.item.id, dup: r.dup ? 1 : 0 });
  $('kzpull').disabled = true; $('kzpull10').disabled = true;
  KZStage.play({ rs: [r], multi: false, onDone: () => {   // ガチャマシンの 演出（kzstage.js）の あとに 当たりカード
    const si = KZ.SLOTS.indexOf(r.item.slot);
    kzOpen.add(r.item.slot);   // 当たった 場所は 開いて 見せる
    // 当たっても 自動では つけない（オーナー判断）。カードの 絵は おためし
    const rv = $('kzreveal'); rv.className = 'r' + r.item.r; rv.hidden = false; $('kzrgrid').hidden = true;
    $('kzrstars').textContent = '★'.repeat(r.item.r);
    $('kzrname').textContent = r.item.name;
    $('kzrsub').textContent = '👀 おためし（まだ つけて ないよ）\n' + (r.dup ? 'もう もってた… 🪙 +' + KZ.DUP_BACK + ' もどったよ' : 'NEW！ ' + KZ.SLOT_LABEL[r.item.slot] + 'の いちらんから つけてね') + (r.item.desc ? '\n' + r.item.desc : '');
    kzShow = r.item;
    showKz('<span class="r' + r.item.r + '">' + '★'.repeat(r.item.r) + ' ' + r.item.name + '</span>' + (r.dup ? '<br>かぶり 🪙 +' + KZ.DUP_BACK : '<br>ゲット！'));
  } });
});
onTap($('kzrok'), () => { $('kzreveal').hidden = true; kzShow = null; });
// 10 連＋1: 11 こ いっぺんに。演出は いちばん 高い 星に 合わせる。自動では つけない（NEW が つく ので 一覧から えらぶ）
onTap($('kzpull10'), () => {
  const rs = KZ.pullMulti(kzs, Math.random); if (!rs) { showKz(); return; }
  for (const r of rs) TR('gacha', { id: r.item.id, dup: r.dup ? 1 : 0, m: 1 });
  const top = Math.max(...rs.map(r => r.item.r));
  const best = rs.filter(r => r.item.r === top).sort((a, b) => (a.dup - b.dup))[0];
  $('kzpull10').disabled = true; $('kzpull').disabled = true;
  KZStage.play({ rs, multi: true, onDone: () => {   // カプセル 11 こが 順に われる（★★★ は さいご）
    for (const r of rs) kzOpen.add(r.item.slot);
    const rv = $('kzreveal'); rv.className = 'r' + top + ' multi'; rv.hidden = false;
    $('kzrstars').textContent = '★'.repeat(top);
    $('kzrname').textContent = best.item.name;
    const nNew = rs.filter(r => !r.dup).length, back = rs.filter(r => r.dup).length * KZ.DUP_BACK;
    $('kzrsub').textContent = '👀 おためし（まだ つけて ないよ）\n' + 'NEW ' + nNew + ' こ' + (back ? '・かぶり 🪙 +' + back : '') + '\n' + '★★★ ' + rs.filter(r => r.item.r === 3).length + '・★★ ' + rs.filter(r => r.item.r === 2).length + '・★ ' + rs.filter(r => r.item.r === 1).length;
    const grid = $('kzrgrid'); grid.innerHTML = ''; grid.hidden = false;
    rs.forEach((r, i) => { const d = document.createElement('div'); d.className = 'kzg r' + r.item.r + (r.dup ? ' dup' : ''); d.style.animationDelay = (i * 0.07) + 's'; d.innerHTML = '<b>' + '★'.repeat(r.item.r) + '</b>' + r.item.name + (r.dup ? '' : '<i>NEW</i>'); grid.appendChild(d); });
    kzShow = best.item;
    showKz('10れん ＋1 の けっか：NEW ' + nNew + ' こ');
  } });
});
// かざりの 一覧（オーナーの 確認用）: 場所ごとに 20 こを 並べて 動かす。上の ボタンで 場所を かえる・とじる
let kzGal = null;
function kzGallery(slot, nocrown) {
  if (kzGal) kzGal.box.remove();
  const base = myRobot || (() => { const c = RB.CPU[2]; return RB.design(c.body, c.arm, c.leg); })();
  const si = Math.max(0, KZ.SLOTS.indexOf(slot)), items = kzSorted(KZ.SLOTS[si]);
  const box = document.createElement('div'); box.style.cssText = 'position:fixed;inset:0;z-index:99;background:#15173a;overflow:auto;padding:6px 4px calc(env(safe-area-inset-bottom) + 10px)';
  const bar = document.createElement('div'); bar.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin:calc(env(safe-area-inset-top) + 4px) 0 6px';
  const btn = (label, on, fn) => { const b = document.createElement('button'); b.textContent = label; b.style.cssText = 'margin:0;padding:6px 10px;font:800 13px sans-serif;border:2px solid #fff;border-radius:10px;box-shadow:none;background:' + (on ? '#ff4d4d' : '#2b2f6b') + ';color:#fff'; b.addEventListener('click', e => { e.preventDefault(); fn(); }); bar.appendChild(b); };
  KZ.SLOTS.forEach((s, i) => btn(KZ.SLOT_LABEL[s], i === si, () => kzGallery(s, nocrown)));
  btn(nocrown ? '王冠 なし' : '王冠 あり', false, () => kzGallery(KZ.SLOTS[si], !nocrown));
  btn('とじる', false, () => { box.remove(); kzGal = null; });
  box.appendChild(bar);
  const grid = document.createElement('div'); grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px'; box.appendChild(grid);
  const cells = items.map(it => {
    const c = document.createElement('div'); c.style.cssText = 'color:#fff;font:700 10px sans-serif;text-align:center;line-height:1.25';
    const cv = document.createElement('canvas'); cv.width = 200; cv.height = 200; cv.style.cssText = 'width:100%;display:block;background:#1f2250;border-radius:6px';
    c.appendChild(cv); c.appendChild(document.createTextNode('★'.repeat(it.r) + ' ' + it.name)); grid.appendChild(c); return { it, cv };
  });
  document.body.appendChild(box);
  kzGal = { box };
  const me = kzGal, loop = () => {
    if (kzGal !== me) return;
    for (const { it, cv } of cells) { const d = Object.assign({}, base, nocrown ? { crown: false, legend: false, champ: 0 } : {}), e = [0, 0, 0, 0]; e[si] = it.id; d.kz = e; drawPreview(cv, d, ME.color, true); }
    requestAnimationFrame(loop);
  };
  loop();
}
// ガチャ画面を 開いている 間は 見本を 動かす（★★ ★★★ の かざりは ずっと 動いている）
let kzShow = null;
function kzAnim() {
  if ($('kzbox').hidden) return;
  if (myRobot) {
    drawPreview($('kzprev'), withKz(withCrown(myRobot)), ME.color, true);
    if (kzShow) { const d = Object.assign({}, myRobot, { crown: false, legend: false, champ: 0 }), e = [0, 0, 0, 0]; e[KZ.SLOTS.indexOf(kzShow.slot)] = kzShow.id; d.kz = e; drawPreview($('kzrcv'), d, ME.color, true); }   // 当たりの おためしは 素の モンスターに その かざりだけ
  }
  requestAnimationFrame(kzAnim);
}
onTap($('minnabtn'), () => { toMinna('title'); showDraw(); setHint('みんなの さいきょう ぐんだん：うらを クリアした みんなの モンスターから えらばれた 5 たい'); });
// タイトルの文字を 5 回つづけてタップ → うら テストの印（ホーム画面のアプリは Safari と保存場所が別なので）
{ let n = 0, t0 = 0; $('title').querySelector('.logo').addEventListener('click', () => { const now = Date.now(); n = now - t0 < 800 ? n + 1 : 1; t0 = now; if (n >= 5) { n = 0; lsSet('uratest', '1'); URA_TEST = true; uraOpen = true; showTitle(); } }); }
onTap($('back'), () => { if (evd) exitEvDraw(); else if (vs) exitVs(); else showTitle(); });
onTap($('fight'), () => { if (evd) evDone(); else if (vs) vsNext(); else startBattle(false); });
onTap($('fightfriend'), () => startBattle(true));
onTap($('send'), shareRobot);
onTap($('share'), shareRobot);
onTap($('clearpart'), () => { if (evd && part === evd.t.part) return; strokes[part] = null; if (!vs) resetAllRuns(); saveRobot(); setPart(part); updateSideUi(); });
let goUra = false;   // おもてを クリアした 直後: つぎへ ボタンが「うらへ」
let goMinna = false;   // うらを クリアした 直後: つぎへ ボタンが「みんなの さいきょう ぐんだん へ」
// みんなの さいきょう ぐんだん の しょうかい（はじめて「みんな」に したときと、タイトルの「どんな 5 たい？」）
function showMinnaInfo() {
  const list = $('minnalist'); list.innerHTML = '';
  RB.MINNA.forEach((m, i) => {
    const el = document.createElement('div'); el.className = 'hall';
    el.innerHTML = '<canvas width="128" height="128"></canvas><span>' + (i + 1) + '. ' + m.name + '</span>';
    list.appendChild(el); drawPreview(el.querySelector('canvas'), m, m.color);
  });
  $('minnainfo').hidden = false; lsSet('minna.intro', '1'); TR('minnainfo', null);
}
// 紹介を 閉じたら、待って いた バトルを 始める（紹介を 読んで いる 間に 裏で 戦いが 進まない ように）
let minnaStartAfterInfo = false;
onTap($('minnaclose'), () => { $('minnainfo').hidden = true; if (minnaStartAfterInfo) { minnaStartAfterInfo = false; startBattle(false); } });
function toMinna(from) { goMinna = false; side = 'minna'; lsSet('side', side); loadSide(); updateSideUi(); TR('gotominna', { from }); if (lsGet('minna.intro') !== '1') { showMinnaInfo(); return true; } return false; }
onTap($('next'), () => { if (!vs && goMinna) { if (toMinna('result')) minnaStartAfterInfo = true; else startBattle(false); return; } if (vs) startVsMode(); else if (goUra) { goUra = false; side = 'ura'; lsSet('side', side); loadSide(); updateSideUi(); TR('gotoura', { from: 'result' }); startBattle(false); } else startBattle(false); });
onTap($('again'), () => { if (S && S.side === 'rank' && rankLast) { rankBattle(...rankLast); return; } if (S && S.side === 'vs') startVsBattle(); else startBattle(isFriend); });
onTap($('redraw'), () => { if (S && S.evBattle) startEvDraw(); else if (vs) startVsMode(); else showDraw(); });
// ---------- モンスター ランクせん（みんなの モンスターと 自動で 対戦）----------
// 登録（形と 名前）だけ ゲームから 送る。順位は サーバー（登録が あれば 15 分に 1 回まで 計算）が 決める。500 体 までは 全員と、こえたら 全員が 同じ 代表 500 体と、左右 入れかえて 2 戦ずつ した 勝率 ＝ 運も ずるも ない
// リプレイと 練習試合は この 端末で 計算（同じ 2 体・同じ 左右なら 同じ 試合に なる）
const RANK_API = /[?&]localapi(&|$)/.test(location.search) ? 'http://localhost:8787' : 'https://renmy-rank.renmy-stack.workers.dev';   // ?localapi は 手元の 受付係（wrangler dev）で ためす とき
const RANK_ON = true;   // 2026-09-28 全員に 公開（前は ?ranktest の 端末だけ）
const RANK_COLOR = '#ef6c00';
let rankTop = null, rankMe = null, rankBusy = false, rankGotMedal = 0, rankDown = false;
function rankDev() { let d = lsGet('rank.dev'); if (!d) { d = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); lsSet('rank.dev', d); } return d; }
function seasonRange(s) { const a = new Date(s + 'T00:00:00Z'); return (a.getUTCMonth() + 1) + '/' + a.getUTCDate(); }
async function loadRank() {
  try {
    const [t, m] = await Promise.all([fetch(RANK_API + '/top').then(r => r.json()), fetch(RANK_API + '/me?dev=' + rankDev()).then(r => r.json())]);
    rankTop = t; rankMe = m.me; rankDown = false;
    await rankSyncKz();
    if (rankMe) lsSet('rank.reg', '1');
    if (rankMe && rankMe.champDays) { const cm = champMap(), had = cm[rankMe.code] || 0; if (rankMe.champDays > had) { cm[rankMe.code] = rankMe.champDays; lsSet('champ', JSON.stringify(cm)); rankGotMedal = rankMe.champDays; if (myRobot && plainCode(myRobot) === rankMe.code) { myRobot.champ = rankMe.champDays; lsSet('robot', RB.encodeDesign(myRobot)); } TR('rankmedal', { n: rankMe.champDays }); } }
  } catch (e) { rankTop = null; rankDown = true; }   // サーバーが 休み（読み取り枠 など）
}
// ランクせんの かざり（サーバーには「あたま,かお,からだ,えふぇくと」の 文字で）
const kzStr = e => (e && e.some(Boolean)) ? e.join(',') : '';
const kzParse = s => { if (!s) return null; const a = String(s).split(',').map(v => +v || 0); return a.some(Boolean) ? a.slice(0, 4) : null; };
// ランクせんを 開いたとき、いま つけている かざりが 前に 送った ものと ちがえば 送る（1 行 書くだけ・計算しない）
async function rankSyncKz() {
  if (!rankMe || !KZ_ON) return;
  const cur = kzStr(kzs.eq());
  if (cur === (rankMe.kz || '')) return;
  try { const r = await (await fetch(RANK_API + '/kz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dev: rankDev(), kz: cur }) })).json(); if (r && r.ok) { rankMe.kz = r.kz || ''; TR('rankkz', null); } } catch (e) {}
}
function miniPreview(code, color, size, kz) {
  const c = document.createElement('canvas'); c.width = c.height = size || 96;
  const d = RB.decodeDesign(code); if (d) { d.kz = kzParse(kz); drawPreview(c, d, color); } return c;
}
function showRank(msg) {
  mode = 'rank'; show('rank');
  $('rankmsg').textContent = msg || '';
  renderRank();
  loadRank().then(() => { if (mode === 'rank') { renderRank(); if (rankGotMedal) { $('rankmsg').textContent = '🏆 チャンピオン メダルを もらった！（チャンピオン ' + rankGotMedal + ' かいめ）'; rankGotMedal = 0; } } });
}
function renderRank() {
  const t = rankTop, me = rankMe;
  $('ranksub').textContent = t ? t.count + ' たい さんか・20 ぷんごとに こうしん' : rankDown ? 'いま ランクせんに つながらないよ。しばらく してから また きてね' : 'よみこみちゅう…';
  // 先週の チャンピオン
  const ch = t && t.champion, cb = $('rankchamp'); cb.hidden = !ch; cb.innerHTML = '';
  if (ch) { cb.append(miniPreview(ch.code, '#ffb300', 96)); const s = document.createElement('div'); s.innerHTML = '<b>👑 きのうの チャンピオン</b><br>'; s.append(document.createTextNode(ch.name + '（しょうりつ ' + ch.rating + '%）' + (ch.streak >= 2 ? '　' + ch.streak + ' にち れんぞく！' : ''))); cb.append(s); }
  // 自分の モンスター
  const box = $('rankme'); box.innerHTML = '';
  if (me) {
    const head = document.createElement('div'); head.className = 'rk-mehead';
    { const md = RB.decodeDesign(me.code); if (md) { md.champ = champMap()[me.code] || 0; md.kz = kzParse(me.kz); const cv = document.createElement('canvas'); cv.width = cv.height = 120; drawPreview(cv, md, ME.color); head.append(cv); } }
    const info = document.createElement('div');
    const nm = document.createElement('div'); nm.className = 'rk-name'; nm.textContent = me.name;
    const st = document.createElement('div'); st.className = 'rk-stat';
    st.textContent = me.pos ? me.pos + ' い / ' + me.count + ' たい　しょうりつ ' + me.pct + '%（' + me.w + 'しょう ' + me.l + 'はい' + (me.d ? ' ' + me.d + 'わけ' : '') + '）' + (me.pl < me.total ? '　けいさんちゅう ' + me.pl + '/' + me.total : '') : 'けいさんちゅう（20 ぷんくらい）';
    info.append(nm, st);
    if (me.champ) { const c = document.createElement('div'); c.className = 'rk-champbadge'; c.textContent = '👑 きのうの チャンピオン' + (me.champ >= 2 ? '（' + me.champ + ' にち れんぞく！）' : '！'); info.append(c); }
    head.append(info); box.append(head);
    if (CARD_ON && me.pos && !me.hidden) { const cb = document.createElement('button'); cb.className = 'main rk-card'; cb.textContent = '📸 じゅんい カードを つくる'; cb.addEventListener('click', () => showRankCard(me)); box.append(cb); }
    if (me.back) { const b = document.createElement('div'); b.className = 'rk-note'; b.textContent = 'ひさしぶり！ おやすみ から ふっかつ。だいたい 20 ぷんで ランキングに もどるよ'; box.append(b); }
    if (me.hidden) { const h = document.createElement('div'); h.className = 'rk-note'; h.textContent = 'なまえが みんなに みせるのに ふさわしくないので、ランキングに だして いないよ。なまえを かえて とうろくしなおしてね'; box.append(h); }
    const rec = me.recent || [];
    if (rec.length) {
      const lt = document.createElement('div'); lt.className = 'rk-h'; lt.textContent = 'つよい あいてとの たいせん（タップで リプレイ）'; box.append(lt);
      for (const r of rec) {
        const row = document.createElement('button'); row.className = 'rk-row';
        const chip = document.createElement('span'); chip.className = 'rk-chip ' + r.r; chip.textContent = r.r === 'W' ? 'かち' : r.r === 'L' ? 'まけ' : 'わけ';
        const nmm = document.createElement('span'); nmm.className = 'rk-opp'; nmm.textContent = 'vs ' + r.n;
        const dd = document.createElement('span'); dd.className = 'rk-d'; dd.textContent = r.s === 'A' ? 'ひだり' : 'みぎ';
        row.append(chip, nmm, dd); row.addEventListener('click', () => rankReplay(me, r)); box.append(row);
      }
    }
  } else {
    const n = document.createElement('div'); n.className = 'rk-note';
    n.textContent = myRobot ? 'いまの モンスターを とうろくすると、みんなの モンスターと じどうで たたかって じゅんいが きまるよ' : 'まず モンスターを つくってね';
    box.append(n);
  }
  // 登録（いまの モンスター）
  const same = me && myRobot && plainCode(myRobot) === me.code;
  $('rankreg').hidden = !myRobot || (same && !(me && me.hidden));   // 非表示に された ときは 同じ モンスターでも 名前を かえて 登録しなおせる
  $('rankregbtn').textContent = me ? 'いまの モンスターで とうろくしなおす' : 'いまの モンスターで とうろく';
  $('rankreghint').textContent = me && me.hidden ? 'あたらしい なまえで とうろくしなおしてね' : me ? 'とうろくしなおすと みんなと たたかい なおして じゅんいが きまるよ' : '';
  if (myRobot) drawPreview($('rankprev'), myRobot, ME.color);
  if (!$('rankname').value && me && !me.hidden) $('rankname').value = me.name;
  // ランキング
  const list = $('ranklist'); list.innerHTML = '';
  for (const [ti, m] of ((t && t.top) || []).entries()) {
    const row = document.createElement('button'); row.className = 'rk-row rk-top' + (me && m.id === me.id ? ' mine' : '');
    const p = document.createElement('span'); p.className = 'rk-pos'; p.textContent = ti + 1;
    const nm = document.createElement('span'); nm.className = 'rk-opp'; nm.textContent = m.name;
    const sc = document.createElement('span'); sc.className = 'rk-d'; sc.textContent = m.pct + '%';
    row.append(p, miniPreview(m.code, RANK_COLOR, 64, m.kz), nm, sc);
    row.addEventListener('click', () => rankPractice(m)); list.append(row);
  }
  if (t && !(t.top || []).length) list.textContent = 'まだ だれも とうろく して いないよ';
  // 30 位より 下の ときは「⋮」の 下に 自分と 前後 2 体（タップで れんしゅうじあい）
  const shown = (t && t.top || []).length;
  if (me && me.pos && me.pos > shown && me.nb && me.nb.length) {
    const gap = document.createElement('div'); gap.className = 'rk-gap'; gap.textContent = '⋮'; list.append(gap);
    for (const x of me.nb) {
      const row = document.createElement('button'); row.className = 'rk-row rk-top' + (x.id === me.id ? ' mine' : '');
      const p = document.createElement('span'); p.className = 'rk-pos'; p.textContent = x.pos;
      const nm = document.createElement('span'); nm.className = 'rk-opp'; nm.textContent = x.name + (x.id === me.id ? '（あなた）' : '');
      const sc = document.createElement('span'); sc.className = 'rk-d'; sc.textContent = x.pct + '%';
      const cv = document.createElement('canvas'); cv.width = cv.height = 64;
      row.append(p, cv, nm, sc); list.append(row);
      // 絵は 形を もらって から
      fetch(RANK_API + '/mon?id=' + encodeURIComponent(x.id)).then(r => r.json()).then(m => { const d = m.code && RB.decodeDesign(m.code); if (d) { d.kz = kzParse(m.kz); drawPreview(cv, d, x.id === me.id ? ME.color : RANK_COLOR); } if (x.id !== me.id && m.code) row.addEventListener('click', () => rankPractice({ name: x.name, code: m.code, kz: m.kz })); }).catch(() => {});
    }
  }
}
async function rankRegister() {
  if (!myRobot || rankBusy) return;
  const name = $('rankname').value.trim();
  if (!name) { $('rankmsg').textContent = 'なまえを いれてね'; return; }
  rankBusy = true; $('rankmsg').textContent = 'とうろくちゅう…';
  try {
    const r = await (await fetch(RANK_API + '/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dev: rankDev(), code: plainCode(myRobot), name, kz: KZ_ON ? kzStr(kzs.eq()) : '' }) })).json();
    if (r.error) $('rankmsg').textContent = r.error;
    else { TR('rankreg', { me: plainCode(myRobot) }); lsSet('rank.reg', '1'); await loadRank(); $('rankmsg').textContent = 'とうろく できたよ！'; }
  } catch (e) { $('rankmsg').textContent = 'つながらなかった…もういちど ためしてね'; }
  rankBusy = false; if (mode === 'rank') renderRank();
}
// 対戦を 見る: side は 自分が 左（A）か 右（B）か。同じ 左右で 計算するので サーバーと 同じ 試合に なる
function rankBattle(leftCode, rightCode, leftName, rightName, leftColor, rightColor, meSide, kind, kzL, kzR) {
  const L = RB.decodeDesign(leftCode), R = RB.decodeDesign(rightCode); if (!L || !R) return;
  isFriend = true;
  opp = { name: rightName, color: rightColor, d: R };
  S = RB.create(L, R); S.stage = 0; S.side = 'rank'; S.leftName = leftName; S.leftColor = leftColor; S.meSide = meSide; S.rankKind = kind; S.evBattle = rankEvMode;
  S.crownA = false; S.crownB = false; S.kzA = kzParse(kzL); S.kzB = kzParse(kzR);
  rankLast = [leftCode, rightCode, leftName, rightName, leftColor, rightColor, meSide, kind, kzL, kzR];
  acc = 0; last = performance.now(); stop = 0; shake = 0; parts = []; pops = []; hurt = { A: 0, B: 0 }; endAt = 0; cam = null;
  mode = 'battle'; show('none');
}
let rankLast = null, rankEvMode = false;
async function rankReplay(me, r) {
  TR('rankreplay', null); rankEvMode = false;
  let c = r.c, okz = null;
  try { const m = await (await fetch(RANK_API + '/mon?id=' + encodeURIComponent(r.o))).json(); c = c || m.code; okz = m.kz; } catch (e) {}   // かざりも（1 時間 おぼえて いる）
  if (!c) { $('rankmsg').textContent = 'あいてが みつからなかった'; return; }
  if (r.s === 'A') rankBattle(me.code, c, me.name, r.n, ME.color, RANK_COLOR, 'A', 'replay', me.kz, okz);
  else rankBattle(c, me.code, r.n, me.name, RANK_COLOR, ME.color, 'B', 'replay', okz, me.kz);
}
function rankPractice(m) {
  if (!myRobot) { $('rankmsg').textContent = 'れんしゅうじあいは モンスターを つくってから'; return; }
  TR('rankpractice', null); rankEvMode = false;
  rankBattle(plainCode(myRobot), m.code, ME.name, m.name, ME.color, RANK_COLOR, 'A', 'practice', KZ_ON ? kzStr(kzs.eq()) : '', m.kz);
}
onTap($('rankbtn'), () => showRank());
// タイトルの ランクせん の 一言（とうろく して いれば 順位、あがったら おしらせ）
async function titleRank() {
  const cap = $('rankcap'), tr = $('trank');
  // 登録した ことが ない 端末は 通信しない（受け付け回数の 節約）。登録した 端末は 自分の ぶん（/me）だけ
  if (lsGet('rank.reg') !== '1') { cap.textContent = 'とうろくして みんなと じどうで たいせん！'; $('rankbtn').classList.add('new'); tr.hidden = true; return; }
  if (!rankMe) { try { rankMe = (await (await fetch(RANK_API + '/me?dev=' + rankDev())).json()).me; } catch (e) {} }
  const me = rankMe, cur = myRobot && plainCode(myRobot);
  if (me && me.pos) {
    const prev = +(lsGet('rank.lastpos') || 0);
    cap.textContent = (me.champ ? '👑 チャンピオン' + (me.champ >= 2 ? me.champ + ' にち れんぞく・' : '・') : '') + 'いま ' + me.pos + ' い（' + me.count + ' たい）しょうりつ ' + me.pct + '%' + (prev && me.pos < prev ? '　↑ あがった！' : '');
    lsSet('rank.lastpos', String(me.pos));
  } else cap.textContent = me ? 'とうろく ずみ・けいさんちゅう' : 'とうろくして みんなと じどうで たいせん！';
  $('rankbtn').classList.toggle('new', !me);
  $('tmchint').hidden = !!me;
  tr.hidden = !me; tr.textContent = me ? 'ランクせん ' + (me.pos ? me.pos + ' い・しょうりつ ' + me.pct + '%' : 'けいさんちゅう') + (cur && cur !== me.code ? '（べつの モンスターで とうろくちゅう）' : '') : '';
}
onTap($('torank'), () => { TR('torank', null); showRank('いまの モンスターで とうろく できるよ'); });
onTap($('rankregbtn'), rankRegister);
onTap($('rankdraw'), showDraw);
onTap($('rankback'), showTitle);
onTap($('ranktop'), showTitle);
// ---------- きょうの イベント（1 日で 完結する ランクせん。お題の パーツは きまった 形）----------
// 2026-09-30 全員に 公開（前は ?eventtest の 端末だけ）。お題は event.js（60 日で 一周）、受付は ランクせんと おなじ 受付係（/ev/*）、計算は tools/ev_batch.js
// イベントの モンスターは ふだんの モンスターと べつに 端末へ（ev.robot・その 日だけ）。お題の パーツは 描く 画面で さわれない（サーバーでも 上書き）
if (/[?&]eventtest(=|&|$)/.test(location.search)) lsSet('eventtest', '1');
const EV_ON = true;
const EV_COLOR = '#8e24aa';
const PART_DAY = { arm: 'うでの日', leg: 'あしの日', body: 'からだの日' };
const evq = n => window.LANG === 'en' ? ' "' + n + '"' : '「' + n + '」';   // お題の 名前の かっこ（英語は ""）
let evd = null;   // イベントの モンスターを 描いている あいだ: { backup: { strokes, myRobot }, t: お題, day }
let evTop = null, evMe = null, evInfo = null, evBusy = false, evDown = false, evGot = null;
function jstDay() { return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); }
function evDayNow() { return (evInfo && evInfo.day) || jstDay(); }
function evTheme() { return eventThemeOf(evDayNow()); }
function evRibbons() { return +(lsGet('ev.ribbons') || 0); }
function withRibbon(d) { if (d) d.ribbon = EV_ON ? evRibbons() : 0; return d; }
function evRobot() { const w = lsGet('ev.robot'); return w && lsGet('ev.robotday') === evDayNow() ? RB.decodeDesign(w) : null; }
function evPlain(d) { const f = eventFit(RB, d, evTheme()); return RB.validDesign(f) ? plainCode(f) : null; }   // サーバーと おなじ 上書き
function startEvDraw() {
  const t = evTheme(), day = evDayNow();
  TR('evdraw', { n: t.n });
  evd = { backup: evd ? evd.backup : { strokes, myRobot }, t, day };
  let d = evRobot();
  if (!d && myRobot) d = eventFit(RB, myRobot, t);   // はじめは いまの モンスターに お題を つけた もの
  if (d && RB.validDesign(d)) { strokes = { body: d.body, arm: d.arm, leg: d.leg }; myRobot = d; }
  else { strokes = { body: null, arm: null, leg: null }; strokes[t.part] = t.pts.map(p => p.slice()); myRobot = null; }
  saveRobot();
  showDraw();
}
function exitEvDraw() { if (evd) { strokes = evd.backup.strokes; myRobot = evd.backup.myRobot; evd = null; } applyEvUi(); showEv(); }
function evDone() { if (!myRobot) return; TR('evdone', null); exitEvDraw(); $('evmsg').textContent = 'できたよ！ なまえを いれて だしてね'; }
function applyEvUi() {
  $('slots').hidden = !!evd;
  if (!evd) return;
  $('sidebtn').hidden = true; $('fightfriend').hidden = true; $('send').hidden = true;
  $('fight').classList.remove('ura');
  $('fight').innerHTML = 'できた！<small>イベントに もどる</small>';
}
async function loadEv() {
  try {
    const [t, m] = await Promise.all([fetch(RANK_API + '/ev/top').then(r => r.json()), fetch(RANK_API + '/ev/me?dev=' + rankDev()).then(r => r.json())]);
    evTop = t; evMe = m.me; evInfo = m; evDown = false;
    if (m.ribbons > evRibbons()) lsSet('ev.ribbons', String(m.ribbons));
    if (m.won && lsGet('ev.wonseen') !== m.won.day) { evGot = m.won; lsSet('ev.wonseen', m.won.day); TR('evribbon', { n: m.ribbons }); }
  } catch (e) { evTop = null; evDown = true; }
}
function showEv(msg) {
  mode = 'ev'; show('ev');
  if (msg != null) $('evmsg').textContent = msg;
  renderEv();
  loadEv().then(() => { if (mode === 'ev') { renderEv(); if (evGot) { $('evmsg').textContent = '🎀 きのうの ' + PART_DAY[evGot.part] + ' いちばん！ リボンを もらったよ'; evGot = null; } } });
}
function themeName(part, no) { const x = EVENT_PARTS[part] && EVENT_PARTS[part][no]; return x ? x.name : ''; }
function renderEv() {
  const t = evTheme(), top = evTop, me = evMe, info = evInfo;
  // お題（なにも ない からだ・うで・あしに お題の パーツだけ 色つき）
  $('evday').textContent = '🎀 きょうは ' + PART_DAY[t.part];
  $('evname').textContent = evq(t.name).trim();
  $('evhint').textContent = t.hint + '（' + PARTS[t.part] + ' は みんな この かたち）';
  { const base = { body: [[-30, -150], [30, -150], [30, -80], [-30, -80]], arm: [[0, 0], [20, 0], [40, 0], [60, 0]], leg: [[0, 0], [0, 20], [0, 40], [0, 60]] };
    base[t.part] = t.pts; drawPreview($('evthemecv'), RB.design(base.body, base.arm, base.leg), EV_COLOR); }
  const left = Math.max(0, Math.ceil((Date.parse(evDayNow() + 'T15:00:00Z') - (info ? info.now : Date.now())) / 3600e3));
  $('evsub').textContent = top ? top.count + ' たい さんか・よる 0 じ しめきり（あと ' + left + ' じかん）' : evDown ? 'いま イベントに つながらないよ。しばらく してから また きてね' : 'よみこみちゅう…';
  // きのうの 1 位
  const ch = top && top.champion, cb = $('evchamp'); cb.hidden = !ch; cb.innerHTML = '';
  if (ch) { cb.append(miniPreview(ch.code, '#78909c', 96, ch.kz)); const d = document.createElement('div'); d.innerHTML = '<b>🎀 きのうの ' + PART_DAY[ch.part] + evq(themeName(ch.part, ch.no)) + ' いちばん</b><br>'; d.append(document.createTextNode(ch.name + '（しょうりつ ' + ch.pct + '%・' + ch.n + ' たい）')); cb.append(d); }
  // 自分
  const box = $('evme'); box.innerHTML = '';
  if (info && info.won) { const w = document.createElement('div'); w.className = 'ev-title'; w.textContent = '🎀 きのうの ' + PART_DAY[info.won.part] + ' いちばん'; box.append(w); }
  if (evRibbons()) { const r = document.createElement('div'); r.className = 'rk-note'; r.textContent = '🎀 リボン ' + evRibbons() + ' こ（あなたの モンスターに つくよ）'; box.append(r); }
  if (me) {
    const head = document.createElement('div'); head.className = 'rk-mehead';
    head.append(miniPreview(me.code, ME.color, 120, me.kz));
    const inf = document.createElement('div');
    const nm = document.createElement('div'); nm.className = 'rk-name'; nm.textContent = me.name;
    const st = document.createElement('div'); st.className = 'rk-stat';
    st.textContent = me.pos ? me.pos + ' い / ' + me.count + ' たい　しょうりつ ' + me.pct + '%（' + me.w + 'しょう ' + me.l + 'はい' + (me.d ? ' ' + me.d + 'わけ' : '') + '）' + (me.pl < me.total ? '　けいさんちゅう ' + me.pl + '/' + me.total : '') : 'けいさんちゅう（20 ぷんくらい）';
    inf.append(nm, st); head.append(inf); box.append(head);
    if (me.hidden) { const h = document.createElement('div'); h.className = 'rk-note'; h.textContent = 'なまえが みんなに みせるのに ふさわしくないので、ランキングに だして いないよ'; box.append(h); }
    for (const r of (me.recent || [])) {
      const row = document.createElement('button'); row.className = 'rk-row';
      const chip = document.createElement('span'); chip.className = 'rk-chip ' + r.r; chip.textContent = r.r === 'W' ? 'かち' : r.r === 'L' ? 'まけ' : 'わけ';
      const o = document.createElement('span'); o.className = 'rk-opp'; o.textContent = 'vs ' + r.n;
      row.append(chip, o); row.addEventListener('click', () => evReplay(me, r)); box.append(row);
    }
  } else if (!evRobot()) { const n = document.createElement('div'); n.className = 'rk-note'; n.textContent = 'お題の パーツは きまってるよ。のこりの 2 つを かいて だしてね'; box.append(n); }
  // 出す
  const d = evRobot(), code = d && evPlain(d), nleft = info ? info.left : 1;
  $('evreg').hidden = !d || (me && me.code === code);
  if (d) drawPreview($('evprev'), withRibbon(d), ME.color);
  $('evregbtn').disabled = !nleft;
  $('evregbtn').textContent = me ? 'この モンスターで だしなおす' : 'この モンスターで だす';
  $('evreghint').textContent = nleft > 0 ? (me ? 'だしなおすと まえの モンスターと いれかわるよ' : '') : 'きょうは もう たくさん だしたよ。また あした！';
  if (!$('evnm').value) $('evnm').value = me ? me.name : (rankMe && rankMe.name) || '';
  $('evdraw').textContent = d ? 'イベントの モンスターを なおす' : 'イベントの モンスターを かく';
  // ランキング
  const list = $('evlist'); list.innerHTML = '';
  for (const [i, m] of ((top && top.top) || []).entries()) {
    const row = document.createElement('button'); row.className = 'rk-row rk-top' + (me && m.id === me.id ? ' mine' : '');
    const p = document.createElement('span'); p.className = 'rk-pos'; p.textContent = i + 1;
    const nm = document.createElement('span'); nm.className = 'rk-opp'; nm.textContent = m.name;
    const sc = document.createElement('span'); sc.className = 'rk-d'; sc.textContent = m.pct + '%';
    row.append(p, miniPreview(m.code, EV_COLOR, 64, m.kz), nm, sc);
    row.addEventListener('click', () => evPractice(m)); list.append(row);
  }
  if (top && !(top.top || []).length) list.textContent = top.count ? 'まだ たたかう あいてが いないよ（2 たい から じゅんいが でるよ）' : 'まだ だれも だして いないよ。いちばん のりで だそう！';
  if (me && me.pos && me.pos > ((top && top.top) || []).length && me.nb && me.nb.length) {
    const gap = document.createElement('div'); gap.className = 'rk-gap'; gap.textContent = '⋮'; list.append(gap);
    for (const x of me.nb) { const row = document.createElement('div'); row.className = 'rk-row rk-top' + (x.id === me.id ? ' mine' : ''); row.textContent = x.pos + '　' + x.name + (x.id === me.id ? '（あなた）' : '') + '　' + x.pct + '%'; list.append(row); }
  }
}
async function evRegister() {
  const d = evRobot(); if (!d || evBusy) return;
  const name = $('evnm').value.trim();
  if (!name) { $('evmsg').textContent = 'なまえを いれてね'; return; }
  evBusy = true; $('evmsg').textContent = 'だしてるよ…';
  try {
    const r = await (await fetch(RANK_API + '/ev/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dev: rankDev(), code: evPlain(d), name, kz: KZ_ON ? kzStr(kzs.eq()) : '' }) })).json();
    if (r.error) $('evmsg').textContent = r.error;
    else { TR('evreg', { n: evTheme().n }); await loadEv(); $('evmsg').textContent = 'だしたよ！ 20 ぷん くらいで じゅんいが でるよ'; }
  } catch (e) { $('evmsg').textContent = 'つながらなかった…もういちど ためしてね'; }
  evBusy = false; if (mode === 'ev') renderEv();
}
function evPractice(m) {
  const d = evRobot();
  if (!d) { $('evmsg').textContent = 'れんしゅうじあいは イベントの モンスターを かいてから'; return; }
  TR('evpractice', null); rankEvMode = true;
  rankBattle(evPlain(d), m.code, ME.name, m.name, ME.color, EV_COLOR, 'A', 'practice', KZ_ON ? kzStr(kzs.eq()) : '', m.kz);
}
async function evReplay(me, r) {
  TR('evreplay', null);
  let c = null, okz = null;
  try { const m = await (await fetch(RANK_API + '/mon?id=' + encodeURIComponent(r.o))).json(); c = m.code; okz = m.kz; } catch (e) {}
  if (!c) { $('evmsg').textContent = 'あいてが みつからなかった'; return; }
  rankEvMode = true;
  if (r.s === 'A') rankBattle(me.code, c, me.name, r.n, ME.color, EV_COLOR, 'A', 'replay', me.kz, okz);
  else rankBattle(c, me.code, r.n, me.name, EV_COLOR, ME.color, 'B', 'replay', okz, me.kz);
}
onTap($('evbtn'), () => { TR('evopen', null); showEv(''); });
onTap($('evregbtn'), evRegister);
onTap($('evdraw'), startEvDraw);
onTap($('evback'), showTitle);
onTap($('evtop'), showTitle);
// ---------- うら 5 人抜き: 王冠・でんどういり・エンディング ----------
let endT0 = 0, confetti = [];
function onUraClear() {
  TR('uraclear', { me: plainCode(myRobot) });
  const code = plainCode(myRobot), tag = codeTag(code), list = crownedList(), fresh = !list.includes(tag);
  if (fresh) { list.push(tag); lsSet('crowned', JSON.stringify(list)); }
  myRobot.crown = true; lsSet('robot', RB.encodeDesign(myRobot)); S.crownA = true;
  if (fresh) { hallAdd('hall', { c: code, d: (new Date().getMonth() + 1) + '/' + new Date().getDate() }); }
  endingPending = true;
}
let endingPending = false;
// でんどういり・でんせつの 記録に 1 つ 足す（形つきは 最新 HALL_KEEP こ まで、数は 〜.n）
function hallAdd(k, h) {
  let a = []; try { a = JSON.parse(lsGet(k) || '[]'); } catch (e) {}
  a.push(h); lsSet(k, JSON.stringify(a.slice(-HALL_KEEP))); lsSet(k + '.n', String(hallCount(k) + 1));
}
function hallCount(k) { let a = []; try { a = JSON.parse(lsGet(k) || '[]'); } catch (e) {} return Math.max(+(lsGet(k + '.n') || 0), a.length); }
function onMinnaClear() {
  const code = plainCode(myRobot), tag = codeTag(code), list = legendList(), fresh = !list.includes(tag);
  if (fresh) { list.push(tag); lsSet('legend', JSON.stringify(list)); }
  const t = new Date(), day = t.getFullYear() + '/' + (t.getMonth() + 1) + '/' + t.getDate();
  if (fresh) hallAdd('legendhall', { c: code, d: day });
  myRobot.legend = true; S.legendA = true;
  TR('minnaclear', { me: code });
  $('cert').hidden = false; certFor = { c: code, d: day };
}
// でんせつ しょうめいしょ（画像）: モンスターの 絵と 日付。X などに 投稿できる
let certFor = null;
function makeCert(code, day) {
  const d = RB.decodeDesign(code); if (!d) return null;
  withCrown(d); d.legend = true;
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350;
  const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, 1350); bg.addColorStop(0, '#04161a'); bg.addColorStop(1, '#0f3d3a');
  g.fillStyle = bg; g.fillRect(0, 0, 1080, 1350);
  g.strokeStyle = '#ffd54f'; g.lineWidth = 16; g.strokeRect(40, 40, 1000, 1270); g.lineWidth = 4; g.strokeRect(70, 70, 940, 1210);
  g.textAlign = 'center'; g.fillStyle = '#ffd54f';
  g.font = '900 96px sans-serif'; g.fillText('でんせつ', 540, 220);
  g.font = '900 64px sans-serif'; g.fillText('しょうめいしょ', 540, 310);
  const m = document.createElement('canvas'); m.width = 720; m.height = 600;
  const mg = m.getContext('2d'); mg.shadowColor = '#ffd54f'; mg.shadowBlur = 40;
  drawPreview(m, d, ME.color);
  g.drawImage(m, 180, 360);
  g.fillStyle = '#ffffff'; g.font = '800 50px sans-serif';
  g.fillText('みんなの さいきょう ぐんだん を', 540, 1060); g.fillText('たおした！', 540, 1130);
  g.fillStyle = '#b2dfdb'; g.font = '700 38px sans-serif'; g.fillText(day + '　かいて！モンスターバトル', 540, 1220);
  return c;
}
function showCert(code, day) {
  const c = makeCert(code, day); if (!c) return;
  TR('cert', { me: code });
  openCertBox(c, 'でんせつ しょうめいしょ（ながおしで ほぞん）', 'densetsu.png', 'みんなの さいきょう ぐんだん を たおして でんせつ に なった！（かいて！モンスターバトル）' + String.fromCharCode(10) + SITE_URL, false);
}
// 証明書を 画面に 出す → 「シェア」で 共有の 画面（X など）。共有できない ブラウザでは 長押しで 保存
// textOnly: 画像を 共有できない ブラウザでも「シェア」を 出して 文（リンク）だけ 送る（画像は ながおしで 保存）
let certFile = null, certText = '', certKind = 'cert';
function openCertBox(c, note, fname, text, textOnly) {
  $('certimg').src = c.toDataURL('image/png'); $('certbox').hidden = false;
  $('certnote').textContent = note; certText = text; certKind = fname === 'densetsu.png' ? 'cert' : 'rankcard';
  certFile = null; $('certshare').hidden = !textOnly;
  c.toBlob(blob => {
    const file = blob && new File([blob], fname, { type: 'image/png' });
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) { certFile = file; $('certshare').hidden = false; }
  }, 'image/png');
}
onTap($('certshare'), () => {
  TR(certKind + 'share', { f: certFile ? 1 : 0 });
  if (certFile) { navigator.share({ files: [certFile], text: certText }).catch(() => {}); return; }
  if (navigator.share) navigator.share({ text: certText }).catch(err => { if (!err || err.name !== 'AbortError') showShareBox(certText); });
  else showShareBox(certText);
});
// ランクせんの じゅんい カード（画像）: 順位・何体中・モンスター（かざりつき）・名前・勝率。リンクを ひらくと その モンスターと たたかえる
function rankCardDesign(me) { const d = RB.decodeDesign(me.code); if (d) { d.champ = champMap()[me.code] || 0; d.kz = kzParse(me.kz); } return d; }
function makeRankCard(me) {
  const d = rankCardDesign(me); if (!d) return null;
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2b1100'); bg.addColorStop(1, '#6d2a00');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const top = me.pos === 1 ? '#ffd54f' : me.pos === 2 ? '#e0e0e0' : me.pos === 3 ? '#ffab76' : '#ffffff';
  g.strokeStyle = '#ffb74d'; g.lineWidth = 16; g.strokeRect(40, 40, W - 80, H - 80); g.lineWidth = 4; g.strokeRect(70, 70, W - 140, H - 140);
  g.textAlign = 'center';
  g.fillStyle = '#ffcc80'; g.font = '900 60px sans-serif'; g.fillText('モンスター ランクせん', W / 2, 170);
  // 順位（数字は 大きく、「い」は 小さく）
  const num = String(me.pos);
  g.font = '900 210px sans-serif'; const nw = g.measureText(num).width;
  g.font = '900 100px sans-serif'; const iw = g.measureText(' い').width;
  const x0 = W / 2 - (nw + iw) / 2;
  g.textAlign = 'left'; g.fillStyle = top;
  g.font = '900 210px sans-serif'; g.fillText(num, x0, 385);
  g.font = '900 100px sans-serif'; g.fillText(' い', x0 + nw, 385);
  g.textAlign = 'center'; g.fillStyle = '#ffe0b2'; g.font = '800 46px sans-serif';
  g.fillText(me.count + ' たい ちゅう', W / 2, 455);
  const m = document.createElement('canvas'); m.width = 900; m.height = 540;
  drawPreview(m, d, ME.color);
  g.save(); g.shadowColor = 'rgba(255, 183, 77, .7)'; g.shadowBlur = 40; g.drawImage(m, 90, 470); g.restore();
  let y = 1060;
  if (me.champ) { g.fillStyle = '#ffd54f'; g.font = '900 50px sans-serif'; g.fillText('👑 きのうの チャンピオン' + (me.champ >= 2 ? '（' + me.champ + ' にち れんぞく）' : ''), W / 2, 1020, W - 200); y = 1100; }
  g.fillStyle = '#ffffff'; g.font = '900 72px sans-serif'; g.fillText(me.name, W / 2, y, W - 200);
  g.fillStyle = '#ffcc80'; g.font = '800 46px sans-serif';
  g.fillText('しょうりつ ' + me.pct + '%（' + me.w + 'しょう ' + me.l + 'はい' + (me.d ? ' ' + me.d + 'わけ' : '') + '）', W / 2, y + 75, W - 200);
  g.fillStyle = '#ffe0b2'; g.font = '700 36px sans-serif'; g.fillText('かいて！モンスターバトル　renmygames.com', W / 2, 1255);
  return c;
}
function showRankCard(me) {
  const c = makeRankCard(me); if (!c) return;
  TR('rankcard', { pos: me.pos, n: me.count });
  const url = SITE_URL + '#r=' + RB.encodeDesign(rankCardDesign(me));
  const text = 'ランクせんで ' + me.pos + ' い（' + me.count + ' たい ちゅう）！「' + me.name + '」と たたかってみて！（かいて！モンスターバトル）' + String.fromCharCode(10) + url;
  openCertBox(c, 'じゅんい カード（ながおしで ほぞん）', 'rank.png', text, true);
}
onTap($('cert'), () => { if (certFor) showCert(certFor.c, certFor.d); });
onTap($('certclose'), () => { $('certbox').hidden = true; });
function renderLegend() {
  let lh = []; try { lh = JSON.parse(lsGet('legendhall') || '[]'); } catch (e) {}
  $('legendbox').hidden = !lh.length;
  const list = $('legendlist'); list.innerHTML = '';
  for (const h of lh.slice(-12)) {
    const d = RB.decodeDesign(h.c); if (!d) continue; withCrown(d); d.legend = true;
    const el = document.createElement('div'); el.className = 'hall';
    el.innerHTML = '<canvas width="128" height="128"></canvas><span>' + h.d + '</span>';
    list.appendChild(el); drawPreview(el.querySelector('canvas'), d, ME.color);
    el.addEventListener('click', () => showCert(h.c, h.d));
  }
}
function renderHall() {
  renderLegend();
  let hall = []; try { hall = JSON.parse(lsGet('hall') || '[]'); } catch (e) {}
  $('hallbox').hidden = !hall.length;
  const list = $('halllist'); list.innerHTML = '';
  for (const h of hall.slice(-12)) {
    const d = RB.decodeDesign(h.c); if (!d) continue; d.crown = true;
    const el = document.createElement('div'); el.className = 'hall';
    el.innerHTML = '<canvas width="128" height="128"></canvas><span>' + h.d + '</span>';
    list.appendChild(el); drawPreview(el.querySelector('canvas'), d, ME.color);
  }
}
function startEnding() { endingPending = false; mode = 'ending'; show('none'); $('quit').hidden = true; $('fast').hidden = true; endT0 = performance.now(); confetti = []; }
let endingPreview = false;   // ?endingpreview の 見本（王冠・でんどういりの 記録は 付けない）
function finishEnding() {
  if (endingPreview) { endingPreview = false; myRobot.crown = isCrowned(myRobot); showTitle(); return; }
  mode = 'result'; show('result');
}
window.endingAt = sec => { endT0 = performance.now() - sec * 1000; };   // 開発用: エンディングの その秒を 見る
cv.addEventListener('pointerdown', () => { if (mode === 'ending' && performance.now() - endT0 > 1200) finishEnding(); });
// 絵の いちばん下（反対がわの足も ふくむ）。地面に 立たせるのに 使う
function lowY(d) {
  let y = -Infinity;
  for (const p of d.body) y = Math.max(y, p[1]);
  if (d.arm) for (const p of d.arm) y = Math.max(y, p[1]);
  if (d.leg) for (const p of d.leg) { y = Math.max(y, p[1], 2 * d.hip[1] - p[1]); }
  return y + 4;   // 線の太さぶん
}
// エンディング: 倒した 10 体が 行進 → 王冠の じぶんの モンスター
function renderEnding(now) {
  const t = (now - endT0) / 1000;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#2a1a4f'); sky.addColorStop(1, '#6b3a1f');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  const gy = H * 0.66;
  ctx.fillStyle = '#4b3f8f'; ctx.fillRect(0, gy, W, H - gy); ctx.fillStyle = '#ffd54f'; ctx.fillRect(0, gy, W, 4);
  const list = RB.CPU.concat(RB.URA), sp = Math.max(160, W * 0.45), gap = 110, parade = (W + gap * list.length + 120) / sp;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (t < parade) {
    ctx.font = '900 ' + Math.min(26, W * 0.06) + 'px sans-serif'; ctx.fillStyle = '#fff';
    ctx.fillText('たおした 10 たい', W / 2, H * 0.18);
    list.forEach((c, i) => {
      const x = W + 60 + gap * i - sp * t; if (x < -80 || x > W + 80) return;
      const hop = Math.abs(Math.sin(t * 8 + i)) * 6;
      ctx.save(); ctx.translate(x, gy - hop - lowY(c) * 0.55); ctx.scale(-0.55, 0.55); drawRobotLocal(ctx, c, c.color, 1, false); ctx.restore();   // 足を 地面に
      ctx.font = '800 12px sans-serif'; ctx.fillStyle = i < 5 ? '#fff' : '#ff8a80'; ctx.fillText(c.name, x, gy + 22);
    });
  } else {
    const u = t - parade;
    if (confetti.length < 160) for (let i = 0; i < 4; i++) confetti.push({ x: Math.random() * W, y: -10, vy: 60 + Math.random() * 90, vx: (Math.random() - .5) * 40, c: ['#ffd54f', '#ff5252', '#40c4ff', '#69f0ae', '#e040fb'][i % 5], r: Math.random() * 6 });
    for (const p of confetti) { p.y += p.vy / 60; p.x += p.vx / 60; if (p.y > H) { p.y = -10; p.x = Math.random() * W; } ctx.fillStyle = p.c; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r + u * 3); ctx.fillRect(-4, -3, 8, 6); ctx.restore(); }
    const k = Math.min(1, u / 0.6), sc = Math.min(W / 260, H / 480) * (0.6 + 0.4 * k);
    let mx0 = Infinity, mx1 = -Infinity; for (const k of ['body', 'arm', 'leg']) for (const p of myRobot[k]) { mx0 = Math.min(mx0, p[0]); mx1 = Math.max(mx1, p[0]); }
    ctx.save(); ctx.translate(W / 2 - (mx0 + mx1) / 2 * sc, gy - lowY(myRobot) * sc); ctx.scale(sc, sc); drawRobotLocal(ctx, myRobot, ME.color, 1, false); ctx.restore();   // 手足も入れて まんなかに
    ctx.font = '900 ' + Math.min(44, W * 0.11) + 'px sans-serif'; ctx.lineWidth = 8; ctx.strokeStyle = '#1b1d3a';
    ctx.strokeText('おめでとう！', W / 2, H * 0.14); ctx.fillStyle = '#ffd54f'; ctx.fillText('おめでとう！', W / 2, H * 0.14);
    ctx.font = '800 ' + Math.min(18, W * 0.045) + 'px sans-serif'; ctx.fillStyle = '#fff';
    ctx.fillText('うら 5 にんぬき たっせい！', W / 2, H * 0.22); ctx.fillText('おうかんを もらった！', W / 2, H * 0.27);
  }
  if (t > 1.2) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4); ctx.font = '700 14px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('タップで つぎへ', W / 2, H - 40); ctx.globalAlpha = 1; }
}
onTap($('vs'), startVsMode);
onTap($('vstitle'), () => { if (S && S.side === 'rank') { if (S.evBattle) showEv(); else showRank(); } else exitVs(); });
onTap($('handoffgo'), () => { vs.step = 2; loadInto(vsLast(2)); showDraw(); });
// ---------- ふたりで たたかう ----------
function padColor() { return vs && vs.step === 2 ? P2.color : ME.color; }
// 直前の 1P・2P の モンスター（端末に 覚えておく。次の ふたりで たたかう は これが 入った状態で 始まる）
function vsLast(n) { const w = lsGet('vs.d' + n); return w ? RB.decodeDesign(w) : null; }
function loadInto(d) { if (d) { strokes = { body: d.body, arm: d.arm, leg: d.leg }; myRobot = d; } else { strokes = { body: null, arm: null, leg: null }; myRobot = null; } }
function startVsMode() {
  TR('vsmode', null);
  const backup = vs ? vs.backup : { strokes, myRobot };
  vs = { step: 1, d1: null, d2: null, backup };
  loadInto(vsLast(1));
  showDraw();
}
function exitVs() {
  if (vs) { strokes = vs.backup.strokes; myRobot = vs.backup.myRobot; vs = null; }
  $('send').hidden = false;
  showTitle();
}
function applyVsUi() {
  if (!vs) { $('send').hidden = false; return; }
  $('sidebtn').hidden = true; $('fightfriend').hidden = true; $('send').hidden = true;
  $('fight').classList.remove('ura');
  $('fight').innerHTML = vs.step === 1 ? 'できた！<small>2P に わたす</small>' : 'たたかう！<small>1P たい 2P</small>';
}
function vsNext() {
  if (!myRobot) return;
  if (vs.step === 1) { vs.d1 = myRobot; lsSet('vs.d1', RB.encodeDesign(myRobot)); mode = 'handoff'; show('handoff'); }
  else { vs.d2 = myRobot; lsSet('vs.d2', RB.encodeDesign(myRobot)); startVsBattle(); }
}
function startVsBattle() {
  isFriend = true;   // 勝ち抜きの記録には 入れない
  opp = { name: P2.name, color: P2.color, d: vs.d2 };
  S = RB.create(vs.d1, vs.d2); S.stage = 0; S.side = 'vs'; S.crownA = !!vs.d1.crown; S.crownB = !!vs.d2.crown;
  S.d = [designRef(vs.d1), designRef(vs.d2)];
  acc = 0; last = performance.now(); stop = 0; shake = 0; parts = []; pops = []; hurt = { A: 0, B: 0 }; endAt = 0; cam = null;
  mode = 'battle'; show('none');
}
// ---------- モンスターの ほぞん（12 こ）----------
function slotDesign(i) { const w = lsGet('slot' + i); return w ? RB.decodeDesign(w) : null; }
function loadSlot(i, d) {
  TR('slotload', { i });
  const same = myRobot && RB.encodeDesign(myRobot) === RB.encodeDesign(d);
  myRobot = d; strokes = { body: d.body, arm: d.arm, leg: d.leg }; if (!vs) lsSet('robot', RB.encodeDesign(d));
  const reset = !vs && !same && (+(lsGet('stage') || 0) > 0 || +(lsGet('ura.stage') || 0) > 0);
  if (reset) resetAllRuns();
  $('slotbox').hidden = true; setPart('leg'); updateSideUi();
  setHint(reset ? i + ' を よびだしたので かちぬきは 1 たいめから' : i + ' を よびだしました');
  sizePad(); drawPad();
}
// 12 こ（タイル 3 列）: タップで えらぶ → 下に「よびだす・ここに ほぞん・けす」。うわがき と けす は 2 回 おす（まちがい タッチ よけ）
let slotSel = 0, slotDelAsk = false, slotOwAsk = false;
function renderSlots12(msg) {
  const list = $('slotlist'); list.innerHTML = ''; list.className = 'slot12';
  const regCode = rankMe && rankMe.code;
  for (let i = 1; i <= SLOT_N; i++) {
    const d = slotDesign(i), t = document.createElement('button');
    t.className = 'stile' + (i === slotSel ? ' sel' : '') + (d ? '' : ' empty');
    t.innerHTML = '<b>' + i + '</b><canvas width="160" height="160"></canvas>';
    const c = t.querySelector('canvas');
    if (d) {
      withCrown(d); drawPreview(c, d, ME.color);
      const code = plainCode(d), marks = (regCode && code === regCode ? '🏆' : '') + (myRobot && code === plainCode(myRobot) ? '✏️' : '');
      if (marks) { const m = document.createElement('span'); m.className = 'smark'; m.textContent = marks; t.append(m); }
    } else { const cg = c.getContext('2d'); cg.fillStyle = 'rgba(255,255,255,.45)'; cg.font = 'bold 30px sans-serif'; cg.textAlign = 'center'; cg.fillText('から', 80, 92); }
    t.addEventListener('click', e => { e.preventDefault(); slotSel = slotSel === i ? 0 : i; slotDelAsk = false; slotOwAsk = false; renderSlots12(''); });
    list.append(t);
  }
  const bar = document.createElement('div'); bar.className = 'sbar';
  if (!slotSel) bar.textContent = 'ばんごうを タップして えらんでね（🏆 ランクせんに とうろくちゅう・✏️ いまの モンスター）';
  else {
    const i = slotSel, d = slotDesign(i);
    const mk = (txt, cls, fn) => { const b = document.createElement('button'); b.className = cls; b.textContent = txt; b.addEventListener('click', e => { e.preventDefault(); fn(); }); bar.append(b); };
    if (d) mk('よびだす', 'main', () => loadSlot(i, d));
    mk(d ? (slotOwAsk ? 'ほんとうに うわがき？' : 'ここに うわがき') : 'ここに ほぞん', d ? 'sub sow' : 'main', () => {
      if (!myRobot) { renderSlots12('からだ・うで・あし を ぜんぶ かいてから ほぞん してね'); return; }
      if (d && !slotOwAsk) { slotOwAsk = true; slotDelAsk = false; renderSlots12(''); return; }
      lsSet('slot' + i, RB.encodeDesign(myRobot)); TR('slotsave', { i, o: d ? 1 : 0 }); slotDelAsk = false; slotOwAsk = false; renderSlots12(i + ' に ほぞん しました');
    });
    if (d) mk(slotDelAsk ? 'ほんとうに けす？' : 'けす', 'sub sdel', () => {
      if (!slotDelAsk) { slotDelAsk = true; slotOwAsk = false; renderSlots12(''); return; }
      lsSet('slot' + i, ''); TR('slotdel', { i }); slotDelAsk = false; renderSlots12(i + ' を けしました');
    });
  }
  list.append(bar);
  $('slotmsg').textContent = msg || '';
}
onTap($('slots'), () => { slotSel = 0; slotDelAsk = false; slotOwAsk = false; renderSlots12(''); $('slotbox').hidden = false; });
onTap($('closeslots'), () => { $('slotbox').hidden = true; });
// おもて / うら の切りかえ（おもてを クリアしたら 出る）
function updateSideUi() {
  $('sidebtn').hidden = !uraOpen && !MINNA_OPEN;
  $('sidebtn').textContent = SIDE_LABEL[side];
  $('sidebtn').classList.toggle('ura', side !== 'omote');
  $('fight').innerHTML = (side === 'omote' ? '' : SIDE_LABEL[side] + ' ') + 'たたかう<small>' + (stage + 1) + ' / ' + CPUS().length + ' ' + CPUS()[stage].name + '</small>';
  $('fight').classList.toggle('ura', side !== 'omote');
  applyVsUi();
  applyEvUi();
}
// おもて ⇄ うら（押すたびに切りかえ）
onTap($('sidebtn'), () => { const order = ['omote'].concat(uraOpen ? ['ura'] : [], MINNA_OPEN ? ['minna'] : []); side = order[(order.indexOf(side) + 1) % order.length]; lsSet('side', side); loadSide(); updateSideUi(); if (side === 'minna' && lsGet('minna.intro') !== '1') showMinnaInfo(); setHint(side === 'ura' ? 'うら かちぬき：とんでもなく つよい 5 たい' : side === 'minna' ? 'みんなの さいきょう ぐんだん：うらを クリアした みんなの モンスターから えらばれた 5 たい' : ''); });
onTap($('fast'), () => { fast = !fast; TR('fast', { on: fast }); lsSet('fast', fast ? '1' : '0'); updateFastBtn(); });
// 戦いの途中で もどる（勝ち抜きの途中経過は そのまま。戦いは決定的なので やめても 得はしない）
onTap($('quit'), () => { if ((mode === 'battle' || mode === 'pause') && S && S.side === 'rank') { if (S.evBattle) showEv(); else showRank(); return; } if (mode === 'battle' || mode === 'pause') { TR('quit', { side: S && S.side, stage: S && S.stage, t: S && Math.round(S.t * 10) / 10, d: S && S.d }); showDraw(); } });
onTap($('closeshare'), () => { $('sharebox').hidden = true; });
onTap($('copy'), () => {
  const ta = $('sharetext'); ta.select();
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).catch(() => {});
  else document.execCommand('copy');
  $('copy').textContent = 'コピーしました';
  setTimeout(() => { $('copy').textContent = '文をコピー'; }, 1500);
});

// ---------- 開発用 ----------
window.ff = sec => { for (let i = 0; i < sec * RB.HZ && !S.over; i++) stepBattle(); return S.t.toFixed(1) + ' A' + S.A.hp + ' B' + S.B.hp; };
window.sim = () => S;

// ---------- 自動更新: Safari が古いページを開き続けるので、新しい版があれば読み直す ----------
async function checkVersion() {
  try {
    const r = await fetch('version.txt?ts=' + Date.now(), { cache: 'no-store' });
    const v = (await r.text()).trim();
    if (v && v !== VERSION && mode !== 'battle') {
      let tried = ''; try { tried = sessionStorage.getItem(KEY + 'reloadFor') || ''; } catch (e) {}
      if (tried === v) return;
      try { sessionStorage.setItem(KEY + 'reloadFor', v); } catch (e) {}
      location.reload();
    }
  } catch (e) {}
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkVersion(); });
window.addEventListener('pageshow', e => { if (e.persisted) checkVersion(); });
checkVersion();

// ---------- 下の タブ（?navtest の 端末だけ、2026-09-30〜）----------
// トップが 長く なって きたので: ぼうけん（ホーム）・ランクせん・イベント・ガチャ・そのほか。描く 画面と 戦いの 画面では 出さない
// そのほか には トップに あった ふたりで・コレクション・データの ひきつぎ・English・あそびかた を 移す（同じ 部品を 動かすので 動きは おなじ）
if (/[?&]navtest(=|&|$)/.test(location.search)) lsSet('navtest', '1');
function navOn() { return lsGet('navtest') === '1'; }
function navSync(id) {
  const nb = $('navbar'); if (!nb) return;
  const tab = navOn() ? { title: 'home', rank: 'rank', ev: 'ev', more: 'more', kz: 'kz' }[id] : null;
  nb.hidden = !tab; if (!tab) return;
  for (const b of nb.querySelectorAll('button')) b.classList.toggle('on', b.dataset.tab === tab);
  nb.querySelector('[data-tab=rank]').classList.toggle('dot', lsGet('rank.reg') !== '1');
  nb.querySelector('[data-tab=kz]').classList.toggle('dot', KZ_ON && kzs.coins() >= KZ.PRICE);
  nb.querySelector('[data-tab=ev]').hidden = !EV_ON;
}
function showMore() { mode = 'more'; show('more'); }
if (navOn()) {
  document.body.classList.add('nav');
  const ml = $('morelist');
  for (const id of ['vs', 'collection', 'bkbtn', 'langbtn']) ml.append($(id));
  ml.append(document.querySelector('#title .howto'), document.querySelector('#title .tfoot'));
}
for (const b of document.querySelectorAll('#navbar button')) onTap(b, () => {
  const t = b.dataset.tab; TR('nav', { t });
  $('kzbox').hidden = true;
  if (t === 'home') showTitle(); else if (t === 'rank') showRank(); else if (t === 'ev') showEv(''); else if (t === 'kz') { showTitle(); showKz(); } else showMore();
});
resize();
showTitle();
{
  // 開発用: ?draw で描く画面、?shot=秒&stage=n で その時点のバトル、&result で結果
  const q = new URLSearchParams(location.search);
  const sample = () => { const c = RB.CPU[2]; myRobot = RB.design(c.body, c.arm, c.leg); strokes = { body: myRobot.body, arm: myRobot.arm, leg: myRobot.leg }; };
  if (q.has('stage') && !q.has('shot')) stage = +q.get('stage');
  if (q.has('beaten')) beaten = [true, true, true, true, true];   // 開発用: 早送りボタンを見る
  if (q.get('use')) { const d = RB.decodeDesign(q.get('use')); if (d) { myRobot = withCrown(d); strokes = { body: d.body, arm: d.arm, leg: d.leg }; lsSet('robot', RB.encodeDesign(myRobot)); resetAllRuns(); showTitle(); } }   // オーナーの 確認用: その モンスターを じぶんの モンスターに
  if (KZ_OWNER && q.has('kzgallery')) kzGallery(q.get('kzgallery') || 'head', q.has('nocrown'));   // オーナーの 確認用: ?gachatest&kzgallery=head|face|body|fx（&nocrown で 王冠なし）
  if (KZ_OWNER) {
    if (q.get('kzreveal')) { const it = KZ.ITEMS[+q.get('kzreveal')]; showKz(''); const rv = $('kzreveal'); rv.className = 'r' + it.r; rv.hidden = false; $('kzrstars').textContent = '★'.repeat(it.r); $('kzrname').textContent = it.name; $('kzrsub').textContent = '👀 おためし（まだ つけて ないよ）\nNEW！ ' + KZ.SLOT_LABEL[it.slot] + 'の いちらんから つけてね' + (it.desc ? '\n' + it.desc : ''); kzShow = it; requestAnimationFrame(kzAnim); }
  }
  if (q.has('endingpreview')) { if (!myRobot) sample(); myRobot = withCrown(myRobot); myRobot.crown = true; endingPreview = true; startEnding(); }   // オーナーの 確認用: エンディングの 見本
  if (q.has('rankdev') && RANK_ON) { if (!myRobot) sample(); showRank(); if (q.get('rankdev') === 'replay') setTimeout(() => { if (rankMe && rankMe.recent[0]) { rankReplay(rankMe, rankMe.recent[0]); } }, 3000); }   // 開発用: ランクせん
  if (q.has('minnainfo')) showMinnaInfo();   // 開発用: しょうかい 画面
  if (q.has('certpreview')) { if (!myRobot) sample(); openCertBox(makeCert(plainCode(myRobot), '2026/9/27')); }   // オーナーの 確認用: でんせつ しょうめいしょ
  if (q.has('minna') && MINNA_OPEN) { side = 'minna'; loadSide(); if (q.has('stage')) stage = +q.get('stage'); }   // 開発用: みんな
  if (q.has('ura')) { uraOpen = true; side = 'ura'; loadSide(); if (q.has('stage')) stage = +q.get('stage'); }   // 開発用: うら
  if (q.has('draw')) { if (!myRobot) sample(); if (q.get('draw') === 'arm') { strokes.arm = null; strokes.leg = null; myRobot = null; } showDraw(); }
  if (q.has('shot')) {
    if (!myRobot) sample();
    if (q.has('stage')) stage = +q.get('stage');
    startBattle(q.has('friend') && !!friendRobot);
    const t = +q.get('shot'); let n = 0;
    while (S.t < t && !S.over && n++ < 1000000) stepBattle();
    stop = 0; shake = 0; cam = null; hurt = { A: 0, B: 0 };
    if (q.has('result') && S.over) endAt = -1e9;
    else mode = 'pause';
  }
}
requestAnimationFrame(frame);

// ---------- データの ひきつぎ（ランクせんの サーバーに あずける → コードで べつの 端末へ。さいごに あずけて から 30 日）----------
// あずけるのは この ゲームの localStorage（drawrobot.〜）ぜんぶ。コイン・かざり・ほぞん・クリア・ランクせんの とうろく も いっしょに うつる
function bkAll() { const o = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(KEY)) o[k] = localStorage.getItem(k); } } catch (e) {} return o; }
const bkFmt = c => c.slice(0, 4) + '-' + c.slice(4);
const bkDay = t => { const d = new Date(t); return (d.getMonth() + 1) + '/' + d.getDate(); };
let bkAsk = false, bkBusy = false;
function showBk() {
  bkAsk = false; $('bkload').textContent = 'うけとる'; $('bkmsg').textContent = '';
  const c = lsGet('bk.code'), u = +(lsGet('bk.until') || 0);
  $('bkcode').hidden = !(c && u > Date.now());
  if (c && u > Date.now()) { $('bkcode').textContent = bkFmt(c); $('bkuntil').textContent = bkDay(u) + ' まで つかえるよ（あずけなおすと のびる）'; }
  else $('bkuntil').textContent = '';
  $('bksave').textContent = c && u > Date.now() ? 'いまの データで あずけなおす' : 'データを あずける';
  $('bkbox').hidden = false;
}
async function bkSave() {
  if (bkBusy) return; bkBusy = true; $('bkmsg').textContent = 'あずけちゅう…';
  try {
    const r = await (await fetch(RANK_API + '/bk/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: lsGet('bk.code') || '', key: lsGet('bk.key') || '', data: bkAll() }) })).json();
    if (r.error || !r.code) $('bkmsg').textContent = r.error || 'うまく いかなかった…';
    else {
      const same = r.code === lsGet('bk.code');
      lsSet('bk.code', r.code); lsSet('bk.key', r.key); lsSet('bk.until', String(r.until));
      TR('bksave', { n: same ? 1 : 0 });
      showBk(); $('bkmsg').textContent = 'あずけたよ！ この コードを スクショ か メモ してね';
    }
  } catch (e) { $('bkmsg').textContent = 'つながらなかった…もういちど ためしてね'; }
  bkBusy = false;
}
async function bkLoad() {
  const code = $('bkin').value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 8) { $('bkmsg').textContent = 'コードは 8 もじ（れい: K7M2-QX9P）'; return; }
  if (!bkAsk) { bkAsk = true; $('bkload').textContent = 'いまの データは きえるよ。うけとる？'; return; }
  if (bkBusy) return; bkBusy = true; $('bkmsg').textContent = 'うけとりちゅう…';
  try {
    const r = await (await fetch(RANK_API + '/bk/load', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })).json();
    if (r.error || !r.data) { $('bkmsg').textContent = r.error || 'うまく いかなかった…'; bkAsk = false; $('bkload').textContent = 'うけとる'; bkBusy = false; return; }
    TR('bkload', { n: Object.keys(r.data).length });
    const keep = {}; for (const k of ['backuptest', 'gachatest', 'eventtest', 'navtest']) { const v = lsGet(k); if (v != null) keep[k] = v; }   // オーナーの 印は この 端末の ものを のこす
    try {
      for (const k of Object.keys(bkAll())) localStorage.removeItem(k);
      for (const [k, v] of Object.entries(r.data)) if (typeof k === 'string' && k.startsWith(KEY) && typeof v === 'string') localStorage.setItem(k, v);
      for (const [k, v] of Object.entries(keep)) lsSet(k, v);
    } catch (e) { $('bkmsg').textContent = 'ほぞん できなかった…'; bkBusy = false; return; }
    $('bkmsg').textContent = 'うけとったよ！ よみこみなおすね';
    setTimeout(() => location.replace(location.pathname), 800);
  } catch (e) { $('bkmsg').textContent = 'つながらなかった…もういちど ためしてね'; bkAsk = false; $('bkload').textContent = 'うけとる'; }
  bkBusy = false;
}
$('bkbtn').hidden = !BK_ON;
onTap($('bkbtn'), () => { TR('bkopen', null); showBk(); });
onTap($('bksave'), bkSave);
onTap($('bkload'), bkLoad);
$('bkin').addEventListener('input', () => { bkAsk = false; $('bkload').textContent = 'うけとる'; });
onTap($('bkclose'), () => { $('bkbox').hidden = true; });

// ---------- 言語の 切りかえ（2026-09-30 全員に）----------
if (/[?&]langtest(=|&|$)/.test(location.search)) lsSet('langtest', '1');
$('langbtn').hidden = false;
$('langbtn').textContent = window.LANG === 'en' ? '🌐 日本語' : '🌐 English';
onTap($('langbtn'), () => { const to = window.LANG === 'en' ? 'ja' : 'en'; TR('lang', { to }); window.setLang(to); });
