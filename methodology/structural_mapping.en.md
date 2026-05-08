# Structural mapping — external indices → pillars

> **Status: v0.2 (2026-04-28).** First production mapping. Replaces the placeholder from iteration 3.

## Principle

Each pillar (electoral, governance, judicial, media, civil, corruption) gets a 0–100 score as a **weighted average of normalised values from selected external indicators**. Indicators are chosen so that every pillar has ≥ 1 source, ideally ≥ 2 independent ones.

The mapping is **explicit and fixed within a methodology version**. Changes require a bump in `methodology/CHANGELOG.md` and recomputation of the historical series.

## External indices used (Q2 2026)

| Index | Year | CZ value | Original scale | Normalised 0–100 | Source |
|---|---|---|---|---|---|
| V-Dem Liberal Democracy Index | 2024 | 0.817 | 0–1 | 81.7 | [v-dem.net](https://v-dem.net/) |
| EIU Democracy Index | 2024 | 8.08 | 0–10 | 80.8 | [EIU 2024 PDF](https://d1qqtien6gys07.cloudfront.net/wp-content/uploads/2025/03/Democracy_INDEX_2024.pdf) |
| Freedom House FitW | 2025 | 95 (PR 37, CL 58) | 0–100 (40+60) | 95 | [freedomhouse.org/country/czechia/freedom-world/2025](https://freedomhouse.org/country/czechia/freedom-world/2025) |
| RSF Press Freedom Index | 2025 | 83.96 (rank 10) | 0–100 | 83.96 | [rsf.org](https://rsf.org/en/index) |
| TI Corruption Perceptions Index | 2024 | 59 (rank 39) | 0–100 | 59 | [transparency.org](https://www.transparency.org/en/cpi/2024/index/cze) |
| WJP Rule of Law Index | 2024 | 0.74 (rank 20/140) | 0–1 | 74 | [worldjusticeproject.org](https://worldjusticeproject.org/rule-of-law-index/global/2024) |

### FH FitW per-category (2025)

Freedom House publishes 7 categories with their own scores. These are used in the mapping instead of the aggregate where it makes sense:

| Category | Value | Normalised |
|---|---|---|
| A — Electoral Process | 4 / 4 | 100 |
| B — Political Pluralism & Participation | 3.75 / 4 | 93.75 |
| C — Functioning of Government | 3.67 / 4 | 91.75 |
| D — Freedom of Expression & Belief | 4 / 4 | 100 |
| E — Associational & Organizational Rights | 4 / 4 | 100 |
| F — Rule of Law | 3.75 / 4 | 93.75 |
| G — Personal Autonomy & Individual Rights | 3.75 / 4 | 93.75 |

## Mapping per pillar

Each pillar = unweighted mean of the chosen indices. Choice of indices per pillar:

### `electoral` (weight 15 %)

| Index | Value |
|---|---|
| V-Dem LDI | 81.7 |
| FH A — Electoral Process | 100 |
| FH B — Political Pluralism | 93.75 |

**Pillar score: (81.7 + 100 + 93.75) / 3 = 91.8**

Rationale: V-Dem LDI is broader than just electoral, but it contains the EDI (Electoral Democracy Index) as a core component. FH A and B are direct measurements of elections and political competition.

### `governance` (weight 20 %)

| Index | Value |
|---|---|
| EIU Democracy Index | 80.8 |
| FH C — Functioning of Government | 91.75 |

**Pillar score: (80.8 + 91.75) / 2 = 86.3**

Rationale: EIU has a separate "Functioning of government" category as part of its index, FH C measures the same thing directly. WJP "Constraints on Government Powers" would belong here, but we don’t have per-factor data; in iter 5 we use only these two.

### `judicial` (weight 20 %)

| Index | Value |
|---|---|
| WJP Rule of Law (overall) | 74 |
| FH F — Rule of Law | 93.75 |

**Pillar score: (74 + 93.75) / 2 = 83.9**

Rationale: WJP overall is the leading international yardstick of judicial independence and law enforcement. FH F has a broader take on rule of law (covering police, protection from arrest). Without WJP per-factor data (Constraints on Government, Civil Justice, Criminal Justice), WJP overall is an acceptable proxy.

### `media` (weight 15 %)

| Index | Value |
|---|---|
| RSF Press Freedom Index | 83.96 |
| FH D — Freedom of Expression & Belief | 100 |

**Pillar score: (83.96 + 100) / 2 = 92.0**

Rationale: RSF is the reference index for media freedom. FH D covers freedom of expression generally (not just media). The discrepancy between RSF (84) and FH D (100) is realistic — RSF picks up specific issues (SLAPPs, oligarchic concentration), FH D is more formal.

### `civil` (weight 15 %)

| Index | Value |
|---|---|
| FH E — Associational & Organizational Rights | 100 |
| FH G — Personal Autonomy & Individual Rights | 93.75 |

**Pillar score: (100 + 93.75) / 2 = 96.9**

Rationale: civil liberties are best covered by FH subscores E (NGOs, unions, association) and G (personal autonomy, minority protection). The V-Dem civil liberties index would also fit, but we don’t have per-factor data.

### `corruption` (weight 15 %)

| Index | Value |
|---|---|
| TI Corruption Perceptions Index | 59 |

**Pillar score: 59.0**

Rationale: TI CPI is the reference international yardstick for perceived corruption. WJP "Absence of Corruption" should be added, but we don’t have per-factor data; in the current iteration corruption is the only pillar with a single source. This is deliberate — TI CPI is the most respected and CZ-specific signal.

**Consequence:** the corruption pillar (59) is significantly lower than the others (84–97), reflecting a real discrepancy in Czechia — strong formal institutions but persistent perceived corruption. This **does not need to be normalised**, it is a faithful signal.

## Weighted overall score

```
overall = electoral × 0.15 + governance × 0.20 + judicial × 0.20
        + media × 0.15 + civil × 0.15 + corruption × 0.15

       = 91.8 × 0.15 + 86.3 × 0.20 + 83.9 × 0.20
       + 92.0 × 0.15 + 96.9 × 0.15 + 59.0 × 0.15
       = 13.77 + 17.26 + 16.78 + 13.80 + 14.535 + 8.85
       = 85.0
```

**Structural baseline 2026-Q2 overall: 85.0**

For comparison: EIU 2024 places CZ at 80.8, V-Dem LDI at 81.7. Our aggregate of 85.0 is 3–4 points higher — reflecting the inclusion of FH (95) and weighting towards areas where CZ scores strongly (electoral, civil). The discrepancy is within the "normal variability between indices" range (~5–10 points), not a signal of bad mapping.

## Update rules

1. **Annual:** when new reports come out (typically February–May), a new quarterly snapshot `data/structural/{nextQ}.json` is created with refreshed values. The mapping stays the same.
2. **On a mapping change:** bump version in `methodology/CHANGELOG.md` (v0.2 → v0.3), new quarterly snapshot, **do not touch historical snapshots**.
3. **When per-factor data becomes available:** if V-Dem or WJP publishes per-factor scores, the mapping can be refined — explicit changelog entry.

## Open questions (sources for iter 6+)

1. **WJP per-factor scores.** WJP Rule of Law publishes 8 factors (Constraints on Govt, Absence of Corruption, Open Govt, Fundamental Rights, Order & Security, Regulatory Enforcement, Civil Justice, Criminal Justice). Per-factor data is in the interactive WJP profile or the Excel dataset — requires a one-off manual extraction, not a web scrape. When added:
   - `governance` adds WJP Constraints on Government + Regulatory Enforcement
   - `judicial` is refined with Civil Justice + Criminal Justice (drop the overall proxy)
   - `corruption` adds WJP Absence of Corruption (more than just TI CPI)
   - `civil` adds WJP Fundamental Rights + Order & Security

2. **V-Dem per-component.** V-Dem publishes dozens of components (`v2x_polyarchy`, `v2x_libdem`, `v2x_partipdem`, `v2x_delibdem`, `v2x_egaldem`, plus their sub-indices). For a future iteration, `electoral` should pull `v2x_polyarchy`, `governance` `v2x_libdem` (constraints), `media` `v2x_freexp_altinf`, etc.

3. **Bertelsmann BTI** mentioned in CLAUDE.md is not used in this iter — no freely available API/JSON, requires manual extraction. Iter 6+.

4. **EC Rule of Law Report (CZ chapter)** mentioned in CLAUDE.md is also not used — it contains qualitative assessment, not a numeric score. It could serve as a qualitative validator (e.g. if the EC report from year Y describes a specific problem in the judiciary, we expect a lower WJP score in Y+1).

5. **Backtesting historical values.** Iter 9+ should compute the baseline for 2018–2020 with the same methodology and compare with the EIU/V-Dem scores from that time.
