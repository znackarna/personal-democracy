# Public opinion — read-only context

The "Public opinion" section on the dashboard displays survey data **as
supplementary context** alongside the pillar index. The key rule: **these
values do not feed into the score function or any automated decision about
event severity.** They serve a human reader for contextual comparison: how
the public perceives democracy vs. where the index has actual institutional
signals.

## Why read-only and NOT an input to the score

When designing this section, three integration levels were considered:

| Level | What | Why not / why yes |
|---|---|---|
| **A. Read-only display** ✅ | Polls displayed on the dashboard but don’t affect any number. | Implemented — we see correlation, no causal claim, no feedback loop. |
| **B. Quarterly validation** | Polls as an external benchmark alongside V-Dem/EIU. | Possible in a future iteration. Clear hypothesis-test semantics. |
| **C. Direct input into the score** ❌ | Polls as a sub-component of the civil pillar. | **Rejected.** Three reasons: |

**Reasons for rejecting direct integration (C):**

1. **Causality direction:** polls measure *perception*, not institutional
   reality. Low trust in courts doesn’t necessarily mean courts function
   worse — it can be the consequence of media coverage, polarisation, or a
   single high-profile case. The index is meant to reflect institutional
   shifts, not the media mood.

2. **Feedback loop:** if polls counted into the score, bad publicity →
   low score → even worse coverage → even lower score. The index would
   turn into a mood ring instead of a democracy gauge.

3. **Double-count:** the structural baseline from V-Dem and EIU **already
   contains polls indirectly** (V-Dem synthesises expert input with the
   help of surveys, EIU has a "Political Culture" subscale based on
   WVS/Eurobarometer). Adding polls a second time would mean counting
   the same signal twice.

## Sources and their profile

| Source | Frequency | Type | Use |
|---|---|---|---|
| **CVVM (Institute of Sociology, Czech Academy of Sciences)** | monthly | academic, transparent methodology | the main time-series chart — trust in constitutional institutions |
| **STEM** | irregular | commercial with a public archive, century-long tradition (since 1990) | topical findings cards — ad-hoc surveys |
| **Median** | irregular | commercial | topical findings cards — ad-hoc surveys |
| **Eurobarometer (EC)** | 2× per year | EU-standardised, comparable across the 27 members | **deferred:** not in yet, see "Known gaps" |

**Deliberately omitted:**
- *Voting intent / party preference* — the democracy index isn’t an
  election forecast; political preferences are orthogonal to institutional
  health.
- *Popularity of specific politicians* — politicised, short-sighted, says
  nothing about the institutional state.
- *Single-issue topical surveys* (e.g. "do you support the pension
  reform?") — too topical.

The section sticks to **trust in institutions + perceived corruption +
satisfaction with democracy** across all sources, on the same scale.

## CVVM as the primary source

CVVM is the `gold standard` for Czech opinion research for these reasons:

- **Academic affiliation** (Institute of Sociology of the Czech Academy of
  Sciences) — no commercial client, no political loyalty
- **Transparent methodology** — sample size, fieldwork, weights are
  published
- **Long-term series** — monthly measurement of "trust in constitutional
  institutions" has been running since the 1990s
- **Standardised question** — wording stable across decades, comparability
  preserved
- **Publicly available** — press releases + microdata for free, citation
  requirement

**Institutions measured:** president, government, Chamber of Deputies,
Senate, regional assemblies, regional governors, municipal councils,
mayors.

**Important note (2025-11):** in November/December 2025, CVVM changed its
data-collection methodology (transition CAPI → online panel). The
dashboard curve is visibly broken by a red reference line — datapoints
before and after this boundary **are not directly comparable**. For trend
analysis, evaluate each era separately.

## STEM and Median as supplementary context

Commercial pollsters were included deliberately, despite initial worries
about bias. Reasons for inclusion:

- **Topical agility** — commercial pollsters react to events much faster
  than academic ones (CVVM has a 1–3 month lag between fieldwork and
  publication; STEM/Median sometimes publish within 2 weeks of an event)
- **Cross-source transparency** — displaying polls **side by side** is
  methodologically more transparent than cherry-picking one source. If
  STEM and Median publish different numbers for the same question, that’s
  a feature (= the user sees that polls aren’t unanimous), not a bug.
- **Read-only safety** — commercial-pollster bias matters mainly when the
  data drives a serious decision (election forecast, policy). For
  supplementary dashboard context with no impact on the score, the risk
  is minimal.

Commercial pollsters appear in the dashboard as **"Recent findings"** —
cards with a headline finding + a link to the original report, **not as
data points in a chart**. Reason: their publication is irregular (no
stable time series), the output format varies (percentages, percent
changes, qualitative categories).

**Deliberately omitted commercial pollsters:**
- **Kantar CZ, NMS Market Research, Ipsos CZ** — they don’t have a
  publicly available archive of running surveys on trust in institutions;
  their data is published primarily through media (secondary citation),
  unsuitable for direct ingest.

## Known gaps (TODO future iterations)

### Eurobarometer (EC)

Eurobarometer publishes Standard EB twice a year (spring + autumn) with
a "Trust in national institutions" + "Perceived corruption" section for
all member states. The Czech fact sheet (~20-page PDF) has all the
relevant values.

**Why it isn’t in the dashboard yet:**
- The `europa.eu/eurobarometer` site is an SPA with JS-rendered content
  — `WebFetch` (LLM-friendly content extraction) doesn’t reach it
- The EU open data portal `data.europa.eu` has dataset entries, but the
  search is also JS-driven
- Manual ingest from PDF country fact sheets is possible (~10 minutes per
  survey) but requires a regular human-in-the-loop

**Planned workflow:**
1. When a new Standard EB is published (May + November) manually
   download the PDF Czechia country fact sheet
2. Extract "Trust in [parliament, government, courts, police, EU]" +
   "Corruption perception"
3. Add to `data/public_opinion/eurobarometer.json` with the same shape
   as the CVVM file

It can be implemented, just waiting for the bandwidth for manual ingest.

### GLOBSEC Trends

Annual report (May) focused on V4 (CZ, SK, PL, HU). Measures democratic
attitudes, perceptions of threat, attitudes towards the EU/NATO.
Available as PDF + press release.

**Why it’s missing:** the annual cadence + ad-hoc questions mean a
`time series` cannot be built from GLOBSEC alone — it would always be
3–4 datapoints. More suitable as a qualitative topical card; deferred
for now.

### Microdata for re-analysis

CVVM publishes raw microdata with a median delay of ~1 year after
fieldwork. A full re-analysis with custom aggregation (different cohorts,
different weighting) is possible, but well beyond the dashboard scope.
Deferred.

## Update workflow

CVVM publishes a new report monthly (typically 2–3 weeks after fieldwork
ends). Workflow for adding a new data point:

1. Track [CVVM category "Institutions and politicians"](https://cvvm.soc.cas.cz/cz/tiskove-zpravy/politicke/instituce-a-politici)
2. Find the new press release "Trust in constitutional institutions –
   [period]"
3. Open it, extract trust % for each institution
4. Add a new object to `data/public_opinion/cvvm-trust.json` in the
   `data` array (sorted ascending by `period`)
5. Commit + push — Vercel redeploys, the dashboard shows the new point

For STEM/Median (topical findings):
1. On a significant publication, add an object to
   `data/public_opinion/topical.json` in the `items` array
2. Recommended retention: the most recent ~6–10 findings; move older
   ones to archive or delete
3. Commit + push

No cron, no automation — manual ingest with human review ensures quality
and prevents false positives when source structure changes.
