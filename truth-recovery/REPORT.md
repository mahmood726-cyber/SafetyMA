# Truth-recovery yardstick — SafetyMA (rare-event OR pooling)

**Verdict: VALIDATION + a clear method ranking. The engine's three rare-event
methods behave exactly as the literature predicts: Mantel-Haenszel (RBG) recovers
the true OR across all regimes, while the Peto OR is biased and under-covers when
the true OR is far from 1 or the arms are imbalanced.**

## Method
SafetyMA pools rare adverse-event 2×2 tables with the Peto OR, Mantel-Haenszel
(Robins-Breslow-Greenland variance) and DerSimonian-Laird. The harness injects a
KNOWN true OR with rare events (2% control rate, k=8 studies, frequent zero cells)
and measures each method's bias (log scale) and coverage of the true OR, using the
app's OWN `petoOR`/`mhOR`/`dlRE` (engine.mjs, verbatim). 4000 reps/cell.

## Results

| scenario               | Peto (bias / cov) | MH (bias / cov) | DL (bias / cov) |
|------------------------|------------------:|----------------:|----------------:|
| OR=1.0, balanced       | −0.004 / 0.953 | −0.004 / 0.954 | −0.004 / 0.969 |
| OR=0.5, balanced       |  0.023 / 0.964 | −0.009 / 0.957 |  0.034 / 0.973 |
| OR=0.2, balanced       |  **0.269 / 0.813** | −0.026 / 0.957 |  0.211 / 0.916 |
| OR=0.5, imbalanced 4:1 |  **−0.130 / 0.859** |  0.010 / 0.957 | −0.025 / 0.970 |
| OR=2.0, imbalanced 4:1 |  **−0.133 / 0.865** |  0.005 / 0.954 | −0.046 / 0.957 |

## Findings (all measured)
1. **VALIDATION — at the null (OR=1) all three methods are unbiased with nominal
   coverage** (bias ≈ 0, coverage 0.95). The engine's rare-event math is correct.
2. **Peto OR is biased and under-covers when the OR is far from 1.** At OR=0.2 its
   log-bias is +0.27 (it pulls the estimate ~⅓ of the way back toward the null) and
   coverage falls to **0.81**. This is the documented Peto bias (Greenland-Salvan /
   Bradburn 2007), reproduced.
3. **Peto OR is biased and under-covers under arm imbalance.** With a 4:1 arm-size
   ratio its bias is ±0.13 and coverage drops to ~0.86 at both OR=0.5 and OR=2.0 —
   again as documented.
4. **Mantel-Haenszel (RBG) is the robust truth-recoverer.** It has near-zero bias
   (|bias| ≤ 0.026) and nominal coverage (0.954–0.957) in EVERY scenario — strong
   effects, imbalance, and the null alike. DL is intermediate (biased at OR=0.2 but
   better than Peto).

## Recommendation
Make **Mantel-Haenszel the default / recommended estimator** for rare-event safety
meta-analyses, and surface a warning that the Peto OR is biased when the pooled OR
is far from 1 or the arms are unbalanced (per the Cochrane Handbook). All three
methods are correctly implemented; this is a default/guidance fix, not a code bug.

## What did NOT transfer
The rare-event 2×2 DGP is bespoke (binomial counts, low rates, zero cells);
NPE/conformal machinery is not needed. The shipped pooling functions are run
unchanged.

## Reproduce
```
node truth-recovery/harness.mjs --reps 4000
node --test truth-recovery/test-truth-recovery.mjs
```
