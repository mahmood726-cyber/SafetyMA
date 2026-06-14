// ============================================================
// harness.mjs -- Truth-recovery yardstick for SafetyMA.
//
// SafetyMA pools RARE adverse-event 2x2 tables with the Peto OR, Mantel-Haenszel
// (Robins-Breslow-Greenland variance) and DerSimonian-Laird. The classic
// rare-event question (Bradburn 2007, Sweeting 2004): which method RECOVERS the
// true OR when events are rare and zero cells abound? Peto is efficient near OR=1
// with balanced arms but BIASED when the OR is far from 1 or the arms are
// imbalanced; MH-RBG is more robust; DL drops zero-cell studies (loses info).
//
// This harness injects a KNOWN true OR with rare events and measures each method's
// bias (log scale) and coverage of the true OR, using the app's OWN petoOR/mhOR/
// dlRE (engine.mjs, verbatim).
//
// Truth-first: every number printed comes from seeded simulation here.
// Run:  node truth-recovery/harness.mjs --reps 3000
// ============================================================

import { petoOR, mhOR, dlRE } from './engine.mjs';

const BASE_SEED = 20260613;
function makeRng(seed) { let a = seed >>> 0; return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function rbinom(rng, n, p) { let x = 0; for (let i = 0; i < n; i++) if (rng() < p) x++; return x; }

function gen(rng, k, trueOR, pc, ntPerArm, imbalance) {
  const oddsC = pc / (1 - pc);
  const pt = (oddsC * trueOR) / (1 + oddsC * trueOR);
  const data = [];
  for (let i = 0; i < k; i++) {
    const nc = ntPerArm;
    const nt = Math.round(ntPerArm * imbalance);   // imbalance>1 => bigger treatment arm
    data.push({ name: `s${i}`, et: rbinom(rng, nt, pt), nt, ec: rbinom(rng, nc, pc), nc });
  }
  return data;
}

const METHODS = { Peto: petoOR, MH: mhOR, DL: dlRE };

export function runCell(k, trueOR, pc, ntPerArm, imbalance, reps, rng) {
  const trueLog = Math.log(trueOR);
  const acc = {}; for (const m of Object.keys(METHODS)) acc[m] = { biasSum: 0, cov: 0, n: 0 };
  for (let r = 0; r < reps; r++) {
    const data = gen(rng, k, trueOR, pc, ntPerArm, imbalance);
    for (const [name, fn] of Object.entries(METHODS)) {
      let res; try { res = fn(data); } catch { res = null; }
      if (!res || !isFinite(res.logOR)) continue;
      const a = acc[name]; a.n++;
      a.biasSum += res.logOR - trueLog;
      if (res.ci[0] <= trueOR && trueOR <= res.ci[1]) a.cov++;
    }
  }
  const out = {};
  for (const [name, a] of Object.entries(acc))
    out[name] = a.n ? { bias: +(a.biasSum / a.n).toFixed(3), coverage: +(a.cov / a.n).toFixed(3),
                        used: +(a.n / reps).toFixed(2) } : null;
  return out;
}

const isMain = process.argv[1]?.endsWith('harness.mjs');
if (isMain) {
  const i = process.argv.indexOf('--reps');
  const reps = i >= 0 ? Number(process.argv[i + 1]) : 3000;
  const t0 = Date.now();
  const rng = makeRng(BASE_SEED);
  console.log(`\n# Truth-recovery yardstick -- SafetyMA (rare-event OR pooling)`);
  console.log(`reps=${reps}/cell  k=8 studies  control rate=2%  seed=${BASE_SEED}\n`);
  console.log('scenario                       | Peto bias/cov   | MH bias/cov     | DL bias/cov/used');
  const cells = [
    ['OR=1.0, balanced',      { OR: 1.0, pc: 0.02, n: 500, imb: 1 }],
    ['OR=0.5, balanced',      { OR: 0.5, pc: 0.02, n: 500, imb: 1 }],
    ['OR=0.2, balanced',      { OR: 0.2, pc: 0.02, n: 500, imb: 1 }],
    ['OR=0.5, imbalanced 4:1',{ OR: 0.5, pc: 0.02, n: 300, imb: 4 }],
    ['OR=2.0, imbalanced 4:1',{ OR: 2.0, pc: 0.02, n: 300, imb: 4 }],
  ];
  for (const [label, c] of cells) {
    const r = runCell(8, c.OR, c.pc, c.n, c.imb, reps, rng);
    const f = (m) => r[m] ? `${String(r[m].bias).padStart(6)}/${r[m].coverage}` : '   n/a';
    console.log(label.padEnd(30), '|', f('Peto').padEnd(14), '|', f('MH').padEnd(14), '|',
      r.DL ? `${r.DL.bias}/${r.DL.coverage}/${r.DL.used}` : 'n/a');
  }
  console.log('\n(bias = mean(logOR_hat - true logOR); cov = coverage of true OR; DL "used" = fraction of reps DL could fit.)');
  console.log(`(${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}
