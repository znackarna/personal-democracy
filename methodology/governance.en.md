# Governance model — oversight without a pre-merge gate

> **Status: v0.2 design (2026-04-28).** Implementation in iteration 7. This document is the binding spec for that iteration.

## Philosophy

The weekly pipeline **commits automatically**. There is no mandatory pre-merge human review.

The reason: pre-merge review as the only quality brake means the index’s quality is tightly bound to one person’s capacity and consistency. If Jakub has a busy week, either the index doesn’t come out, or it comes out fast and wrong. Second problem: in this mode, pre-merge review often degrades into rubber-stamping — the reviewer sees 14 events, most look reasonable, approves. Real errors (subtle bias, inaccurate severity) slip through.

Instead: **multiple oversight layers, none of them blocking.** The index publishes; quality is held by:

1. **Self-audit** — a separate LLM pass with a separate prompt that critiques its own output
2. **Deterministic rule-based gates** — source-count → severity cap, dedupe conflicts → `disputed`
3. **Daily reports** — a structured audit trail a reviewer can comb through asynchronously
4. **Anomaly detection** — automatic issue on exceptional weeks, non-blocking
5. **Monthly spot-check** — random sample for manual verification, calibration
6. **Public dispute mechanism** — anyone can challenge a specific classification

No layer is sufficient on its own. Together they hold quality.

## Layer 1 — Self-audit pass

**Implementation:** `src/pipeline/audit.ts`, `prompts/audit.md`. Runs after classification and dedupe, before writing to `data/events/`.

**Input:** generated events + run metadata (count of pre-filtered articles, distribution of pillars/severity/direction).

**Auditor prompt** (separate from `prompts/classification.md`, sharing the pillars + rubric context):
- Has no knowledge of who classified — only sees the output
- Goes through the anti-bias checklist per event
- Specifically looks for:
  - Severity disproportionate to the rationale (3 with a rationale like "verbal statement without impact")
  - Disputed direction (e.g. enforcement → -1 instead of +1)
  - Pillar misassigned per the criteria in pillars.md
  - Quotes > 15 words
  - Rationale without an explicit reference to the rubric
  - Asymmetry across the political spectrum (events about party X consistently get worse severity than comparable ones about party Y)

**Auditor output:** structured JSON with per-event verdict (`pass | flag | downgrade`) plus an aggregate evaluation of the distribution.

**Action:**
- `pass` → event stays as is
- `flag` → status remains `active`, but the auditor note is appended to the rationale and logged in the report
- `downgrade` → status is overwritten to `needs_review`, severity is not changed

**The auditor DOES NOT REWRITE the classification** — it only flags. Changing severity/direction requires a commit. This is important: the auditor is a second opinion, not a dictatorship.

**Cost:** ~$0.20 per weekly run (Sonnet, 1 call with cached methodology context, input ~5K tokens, output ~3K).

## Layer 2 — Deterministic rule-based gates

These rules are enforced by code in `src/pipeline/`, not by an LLM. They are deterministic and auditable.

### Source-count → severity cap

Per CLAUDE.md principle 4: **multi-source documentability = a necessary condition for higher severity.**

| Severity | Minimum number of independent sources |
|---|---|
| 1, 2 | 1 |
| 3 | 2 |
| 4, 5 | 3 |

"Independent sources" = different `outlet`. Two URLs from `denikn.cz` count as 1 source.

**Action on violation:** severity is automatically downgraded to the highest supported level. A note `[severity capped from N to M due to source-count rule]` is appended to the rationale. The score impact is recomputed.

**Implementation:** `src/pipeline/cap-severity.ts`, called after dedupe and before score computation. 100 % test coverage.

**Consequence:** sharp one-off stories (severity 5) **must have 3+ outlets**. If a case sits for 24 hours on Deník N alone, severity is automatically capped at 3 (the max for single + dual outlet coverage).

### Dedupe → disputed

Already implemented in iteration 4 (`src/pipeline/dedupe.ts`). If two outlets describe the same event with different direction or severity, they are merged into a single event with `status: disputed`. Disputed events are shown on the website but with a "coverage dispute" visual marker.

## Layer 3 — Daily reports

**Implementation:** `src/pipeline/report.ts`. Written to `data/reports/YYYY-MM-DD.md` on every pipeline run.

**Format:**

```markdown
# Daily report — YYYY-MM-DD (week YYYY-Wxx)

## Source coverage
- Deník N: 40 articles fetched
- iROZHLAS: 20 articles
- ...
Total: N articles

## Pre-filter
- Kept: M (kept rate %)
- Dropped: N - M
- Drop reasons: { "sport": 12, "opinion": 5, ... }

## Classification
- Events: K (severity distribution: 1/2/3/4/5 = a/b/c/d/e)
- Pillars: { "judicial": 4, "governance": 3, ... }
- Direction: { "+1": x, "0": y, "-1": z }
- Auto-downgraded by source-count rule: P
- Disputed (dedupe conflict): Q

## Self-audit
- Pass: A
- Flagged: B (list IDs + auditor note)
- Downgraded to needs_review: C (list IDs + reason)
- Aggregate anti-bias check: { pass | flagged with explanation }

## Score change
- Before: 70.3
- After: 68.4
- Per-pillar deltas: ...

## Anomalies
- (None) | Auto-issue opened: #N (link)

## Per-event detail
For each event, structured: id, headline, pillar, severity, direction, rationale (with explicit rubric anchor), sources, audit verdict.
```

Reports are committed to git. They serve as a long-term audit trail a reviewer can browse monthly/quarterly, not weekly.

## Layer 4 — Anomaly detection (auto GitHub issue)

**Implementation:** `src/pipeline/detect-anomalies.ts`, calls the GitHub Issues API.

**Triggers (any of these):**
1. The week has > 5 events (typically 3–5 → anything > 5 deserves attention)
2. Any event has severity 5
3. A pillar score moves > 5 points from the previous week (before applying new events)
4. The self-audit flags ≥ 50 % of events (signals a systemic problem)
5. A single outlet is the source for > 50 % of events (a source-diversity violation)

**Action:** opens a GitHub issue with the `anomaly` label and the body:

```
## Anomaly detected — week YYYY-Wxx

Trigger: <which one(s) above>

Brief stats: <relevant numbers>

Daily report: data/reports/YYYY-MM-DD.md
Events file: data/events/YYYY-Wxx.json

Please verify the classification. **The index has been published normally** — this issue is an oversight ping, not a blocker.

If you find an error, edit data/events/YYYY-Wxx.json directly and commit; recompute-scores workflow will update the timeline.
```

**Important:** the issue does NOT stop the pipeline. The index commits and publishes. The issue is an informational channel.

## Layer 5 — Monthly spot-check

**Implementation:** GitHub Actions workflow `monthly-spotcheck.yml`, trigger `cron: '0 8 1 * *'` (1st of month, 08:00 UTC).

**Action:** goes through all events from the previous month, picks 10 at random (deterministically, seed = month string), opens a GitHub issue:

```
## Monthly spot-check — YYYY-MM

10 random events from last month for human verification:

1. **2026-W17-003** | corruption, severity 3, direction +1 | NCOZ ...
   - Sources: Deník N, Aktuálně.cz
   - Rationale: ...
   - [ ] I agree with classification
   - [ ] Disagree (specify below)

2. ...
```

The reviewer goes through the issue, ticks the boxes, optionally comments. Disagreements feed back as **calibration** — they aren’t retroactive edits to events (events decay in 12 weeks anyway), but a signal for future prompt tuning.

**Non-blocking, no change to existing data.**

## Layer 6 — Public dispute mechanism

**Implementation in iteration 6 (dashboard):** every event card on the site has a "Dispute classification" button.

**Target:** the GitHub issue template `dispute.md` with pre-filled fields:
```
Title: Dispute: <event-id> — <headline>

## Current classification
- Pillar: <pillar>
- Severity: <severity>
- Direction: <direction>
- Rationale: <rationale snippet>
- Sources: <list>

## Why this classification is incorrect
<reporter free text>

## Proposed alternative
<optional>
```

**Workflow `dispute-handler.yml`:** auto-labels the new issue with `dispute`, adds a comment with links to methodology docs for context, assigns it to Jakub.

Disputes are handled manually. If the same type of dispute recurs (e.g. "severity too low for X cases"), that’s a signal to adjust the rubric / prompt, not to retroactively edit a specific event.

## Failure-mode analysis

**What if the self-audit has a systematic blind spot (e.g. it shares a pro-government bias)?**

Mitigation: the monthly spot-check and the public dispute mechanism are independent of the LLM. The quarterly validation against EIU/V-Dem (CLAUDE.md "Validation" section) detects systematic divergence.

**What if anomaly detection is too noisy (an issue every week, easy to ignore)?**

Mitigation: thresholds will be calibrated after the first 3 months. Trigger #1 (>5 events) can be calibrated to median + 2σ from the first weeks, not a fixed 5.

**What if GitHub Actions fails and the pipeline doesn’t run for 2 weeks in a row?**

Mitigation: a simple additional `health-check.yml` workflow runs daily and pings an issue if the last successful pipeline run was > 8 days ago.

**What if Jakub goes offline for weeks?**

That’s fine. The index updates itself. Reports and issues will wait. The public still gets continuous data.

**What if a bug in the rubric/prompt produces systematically wrong events for whole weeks?**

Mitigation: the quarterly validation (correlation with EIU/V-Dem) detects it. Backtesting (iter 9+) checks it historically. The public dispute mechanism catches concrete examples.

## Open questions

1. **Threshold for the source-count rule.** Current proposal 1/2/3 for severity 1-2/3/4-5. Alternative: 1/2/2 (lighter). Discussion: a quality investigative story can sit on Deník N or Investigace.cz alone — a dual-source rule would penalise it. Compromise: for qualified Czech investigative outlets (Deník N, Investigace.cz, Reportéři ČT, A2larm) add an exception so single-source can have max severity 3.

2. **Monthly spot-check sample size.** 10 events from a month of ~50–100 events = 10–20 % sampling. Statistically thin. Maybe better 20 events or stratified by pillar.

3. **Auditor — same model as the classifier?** Current plan: both Sonnet 4.6. Alternative: auditor = Opus 4.6/4.7 (more expensive, but stronger critique). Decision pending the first test pass.

All questions get resolved in iteration 7 during implementation.
