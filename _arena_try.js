// 闘技場の 試し: 理由（ko/time/fall）の 割合・時間
const RB = require('./sim.js');
const AR = {
  yama: { name: 'おやま', floor: [[-120, 0], [0, 70], [120, 0]], hw: 380 },
  dokutsu: { name: 'ひくい どうくつ', floor: [], hw: 380, ceil: 170 },
  heya: { name: 'せまい へや', floor: [], hw: 170, sx: 100 },
  gake: { name: 'がけっぷち', floor: [[-290, -400], [-260, 0], [260, 0], [290, -400]], hw: 0, fall: 120 },
  dansa: { name: 'だんさ', floor: [[-50, 0], [50, 60]], hw: 380 },
};
module.exports = AR;
if (require.main === module) {
  const { ranked } = require(process.env.GD);
  const D = ranked.slice(0, 20).map(m => RB.decodeDesign(m.code)).concat(RB.CPU, RB.URA);
  for (const [k, a] of Object.entries(AR)) {
    const c = { ko: 0, time: 0, fall: 0, draw: 0 }; let t = 0, n = 0, tall = 0;
    for (let i = 0; i < D.length; i += 2) for (let j = 1; j < D.length; j += 3) if (i !== j) { const S = RB.fight(D[i], D[j], a); c[S.reason]++; if (!S.winner) c.draw++; t += S.t; n++; }
    for (const d of D) if (RB.create(d, d, a).A.tall) tall++;
    console.log(a.name.padEnd(8), JSON.stringify(c), '平均', (t / n).toFixed(1) + '秒', '天井より 高い', tall + '/' + D.length);
  }
}
