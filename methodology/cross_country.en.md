# Country comparison across indices

The [/en/comparison/](/en/comparison/) page shows how Czechia stacks up against
selected countries (V4 + DE/AT + USA + UK) across six international indices of
democracy and rule of law. It serves as an external benchmark for our weekly
index — not as its input.

## Selected countries

8 countries in two groups:

- **Czechia (CZ)** and **Slovakia (SK)** — visually highlighted, primary
  reference for the Czech reader (shared history, similar post-communist
  starting conditions, today different trajectories).
- **Rest of V4** — Poland (PL), Hungary (HU). They extend the post-communist
  context and show polarisation within the region (PL after the 2023 government
  change going through a rule-of-law improvement, HU continuing backsliding).
- **Neighbours** — Germany (DE), Austria (AT). Consolidated democracies with
  similar geography and trade ties; a benchmark for "where we could be".
- **Global Anglosphere** — USA, UK. Large Western democracies, often cited as
  reference; both are now ranked below Czechia by these indices.

The EU-27 average is deliberately **omitted**: individual indices publish it
inconsistently and an unofficial calculation (simple vs population-weighted)
would introduce methodology bias. 8 specific countries is more legible than
an aggregate.

## Selected indices

| Index | Publisher | Year | Scale | Type |
|---|---|---|---|---|
| **EIU** Democracy Index | Economist Intelligence Unit | 2025 | 0–10 | multi-dimension (5 sub-pillars) |
| **V-Dem** Liberal Democracy Index | V-Dem Institute (Gothenburg) | 2025 | 0–1 | multi-dimension |
| **FH FitW** Freedom in the World | Freedom House | 2025 | 0–100 | multi-dimension (PR + CL) |
| **RSF** Press Freedom Index | Reporters Without Borders | 2025 | 0–100 | single-dimension (media) |
| **TI CPI** Corruption Perceptions Index | Transparency International | 2025 | 0–100 | single-dimension (corruption) |
| **WJP** Rule of Law Index | World Justice Project | 2024 | 0–1 | single-dimension (rule of law) |

For a fair visual comparison, in the heatmap matrix UI **all indices are
normalised to 0–100** (via `scale_max`). The bar charts keep raw values on the
index’s native scale (Y axis matches the original range).

## Methodological background

### Multi-dimension vs single-dimension

- **Multi-dimension** (EIU, V-Dem, FH) are composite indices — aggregating
  dozens to hundreds of indicators. They measure "the overall state of
  democracy".
- **Single-dimension** (RSF, TI CPI, WJP) measure one specific dimension
  (media freedom, perceived corruption, rule of law). In our CZ baseline
  these indices are used as a proxy for a specific pillar (RSF → media,
  TI → corruption, WJP → judicial).

The mapping detail to our index is in
[Structural mapping](/en/methodology/structural-mapping/).

### Publication years

Each index has a different cycle:

| Index | Publication cycle | Current edition |
|---|---|---|
| EIU | spring | April 2026 (Democracy Index 2025) |
| V-Dem | spring | spring 2026 (V-Dem 2026 edition, data 2025) |
| FH FitW | March | March 2025 (FitW 2025, data 2024) |
| RSF | May | May 2025 (PFI 2025, data 2024) |
| TI CPI | January/February | February 2026 (CPI 2025, data 2025) |
| WJP | October | October 2024 (WJP 2024, data 2024) |

Our CZ baseline (`data/structural/2026-Q3.json`) may have data from one
edition behind for some indices — we don’t always incorporate every index
immediately (see
[CHANGELOG v0.2.2](/en/methodology/changelog/) → TODO Q4 baseline). The
cross-country page always uses the **most recent available edition**, so
small differences between the cross-country view and the CZ baseline are
expected.

### Why CZ + SK are highlighted

CZ is primarily a Czech project, SK is the closest comparison (shared
history, similar geographic and cultural context, similar level of
post-communist transformation). The visual highlight helps the reader scan
the pattern of "where we are + where the closest neighbour is". The rest
of the countries are context.

## What this comparison is NOT

- **It’s not a prediction** — the indices measure past periods, our
  dashboard adds elements from the current week.
- **It’s not a ranking championship** — small differences between
  neighbouring countries (1–3 points) typically lie within each index’s
  measurement error. Meaningful interpretation rests on trajectory over
  time, not on a specific year’s ranking.
- **It does not include political opinions** — we display numbers from
  each index’s methodology, no editorial judgement of our own.

## Update workflow

Cross-country data is updated **manually after each new edition is
published** (typically 1–4× per year per index). Workflow:

1. Track the publication calendar (V-Dem spring, EIU spring, FH March,
   RSF May, TI January/February, WJP October).
2. After a new edition is published, fetch data for all 8 countries
   (Wikipedia aggregate + each index’s own page for verification).
3. Edit `data/cross_country/indexes.json` — bump `year`, update
   `values`, possibly `sub_pillars`.
4. Update `source_note` (publication date).
5. Commit with message `cross-country: <index> <year>`.

It is not automated because this data doesn’t change weekly and manual
per-country audit matters more than update frequency.

## Related

- [The six pillars](/en/methodology/pillars/) — what each pillar measures
  in our index
- [Structural mapping](/en/methodology/structural-mapping/) — how the CZ
  baseline is computed from these external indices
- [Validation report 2026-Q2](/en/methodology/validation-2026-q2/) —
  quarterly comparison of our index ↔ each external index for CZ
