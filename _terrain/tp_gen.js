// 形の 作り方（プレイヤーの 形は 使わない）: randomRobot（人が 描きそうな 形）と evolve.js の 形の 遺伝子（randP / mutate / build）
const fs = require('fs'), path = require('path');
const RB = require('../sim.js');
// randomRobot（clear_rate.js）の 乱数は 588 種類で くり返す（大きい かけ算で 桁が おちる）ので、同じ 作り方で 乱数だけ かえた ものを 使う
const crSrc = fs.readFileSync(path.join(__dirname, '..', 'clear_rate.js'), 'utf8');
const crPart = crSrc.slice(crSrc.indexOf('let seed'), crSrc.indexOf('module.exports') > 0 ? crSrc.indexOf('module.exports') : undefined);
let m32 = 1;
const RR = new Function('RB', 'rng', crPart.replace(/let seed = [^;]+; const r = \(\) => \{[^}]+\};/, 'const r = rng;') + '; return randomRobot;');
const randomRobot = RR(RB, () => { m32 |= 0; m32 = m32 + 0x6D2B79F5 | 0; let t = Math.imul(m32 ^ m32 >>> 15, 1 | m32); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; });
// evolve.js の 遺伝子まわりを そのまま 借りる（本体は 読みこむと 計算が 始まるので 関数の 部分だけ）
const src = fs.readFileSync(path.join(__dirname, '..', 'evolve.js'), 'utf8');
const part = src.slice(src.indexOf('let seed'), src.indexOf('// 相手: 表の CPU'));
const G = new Function('RB', 'process', part.replace("const LIM = Object.assign({}, LIM0, JSON.parse(process.argv[4] || '{}'));", 'const LIM = LIM0;') + '; return { randP, mutate, build, setSeed: s => { seed = s; } };')(RB, { argv: [] });
const plain = d => RB.encodeDesign({ body: d.body, arm: d.arm, leg: d.leg });
function gen(n, seed) { G.setSeed(seed); m32 = seed * 7919 + 1; const out = new Set(); let k = 0; while (out.size < n && k++ < n * 20) { const d = k % 2 ? randomRobot() : G.build(G.randP()); if (d && RB.validDesign(d)) out.add(plain(d)); } return [...out]; }
function randoms(n, seed) { m32 = seed; const out = new Set(); let k = 0; while (out.size < n && k++ < n * 5) { const d = randomRobot(); if (d) out.add(plain(d)); } return [...out]; }
module.exports = { G, gen, plain, randoms };
