// かいて！モンスターバトル — 描く画面（からだ・うで・あし）・バトルの描画・勝ち抜き・モンスターを送る
'use strict';
const VERSION = '223';
// あそびの きろく（/t.js。なくても うごく）
window.T_VER = VERSION;
function TR(e, d) { try { if (window.T) window.T(e, d); } catch (err) {} try { if (window.MSN) window.MSN(e, d); } catch (err) {} }   // MSN: 毎日の ミッション（2026-10-04）
// Safari が おぼえていた 古い ページ（index.html）と 新しい game.js が まざると、部品（kazari.js など）が なくて 止まる
// → 1 回だけ、URL に 印を つけて ページごと 読みなおす（2026-09-29 の 解析で 見つかった）
// 部品の 有る無し だけでは、あいだの 版の 古い index.html（kamibox が ない など）を すり抜けて 止まる（10/2 の 解析で 5 台）
// → index.html が 読みこんだ game.js の ?v= が この VERSION と ちがえば 古い ページ
const pageV = (/[?&]v=([^&#]+)/.exec((document.currentScript && document.currentScript.getAttribute('src')) || '') || [])[1];
if ((pageV && pageV !== VERSION) || !window.KZ || !window.KZStage || !window.RB || !window.eventThemeOf || !document.getElementById('langbtn') || !document.getElementById('evbtn')) {   // 古い index.html（あたらしい ボタン・event.js が ない）も
  // 同じ 版への 読みなおしは 1 分に 1 回まで（前は 1 回 きりで、Safari が また 古い ページを 出すと 止まった まま だった）
  let tried = ''; try { tried = sessionStorage.getItem('mon.fix') || ''; } catch (e) {}
  const [tv, tt] = tried.split('|');
  if (tv !== VERSION || Date.now() - (+tt || 0) > 60e3) {
    try { sessionStorage.setItem('mon.fix', VERSION + '|' + Date.now()); } catch (e) {}
    TR('stalefix', { k: !!window.KZ, s: !!window.KZStage, b: !!document.getElementById('langbtn'), pv: pageV || '' });
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
function kamiList() { return tagList('kamigoe'); }   // かみを たおした 形（てんしの わ）
// ちけいの しるし: 地形の うらを その 形で クリアした（地形ごとに 形の 印の リスト 'tmark.<地形>'）。モンスターには ⭐ の 数だけ 出す
function tmarkList(k) { return tagList('tmark.' + k); }
function tmarkCount(d) { if (!d || !window.ARENA) return 0; const tg = codeTag(plainCode(d)); return ARENA.TERRAINS.filter(t => t.key !== 'flat' && tmarkList(t.key).includes(tg)).length; }
// チャンピオン メダル: ランクせんで 1 位に なった 形 → 日数（{ 形: 日数 }）
function champMap() { try { return JSON.parse(lsGet('champ') || '{}'); } catch (e) { return {}; } }
function withCrown(d) { if (d) { const c = plainCode(d); d.crown = d.crown || isCrowned(d); d.legend = d.legend || legendList().includes(codeTag(c)); d.halo = d.halo || kamiList().includes(codeTag(c)); d.champ = Math.max(d.champ || 0, champMap()[c] || 0); } d.tstar = tmarkCount(d); return d; }
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
// オーナーの 端末: ?dev=合言葉 を 1 回 ひらいた 端末だけ。合言葉 そのものは コードに 書かない（SHA-256 だけ）。テストの 印（?kamitest など）と 開発用の URL は オーナーの 端末でだけ 効く（2026-10-02）
function sha256hex(s) {
  const b = unescape(encodeURIComponent(s)), P = [], K = [], H = [];
  for (let c = 2, n = 0; n < 64; c++) { if (P.some(p => c % p === 0)) continue; P.push(c); if (n < 8) H[n] = (Math.pow(c, 1 / 2) * 4294967296) | 0; K[n++] = (Math.pow(c, 1 / 3) * 4294967296) | 0; }
  const w = [], L = b.length * 8;
  for (let i = 0; i < b.length; i++) w[i >> 2] |= b.charCodeAt(i) << (24 - (i % 4) * 8);
  w[b.length >> 2] |= 0x80 << (24 - (b.length % 4) * 8);
  const N = ((b.length + 8 >> 6) + 1) * 16; w[N - 1] = L;
  const r = (x, n) => (x >>> n) | (x << (32 - n));
  for (let j = 0; j < N; j += 16) {
    const W = []; let [a, bb, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      if (i < 16) W[i] = w[j + i] | 0;
      else { const x = W[i - 15], y = W[i - 2]; W[i] = (W[i - 16] + (r(x, 7) ^ r(x, 18) ^ (x >>> 3)) + W[i - 7] + (r(y, 17) ^ r(y, 19) ^ (y >>> 10))) | 0; }
      const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) | 0, t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & bb) ^ (a & c) ^ (bb & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
    }
    [a, bb, c, d, e, f, g, h].forEach((v, k) => H[k] = (H[k] + v) | 0);
  }
  return H.map(v => (v >>> 0).toString(16).padStart(8, '0')).join('');
}
const DEV_H = 'd279613f79af7c5747561599d5b55fc02cdf2f73e24f963f3dd480c555df784e';
{ const m = /[?&]dev=([^&#]+)/.exec(location.search); if (m) { const k = decodeURIComponent(m[1]); if (sha256hex(k) === DEV_H) lsSet('devkey', k); } }
const OWNER = (() => { const k = lsGet('devkey'); return !!k && sha256hex(k) === DEV_H; })();
const devFlag = n => OWNER && lsGet(n) === '1';
// 2026-10-03 画面の 整理（まずは ?tidytest の 端末だけ）: どの タブも「題 → あなた → 本題 → その他」の じゅん、？？？ を へらす、ながい 一覧は みじかく
if (OWNER && /[?&]tidytest(=|&|$)/.test(location.search)) lsSet('tidytest', '1');
const TIDY = true;   // 2026-10-03 全員に（オーナー OK。前は ?tidytest の 端末だけ）
if (OWNER && /[?&]boxtest(=|&|$)/.test(location.search)) lsSet('boxtest', '1');
const BOXT = true;   // 2026-10-03 全員に（オーナー OK。前は ?boxtest の 端末だけ）   // あなたの モンスターなどを 四角で かこむ（まずは ?boxtest の 端末だけ）
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
if (OWNER && /[?&]uratest(=|&|$)/.test(location.search)) lsSet('uratest', '1');
let URA_TEST = devFlag('uratest');
let uraOpen = URA_TEST || lsGet('cleared') === '1';   // おもてを クリアしたら 出る（オーナーの端末は テスト用に いつでも）
// みんなの さいきょう ぐんだん（3 つめの 勝ち抜き）: うらを クリアした 人に 出る（?minnatest の 端末は いつでも）
if (OWNER && /[?&]minnatest(=|&|$)/.test(location.search)) lsSet('minnatest', '1');
let MINNA_OPEN = devFlag('minnatest') || lsGet('ura.cleared') === '1';   // うらを クリアしたら 出る
// かみ（4 つめの 勝ち抜き、2026-10-01〜）: 作者が 作った 意味わからん くらい つよい 5 たい（水平だけ）。みんなを クリアしたら 出る。
// まだ ?kamitest を 開いた 端末（オーナー）だけ（いつでも あそべる）。全員に 出す ときは KAMI_ON を true に
if (OWNER && /[?&]kamitest(=|&|$)/.test(location.search)) lsSet('kamitest', '1');
const KAMI_TEST = devFlag('kamitest'), KAMI_ON = true;   // 2026-10-02 全員に 公開（オーナー OK。前は ?kamitest の 端末だけ）
const KAMI_SHOW = !!RB.KAMI && (KAMI_ON || KAMI_TEST);   // 道に「かみ」の 段が ある（？？？ も ふくむ）
let KAMI_OPEN = KAMI_SHOW && (KAMI_TEST || lsGet('minna.cleared') === '1');
// ちけい ぼうけん（2026-10-01〜）: 地形（arena.js）× おもて・うら。2026-10-01 全員に 公開（水平・がけ・せまい、オーナー OK）
// ?arenatest を 開いた 端末（オーナー）だけ: ?arenaall で 地形を ぜんぶ ひらく、?arenanew で まだ 出して いない 地形（wait）も 出す
if (OWNER && /[?&]arenatest(=|&|$)/.test(location.search)) lsSet('arenatest', '1');
const ARENA_OWNER = devFlag('arenatest');
if (ARENA_OWNER && /[?&]arenaall(=|&|$)/.test(location.search)) lsSet('arenaall', '1');
const ARENA_ON = !!window.ARENA;
if (ARENA_OWNER && /[?&]arenanew(=|&|$)/.test(location.search)) lsSet('arenanew', '1');
// オーナーの OK 待ち（wait）と 相手が まだ 仮（kari）の 地形は 出さない。?arenanew の 端末だけ ためせる
// from（出す 日）は サーバーの 日付で きめる（2026-10-02、スマホの 日付を 進めても 先に 出ない ように）
// サーバーの 日付は version.txt の 返事の Date（checkVersion で 毎回 とる、通信は ふえない）。いちばん 新しい 日を おぼえて おき、開いたら その 日付で すぐ 出す
// → 待つのは 新しい 地形が 出る 日の はじめの 1 回だけ（返事が きたら 一覧に 足す）。日付は もどらない
let srvDay = lsGet('srvday') || '';
const terrainList = () => ARENA_ON ? ARENA.TERRAINS.filter(t => ARENA.released(t, srvDay) || (ARENA_OWNER && lsGet('arenanew') === '1')) : [];
let TERRAINS = terrainList();
// 出て 2 日（出た 日と 次の 日）は NEW。その 地形を 一度 えらんだら 消す（2026-10-03 オーナー OK）
const terNew = t => !!(t.from && srvDay && srvDay >= t.from && Date.parse(srvDay) - Date.parse(t.from) <= 864e5 && lsGet(tpre(t.key) + 'seen') !== '1');
function noteServerDate(h) {
  const t = Date.parse(h || ''); if (!t) return;
  const d = new Date(t + 9 * 3600e3).toISOString().slice(0, 10); if (d <= srvDay) return;
  srvDay = d; lsSet('srvday', d);
  const n = TERRAINS.length; TERRAINS = terrainList();
  if ((TERRAINS.length !== n || TERRAINS.some(terNew)) && mode === 'title') renderRoad();   // 日が かわると NEW も かわる
}
let terrain = TERRAINS.some(t => t.key === lsGet('terrain')) ? lsGet('terrain') : 'flat';
function terrInfo() { return terrain === 'flat' ? null : TERRAINS.find(t => t.key === terrain); }   // 水平（いまの ぼうけん）は null
const tpre = k => (k === 'flat' ? '' : 't.' + k + '.');   // 記録の キーの 頭
function terrainOpen(i) { const t = TERRAINS[i]; if (!t || !t.cpu.omote) return false; if (i === 0 || (ARENA_OWNER && lsGet('arenaall') === '1')) return true; return lsGet(tpre(TERRAINS[i - 1].key) + 'cleared') === '1'; }
function sideOpen(s) {   // いまの 地形で その 段が あそべるか
  if (s === 'omote') return true;
  if (terrain === 'flat') return s === 'ura' ? uraOpen : s === 'kami' ? KAMI_OPEN : MINNA_OPEN;
  const t = terrInfo(); if (!t || !t.cpu[s]) return false;
  return lsGet(tpre(terrain) + (s === 'ura' ? '' : 'ura.') + 'cleared') === '1';   // ?arenaall でも うら・みんな は ふつうどおり（その 地形の 前の 段を クリアで）
}
const SIDE_LABEL = { omote: 'おもて', ura: 'うら', minna: 'みんな', kami: 'かみ' };
// タイトルの 整理（v75）: おもて → うら → みんな を「ぼうけん」の 1 本道に。v77 で 全員に 公開（前は ?titletest の 端末だけ）
const TITLE_TEST = true;
// かざり（v78〜）: コインと ガチャで 見た目だけの かざり。v93 で 全員に 公開（オーナー OK）
// ?gachatest を 開いた 端末（オーナー）だけ 確認用の 一覧（?kzgallery）と 当たりの 見本（?kzreveal）が 使える
if (OWNER && /[?&]gachatest(=|&|$)/.test(location.search)) lsSet('gachatest', '1');
const KZ_ON = true, KZ_OWNER = devFlag('gachatest');
// ランクせんの「じゅんい カード」: 2026-09-29 全員に 公開（前は ?cardtest の 端末だけ）
if (OWNER && /[?&]cardtest(=|&|$)/.test(location.search)) lsSet('cardtest', '1');
const CARD_ON = true;
// モンスターの ほぞん 12 こ（2026-09-29 全員に。前は 3 こ）
const SLOT_N = 12;
// 「データの ひきつぎ」: 2026-09-29 全員に 公開（前は ?backuptest の 端末だけ）
if (OWNER && /[?&]backuptest(=|&|$)/.test(location.search)) lsSet('backuptest', '1');
const BK_ON = true;
const kzs = KZ.store(k => lsGet(k), (k, v) => lsSet(k, v));
function withKz(d) { if (d && KZ_ON) { const e = kzs.eq(); d.kz = e.some(Boolean) ? e : null; } return d; }
let side = uraOpen && lsGet('side') === 'ura' ? 'ura' : MINNA_OPEN && lsGet('side') === 'minna' ? 'minna' : KAMI_OPEN && lsGet('side') === 'kami' ? 'kami' : 'omote';
if (terrain !== 'flat') side = ['ura', 'minna', 'kami'].includes(lsGet('side')) && sideOpen(lsGet('side')) ? lsGet('side') : 'omote';
const sk = n => tpre(terrain) + (side === 'omote' ? '' : side + '.') + n;
function CPUS() { const t = terrInfo(); if (t) return t.cpu[side] || t.cpu.omote; return side === 'ura' ? RB.URA : side === 'minna' ? RB.MINNA : side === 'kami' ? RB.KAMI : RB.CPU; }
const tname = () => terrInfo() ? terrInfo().name + ' ' : '';
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
// 勝ち抜きの とちゅうか（水平の おもて・うら・みんな・かみ と 各地形の 3 つ。いま いない 地形の ぶんも 見る）
function runInProgress() { if (stage > 0) return true; for (const k of ['stage', 'ura.stage', 'minna.stage', 'kami.stage']) if (+(lsGet(k) || 0) > 0) return true; for (const t of TERRAINS) if (t.key !== 'flat') for (const p of ['', 'ura.', 'minna.']) if (+(lsGet(tpre(t.key) + p + 'stage') || 0) > 0) return true; return false; }
function resetAllRuns() { stage = 0; lsSet('stage', '0'); lsSet('ura.stage', '0'); lsSet('minna.stage', '0'); lsSet('kami.stage', '0'); for (const t of TERRAINS) if (t.key !== 'flat') for (const s of ['', 'ura.', 'minna.']) if (lsGet(tpre(t.key) + s + 'stage')) lsSet(tpre(t.key) + s + 'stage', '0'); }
let friendRobot = null;
{ const m = /[#&]r=([A-Za-z0-9_-]+)/.exec(location.hash); if (m) friendRobot = RB.decodeDesign(m[1]); }

// ---------- 画面 ----------
// 画面の 上の よけるべき 高さ（ホーム画面から 開いた iPhone の 時計・電池）。キャンバスの 上の 表示（HP の バーなど）を この ぶん さげる
let SAT = 0, satAt = 0;
const satProbe = document.createElement('div'); satProbe.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:env(safe-area-inset-top);visibility:hidden;pointer-events:none';
document.body.appendChild(satProbe);
document.addEventListener('visibilitychange', () => { satAt = 0; });
function resize() {
  SAT = satProbe.offsetHeight || 0;
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  sizePad(); if (mode === 'draw') drawPad();
}
window.addEventListener('resize', resize);
function show(id) { for (const k of ['title', 'draw', 'result', 'sharebox', 'slotbox', 'handoff', 'rank', 'ev', 'more', 'nakama']) $(k).hidden = k !== id; $('quit').hidden = id !== 'none'; $('fast').hidden = id !== 'none' || !canFast(); updateFastBtn(); navSync(id); if (id !== 'nakama' && typeof nkPool !== 'undefined' && nkPool.length) nkStop(); }
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
  $('tmycard').hidden = !myRobot && !navOn();   // タブの ときは まだ いなくても 大きな わくで「タップで つくる」
  $('tmycard').classList.toggle('empty', !myRobot);
  if (myRobot) drawPreview($('tmon'), withRibbon(withKz(withCrown(myRobot))), ME.color);
  else { const g = $('tmon').getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, $('tmon').width, $('tmon').height); }
  $('tmycard').querySelector('.mc-h').textContent = myRobot ? 'じぶんの モンスター' : 'まだ モンスターが いないよ';
  { const tg = myRobot && window.ARENA ? codeTag(plainCode(myRobot)) : null, names = tg ? ARENA.TERRAINS.filter(t => t.key !== 'flat' && tmarkList(t.key).includes(tg)).map(t => t.name) : [];
    $('tmarks').hidden = !names.length; $('tmarks').textContent = '⭐ ' + names.join('・'); }   // この モンスターが しるしを もって いる 地形
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
  const nt = window.ARENA ? ARENA.TERRAINS.reduce((n, t) => n + (t.key === 'flat' ? 0 : hallCount('hall.' + t.key)), 0) : 0;   // ちけいの でんどういり
  $('collection').hidden = !nl && !nh && !nt;
  $('collsum').textContent = 'コレクション　' + (nl ? '⭐ でんせつ ' + nl + '　' : '') + (nh ? '👑 でんどういり ' + nh + '　' : '') + (nt ? 'ちけい ' + nt : '');
  drawTitleBg();
  setTimeout(fitTmon, 0);
}
// ぼうけんの 道: 出ている 段は タップで えらべる（えらんだ 段が「たたかう」の 相手）。まだの 段は ？？？
// ---------- みんなの きろく（1 時間ごとに まとめた ステージごとの 挑んだ・クリア。受付係の GET /stats）----------
// ひと = 端末、モンスター = 形（同じ 形は 1 体）。開いて いない ステージは「？？？」
const STATS_SHOW = true;   // 2026-10-02 全員に 公開（オーナー OK。前は オーナーの 端末だけ）
let stats = null, statsMode = lsGet('statsmode') === 'm' ? 'm' : 'p';
try { const v = JSON.parse(lsGet('stats') || 'null'); if (v && v.stages) stats = v; } catch (e) {}
function loadStats() {
  // 受付係は 1 時間ごとに 新しく なる。読んで 30 分 たつか、中身が 75 分 より 古ければ 読みなおす（2 分に 1 回まで）。Safari の 保存（キャッシュ）を 使わない
  const now = Date.now(), at = +lsGet('stats.at') || 0;
  if (!STATS_SHOW || (stats && (now - at < 2 * 60e3 || (now - at < 30 * 60e3 && now - (+stats.updated || 0) < 75 * 60e3)))) return;
  lsSet('stats.at', String(now));
  fetch(RANK_API + '/stats?t=' + Math.floor(now / 60e3), { cache: 'no-store' }).then(r => r.json()).then(v => { if (!v || !v.stages) return; stats = v; lsSet('stats', JSON.stringify(v)); lsSet('stats.at', String(Date.now())); if (mode === 'title') renderRoad(); const sb = $('statsbox'); if (sb && !sb.hidden) showStats(true); }).catch(() => {});
}
const statOf = (t, s) => stats && stats.stages[t + '|' + s];
const pctTxt = (a, b) => b ? (a / b * 100 < 10 ? (a / b * 100).toFixed(1) : Math.round(a / b * 100)) + '%' : '−';
function statLine(t, s) {
  const o = STATS_SHOW && statOf(t, s); if (!o) return '';
  const v = o[statsMode]; return '<em class="rd-st">' + (statsMode === 'p' ? '👤 ' : '👾 ') + pctTxt(v[1], v[0]) + '</em>';
}
// その 端末で 開いて いる ステージか（道の ボタンと 同じ。開いて いない ものは「？？？」に して 数字も 出さない）
function statOpen(tk, s) {
  if (tk === 'flat') return s === 'omote' ? true : s === 'ura' ? uraOpen : s === 'minna' ? MINNA_OPEN : KAMI_OPEN;
  const i = TERRAINS.findIndex(t => t.key === tk); if (i < 0 || !terrainOpen(i)) return false;
  return s === 'omote' || lsGet(tpre(tk) + (s === 'ura' ? '' : 'ura.') + 'cleared') === '1';
}
function showStats(again) {
  if (!again) loadStats();   // 開きっぱなしの タブ（Safari など）でも 30 分 すぎて いたら 読みなおす → 届いたら 開いた まま かきなおす
  if (!stats) return;
  if (!again) TR('stats', { m: statsMode, u: stats.updated || 0 });   // u = 手元の 数字の 時刻（古い まま 変わらない ときの 調べ用）
  const box = $('statsbox'), list = $('statslist'), tabs = $('statstabs');
  const draw = () => {
    tabs.innerHTML = '';
    for (const [m, label] of [['p', '👤 ひと'], ['m', '👾 モンスター']]) { const b = document.createElement('button'); b.className = 'st-chip' + (statsMode === m ? ' sel' : ''); b.textContent = label; onTap(b, () => { statsMode = m; lsSet('statsmode', m); draw(); renderRoad(); }); tabs.appendChild(b); }
    list.innerHTML = '';
    const ters = [{ key: 'flat', name: '水平' }].concat((typeof TERRAINS !== 'undefined' ? TERRAINS : []).filter(t => t.key !== 'flat'));
    let locked = 0;   // まだ ひらいて いない 地形は 1 つずつ 出さずに 最後に まとめる（9 つに なると ？？？ だらけで 長い、2026-10-02）
    for (const t of ters) {
      const ti = TERRAINS.findIndex(x => x.key === t.key), terOpen = t.key === 'flat' || (ti >= 0 && terrainOpen(ti));
      if (!terOpen) { locked++; continue; }
      const rows = ['omote', 'ura', 'minna', 'kami'].map(s => [s, statOf(t.key, s)]).filter(x => x[1]); if (!rows.length) continue;
      const sec = document.createElement('div'); sec.className = 'st-sec'; sec.innerHTML = '<div class="st-ter">' + (terOpen ? t.name : '？？？') + '</div>'; list.appendChild(sec);
      for (const [s, o] of rows) {
        const v = o[statsMode], p = v[0] ? v[1] / v[0] : 0, row = document.createElement('div'); row.className = 'st-row st-' + s;
        if (!statOpen(t.key, s)) { row.classList.add('st-lock'); row.innerHTML = '<b>？？？</b><span class="st-bar"></span><span class="st-num"><strong>？？？</strong><small>&nbsp;</small></span>'; sec.appendChild(row); continue; }
        row.innerHTML = '<b>' + SIDE_LABEL[s] + '</b><span class="st-bar"><i style="width:' + Math.max(1.5, p * 100).toFixed(1) + '%"></i></span><span class="st-num"><strong>' + pctTxt(v[1], v[0]) + '</strong><small>' + v[1].toLocaleString() + ' / ' + v[0].toLocaleString() + (statsMode === 'p' ? ' にん' : ' たい') + '</small></span>';
        sec.appendChild(row);
      }
    }
    if (locked) { const el = document.createElement('div'); el.className = 'st-locked'; el.innerHTML = window.LANG === 'en' ? '<b>???</b><br>' + locked + ' more terrain' + (locked > 1 ? 's' : '') + ' (clear the front of the one before to open)' : '<b>？？？</b><br>あと ' + locked + ' この ちけい（まえの ちけいの おもてを クリアすると ひらく）'; list.appendChild(el); }
    const f = d => d ? (+d.slice(5, 7)) + '/' + (+d.slice(8, 10)) : '';
    $('statsnote').textContent = (statsMode === 'p' ? 'ひと＝ちょうせんした たんまつの かず（' + f(stats.from && stats.from.p) : 'モンスター＝ちょうせんした かたちの かず。おなじ かたちは 1 たい（' + f(stats.from && stats.from.m)) + '〜' + f(stats.to) + '）。クリア＝5 たいめに かった。1 じかん ごとに こうしん';
  };
  draw(); box.hidden = false;
}
function renderRoad() {
  $('trecord').hidden = true; $('start').parentNode.style.display = 'none'; $('adv').hidden = false;
  $('tmchint').textContent = myRobot ? '✏ タップで なおす・えらぶ' : '✏ タップで つくる';
  const open = { omote: true, ura: sideOpen('ura'), minna: sideOpen('minna'), kami: sideOpen('kami') };
  const road = $('road'); road.innerHTML = '';
  // 地形の えらびかた（ちけい ぼうけん）
  let tr = $('troad');
  if (ARENA_ON) {
    if (!tr) { tr = document.createElement('div'); tr.id = 'troad'; tr.className = 'troad'; road.parentNode.insertBefore(tr, road); }
    tr.innerHTML = '';
    const lockedIdx = TERRAINS.map((t, i) => terrainOpen(i) ? -1 : i).filter(i => i >= 0), newLocked = lockedIdx.filter(i => terNew(TERRAINS[i]));
    const showLocked = new Set(newLocked.length ? newLocked : lockedIdx.slice(0, 1));
    let hiddenN = 0;
    TERRAINS.forEach((t, i) => {
      if (TIDY && !terrainOpen(i) && !showLocked.has(i)) { hiddenN++; return; }
      const op = terrainOpen(i), b = document.createElement('button');
      b.className = 'tr-chip' + (terrain === t.key ? ' sel' : '') + (op ? '' : ' locked') + (lsGet(tpre(t.key) + 'cleared') === '1' ? ' done' : '');
      b.textContent = op ? t.name : '？？？'; b.disabled = !op;
      if (terNew(t)) { b.classList.add('new'); const nb = document.createElement('i'); nb.className = 'tr-new'; nb.textContent = 'NEW'; b.appendChild(nb); }
      if (op) onTap(b, () => { lsSet(tpre(t.key) + 'seen', '1'); if (terrain === t.key) return; terrain = t.key; lsSet('terrain', terrain); side = 'omote'; lsSet('side', side); loadSide(); TR('terrain', { t: terrain }); showTitle(); });
      tr.appendChild(b);
    });
    if (hiddenN) { const m = document.createElement('span'); m.className = 'tr-more'; m.textContent = '＋あと ' + hiddenN; tr.appendChild(m); }
  }
  let sm = document.getElementById('stmode');
  if (STATS_SHOW && stats) {
    if (!sm) { sm = document.createElement('div'); sm.id = 'stmode'; sm.className = 'stmode'; road.parentNode.insertBefore(sm, road); }
    sm.innerHTML = '';
    for (const [m, label] of [['p', '👤 ひと'], ['m', '👾 モンスター']]) { const b = document.createElement('button'); b.className = 'st-chip' + (statsMode === m ? ' sel' : ''); b.textContent = label; onTap(b, () => { statsMode = m; lsSet('statsmode', m); renderRoad(); }); sm.appendChild(b); }
    const more = document.createElement('button'); more.className = 'st-more'; more.textContent = 'みんなの きろく ›'; onTap(more, () => showStats()); sm.appendChild(more);
  } else if (sm) sm.remove();
  ['omote', 'ura', 'minna', 'kami'].filter(s => s === 'kami' ? KAMI_SHOW && !terrInfo() : s !== 'minna' || !terrInfo() || terrInfo().cpu.minna).forEach((s, i) => {   // かみは 水平だけ   // みんなが まだ ない 地形は 2 つだけ
    if (i) { const ln = document.createElement('i'); ln.className = 'rd-line' + (open[s] ? ' on' : ''); road.appendChild(ln); }
    const k = n => tpre(terrain) + (s === 'omote' ? '' : s + '.') + n;
    const done = lsGet(k('cleared')) === '1' || (terrain === 'flat' && s === 'omote' && uraOpen && !URA_TEST);
    const b = document.createElement('button');
    b.className = 'rd-node rd-' + s + (open[s] ? '' : ' locked') + (done ? ' done' : '') + (open[s] && side === s ? ' sel' : '');
    const st = +(lsGet(k('stage')) || 0);
    b.innerHTML = open[s] ? '<b>' + SIDE_LABEL[s] + '</b><small>' + (done ? '✓ クリア' : (st + 1) + ' / 5') + '</small>' + statLine(terrain, s) : '<b>？？？</b><small>&nbsp;</small>';
    b.disabled = !open[s];
    if (open[s]) onTap(b, () => { if (side === s) return; side = s; lsSet('side', s); loadSide(); TR('road', { s }); showTitle(); });
    road.appendChild(b);
  });
  const go = $('advgo');
  if (!myRobot) { go.innerHTML = 'モンスターを つくる'; go.className = 'main advgo'; return; }
  go.innerHTML = '▶ たたかう<small>' + tname() + SIDE_LABEL[side] + ' ' + (stage + 1) + ' / ' + CPUS().length + ' ' + CPUS()[stage].name + '</small>';
  go.className = 'main advgo' + (side === 'ura' ? ' ura' : side === 'minna' ? ' minna' : side === 'kami' ? ' kami' : '');
  if (terrInfo()) $('tmchint').textContent = '🏔 ' + terrInfo().name + '：' + terrInfo().hint + (terrInfo().cpu.kari ? '（あいては かり）' : '');
}
onTap($('advgo'), () => {
  if (!myRobot) { showDraw(); return; }
  TR('advgo', { side, stage });
  if (side === 'minna' && terrain === 'flat' && lsGet('minna.intro') !== '1') { minnaStartAfterInfo = true; showMinnaInfo(); return; }
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
  else if (terrInfo()) setHint('🏔 ' + terrInfo().name + '：' + terrInfo().hint + (stage > 0 ? '（かちぬき ちゅう：かえると 1 たいめから）' : ''));
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
  // ちけいの どうくつ: 足もとから てんじょうまでの 高さを 点線で（いちばん 下の 点から はかる）
  const ar = !vs && !evd && terrInfo();
  if (ar && ar.arena.ceil && d.body && d.body.length > 1) {
    let low = -Infinity; for (const k of ['body', 'arm', 'leg']) for (const p of d[k] || []) low = Math.max(low, p[1]);
    const y = low - ar.arena.ceil + RB.T * 2;
    g.setLineDash([8, 6]); g.strokeStyle = '#80deea'; g.lineWidth = 2; g.beginPath(); g.moveTo(RB.PAD.x0, y); g.lineTo(RB.PAD.x1, y); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#80deea'; g.font = '700 11px sans-serif'; g.textAlign = 'left'; g.fillText('てんじょう', RB.PAD.x0 + 4, y - 4);
  }
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
  if ((d.crown || d.legend || d.halo || kz[0]) && d.body && d.body.length > 2) {
    const c = crownSpot(d.body.map(p => ({ x: p[0], y: p[1] })));
    const hh = kz[0] ? KZ.drawHead(g, kz[0], c.x, c.y - 1, c.hs) : 0;   // かざりの ぼうしの 上に 王冠・星
    if (d.crown) drawCrown(g, c.x, c.y - 1 - hh, c.s);
    if (d.legend) drawStar(g, c.x, c.y - 1 - hh - (d.crown ? c.s * 0.8 : 0) - c.s * 0.45, c.s * 0.45);
    if (d.halo) drawHalo(g, c.x, c.y - 1 - hh - (d.crown ? c.s * 0.8 : 0) - (d.legend ? c.s * 0.95 : 0) - c.s * 0.35, c.s);
  }
  if (d.tstar && d.body && d.body.length > 2) { const c = crownSpot(d.body.map(p => ({ x: p[0], y: p[1] }))); drawTStar(g, c.x + c.s * 1.15, c.y - 1 - c.s * 0.35, c.s * 0.42, d.tstar); }
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
// ちけいの しるし: みどりの 星に 数（うらを クリアした 地形の 数。何こ ふえても 大きさは おなじ）
function drawTStar(g, x, y, r, n) {
  g.save(); g.lineJoin = 'round'; g.lineWidth = Math.max(1.2, r * 0.16); g.strokeStyle = '#0b3d36'; g.fillStyle = '#26a69a';
  g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.5 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#fff'; g.font = '900 ' + Math.round(r * 0.95) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(Math.min(n, 99)), x, y + r * 0.08);
  g.restore();
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
function drawHalo(g, x, y, s) {
  const rx = s * 0.95, ry = s * 0.3, t = performance.now() / 1000;
  g.save(); g.shadowColor = '#fff3b0'; g.shadowBlur = s * 0.9;
  g.lineWidth = Math.max(3, s * 0.2); g.strokeStyle = '#b8860b'; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.stroke();
  g.lineWidth = Math.max(2, s * 0.12); g.strokeStyle = '#ffe066'; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.stroke();
  g.shadowBlur = 0; g.lineWidth = Math.max(1.5, s * 0.07); g.strokeStyle = '#fffbe6'; const a0 = (t * 1.6) % (Math.PI * 2);
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, a0, a0 + 0.9); g.stroke(); g.restore();
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
  if ((d.crown || d.legend || d.halo || hat) && d.body && d.body.length > 2) { const cs = crownSpot(d.body.map(p => ({ x: p[0], y: p[1] }))); y0 = Math.min(y0, cs.y - (d.crown ? cs.s * 0.8 : 0) - (d.legend ? cs.s * 0.95 : 0) - (d.halo ? cs.s * 0.75 : 0) - (hat ? cs.hs * 1.05 : 0)); }
  const fx = anim && d.kz && d.kz[3] && d.body && d.body.length > 2 ? d.kz[3] : 0;
  if (fx) { const big = fx === 84 ? 120 : [24, 73, 75, 76, 78, 79, 80].includes(fx) ? 60 : 30; y0 -= fx === 84 ? 130 : 55; x0 -= big; x1 += big; y1 += 10; }   // えふぇくとの ぶん 広く（つばさ・ブラックホール などは もっと）
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
  if (!vs && !evd && runInProgress()) { resetAllRuns(); updateSideUi(); }
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
  const ar = friend ? null : terrInfo();
  if (ar && RB.create(myRobot, CPUS()[stage], ar.arena).A.tall) { showDraw(); setHint('てんじょうに つかえて はいれない！ せを ひくく かきなおしてね（てんせんより したに）'); TR('arenatall', { stage }); return; }
  opp = friend ? { name: FRIEND.name, color: FRIEND.color, d: friendRobot } : { name: CPUS()[stage].name, color: CPUS()[stage].color, d: CPUS()[stage] };
  S = RB.create(myRobot, opp.d, ar && ar.arena); S.stageInfo = ar; S.terrain = ar ? terrain : null; S.tstarA = friend ? 0 : tmarkCount(myRobot); S.stage = stage; S.side = friend ? 'friend' : side; S.crownA = !!myRobot.crown; S.crownB = !!opp.d.crown; S.legendA = !!myRobot.legend; S.legendB = !!opp.d.legend; S.haloA = !!myRobot.halo; S.haloB = !!opp.d.halo; S.champA = myRobot.champ || 0; S.champB = opp.d.champ || 0;
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
    } else if (e.t === 'fall') {
      for (const k of e.who.split('')) pops.push({ x: S[k].x, y: S[k].y - 120, t: 'おちた！', c: '#ffffff', life: 90, size: 30 });
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
  const ura = S.side === 'ura', minna = S.side === 'minna', kami = S.side === 'kami', si = S.stageInfo;
  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, si ? si.sky[0] : ura ? '#1a0610' : minna ? '#04161a' : kami ? '#000000' : '#15173a'); sky.addColorStop(1, si ? si.sky[1] : ura ? '#4a0f1f' : minna ? '#0f3d3a' : kami ? '#4a3a00' : '#3a2a63');   // かみは 黒から 金   // うらは 赤黒い、みんなは 青緑
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  const c = camera(), gy = H * 0.72;
  let sx = 0, sy = 0; if (shake > 0) { sx = (rnd() - .5) * shake; sy = (rnd() - .5) * shake; shake *= 0.86; if (shake < 0.3) shake = 0; }
  ctx.save(); ctx.translate(W / 2 + sx, gy + sy); ctx.scale(c.k, c.k); ctx.translate(-c.x, 0);
  // 観客席のライト
  ctx.fillStyle = 'rgba(124,131,255,.08)';
  for (let x = -RB.HW - 200; x < RB.HW + 200; x += 90) { ctx.beginPath(); ctx.moveTo(x, -420); ctx.lineTo(x + 40, 0); ctx.lineTo(x - 40, 0); ctx.fill(); }
  if (si) drawArena(si);
  else {
    // かべ
    ctx.fillStyle = '#2b2f6b';
    ctx.fillRect(-RB.HW - 60, -500, 60, 520); ctx.fillRect(RB.HW, -500, 60, 520);
    // ゆか
    ctx.fillStyle = '#4b3f8f'; ctx.fillRect(-RB.HW - 300, 0, 2 * RB.HW + 600, 200);
    ctx.fillStyle = '#7c83ff'; ctx.fillRect(-RB.HW, 0, 2 * RB.HW, 5);
    ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 2;
    for (let x = -RB.HW; x <= RB.HW; x += 60) { ctx.beginPath(); ctx.moveTo(x, 5); ctx.lineTo(x * 1.3, 120); ctx.stroke(); }
  }
  for (const k of ['B', 'A']) drawRobotWorld(S[k], k === 'A' ? (S.leftColor || ME.color) : opp.color, hurt[k] > 0, k === 'A' ? S.crownA : S.crownB);
  if (si && si.arena.water) {   // 水: モンスターの 上から うすい 青（水面は ゆっくり ゆれる）
    const wy = -si.arena.water; ctx.fillStyle = 'rgba(41,121,255,.28)'; ctx.fillRect(-900, wy, 1800, 900 - wy);
    ctx.strokeStyle = 'rgba(179,229,252,.8)'; ctx.lineWidth = 4; ctx.beginPath(); for (let x = -900; x <= 900; x += 30) ctx.lineTo(x, wy + 6 * Math.sin(x / 60 + S.t * 2)); ctx.stroke();
  }
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
// ちけい: 床（線で つないだ 高さ）・かべ・てんじょう
function drawArena(si) {
  const a = si.arena, xs = [-900].concat((a.floor || []).map(p => p[0]), [900]);
  const path = () => { ctx.beginPath(); ctx.moveTo(xs[0], -RB.floorH(a, xs[0])); for (const x of xs) ctx.lineTo(x, -RB.floorH(a, x)); };
  path(); ctx.lineTo(900, 900); ctx.lineTo(-900, 900); ctx.closePath(); ctx.fillStyle = si.ground; ctx.fill();
  path(); ctx.strokeStyle = si.edge; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.stroke();
  if (si.ice) { ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3; for (let x = -330; x < 380; x += 150) { ctx.beginPath(); ctx.moveTo(x, 14); ctx.lineTo(x + 50, 6); ctx.stroke(); } }   // こおりの つや（大きく・まばらに）
  if (a.belt) {   // 動く床: いま 動いている 向きに 矢印（速さで こさ）
    const v = a.belt * Math.sin(2 * Math.PI * S.t / (a.beltT || 4)), dir = v >= 0 ? 1 : -1, al = Math.min(1, Math.abs(v) / a.belt) * 0.9;
    ctx.fillStyle = 'rgba(255,202,40,' + al.toFixed(2) + ')';
    const off = ((S.t * v) % 80 + 80) % 80;
    for (let x = -260 + off; x < 240; x += 80) { ctx.beginPath(); ctx.moveTo(x + dir * 14, 12); ctx.lineTo(x - dir * 8, 4); ctx.lineTo(x - dir * 8, 20); ctx.closePath(); ctx.fill(); }
  }
  if (a.hw) { ctx.fillStyle = 'rgba(20,22,50,.85)'; ctx.fillRect(-a.hw - 300, -700, 300, 1000); ctx.fillRect(a.hw, -700, 300, 1000); ctx.fillStyle = si.edge; ctx.fillRect(-a.hw - 5, -700, 5, 1000); ctx.fillRect(a.hw, -700, 5, 1000); }
  if (a.ceil) {
    ctx.fillStyle = si.ground; ctx.fillRect(-900, -a.ceil - 600, 1800, 600); ctx.fillStyle = si.edge; ctx.fillRect(-900, -a.ceil - 5, 1800, 5);
    ctx.fillStyle = si.ground; for (let x = -840; x < 900; x += 170) { ctx.beginPath(); ctx.moveTo(x - 22, -a.ceil); ctx.lineTo(x, -a.ceil + 34); ctx.lineTo(x + 22, -a.ceil); ctx.fill(); }   // つらら（大きく・まばらに）
  }
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
  ctx.fillStyle = 'rgba(0,0,0,.3)'; { const fy = S && S.arena ? -RB.floorH(S.arena, b.x) : 0; if (fy < 300 && b.y < fy) { ctx.beginPath(); ctx.ellipse(b.x, fy + 3, 60, 8, 0, 0, 7); ctx.fill(); } }   // かげは その場所の 床に
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
  if (S.side === 'kami' && b === S.B) { ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 34; }   // かみの 敵は 白く 光る
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
  const legend = (b === S.A && S.legendA) || (b === S.B && S.legendB), halo = (b === S.A && S.haloA) || (b === S.B && S.haloB), hat = kz ? kz[0] : 0;
  if (crown || legend || halo || hat) { const cs = crownSpot(b.bodyPts), c = tf(cs.x, cs.y); ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(b.th); const hh = hat ? KZ.drawHead(ctx, hat, 0, -1, cs.hs) : 0; if (crown) drawCrown(ctx, 0, -1 - hh, cs.s); if (legend) drawStar(ctx, 0, -1 - hh - (crown ? cs.s * 0.8 : 0) - cs.s * 0.45, cs.s * 0.45); if (halo) drawHalo(ctx, 0, -1 - hh - (crown ? cs.s * 0.8 : 0) - (legend ? cs.s * 0.95 : 0) - cs.s * 0.35, cs.s); ctx.restore(); }
  if (kz && kz[3] && (mode === 'battle' || mode === 'pause')) kzFx(kz[3], tf, w, ex, ey, legA, legB);
  const tst = b === S.A ? S.tstarA : 0;
  if (tst) { const cs = crownSpot(b.bodyPts), c = tf(cs.x, cs.y); ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(b.th); drawTStar(ctx, b.facing * cs.s * 1.15, -1 - cs.s * 0.35, cs.s * 0.42, tst); ctx.restore(); }
  const champ = b === S.A ? S.champA : S.champB;
  if (champ) { const ms = medalSpot(b.bodyPts, b.facing, false), c = tf(ms.x, ms.y); ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(b.th); drawMedal(ctx, 0, 0, ms.r); ctx.restore(); }
  limb(ctx, legA, '#455a64', 1);
  arm(ctx, joint(b.arm), color);
  if (kz && kz[3] && (mode === 'battle' || mode === 'pause')) kzFxLayer(b, kz[3], true);   // かざり: 体の まえの えふぇくと
}
function drawHud() {
  // iPhone は 開いた 直後に 時計の 高さを 0 と 返す ことが あり、resize の ときだけ はかると 0 の まま HP が 時計に かぶる（2026-10-03 オーナーの 画面）
  // → 戦いの あいだ 1 秒に 1 回 はかりなおす（CSS の ボタンは いつも 今の 高さ なので かぶらない）
  const nowMs = performance.now(); if (nowMs - satAt > 1000) { satAt = nowMs; SAT = satProbe.offsetHeight || 0; }
  const top = 12 + SAT, bw = (W - 110) / 2;   // SAT: 時計・電池の ぶん（ホーム画面から 開いた とき・iOS 26 の Safari）
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
  if (!isFriend) { ctx.font = '700 12px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText(S.stageInfo ? S.stageInfo.name + ' ' + SIDE_LABEL[S.side] + ' かちぬき ' + (S.stage + 1) + ' / ' + CPUS().length : (S.side === 'ura' ? 'うら ' : S.side === 'minna' ? 'みんなの さいきょう ' : S.side === 'kami' ? 'かみの ' : '') + 'かちぬき ' + (S.stage + 1) + ' / ' + CPUS().length, W / 2, top + 54); }
  if (S.t < 1) big('ファイト！', '#ffd54f', 1 - S.t);
  if (S.over) big(S.reason === 'ko' ? 'KO！' : S.reason === 'fall' ? 'おちた！' : 'じかんぎれ', S.winner === 'A' ? '#ffd54f' : '#ff8a80', 1);
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
  TR('result', { side: S.side, ter: S.terrain || undefined, stage: S.stage, opp: opp && opp.name, win: S.winner === 'A' ? 'win' : S.winner === 'B' ? 'lose' : 'draw', reason: S.reason, t: Math.round(S.t * 10) / 10, d: S.d, fast: fast });
  $('share').hidden = false; $('vstitle').hidden = true; $('redraw').hidden = false; $('redraw').textContent = 'モンスターを なおす';
  $('cert').hidden = true; $('torank').hidden = true;
  $('next').textContent = 'つぎの あいてへ'; $('next').classList.remove('ura', 'minna', 'kami'); $('again').className = 'main'; goUra = false; goMinna = false; goKami = false;
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
    $('vstitle').hidden = false; $('vstitle').textContent = S.evBattle ? 'イベントへ もどる' : S.nkBattle ? 'なかまへ もどる' : 'ランクせんへ もどる';
    return;
  }
  const win = S.winner === 'A', draw = S.winner == null;
  $('rtitle').textContent = win ? 'かち！' : draw ? 'ひきわけ' : 'まけ…';
  $('rtitle').className = 'rtitle ' + (win ? 'win' : draw ? '' : 'lose');
  $('rsub').textContent = (S.reason === 'ko' ? 'KO（' + S.t.toFixed(1) + ' びょう）' : S.reason === 'fall' ? (win ? 'あいてが おちた！' : draw ? 'どっちも おちた' : 'おちちゃった…') + '（' + S.t.toFixed(1) + ' びょう）' : 'じかんぎれ（のこり HP ' + Math.ceil(S.A.hp) + ' たい ' + Math.ceil(S.B.hp) + '）') + '\nパンチ ' + S.A.hits + ' はつ・ダメージ ' + Math.round(S.A.dealt);
  let showNext = false, wins = stage;
  if (!isFriend) {
    if (win) {
      wins = stage + 1;
      if (!beaten[stage]) { beaten[stage] = true; lsSet(sk('beaten'), JSON.stringify(beaten)); }
      if (stage < CPUS().length - 1) { stage++; lsSet(sk('stage'), String(stage)); showNext = true; }
      else {
        cleared = true; lsSet(sk('cleared'), '1'); resetRun();
        const ti = terrInfo();
        if (side === 'ura' && !ti) { onUraClear(); checkLimitKz(); }
        if (ti) {   // ちけい: おもて → うら → みんな、おもてで つぎの 地形
          $('rsub').textContent += '\n' + ti.name + ' の ' + SIDE_LABEL[side] + ' 5 たい かちぬき たっせい！';
          TR('terrainclear', { t: terrain, s: side, me: plainCode(myRobot) });
          if (side === 'omote' && ti.cpu.ura) { $('rsub').textContent += '\n…' + ti.name + ' の うら が あらわれた！'; goUra = true; }
          if (side === 'ura' && ti.cpu.minna) { $('rsub').textContent += '\n…' + ti.name + ' の みんな が あらわれた！'; goMinna = true; }
          if (side === 'ura') onTerrainUraClear(ti);
        }
        if (side === 'omote' && ARENA_ON) { const i = TERRAINS.findIndex(t => t.key === terrain), nx = TERRAINS[i + 1]; if (nx && nx.cpu.omote) $('rsub').textContent += '\n🏔 つぎの ちけい「' + nx.name + '」が ひらいた！'; }
        if (side === 'minna' && !ti) { onMinnaClear(); $('rsub').textContent += '\nみんなの さいきょう ぐんだん を\nたおした！！！\nでんせつ の モンスター に なった！'; if (KAMI_SHOW) { const firstK = !KAMI_OPEN; KAMI_OPEN = true; $('rsub').textContent += firstK ? '\n…かみ が あらわれた！' : '\nかみ が まってるぞ…'; goKami = true; } }
        if (side === 'kami' && !ti) { onKamiClear(); $('rsub').textContent += '\n…うそでしょ？\nかみ を たおした！！！！\nきみの モンスターは「かみごえ」に なった！'; }
        if (ti) {}
        else if (side === 'ura') { $('rsub').textContent += '\nうら 5 たい かちぬき たっせい！！\nすごすぎる！'; const firstM = !MINNA_OPEN; MINNA_OPEN = true; $('rsub').textContent += firstM ? '\n…みんなの さいきょう ぐんだん が\nあらわれた！' : '\nみんなの さいきょう ぐんだん が\nまってるぞ…！'; goMinna = true; }
        else if (side === 'omote') { $('rsub').textContent += '\n5 たい かちぬき たっせい！'; const firstUra = !uraOpen; uraOpen = true; $('rsub').textContent += firstUra ? '\n…うら かちぬき が あらわれた！' : '\nうら かちぬき が まってるぞ…！'; goUra = true; }
      }
    } else {
      resetRun();
      $('rsub').textContent += '\n' + wins + ' にんぬき で おわり';
    }
    if (wins > best) { best = wins; lsSet(sk('best'), String(best)); $('rsub').textContent += '\nさいこう きろく！'; }
    // かざりの コイン: 同じ 形で 同じ 相手に 勝つたび 半分（形を 変えれば 元どおり）
    if (KZ_ON && win) {
      const rw = KZ.winReward(kzs, plainCode(myRobot), S.side, S.stage, S.stage === CPUS().length - 1, tpre(terrain));
      TR('coin', { s: S.side, st: S.stage, got: rw.got, n: rw.n });
      $('rsub').textContent += '\n🪙 +' + rw.got + (rw.got === 0 && rw.win.base > 0 ? '（おなじ かたちで かちすぎ！ かたちを かえると もどるよ）' : rw.n > 0 ? '（この かたちで ' + (rw.n + 1) + ' かいめ → へったよ）' : '') + '　もちコイン ' + kzs.coins();
    }
  }
  $('rprog').innerHTML = isFriend ? 'ともだちの モンスター と しょうぶ' : CPUS().map((c, i) => '<span class="dot ' + (i < wins ? 'ok' : i === wins && !win ? 'lost' : i === wins ? 'now' : '') + '">' + c.name + '</span>').join('');
  $('next').hidden = !showNext && !goUra && !goMinna && !goKami;
  $('again').hidden = showNext;
  if (RANK_ON && !isFriend && win && S.stage === 4 && !S.stageInfo && (!rankMe || rankMe.code !== plainCode(myRobot))) $('torank').hidden = false;
  if (goUra) { $('next').innerHTML = tname() + 'うら かちぬき へ！<small>とんでもなく つよい 5 たい</small>'; $('next').classList.add('ura'); $('again').className = 'sub'; $('again').textContent = 'おもてを もういちど'; }
  if (goMinna) { $('next').innerHTML = 'みんなの さいきょう<br>ぐんだん へ！<small>うらを クリアした みんなの 5 たい</small>'; $('next').classList.add('minna'); $('again').className = 'sub'; }
  if (goKami) { $('next').innerHTML = 'かみ へ！<small>さくしゃが つくった いみわからん くらい つよい 5 たい</small>'; $('next').classList.add('kami'); $('again').className = 'sub'; }
  $('again').textContent = isFriend ? 'もういちど' : goUra ? 'おもてを もういちど' : goMinna ? 'うらを もういちど' : goKami ? 'みんなを もういちど' : '1 たいめから もういちど';
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
const kzShown = it => it && (!it.stamp || MSN_ON || kzs.own().includes(it.id)) && (!it.sup || kzs.own().includes(it.id)) && (!it.lim || ARENA_ON || kzs.own().includes(it.id));   // おうえんの お礼（sup）は もって いる 人だけ   // ちけいの 限定かざりは ちけいが 出ている 端末だけ（もって いれば 出す）
// ガチャで 出る かざり（80 種）と、出ない かざり（ちけいの ごほうび lim・おうえんの お礼 sup）を わけて 見せる（2026-10-04 オーナー）
const kzGacha = it => !it.lim && !it.sup && !it.stamp;
const kzHow = it => it.lim ? 'ちけいの うらを ' + it.lim + ' つ クリア' : it.stamp ? 'ミッションの スタンプを 7 こ' : 'おうえんの おれい';
function kzSorted(slot) { return KZ.ITEMS.filter(it => kzShown(it) && it.slot === slot).sort((a, b) => a.r - b.r || a.id - b.id); }
const kzOpen = new Set((() => { try { return JSON.parse(lsGet('kz.open') || '[]'); } catch (e) { return []; } })());
// NEW: 手に 入れて から まだ 一覧で タップして いない かざり（ガチャで 自動で ついた ぶんも まだ NEW）。はじめは 持っている ものを ぜんぶ 見た ことに
function kzSeen() { try { const v = lsGet('kz.seen'); if (v == null) { const o = kzs.own(); lsSet('kz.seen', JSON.stringify(o)); return o; } return JSON.parse(v); } catch (e) { return []; } }
function kzMarkSeen(id) { const s = kzSeen(); if (!s.includes(id)) { s.push(id); lsSet('kz.seen', JSON.stringify(s)); } }
function showKz(msg) {
  $('kzbox').hidden = false; navSync('kz');
  if (!kzAnimOn) { kzAnimOn = true; requestAnimationFrame(kzAnim); }   // 下の タブから 開いた ときも 見本・おためしを 動かす（前は かざりボタン からだけで、おためしの 絵が 出なかった）
  $('kzcoins2').textContent = '🪙 ' + kzs.coins();
  $('kzpull').disabled = kzs.coins() < KZ.PRICE;
  $('kzpull10').disabled = kzs.coins() < KZ.MULTI_PRICE;
  if (msg != null) $('kzmsg').innerHTML = msg;
  if (myRobot) drawPreview($('kzprev'), withKz(withCrown(myRobot)), ME.color);
  const own = kzs.own(), eq = kzs.eq(), seen = kzSeen(), list = $('kzlist'); list.innerHTML = '';
  const gAll = KZ.ITEMS.filter(it => it && kzGacha(it)), gGot = gAll.filter(it => own.includes(it.id)).length;
  $('kzgot').textContent = gGot >= gAll.length ? 'ガチャの かざりは ぜんぶ そろった！🎉' : 'ガチャの かざり ' + gGot + ' / ' + gAll.length;
  KZ.SLOTS.forEach((slot, si) => {
    // 場所ごとに 折りたたみ（見出しに 集めた数 と いま つけている もの）。開いて いるかは おぼえておく
    const box = document.createElement('details'); box.className = 'kz-slot'; box.open = kzOpen.has(slot);
    box.addEventListener('toggle', () => { if (box.open) kzOpen.add(slot); else kzOpen.delete(slot); lsSet('kz.open', JSON.stringify([...kzOpen])); });
    const cur = KZ.ITEMS[eq[si]], total = KZ.ITEMS.filter(it => kzShown(it) && it.slot === slot), gac = total.filter(kzGacha), ext = total.filter(it => !kzGacha(it));
    const got = gac.filter(it => own.includes(it.id)).length, gotX = ext.filter(it => own.includes(it.id)).length;   // 数は ガチャの ぶんと 🎁（ガチャでは でない）を べつに
    const nNew = total.filter(it => own.includes(it.id) && !seen.includes(it.id)).length;
    box.innerHTML = '<summary><b>' + KZ.SLOT_LABEL[slot] + '</b><span class="kz-cnt">' + got + ' / ' + gac.length + '</span>' + (ext.length ? '<span class="kz-cnt kz-cntx">🎁 ' + gotX + ' / ' + ext.length + '</span>' : '') + (nNew ? '<span class="kz-new">NEW ' + nNew + '</span>' : '') + '<span class="kz-cur">' + (cur ? 'いま: ' + cur.name : 'なし') + '</span></summary>' + (cur && cur.desc ? '<small class="kz-desc">' + cur.desc + '</small>' : '') + '<div class="kz-items"></div>';
    const row = box.querySelector('.kz-items');
    const none = document.createElement('button'); none.textContent = 'なし'; none.className = eq[si] ? '' : 'on';
    onTap(none, () => { const e = kzs.eq(); e[si] = 0; kzs.setEq(e); showKz(); }); row.appendChild(none);
    let xl = false;
    for (const it of kzSorted(slot).sort((a, b) => kzGacha(b) - kzGacha(a))) {   // ★ → ★★ → ★★★（同じ 星の 中は 番号じゅん）。ガチャで 出ない ものは さいごに 見出しを つけて
      if (!kzGacha(it) && !xl) { xl = true; const h = document.createElement('div'); h.className = 'kz-xlab'; h.textContent = '🎁 ガチャでは でない'; row.appendChild(h); }
      const has = own.includes(it.id), b = document.createElement('button');
      b.className = 'r' + it.r + (eq[si] === it.id ? ' on' : '') + (has ? '' : ' no');
      b.textContent = has ? '★'.repeat(it.r) + ' ' + it.name : '？？？';
      if (!kzGacha(it)) { b.classList.add('kz-x'); const s = document.createElement('small'); s.textContent = kzHow(it); b.appendChild(s); }   // 手に 入れかた
      if (has && !seen.includes(it.id)) { const nb = document.createElement('i'); nb.className = 'kz-nb'; nb.textContent = 'NEW'; b.appendChild(nb); }
      if (has) onTap(b, () => { kzMarkSeen(it.id); const e = kzs.eq(); e[si] = e[si] === it.id ? 0 : it.id; kzs.setEq(e); TR('kzeq', { s: slot, id: e[si] }); showKz(); });
      else b.disabled = true;
      row.appendChild(b);
    }
    list.appendChild(box);
  });
}
onTap($('kzopen'), () => { showKz(''); });
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
    kzShow = r.item; kzRevealDraw();
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
    kzShow = best.item; kzRevealDraw();
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
var kzAnimOn = false;
function kzRevealDraw() {   // 当たりの おためしは 素の モンスターに その かざりだけ（出た ときに すぐ 1 回、あとは kzAnim で 動く）
  if (!kzShow || !myRobot) return;
  const d = Object.assign({}, myRobot, { crown: false, legend: false, champ: 0 }), e = [0, 0, 0, 0]; e[KZ.SLOTS.indexOf(kzShow.slot)] = kzShow.id; d.kz = e; drawPreview($('kzrcv'), d, ME.color, true);
}   // var: showKz から 先に よばれても だいじょうぶ
function kzAnim() {
  if ($('kzbox').hidden) { kzAnimOn = false; return; }
  if (myRobot) {
    drawPreview($('kzprev'), withKz(withCrown(myRobot)), ME.color, true);
    kzRevealDraw();
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
let goMinna = false, goKami = false;   // goKami: みんなを クリアした 直後: つぎへ ボタンが「かみ へ」   // うらを クリアした 直後: つぎへ ボタンが「みんなの さいきょう ぐんだん へ」
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
function toMinna(from) { goMinna = false; side = 'minna'; lsSet('side', side); loadSide(); updateSideUi(); TR('gotominna', { from }); if (terrain === 'flat' && lsGet('minna.intro') !== '1') { showMinnaInfo(); return true; } return false; }
onTap($('next'), () => { if (!vs && goKami) { goKami = false; side = 'kami'; lsSet('side', side); loadSide(); updateSideUi(); TR('gotokami', { from: 'result' }); startBattle(false); return; } if (!vs && goMinna) { if (toMinna('result')) minnaStartAfterInfo = true; else startBattle(false); return; } if (vs) startVsMode(); else if (goUra) { goUra = false; side = 'ura'; lsSet('side', side); loadSide(); updateSideUi(); TR('gotoura', { from: 'result' }); startBattle(false); } else startBattle(false); });
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
// 通信回数を へらす（2026-09-30）: 順位表は まず GitHub の board 枝の ファイル（15 分ごとの 計算で 書く、GitHub が 5 分 おぼえる）。
// とれない・古い ときだけ 受付係。自分の ぶんは /rank?dev=&notop=1 の 1 回（登録した ことが ない 端末は 聞かない）。1 分 以内の 開きなおしは 聞かない
const BOARD_URL = 'https://raw.githubusercontent.com/renmy-stack/draw-monster/board/';
async function boardFile(name, ok) {
  if (/[?&]localapi(&|$)/.test(location.search)) return null;
  try { const j = await (await fetch(BOARD_URL + name)).json(); return j && ok(j) ? j : null; } catch (e) { return null; }   // きょうの 日付なら つかう（夜は 計算が 動かないので 受付係の 表も おなじ 古さ）
}
function meCache(k, me) { if (me !== undefined) { lsSet(k, JSON.stringify({ t: Date.now(), me })); return me; } try { const c = JSON.parse(lsGet(k) || 'null'); return c && Date.now() - c.t < 10 * 60e3 ? c : null; } catch (e) { return null; } }
let rankAt = 0, rankMeAt = 0;
// 前後の 人の 形は 順位の データに 入って いる（前の 版の 受付係なら /mon で 聞いて、1 度 聞いたら おぼえる）
const monMem = new Map();
function monGet(id) { if (!monMem.has(id)) monMem.set(id, fetch(RANK_API + '/mon?id=' + encodeURIComponent(id)).then(r => r.json()).catch(e => { monMem.delete(id); throw e; })); return monMem.get(id); }
async function loadRank(force) {
  if (!force && rankTop && Date.now() - rankAt < 60e3) return;
  try {
    const reg = lsGet('rank.reg') === '1', file = await boardFile('top.json', j => j.season === jstDay());
    let t = file, m = null;
    if (!file || reg) { const r = await fetch(RANK_API + '/rank?dev=' + rankDev() + (file ? '&notop=1' : '') + '&lg=1').then(r => r.json()); t = file || r.top; m = r.me; }
    rankTop = t; rankMe = m ? m.me : null; rankDown = false; rankAt = rankMeAt = Date.now(); meCache('rank.mec', rankMe);
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
  mode = 'rank'; show('rank'); rankPollN = 0;
  $('rankmsg').textContent = msg || '';
  renderRank();
  loadRank().then(() => { if (mode === 'rank') { renderRank(); if (rankGotMedal) { $('rankmsg').textContent = '🏆 チャンピオン メダルを もらった！（チャンピオン ' + rankGotMedal + ' かいめ）'; rankGotMedal = 0; } } });
}
// ---------- リーグ と 成長（2026-10-03〜、まずは ?leaguetest の 端末だけ）----------
// 950 体中 何百位 だと 次の 目標が 見えない → 順位の わりあいで 5 つの リーグに 分け、リーグの 中の 順位と「あと ○ い で 次の リーグ」を 出す
// 上がった ときは「○ い アップ」「○○ に あがった」「じこベスト」を 出す（端末に 前の 順位を おぼえる）。総当たりの 計算は 今の まま
const LG_ON = true;   // 2026-10-03 全員に（オーナー OK。前は ?leaguetest の 端末だけ）
// 0 ブロンズ … 4 ダイヤ・5 マスター・6 グランドマスター・7 レジェンド（tools/league.js と 同じ。人が ふえたら 上に 足す）
// 昇格・降格の 数は サーバーが きめる（me.lg.un・dn、グループ表の 印）。me.lg.top: いちばん上の リーグか
const LGR = [{ k: 'bronze', name: 'ブロンズ', mark: '🥉' }, { k: 'silver', name: 'シルバー', mark: '🥈' }, { k: 'gold', name: 'ゴールド', mark: '🥇' }, { k: 'plat', name: 'プラチナ', mark: '🔷' }, { k: 'dia', name: 'ダイヤ', mark: '💎' },
  { k: 'master', name: 'マスター', mark: '👑' }, { k: 'gm', name: 'グランドマスター', mark: '🏆' }, { k: 'legend', name: 'レジェンド', mark: '🌟' }];
// リーグの みじかい 一言: 「🥇 ゴールド グループ 3・14 い」
const lgShort = L => LGR[L.L].mark + ' ' + LGR[L.L].name + (!L.top ? ' グループ ' + (L.g + 1) : '') + '・' + L.gp + ' い';
const lgZone = L => L.z === 'hold' ? 'けいさんちゅう' : L.z === 'up' ? '⬆ しょうかく ライン' : L.z === 'down' ? '⬇ こうかく ライン' : L.top && L.gp === 1 ? LGR[L.L].mark + ' 1 い' : '';
// 前と くらべて ほめる ことば（1 日 だけ 出す）。rank.prog = {id, L, g, gp, bestL, msg, at}
function rankProgress(me) {
  const lg = me && me.lg; if (!lg) return { msg: '', bestL: null };
  let p = {}; try { p = JSON.parse(lsGet('rank.prog') || '{}'); } catch (e) {}
  if (p.L == null && p.lg != null) p = {};   // 前の 版（わりあいの リーグ）の きろくは つかわない
  const msgs = [];
  if (p.L != null && lg.L > p.L) msgs.push(LGR[lg.L].mark + ' ' + LGR[lg.L].name + ' リーグに あがった！');
  else if (p.id && p.id !== me.id && p.L === lg.L && p.g === lg.g && lg.z !== 'hold' && p.gp && lg.gp < p.gp) msgs.push('まえの モンスターより ' + (p.gp - lg.gp) + ' い アップ！');
  if (p.bestL != null && lg.L > p.bestL) msgs.push('じこベスト こうしん！');
  if (msgs.length) { p.msg = msgs.join('　'); p.at = Date.now(); TR('rankup', { L: lg.L, gp: lg.gp }); }
  else if (p.at && Date.now() - p.at > 864e5) p.msg = '';
  if (lg.z !== 'hold') { p.id = me.id; p.L = lg.L; p.g = lg.g; p.gp = lg.gp; p.bestL = Math.max(p.bestL == null ? lg.L : p.bestL, lg.L); }
  lsSet('rank.prog', JSON.stringify(p));
  return { msg: p.msg || '', bestL: p.bestL == null ? lg.L : p.bestL };
}
// グループの 順位表（タップで れんしゅうじあい。絵は とらない ＝ 受付係への 通信を へらす。タップした ときだけ 形を もらう）
let lgAll = false;   // グループ表を ぜんぶ 見せるか（ふだんは 自分の まわり 7 行）
function renderLeagueGroup(box, me) {
  const rows = me.lgroup || [], lg = me.lg; if (!rows.length) return;
  const h = document.createElement('div'); h.className = 'rk-h'; h.textContent = 'グループの じゅんい（タップで れんしゅうじあい）'; box.append(h);
  const mi = Math.max(0, rows.findIndex(r => r[1] === me.id)), lo = lgAll ? 0 : Math.max(0, Math.min(mi - 3, rows.length - 7)), hi = lgAll ? rows.length : Math.min(rows.length, lo + 7);
  // 線と 色は サーバーの 印（z）で: 昇格の 線は さいごの up の 下、降格の 線は はじめの down の 上（CPU が まざって いても ずれない）
  let lastUp = -1, firstDn = -1; rows.forEach((r, k) => { if (r[4] === 'up') lastUp = k; if (r[4] === 'down' && firstDn < 0) firstDn = k; });
  const wrap = document.createElement('div'); wrap.className = 'lg-tab';
  rows.forEach(([gp, id, name, pct, z, code, kz], k) => {
    if (k < lo || k >= hi) return;
    if (k === firstDn && k > lo) { const ln = document.createElement('div'); ln.className = 'lg-line down'; ln.textContent = '⬇ ここから こうかく（0 じに ' + LGR[lg.L - 1].name + ' へ）'; wrap.append(ln); }
    const mine = id === me.id, row = document.createElement('button');
    row.className = 'lg-row' + (z === 'up' ? ' up' : '') + (z === 'down' ? ' down' : '') + (mine ? ' mine' : '') + (z === 'hold' ? ' hold' : '');
    row.innerHTML = '<span class="lg-p">' + gp + '</span><span class="lg-n"></span><span class="lg-w">' + (z === 'hold' ? 'けいさんちゅう' : pct + '%') + '</span>';
    if (code) { const pv = miniPreview(code, mine ? ME.color : RANK_COLOR, 88, kz); pv.className = 'lg-pic'; row.insertBefore(pv, row.children[1]); } else { const sp = document.createElement('span'); sp.className = 'lg-pic'; row.insertBefore(sp, row.children[1]); }
    row.querySelector('.lg-n').textContent = name + (mine ? '（あなた）' : '');
    if (!mine) row.addEventListener('click', () => code ? rankPractice({ code, name, kz }) : monGet(id).then(m => { if (m && m.code) rankPractice({ code: m.code, name, kz: m.kz }); }));
    wrap.append(row);
    if (k === lastUp && k < hi - 1) { const ln = document.createElement('div'); ln.className = 'lg-line up'; ln.textContent = '⬆ ここまで しょうかく（0 じに ' + LGR[lg.L + 1].name + ' へ）'; wrap.append(ln); }
  });
  box.append(wrap);
  if (rows.length > 7) { const b = document.createElement('button'); b.className = 'lg-more'; b.textContent = lgAll ? '▲ じぶんの まわりだけ' : '▼ ぜんぶ みる（' + rows.length + ' たい）'; b.addEventListener('click', () => { lgAll = !lgAll; renderRank(); }); box.append(b); }
}
// けいさんちゅう（とうろく した ばかり・リーグが まだ・はんぶん おわって いない）の 間は ランクせんを 開いて いる ときだけ 30 びょうごとに 読みなおす（1 回 開いて 20 回 まで）
let rankPollT = 0, rankPollN = 0;
function rankPollSet() {
  clearTimeout(rankPollT);
  const me = rankMe, wait = me && !me.hidden && (!me.pos || (LG_ON && (!me.lg || me.lg.z === 'hold')));
  if (!wait || mode !== 'rank' || rankPollN >= 20) return;
  rankPollT = setTimeout(() => { if (mode !== 'rank') return; rankPollN++; loadRank(true).then(() => { if (mode === 'rank') renderRank(); }); }, 30e3);
}
function renderRank() {
  if (TIDY) { rankPollSet(); for (const e of $('rankbtnrow').querySelectorAll('.rk-card')) e.remove(); }
  const t = rankTop, me = rankMe;
  $('ranksub').textContent = t ? t.count + ' たい さんか・2〜3 ぷんで こうしん' : rankDown ? 'いま ランクせんに つながらないよ。しばらく してから また きてね' : 'よみこみちゅう…';
  // 先週の チャンピオン
  const ch = t && t.champion, cb = $('rankchamp'); cb.hidden = !ch; cb.innerHTML = '';
  if (ch) { cb.append(miniPreview(ch.code, '#ffb300', 96)); const s = document.createElement('div'); s.innerHTML = '<b>👑 きのうの チャンピオン</b><br>'; s.append(document.createTextNode(ch.name + '（しょうりつ ' + ch.rating + '%）' + (ch.streak >= 2 ? '　' + ch.streak + ' にち れんぞく！' : ''))); cb.append(s); }
  // 自分の モンスター
  const box = $('rankme'); box.innerHTML = '';
  const more = $('rankmore'); more.innerHTML = '';   // 順位カード・グループ・リプレイ（登録・つくる の 下）
  if (me) {
    const head = document.createElement('div'); head.className = 'rk-mehead';
    { const md = RB.decodeDesign(me.code); if (md) { md.champ = champMap()[me.code] || 0; md.kz = kzParse(me.kz); const cv = document.createElement('canvas'); cv.width = cv.height = 120; drawPreview(cv, md, ME.color); head.append(cv); } }
    const info = document.createElement('div');
    const nm = document.createElement('div'); nm.className = 'rk-name'; nm.textContent = me.name;
    const st = document.createElement('div'); st.className = 'rk-stat';
    st.textContent = me.pos ? me.pos + ' い / ' + me.count + ' たい　しょうりつ ' + me.pct + '%（' + me.w + 'しょう ' + me.l + 'はい' + (me.d ? ' ' + me.d + 'わけ' : '') + '）' + (me.pl < me.total ? '　けいさんちゅう ' + me.pl + '/' + me.total : '') : 'けいさんちゅう（2〜3 ぷんくらい）';
    info.append(nm, st);
    if (LG_ON && !me.hidden) {
      const lgb = document.createElement('div'), sub = document.createElement('div'); sub.className = 'rk-lgsub';
      if (me.lg) {
        const L = me.lg, lg = LGR[L.L], pr = rankProgress(me), upN = L.un || 0, safe = L.gn - (L.dn || 0);
        lgb.className = 'rk-league lg-' + lg.k; lgb.innerHTML = '<b>' + lg.mark + ' ' + lg.name + ' リーグ</b> <span>' + (!L.top ? 'グループ ' + (L.g + 1) + '・' : '') + L.gp + ' い / ' + L.gn + ' たい</span>'; st.hidden = true;   // 全体の 順位は リーグでは 見せない
        sub.textContent = L.z === 'hold' ? 'けいさんちゅう（' + L.pl + ' / ' + L.tot + ' せん）。はんぶん おわるまで しょうかく・こうかく しないよ'
          : L.z === 'up' ? '⬆ このままなら こんやの 0 じに ' + LGR[L.L + 1].mark + ' ' + LGR[L.L + 1].name + ' へ！（しょうりつ ' + L.pct + '%）'
          : L.z === 'down' ? '⬇ このままだと 0 じに ' + LGR[L.L - 1].name + ' へ… あと ' + (L.gp - safe) + ' い あがれば セーフ'
          : !L.top ? 'あと ' + (L.gp - upN) + ' い で しょうかく（' + upN + ' い まで）。しょうりつ ' + L.pct + '%' : (L.gp === 1 ? lg.mark + ' ' + lg.name + ' 1 い！ こんやの 0 じに チャンピオン' : lg.name + 'の ' + L.gp + ' い。1 い を めざそう（しょうりつ ' + L.pct + '%）');
        info.append(lgb, sub);
        if (pr.msg) { const up = document.createElement('div'); up.className = 'rk-up'; up.textContent = '🎉 ' + pr.msg; info.append(up); }
      } else { lgb.className = 'rk-league'; lgb.textContent = 'リーグ けいさんちゅう'; sub.textContent = 'さいしょの けいさんを まって いるよ（2〜3 ぷんくらい）'; info.append(lgb, sub); }
    }
    if (me.champ) { const c = document.createElement('div'); c.className = 'rk-champbadge'; c.textContent = '👑 きのうの チャンピオン' + (me.champ >= 2 ? '（' + me.champ + ' にち れんぞく！）' : '！'); info.append(c); }
    head.append(info); box.append(head);
    if (LG_ON && me.lg && !me.hidden) renderLeagueGroup(more, me);
    if (CARD_ON && (LG_ON ? me.lg && me.lg.z !== 'hold' : me.pos) && !me.hidden) { const cb = document.createElement('button'); cb.className = 'main rk-card'; cb.textContent = '📸 じゅんい カードを つくる'; cb.addEventListener('click', () => showRankCard(me)); (TIDY ? $('rankbtnrow') : more).prepend(cb); }
    if (me.back) { const b = document.createElement('div'); b.className = 'rk-note'; b.textContent = 'ひさしぶり！ おやすみ から ふっかつ。だいたい 2〜3 ぷんで ランキングに もどるよ'; box.append(b); }
    if (me.hidden) { const h = document.createElement('div'); h.className = 'rk-note'; h.textContent = 'なまえが みんなに みせるのに ふさわしくないので、ランキングに だして いないよ。なまえを かえて とうろくしなおしてね'; box.append(h); }
    const rec = me.recent || [];
    if (rec.length && !BOXT) {   // ?boxtest: つよい あいてとの たいせん は 出さない（オーナー「いらない」）
      const lt = document.createElement('div'); lt.className = 'rk-h'; lt.textContent = 'つよい あいてとの たいせん（タップで リプレイ）'; more.append(lt);
      for (const r of rec) {
        const row = document.createElement('button'); row.className = 'rk-row';
        const chip = document.createElement('span'); chip.className = 'rk-chip ' + r.r; chip.textContent = r.r === 'W' ? 'かち' : r.r === 'L' ? 'まけ' : 'わけ';
        const nmm = document.createElement('span'); nmm.className = 'rk-opp'; nmm.textContent = 'vs ' + r.n;
        const dd = document.createElement('span'); dd.className = 'rk-d'; dd.textContent = r.s === 'A' ? 'ひだり' : 'みぎ';
        row.append(chip, nmm, dd); row.addEventListener('click', () => rankReplay(me, r)); more.append(row);
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
  $('rankreghint').textContent = me && me.hidden ? 'あたらしい なまえで とうろくしなおしてね' : me ? (LG_ON && me.lg ? 'とうろくしなおしても リーグは そのまま（' + LGR[me.lg.L].mark + ' ' + LGR[me.lg.L].name + '）。グループの みんなと たたかいなおすよ' : 'とうろくしなおすと みんなと たたかい なおして じゅんいが きまるよ') : '';
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
  // 30 位より 下の ときは「⋮」の 下に 自分と 前後 2 体（タップで れんしゅうじあい）。リーグ制では 出さない（自分の グループ表が ある）
  const shown = (t && t.top || []).length;
  { const dia = $('rankdia'), tl = LGR[(t && t.top && t.top[0] && t.top[0].L) || 4] || LGR[4]; dia.hidden = !!(LG_ON && me && me.lg && me.lg.top); dia.querySelector('summary').textContent = LG_ON ? tl.mark + ' ' + tl.name + ' リーグを みる（いちばん うえ・タップで れんしゅうじあい）' : 'ランキング（タップで れんしゅうじあい）'; if (!LG_ON) dia.open = true; }
  if (!LG_ON && me && me.pos && me.pos > shown && me.nb && me.nb.length) {
    const gap = document.createElement('div'); gap.className = 'rk-gap'; gap.textContent = '⋮'; list.append(gap);
    for (const x of me.nb) {
      const row = document.createElement('button'); row.className = 'rk-row rk-top' + (x.id === me.id ? ' mine' : '');
      const p = document.createElement('span'); p.className = 'rk-pos'; p.textContent = x.pos;
      const nm = document.createElement('span'); nm.className = 'rk-opp'; nm.textContent = x.name + (x.id === me.id ? '（あなた）' : '');
      const sc = document.createElement('span'); sc.className = 'rk-d'; sc.textContent = x.pct + '%';
      const cv = document.createElement('canvas'); cv.width = cv.height = 64;
      row.append(p, cv, nm, sc); list.append(row);
      // 絵は 形を もらって から
      (x.code ? Promise.resolve(x) : monGet(x.id)).then(m => { const d = m.code && RB.decodeDesign(m.code); if (d) { d.kz = kzParse(m.kz); drawPreview(cv, d, x.id === me.id ? ME.color : RANK_COLOR); } if (x.id !== me.id && m.code) row.addEventListener('click', () => rankPractice({ name: x.name, code: m.code, kz: m.kz })); }).catch(() => {});
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
    else { TR('rankreg', { me: plainCode(myRobot) }); lsSet('rank.reg', '1'); await loadRank(true); $('rankmsg').textContent = 'とうろく できたよ！'; }
  } catch (e) { $('rankmsg').textContent = 'つながらなかった…もういちど ためしてね'; }
  rankBusy = false; if (mode === 'rank') renderRank();
}
// 対戦を 見る: side は 自分が 左（A）か 右（B）か。同じ 左右で 計算するので サーバーと 同じ 試合に なる
function rankBattle(leftCode, rightCode, leftName, rightName, leftColor, rightColor, meSide, kind, kzL, kzR) {
  const L = RB.decodeDesign(leftCode), R = RB.decodeDesign(rightCode); if (!L || !R) return;
  isFriend = true;
  opp = { name: rightName, color: rightColor, d: R };
  S = RB.create(L, R); S.stage = 0; S.side = 'rank'; S.leftName = leftName; S.leftColor = leftColor; S.meSide = meSide; S.rankKind = kind; S.evBattle = rankEvMode; S.nkBattle = rankNkMode;
  S.crownA = false; S.crownB = false; S.kzA = kzParse(kzL); S.kzB = kzParse(kzR);
  rankLast = [leftCode, rightCode, leftName, rightName, leftColor, rightColor, meSide, kind, kzL, kzR];
  acc = 0; last = performance.now(); stop = 0; shake = 0; parts = []; pops = []; hurt = { A: 0, B: 0 }; endAt = 0; cam = null;
  mode = 'battle'; show('none');
}
let rankLast = null, rankEvMode = false, rankNkMode = false;
async function rankReplay(me, r) {
  TR('rankreplay', null); rankEvMode = false; rankNkMode = false;
  let c = r.c, okz = null;
  try { const m = await (await fetch(RANK_API + '/mon?id=' + encodeURIComponent(r.o))).json(); c = c || m.code; okz = m.kz; } catch (e) {}   // かざりも（1 時間 おぼえて いる）
  if (!c) { $('rankmsg').textContent = 'あいてが みつからなかった'; return; }
  if (r.s === 'A') rankBattle(me.code, c, me.name, r.n, ME.color, RANK_COLOR, 'A', 'replay', me.kz, okz);
  else rankBattle(c, me.code, r.n, me.name, RANK_COLOR, ME.color, 'B', 'replay', okz, me.kz);
}
function rankPractice(m) {
  if (!myRobot) { $('rankmsg').textContent = 'れんしゅうじあいは モンスターを つくってから'; return; }
  TR('rankpractice', null); rankEvMode = false; rankNkMode = false;
  rankBattle(plainCode(myRobot), m.code, ME.name, m.name, ME.color, RANK_COLOR, 'A', 'practice', KZ_ON ? kzStr(kzs.eq()) : '', m.kz);
}
onTap($('rankbtn'), () => showRank());
// タイトルの ランクせん の 一言（とうろく して いれば 順位、あがったら おしらせ）
async function titleRank() {
  const cap = $('rankcap'), tr = $('trank');
  // 登録した ことが ない 端末は 通信しない（受け付け回数の 節約）。登録した 端末は 自分の ぶん（/me）だけ
  if (lsGet('rank.reg') !== '1') { cap.textContent = 'とうろくして みんなと じどうで たいせん！'; $('rankbtn').classList.add('new'); tr.hidden = true; return; }
  if (!rankMe || Date.now() - rankMeAt > 10 * 60e3) { const c = meCache('rank.mec'); if (c) { rankMe = c.me; rankMeAt = c.t; } else { try { rankMe = meCache('rank.mec', (await (await fetch(RANK_API + '/rank?dev=' + rankDev() + '&notop=1')).json()).me.me); rankMeAt = Date.now(); } catch (e) {} } }   // 10 分 おぼえる（すぎたら 聞きなおす）
  const me = rankMe, cur = myRobot && plainCode(myRobot);
  if (LG_ON && me && me.lg) {
    const L = me.lg, pr = rankProgress(me), z = lgZone(L);
    cap.textContent = (me.champ ? '👑 チャンピオン' + (me.champ >= 2 ? me.champ + ' にち れんぞく・' : '・') : '') + lgShort(L) + (z ? '（' + z + '）' : '') + (pr.msg ? '　🎉' : '');
  } else if (me && me.pos && !LG_ON) {
    const prev = +(lsGet('rank.lastpos') || 0);
    cap.textContent = (me.champ ? '👑 チャンピオン' + (me.champ >= 2 ? me.champ + ' にち れんぞく・' : '・') : '') + 'いま ' + me.pos + ' い（' + me.count + ' たい）しょうりつ ' + me.pct + '%' + (prev && me.pos < prev ? '　↑ あがった！' : '');
    lsSet('rank.lastpos', String(me.pos));
  } else cap.textContent = me ? 'とうろく ずみ・けいさんちゅう' : 'とうろくして みんなと じどうで たいせん！';
  $('rankbtn').classList.toggle('new', !me);
  $('tmchint').hidden = !!me;
  tr.hidden = !me; tr.textContent = me ? 'ランクせん ' + (LG_ON ? (me.lg ? lgShort(me.lg) : 'けいさんちゅう') : me.pos ? me.pos + ' い・しょうりつ ' + me.pct + '%' : 'けいさんちゅう') + (cur && cur !== me.code ? '（べつの モンスターで とうろくちゅう）' : '') : '';
  setTimeout(fitTmon, 0);   // 一言の 行数で 絵の 大きさが かわる
}
onTap($('torank'), () => { TR('torank', null); showRank('いまの モンスターで とうろく できるよ'); });
onTap($('rankregbtn'), rankRegister);
onTap($('rankdraw'), showDraw);
onTap($('rankback'), showTitle);
onTap($('ranktop'), showTitle);
// ---------- きょうの イベント（1 日で 完結する ランクせん。お題の パーツは きまった 形）----------
// 2026-09-30 全員に 公開（前は ?eventtest の 端末だけ）。お題は event.js（60 日で 一周）、受付は ランクせんと おなじ 受付係（/ev/*）、計算は tools/ev_batch.js
// イベントの モンスターは ふだんの モンスターと べつに 端末へ（ev.robot・その 日だけ）。お題の パーツは 描く 画面で さわれない（サーバーでも 上書き）
if (OWNER && /[?&]eventtest(=|&|$)/.test(location.search)) lsSet('eventtest', '1');
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
let evAt = 0;
var evChWaitT = 0;   // var: 読みこみ中に renderEv が 先に 呼ばれても こまらない
async function loadEv(force) {
  if (!force && evTop && Date.now() - evAt < 60e3) return;
  try {
    const file = await boardFile('evtop.json', j => j.day === jstDay());
    const r = await fetch(RANK_API + '/ev?dev=' + rankDev() + (file ? '&notop=1' : '')).then(r => r.json()), t = file || r.top, m = r.me;
    evTop = t; evMe = m.me; evInfo = m; evDown = false; evAt = Date.now();
    if (m.ribbons > evRibbons()) lsSet('ev.ribbons', String(m.ribbons));
    if (m.won && lsGet('ev.wonseen') !== m.won.day) { evGot = m.won; lsSet('ev.wonseen', m.won.day); TR('evribbon', { n: m.ribbons }); }
  } catch (e) { evTop = null; evDown = true; }
}
let evAll = false;   // イベントの ランキングを ぜんぶ 見せるか（整理: ふだんは 10 い まで）
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
  const ch = top && top.champion, cb = $('evchamp'); cb.innerHTML = '';
  // 0 時すぎ（しめの 計算が おわる まで 10 分 ほど）は きのうの 1 位が まだ ない → 計算中と 出して 1 分ごとに 読みなおす
  const chWait = !ch && top && evDayNow() > EVENT_START && new Date(Date.now() + 9 * 3600e3).getUTCHours() === 0;
  cb.hidden = !ch && !chWait;
  if (chWait) { const d = document.createElement('div'); d.innerHTML = '<b>🎀 きのうの けっかを けいさん ちゅう…</b><br>0 じ 10 ぷん ごろ に でるよ'; cb.append(d); clearTimeout(evChWaitT); evChWaitT = setTimeout(() => { if (mode === 'ev') loadEv(true).then(() => { if (mode === 'ev') renderEv(); }); }, 60e3); }
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
    st.textContent = me.pos ? me.pos + ' い / ' + me.count + ' たい　しょうりつ ' + me.pct + '%（' + me.w + 'しょう ' + me.l + 'はい' + (me.d ? ' ' + me.d + 'わけ' : '') + '）' + (me.pl < me.total ? '　けいさんちゅう ' + me.pl + '/' + me.total : '') : 'けいさんちゅう（2〜3 ぷんくらい）';
    inf.append(nm, st); head.append(inf); box.append(head);
    if (me.hidden) { const h = document.createElement('div'); h.className = 'rk-note'; h.textContent = 'なまえが みんなに みせるのに ふさわしくないので、ランキングに だして いないよ'; box.append(h); }
    for (const r of (BOXT ? [] : me.recent || [])) {   // 2026-10-03 オーナー: イベントも つよい あいてとの かちまけは いらない
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
  const tl = (top && top.top) || [], evLim = TIDY && !evAll ? 10 : tl.length;
  for (const [i, m] of tl.entries()) {
    if (i >= evLim) { if (!(me && m.id === me.id)) continue; const gp = document.createElement('div'); gp.className = 'rk-gap'; gp.textContent = '⋮'; list.append(gp); }
    const row = document.createElement('button'); row.className = 'rk-row rk-top' + (me && m.id === me.id ? ' mine' : '');
    const p = document.createElement('span'); p.className = 'rk-pos'; p.textContent = i + 1;
    const nm = document.createElement('span'); nm.className = 'rk-opp'; nm.textContent = m.name;
    const sc = document.createElement('span'); sc.className = 'rk-d'; sc.textContent = m.pct + '%';
    row.append(p, miniPreview(m.code, EV_COLOR, 64, m.kz), nm, sc);
    row.addEventListener('click', () => evPractice(m)); list.append(row);
  }
  if (TIDY && tl.length > 10) { const b = document.createElement('button'); b.className = 'lg-more'; b.textContent = evAll ? '▲ 10 い まで' : '▼ ぜんぶ みる（' + tl.length + ' い まで）'; b.addEventListener('click', () => { evAll = !evAll; renderEv(); }); list.append(b); }
  if (top && !(top.top || []).length) list.textContent = top.count ? 'まだ たたかう あいてが いないよ（2 たい から じゅんいが でるよ）' : 'まだ だれも だして いないよ。いちばん のりで だそう！';
  if (me && me.pos && me.pos > ((top && top.top) || []).length && me.nb && me.nb.length) {
    const gap = document.createElement('div'); gap.className = 'rk-gap'; gap.textContent = '⋮'; list.append(gap);
    for (const x of me.nb) {   // ふつうの ランクせんと 同じ 作り（絵・タップで れんしゅうじあい）
      const row = document.createElement('button'); row.className = 'rk-row rk-top' + (x.id === me.id ? ' mine' : '');
      const p = document.createElement('span'); p.className = 'rk-pos'; p.textContent = x.pos;
      const nm = document.createElement('span'); nm.className = 'rk-opp'; nm.textContent = x.name + (x.id === me.id ? '（あなた）' : '');
      const sc = document.createElement('span'); sc.className = 'rk-d'; sc.textContent = x.pct + '%';
      const cv = document.createElement('canvas'); cv.width = cv.height = 64;
      row.append(p, cv, nm, sc); list.append(row);
      (x.code ? Promise.resolve(x) : monGet(x.id)).then(m => { const d = m.code && RB.decodeDesign(m.code); if (d) { d.kz = kzParse(m.kz); drawPreview(cv, d, x.id === me.id ? ME.color : EV_COLOR); } if (x.id !== me.id && m.code) row.addEventListener('click', () => evPractice({ name: x.name, code: m.code, kz: m.kz })); }).catch(() => {});
    }
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
    else { TR('evreg', { n: evTheme().n }); await loadEv(true); $('evmsg').textContent = 'だしたよ！ 2〜3 ぷん くらいで じゅんいが でるよ'; }
  } catch (e) { $('evmsg').textContent = 'つながらなかった…もういちど ためしてね'; }
  evBusy = false; if (mode === 'ev') renderEv();
}
function evPractice(m) {
  const d = evRobot();
  if (!d) { $('evmsg').textContent = 'れんしゅうじあいは イベントの モンスターを かいてから'; return; }
  TR('evpractice', null); rankEvMode = true; rankNkMode = false;
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
// れきだいの 1 位（ランクせん・イベント。新しい 順。受付係が 10 分 おぼえて いる）
const HIST = {
  rank: { api: '/champs', box: 'rankhist', btn: 'rankhistbtn', label: '👑 れきだいの チャンピオン', color: '#ffb300', day: c => c.season, sub: c => (c.streak >= 2 ? c.streak + ' にち れんぞく' : ''), pct: c => c.rating },
  ev: { api: '/ev/champs', box: 'evhist', btn: 'evhistbtn', label: '🎀 れきだいの いちばん', color: EV_COLOR, day: c => c.day, sub: c => PART_DAY[c.part] + evq(themeName(c.part, c.no)) + '・' + c.n + ' たい', pct: c => c.pct },
};
const histMem = {};
async function showHist(k) {
  const H = HIST[k], box = $(H.box); box.hidden = false; $(H.btn).textContent = H.label + '（とじる）';
  let m = histMem[k];
  if (!m || Date.now() - m.at > 600e3) { box.textContent = 'よみこみちゅう…'; try { m = histMem[k] = { at: Date.now(), list: (await (await fetch(RANK_API + H.api)).json()).list || [] }; } catch (e) { box.textContent = 'つながらなかった…'; return; } }
  box.innerHTML = '';
  if (!m.list.length) { box.textContent = 'まだ いないよ'; return; }
  for (const c of m.list) {
    const row = document.createElement('div'); row.className = 'rk-row rk-top';
    const p = document.createElement('span'); p.className = 'rk-pos'; const d = H.day(c); p.textContent = +d.slice(5, 7) + '/' + +d.slice(8);
    const nb = document.createElement('span'); nb.className = 'nk-nm';
    const n = document.createElement('span'); n.className = 'rk-opp'; n.textContent = c.name; nb.append(n);
    const st = H.sub(c); if (st) { const sub = document.createElement('small'); sub.textContent = st; nb.append(sub); }
    const sc = document.createElement('span'); sc.className = 'rk-d'; sc.textContent = H.pct(c) + '%';
    row.append(p, miniPreview(c.code, H.color, 64, c.kz), nb, sc); box.append(row);
  }
  TR(k + 'hist', { n: m.list.length });
}
for (const k of Object.keys(HIST)) onTap($(HIST[k].btn), () => { if ($(HIST[k].box).hidden) showHist(k); else { $(HIST[k].box).hidden = true; $(HIST[k].btn).textContent = HIST[k].label; } });
// ---------- なかまランキング（?nakamatest の 端末だけ、2026-09-30〜）----------
// なかまコード（6 文字）で あつまった 人の 中だけの 順位。順位は ランクせんの 勝率を ならべる だけ（受付係の /g*）。企画メモ secretary/notes/draw-robot-nakama.md
// さそう URL（?g=コード）を 開いた 端末は テスト中でも なかまが 出る（オーナーが さそった 人だけ）
const gParam = (/[?&]g=([A-Za-z0-9]{6})(&|$)/.exec(location.search) || [])[1];
if ((OWNER && /[?&]nakamatest(=|&|$)/.test(location.search)) || gParam) lsSet('nakamatest', '1');
const NK_ON = true;   // 2026-09-30 全員に 公開（前は ?nakamatest の 端末だけ）
const NK_EN = window.LANG === 'en';
// なかまの 名前は 英語の 置きかえに かけない（nk-raw、i18n.js）。名前が 入る 文は ここで 英語も 作る
function nkRaw(el, ja, en) { el.classList.add('nk-raw'); el.textContent = NK_EN ? en : ja; }
let nkMine = null, nkBoard = null, nkSel = lsGet('nk.sel') || '', nkForm = null, nkPreview = gParam ? gParam.toUpperCase() : null, nkBusy = false, nkLeaveAsk = false;
for (const el of document.querySelectorAll('.nk-seg')) el.hidden = !NK_ON;
for (const b of document.querySelectorAll('.nk-seg button[data-go]')) onTap(b, () => { if (b.dataset.go === 'nakama') showNakama(); else showRank(); });
const nkApi = (p, body) => fetch(RANK_API + p, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ dev: rankDev() }, body)) } : undefined).then(r => r.json());
let nkAt = 0;
async function loadNakama(force) {
  if (!force && nkMine && nkBoard !== null && Date.now() - nkAt < 30e3 && !nkPreview) return;
  try {
    const all = await nkApi('/g/all?dev=' + rankDev() + (nkSel ? '&code=' + nkSel : '')); nkAt = Date.now();   // なかまの 一覧と えらんで いる なかまの 表を 1 回で
    nkMine = (all.mine && all.mine.list) || [];
    if (typeof nkPreview === 'string') {   // さそう URL: もう はいって いれば その なかまを 出す。まだ なら「はいる？」
      if (nkMine.some(g => g.code === nkPreview)) { nkSel = nkPreview; nkPreview = null; }
      else { const p = await nkApi('/g?code=' + nkPreview); nkPreview = p && !p.error ? p : null; if (!nkPreview) $('nkmsg').textContent = 'その なかまは みつからないよ'; }
    }
    const sel0 = nkSel;
    if (!nkMine.some(g => g.code === nkSel)) nkSel = nkMine.length ? nkMine[0].code : '';
    nkBoard = !nkSel ? null : nkSel === sel0 && all.board && !all.board.error ? all.board : await nkApi('/g?code=' + nkSel + '&dev=' + rankDev());
  } catch (e) { $('nkmsg').textContent = 'つながらなかった…しばらく してから また きてね'; }
}
function showNakama(msg) {
  mode = 'nakama'; show('nakama'); nkLeaveAsk = false;
  if (msg != null) $('nkmsg').textContent = msg;
  renderNakama();
  loadNakama().then(() => { if (mode === 'nakama') renderNakama(); });
}
function renderNakama() {
  // さそわれた とき:「○○に はいる？」
  const pv = $('nkpreview'); pv.hidden = !(nkPreview && typeof nkPreview === 'object'); pv.innerHTML = '';
  if (!pv.hidden) {
    const t = document.createElement('div'); t.className = 'nk-head'; const b = document.createElement('b'); nkRaw(b, '「' + nkPreview.name + '」（' + nkPreview.count + ' にん）に はいる？', 'Join "' + nkPreview.name + '" (' + nkPreview.count + ')?'); t.append(b); pv.append(t);
    const row = document.createElement('div'); row.className = 'rbtns';
    const yes = document.createElement('button'); yes.className = 'main'; yes.textContent = 'はいる'; yes.addEventListener('click', () => nkJoin(nkPreview.code));
    const no = document.createElement('button'); no.className = 'sub'; no.textContent = 'やめる'; no.addEventListener('click', () => { nkPreview = null; renderNakama(); });
    row.append(yes, no); pv.append(row);
  }
  // 自分の なかま（えらぶ）＋ つくる・コードで はいる
  const gs = $('nkgroups'); gs.innerHTML = '';
  for (const g of nkMine || []) { const b = document.createElement('button'); b.className = g.code === nkSel ? 'on' : ''; nkRaw(b, g.name, g.name); b.addEventListener('click', () => { nkSel = g.code; lsSet('nk.sel', g.code); nkBoard = null; nkAt = 0; showNakama(''); }); gs.append(b); }
  if (nkMine && nkMine.length < 3) for (const [k, label] of [['create', '＋ なかまを つくる'], ['join', '🔑 コードで はいる']]) { const b = document.createElement('button'); b.className = 'add'; b.textContent = label; b.addEventListener('click', () => { nkForm = nkForm === k ? null : k; renderNakama(); }); gs.append(b); }
  $('nkform').hidden = !nkForm;
  if (nkForm) { $('nklabel').textContent = nkForm === 'create' ? 'なかまの なまえ（10 もじまで）' : 'なかまコード（6 もじ）'; $('nkin').placeholder = TRL(nkForm === 'create' ? 'れい: 3くみ' : 'れい: K7M2QX'); $('nkgo').textContent = nkForm === 'create' ? 'つくる' : 'はいる'; }
  // 順位表
  const bd = $('nkboard'); bd.innerHTML = '';
  if (nkMine && !nkMine.length && !nkPreview) { const n = document.createElement('div'); n.className = 'rk-note'; n.textContent = 'なかまを つくって、ともだちに コードを おくろう。なかまの 中で だれが いちばん つよいか くらべられるよ'; bd.append(n); return; }
  const g = nkBoard; if (!g || g.error) return;
  const head = document.createElement('div'); head.className = 'nk-head';
  const nm = document.createElement('b'); nkRaw(nm, g.name + '（' + g.count + ' にん）', g.name + ' (' + g.count + ')');
  const inv = document.createElement('button'); inv.className = 'main'; inv.textContent = '📨 さそう'; inv.addEventListener('click', () => nkInvite(g));
  head.append(nm, inv); bd.append(head);
  const code = document.createElement('div'); code.className = 'nk-code'; code.textContent = 'なかまコード: ' + g.code; bd.append(code);
  const lg = document.createElement('div'); lg.id = 'nklg'; bd.append(lg);
  nkLeague(g);
  if (g.unreg) { const u = document.createElement('div'); u.className = 'rk-note'; u.textContent = 'まだ ランクせんに とうろく してない なかま ' + g.unreg + ' にん'; bd.append(u); }
  if (!(g.top || []).some(m => m.me)) { const u = document.createElement('div'); u.className = 'rk-note'; u.textContent = 'あなたも ランクせんに とうろくすると ここに でるよ'; bd.append(u); }
  const lv = document.createElement('button'); lv.className = 'sub nk-leave'; lv.textContent = nkLeaveAsk ? 'ほんとうに ぬける？（もういちど おす）' : 'この なかまを ぬける'; lv.addEventListener('click', nkLeave); bd.append(lv);
}
async function nkSubmit() {
  if (nkBusy) return; const v = $('nkin').value.trim(); if (!v) { $('nkmsg').textContent = nkForm === 'create' ? 'なまえを いれてね' : 'コードを いれてね'; return; }
  if (nkForm === 'join') return nkJoin(v);
  nkBusy = true; $('nkmsg').textContent = 'つくってるよ…';
  try { const r = await nkApi('/g/create', { name: v }); if (r.error) $('nkmsg').textContent = r.error; else { TR('nkcreate', null); nkSel = r.code; lsSet('nk.sel', r.code); nkForm = null; $('nkin').value = ''; nkRaw($('nkmsg'), '「' + r.name + '」が できたよ！ 📨 さそう で ともだちに おくろう', '"' + r.name + '" is ready! Send it to friends with 📨 Invite'); setTimeout(() => $('nkmsg').classList.remove('nk-raw'), 0); await loadNakama(true); } }
  catch (e) { $('nkmsg').textContent = 'つながらなかった…もういちど ためしてね'; }
  nkBusy = false; if (mode === 'nakama') renderNakama();
}
async function nkJoin(code) {
  if (nkBusy) return; nkBusy = true; $('nkmsg').textContent = 'はいってるよ…';
  try { const r = await nkApi('/g/join', { code }); if (r.error) $('nkmsg').textContent = r.error; else { TR('nkjoin', { via: nkPreview ? 'url' : 'code' }); nkSel = r.code; lsSet('nk.sel', r.code); nkForm = null; nkPreview = null; $('nkin').value = ''; nkRaw($('nkmsg'), '「' + r.name + '」に はいったよ！', 'You joined "' + r.name + '"!'); setTimeout(() => $('nkmsg').classList.remove('nk-raw'), 0); await loadNakama(true); } }
  catch (e) { $('nkmsg').textContent = 'つながらなかった…もういちど ためしてね'; }
  nkBusy = false; if (mode === 'nakama') renderNakama();
}
async function nkLeave() {
  if (!nkLeaveAsk) { nkLeaveAsk = true; renderNakama(); return; }
  if (nkBusy || !nkSel) return; nkBusy = true;
  try { await nkApi('/g/leave', { code: nkSel }); TR('nkleave', null); $('nkmsg').textContent = 'ぬけたよ'; nkSel = ''; nkLeaveAsk = false; await loadNakama(true); } catch (e) { $('nkmsg').textContent = 'つながらなかった…もういちど ためしてね'; }
  nkBusy = false; if (mode === 'nakama') renderNakama();
}
function nkInvite(g) {
  const url = SITE_URL + '?g=' + g.code, text = NK_EN ? 'Join my group in Draw! Monster Battle and battle with our monsters!' : 'かいて！モンスターバトルの なかま「' + g.name + '」に はいって、モンスターで しょうぶ！';
  TR('nkinvite', null);
  if (navigator.share) navigator.share({ text, url }).catch(() => {}); else showShareBox(text + ' ' + url);
}
// なかまリーグ: なかまの モンスターで 総当たり（左右 入れかえて 2 戦）を この 端末で 計算。結果は 形の 組み合わせごとに おぼえる（同じ 2 体・同じ 左右は いつも 同じ）
// スマホの 複数の コアで 同時に（Web Worker、最大 4 つ）。自分の 試合を 先に。画面を はなれたら 止める。Worker が 使えない ときは 30ms ずつ この 画面で
var nkLg = null, nkLgTimer = 0, nkPool = [];   // var: show() が 先に 見ても エラーに ならない ように
const NK_RES_MAX = 6000;
function nkRes() { try { return JSON.parse(lsGet('nk.res') || '{}'); } catch (e) { return {}; } }
function nkResSave(r) { let ks = Object.keys(r); if (ks.length > NK_RES_MAX) { const o = {}; for (const k of ks.slice(-NK_RES_MAX / 2)) o[k] = r[k]; r = o; } lsSet('nk.res', JSON.stringify(r)); }
function nkStop() { clearTimeout(nkLgTimer); for (const w of nkPool) w.terminate(); nkPool = []; if (nkLg) nkResSave(nkLg.res); }
function nkWorkers() {
  if (nkPool.length) return nkPool;
  try {
    const src = 'importScripts(' + JSON.stringify(new URL('sim.js?v=' + VERSION, location.href).href) + ');onmessage=function(e){var d=e.data;postMessage([d[0],RB.fight(RB.decodeDesign(d[1]),RB.decodeDesign(d[2])).winner||"D"]);};';
    const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
    const n = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1));
    for (let i = 0; i < n; i++) nkPool.push(new Worker(url));
  } catch (e) { nkPool = []; }
  return nkPool;
}
function nkLeague(g) {
  nkStop();
  const mons = (g.top || []).filter(m => m.code && RB.decodeDesign(m.code)).map(m => Object.assign({ tag: codeTag(m.code) }, m));
  const res = nkRes(), pairs = [];
  for (const a of mons) for (const b of mons) if (a !== b) pairs.push([a, b, a.tag + '>' + b.tag]);
  const todo = pairs.filter(p => !res[p[2]]).sort((x, y) => (y[0].me || y[1].me ? 1 : 0) - (x[0].me || x[1].me ? 1 : 0));   // 自分の 試合を 先に
  const lg = nkLg = { code: g.code, mons, pairs, res, todo, n: 0, busy: 0, t0: performance.now() };
  let drawAt = 0;
  const redraw = force => { const t = performance.now(); if (force || t - drawAt > 250) { drawAt = t; renderLeague(); } };
  const finish = () => { if (lg.todo.length || lg.busy) return; nkResSave(lg.res); renderLeague(); for (const w of nkPool) w.terminate(); nkPool = []; TR('nkleague', { n: mons.length, f: lg.n, ms: Math.round(performance.now() - lg.t0), w: lg.workers || 0 }); };
  const ok = (k, w) => { lg.res[k] = w; lg.n++; if (lg.n % 40 === 0) nkResSave(lg.res); redraw(false); };
  // Worker が 使えない とき: この 画面で 30ms ずつ
  const step = () => {
    if (nkLg !== lg || mode !== 'nakama') { nkResSave(lg.res); return; }
    const t0 = performance.now();
    while (lg.todo.length && performance.now() - t0 < 30) { const [a, b, k] = lg.todo.shift(); ok(k, RB.fight(RB.decodeDesign(a.code), RB.decodeDesign(b.code)).winner || 'D'); }
    if (lg.todo.length) nkLgTimer = setTimeout(step, 16); else finish();
  };
  const pool = lg.todo.length ? nkWorkers() : [];
  lg.workers = pool.length;
  if (pool.length) {
    const feed = w => {
      if (nkLg !== lg || mode !== 'nakama') { nkStop(); return; }
      const p = lg.todo.shift(); if (!p) { finish(); return; }
      lg.busy++;
      w.onmessage = e => { lg.busy--; ok(e.data[0], e.data[1]); feed(w); };
      w.onerror = () => { lg.busy--; lg.todo.unshift(p); for (const x of nkPool) x.terminate(); nkPool = []; lg.busy = 0; nkLgTimer = setTimeout(step, 16); };   // Worker が だめなら この 画面で
      w.postMessage([p[2], p[0].code, p[1].code]);
    };
    for (const w of pool) feed(w);
  } else if (lg.todo.length) nkLgTimer = setTimeout(step, 50);
  renderLeague();
}
function renderLeague() {
  const box = $('nklg'); if (!box || !nkLg) return;
  const st = new Map(nkLg.mons.map(m => [m, { w: 0, l: 0, d: 0 }]));
  for (const [a, b, k] of nkLg.pairs) { const r = nkLg.res[k]; if (!r) continue; const A = st.get(a), B = st.get(b); if (r === 'A') { A.w++; B.l++; } else if (r === 'B') { B.w++; A.l++; } else { A.d++; B.d++; } }
  const pts = m => { const s = st.get(m); return s.w + s.d / 2; };
  const order = nkLg.mons.slice().sort((x, y) => pts(y) - pts(x) || (y.pct || 0) - (x.pct || 0));
  box.innerHTML = '';
  const left = nkLg.todo.length;
  const busy = left + (nkLg.busy || 0) > 0 && nkLg.pairs.length;   // 計算中（のこり ＋ いま 計算して いる ぶん）
  if (nkLg.mons.length >= 2) {
    const h = document.createElement('div'); h.className = 'rk-h'; h.textContent = busy ? 'なかまリーグ' : 'なかまリーグ（そうあたり ' + nkLg.pairs.length + ' せん おわり！）'; box.append(h);
    if (busy) {
      const done = Object.keys(nkLg.res).length ? nkLg.pairs.filter(p => nkLg.res[p[2]]).length : 0, pc = Math.floor(done / nkLg.pairs.length * 100);
      const pr = document.createElement('div'); pr.className = 'nk-prog';
      const bar = document.createElement('div'); bar.className = 'nk-bar'; const fill = document.createElement('i'); fill.style.width = Math.max(4, pc) + '%'; bar.append(fill);
      const t = document.createElement('div'); t.className = 'nk-ptext'; t.textContent = '⚔️ そうあたり けいさんちゅう… ' + pc + '%（' + done + ' / ' + nkLg.pairs.length + ' せん）じゅんいは まだ かわるよ';
      pr.append(bar, t); box.append(pr);
    }
  }
  let pos = 0, prev = null;
  order.forEach((m, i) => {
    const s = st.get(m), p = pts(m); if (p !== prev) pos = i + 1; prev = p;
    const row = document.createElement('button'); row.className = 'rk-row rk-top' + (m.me ? ' mine' : '');
    const ps = document.createElement('span'); ps.className = 'rk-pos'; ps.textContent = nkLg.mons.length >= 2 ? pos : '-';
    // 名前は 上の 段、ランクせん 全体の 勝率は 下の 段に 小さく（1 行に つめると 名前が かくれる）
    const nb = document.createElement('span'); nb.className = 'nk-nm';
    const n = document.createElement('span'); n.className = 'rk-opp'; n.textContent = m.name + (m.me ? '（あなた）' : '');
    const all = (nkLg.mons.length - 1) * 2, partial = busy && s.w + s.l + s.d < all;   // この 人の 試合が まだ のこって いる
    // 成績も 下の 段へ（名前が 横はばを ぜんぶ つかえる ように）
    const sub = document.createElement('small'); sub.className = 'rk-d';
    sub.textContent = (s.w + s.l + s.d ? s.w + 'しょう ' + s.l + 'はい' + (s.d ? ' ' + s.d + 'わけ' : '') : '') + (partial ? ' …' : '') + (m.pct != null ? '・ぜんたい ' + m.pct + '%' : '');
    nb.append(n, sub);
    row.append(ps, miniPreview(m.code, m.me ? ME.color : RANK_COLOR, 64, m.kz), nb);
    if (!m.me) row.addEventListener('click', () => nkPractice(m));
    box.append(row);
  });
  if (nkLg.mons.length === 1) { const u = document.createElement('div'); u.className = 'rk-note'; u.textContent = 'なかまが ランクせんに とうろくすると そうあたりで たたかうよ'; box.append(u); }
}
function nkPractice(m) {
  if (!myRobot) { $('nkmsg').textContent = 'れんしゅうじあいは モンスターを つくってから'; return; }
  TR('nkpractice', null); rankEvMode = false; rankNkMode = true;
  rankBattle(plainCode(myRobot), m.code, ME.name, m.name, ME.color, RANK_COLOR, 'A', 'practice', KZ_ON ? kzStr(kzs.eq()) : '', m.kz);
}
// ほかの アプリから もどって きた とき: 開いて いる 画面の 順位を 聞きなおす（前に 聞いて から 1 分 たって いる ときだけ。置きっぱなしでも 古い ままに しない）
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  if (mode === 'rank') loadRank().then(() => { if (mode === 'rank') renderRank(); });
  else if (mode === 'ev') loadEv().then(() => { if (mode === 'ev') renderEv(); });
  else if (mode === 'nakama') loadNakama().then(() => { if (mode === 'nakama') renderNakama(); });
  else if (mode === 'title' && RANK_ON) titleRank();
});
onTap($('nkgo'), nkSubmit);
$('nkin').addEventListener('keydown', e => { if (e.key === 'Enter') nkSubmit(); });
// ---------- うら 5 人抜き: 王冠・でんどういり・エンディング ----------
let endT0 = 0, confetti = [], endingKind = null, fireworks = [];   // endingKind: 'kami' で かみの エンディング
function onUraClear() {
  TR('uraclear', { me: plainCode(myRobot) });
  const code = plainCode(myRobot), tag = codeTag(code), list = crownedList(), fresh = !list.includes(tag);
  if (fresh) { list.push(tag); lsSet('crowned', JSON.stringify(list)); }
  myRobot.crown = true; lsSet('robot', RB.encodeDesign(myRobot)); S.crownA = true;
  if (fresh) { hallAdd('hall', { c: code, d: (new Date().getMonth() + 1) + '/' + new Date().getDate() }); }
  endingTerrain = null; endingKind = null; endingPending = true;
}
let endingPending = false;
let endingTerrain = null;   // ちけいの うらで エンディング: その 地形（水平は null）
// 限定かざり: うらを クリアした 地形の 数（水平も 1 つに 数える、オーナー 2026-10-01）が lim に とどいたら もらえる。水平・ちけい どちらの うら クリアでも 見る
function checkLimitKz() {
  if (!ARENA_ON) return 0;
  const nT = ARENA.TERRAINS.filter(t => lsGet(tpre(t.key) + 'ura.cleared') === '1').length, own = kzs.own();
  for (const it of KZ.ITEMS) if (it && it.lim && nT >= it.lim && !own.includes(it.id)) { own.push(it.id); kzs.setOwn(own); $('rsub').textContent += '\n🎁 うらを ' + it.lim + ' つの ちけいで クリア！ げんてい かざり「' + it.name + '」を もらった！'; TR('kzlimit', { id: it.id }); }
  return nT;
}
// ちけいの うら クリア: しるし（形ごと）・地形の でんどういり・うらを クリアした 地形の 数で 限定かざり・エンディング（水平の 王冠と おなじ あつかい）
function onTerrainUraClear(ti) {
  const code = plainCode(myRobot), tg = codeTag(code), L = tmarkList(terrain), fresh = !L.includes(tg);
  if (fresh) { L.push(tg); lsSet('tmark.' + terrain, JSON.stringify(L)); hallAdd('hall.' + terrain, { c: code, d: (new Date().getMonth() + 1) + '/' + new Date().getDate() }); }
  myRobot.tstar = tmarkCount(myRobot); S.tstarA = myRobot.tstar;
  $('rsub').textContent += '\n⭐ ' + ti.name + ' の しるし' + (fresh ? 'を もらった！' : '（もう もってる）') + '（この モンスター ' + myRobot.tstar + ' こ）';
  const nT = checkLimitKz();
  TR('terrainmark', { t: terrain, n: myRobot.tstar, all: nT });
  endingTerrain = ti; endingPending = true;
}
// でんどういり・でんせつの 記録に 1 つ 足す（形つきは 最新 HALL_KEEP こ まで、数は 〜.n）
function hallAdd(k, h) {
  let a = []; try { a = JSON.parse(lsGet(k) || '[]'); } catch (e) {}
  const n0 = hallCount(k);   // 足す 前に 数える（前は 足した あとに 数えて +1 して いて 1 こ 多かった）
  a.push(h); lsSet(k, JSON.stringify(a.slice(-HALL_KEEP))); lsSet(k + '.n', String(n0 + 1));
}
function hallCount(k) { let a = []; try { a = JSON.parse(lsGet(k) || '[]'); } catch (e) {} return Math.max(+(lsGet(k + '.n') || 0), a.length); }
function onMinnaClear() {
  const code = plainCode(myRobot), tag = codeTag(code), list = legendList(), fresh = !list.includes(tag);
  if (fresh) { list.push(tag); lsSet('legend', JSON.stringify(list)); }
  const t = new Date(), day = t.getFullYear() + '/' + (t.getMonth() + 1) + '/' + t.getDate();
  if (fresh) hallAdd('legendhall', { c: code, d: day });
  myRobot.legend = true; S.legendA = true;
  TR('minnaclear', { me: code });
  $('cert').hidden = false; $('cert').textContent = 'でんせつ しょうめいしょ'; certFor = { c: code, d: day };
}
// かみを たおした: てんしの わ・かみごえ でんどういり・しょうめいしょ・盛大な エンディング（2026-10-02、オーナー）
function onKamiClear() {
  const code = plainCode(myRobot), tag = codeTag(code), list = kamiList(), fresh = !list.includes(tag);
  if (fresh) { list.push(tag); lsSet('kamigoe', JSON.stringify(list)); }
  const t = new Date(), day = t.getFullYear() + '/' + (t.getMonth() + 1) + '/' + t.getDate();
  if (fresh) hallAdd('kamihall', { c: code, d: day });
  myRobot.halo = true; S.haloA = true;
  TR('kamiclear', { me: code, fresh });
  $('cert').hidden = false; $('cert').textContent = 'かみごえ しょうめいしょ'; certFor = { c: code, d: day, kami: true };
  endingTerrain = null; endingKind = 'kami'; endingPending = true;
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
function makeKamiCert(code, day) {
  const d = RB.decodeDesign(code); if (!d) return null;
  withCrown(d); d.halo = true;
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350;
  const g = c.getContext('2d');
  const bg = g.createRadialGradient(540, 620, 60, 540, 620, 900); bg.addColorStop(0, '#fffdf3'); bg.addColorStop(0.45, '#ffe9a8'); bg.addColorStop(1, '#b8860b');
  g.fillStyle = bg; g.fillRect(0, 0, 1080, 1350);
  g.save(); g.translate(540, 620); g.globalAlpha = 0.18; g.fillStyle = '#ffffff';   // ひかりの すじ
  for (let i = 0; i < 24; i++) { g.rotate(Math.PI / 12); g.beginPath(); g.moveTo(0, 0); g.lineTo(-60, -1100); g.lineTo(60, -1100); g.closePath(); g.fill(); }
  g.restore();
  g.strokeStyle = '#7a5300'; g.lineWidth = 18; g.strokeRect(36, 36, 1008, 1278); g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.strokeRect(70, 70, 940, 1210);
  g.textAlign = 'center'; g.lineJoin = 'round';
  const big = (t, y, px) => { g.font = '900 ' + px + 'px sans-serif'; g.lineWidth = px * 0.16; g.strokeStyle = '#5a3d00'; g.strokeText(t, 540, y); g.fillStyle = '#ffffff'; g.fillText(t, 540, y); };
  big('かみごえ', 220, 120); big('しょうめいしょ', 315, 64);
  const m = document.createElement('canvas'); m.width = 720; m.height = 600;
  drawPreview(m, d, ME.color);
  g.save(); g.shadowColor = '#ffffff'; g.shadowBlur = 60; g.drawImage(m, 180, 360); g.restore();
  g.fillStyle = '#3d2a00'; g.font = '800 50px sans-serif';
  g.fillText('さくしゃが つくった かみ 5 たいを', 540, 1060); g.fillText('ぜんぶ たおした！', 540, 1130);
  g.fillStyle = '#5a3d00'; g.font = '700 38px sans-serif'; g.fillText(day + '　かいて！モンスターバトル', 540, 1220);
  return c;
}
function showKamiCert(code, day) {
  const c = makeKamiCert(code, day); if (!c) return;
  TR('cert', { me: code, k: 'kami' });
  openCertBox(c, 'かみごえ しょうめいしょ（ながおしで ほぞん）', 'kamigoe.png', 'さくしゃが つくった かみ 5 たいを たおして「かみごえ」に なった！（かいて！モンスターバトル）' + String.fromCharCode(10) + SITE_URL);
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
  const LGC = { bronze: '#ffab76', silver: '#e0e0e0', gold: '#ffd54f', plat: '#90caf9', dia: '#b2ebf2', master: '#d1c4e9', gm: '#ffcc80', legend: '#ffe082' };
  const top = LG_ON && me.lg ? LGC[LGR[me.lg.L].k] : me.pos === 1 ? '#ffd54f' : me.pos === 2 ? '#e0e0e0' : me.pos === 3 ? '#ffab76' : '#ffffff';
  g.strokeStyle = '#ffb74d'; g.lineWidth = 16; g.strokeRect(40, 40, W - 80, H - 80); g.lineWidth = 4; g.strokeRect(70, 70, W - 140, H - 140);
  g.textAlign = 'center';
  g.fillStyle = '#ffcc80'; g.font = '900 60px sans-serif'; g.fillText('モンスター ランクせん', W / 2, 170);
  // 順位（数字は 大きく、「い」は 小さく）。リーグ制は グループの 順位と リーグ名
  const num = String(LG_ON && me.lg ? me.lg.gp : me.pos);
  g.font = '900 210px sans-serif'; const nw = g.measureText(num).width;
  g.font = '900 100px sans-serif'; const iw = g.measureText(' い').width;
  const x0 = W / 2 - (nw + iw) / 2;
  g.textAlign = 'left'; g.fillStyle = top;
  g.font = '900 210px sans-serif'; g.fillText(num, x0, 385);
  g.font = '900 100px sans-serif'; g.fillText(' い', x0 + nw, 385);
  g.textAlign = 'center'; g.fillStyle = '#ffe0b2'; g.font = '800 46px sans-serif';
  g.fillText(LG_ON && me.lg ? LGR[me.lg.L].mark + ' ' + LGR[me.lg.L].name + ' リーグ' + (!me.lg.top ? '・グループ ' + (me.lg.g + 1) : '') + '（' + me.lg.gn + ' たい）' : me.count + ' たい ちゅう', W / 2, 455);
  const m = document.createElement('canvas'); m.width = 900; m.height = 540;
  drawPreview(m, d, ME.color);
  g.save(); g.shadowColor = 'rgba(255, 183, 77, .7)'; g.shadowBlur = 40; g.drawImage(m, 90, 470); g.restore();
  let y = 1060;
  if (me.champ) { g.fillStyle = '#ffd54f'; g.font = '900 50px sans-serif'; g.fillText('👑 きのうの チャンピオン' + (me.champ >= 2 ? '（' + me.champ + ' にち れんぞく）' : ''), W / 2, 1020, W - 200); y = 1100; }
  g.fillStyle = '#ffffff'; g.font = '900 72px sans-serif'; g.fillText(me.name, W / 2, y, W - 200);
  g.fillStyle = '#ffcc80'; g.font = '800 46px sans-serif';
  g.fillText(LG_ON && me.lg ? 'グループの しょうりつ ' + me.lg.pct + '%' : 'しょうりつ ' + me.pct + '%（' + me.w + 'しょう ' + me.l + 'はい' + (me.d ? ' ' + me.d + 'わけ' : '') + '）', W / 2, y + 75, W - 200);
  g.fillStyle = '#ffe0b2'; g.font = '700 36px sans-serif'; g.fillText('かいて！モンスターバトル　renmygames.com', W / 2, 1255);
  return c;
}
function showRankCard(me) {
  const c = makeRankCard(me); if (!c) return;
  TR('rankcard', LG_ON && me.lg ? { L: me.lg.L, gp: me.lg.gp, gn: me.lg.gn } : { pos: me.pos, n: me.count });
  const url = SITE_URL + '#r=' + RB.encodeDesign(rankCardDesign(me));
  const text = (LG_ON && me.lg ? 'ランクせん ' + LGR[me.lg.L].mark + ' ' + LGR[me.lg.L].name + ' リーグ' + (!me.lg.top ? 'の グループ ' + (me.lg.g + 1) : '') + 'で ' + me.lg.gp + ' い！' : 'ランクせんで ' + me.pos + ' い（' + me.count + ' たい ちゅう）！') + '「' + me.name + '」と たたかってみて！（かいて！モンスターバトル）' + String.fromCharCode(10) + url;
  openCertBox(c, 'じゅんい カード（ながおしで ほぞん）', 'rank.png', text, true);
}
onTap($('cert'), () => { if (certFor) (certFor.kami ? showKamiCert : showCert)(certFor.c, certFor.d); });
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
function renderKamiHall() {
  let kh = []; try { kh = JSON.parse(lsGet('kamihall') || '[]'); } catch (e) {}
  $('kamibox').hidden = !kh.length;
  const list = $('kamilist'); list.innerHTML = '';
  for (const x of kh.slice(-12)) {
    const d = RB.decodeDesign(x.c); if (!d) continue; withCrown(d); d.halo = true;
    const el = document.createElement('div'); el.className = 'hall';
    el.innerHTML = '<canvas width="128" height="128"></canvas><span>' + x.d + '</span>';
    list.appendChild(el); drawPreview(el.querySelector('canvas'), d, ME.color);
    el.addEventListener('click', () => showKamiCert(x.c, x.d));
  }
}
function renderHall() {
  renderKamiHall();
  renderLegend();
  renderTerrainHall();
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
// ちけいの でんどういり（地形ごと。うらを クリアした 形と 日にち）
function renderTerrainHall() {
  const box = $('thallbox'); if (!box) return; box.innerHTML = '';
  for (const t of (window.ARENA ? ARENA.TERRAINS : [])) {
    if (t.key === 'flat') continue;
    let a = []; try { a = JSON.parse(lsGet('hall.' + t.key) || '[]'); } catch (e) {}
    if (!a.length) continue;
    const sec = document.createElement('div'); sec.className = 'thall'; box.appendChild(sec);   // 水平の でんどういりと おなじ わく（みどり）
    const h = document.createElement('div'); h.className = 'hall-title thall-title'; h.innerHTML = '<span class="tstar">★</span>'; h.append(document.createTextNode(t.name + ' でんどういり（' + hallCount('hall.' + t.key) + '）')); sec.appendChild(h);   // 星は しるしと おなじ みどり
    const list = document.createElement('div'); list.className = 'thall-list'; sec.appendChild(list);
    for (const x of a.slice(-12)) { const d = RB.decodeDesign(x.c); if (!d) continue; d.tstar = tmarkCount(d); const el = document.createElement('div'); el.className = 'hall'; el.innerHTML = '<canvas width="128" height="128"></canvas><span>' + x.d + '</span>'; list.appendChild(el); drawPreview(el.querySelector('canvas'), d, ME.color); }
  }
  box.hidden = !box.children.length;
}
function startEnding() { fireworks = []; endingPending = false; mode = 'ending'; show('none'); $('quit').hidden = true; $('fast').hidden = true; endT0 = performance.now(); confetti = []; }
let endingPreview = false;   // ?endingpreview の 見本（王冠・でんどういりの 記録は 付けない）
function finishEnding() {
  const wasKami = endingKind === 'kami'; endingKind = null;
  if (endingPreview) { endingPreview = false; myRobot.crown = isCrowned(myRobot); if (wasKami) myRobot.halo = kamiList().includes(codeTag(plainCode(myRobot))); showTitle(); return; }
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
  if (endingKind === 'kami') return renderKamiEnding(now);
  const t = (now - endT0) / 1000;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const et = endingTerrain;   // ちけいの ときは その 地形の 色と 相手
  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, et ? et.sky[0] : '#2a1a4f'); sky.addColorStop(1, et ? et.sky[1] : '#6b3a1f');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  const gy = H * 0.66;
  ctx.fillStyle = et ? et.ground : '#4b3f8f'; ctx.fillRect(0, gy, W, H - gy); ctx.fillStyle = et ? et.edge : '#ffd54f'; ctx.fillRect(0, gy, W, 4);
  const list = et ? et.cpu.omote.concat(et.cpu.ura) : RB.CPU.concat(RB.URA), sp = Math.max(160, W * 0.45), gap = 110, parade = (W + gap * list.length + 120) / sp;
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
    ctx.fillText((et ? et.name + ' の ' : '') + 'うら 5 にんぬき たっせい！', W / 2, H * 0.22); ctx.fillText(et ? '⭐ しるしを もらった！' : 'おうかんを もらった！', W / 2, H * 0.27);
  }
  if (t > 1.2) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4); ctx.font = '700 14px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('タップで つぎへ', W / 2, H - 40); ctx.globalAlpha = 1; }
}
// かみの エンディング: 夜空に 20 たいの 行進 → ひかりの はしら → てんしの わ の じぶん・はなび
function renderKamiEnding(now) {
  const t = (now - endT0) / 1000;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#05040f'); sky.addColorStop(1, '#2b2160'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) { const x = (i * 97.3) % W, y = (i * 53.7) % (H * 0.6); ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t * 2 + i); ctx.fillStyle = '#fff'; ctx.fillRect(x, y, 2, 2); }
  ctx.globalAlpha = 1;
  const gy = H * 0.68; ctx.fillStyle = '#1b1640'; ctx.fillRect(0, gy, W, H - gy); ctx.fillStyle = '#ffe066'; ctx.fillRect(0, gy, W, 3);
  const list = RB.CPU.concat(RB.URA, RB.MINNA, RB.KAMI), sp = Math.max(220, W * 0.6), gap = 92, parade = (W + gap * list.length + 120) / sp;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (t < parade) {
    ctx.font = '900 ' + Math.min(26, W * 0.06) + 'px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('たおして きた 20 たい', W / 2, H * 0.18);
    const tier = ['#ffffff', '#ff8a80', '#80deea', '#ffe066'];
    list.forEach((c, i) => {
      const x = W + 60 + gap * i - sp * t; if (x < -80 || x > W + 80) return;
      const hop = Math.abs(Math.sin(t * 8 + i)) * 6, sc = i >= 15 ? 0.6 : 0.5;
      if (i >= 15) { ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 18; }
      ctx.save(); ctx.translate(x, gy - hop - lowY(c) * sc); ctx.scale(-sc, sc); drawRobotLocal(ctx, c, c.color, 1, false); ctx.restore();
      if (i >= 15) ctx.restore();
      ctx.font = '800 12px sans-serif'; ctx.fillStyle = tier[Math.floor(i / 5)]; ctx.fillText(c.name, x, gy + 22);
    });
    return kamiTapHint(t);
  }
  const u = t - parade;
  // ひかりの はしら
  const pw = Math.min(W * 0.5, 40 + u * 220), pa = Math.min(1, u / 0.8);
  const lg = ctx.createLinearGradient(W / 2 - pw / 2, 0, W / 2 + pw / 2, 0); lg.addColorStop(0, 'rgba(255,240,180,0)'); lg.addColorStop(0.5, 'rgba(255,250,220,' + (0.75 * pa) + ')'); lg.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = lg; ctx.fillRect(W / 2 - pw / 2, 0, pw, gy);
  // はなび
  if (u > 0.6 && (fireworks.length === 0 || now - fireworks[fireworks.length - 1].t0 > 700)) fireworks.push({ t0: now, x: W * (0.15 + 0.7 * Math.random()), y: H * (0.12 + 0.3 * Math.random()), c: ['#ffd54f', '#ff8a80', '#80deea', '#b388ff', '#ffffff'][fireworks.length % 5] });
  for (const f of fireworks) { const a = (now - f.t0) / 1000; if (a > 1.6) continue; ctx.globalAlpha = Math.max(0, 1 - a / 1.6); ctx.fillStyle = f.c;
    for (let k = 0; k < 28; k++) { const ang = k * Math.PI * 2 / 28, r = 140 * (1 - Math.exp(-a * 3)); ctx.beginPath(); ctx.arc(f.x + Math.cos(ang) * r, f.y + Math.sin(ang) * r + 40 * a * a, 2.6, 0, Math.PI * 2); ctx.fill(); } }
  ctx.globalAlpha = 1;
  // てんしの わ の じぶん（ゆっくり 浮く）
  const k = Math.min(1, u / 0.8), sc = Math.min(W / 260, H / 480) * (0.6 + 0.45 * k), fl = Math.sin(u * 2) * 6 - Math.min(1, u / 1.5) * 18;
  let mx0 = Infinity, mx1 = -Infinity; for (const q of ['body', 'arm', 'leg']) for (const p of myRobot[q]) { mx0 = Math.min(mx0, p[0]); mx1 = Math.max(mx1, p[0]); }
  ctx.save(); ctx.shadowColor = '#fff6c8'; ctx.shadowBlur = 30; ctx.translate(W / 2 - (mx0 + mx1) / 2 * sc, gy - lowY(myRobot) * sc + fl); ctx.scale(sc, sc); drawRobotLocal(ctx, Object.assign({}, myRobot, { halo: true }), ME.color, 1, false); ctx.restore();
  ctx.font = '900 ' + Math.min(48, W * 0.12) + 'px sans-serif'; ctx.lineWidth = 9; ctx.strokeStyle = '#3d2a00';
  ctx.strokeText('かみ を こえた', W / 2, H * 0.13); ctx.fillStyle = '#ffe066'; ctx.fillText('かみ を こえた', W / 2, H * 0.13);
  ctx.font = '800 ' + Math.min(18, W * 0.045) + 'px sans-serif'; ctx.fillStyle = '#fff';
  ctx.fillText('きみの モンスターは「かみごえ」に なった！', W / 2, H * 0.21); ctx.fillText('😇 てんしの わ を もらった！', W / 2, H * 0.26);
  if (u > 2.5) { ctx.globalAlpha = Math.min(1, (u - 2.5) / 1); ctx.font = '700 ' + Math.min(14, W * 0.036) + 'px sans-serif'; ctx.fillStyle = '#ffe9a8'; ctx.fillText('さくしゃ も びっくり。ほんとうに おめでとう！', W / 2, H * 0.31); ctx.globalAlpha = 1; }
  kamiTapHint(t);
}
function kamiTapHint(t) { if (t > 1.2) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4); ctx.font = '700 14px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('タップで つぎへ', W / 2, H - 40); ctx.globalAlpha = 1; } }
onTap($('vs'), startVsMode);
onTap($('vstitle'), () => { if (S && S.side === 'rank') { if (S.evBattle) showEv(); else if (S.nkBattle) showNakama(); else showRank(); } else exitVs(); });
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
  const reset = !vs && !same && runInProgress();   // みんな・かみ・地形の とちゅうも（v168 まで おもて・うら だけ 見て いた）
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
  $('sidebtn').hidden = !sideOpen('ura') && !sideOpen('minna') && !sideOpen('kami');
  $('sidebtn').textContent = tname() + SIDE_LABEL[side];
  $('sidebtn').classList.toggle('ura', side !== 'omote');
  $('fight').innerHTML = tname() + (side === 'omote' ? '' : SIDE_LABEL[side] + ' ') + 'たたかう<small>' + (stage + 1) + ' / ' + CPUS().length + ' ' + CPUS()[stage].name + '</small>';
  $('fight').classList.toggle('ura', side !== 'omote');
  applyVsUi();
  applyEvUi();
}
// おもて ⇄ うら（押すたびに切りかえ）
onTap($('sidebtn'), () => { const order = ['omote'].concat(sideOpen('ura') ? ['ura'] : [], sideOpen('minna') ? ['minna'] : [], sideOpen('kami') ? ['kami'] : []); side = order[(order.indexOf(side) + 1) % order.length]; lsSet('side', side); loadSide(); updateSideUi(); if (side === 'minna' && terrain === 'flat' && lsGet('minna.intro') !== '1') showMinnaInfo(); setHint(side === 'ura' ? 'うら かちぬき：とんでもなく つよい 5 たい' : side === 'kami' ? 'かみ：さくしゃが つくった いみわからん くらい つよい 5 たい' : side === 'minna' ? 'みんなの さいきょう ぐんだん：うらを クリアした みんなの モンスターから えらばれた 5 たい' : ''); });
onTap($('fast'), () => { fast = !fast; TR('fast', { on: fast }); lsSet('fast', fast ? '1' : '0'); updateFastBtn(); });
// 戦いの途中で もどる（勝ち抜きの途中経過は そのまま。戦いは決定的なので やめても 得はしない）
onTap($('quit'), () => { if ((mode === 'battle' || mode === 'pause') && S && S.side === 'rank') { if (S.evBattle) showEv(); else if (S.nkBattle) showNakama(); else showRank(); return; } if (mode === 'battle' || mode === 'pause') { TR('quit', { side: S && S.side, stage: S && S.stage, t: S && Math.round(S.t * 10) / 10, d: S && S.d }); showDraw(); } });
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
    noteServerDate(r.headers.get('date'));
    const v = (await r.text()).trim();
    if (v && v !== VERSION && mode !== 'battle') {
      // 同じ 版への 読みなおしは 1 分に 1 回まで（くり返さない ため）。前は 1 回 きりで、Safari が 古い ページを 出しなおすと 古い まま だった
      let tried = ''; try { tried = sessionStorage.getItem(KEY + 'reloadFor') || ''; } catch (e) {}
      const [tv, tt] = tried.split('|'); if (tv === v && Date.now() - (+tt || 0) < 60e3) return;
      try { sessionStorage.setItem(KEY + 'reloadFor', v + '|' + Date.now()); } catch (e) {}
      location.reload();
    }
  } catch (e) {}
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { checkVersion(); loadStats(); } });
window.addEventListener('pageshow', e => { if (e.persisted) { checkVersion(); loadStats(); } });
checkVersion();

// ---------- 下の タブ（2026-09-30〜、v122 で 全員に）----------
// トップが 長く なって きたので: ぼうけん（ホーム）・ランクせん・イベント・ガチャ・そのほか。描く 画面と 戦いの 画面では 出さない
// そのほか には トップに あった コレクション・データの ひきつぎ・English・あそびかた を 移す（同じ 部品を 動かすので 動きは おなじ）。ふたりで は ぼうけんの 下
if (OWNER && /[?&]navtest(=|&|$)/.test(location.search)) lsSet('navtest', '1');
function navOn() { return true; }   // 2026-09-30 全員に 公開（前は ?navtest の 端末だけ）
function navSync(id) {
  const nb = $('navbar'); if (!nb) return;
  const tab = navOn() ? { title: 'home', rank: 'rank', nakama: 'rank', ev: 'ev', more: 'more', kz: 'kz' }[id] : null;
  nb.hidden = !tab; document.documentElement.classList.toggle('navshow', !!tab); if (!tab) return;
  for (const b of nb.querySelectorAll('button')) b.classList.toggle('on', b.dataset.tab === tab);
  nb.querySelector('[data-tab=rank]').classList.toggle('dot', lsGet('rank.reg') !== '1');
  nb.querySelector('[data-tab=kz]').classList.toggle('dot', KZ_ON && kzs.coins() >= KZ.PRICE);
  nb.querySelector('[data-tab=ev]').hidden = !EV_ON;
}
function showMore() { mode = 'more'; show('more'); renderSupport(); }
// ---------- おうえん（2026-10-03〜、OFUSE）: おうえん して くれた 人に お礼の かざり「きんの はね」の コードを おくる。コードは 1 回きり（受付係 POST /code）----------
// 金がくは いくらでも（オーナー）。見た目だけで 強さは かわらない。まずは ?supporttest の 端末だけ
if (OWNER && /[?&]supporttest(=|&|$)/.test(location.search)) lsSet('supporttest', '1');
const SUP_ON = true;   // 2026-10-03 全員に（オーナー OK。前は ?supporttest の 端末だけ）
const DISCORD_URL = 'https://discord.gg/tZYXj9Sg6V';   // 2026-10-04 オーナーの サーバー（招待は 期限なし）
const SUPPORT_URL = 'https://ofuse.me/a2b46de1';   // OFUSE の ページ（2026-10-03 オーナー 登録）
const SUP_ITEM = 84;
function renderSupport() {
  if (!SUP_ON) return;
  let box = $('supbox');
  if (!box) {
    box = document.createElement('div'); box.id = 'supbox'; box.className = 'supbox';
    box.innerHTML = '<canvas id="supprev" width="240" height="240"></canvas><div class="sup-body"><div class="sup-t">🪽 おうえんする</div>'
      + '<div class="sup-d">ゲームを おうえん して くれた 人に、お礼の かざり「きんの はね」の コードを おくります。金がくは いくらでも OK。見た目だけで、強さは かわりません。</div>'
      + '<a id="supgo" class="sup-go" target="_blank" rel="noopener">OFUSE で おうえんする</a>'
      + '<div class="sup-code"><input id="supcode" placeholder="コード" maxlength="16" autocomplete="off" autocapitalize="characters" spellcheck="false"><button id="supok" class="sub">つかう</button></div>'
      + '<div id="supmsg" class="sup-msg"></div></div>';
    $('morelist').prepend(box);
    onTap($('supok'), redeemSupport);
    $('supcode').addEventListener('keydown', e => { if (e.key === 'Enter') redeemSupport(); });
    $('supgo').addEventListener('click', () => TR('supgo', null));
  }
  const go = $('supgo');
  if (SUPPORT_URL) { go.href = SUPPORT_URL; go.classList.remove('off'); go.textContent = 'OFUSE で おうえんする'; } else { go.removeAttribute('href'); go.classList.add('off'); go.textContent = 'じゅんび ちゅう'; }
  const has = kzs.own().includes(SUP_ITEM);
  if (has && !$('supmsg').textContent) $('supmsg').textContent = '✨ きんの はね を もって います。おうえん ありがとう！';
  // じぶんの モンスターに きんの はね を つけた 絵（もって いない 人にも 見本で）
  const base = myRobot || RB.CPU[2];
  const d = Object.assign({}, base, { kz: [0, 0, 0, SUP_ITEM], crown: false, legend: false, halo: false, champ: 0 });
  drawPreview($('supprev'), d, ME.color, true);
}
async function redeemSupport() {
  const code = ($('supcode').value || '').toUpperCase().replace(/[^0-9A-Z]/g, ''), msg = $('supmsg');
  if (code.length < 8) { msg.textContent = 'コードを ぜんぶ 入れてね'; return; }
  msg.textContent = 'たしかめて います…';
  try {
    const r = await (await fetch(RANK_API + '/code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dev: rankDev(), code }) })).json();
    if (!r || !r.item) { msg.textContent = (r && r.error) || 'その コードは つかえないよ'; TR('supcode', { ok: 0 }); return; }
    const own = kzs.own(); if (!own.includes(r.item)) { own.push(r.item); kzs.setOwn(own); }
    const it = KZ.ITEMS[r.item]; if (it) { const e = kzs.eq(); e[KZ.SLOTS.indexOf(it.slot)] = r.item; kzs.setEq(e); }   // すぐ つける
    $('supcode').value = ''; msg.textContent = '🪽 きんの はね を もらった！ もう せなかに ついて います。おうえん ありがとう！';
    TR('supcode', { ok: 1, item: r.item }); renderSupport();
  } catch (e) { msg.textContent = 'つながらなかったよ。すこし まってから もういちど'; }
}
// トップの モンスターの 絵を 枠の あいている 高さ・はばに あわせる（Safari は vh が バーの ぶん ずれるので 測る）。いちど 小さく して 枠の 大きさを 測る
function fitTmon() {
  if (!navOn() || $('title').hidden) return;
  const c = $('tmon'), card = $('tmycard'), body = card.querySelector('.mc-body');
  card.classList.remove('row'); c.style.width = c.style.height = '40px';
  const cs = getComputedStyle(card), padV = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom), padH = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  let sz = Math.floor(Math.max(48, Math.min(card.clientWidth - padH, card.clientHeight - padV - body.offsetHeight - 10, 360)));
  // 縦の あきが すくない（X の アプリ内 ブラウザ など）ときは 絵を 左・文字を 右に して 高さを ぜんぶ 絵に つかう
  if (sz < 120) { const h = card.clientHeight - padV; card.classList.add('row'); sz = Math.floor(Math.max(48, Math.min(h, (card.clientWidth - padH) * 0.5, 360))); }
  c.style.width = c.style.height = sz + 'px';
}
window.addEventListener('resize', () => setTimeout(fitTmon, 0));
// 開いた あとで 画面の 高さが かわる（X の アプリ内 ブラウザの バー・文字の 読みこみ）と 小さい まま のこる ので、タイトルの わくの 大きさが かわったら 測りなおす
if (window.ResizeObserver) { let lastH = 0; new ResizeObserver(es => { const h = Math.round(es[0].contentRect.height); if (Math.abs(h - lastH) > 2) { lastH = h; setTimeout(fitTmon, 0); } }).observe(document.querySelector('#title .panel')); }
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(fitTmon, 0));
setTimeout(fitTmon, 400); setTimeout(fitTmon, 1500);
// ホーム画面から 開いた iPhone で ページの 高さが 画面より 短い（下に ページの 外の 帯が できる）か。短い ときは タブの 下の よはくを へらす（style.css の html.sa-short）
// ---------- 毎日の ミッション（2026-10-04 オーナー）----------
// 毎日 3 つ（やさしい・ふつう・むずかしい から 1 つずつ、日付で きまる ＝ みんな 同じ）。1 つ 🪙50。3 つ ぜんぶで スタンプ 💮 1 こ
// スタンプは つづけなくて いい（やった 日の ぶん たまる）。1〜6 こめ 🪙100、7 こめ 🪙10000 と げんてい かざり「はなまる」（id 85）→ 新しい カード
// しんぽは TR（あそびの 記録）の できごと から 数える。まずは ?missiontest の オーナー端末だけ
if (OWNER && /[?&]missiontest(=|&|$)/.test(location.search)) lsSet('missiontest', '1');
const MSN_ON = OWNER && lsGet('missiontest') === '1';
const MSN_POOL = [
  // [id, むずかしさ 0〜2, ことば, かず, 数える できごと]
  ['fight5', 0, 'どこでも 5 かい たたかう', 5, (e, d) => e === 'result'],
  ['win3', 0, 'ぼうけんで 3 かい かつ', 3, (e, d) => e === 'result' && d.win === 'win' && (d.side === 'omote' || d.side === 'ura') && !d.ter],
  ['gacha1', 0, 'ガチャを 1 かい ひく', 1, (e, d) => e === 'gacha'],
  ['rank2', 0, 'ランクせんで れんしゅう 2 かい', 2, (e, d) => e === 'result' && d.side === 'rank'],
  ['ko3', 1, 'KO で 3 かい かつ', 3, (e, d) => e === 'result' && d.win === 'win' && d.reason === 'ko'],
  ['ter3', 1, 'ちけいで 3 かい かつ', 3, (e, d) => e === 'result' && d.win === 'win' && !!d.ter],
  ['kz1', 1, 'かざりを つけかえる', 1, (e, d) => e === 'kzeq' && !!d.id],
  ['win8', 1, 'ぼうけんで 8 かい かつ', 8, (e, d) => e === 'result' && d.win === 'win' && (d.side === 'omote' || d.side === 'ura') && !d.ter],
  ['fast3', 2, '10 びょう いないに 3 かい かつ', 3, (e, d) => e === 'result' && d.win === 'win' && d.t <= 10],
  ['terc1', 2, 'ちけいを 1 つ クリア', 1, (e, d) => e === 'terrainclear'],
  ['ev1', 2, 'イベントに モンスターを だす', 1, (e, d) => e === 'evreg'],
  ['fight20', 2, 'どこでも 20 かい たたかう', 20, (e, d) => e === 'result'],
];
const MSN_COIN = 50, MSN_STAMP_COIN = 100, MSN_BIG = 10000, MSN_ITEM = 85;
const msnDay = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
function msnToday(day) {   // その 日の 3 つ（日付から きまる）
  let h = 0; for (const ch of day) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return [0, 1, 2].map(lv => { const p = MSN_POOL.filter(m => m[1] === lv); h = (Math.imul(h, 1103515245) + 12345) >>> 0; return p[h % p.length]; });
}
function msnLoad() { let s = {}; try { s = JSON.parse(lsGet('msn') || '{}'); } catch (e) {} const day = msnDay(); if (s.day !== day) { s = { day, prog: {}, done: [], stamps: s.stamps || 0, cards: s.cards || 0, stamped: false, seen: false }; lsSet('msn', JSON.stringify(s)); } return s; }
const msnSave = s => lsSet('msn', JSON.stringify(s));
function msnToast(txt, big) {
  const t = document.createElement('div'); t.className = 'msn-toast' + (big ? ' big' : ''); t.textContent = txt; document.body.appendChild(t);
  setTimeout(() => t.classList.add('out'), big ? 2600 : 1800); setTimeout(() => t.remove(), big ? 3200 : 2400);
}
window.MSN = (e, d) => {
  if (!MSN_ON || e === 'mission') return;
  const s = msnLoad(); let changed = false;
  for (const [id, , label, need, hit] of msnToday(s.day)) {
    if (s.done.includes(id) || !hit(e, d || {})) continue;
    s.prog[id] = (s.prog[id] || 0) + 1; changed = true;
    if (s.prog[id] >= need) { s.done.push(id); kzs.addCoins(MSN_COIN); msnToast('✅ ミッション クリア！「' + label + '」 🪙+' + MSN_COIN); TR('mission', { id }); }
  }
  if (changed && s.done.length >= 3 && !s.stamped) {
    s.stamped = true; s.stamps++;
    if (s.stamps >= 7) {
      s.stamps = 0; s.cards++; kzs.addCoins(MSN_BIG);
      const own = kzs.own(); if (!own.includes(MSN_ITEM)) { own.push(MSN_ITEM); kzs.setOwn(own); }
      msnToast('🎉 スタンプ 7 こ！ 🪙+' + MSN_BIG + ' と かざり「はなまる」！', true); TR('mission', { card: s.cards });
    } else { kzs.addCoins(MSN_STAMP_COIN); msnToast('💮 スタンプ ' + s.stamps + ' / 7 ゲット！ 🪙+' + MSN_STAMP_COIN, true); }
  }
  if (changed) { msnSave(s); msnBadge(); if (!$('msnbox').hidden) msnRender(); }
};
function msnBadge() { const b = $('msnbtn'); if (!b) return; const s = msnLoad(); b.querySelector('span').textContent = s.done.length + '/3'; b.classList.toggle('dot', !s.seen && s.done.length < 3); }
function msnRender() {
  const s = msnLoad(), box = $('msnlist'); box.innerHTML = '';
  for (const [id, lv, label, need] of msnToday(s.day)) {
    const n = Math.min(need, s.prog[id] || 0), ok = s.done.includes(id), row = document.createElement('div'); row.className = 'msn-row' + (ok ? ' ok' : '');
    row.innerHTML = '<div class="msn-l"><b></b><small></small></div><div class="msn-bar"><i></i></div><div class="msn-n"></div>';
    row.querySelector('b').textContent = (ok ? '✅ ' : ['⭐ ', '⭐⭐ ', '⭐⭐⭐ '][lv]) + label; row.querySelector('small').textContent = '🪙' + MSN_COIN;
    row.querySelector('i').style.width = (n / need * 100) + '%'; row.querySelector('.msn-n').textContent = n + ' / ' + need; box.appendChild(row);
  }
  const card = $('msncard'); card.innerHTML = '';
  for (let i = 1; i <= 7; i++) { const c = document.createElement('div'); c.className = 'msn-st' + (i <= s.stamps ? ' on' : '') + (i === 7 ? ' big' : ''); c.textContent = i <= s.stamps ? '💮' : i === 7 ? '🎁' : i; card.appendChild(c); }
  $('msnnote').textContent = s.stamped ? 'きょうの スタンプは もう もらったよ。また あした！' : '3 つ ぜんぶ クリアで スタンプ 1 こ（' + s.done.length + ' / 3）';
}
function msnOpen() { const s = msnLoad(); s.seen = true; msnSave(s); msnRender(); $('msnbox').hidden = false; msnBadge(); TR('nav', { t: 'mission' }); }
if (MSN_ON) {
  const btn = document.createElement('button'); btn.id = 'msnbtn'; btn.className = 'msn-btn'; btn.innerHTML = '📅 <span>0/3</span>';
  const tp = document.querySelector('#title .panel'); tp.classList.add('msn-host'); tp.appendChild(btn); onTap(btn, msnOpen);
  const box = document.createElement('div'); box.id = 'msnbox'; box.hidden = true;
  box.innerHTML = '<div class="msn-panel"><h2>📅 きょうの ミッション</h2><div id="msnlist"></div><div id="msnnote" class="msn-note"></div>'
    + '<h3>💮 スタンプカード</h3><div id="msncard" class="msn-card"></div>'
    + '<p class="msn-help">スタンプは まいにち つづけなくても たまるよ。7 こ あつめると 🪙' + MSN_BIG.toLocaleString() + ' と、ここでしか もらえない かざり「はなまる」！</p>'
    + '<button id="msnclose" class="main">とじる</button></div>';
  document.body.appendChild(box); onTap($('msnclose'), () => { box.hidden = true; });
  box.addEventListener('click', e => { if (e.target === box) box.hidden = true; });
  msnBadge();
}
function fixStandalone() {
  const sa = window.navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  document.documentElement.classList.toggle('sa-short', !!sa && screen.height > screen.width && screen.height - window.innerHeight > 8);
}
fixStandalone(); window.addEventListener('resize', fixStandalone);
if (navOn()) {
  document.body.classList.add('nav');
  $('tmon').width = $('tmon').height = 480;   // トップの モンスターを 大きく 出すので 細かく
  const ml = $('morelist');
  { const row = document.createElement('div'); row.className = 'advrow'; $('adv').append(row); row.append($('advgo'), $('vs')); }   // ふたりで たたかう は「たたかう」の 横（たたかう が 広め。オーナー: そのほか では ない）
  // Discord（2026-10-04 オーナー）: あそぶ 人どうしの 交流の 場。おうえんの すぐ 下
  { const a = document.createElement('a'); a.id = 'dcgo'; a.className = 'dc-go'; a.href = DISCORD_URL; a.target = '_blank'; a.rel = 'noopener';
    const b = document.createElement('b'), sm = document.createElement('small'); b.textContent = '💬 Discord で あそぶ 人と はなそう'; sm.textContent = 'モンスターの じまん・ランクせんの おしらせ・ようぼう（13 さい いじょう）';
    a.append(b, sm); a.addEventListener('click', () => TR('discord', null)); ml.append(a); }
  for (const id of ['collection', 'bkbtn', 'langbtn']) ml.append($(id));
  ml.append(document.querySelector('#title .howto'), document.querySelector('#title .tfoot'));
  if (TIDY) tidyLayout();
}
function tidyLayout() {
  document.body.classList.add('tidy');
  // ランクせん: 参加数と あそびかたを 1 行に。チャンピオン・れきだいは 下の「いちばん うえ」に まとめる（開いて すぐ じぶんの モンスター）
  const row = document.createElement('div'); row.className = 'rk-subrow'; $('ranksub').before(row); row.append($('ranksub'), document.querySelector('#rank .rk-guidetop'));
  const th = document.createElement('div'); th.className = 'rk-h rk-toph'; th.textContent = '👑 チャンピオン・いちばん うえの リーグ';
  $('rankdia').before(th); th.after($('rankchamp'), $('rankhistbtn'), $('rankhist'));
  // 「つくる・なおす」と「じゅんい カード」を 横ならびに（オーナー）
  const br = document.createElement('div'); br.className = 'rk-btnrow'; br.id = 'rankbtnrow'; const ob = $('rankdraw').parentNode; ob.before(br); br.append($('rankdraw')); ob.remove();
  // イベント: あなた → ランキング → きのうの いちばん
  const eh = document.createElement('div'); eh.className = 'rk-h ev-h rk-toph'; eh.textContent = '🎀 きのうの いちばん';
  $('evlist').after(eh); eh.after($('evchamp'), $('evhistbtn'), $('evhist'));
  // かたまりを 四角で かこむ（?boxtest の 端末だけ。2026-10-03 オーナー「境目が わかりづらい」）: あなたの モンスター／グループの じゅんい
  if (BOXT) {
    document.body.classList.add('boxt');
    const mb = document.createElement('div'); mb.className = 'sec-box sec-me'; const mh = document.querySelector('#rank .rk-h'); mh.before(mb);
    mb.append(mh, $('rankme'), $('rankreg'), $('rankmsg'), $('rankbtnrow'));
    const eb = document.createElement('div'); eb.className = 'sec-box sec-evme'; const ehh = document.querySelector('#ev .ev-h'); ehh.before(eb);
    eb.append(ehh, $('evme'), $('evreg'), $('evdraw').parentNode, $('evmsg'));
  }
  // ガチャ: 説明は たたむ（「とじる」は style.css で けす）
  const kn = document.querySelector('#kzbox .kz-note'), kd = document.createElement('details'); kd.className = 'kz-note kz-fold'; kd.innerHTML = '<summary>🪙 コインの もらいかた</summary>';
  kn.replaceWith(kd); kn.className = 'kz-foldt'; kd.append(kn);
  // そのほか: あそびかたに ランクせんの ページも
  const hp = document.createElement('p'); hp.innerHTML = '<a href="rank-guide.html">📖 ランクせんの あそびかた</a>'; document.querySelector('.howto').append(hp);
}
for (const b of document.querySelectorAll('#navbar button')) onTap(b, () => {
  const t = b.dataset.tab; TR('nav', { t });
  $('kzbox').hidden = true;
  if (t === 'home') showTitle(); else if (t === 'rank') showRank(); else if (t === 'ev') showEv(''); else if (t === 'kz') { showTitle(); showKz(); } else showMore();
});
resize();
showTitle();
// ランクせんの あそびかた（rank-guide.html）から もどって きたら ランクせんを 開く（#rank。2026-10-03 オーナー）
if (location.hash === '#rank') { history.replaceState(null, '', location.pathname + location.search); showRank(); }
// あそびかたへ いく ときは いまの ページを #rank に して おく（ブラウザの もどるで ページが 読みなおされても ランクせんに）
window.addEventListener('pageshow', e => { if (location.hash === '#rank') { history.replaceState(null, '', location.pathname + location.search); if (e.persisted && mode !== 'rank') showRank(); } });   // ブラウザの もどるで ページが そのまま もどった とき（#rank は けして おく）
for (const a of document.querySelectorAll('.rk-guide')) a.addEventListener('click', () => { try { history.replaceState(null, '', location.pathname + location.search + '#rank'); } catch (e) {} });
loadStats();   // みんなの きろく
onTap($('statsclose'), () => { $('statsbox').hidden = true; });
onTap($('statsx'), () => { $('statsbox').hidden = true; });
$('statsbox').addEventListener('click', e => { if (e.target === $('statsbox')) $('statsbox').hidden = true; });   // 外がわ（くらい ところ）を タップしても とじる
if (NK_ON && nkPreview) showNakama();   // さそう URL から 来た とき
if (OWNER) {
  // 開発用（オーナーの 端末だけ）: ?draw で描く画面、?shot=秒&stage=n で その時点のバトル、&result で結果
  const q = new URLSearchParams(location.search);
  const sample = () => { const c = RB.CPU[2]; myRobot = RB.design(c.body, c.arm, c.leg); strokes = { body: myRobot.body, arm: myRobot.arm, leg: myRobot.leg }; };
  if (q.has('stage') && !q.has('shot')) stage = +q.get('stage');
  if (q.has('beaten')) beaten = [true, true, true, true, true];   // 開発用: 早送りボタンを見る
  if (KZ_OWNER && q.has('kzgallery')) kzGallery(q.get('kzgallery') || 'head', q.has('nocrown'));   // オーナーの 確認用: ?gachatest&kzgallery=head|face|body|fx（&nocrown で 王冠なし）
  if (KZ_OWNER) {
    if (q.get('kzreveal')) { const it = KZ.ITEMS[+q.get('kzreveal')]; showKz(''); const rv = $('kzreveal'); rv.className = 'r' + it.r; rv.hidden = false; $('kzrstars').textContent = '★'.repeat(it.r); $('kzrname').textContent = it.name; $('kzrsub').textContent = '👀 おためし（まだ つけて ないよ）\nNEW！ ' + KZ.SLOT_LABEL[it.slot] + 'の いちらんから つけてね' + (it.desc ? '\n' + it.desc : ''); kzShow = it; kzRevealDraw(); }
  }
  if (q.get('endingpreview') === 'kami') { if (!myRobot) sample(); myRobot = withCrown(myRobot); endingKind = 'kami'; endingPreview = true; startEnding(); }   // オーナーの 確認用: かみの エンディング
  else if (q.has('endingpreview')) { if (!myRobot) sample(); myRobot = withCrown(myRobot); myRobot.crown = true; endingPreview = true; startEnding(); }   // オーナーの 確認用: エンディングの 見本
  if (q.has('rankdev') && RANK_ON) { if (!myRobot) sample(); showRank(); if (q.get('rankdev') === 'replay') setTimeout(() => { if (rankMe && rankMe.recent[0]) { rankReplay(rankMe, rankMe.recent[0]); } }, 3000); }   // 開発用: ランクせん
  if (q.has('minnainfo')) showMinnaInfo();   // 開発用: しょうかい 画面
  if (q.has('certpreview')) { if (!myRobot) sample(); openCertBox(makeCert(plainCode(myRobot), '2026/9/27')); }   // オーナーの 確認用: でんせつ しょうめいしょ
  if (q.has('kami') && KAMI_OPEN) { side = 'kami'; loadSide(); if (q.has('stage')) stage = +q.get('stage'); }   // 開発用: かみ
  if (q.has('minna') && MINNA_OPEN) { side = 'minna'; loadSide(); if (q.has('stage')) stage = +q.get('stage'); }   // 開発用: みんな
  if (q.has('ura')) { uraOpen = true; side = 'ura'; loadSide(); if (q.has('stage')) stage = +q.get('stage'); }   // 開発用: うら
  if (q.has('terrain') && ARENA_ON) { terrain = q.get('terrain'); side = q.get('side') || 'omote'; loadSide(); if (q.has('stage')) stage = +q.get('stage'); }   // 開発用: ちけい（&terrain=yama&side=omote&stage=n）
  if (q.has('draw')) { if (!myRobot) sample(); if (q.get('draw') === 'arm') { strokes.arm = null; strokes.leg = null; myRobot = null; } showDraw(); }
  if (q.has('shot')) {
    if (!myRobot) sample();
    if (q.has('stage')) stage = +q.get('stage');
    startBattle(q.has('friend') && !!friendRobot);
    const t = +q.get('shot'); let n = 0;
    while (mode === 'battle' && S.t < t && !S.over && n++ < 1000000) stepBattle();
    stop = 0; shake = 0; cam = null; hurt = { A: 0, B: 0 };
    if (mode !== 'battle') {}   // ちけい: てんじょうに つかえて 描く画面へ
    else if (q.has('result') && S.over) endAt = -1e9;
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
    const keep = {}; for (const k of ['devkey', 'backuptest', 'gachatest', 'eventtest', 'navtest', 'nakamatest', 'kamitest', 'arenatest', 'uratest', 'minnatest']) { const v = lsGet(k); if (v != null) keep[k] = v; }   // オーナーの 印は この 端末の ものを のこす
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
if (OWNER && /[?&]langtest(=|&|$)/.test(location.search)) lsSet('langtest', '1');
$('langbtn').hidden = false;
$('langbtn').textContent = window.LANG === 'en' ? '🌐 日本語' : '🌐 English';
onTap($('langbtn'), () => { const to = window.LANG === 'en' ? 'ja' : 'en'; TR('lang', { to }); window.setLang(to); });
