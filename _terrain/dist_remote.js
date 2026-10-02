// desk2 で 動く 側（dist_par.js が ssh で 起動）: 1 行目 {ter}、そのあと 1 行 1 件 {id, pairs} → {id, r}
'use strict';
if (process.argv[2] === '--md5') { console.log(require('crypto').createHash('md5').update(require('fs').readFileSync(__dirname + '/sim.js')).digest('hex')); process.exit(0); }
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
if (!isMainThread) {
  const RB = require('./sim.js'), TER = workerData, cache = new Map();
  const dec = c => { if (!cache.has(c)) cache.set(c, RB.decodeDesign(c)); return cache.get(c); };
  parentPort.on('message', ({ id, pairs }) => parentPort.postMessage({ id, r: pairs.map(([a, b, t, how]) => { const A = dec(a), B = dec(b); if (TER[t] && TER[t].ceil && (RB.create(A, B, TER[t]).A.tall)) return 'T'; const S = RB.fight(A, B, TER[t]); return (S.winner || 'D') + (how === 'r' ? (S.reason === 'time' ? 't' : 'k') : ''); }) }));
} else {
  const N = require('os').cpus().length; let W = null, buf = '', wid = 0; const wait = new Map();
  const out = o => process.stdout.write(JSON.stringify(o) + '\n');
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', s => { buf += s; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); if (line) handle(JSON.parse(line)); } });
  process.stdin.on('end', () => process.exit(0));
  function handle(m) {
    if (m.ter) { W = Array.from({ length: N }, () => { const w = new Worker(__filename, { workerData: m.ter }); w.on('message', ({ id, r }) => { const j = wait.get(id); j.parts[j.k.indexOf(id)] = r; if (--j.left === 0) done(j); }); return w; }); out({ ready: N }); return; }
    const parts = Array.from({ length: N }, () => []); m.pairs.forEach((p, i) => parts[i % N].push(p));
    const j = { id: m.id, n: m.pairs.length, parts: new Array(N), k: [], left: 0 };
    parts.forEach((p, w) => { if (!p.length) { j.parts[w] = []; return; } const id = ++wid; j.k[w] = id; wait.set(id, j); j.left++; W[w].postMessage({ id, pairs: p }); });
    j.k = j.k.map(x => x || -1); if (!j.left) done(j);
  }
  function done(j) { const r = new Array(j.n); j.parts.forEach((p, w) => p.forEach((v, k) => r[w + k * N] = v)); j.k.forEach(id => wait.delete(id)); out({ id: j.id, r }); }
}
