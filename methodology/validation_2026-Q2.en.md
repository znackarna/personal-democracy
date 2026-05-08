# Validation report — 2026-Q2

Generated automatically 2026-04-29 by `pipeline:validate`. Per [methodology/governance.md](governance.md) and the [CLAUDE.md "Validation" section](../CLAUDE.md).

## Baseline divergence

Our structural baseline (weighted overall) = **85.0**.

Threshold for a methodology review: persistent divergence > **10** points across two consecutive quarters against a **reference** index (V-Dem or EIU). Short-term deviations are tolerated — our score weights pillars differently from external indices and includes a weekly event component.

| External index | External (0–100) | Compared target | Value | Δ | Above threshold? |
|---|--:|---|--:|--:|:--:|
| V-Dem (2024) | 81.7 | baseline overall | 85.0 | +3.3 | ✓ |
| EIU (2024) | 80.8 | baseline overall | 85.0 | +4.2 | ✓ |
| FH-FitW (2025) | 95.0 | baseline overall | 85.0 | -10.0 | ✓ |
| RSF (2025) | 84.0 | pillar media | 92.0 | +8.0 | ✓ |
| TI-CPI (2024) | 59.0 | pillar corruption | 59.0 | +0.0 | ✓ |
| WJP (2024) | 74.0 | pillar judicial | 83.9 | +9.9 | ✓ |

Single-dimension indices (RSF, TI CPI, WJP) are compared with a specific pillar, not with the overall score. RSF↔media, TI CPI↔corruption, WJP↔judicial. Multi-dimension (V-Dem LDI, EIU, FH FitW) are overall composites → compared to our weighted overall.

**Conclusion:** no external index shows divergence > 10 pts. The baseline is within normal variability.

## Latest snapshot vs baseline

Latest snapshot: **2026-W17** — overall **84.3**.
Shift from baseline: **-0.7 pts** (from 8 active events).

| Pillar | Baseline | Snapshot | Δ |
|---|--:|--:|--:|
| electoral | 91.8 | 91.8 | +0.0 |
| governance | 86.3 | 84.3 | -2.0 |
| judicial | 83.9 | 83.4 | -0.5 |
| media | 92.0 | 91.5 | -0.5 |
| civil | 96.9 | 96.4 | -0.5 |
| corruption | 59.0 | 58.5 | -0.5 |

## Per-pillar diagnostics

Mapping recap (from `methodology/structural_mapping.md`):

- **electoral** (15 %) = 91.8
- **governance** (20 %) = 86.3
- **judicial** (20 %) = 83.9
- **media** (15 %) = 92.0
- **civil** (15 %) = 96.9
- **corruption** (15 %) = 59.0

If divergence in section 1 crosses the threshold, investigate which pillar contributes most. Common sources of noise:
- `corruption` has only TI CPI (single source), so our pillar = TI CPI exact value. Any divergence must come from elsewhere.
- `judicial` uses WJP overall as a proxy (per-factor data unavailable). Divergence against WJP itself = 0.
- FH uses a 4-point scale across 7 categories, so small differences in FH get amplified when normalised to 0–100.

---

_This report is generated automatically via `npm run pipeline:validate -- --quarter=<Q>`. For new quarters a new file is created; existing ones are overwritten after a new run (versioning is kept by git)._
