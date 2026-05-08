# Pillar weights — reasoning

## Current weights (v0.1)

| Pillar | Weight | Note |
|---|---|---|
| `electoral` | 15 % | Electoral process and pluralism |
| `governance` | **20 %** | Separation of powers, legislative quality |
| `judicial` | **20 %** | Judicial independence, rule of law |
| `media` | 15 % | Media freedom and plurality |
| `civil` | 15 % | Civil liberties |
| `corruption` | 15 % | Corruption and transparency |

Sum = 100 %.

> **Status: v0.1 draft (2026-04-28). Requires review.**

---

## The weighting principle

Weights are a normative choice. This document explains **why these particular values**, not **which value is objectively correct** — no such value exists.

Considerations that drove the weights:

1. **Empirical backsliding literature.** Studies of democratic backsliding (Bermeo 2016, Levitsky & Ziblatt 2018, V-Dem reports 2020+) repeatedly identify attacks on **judicial independence** and on the **quality of the legislative process** as the most common and most effective channels of erosion. That is why `judicial` and `governance` get a slightly higher weight (20 % each).
2. **Detectability between annual updates.** The project’s goal is timely detection of directional change. `electoral` changes rarely (Chamber-of-Deputies elections every 4 years); `media` and `corruption` are tracked continuously. Higher event frequency in a pillar does not mean higher weight — that would distort the score. So **frequency alone does not affect the weight**.
3. **Independence of dimensions.** The pillars are designed to be as independent as possible (see [`pillars.md`](pillars.md), section on overlap). Equal weights match the hypothesis that they are comparably important; the differentiated 15/20 reflects empirical evidence that some are channels of faster backsliding.

---

## Discussion of alternatives

### A) Equal weights (16.67 % each)

**Pro:** Simple, no subjective input, easy to defend as "neutral". V-Dem uses equal weights in some sub-indices.

**Con:** It implicitly says, for example, that full removal of judicial independence weighs the same as a local media incident of similar severity. Empirically this isn’t how democracies die.

**Conclusion:** Rejected, but equal weights are a useful **control calculation** — the index should also be displayed in this variant on the methodology page for transparency.

### B) `judicial` and `governance` at 25 % each (the remaining 50 % distributed equally)

**Pro:** Stronger emphasis on structural dimensions, more consistent with the literature.

**Con:** Marginalises `civil` and `media`, which are very live in the Czech context (media concentration, minority protection). Risk that important trends in these areas disappear in the overall score.

**Conclusion:** Rejected as too aggressive. If validation shows that `judicial` + `governance` correlate with EIU/V-Dem more than other pillars, v0.2 could move towards 22.5/22.5.

### C) Dynamic weights (context-dependent)

**Pro:** Adaptive to the situation.

**Con:** Destroys comparability over time. Backtesting stops making sense. Opens up vast room for motivated manipulation ("in this situation we’re weighting the judiciary higher because…").

**Conclusion:** **Permanently rejected.** Weights must be fixed within a version of the methodology.

---

## Rules for changing weights

1. Changing weights = **a new methodology version** (v0.1 → v0.2). It’s not a fix, it’s a revision.
2. Every change requires:
    - A commit to [`weights.md`](weights.md) and [`CHANGELOG.md`](CHANGELOG.md) with explicit reasoning.
    - **Recomputation of the entire historical score series** with the new weights and storage of both series (v0.x and v0.y) in `data/scores/`. The old version doesn’t disappear.
    - The change marked in the dashboard.
3. A change can only be proposed:
    - After **quarterly validation** (see `methodology/validation_YYYY-Qx.md`), if the index persistently and systematically diverges from EIU/V-Dem by > 10 points in a direction that cannot be explained by current events.
    - After a substantial methodology change at one of the primary sources (V-Dem fundamentally re-computes EDI, EIU changes sub-categories).
4. Weights can **never** be changed in response to a specific political outcome (election, crisis) — that would be a clear signal of motivated adjustment.
