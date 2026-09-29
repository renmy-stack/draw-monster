// node tools/make_event.js — きょうの イベント の お題（うで・あし・からだ 各 20 こ）を 作って event.js に 書き出す
// 形は ここで 式から 作り、event.js には 整数の 点だけ 書く（ブラウザと Node で Math.cos の 丸めが ずれても 同じ 形に なるように）
// うで・あしは 描き始め（肩・腰）が [0,0]。うでは 前（+x）へ、あしは 下（+y）へ 描く。からだは パッド座標の 閉じた 形
'use strict';
const fs = require('fs'), path = require('path');
const RB = require('../sim.js');
const { cos, sin, PI } = Math;

// ---------- 道具 ----------
const arc = (cx, cy, r, a0, a1, n = 24, ry = r) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + r * cos(a), cy + ry * sin(a)]; });
const seg = (a, b, n = 8) => Array.from({ length: n + 1 }, (_, i) => [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]);
function path_(...parts) { const out = []; for (const p of parts) for (const q of p) { const l = out[out.length - 1]; if (!l || Math.hypot(q[0] - l[0], q[1] - l[1]) > 1e-6) out.push(q); } return out; }
function poly(...corners) { const out = []; for (let i = 1; i < corners.length; i++) out.push(...seg(corners[i - 1], corners[i], 10).slice(i > 1 ? 1 : 0)); return out; }
const ink = pts => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; };
// 線を 等間隔に 打ちなおし、インクの 上限の 97% に おさまるよう 縮める（大きいときだけ）
function fitLimb(pts, max, spacing = 6) {
  const reach = Math.max(...pts.map(p => Math.max(Math.abs(p[0] - pts[0][0]), Math.abs(p[1] - pts[0][1]))));
  const k = Math.min(1, max * 0.97 / ink(pts), 124 / reach), s = pts.map(p => [(p[0] - pts[0][0]) * k, (p[1] - pts[0][1]) * k]);   // URL は 描き始めから ±127 まで
  return near(resample(s, spacing, false).map(p => p.map(Math.round)));
}
// 閉じた 形: 中心 cy のまわりに 置き、ふちの 長さ（閉じる 辺は 数えない）を 上限に おさめる
function fitBody(pts, spacing = 8) {
  const src = pts.concat([pts[0]]);
  const k = Math.min(1, RB.INK.body * 0.94 / ink(src));
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const s = src.map(p => [(p[0] - cx) * k, (p[1] - cy) * k - 115]);
  const r = resample(s, spacing, false); r.pop();   // 最後の 点（＝最初の 点）は 閉じるので いらない
  const q = near(r.map(p => p.map(Math.round)));
  while (q.length > 3 && Math.hypot(q[0][0] - q[q.length - 1][0], q[0][1] - q[q.length - 1][1]) < 5) q.pop();
  return q;
}
function near(pts) { const o = [pts[0]]; for (const p of pts.slice(1)) { const l = o[o.length - 1]; if (Math.hypot(p[0] - l[0], p[1] - l[1]) >= 5) o.push(p); } return o; }
function resample(pts, spacing) {
  const out = [pts[0].slice()]; let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]); if (!d) continue;
    let t = spacing - carry;
    while (t <= d) { out.push([a[0] + (b[0] - a[0]) * t / d, a[1] + (b[1] - a[1]) * t / d]); t += spacing; }
    carry = d - (t - spacing);
  }
  const l = pts[pts.length - 1], o = out[out.length - 1];
  if (Math.hypot(l[0] - o[0], l[1] - o[1]) > spacing * 0.4) out.push(l.slice()); else out[out.length - 1] = l.slice();
  return out;
}
const star = (n, ro, ri, rot = -PI / 2) => Array.from({ length: n * 2 }, (_, i) => { const r = i % 2 ? ri : ro, a = rot + i * PI / n; return [r * cos(a), r * sin(a)]; });
const closeStar = (n, ro, ri) => poly(...star(n, ro, ri), star(n, ro, ri)[0]);

// ---------- うで（前へ、インク 150） ----------
const ARM = [
  ['やり', 'まっすぐ ながい', seg([0, 0], [150, 0], 20)],
  ['ハンマー', 'さきに おもい あたま', path_(seg([0, 0], [80, 0], 10), seg([80, 0], [80, -30], 4), seg([80, -30], [100, -30], 3), seg([100, -30], [100, 30], 8), seg([100, 30], [80, 30], 3), seg([80, 30], [80, 0], 4))],
  ['カギ', 'さきが くるっと まがる', path_(seg([0, 0], [85, 0], 10), arc(85, 22, 22, -PI / 2, PI * 0.75, 16))],
  ['ジグザグ', 'ギザギザ いなずま', poly([0, 0], [25, -22], [50, 0], [75, -22], [100, 0], [125, -22])],
  ['うずまき', 'さきに ぐるぐる', path_(seg([0, 0], [55, 0], 8), Array.from({ length: 60 }, (_, i) => { const t = i / 59, a = t * PI * 3.2, r = 20 - t * 15; return [75 + r * cos(PI + a), r * sin(PI + a)]; }))],
  ['ブーメラン', 'くの字に まがる', poly([0, 0], [70, -45], [140, 0])],
  ['フォーク', 'さきが 3 本', path_(seg([0, 0], [70, 0], 8), seg([70, 0], [70, -18], 3), seg([70, -18], [95, -18], 4), seg([95, -18], [70, -18], 4), seg([70, -18], [70, 18], 5), seg([70, 18], [95, 18], 4), seg([95, 18], [70, 18], 4), seg([70, 18], [70, 0], 3), seg([70, 0], [95, 0], 4))],
  ['わっか', 'さきに まるい わ', path_(seg([0, 0], [40, 0], 6), arc(58, 0, 18, PI, PI * 3, 28))],
  ['グー', 'みじかくて さきが しかく', path_(seg([0, 0], [30, 0], 4), poly([30, 0], [30, -18], [66, -18], [66, 18], [30, 18], [30, 0]))],
  ['アッパー', 'ななめ うえに のびる', seg([0, 0], [95, -115], 20)],
  ['したむき', 'ななめ したへ', seg([0, 0], [95, 115], 20)],
  ['Lのじ', 'まえ から うえ', poly([0, 0], [75, 0], [75, -75])],
  ['なみ', 'くねくね なみ', Array.from({ length: 50 }, (_, i) => [i * 2.4, -14 * sin(i / 49 * PI * 3)])],
  ['かま', 'おおきく そった は', path_(seg([0, 0], [45, 0], 6), arc(45, 45, 45, -PI / 2, PI * 0.55, 24, 45))],
  ['ほうき', 'さきが ひろがる', path_(seg([0, 0], [70, 0], 8), seg([70, 0], [100, -24], 4), seg([100, -24], [70, 0], 4), seg([70, 0], [104, 0], 4), seg([104, 0], [70, 0], 4), seg([70, 0], [100, 24], 4))],
  ['むすびめ', 'とちゅうに わが ひとつ', path_(seg([0, 0], [45, 0], 6), arc(45, -22, 22, PI / 2, PI * 2.5, 28), seg([45, 0], [105, 0], 8).slice(1))],
  ['めがね', 'わが ふたつ', Array.from({ length: 70 }, (_, i) => { const t = i / 69, a = t * PI * 2 * 2; return [t * 70 + 20 * sin(a), -20 + 20 * cos(a)]; })],
  ['ほし', 'さきに ほし', path_(seg([0, 0], [55, 0], 7), closeStar(5, 20, 8).map(p => [p[0] + 75, p[1]]).slice(0))],
  ['カクカク', 'しかくい なみ', poly([0, 0], [20, 0], [20, -25], [45, -25], [45, 0], [70, 0], [70, -25], [95, -25], [95, 0], [115, 0])],
  ['うしろ', 'うしろへ のびる', seg([0, 0], [-120, 20], 20)],
];
// ほしの 先は 肩から はなす（つなぎ目を 1 本に）
ARM[17][2] = path_(seg([0, 0], [30, 0], 4), (() => { const s = star(5, 30, 13, PI); return poly(...s.map(p => [p[0] + 60, p[1]]), [s[0][0] + 60, s[0][1]]); })());

// ---------- あし（下へ、インク 130。反対がわに もう 1 本 つく） ----------
const LEG = [
  ['ぼう', 'ながい まっすぐ', seg([0, 0], [0, 128], 20)],
  ['ちょこん', 'みじかい', seg([0, 0], [0, 35], 6)],
  ['わ', 'まるい わ', arc(0, 20, 20, -PI / 2, PI * 1.5, 28)],
  ['くつ', 'したに のびて まえへ', poly([0, 0], [0, 65], [45, 65])],
  ['つえ', 'さきが くるっと', path_(seg([0, 0], [0, 80], 10), arc(14, 80, 14, PI, 0, 14, -14))],
  ['ジグザグ', 'ギザギザ', poly([0, 0], [18, 22], [0, 44], [18, 66], [0, 88], [18, 110])],
  ['Sのじ', 'くねっと S', Array.from({ length: 40 }, (_, i) => { const t = i / 39; return [22 * sin(t * PI * 2), t * 95]; })],
  ['ななめ', 'ななめ まえ', seg([0, 0], [70, 90], 16)],
  ['Tのじ', 'さきに よこ ぼう', path_(seg([0, 0], [0, 70], 10), seg([0, 70], [-28, 70], 4), seg([-28, 70], [28, 70], 8))],
  ['ぐるぐる', 'うずまき', Array.from({ length: 60 }, (_, i) => { const t = i / 59, a = t * PI * 3.5, r = 4 + t * 20; return [r * sin(a), 26 - r * cos(a) + 0 * t]; })],
  ['はんえん', 'まるい 半分', arc(28, 0, 28, PI, 0, 22, -40).map(p => [p[0], -p[1] + 0])],
  ['カクカク', 'しかくい なみ', poly([0, 0], [0, 25], [22, 25], [22, 50], [0, 50], [0, 75], [22, 75], [22, 100])],
  ['Yのじ', 'さきが ふたまた', path_(seg([0, 0], [0, 60], 8), seg([0, 60], [-22, 90], 5), seg([-22, 90], [0, 60], 5), seg([0, 60], [22, 90], 5))],
  ['おおきな わ', 'みじかい ぼうに おおきな わ', path_(seg([0, 0], [0, 12], 2), arc(0, 38, 26, -PI / 2, PI * 1.5, 32))],
  ['ひざ', 'くの字に まがる', poly([0, 0], [40, 50], [0, 100])],
  ['しかく', 'しかくい わく', poly([0, 0], [16, 0], [16, 32], [-16, 32], [-16, 0], [0, 0])],
  ['さんかく', 'さんかくの わく', poly([0, 0], [24, 42], [-24, 42], [0, 0])],
  ['ほね', 'りょうはしが ふくらむ', path_(arc(0, 8, 8, -PI / 2, PI * 1.5, 12), seg([0, 0], [0, 80], 10).slice(1), arc(0, 88, 8, -PI / 2, PI * 1.5, 12))],
  ['かぎづめ', 'さきに つめ 3 本', path_(seg([0, 0], [0, 70], 10), seg([0, 70], [-18, 88], 3), seg([-18, 88], [0, 70], 3), seg([0, 70], [0, 94], 3), seg([0, 94], [0, 70], 3), seg([0, 70], [18, 88], 3))],
  ['ほし', 'さきに ほし', path_(seg([0, 0], [0, 30], 4), (() => { const s = star(5, 26, 11, -PI / 2); return poly(...s.map(p => [p[0], p[1] + 56]), [s[0][0], s[0][1] + 56]); })())],
];

// ---------- からだ（閉じた 形、インク 520） ----------
const circ = (r, ry = r, n = 40) => arc(0, 0, r, 0, PI * 2, n, ry).slice(0, -1);
const BODY = [
  ['ほし', 'ほし', star(5, 80, 34)],
  ['まる', 'まんまる', circ(80)],
  ['しかく', 'はこ', poly([-60, -60], [60, -60], [60, 60], [-60, 60])],
  ['さんかく', 'とんがり うえ', poly([0, -90], [80, 60], [-80, 60])],
  ['さかさんかく', 'とんがり した', poly([-80, -60], [80, -60], [0, 90])],
  ['ハート', 'ハート', Array.from({ length: 60 }, (_, i) => { const t = i / 60 * PI * 2; return [5 * 16 * sin(t) ** 3, -5 * (13 * cos(t) - 5 * cos(2 * t) - 2 * cos(3 * t) - cos(4 * t))]; })],
  ['ノッポ', 'ほそながい たて', poly([-18, -110], [18, -110], [18, 110], [-18, 110])],
  ['ぺったんこ', 'ひらたい よこ', poly([-108, -14], [108, -14], [108, 14], [-108, 14])],
  ['ひしがた', 'ダイヤ', poly([0, -100], [60, 0], [0, 100], [-60, 0])],
  ['みかづき', 'つき', path_(arc(0, 0, 70, -PI * 2 / 3, PI * 2 / 3, 30), arc(-60, 0, 65.6, 1.18, -1.18, 22))],
  ['おうち', 'やねの ある いえ', poly([-50, -20], [0, -75], [50, -20], [50, 60], [-50, 60])],
  ['きのこ', 'かさと じく', path_(arc(0, 0, 75, PI, PI * 2, 24, 55), poly([75, 0], [22, 0], [22, 60], [-22, 60], [-22, 0], [-75, 0]))],
  ['くも', 'もくもく', Array.from({ length: 72 }, (_, i) => { const t = i / 72 * PI * 2, r = 62 + 12 * Math.abs(sin(t * 3)); return [r * 1.25 * cos(t), r * 0.8 * sin(t)]; })],
  ['おばけ', 'ひらひら すそ', path_(arc(0, 0, 50, PI, PI * 2, 20), [[50, 50]], Array.from({ length: 25 }, (_, i) => [50 - i * 100 / 24, 50 + 10 * sin(i / 24 * PI * 4)]).slice(1))],
  ['さかな', 'しっぽ つき', path_(arc(20, 0, 55, -PI * 0.8, PI * 0.8, 28, 38), [[-60, 30]], [[-60, -30]])],
  ['ひょうたん', 'まるが ふたつ たて', path_(arc(0, -45, 38, PI / 2 + 0.5, PI * 2.5 - 0.5, 26), arc(0, 40, 52, -PI / 2 + 0.62, PI * 1.5 - 0.62, 30))],
  ['じゅうじ', 'プラス', poly([-20, -70], [20, -70], [20, -20], [70, -20], [70, 20], [20, 20], [20, 70], [-20, 70], [-20, 20], [-70, 20], [-70, -20], [-20, -20])],
  ['ちび', 'とても ちいさい', circ(16, 16, 14)],
  ['カップ', 'うえが へこんだ U', path_(poly([-60, -50], [-35, -50]), arc(0, 0, 35, PI, 0, 16, -30).map(p => [p[0], p[1] - 50 + 30]).slice(0), poly([35, -50], [60, -50], [60, 50], [-60, 50]).slice(0))],
  ['ふたこぶ', 'やまが ふたつ', path_(arc(-40, 0, 40, PI, PI * 2, 16, 50), arc(40, 0, 40, PI, PI * 2, 16, 50), poly([80, 0], [80, 40], [-80, 40]))],
];

// ---------- 仕上げ・確かめ ----------
const out = { arm: [], leg: [], body: [] }, bad = [];
for (const [k, list, max] of [['arm', ARM, RB.INK.arm], ['leg', LEG, RB.INK.leg]]) for (const [name, hint, raw] of list) {
  const p = fitLimb(raw, max);   // decodeDesign の cleanLimb と 同じ 下ごしらえで 切れないか（点の 間 5 以上・インク 上限 以内）
  if (ink(p) > max || p.some((q, i) => i && Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) < 5)) bad.push(k + ' ' + name + ' が インクで 切れる ' + Math.round(ink(p)));
  if (p.some(q => Math.abs(q[0]) > 127 || Math.abs(q[1]) > 127)) bad.push(k + ' ' + name + ' が URL に のらない');
  if (p.length > 255) bad.push(k + ' ' + name + ' 点が 多すぎ');
  out[k].push({ name, hint, pts: p });
}
for (const [name, hint, raw] of BODY) {
  const p = fitBody(raw), c = RB.cleanStroke(p, RB.INK.body);
  if (c.length !== p.length) bad.push('body ' + name + ' が 切れる ' + c.length + '/' + p.length);
  out.body.push({ name, hint, pts: p });
}
for (const k of ['arm', 'leg', 'body']) if (out[k].length !== 20) bad.push(k + ' が 20 こ でない');
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
// 60 日の ならび: からだ → うで → あし の くりかえし。n 日目 = PART[n % 3] の (n / 3 | 0) 番
const js = `// きょうの イベント の お題（tools/make_event.js で 作る。手で 書きかえない）
// 60 日で 一周: n 日目 = ['body','arm','leg'][n % 3] の ((n / 3) | 0) 番（オーナー 2026-09-30: からだ → うで → あし、1 日目は からだ「ほし」）。うで・あしは 肩・腰から [0,0]、からだは パッド座標
'use strict';
(function (root) {
const EVENT_PARTS = ${JSON.stringify(out).replace(/\{"name"/g, '\n  {"name"')};
// 1 日目（からだ 1 番「ほし」）の 日付（日本時間）。この 日から 1 日ずつ すすむ。ずらす ときは ここと tools/make_event.js を かえる
const EVENT_START = '2026-09-30';
function eventTheme(n) { n = ((n % 60) + 60) % 60; const part = ['body', 'arm', 'leg'][n % 3]; return Object.assign({ part, no: (n / 3) | 0, n }, EVENT_PARTS[part][(n / 3) | 0]); }
// 日付（'YYYY-MM-DD'、ランクせんの season と おなじ）→ その 日の お題
function eventThemeOf(day) { return eventTheme(Math.round((Date.parse(day + 'T00:00:00Z') - Date.parse(EVENT_START + 'T00:00:00Z')) / 864e5)); }
// 形を お題に あわせる: お題の 部分を 決まった 形に（うで・あしは 肩・腰に つけなおす）。design は sim.js の RB.design
function eventFit(RB, d, t) {
  const rel = p => p.map(q => [q[0] - p[0][0], q[1] - p[0][1]]);
  if (t.part === 'body') return RB.design(t.pts, rel(d.arm), rel(d.leg));
  return RB.design(d.body, t.part === 'arm' ? t.pts : rel(d.arm), t.part === 'leg' ? t.pts : rel(d.leg));
}
const API = { EVENT_PARTS, EVENT_START, eventTheme, eventThemeOf, eventFit };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else Object.assign(root, API);
})(this);
`;
fs.writeFileSync(path.join(__dirname, '..', 'event.js'), js);
console.log('event.js: ' + ['arm', 'leg', 'body'].map(k => k + ' ' + out[k].length + ' こ（点 ' + Math.min(...out[k].map(x => x.pts.length)) + '〜' + Math.max(...out[k].map(x => x.pts.length)) + '）').join(' / '));
