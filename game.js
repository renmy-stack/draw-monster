// かいて！モンスターバトル — 描く画面（からだ・うで・あし）・バトルの描画・勝ち抜き・モンスターを送る
'use strict';
const VERSION = '19';
// ホーム画面から開いていないとき（Safari の中）は 下のバーぶん あける
if (!(window.navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches))) document.body.classList.add('browser');   // version.txt と合わせる。更新したら index.html の ?v= も上げる
const SITE_URL = 'https://renmy-stack.github.io/draw-monster/';

const $ = id => document.getElementById(id);
const cv = $('game'), ctx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
const ME = { name: 'じぶん', color: '#1e88e5' };
const FRIEND = { name: 'ともだち', color: '#2e7d32' };
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
try { if (lsGet('simv') !== String(RB.SIM_VERSION)) { localStorage.removeItem(KEY + 'stage'); localStorage.removeItem(KEY + 'ura.stage'); lsSet('simv', String(RB.SIM_VERSION)); } } catch (e) {}
// 描きかけの線（3 本）と、完成したモンスター
let strokes = { body: null, arm: null, leg: null };
let myRobot = null;
{ const w = lsGet('robot'); if (w) { const d = RB.decodeDesign(w); if (d) { myRobot = d; strokes = { body: d.body, arm: d.arm, leg: d.leg }; } } }
// 勝ち抜きは おもて と うら（おもてを クリアすると 出る）。記録は べつべつ（うらは キーの頭に 'ura.'）
// うら は まだ オーナーだけ（?uratest を いちど開いた端末だけ。友達には 出ない）
if (/[?&]uratest(=|&|$)/.test(location.search)) lsSet('uratest', '1');
let URA_TEST = lsGet('uratest') === '1';
let uraOpen = URA_TEST;   // オーナーの端末では おもてクリア前でも 出す（テスト用）
let side = uraOpen && lsGet('side') === 'ura' ? 'ura' : 'omote';
const sk = n => (side === 'ura' ? 'ura.' : '') + n;
function CPUS() { return side === 'ura' ? RB.URA : RB.CPU; }
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
function show(id) { for (const k of ['title', 'draw', 'result', 'sharebox']) $(k).hidden = k !== id; $('quit').hidden = id !== 'none'; $('fast').hidden = id !== 'none' || !canFast(); updateFastBtn(); }
// はやおくり: 一度でも倒した CPU との戦いだけ
function canFast() { return mode === 'battle' && !isFriend && !!beaten[S && S.stage != null ? S.stage : stage]; }
function updateFastBtn() { $('fast').textContent = fast ? '▶ ふつう' : '▶▶ はやおくり'; $('fast').classList.toggle('on', fast); }

let mode = 'title', part = 'body';
function showTitle() {
  mode = 'title'; show('title');
  $('friendbox').hidden = !friendRobot;
  if (friendRobot) drawPreview($('friendprev'), friendRobot, FRIEND.color);
  const ob = +(lsGet('best') || 0), ub = +(lsGet('ura.best') || 0);
  $('tprog').textContent = (ob > 0 ? 'おもて さいこう ' + ob + ' にんぬき' + (uraOpen ? '（たっせい！）' : '') : '') + (uraOpen ? '　うら さいこう ' + ub + ' にんぬき' + (lsGet('ura.cleared') === '1' ? '（たっせい！！）' : '') : '');
  $('start').textContent = myRobot ? 'モンスターを えらぶ' : 'モンスターを つくる';
  if (URA_TEST) $('tprog').textContent += '　［うら テスト中］';
  drawTitleBg();
}
function showDraw() {
  mode = 'draw'; show('draw');
  if (!strokes.body) part = 'body'; else if (!strokes.arm) part = 'arm'; else if (!strokes.leg) part = 'leg';
  $('fightfriend').hidden = !friendRobot;
  updateSideUi();
  setPart(part);
  if (stage > 0) setHint('かちぬき ちゅう：モンスターを かえると 1 たいめから');
  sizePad(); drawPad();   // 文字やボタンが決まってから 測る
}
function setPart(p) {
  part = p;
  for (const t of document.querySelectorAll('.tab')) {
    t.classList.toggle('on', t.dataset.part === p);
    t.classList.toggle('done', !!strokes[t.dataset.part]);
  }
  $('dhead').innerHTML = PART_HINT[p];
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
    drawRobotLocal(g, d, ME.color, full ? 1 : 0.9, raw && part === 'body');
    if (full) {
      const blink = 0.55 + 0.45 * Math.sin(performance.now() / 250);
      for (const [k, jp] of [['arm', d.shoulder], ['leg', d.hip]]) {
        g.fillStyle = part === k ? 'rgba(255,214,0,' + blink + ')' : 'rgba(255,214,0,.35)';
        g.beginPath(); g.arc(jp[0], jp[1], part === k ? 7 : 4, 0, 7); g.fill();
      }
    }
  } else if (raw) { g.strokeStyle = ME.color; g.lineWidth = 4; pline(g, RB.cleanStroke(raw, RB.INK.body)); g.stroke(); }
}
// モンスターをパッド座標のまま描く（まっすぐ立った姿）
function drawRobotLocal(g, d, color, alpha, open) {
  g.globalAlpha = alpha; g.lineCap = 'round'; g.lineJoin = 'round';
  // うしろの足（180° 反対）
  if (d.leg && d.leg.length > 1) { const back = d.leg.map(p => [2 * d.hip[0] - p[0], 2 * d.hip[1] - p[1]]); limb(g, back, '#37474f', 0.55); }
  body(g, d.body, color, open, d);
  if (d.leg && d.leg.length > 1) limb(g, d.leg, '#455a64', 1);
  if (d.arm && d.arm.length > 1) arm(g, d.arm, color);
  g.globalAlpha = 1;
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
function drawPreview(c, d, color) {
  const g = c.getContext('2d');
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const k of ['body', 'arm', 'leg']) for (const p of d[k]) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  const s = Math.min(c.width / (x1 - x0 + 40), c.height / (y1 - y0 + 40));
  g.setTransform(s, 0, 0, s, c.width / 2 - (x0 + x1) / 2 * s, c.height / 2 - (y0 + y1) / 2 * s);
  g.clearRect(x0 - 100, y0 - 100, x1 - x0 + 200, y1 - y0 + 200);
  drawRobotLocal(g, d, color, 1, false);
}
pad.addEventListener('pointerdown', e => { raw = [toWorld(e)]; try { pad.setPointerCapture(e.pointerId); } catch (er) {} e.preventDefault(); drawPad(); });
pad.addEventListener('pointermove', e => { if (!raw) return; raw.push(toWorld(e)); e.preventDefault(); drawPad(); });
const endStroke = () => {
  if (!raw) return;
  const pts = RB.cleanStroke(raw, RB.INK[part]); raw = null;
  const need = part === 'body' ? 80 : 20;
  if (pts.length < 2 || RB.inkOf(pts) < need) { setHint('もうすこし おおきく かいてね'); drawPad(); return; }
  strokes[part] = pts;
  if (stage > 0 || +(lsGet('stage') || 0) > 0 || +(lsGet('ura.stage') || 0) > 0) { resetAllRuns(); updateSideUi(); }
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
    if (RB.validDesign(d)) { myRobot = d; lsSet('robot', RB.encodeDesign(d)); }
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
  S = RB.create(myRobot, opp.d); S.stage = stage; S.side = friend ? 'friend' : side;
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
  const ura = S.side === 'ura';
  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, ura ? '#1a0610' : '#15173a'); sky.addColorStop(1, ura ? '#4a0f1f' : '#3a2a63');   // うらは 赤黒い
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
  for (const k of ['B', 'A']) drawRobotWorld(S[k], k === 'A' ? ME.color : opp.color, hurt[k] > 0);
  for (const k of ['A', 'B']) if (hurt[k] > 0) hurt[k]--;
  // かけら・数字
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.vx *= 0.96;
    if (--p.life <= 0 || p.y > 0) { parts.splice(i, 1); continue; }
    ctx.fillStyle = p.c; ctx.globalAlpha = Math.min(1, p.life / 15); ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
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
// モンスターを ワールドに（シミュレーションの点を そのまま使う）
function drawRobotWorld(b, color, flash) {
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
  if (S.side === 'ura' && b === S.B) { ctx.shadowColor = '#ff1744'; ctx.shadowBlur = 26; }   // うらの敵は 赤く光る
  pline(ctx, poly); ctx.closePath(); ctx.fillStyle = bodyCol; ctx.fill();
  ctx.shadowBlur = 0;
  ctx.save(); pline(ctx, poly); ctx.closePath(); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(b.x - 300, b.y - 300, 600, 300 + (-120));
  ctx.restore();
  ctx.strokeStyle = '#0d1030'; ctx.lineWidth = 4; pline(ctx, poly); ctx.closePath(); ctx.stroke();
  // 目（体の上のほう・前寄り）
  let top = null; for (const p of b.bodyPts) if (!top || p.y < top.y) top = p;
  let x0 = Infinity, x1 = -Infinity; for (const p of b.bodyPts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); }
  const w = x1 - x0, r = Math.max(3.5, Math.min(8, w * 0.1));
  const ex = (x0 + x1) / 2 + b.facing * w * 0.12, ey = top.y + Math.min(22, w * 0.3 + 8);
  face(ctx, tf, ex, ey, r, b.facing, b.downT > 0 || b.hp <= 0);
  limb(ctx, legA, '#455a64', 1);
  arm(ctx, joint(b.arm), color);
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
  bar(12, S.A.hp, S.A.maxHp, ME.name, ME.color, false);
  bar(W - 12 - bw, S.B.hp, S.B.maxHp, opp.name, S.side === 'ura' ? '#ff5252' : opp.color, true);   // うらの敵は色が暗いので バーは赤
  ctx.textAlign = 'center'; ctx.font = '900 26px sans-serif'; ctx.fillStyle = S.t > RB.TIME - 5 ? '#ff8a80' : '#fff';
  ctx.fillText(Math.max(0, Math.ceil(RB.TIME - S.t)), W / 2, top + 34);
  if (!isFriend) { ctx.font = '700 12px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText((S.side === 'ura' ? 'うら ' : '') + 'かちぬき ' + (S.stage + 1) + ' / ' + CPUS().length, W / 2, top + 54); }
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
  const win = S.winner === 'A', draw = S.winner == null;
  $('rtitle').textContent = win ? 'かち！' : draw ? 'ひきわけ' : 'まけ…';
  $('rtitle').className = 'rtitle ' + (win ? 'win' : draw ? '' : 'lose');
  $('rsub').textContent = (S.reason === 'ko' ? 'KO（' + S.t.toFixed(1) + ' びょう）' : 'じかんぎれ（のこり HP ' + Math.ceil(S.A.hp) + ' たい ' + Math.ceil(S.B.hp) + '）') + '　パンチ ' + S.A.hits + ' はつ・ダメージ ' + Math.round(S.A.dealt);
  let showNext = false, wins = stage;
  if (!isFriend) {
    if (win) {
      wins = stage + 1;
      if (!beaten[stage]) { beaten[stage] = true; lsSet(sk('beaten'), JSON.stringify(beaten)); }
      if (stage < CPUS().length - 1) { stage++; lsSet(sk('stage'), String(stage)); showNext = true; }
      else {
        cleared = true; lsSet(sk('cleared'), '1'); resetRun();
        if (side === 'ura') $('rsub').textContent += '　うら 5 たい かちぬき たっせい！！ すごすぎる！';
        else { $('rsub').textContent += '　5 たい かちぬき たっせい！'; if (!uraOpen && URA_TEST) { uraOpen = true; $('rsub').textContent += '　…うら かちぬき が あらわれた！'; } }
      }
    } else {
      resetRun();
      $('rsub').textContent += '　' + wins + ' にんぬき で おわり';
    }
    if (wins > best) { best = wins; lsSet(sk('best'), String(best)); $('rsub').textContent += '（さいこう きろく！）'; }
  }
  $('rprog').innerHTML = isFriend ? 'ともだちの モンスター と しょうぶ' : CPUS().map((c, i) => '<span class="dot ' + (i < wins ? 'ok' : i === wins && !win ? 'lost' : i === wins ? 'now' : '') + '">' + c.name + '</span>').join('');
  $('next').hidden = !showNext;
  $('again').hidden = showNext;
  $('again').textContent = isFriend ? 'もういちど' : '1 たいめから もういちど';
  $('redraw').textContent = !isFriend && stage > 0 ? 'モンスターを なおす（1 たいめから）' : 'モンスターを なおす';
}
function shareRobot() {
  if (!myRobot) return;
  const url = SITE_URL + '#r=' + RB.encodeDesign(myRobot);
  const text = 'ぼくの モンスター と たたかってみて！（かいて！モンスターバトル）\n' + url;
  if (navigator.share) navigator.share({ text }).catch(err => { if (!err || err.name !== 'AbortError') showShareBox(text); });
  else showShareBox(text);
}
function showShareBox(text) { $('sharetext').value = text; $('sharebox').hidden = false; }

// ---------- ボタン ----------
function onTap(el, fn) { el.addEventListener('click', e => { e.preventDefault(); fn(); }); }
onTap($('start'), showDraw);
// タイトルの文字を 5 回つづけてタップ → うら テストの印（ホーム画面のアプリは Safari と保存場所が別なので）
{ let n = 0, t0 = 0; $('title').querySelector('.logo').addEventListener('click', () => { const now = Date.now(); n = now - t0 < 800 ? n + 1 : 1; t0 = now; if (n >= 5) { n = 0; lsSet('uratest', '1'); URA_TEST = true; uraOpen = true; showTitle(); } }); }
onTap($('back'), showTitle);
onTap($('fight'), () => startBattle(false));
onTap($('fightfriend'), () => startBattle(true));
onTap($('send'), shareRobot);
onTap($('share'), shareRobot);
onTap($('clearpart'), () => { strokes[part] = null; resetAllRuns(); saveRobot(); setPart(part); updateSideUi(); });
onTap($('next'), () => startBattle(false));
onTap($('again'), () => startBattle(isFriend));
onTap($('redraw'), showDraw);
// おもて / うら の切りかえ（おもてを クリアしたら 出る）
function updateSideUi() {
  $('sidebtn').hidden = !uraOpen;
  $('sidebtn').textContent = side === 'ura' ? 'うら' : 'おもて';
  $('sidebtn').classList.toggle('ura', side === 'ura');
  $('fight').innerHTML = (side === 'ura' ? 'うら ' : '') + 'たたかう<small>' + (stage + 1) + ' / ' + CPUS().length + ' ' + CPUS()[stage].name + '</small>';
  $('fight').classList.toggle('ura', side === 'ura');
}
// おもて ⇄ うら（押すたびに切りかえ）
onTap($('sidebtn'), () => { side = side === 'ura' ? 'omote' : 'ura'; lsSet('side', side); loadSide(); updateSideUi(); setHint(side === 'ura' ? 'うら かちぬき：とんでもなく つよい 5 たい' : ''); });
onTap($('fast'), () => { fast = !fast; lsSet('fast', fast ? '1' : '0'); updateFastBtn(); });
// 戦いの途中で もどる（勝ち抜きの途中経過は そのまま。戦いは決定的なので やめても 得はしない）
onTap($('quit'), () => { if (mode === 'battle' || mode === 'pause') showDraw(); });
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

resize();
showTitle();
{
  // 開発用: ?draw で描く画面、?shot=秒&stage=n で その時点のバトル、&result で結果
  const q = new URLSearchParams(location.search);
  const sample = () => { const c = RB.CPU[2]; myRobot = RB.design(c.body, c.arm, c.leg); strokes = { body: myRobot.body, arm: myRobot.arm, leg: myRobot.leg }; };
  if (q.has('stage') && !q.has('shot')) stage = +q.get('stage');
  if (q.has('beaten')) beaten = [true, true, true, true, true];   // 開発用: 早送りボタンを見る
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
