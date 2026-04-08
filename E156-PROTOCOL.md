# E156 Protocol — SafetyMA

**Project**: SafetyMA
**Created**: 2026-04-09
**Type**: methodological
**Estimand**: Peto odds ratio for rare adverse events
**Dashboard**: https://mahmood726-cyber.github.io/SafetyMA/

## E156 Body (154 words, 7 sentences)

Can a browser tool perform pharmacovigilance meta-analysis with the statistical rigor required for rare safety outcomes? We implemented three pooling methods — Peto odds ratio (no continuity correction), Mantel-Haenszel with Robins-Breslow-Greenland variance, and DerSimonian-Laird random effects — with explicit handling of zero-cell and double-zero studies. Zero-cell corrections include traditional (0.5), reciprocal of treatment-arm balance, and Sweeting's empirical method; double-zero studies are excluded by default since they carry no information for the odds ratio. Applied to the Nissen 2007 rosiglitazone dataset (42 trials, 27 with zero events), Peto OR replicates the landmark finding of increased myocardial infarction risk. Sequential safety monitoring uses cumulative Peto OR with O'Brien-Fleming spending boundaries (z_alpha / sqrt(information fraction)) to detect emerging signals without inflating type I error. Visualizations include forest plots, L'Abbe risk plots, cumulative monitoring charts, and funnel plots. The tool does not support time-to-event safety outcomes or network pharmacovigilance across multiple drugs.
