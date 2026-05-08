# Methodology CHANGELOG

Every change to the methodology (pillars, weights, rubric, guard-rails) is recorded here with the date, author and reasoning. Changes require recomputation of the historical series — see [`weights.md`](weights.md), rules for changing weights.

## v0.2.2 — Structural baseline 2026-Q3 (EIU 2025 update, 2026-04-30)

EIU Democracy Index 2025 published in April 2026. A new baseline file
`data/structural/2026-Q3.json` was created reflecting the only change against Q2:

- **EIU 2024 → 2025: 8.08 → 8.15** (+0.07). CZ rank 23 unchanged, classification
  "full democracy" confirmed (4th year in a row after returning from "flawed" in 2023).
- EIU 2025 sub-pillars: electoral process 9.58, functioning of government 7.86,
  political participation 7.22, political culture 8.13, civil liberties 8.57.

**Impact on our index:**
- `governance` pillar: (81.5 + 91.75) / 2 = **86.6** (was 86.3, +0.3)
- Weighted overall: ~85.06 (was 85.0, +0.06). A small upward shift.

**No other external indices changed in this cycle** — V-Dem 2024, FH 2025,
RSF 2025, TI 2024, WJP 2024 remain identical. Real updates we missed:
- TI CPI 2025: January 2026 (missed — TODO add to Q4 baseline)
- FH 2026: March 2026 (missed — TODO add to Q4 baseline)
- RSF 2026: May 2026 (pending)
- WJP 2025: October/November 2025 (missed — TODO add to Q4 baseline)
- V-Dem 2025 dataset: typically spring (pending)

For v0.3 (iter 18+) consider moving the governance pillar from **EIU overall (8.15)**
to the **EIU Functioning of government sub-pillar (7.86)** — a more accurate mapping,
but a methodology change requires user approval + recomputation of the historic timeline.

The workflow YAML default was updated from `2026-Q2` → `2026-Q3`. The recompute scores
runs automatically.

**No change to pillars, weights or rubric.**

## v0.2.1 — Quarterly validation framework (2026-04-29, iter 9)

Added `methodology/validation_<quarter>.md` — an automatically generated report
comparing our index with external benchmarks (V-Dem, EIU, FH, RSF, TI, WJP).

The key comparison rule:
- Multi-dimension overall composites (V-Dem LDI, EIU Democracy Index,
  Freedom House FitW) → compared to our weighted overall
- Single-dimension indices (RSF press freedom, TI CPI corruption, WJP rule
  of law) → compared to a specific pillar (RSF↔media, TI↔corruption,
  WJP↔judicial)

**Action threshold:** persistent divergence > 10 points across 2 consecutive
quarters against a reference index (V-Dem or EIU) = open a `methodology-review`
issue and run a per-pillar audit of the mapping.

The first report (2026-Q2) shows no threshold breach:
- V-Dem 81.7 vs our overall 85.0 → +3.3 (normal)
- EIU 80.8 vs overall 85.0 → +4.2 (normal)
- FH 95 vs overall 85.0 → -10.0 (right on the edge, FH long-term
  generous towards CZ)
- RSF 84 vs media 92 → +8 (FH D=100 averaging up)
- TI CPI 59 vs corruption 59 → 0 (perfect match — the corruption pillar IS TI CPI)
- WJP 74 vs judicial 83.9 → +9.9 (FH F=93.75 averaging up)

No change to pillars, weights or rubric.

## v0.2 — Governance model: oversight without a pre-merge gate (2026-04-28)

**Major change.** Principle #6 in CLAUDE.md ("Human review is mandatory before merge") is removed and replaced with a multi-layer oversight model that does not block publication.

The new model — see `methodology/governance.md`:
1. Self-audit pass — a separate Sonnet call with `prompts/audit.md`, critiques its own output, can flag to `needs_review`
2. Source-count → severity cap — deterministic TS rule: severity ≥ 3 requires ≥ 2 independent outlets, ≥ 4 requires ≥ 3
3. Daily reports in `data/reports/YYYY-MM-DD.md` — structured audit trail
4. Anomaly detection — auto GitHub issue when >5 events/day, severity 5, pillar shift >5pt, ≥50 % auditor-flagged, single outlet >50 %; **does not block publication**
5. Monthly spot-check — auto issue on the 1st of the month with 10 random events for human verification, non-blocking calibration
6. Public dispute mechanism — "Dispute classification" link on every event → GitHub issue template

Reason for the change: pre-merge review as the only brake means quality = Jakub’s personal capacity. Multiple oversight layers, none blocking, gives a more robust system — the index publishes continuously, quality is held by defensive infrastructure.

Implementation: iteration 7 (before turning on the GH Actions cron, which is iter 8). The source-count rule is a separate TS function and can be added earlier independently if the need arises.

**No change to pillars / weights / severity values.** The anti-bias checklist in CLAUDE.md stays the same in content, only **who** runs it changes (the auditor Claude pass + deterministic rules instead of Jakub pre-merge).



## v0.1.4 — Prompt tuning + dedup infrastructure (2026-04-28, iter 4)

- Added infrastructure to catch duplicate events across sources (`src/pipeline/dedupe.ts`). The merge is deterministic and tags a direction/severity conflict as `status: disputed`. This is not a change to the **methodology**, but it affects how events are finalised. Merge rules:
  - Same pillar
  - Date ±3 days
  - Headline Jaccard ≥ 0.3 over 5-character prefixes of tokens (Czech inflection-friendly)
- Pre-filter prompt extended with explicit drop categories (routine party events, ceremonial diplomatic acts, background context). No change to pillars or weights.
- Classification prompt: explicit `Today` and `Reference week` as a temporal frame so Sonnet doesn’t hallucinate the year.

## v0.1 — Initial methodology draft (2026-04-28)

- Six pillars established: `electoral`, `governance`, `judicial`, `media`, `civil`, `corruption`.
- Weights set to 15/20/20/15/15/15. Higher weight for `governance` and `judicial` motivated by the democratic backsliding literature.
- Severity rubric 1–5 with impacts ±0.2 / ±0.5 / ±1.5 / ±3.0 / ±6.0.
- One-off events decay linearly over 12 weeks.
- Persistent events stay until an explicit `status: resolved` change.

**Status: draft, requires review before the first production week.**
