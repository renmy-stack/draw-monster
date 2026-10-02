// tp_par.js と 同じ 使い方（run(pairs) → 勝者の 配列）で、もう 1 台（ssh desk2）にも 分ける
// 小さい 束（MIN 未満）は この PC だけ。desk2 に つながらない・落ちた ときも この PC で 計算する（結果は 同じ。2026-10-01 に 一致を 確認）
// 分ける 割合は 両方の 速さを 測って 毎回 なおす（はじめ 45%）。DIST=0 で desk2 を 使わない
// 切れたら（Windows Update の 再起動・ネットワーク）その 束は この PC で 計算し、30 秒 たったら つなぎなおす
'use strict';
const path = require('path'), fs = require('fs'), crypto = require('crypto'), { spawn, execFileSync } = require('child_process');
const local = require('./tp_par.js'), TER = local.TER;
const Q = ['-o', 'LogLevel=ERROR'], HOST = 'desk2', RDIR = 'dmdist', MIN = 100, ONLY_R = process.env.REMOTE_ONLY === '1';
let ch = null, ready = null, buf = '', nid = 0, share = 0.45, dead = process.env.DIST === '0', retryAt = 0;
const pend = new Map();
const md5 = f => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');
function start() {
  if (ready) return ready;
  ready = new Promise(ok => {
    try {
      const files = [path.join(__dirname, '..', 'sim.js'), path.join(__dirname, 'dist_remote.js')];
      execFileSync('ssh', [...Q, HOST, 'if not exist ' + RDIR + ' mkdir ' + RDIR], { stdio: 'ignore', timeout: 20000 });
      execFileSync('scp', ['-q', ...Q, ...files, HOST + ':' + RDIR + '/'], { stdio: 'ignore', timeout: 60000 });
      const remoteSum = execFileSync('ssh', [...Q, HOST, 'node ' + RDIR + '/dist_remote.js --md5'], { timeout: 20000 }).toString().trim();
      if (remoteSum !== md5(files[0])) throw new Error('sim.js が そろわない');
    } catch (e) { console.error('[dist] desk2 なし: ' + e.message.split('\n')[0]); down(); return ok(false); }
    ch = spawn('ssh', [...Q, HOST, 'node ' + RDIR + '/dist_remote.js'], { stdio: ['pipe', 'pipe', 'ignore'] });
    ch.stdout.setEncoding('utf8');
    ch.stdout.on('data', s => { buf += s; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); let m; try { m = JSON.parse(line); } catch (e) { continue; } if (m.ready) { console.error('[dist] desk2 つながった（' + m.ready + ' 本）'); ok(true); } else if (pend.has(m.id)) { pend.get(m.id).ok(m.r); pend.delete(m.id); idle(); } } });
    const me = ch, fail = () => { if (ch !== me) return; console.error('[dist] desk2 が 切れた → この PC で 計算して 30 秒 後に つなぎなおす'); down(); ok(false); for (const p of pend.values()) p.ng(new Error('desk2 切れ')); pend.clear(); };
    ch.on('exit', fail); ch.on('error', fail); ch.stdin.on('error', fail);
    ch.stdin.write(JSON.stringify({ ter: TER }) + '\n');
  });
  return ready;
}
function down() { const c = ch; ch = null; ready = null; buf = ''; retryAt = Date.now() + 30000; if (c) { try { c.kill(); } catch (e) {} } }
// 待って いない ときは この PC の 終了を じゃま しない
function idle() { if (!ch || pend.size) return; ch.unref(); ch.stdout.unref && ch.stdout.unref(); ch.stdin.unref && ch.stdin.unref(); }
function busy() { ch.ref(); ch.stdout.ref && ch.stdout.ref(); ch.stdin.ref && ch.stdin.ref(); }
function remote(pairs) { return new Promise((ok, ng) => { const id = ++nid; pend.set(id, { ok, ng }); busy(); ch.stdin.write(JSON.stringify({ id, pairs }) + '\n'); }); }
const stats = { local: 0, remote: 0, calls: 0 };
async function run(pairs, W = 15) {
  // REMOTE_ONLY=1: desk2 だけで 計算（この PC が ほかの 計算で ふさがって いる とき）。つながらない ときだけ この PC
  if (ONLY_R && !dead) { if ((await start()) && ch) { try { const r = await remote(pairs); stats.remote += pairs.length; stats.calls++; return r; } catch (e) {} } return local.run(pairs, W); }
  if (dead || pairs.length < MIN || Date.now() < retryAt) return local.run(pairs, W);
  if (!(await start()) || !ch) return local.run(pairs, W);
  if (pairs.length >= BIG) return pull(pairs, W);
  // 1 つおきに 近い 形で まぜて 分ける（重い 形が かたよらない ように）
  const iL = [], iR = []; pairs.forEach((p, i) => (Math.floor((i + 1) * share) > Math.floor(i * share) ? iR : iL).push(i));
  const t0 = Date.now(); let tL = 0, tR = 0;
  const pL = local.run(iL.map(i => pairs[i]), W).then(r => { tL = Date.now() - t0; return r; });
  const pR = remote(iR.map(i => pairs[i])).then(r => { tR = Date.now() - t0; return r; }, () => local.run(iR.map(i => pairs[i]), W));
  const [rL, rR] = await Promise.all([pL, pR]);
  const out = new Array(pairs.length); iL.forEach((i, k) => out[i] = rL[k]); iR.forEach((i, k) => out[i] = rR[k]);
  if (tL > 0 && tR > 0 && ch) { const sL = iL.length / tL, sR = iR.length / tR, s = sR / (sL + sR); share = Math.min(0.7, Math.max(0.2, 0.7 * share + 0.3 * s)); }
  stats.local += iL.length; stats.remote += iR.length; stats.calls++;
  return out;
}
// 大きい 束: 小さく 切って、手が あいた ほうが 次を とる（はじめに 割合で 分けると 先に おわった ほうが 待つ）
const BIG = 6000, CH_L = 1500, CH_R = 800;
async function pull(pairs, W) {
  const out = new Array(pairs.length), queue = []; let pos = 0;
  const take = n => { if (queue.length) return queue.shift(); if (pos >= pairs.length) return null; const a = pos; pos = Math.min(pairs.length, pos + n); return [a, pos]; };
  const put = ([a, b], r) => { for (let i = a; i < b; i++) out[i] = r[i - a]; };
  const localLoop = async () => { for (let c; (c = take(CH_L));) { put(c, await local.run(pairs.slice(c[0], c[1]), W)); stats.local += c[1] - c[0]; } };
  const remoteLoop = async () => { for (let c; ch && (c = take(CH_R));) { try { put(c, await remote(pairs.slice(c[0], c[1]))); stats.remote += c[1] - c[0]; } catch (e) { queue.push(c); return; } } };
  await Promise.all([localLoop(), remoteLoop()]);
  // desk2 が 切れて のこった 束（localLoop が おわった あとに もどされた ぶん）
  for (let c; (c = take(CH_L));) { put(c, await local.run(pairs.slice(c[0], c[1]), W)); stats.local += c[1] - c[0]; }
  stats.calls++;
  return out;
}
module.exports = { TER, run, stats, share: () => share };
