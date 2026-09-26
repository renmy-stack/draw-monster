// かいて！モンスターバトル — ロボの組み立てとバトルの物理（DOM 非依存。Node でも動く）
// 土台はドローカーの物理（描いた点の剛体 ＋ 関節で回る形 ＋ 衝突の撃力）。決定的: 1/240 秒の固定ステップ、乱数なし、Math.sin/cos は使わない
'use strict';
(function (root) {

const SIM_VERSION = 11;          // 物理・数値を変えたら上げる
const HZ = 240, DT = 1 / HZ;
const G = 1400;                 // 重力
const T = 3.5;                  // 線の太さ（半径）
const E = 0.1;                  // 反発
const MU = 0.9;                 // 摩擦
const HW = 380;                 // 箱の半幅（かべ）
const HP = 100;
const TIME = 30;
// 描ける大きさ（パッド座標 = ワールド座標。ロボの足もとが y=0 あたり）
const PAD = { x0: -110, x1: 110, y0: -230, y1: 20 };
const INK = { body: 520, arm: 150, leg: 130 };   // それぞれの線の長さの上限
const MB = 2, ML = 1;           // 体の点・手足の点の重さ
// 足（回って歩く）
const POWER = 1.6, WLEG = 7;
const REACT_LEG = 0.15, REACT_ARM = 0.2;   // モーターの反動を体に返す割合（大きいと すぐ転ぶ）
// 腕（前後にパンチ）
const ARM_AMP = 1.15;           // 振れ幅（rad、狙う向きから ±）
const AIM_MAX = 1.4;            // 相手を狙って 腕の向きを変えられる量（描いた向きから ±rad）
const ARM_W0 = 16;              // 基準の腕（慣性 ARM_I0）の振りの速さの上限（rad/s）
const ARM_I0 = 60000;
const ARM_P = 0.5;              // 慣性が大きいと どれだけ遅くなるか
// 立っていようとする力（転んだら効かない）
const KR = 90, DR = 12, FALL_A = 1.25, DOWN_T = 1.0;
// ダメージ
const VTH = 120;                // これより遅い当たりは ノーダメージ
const DMG_DIV = 26;
const HIT_CD = 0.25;
// 体の大きさの損得: 大きいほど HP が多い（タフ）、重いほど パンチが重い（体重がのる）。基準は 60×70 の四角（ハコロボ）
const AREA_REF = 4200, HP_MIN = 35, HP_MAX = 170, HP_P = 0.5;
const M_REF = 120, WEIGHT_P = 0.5, WEIGHT_MIN = 0.4, WEIGHT_MAX = 1.5;
const TURN_GAP = 35;             // 相手が 背中側に これ以上 回ったら 振り向く
const TURN_CD = 0.7;             // 振り向いたあと しばらくは 振り向かない
const KNOCK_SPIN = 1.0;         // 殴られたときの のけぞり

// 調整用のつまみ（tune.js が書きかえて探す）
const K = {
  armP: ARM_P, armW0: ARM_W0, armCap: 30, reactArm: 0.2,
  kb: 10, kbUp: 12, kbMass: 0.7,       // ふっとばし。kbMass > 0 なら 重い相手ほど ふっとびにくい（(M_REF/m)^kbMass）
  hpP: 0.8, hpMax: 250, spin: 1.4,
  perBase: 0.3, perLen: 0.007,     // 腕を 1 往復ふる時間 = perBase + 腕の長さ × perLen（秒）
  dmg: 9,                            // 1 発のダメージ（体重・腕の重さ・時間で増える）
  lenRef: 60, lenP: 1.5,             // 長い腕ほど 1 発が軽い: × (lenRef / 腕の長さ)^lenP（0.4〜1.8）
};
const PI = 3.141592653589793, TWO_PI = PI * 2, HALF_PI = PI / 2;
function wrapAngle(x) { if (x > PI || x < -PI) x -= TWO_PI * Math.floor((x + PI) / TWO_PI); return x; }
function dsin(x) {
  x = wrapAngle(x);
  if (x > HALF_PI) x = PI - x; else if (x < -HALF_PI) x = -PI - x;
  const x2 = x * x;
  return x * (1 + x2 * (-1 / 6 + x2 * (1 / 120 + x2 * (-1 / 5040 + x2 * (1 / 362880 + x2 * (-1 / 39916800 + x2 * (1 / 6227020800)))))));
}
function dcos(x) { return dsin(x + HALF_PI); }
function len2(x, y) { return Math.sqrt(x * x + y * y); }
// 決定的な atan2（多項式。Math.atan2 はブラウザで結果がずれることがあるので使わない）
function datan2(y, x) {
  const ax = Math.abs(x), ay = Math.abs(y);
  if (ax < 1e-12 && ay < 1e-12) return 0;
  const a = Math.min(ax, ay) / Math.max(ax, ay), s = a * a;
  let r = ((-0.0464964749 * s + 0.15931422) * s - 0.327622764) * s * a + a;
  if (ay > ax) r = HALF_PI - r;
  if (x < 0) r = PI - r;
  return y < 0 ? -r : r;
}

// ---------- 線の下ごしらえ ----------
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
// 描いた点を 5 ずつに間引き、パッドの範囲とインクの上限で切る（整数）
function cleanStroke(raw, inkMax) {
  const out = []; let ink = 0;
  for (const p of raw) {
    const x = Math.round(clamp(p[0], PAD.x0, PAD.x1)), y = Math.round(clamp(p[1], PAD.y0, PAD.y1));
    if (out.length) {
      const q = out[out.length - 1], d = len2(x - q[0], y - q[1]);
      if (d < 5) continue;
      if (ink + d > inkMax) break;
      ink += d;
    }
    out.push([x, y]);
  }
  return out;
}
function inkOf(pts) { let s = 0; for (let i = 1; i < pts.length; i++) s += len2(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; }
function sample(pts, spacing, closed) {
  const src = closed ? pts.concat([pts[0]]) : pts;
  const out = [[src[0][0], src[0][1]]];
  let carry = 0;
  for (let i = 1; i < src.length; i++) {
    const a = src[i - 1], b = src[i], d = len2(b[0] - a[0], b[1] - a[1]);
    if (d === 0) continue;
    let t = spacing - carry;
    while (t <= d) { out.push([a[0] + (b[0] - a[0]) * t / d, a[1] + (b[1] - a[1]) * t / d]); t += spacing; }
    carry = d - (t - spacing);
  }
  if (!closed && (out[out.length - 1][0] !== src[src.length - 1][0] || out[out.length - 1][1] !== src[src.length - 1][1])) out.push(src[src.length - 1].slice());
  return out;
}
// 肩（体の上半分でいちばん前）と 腰（いちばん下。同じ高さなら まんなか寄り）
function joints(body) {
  let y0 = Infinity, y1 = -Infinity, cx = 0;
  for (const p of body) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); cx += p[0]; }
  cx /= body.length;
  const mid = (y0 + y1) / 2, poly = sample(body, 3, true);
  let sh = null, hip = null;
  for (const p of poly) {
    if (p[1] <= mid && (!sh || p[0] > sh[0])) sh = p;
    if (!hip || p[1] > hip[1] + 0.5 || (Math.abs(p[1] - hip[1]) <= 0.5 && Math.abs(p[0] - cx) < Math.abs(hip[0] - cx))) hip = p;
  }
  return { shoulder: [Math.round(sh[0]), Math.round(sh[1])], hip: [Math.round(hip[0]), Math.round(hip[1])] };
}
// 手足の線を関節につなぐ（描き始めを関節に合わせて平行移動）
function attach(pts, j) { if (!pts || !pts.length) return []; const dx = j[0] - pts[0][0], dy = j[1] - pts[0][1]; return pts.map(p => [p[0] + dx, p[1] + dy]); }
function design(body, arm, leg) {
  const j = joints(body);
  return { body, arm: attach(arm, j.shoulder), leg: attach(leg, j.hip), shoulder: j.shoulder, hip: j.hip };
}
function validDesign(d) { return d && d.body.length >= 3 && inkOf(d.body) >= 80 && d.arm.length >= 2 && inkOf(d.arm) >= 20 && d.leg.length >= 2 && inkOf(d.leg) >= 20; }

// ---------- ロボ ----------
// facing: +1 右向き / -1 左向き（絵を左右反転）
function makeRobot(d, facing, x0) {
  const f = p => [p[0] * facing, p[1]];
  const bodyS = sample(d.body.map(f), 7, true);
  const sh = f(d.shoulder), hp = f(d.hip);
  const armS = sample(d.arm.map(f), 6, false).map(p => [p[0] - sh[0], p[1] - sh[1]]);
  const legS = sample(d.leg.map(f), 6, false).map(p => [p[0] - hp[0], p[1] - hp[1]]);
  const leg2 = legS.map(p => [-p[0], -p[1]]);   // 反対向きの もう 1 本
  let m = 0, sx = 0, sy = 0;
  for (const p of bodyS) { m += MB; sx += MB * p[0]; sy += MB * p[1]; }
  const J = [
    { kind: 'arm', o: sh, pts: armS },
    { kind: 'leg', o: hp, pts: legS.concat(leg2.slice(1)) },
  ];
  for (const j of J) { j.mw = ML * j.pts.length; m += j.mw; sx += j.mw * j.o[0]; sy += j.mw * j.o[1]; }
  const cx = sx / m, cy = sy / m;
  const bodyPts = bodyS.map(p => ({ x: p[0] - cx, y: p[1] - cy }));
  let Ib = 0;
  for (const p of bodyPts) Ib += MB * (p.x * p.x + p.y * p.y);
  const joints = J.map(j => {
    let I = 0, rad = 0;
    const pts = j.pts.map(p => ({ x: p[0], y: p[1] }));
    for (const p of pts) { I += ML * (p.x * p.x + p.y * p.y); rad = Math.max(rad, len2(p.x, p.y)); }
    I += ML * pts.length * T * T / 2;
    const ox = j.o[0] - cx, oy = j.o[1] - cy;
    Ib += j.mw * (ox * ox + oy * oy);
    return { kind: j.kind, ox, oy, pts, I, invI: 1 / Math.max(I, 1), rad: rad + T, a: 0, w: 0, mw: j.mw };
  });
  // 体の広さ（ふちの点で面積）
  let area = 0;
  for (let i = 0; i < bodyS.length; i++) { const a = bodyS[i], c = bodyS[(i + 1) % bodyS.length]; area += a[0] * c[1] - c[0] * a[1]; }
  area = Math.abs(area) / 2;
  const maxHp = Math.round(clamp(HP * Math.pow(area / AREA_REF, K.hpP), HP_MIN, K.hpMax));
  const weight = clamp(Math.pow(m / M_REF, WEIGHT_P), WEIGHT_MIN, WEIGHT_MAX);
  const arm = joints[0];
  let armLen = 0; for (const p of arm.pts) armLen = Math.max(armLen, len2(p.x, p.y));
  arm.len = armLen;
  arm.per = K.perBase + armLen * K.perLen;          // 長い腕ほど 大振り（1 往復が長い）
  arm.wmax = 4 * ARM_AMP / arm.per * 1.6;
  arm.power = 0.7 + 0.3 * Math.sqrt(Math.min(arm.mw, 30) / 15);   // 重い腕ほど 1 発が重い（ある程度まで）
  const b = {
    facing, bodyPts, joints, arm, leg: joints[1], m, invM: 1 / m, Ib, invIb: 1 / Ib,
    x: x0, y: 0, vx: 0, vy: 0, th: 0, om: 0,
    hp: maxHp, maxHp, area, weight, cd: 0, downT: 0, downs: 0, dealt: 0, hits: 0, poly: [], t: 0, turnCd: 0, turns: 0,
  };
  // 足もとを地面に
  let low = -Infinity;
  const co = 1, si = 0;
  for (const p of bodyPts) low = Math.max(low, p.y);
  for (const j of joints) for (const p of j.pts) low = Math.max(low, j.oy + p.y);
  b.y = -low - T - 0.5;
  return b;
}
function world(b, lx, ly) { const co = dcos(b.th), si = dsin(b.th); return [b.x + lx * co - ly * si, b.y + lx * si + ly * co]; }

// ---------- 衝突 ----------
// 点の速さ（体の点 j=null / 関節 j の点）。h = 重心から体側のレバー、r = ハブから点
function lever(b, j, px, py) {
  let hx, hy;
  if (j) { const h = world(b, j.ox, j.oy); hx = h[0] - b.x; hy = h[1] - b.y; } else { hx = px - b.x; hy = py - b.y; }
  const rx = j ? px - (b.x + hx) : 0, ry = j ? py - (b.y + hy) : 0;
  return { hx, hy, rx, ry };
}
function pvel(b, j, L) { const w = j ? j.w : 0; return [b.vx - b.om * L.hy - w * L.ry, b.vy + b.om * L.hx + w * L.rx]; }
function kEff(b, j, L, nx, ny) { const bn = L.hx * ny - L.hy * nx, rn = L.rx * ny - L.ry * nx; return b.invM + bn * bn * b.invIb + (j ? rn * rn * j.invI : 0); }
function push(b, j, L, ix, iy) {
  b.vx += ix * b.invM; b.vy += iy * b.invM;
  b.om += (L.hx * iy - L.hy * ix) * b.invIb;
  if (j) j.w += (L.rx * iy - L.ry * ix) * j.invI;
}
// A の点（jA）と B（jB、B が null なら動かない物）の接触。n は A を押す向き。戻り値 = ぶつかった速さ
function contact2(A, jA, B, jB, px, py, qx, qy, nx, ny, pen) {
  const LA = lever(A, jA, px, py), LB = B ? lever(B, jB, qx, qy) : null;
  const va = pvel(A, jA, LA), vb = B ? pvel(B, jB, LB) : [0, 0];
  let vx = va[0] - vb[0], vy = va[1] - vb[1];
  const vn = vx * nx + vy * ny;
  let hitSpeed = 0;
  if (vn < 0) {
    hitSpeed = -vn;
    const kn = kEff(A, jA, LA, nx, ny) + (B ? kEff(B, jB, LB, nx, ny) : 0);
    const jn = -(1 + E) * vn / kn;
    push(A, jA, LA, jn * nx, jn * ny); if (B) push(B, jB, LB, -jn * nx, -jn * ny);
    // 摩擦
    const va2 = pvel(A, jA, LA), vb2 = B ? pvel(B, jB, LB) : [0, 0];
    const tx = -ny, ty = nx, vt = (va2[0] - vb2[0]) * tx + (va2[1] - vb2[1]) * ty;
    const kt = kEff(A, jA, LA, tx, ty) + (B ? kEff(B, jB, LB, tx, ty) : 0);
    const lim = MU * jn, jt = clamp(-vt / kt, -lim, lim);
    push(A, jA, LA, jt * tx, jt * ty); if (B) push(B, jB, LB, -jt * tx, -jt * ty);
  }
  const corr = Math.min(pen, 6) * 0.4;
  if (B) { const wA = A.invM / (A.invM + B.invM); A.x += nx * corr * wA; A.y += ny * corr * wA; B.x -= nx * corr * (1 - wA); B.y -= ny * corr * (1 - wA); }
  else { A.x += nx * corr; A.y += ny * corr; }
  return hitSpeed;
}
function ground(b, j, px, py) {
  if (py + T > 0) contact2(b, j, null, null, px, py, 0, 0, 0, -1, py + T);
  if (px - T < -HW) contact2(b, j, null, null, px, py, 0, 0, 1, 0, -HW - (px - T));
  if (px + T > HW) contact2(b, j, null, null, px, py, 0, 0, -1, 0, px + T - HW);
}
function closestOnPoly(P, px, py) {
  let best = null;
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
    let t = L > 0 ? ((px - a[0]) * dx + (py - a[1]) * dy) / L : 0; t = clamp(t, 0, 1);
    const qx = a[0] + dx * t, qy = a[1] + dy * t, d = len2(px - qx, py - qy);
    if (!best || d < best.d) best = { d, x: qx, y: qy };
  }
  return best;
}
function inside(P, px, py) {
  let c = false;
  for (let i = 0, k = P.length - 1; i < P.length; k = i++) {
    const a = P[i], b = P[k];
    if ((a[1] > py) !== (b[1] > py) && px < (b[0] - a[0]) * (py - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}
// X の点が Y の体にぶつかったか
function versus(S, X, Y, j, px, py) {
  if (px < Y.bx0 - T || px > Y.bx1 + T || py < Y.by0 - T || py > Y.by1 + T) return;
  const inn = inside(Y.poly, px, py), cp = closestOnPoly(Y.poly, px, py);
  const pen = inn ? cp.d + T : T - cp.d;
  if (pen <= 0) return;
  let nx, ny;
  if (cp.d < 1e-6) { nx = X.x < Y.x ? -1 : 1; ny = 0; }
  else if (inn) { nx = (cp.x - px) / cp.d; ny = (cp.y - py) / cp.d; }
  else { nx = (px - cp.x) / cp.d; ny = (py - cp.y) / cp.d; }
  let sp;
  if (j && j.kind === 'arm') {
    // 腕は 相手の体を すり抜ける（壁にならない）。当たった速さだけ はかって、ダメージと ふっとばしは下で
    const LA = lever(X, j, px, py), LB = lever(Y, null, cp.x, cp.y), va = pvel(X, j, LA), vb = pvel(Y, null, LB);
    sp = -((va[0] - vb[0]) * nx + (va[1] - vb[1]) * ny);
  } else sp = contact2(X, j, Y, null, px, py, cp.x, cp.y, nx, ny, pen);
  // 腕が当たった → ダメージ
  if (j && j.kind === 'arm' && sp > VTH && X.cd <= 0) {
    const lenF = clamp(Math.pow(K.lenRef / Math.max(X.arm.len, 10), K.lenP), 0.4, 1.8);   // 長い腕は かすめるだけ、短い腕は ズドン
    const dmg = Math.round(K.dmg * X.arm.power * X.weight * lenF * (1 + S.t / 20) * 10) / 10;   // 1 発の重さは 体重と腕の重さ（腕の長さ・速さでは増えない）
    if (dmg > 0) {
      Y.hp = Math.max(0, Math.round((Y.hp - dmg) * 10) / 10);
      X.dealt += dmg; X.hits++; X.cd = HIT_CD;
      const km = K.kbMass > 0 ? Math.pow(M_REF / Y.m, K.kbMass) : 1;   // 重い相手ほど ふっとびにくい
      Y.vx -= nx * dmg * K.kb * km; Y.vy -= (ny * dmg * 10 + dmg * K.kbUp) * km;   // ふっとばし（少し浮かせる）
      Y.om += (X.x < Y.x ? 1 : -1) * dmg * KNOCK_SPIN * K.spin * km;              // 殴られた向きに のけぞる（強いと転ぶ）
      S.fx.push({ t: 'hit', x: cp.x, y: cp.y, dmg, who: X === S.A ? 'A' : 'B' });
    }
  }
}

// ---------- バトル ----------
function create(dA, dB) {
  return { t: 0, A: makeRobot(dA, 1, -150), B: makeRobot(dB, -1, 150), fx: [], over: false, winner: null, reason: '' };
}
// 振り向く: 重心を通る たての線で 左右反転（位置・速さは そのまま。見た目も物理も つながる）
function turnAround(b) {
  b.facing = -b.facing;
  for (const p of b.bodyPts) p.x = -p.x;
  for (const j of b.joints) { j.ox = -j.ox; for (const p of j.pts) p.x = -p.x; j.a = -j.a; j.w = -j.w; }
  b.th = -b.th; b.om = -b.om;
  b.turnCd = TURN_CD; b.turns++;
}
function motors(S, b, o) {
  // 相手が背中側に回ったら 振り向く（転んでいる間は しない）
  if (b.turnCd > 0) b.turnCd -= DT;
  else if (b.downT <= 0 && (o.x - b.x) * b.facing < -TURN_GAP) { turnAround(b); S.fx.push({ t: 'turn', who: b === S.A ? 'A' : 'B', x: b.x, y: b.y }); }
  // 足: 相手のほうへ回って歩く（転んでいる間は止まる）
  const lg = b.leg, dir = o.x > b.x ? 1 : -1;
  if (b.downT <= 0 && dir * (lg.w - b.om) < WLEG) {
    const dw = dir * POWER * G * b.m * lg.rad * lg.invI * DT;
    lg.w += dw; b.om -= REACT_LEG * dw * lg.I * b.invIb;
  }
  // 腕: 相手の体を狙う向きを中心に ±ARM_AMP を 行ったり来たり（重い腕ほど遅い）
  const am = b.arm, rel = am.a - b.th;
  const per = am.per;
  const tip = am.pts[am.pts.length - 1], sh = world(b, am.ox, am.oy);
  const aim = clamp(wrapAngle(datan2(o.y - sh[1], o.x - sh[0]) - datan2(tip.y, tip.x) - b.th), -AIM_MAX, AIM_MAX);
  const target = aim + b.facing * ARM_AMP * dsin(TWO_PI * S.t / per);
  const want = b.om + clamp((target - rel) * 14, -am.wmax, am.wmax);
  const dw = clamp(want - am.w, -am.wmax * 12 * DT, am.wmax * 12 * DT);
  am.w += dw; b.om -= K.reactArm * dw * am.I * b.invIb;
  // 立っていようとする（転んだら効かない）
  if (Math.abs(b.th) < FALL_A) b.om += (-KR * b.th - DR * b.om) * DT;
}
function integrate(b) {
  b.vy += G * DT;
  b.vx *= 1 - 0.2 * DT;
  b.x += b.vx * DT; b.y += b.vy * DT;
  b.th += b.om * DT; b.om *= 1 - 0.5 * DT;
  for (const j of b.joints) { j.a += j.w * DT; }
  if (b.cd > 0) b.cd -= DT;
}
function shape(b) {
  const co = dcos(b.th), si = dsin(b.th);
  b.poly.length = 0; b.bx0 = b.by0 = Infinity; b.bx1 = b.by1 = -Infinity;
  for (const p of b.bodyPts) {
    const x = b.x + p.x * co - p.y * si, y = b.y + p.x * si + p.y * co;
    b.poly.push([x, y]);
    if (x < b.bx0) b.bx0 = x; if (x > b.bx1) b.bx1 = x; if (y < b.by0) b.by0 = y; if (y > b.by1) b.by1 = y;
  }
}
// 体・手足の点を 1 つずつ（fn(j, x, y)）
function eachPoint(b, fn) {
  const co = dcos(b.th), si = dsin(b.th);
  for (const p of b.bodyPts) fn(null, b.x + p.x * co - p.y * si, b.y + p.x * si + p.y * co);
  for (const j of b.joints) {
    const hx = b.x + j.ox * co - j.oy * si, hy = b.y + j.ox * si + j.oy * co, cj = dcos(j.a), sj = dsin(j.a);
    for (const p of j.pts) fn(j, hx + p.x * cj - p.y * sj, hy + p.x * sj + p.y * cj);
  }
}
function step(S) {
  if (S.over) return;
  const A = S.A, B = S.B;
  motors(S, A, B); motors(S, B, A);
  integrate(A); integrate(B);
  eachPoint(A, (j, x, y) => ground(A, j, x, y));
  eachPoint(B, (j, x, y) => ground(B, j, x, y));
  shape(A); shape(B);
  eachPoint(A, (j, x, y) => versus(S, A, B, j, x, y));
  shape(A); shape(B);
  eachPoint(B, (j, x, y) => versus(S, B, A, j, x, y));
  // 転んだら しばらくして 起き上がる
  for (const b of [A, B]) {
    if (Math.abs(wrapAngle(b.th)) > FALL_A) {
      b.downT += DT;
      if (b.downT > DOWN_T) {
        b.th = wrapAngle(b.th); b.om = -b.th * 5; b.vy = -520; b.downT = 0; b.downs++;
        S.fx.push({ t: 'getup', who: b === A ? 'A' : 'B', x: b.x, y: b.y });
      } else if (b.downT === DT) S.fx.push({ t: 'down', who: b === A ? 'A' : 'B', x: b.x, y: b.y });
    } else b.downT = 0;
  }
  S.t += DT;
  if (A.hp <= 0 || B.hp <= 0) { S.over = true; S.reason = 'ko'; S.winner = A.hp <= 0 && B.hp <= 0 ? null : A.hp > 0 ? 'A' : 'B'; }
  else if (S.t >= TIME - 1e-9) { S.over = true; S.reason = 'time'; S.winner = A.hp > B.hp ? 'A' : B.hp > A.hp ? 'B' : null; }   // 時間切れは のこり HP の数字が多いほう（画面の数字どおり）
  if (S.over) S.fx.push({ t: 'end' });
}
// 描く画面に出す つよさ（タフさ = HP、パンチ = 1 発の重さ、リーチ = 腕の長さ、はやさ = 1 秒に振る回数）
function robotStats(d) {
  const b = makeRobot(d, 1, 0), am = b.arm;
  const lenF = clamp(Math.pow(K.lenRef / Math.max(am.len, 10), K.lenP), 0.4, 1.8);
  return { hp: b.maxHp, punch: K.dmg * am.power * b.weight * lenF, reach: am.len, speed: 2 / am.per };
}
function fight(dA, dB) { const S = create(dA, dB); while (!S.over) { step(S); S.fx.length = 0; } return S; }

// ---------- URL: 3 本の線を 2 バイトずつ ----------
// からだは そのままの位置（x +128、y +235）。うで・あしは 描き始めからの ずれ（+128）。関節にくっつけるので位置はいらない
function encodeDesign(d) {
  let s = '';
  for (const k of ['body', 'arm', 'leg']) {
    const p = d[k], o = k === 'body' ? [-128, -235] : [p[0][0] - 128, p[0][1] - 128];
    s += String.fromCharCode(p.length);
    for (const [x, y] of p) s += String.fromCharCode(clamp(x - o[0], 0, 255), clamp(y - o[1], 0, 255));
  }
  if (d.crown) s += String.fromCharCode(1);   // 王冠（うら 5 人抜きした モンスター。見た目だけ）
  const b = typeof btoa === 'function' ? btoa(s) : Buffer.from(s, 'binary').toString('base64');
  return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function cleanLimb(raw, inkMax) {
  const out = []; let ink = 0;
  for (const p of raw) {
    if (out.length) { const q = out[out.length - 1], dd = len2(p[0] - q[0], p[1] - q[1]); if (dd < 5) continue; if (ink + dd > inkMax) break; ink += dd; }
    out.push([p[0], p[1]]);
  }
  return out;
}
function decodeDesign(str) {
  try {
    const b = str.replace(/-/g, '+').replace(/_/g, '/');
    const s = typeof atob === 'function' ? atob(b) : Buffer.from(b, 'base64').toString('binary');
    let i = 0; const out = {};
    for (const k of ['body', 'arm', 'leg']) {
      const n = s.charCodeAt(i++), a = [], o = k === 'body' ? [-128, -235] : [-128, -128];
      for (let q = 0; q < n; q++) { a.push([s.charCodeAt(i) + o[0], s.charCodeAt(i + 1) + o[1]]); i += 2; }
      out[k] = k === 'body' ? cleanStroke(a, INK.body) : cleanLimb(a, INK[k] + 1);
    }
    const d = design(out.body, out.arm, out.leg);
    if (i < s.length && s.charCodeAt(i) === 1) d.crown = true;
    return validDesign(d) ? d : null;
  } catch (e) { return null; }
}

// ---------- CPU ロボ ----------
function rect(x0, y0, x1, y1) { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; }
function ln(x0, y0, x1, y1, n) { const a = []; for (let i = 0; i <= n; i++) a.push([Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n)]); return a; }
// 勝ち抜きの順。人が描きそうなランダムなロボ（clear_rate.js）で 5 人抜き 約 10% になるよう、勝ち上がってきたロボの 90% / 80% / 65% / 50% / 40% が勝つ強さに合わせた（tune_cpu.js）
const CPU_RAW = [
  { name: "ヒョロリ", color: '#5e35b1', body: [[-30,-255],[30,-255],[30,-90],[-30,-90]], arm: [[0,0],[16,8],[32,16],[48,24],[64,32],[80,40],[96,48]], leg: [[0,0],[0,13],[0,27],[0,40],[0,53],[0,67],[0,80]] },
  { name: "ドッシン", color: '#6d4c41', body: [[-55,-170],[55,-170],[55,-70],[-55,-70]], arm: [[0,0],[13,5],[26,10],[39,16],[52,21],[65,26]], leg: [[0,0],[3,17],[6,34],[8,50],[11,67],[14,84]] },
  { name: "カクカク", color: '#8d6e63', body: [[-24,-136],[24,-136],[24,-80],[-24,-80]], arm: [[0,0],[16,3],[32,6],[48,10],[64,13],[80,16]], leg: [[0,0],[0,12],[0,24],[0,36],[0,48],[0,60]] },
  { name: "チョロ", color: '#00897b', body: [[-31,-100],[31,-100],[31,-50],[-31,-50]], arm: [[0,0],[10,-2],[20,-5],[30,-7],[40,-10]], leg: [[0,0],[0,11],[0,23],[0,34],[0,45]] },
  { name: "ゴツン", color: '#c62828', body: [[-30,-150],[30,-150],[30,-80],[-30,-80]], arm: [[0,0],[8,0],[16,0],[24,0],[32,0],[40,0],[48,0],[48,-15],[63,-15],[63,15],[48,15],[48,0]], leg: [[0,0],[0,7],[0,14],[0,22],[0,29],[0,36]] },
];
const CPU = CPU_RAW.map(c => Object.assign({ name: c.name, color: c.color }, design(c.body, c.arm, c.leg)));
// うら 5 人抜き（evolve.js で探した強いモンスター。おもてを クリアすると 出る）
// うら 5 人抜き: いたちごっこ（coevo.js）と 最強の部隊（squad.js）で選んだ 5 体（部隊 v5）。敵もプレイヤーと同じルール（形だけ）。
// 攻略者の進化（challenge.js）で 5 人抜きの形を見つけるまで 5〜18 世代（6 通りとも見つかる = 勝ち目はある）。オーナーの 2 体は 1〜2 人目で止まる
// 並びは 単独の勝率（ura_chars.js）が 下がる順＝後ろほど強い。名前も 後ろほど強そうに
const URA_RAW = [
  { name: "カゲ", color: '#455a64', body: [[21,-127],[21,-102],[21,-66],[9,-66],[0,-66],[-9,-66],[-21,-66],[-21,-102],[-21,-127],[-21,-152],[-21,-187],[-9,-187],[0,-187],[9,-187],[21,-187],[21,-152]], arm: [[21,-127],[26,-116],[42,-124],[43,-106],[59,-115],[60,-97],[76,-105],[77,-87],[93,-96]], leg: [[1,-66],[7,-61],[14,-59],[21,-59]] },   // ノッポ型
  { name: "ヤミ", color: '#4a148c', body: [[64,-150],[64,-125],[64,-89],[26,-89],[0,-89],[-26,-89],[-64,-89],[-64,-125],[-64,-150],[-64,-175],[-64,-211],[-26,-211],[0,-211],[26,-211],[64,-211],[64,-175]], arm: [[64,-150],[64,-137],[82,-138],[76,-120],[95,-121],[88,-103],[107,-104],[100,-86],[110,-87]], leg: [[-1,-89],[0,-82],[0,-75],[-1,-68]] },   // 巨体型
  { name: "ドクロ", color: '#3e2723', body: [[87,-82],[81,-71],[62,-62],[33,-56],[0,-54],[-33,-56],[-62,-62],[-81,-71],[-87,-82],[-81,-92],[-62,-101],[-33,-107],[0,-109],[33,-107],[62,-101],[81,-92]], arm: [[87,-82],[95,-72],[109,-86],[110,-68],[110,-82],[110,-64],[110,-70],[110,-84],[110,-54],[110,-70]], leg: [[0,-54],[-6,-51],[-12,-54],[-15,-59],[-17,-66],[-16,-72],[-12,-77],[-7,-81],[-1,-82],[6,-81],[11,-78],[15,-73],[16,-66],[15,-60],[12,-55],[6,-51],[0,-50]] },   // 輪の足型
  { name: "オニ", color: '#b71c1c', body: [[100,-182],[92,-177],[71,-172],[38,-169],[0,-168],[-38,-169],[-71,-172],[-92,-177],[-100,-182],[-92,-187],[-71,-191],[-38,-194],[0,-195],[38,-194],[71,-191],[92,-187]], arm: [[100,-182],[110,-187],[79,-206],[110,-207],[82,-225],[110,-226]], leg: [[0,-168],[1,-163],[-2,-158],[-6,-155],[-11,-154],[-17,-154],[-21,-157],[-25,-162],[-26,-167],[-25,-172],[-22,-177],[-18,-180],[-13,-181],[-7,-181],[-3,-178],[1,-173],[2,-168]] },   // 平たい型
  { name: "ダイマオウ", color: '#111111', body: [[60,-176],[55,-167],[42,-159],[23,-153],[0,-151],[-23,-153],[-42,-159],[-55,-167],[-60,-176],[-55,-186],[-42,-194],[-23,-199],[0,-201],[23,-199],[42,-194],[55,-186]], arm: [[60,-176],[66,-161],[78,-187],[84,-172],[86,-186],[100,-184],[96,-156],[82,-158],[84,-172]], leg: [[0,-151],[1,-144],[-4,-143],[-9,-143],[-17,-148],[-19,-153],[-19,-158],[-17,-163],[-13,-166],[-8,-168],[-3,-168],[5,-162],[7,-157],[6,-152]] },   // ハンマー型
];
const URA = URA_RAW.map(c => Object.assign({ name: c.name, color: c.color }, design(c.body, c.arm, c.leg)));
// みんなの さいきょう ぐんだん: うらを クリアした プレイヤーの 形 133 種類から えらんだ 5 たい（2026-09-27、総当たり＋組み合わせ探索の B 案）
const MINNA_RAW = [
  { name: "ギザマル", color: '#00897b', body: [[1,-71],[-5,-76],[-16,-82],[-23,-84],[-31,-85],[-41,-85],[-51,-84],[-66,-81],[-77,-76],[-86,-67],[-91,-61],[-98,-50],[-102,-39],[-103,-29],[-102,-22],[-97,-15],[-90,-10],[-85,-8],[-73,-6],[-59,-6],[-45,-7],[-32,-10],[-17,-13],[-11,-14],[2,-16],[15,-18],[25,-19],[34,-22],[42,-27],[50,-34],[53,-39],[54,-45],[52,-55],[50,-62],[43,-74],[38,-79],[31,-84],[22,-86],[10,-87],[3,-88],[-14,-88],[-27,-88],[-40,-89],[-51,-88],[-57,-85]], arm: [[53,-48],[59,-57],[60,-63],[60,-51],[61,-43],[63,-49],[68,-57],[72,-52],[73,-46],[73,-39],[75,-45],[77,-51],[82,-50],[83,-45],[84,-37],[90,-55],[92,-62],[96,-56]], leg: [[-43,-7],[-38,-7],[-33,-3],[-30,1],[-27,5],[-24,9],[-21,13],[-19,18],[-15,21],[-10,23],[-1,19],[5,15],[13,9],[24,-2],[33,-10],[37,-14],[44,-21],[50,-26]] },
  { name: "オオヤマ", color: '#6d4c41', body: [[96,-102],[95,-109],[95,-114],[95,-124],[93,-132],[91,-140],[89,-149],[86,-156],[82,-164],[77,-170],[71,-176],[64,-179],[58,-181],[51,-182],[44,-182],[37,-183],[30,-183],[23,-183],[16,-183],[10,-183],[2,-182],[-5,-179],[-12,-177],[-19,-175],[-26,-173],[-32,-170],[-39,-168],[-45,-165],[-51,-162],[-57,-159],[-63,-156],[-68,-152],[-73,-148],[-76,-143],[-80,-138],[-84,-132],[-87,-127],[-90,-123],[-92,-118],[-94,-112],[-96,-107],[-97,-102],[-98,-97],[-98,-91],[-99,-82],[-99,-74],[-99,-69],[-99,-60],[-99,-51],[-98,-43],[-96,-35],[-94,-28],[-92,-23],[-90,-28],[-88,-33],[-85,-40],[-80,-49],[-75,-59],[-72,-64],[-68,-69],[-65,-74],[-62,-80],[-57,-85],[-53,-90],[-48,-95],[-43,-100],[-38,-105],[-33,-109],[-27,-112],[-21,-114],[-15,-115],[-10,-116]], arm: [[96,-105],[92,-99],[92,-94],[92,-84],[92,-78],[90,-73],[83,-77],[76,-81],[73,-88],[70,-96],[70,-101],[70,-109],[70,-118],[71,-123],[73,-128],[75,-133],[80,-136],[86,-136],[90,-131],[91,-125],[92,-117],[92,-108]], leg: [[-92,-23],[-83,-23],[-78,-23],[-71,-23],[-64,-23],[-59,-23],[-51,-24],[-42,-26],[-34,-27],[-29,-27],[-21,-27],[-13,-28],[-8,-28],[0,-28],[5,-28],[13,-27],[21,-26],[29,-23],[35,-20]] },
  { name: "ワニガメ", color: '#2e7d32', body: [[-66,-10],[-85,-18],[-93,-19],[-100,-22],[-105,-26],[-108,-32],[-108,-39],[-108,-44],[-103,-48],[-96,-51],[-91,-52],[-83,-54],[-78,-56],[-70,-58],[-62,-61],[-57,-63],[-51,-65],[-45,-66],[-40,-68],[-35,-69],[-27,-71],[-22,-71],[-17,-71],[-11,-71],[-6,-71],[1,-71],[8,-70],[16,-68],[24,-66],[31,-64],[39,-63],[44,-61],[50,-59],[56,-58],[61,-54],[65,-49],[67,-42],[69,-34],[69,-25],[69,-18],[69,-13],[66,-9],[60,-6],[54,-5],[47,-4],[38,-3],[28,-2],[16,-1],[4,0],[-7,0],[-20,0],[-32,0],[-45,0],[-58,0],[-70,0],[-82,0],[-92,0],[-100,-1],[-105,-2],[-106,-7],[-103,-11],[-96,-14]], arm: [[68,-36],[68,-23],[75,-17],[83,-14],[93,-12],[103,-12],[114,-12],[116,-17],[116,-25],[116,-32],[116,-38],[116,-44],[116,-49]], leg: [[-24,0],[-43,-4],[-43,1],[-43,9],[-36,15],[-31,17],[-25,18],[-18,19],[-11,19],[-5,19],[1,19],[9,17],[12,12],[12,6],[7,2],[2,0],[-5,-1],[-11,-2]] },
  { name: "ハコブネ", color: '#1565c0', body: [[-80,-15],[-82,-22],[-82,-28],[-82,-36],[-82,-42],[-81,-47],[-75,-52],[-67,-55],[-58,-57],[-50,-58],[-45,-58],[-36,-58],[-28,-58],[-20,-58],[-12,-58],[-4,-58],[1,-58],[7,-58],[14,-58],[21,-57],[27,-54],[34,-51],[39,-49],[43,-45],[47,-42],[50,-37],[52,-32],[52,-27],[52,-22],[52,-17],[49,-13],[44,-13],[36,-12],[28,-12],[18,-12],[13,-12],[7,-12],[-2,-12],[-11,-12],[-19,-12],[-27,-12],[-33,-12],[-43,-12],[-48,-12],[-56,-12],[-63,-12],[-70,-12],[-75,-13],[-80,-13]], arm: [[50,-36],[51,-31],[56,-31],[61,-30],[67,-28],[72,-27],[76,-24],[81,-21],[85,-17],[89,-14],[92,-21],[92,-28],[92,-36],[92,-44],[92,-50],[92,-55],[92,-61],[92,-54],[92,-47],[91,-40],[91,-34],[91,-27],[91,-20],[91,-14],[91,-8]], leg: [[-16,-12],[-22,-3],[-24,2],[-24,10],[-17,16],[-10,18],[-2,18],[4,18],[9,18],[12,12],[12,4],[12,-4],[6,-12],[2,-17],[-6,-20],[-11,-22],[-16,-22]] },
  { name: "カミソリ", color: '#c62828', body: [[-78,-50],[-71,-51],[-67,-48],[-62,-45],[-56,-47],[-50,-49],[-44,-51],[-37,-52],[-29,-53],[-22,-54],[-17,-54],[-10,-54],[-5,-54],[1,-54],[7,-54],[13,-54],[20,-54],[27,-54],[34,-54],[40,-54],[47,-54],[52,-54],[56,-51],[59,-47],[61,-42],[62,-34],[62,-27],[62,-22],[56,-20],[51,-20],[45,-20],[40,-19],[35,-18],[29,-17],[24,-17],[19,-16],[14,-15],[7,-15],[1,-15],[-5,-15],[-10,-15],[-16,-15],[-21,-15],[-26,-15],[-31,-15],[-40,-15],[-46,-16],[-53,-19],[-59,-23],[-65,-26],[-69,-30],[-70,-35],[-69,-40],[-64,-43],[-54,-46],[-48,-47],[-41,-47],[-35,-47],[-28,-47],[-23,-47],[-14,-47],[-8,-47],[-2,-47],[4,-47],[9,-47],[15,-47],[22,-46],[28,-44],[34,-41],[39,-39],[37,-34],[31,-32],[22,-28],[17,-25],[10,-23],[4,-21],[-4,-20],[-11,-20],[-19,-20],[-26,-20],[-33,-20],[-40,-21],[-45,-24]], arm: [[62,-35],[67,-28],[67,-23],[70,-18],[72,-13],[76,-8],[80,-3],[83,1],[88,3],[93,3],[97,0],[102,-1],[107,-6],[107,-12],[107,-17],[107,-22],[107,-27],[107,-34],[107,-42],[107,-50],[107,-55],[107,-60],[107,-65],[107,-70],[107,-76],[103,-82]], leg: [[-6,-15],[-16,-4],[-18,1],[-11,5],[-5,6],[0,6],[0,1],[0,-4],[0,-9],[-3,-15],[-9,-18]] },
];
const MINNA = MINNA_RAW.map(c => Object.assign({ name: c.name, color: c.color }, design(c.body, c.arm, c.leg)));

const API = {
  SIM_VERSION, K, HZ, DT, HW, HP, TIME, PAD, INK, T, CPU, URA, MINNA,
  cleanStroke, inkOf, design, validDesign, robotStats, joints, makeRobot, create, step, fight, world, eachPoint, shape,
  encodeDesign, decodeDesign,
};
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.RB = API;
})(this);
