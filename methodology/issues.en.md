# Methodology issues

This is where **Claude and people** record problems and questions encountered while working with the methodology that **must not** be resolved by changing the methodology without explicit approval (see [`CHANGELOG.md`](CHANGELOG.md)).

Format:

```
## YYYY-MM-DD — short title

**Context:** What happened, where, which event or PR triggered it.

**Problem:** What specifically in the methodology is unclear, contested, or has proven inadequate.

**Proposed resolution (optional):** If the author has a proposal; otherwise leave empty for the reviewer to decide.

**Status:** open | discussed | resolved (with a link to the CHANGELOG entry).
```

---

## 2026-04-28 — Structural baseline 2026-Q2 is a placeholder

**Context:** Iteration 3 created `data/structural/2026-Q2.json` so the first end-to-end pipeline run could be triggered. The pillar values are credible-looking numbers for the Czech context, but they are **not** derived from published extractions of V-Dem/EIU/FH/RSF/TI/WJP.

**Problem:** Mapping external indices to our 6 pillars is methodologically non-trivial:
- V-Dem has dozens of components — which belong to `judicial`, which to `governance`?
- EIU has 5 categories — how are they projected onto 6 pillars?
- TI CPI is a single number — does it all go into `corruption`?
- WJP Rule of Law has 8 factors — how are they distributed?

Without an explicit, documented mapping (per pillar: which external components, with which weights, normalised to 0–100 how) the score cannot be published in good faith. A placeholder is fine for development and end-to-end validation, but the dashboard must not publish until the mapping is resolved.

**Proposed resolution:** Iteration 4 (or earlier) — create `methodology/structural_mapping.md` with explicit per-pillar mapping. Then recompute 2026-Q2.json and all historical baselines. Consider validating the mapping by backtesting (apply retroactively to 2018–2020 and compare with V-Dem scores from that time).

**Status:** open.

## 2026-04-28 — First live run: prompt-tuning issues to fix

**Context:** Iteration 3 ran the pipeline against 4 RSS feeds (Deník N, iROZHLAS, Aktuálně, Investigace) for week 2026-W17. Output: 90 articles → 32 pre-filtered (Haiku) → 17 valid events (Sonnet). Score dropped from baseline 70.3 to 69.4. File: `data/events/2026-W17.json`.

**Observed quality issues:**

### 1. Hallucinated years in the `date` field
Sonnet filled in `date: 2025-04-28` or `2025-05-06` for many events instead of `2026-XX-XX`, even though the prompt says "the date the event occurred". Examples: ids 001, 002, 003, 004, 006, 007, 008, 014, 015, 016, 017. Some events correctly carry 2026 (009, 010, 011, 012, 013).

**Impact:** events dated 2025 are already 52 weeks old for one_off → agedImpact = 0, so they don’t contribute to the score. Persistent events work, but it’s fragile.

**Proposed fix:** explicitly add the current date in every batch’s user message (`Today: 2026-04-28`). Sonnet probably leans on its training-cutoff date instead of the actual context.

### 2. Duplicate event across sources
The same event reported by 2 outlets = 2 records with different severity/direction. Specific pairs in 2026-W17:
- 003 (Deník N) ↔ 017 (Aktuálně.cz) = NCOZ Příbram, severity 3 in both, but direction differs (-1 vs +1)
- 013 (iROZHLAS) ↔ 014 (Aktuálně.cz) = Klempíř public-broadcaster law, severity 3 both
- 004 (Deník N) ↔ 006 (Deník N) = Zůna NATO statement, severity 2 vs 3, both on the same statement

**Impact:** double-counted impact, the score skewed downward. Events 003+017 net to -1.5 + +1.5 = 0 but should have been a single record.

**Proposed fix:** dedupe step after classification — compare headline/date/pillar pairs via embedding similarity or a simple heuristic (same day + same pillar + Levenshtein < threshold) → merge sources, keep severity from the consensus or the lowest.

### 3. Direction `0` events
Events 009 (Grolich KDU congress) and 010 (NATO tribunal) have `direction: 0` or `+1` with severity 1 → score_impact -0.0 or +0.2. For the project goal (tracking institutional shifts) these are noise — they should be filtered in the pre-filter as "background context, not an institutional event".

**Proposed fix:** tighten the pre-filter prompt — drop articles describing routine party events (leadership elections), standard diplomatic moves without controversy, ceremonial occasions.

**Status:** ✅ resolved in iteration 4 (commit 14d9b1f).

- Issue 1 (hallucinated years): fixed by adding `Today` + `Reference week` headers to the user message in `extract-events.ts` and passing `published_at` per article. Re-run: 14/14 events dated 2026 (previously 6/17).
- Issue 2 (duplicates): fixed by a new module `src/pipeline/dedupe.ts` (Czech-aware Jaccard over 5-character prefixes, conflict detection → `disputed`). Re-run: NCOZ Příbram correctly merged into one disputed event.
- Issue 3 (noise): fixed by tightening the pre-filter prompt with explicit drop categories (congresses, ceremonial, background context). Re-run: 0/14 events with `direction: 0` (previously 2/17).

## 2026-04-29 — Source-density asymmetry across periods: the score is not a clean time-series

**Context:** After backfilling 2025 history (Wayback Machine + curated seed) the timeline 2025-W04 → 2026-W18 is in place. Looking at it, the curve is non-linear:

```
2025-W04:  84.8 (events_active=7,   4 sources × Wayback)
2025-W18:  83.7 (events_active=44,  4 sources × Wayback, peak of H1 backfill)
2025-W27:  84.5 (events_active=26,  curated seed — only 0.6 events/week)
2025-W51:  84.2 (events_active=27,  curated seed)
2026-W17:  83.0 (events_active=49,  19 sources × live pipeline)
2026-W18:  81.0 (events_active=92,  19 sources × live pipeline)
```

Between 2025-W18 and 2025-W27 the score actually **rises** (-0.7 → +0.8), which makes no methodological sense. Likewise the jump from 2025-W51 (84.2) to 2026-W17 (83.0) by three points in a single week isn’t a real change in the state of democracy.

**Problem:** Score in a given week = baseline + Σ aged_impact(active events history). The `score.ts` function is deterministic and correct. But the curve is shaped by **monitoring density**, which is changing:

| Period | # sources | Path | Events / week |
|---|---|---|---|
| 2025-W04 → W19 | 4 | Wayback backfill | ~4 |
| 2025-W20 → W51 | 4 (curated seed) | 20 hand-picked URLs | ~0.6 |
| 2026-W17 → | 19 | Live pipeline | ~50 |

Persistent events accumulate, but when data flow stops (curated seed covers H2 sporadically), no new persistent events come in and one-offs decay → the score lifts off from the baseline. After moving to the 19-source pipeline (2026), events suddenly arrive en masse → drop in the score.

**Implication for publishing:** the score cannot be presented as a comparable indicator between 2025 and 2026. A view like "Czechia was at 84.2 in 2025-W51, 83.0 in 2026-W17, does that mean a deterioration?" is misleading — the primary explanation is more sources observing more events, not a real deterioration.

**Proposed resolutions (for discussion, none of them is trivial):**

1. **Normalise event impact by source intensity.** Instead of an absolute sum of impacts, use `Σ impact / activeSourceCount × reference_count` (where `reference_count` = some stable value, e.g. 4 as a "minimal monitoring"). Risk: blurs the relation between a real event and its impact; the calibration of the severity rubric is tied to absolute values.

2. **Backfill history through all 19 sources.** Unfortunately the Wayback Machine doesn’t index most modern sources (Hlídač API, PSP HTML, ÚS RSS, foreign RSS) for 2025. Some could be obtained from PSP OpenData voting dumps, news web archives (CzechELib), GRECO/ECHR datasets. High effort.

3. **Accept the asymmetry and communicate it explicitly.** A disclaimer on the dashboard: "Pre-2026-W17 data is from a smaller pool of sources; trend comparisons across periods may not be fully comparable." The score isn’t adjusted. The methodology document describes the limit.

4. **Rolling-window severity benchmark.** Instead of comparing absolute scores, compare a 90-day rolling window against a baseline for the same window. Reduces the effect of a sudden source expansion, but also reduces the signal from real shocks.

**Status:** open. Recommendation: for short-term presentation (through 2026-Q3) approach 3 (disclaimer + documentation). For long-term comparability, consider a combination of 1 + 2.

## 2026-04-29 — Pipeline cadence: daily classify + weekly aggregate

**Context:** The weekly cron (Mon 06:00 UTC) was losing significant content because of short RSS retention on some feeds:
- iROZHLAS retention ~1 day (20 items / ~20 articles/day) — the weekly cron gets ~14 % of the content
- HN, Aktuálně, ČT24 retention ~3 days — we lose ~57 % weekly
- Deník N retention ~5 days — loss ~30 %

**Change implemented 2026-04-29 (iter 16):** the pipeline is split into two phases.

- **Daily run** (`run-daily.ts`, cron `0 6 * * *`): fetch + URL-dedupe + Haiku pre-filter + Sonnet classify + cap + merge into `data/events/<current-week>.json`. No score / report / anomaly check.
- **Weekly aggregate** (`aggregate-weekly.ts`, only Monday): audit accumulated events + score snapshot + anomaly detection + report + commit.

**The key optimisation** is the URL-dedupe gate before the pre-filter: each daily fetch typically sees ~80 % of articles that have already been classified on previous days (RSS feeds change only marginally day to day). These are dropped before calling the Anthropic API. Without this optimisation, daily would be 7× more expensive than weekly.

**Cost impact:** weekly cost ~$3-4, daily cost (with URL-dedupe) ~$3-4. Audit runs only once a week (Monday), keeping the cost under $20/month.

**The methodology is unchanged** — the score function, weights, rubric, pillars, and anti-bias remain identical. Only the observation frequency (= measurement density) changes, not the scale or the interpretation.

**Status:** ✅ implemented (commit ed Monday, see CLAUDE.md iter 16).
