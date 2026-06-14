// node --test truth-recovery/test-truth-recovery.mjs
// Measured invariants for the SafetyMA rare-event yardstick. Seeded.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { runCell } from './harness.mjs';

function makeRng(seed) { let a = seed >>> 0; return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

describe('Truth-recovery (measured)', () => {
  it('at the null (OR=1) all three methods are unbiased with nominal coverage', () => {
    const r = runCell(8, 1.0, 0.02, 500, 1, 3000, makeRng(20260613));
    for (const m of ['Peto', 'MH', 'DL']) {
      assert.ok(Math.abs(r[m].bias) < 0.03, `${m} bias at null ${r[m].bias}`);
      assert.ok(r[m].coverage > 0.93, `${m} coverage at null ${r[m].coverage}`);
    }
  });

  it('Peto OR is BIASED and under-covers when the true OR is far from 1', () => {
    const r = runCell(8, 0.2, 0.02, 500, 1, 3000, makeRng(20260613));
    assert.ok(r.Peto.bias > 0.1, `Peto bias at OR=0.2 ${r.Peto.bias} (expected toward null)`);
    assert.ok(r.Peto.coverage < 0.9, `Peto coverage at OR=0.2 ${r.Peto.coverage}`);
    // MH stays calibrated
    assert.ok(Math.abs(r.MH.bias) < 0.05 && r.MH.coverage > 0.93, `MH not robust: ${r.MH.bias}/${r.MH.coverage}`);
  });

  it('Peto OR is BIASED and under-covers under arm imbalance', () => {
    const r = runCell(8, 0.5, 0.02, 300, 4, 3000, makeRng(20260615));
    assert.ok(Math.abs(r.Peto.bias) > 0.08, `Peto bias under imbalance ${r.Peto.bias}`);
    assert.ok(r.Peto.coverage < 0.9, `Peto coverage under imbalance ${r.Peto.coverage}`);
    assert.ok(Math.abs(r.MH.bias) < 0.05 && r.MH.coverage > 0.93, `MH not robust: ${r.MH.bias}/${r.MH.coverage}`);
  });

  it('Mantel-Haenszel is the robust truth-recoverer across all regimes', () => {
    const rng = makeRng(7);
    for (const [or, imb] of [[1.0, 1], [0.2, 1], [0.5, 4], [2.0, 4]]) {
      const r = runCell(8, or, 0.02, or > 1 || imb > 1 ? 300 : 500, imb, 2500, rng);
      assert.ok(Math.abs(r.MH.bias) < 0.06 && r.MH.coverage > 0.92,
        `MH failed at OR=${or}, imb=${imb}: bias ${r.MH.bias}, cov ${r.MH.coverage}`);
    }
  });
});
