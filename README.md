# SafetyMA

[![ci](https://github.com/mahmood726-cyber/SafetyMA/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/mahmood726-cyber/SafetyMA/actions/workflows/ci.yml) [![codeql](https://github.com/mahmood726-cyber/SafetyMA/actions/workflows/codeql.yml/badge.svg?branch=master)](https://github.com/mahmood726-cyber/SafetyMA/actions/workflows/codeql.yml) [![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![python: 3.10+](https://img.shields.io/badge/python-3.10%2B-blue)](https://www.python.org/)

Browser-based pharmacovigilance meta-analysis for drug safety outcomes.

## Methods
- **Peto OR** — gold standard for rare events (<1%), no zero-cell correction needed
- **Mantel-Haenszel OR** — with Robins-Breslow-Greenland variance
- **DL Random Effects** — standard random-effects on log OR scale
- **Sequential monitoring** — cumulative Peto OR with O'Brien-Fleming boundaries

## Zero-Cell Handling
- Traditional (add 0.5)
- Reciprocal (treatment-arm balance)
- Empirical (Sweeting)
- Double-zero: exclude (default) or include with correction

## Plots
- Forest plot with study-level ORs
- L'Abbe plot (treatment vs control event rates)
- Cumulative safety monitoring chart
- Funnel plot

## Examples
- Rosiglitazone & MI (Nissen 2007, 42 trials)
- SSRIs & Suicidality (rare events)
- NSAIDs & GI Bleeding

## Live Demo
https://mahmood726-cyber.github.io/SafetyMA/

## Author
Mahmood Ahmad, Tahir Heart Institute
