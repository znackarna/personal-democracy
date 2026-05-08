# Data sources

The Czech Democracy Index draws from two independent data layers — **structural** (slow, refreshed annually/quarterly) and **weekly** (fast, event-driven). This page maps both.

The source of truth is [`config/sources.yaml`](https://github.com/znackarna/democracy-index-cz/blob/main/config/sources.yaml). The tables below are generated from it at build time — they aren’t edited by hand, so they can’t drift.

## Structural baseline (quarterly)

The structural score is built on six established international indices, mapped onto the project’s six pillars (elections, governance, judiciary, media, civil rights, corruption):

| Index | Publisher | Frequency | Pillar(s) |
|---|---|---|---|
| [V-Dem Democracy Report](https://v-dem.net/) | University of Gothenburg | annual (spring) | overall + electoral + civil |
| [EIU Democracy Index](https://www.eiu.com/topic/democracy-index) | Economist Intelligence Unit | annual | overall |
| [Freedom in the World](https://freedomhouse.org/report/freedom-world) | Freedom House | annual (March) | electoral + civil |
| [RSF World Press Freedom Index](https://rsf.org/en/index) | Reporters Without Borders | annual (May) | media |
| [TI Corruption Perceptions Index](https://www.transparency.org/en/cpi) | Transparency International | annual (Jan/Feb) | corruption |
| [WJP Rule of Law Index](https://worldjusticeproject.org/rule-of-law-index/) | World Justice Project | annual (Oct/Nov) | judicial + governance |

The detail of how the six indices combine into 0–100 pillar scores is in [structural mapping](/en/methodology/structural-mapping/). The current baseline is in `data/structural/2026-Q2.json` in the repo.

## Weekly sources (event monitoring)

The weekly pipeline (`weekly-pipeline` GitHub Actions workflow, Mondays at 06:00 UTC) goes through every active source, pre-filters articles via Claude Haiku 4.5, classifies them via Claude Sonnet 4.6, and proposes events with reasoning per the [severity rubric](/en/methodology/severity/). The "active" status means the source has a working adapter — either an RSS feed (read via `rss-parser`) or a dedicated TypeScript adapter in [`src/lib/`](https://github.com/znackarna/democracy-index-cz/tree/main/src/lib). The "not wired up" status is a placeholder — the source is registered in the yaml for a future adapter, but isn’t currently read.

<!-- SOURCES_TABLE -->

## Why these sources

**Czech media.** Deliberately broad ideological spectrum: from the more left-leaning A2larm through the centrist Deník N to the more conservative Hospodářské noviny. Investigace.cz has a slower cadence but very high per-item relevance. The public-service ČT24 and iROZHLAS serve as an independent reference point. The point of diversity is [anti-bias](/en/methodology/governance/) — no single outlet may dominate the source mix beyond 50 % of weekly events.

**Open state data.** Structural events (an interrupted Chamber of Deputies session, a Constitutional Court ruling, a paid sponsorship contract) are more valuable than media commentary — they can be verified directly at source. Hlídač státu (free after registration at hlidacstatu.cz/api) opens up databases of sponsorship, anomaly contracts and subsidies. The Chamber of Deputies has no RSS, so we read its session overview via an HTML scraper. The Constitutional Court has an undocumented but stable RSS feed.

**Watchdog organisations.** Transparency International CZ and Frank Bold are domestic experts on corruption and rule of law. They serve primarily as a sanity-check for the `corruption` and `judicial` pillars.

**International sources.** Five editorial outlets (POLITICO Europe, BBC News Europe, Euronews, Visegrad Insight, Brno Daily) plus four institutions (GRECO, Venice Commission, EC Rule of Law, ECtHR) — the institutional ones are not yet wired up, awaiting adapter implementation. The point: an outside-in perspective, often emphasising the CEE context that local media sometimes overlook. Visegrad Insight has the highest per-item Czech relevance among foreign sources.

## How sources change

Adding a new source is a two-minute commit to [`config/sources.yaml`](https://github.com/znackarna/democracy-index-cz/blob/main/config/sources.yaml). If the feed is RSS, no code changes — just add it to the `--sources` default in [`weekly-pipeline.yml`](https://github.com/znackarna/democracy-index-cz/blob/main/.github/workflows/weekly-pipeline.yml). For a non-RSS source (HTML scrape or API), a dedicated adapter in `src/lib/` needs to be written and registered in [`src/pipeline/fetch-sources.ts`](https://github.com/znackarna/democracy-index-cz/blob/main/src/pipeline/fetch-sources.ts).

A source is removed once its feed stops working (typically HTTP 5xx for more than two weeks). Example: Iuridicum Remedium was dropped on 2026-04-29 after a persistent HTTP 500 — the entry stays in the yaml as a comment so it can be quickly restored when its feed is fixed.

Source changes are not logged in the [methodology CHANGELOG](/en/methodology/changelog/), which is reserved for methodology adjustments (weights, rubric, pillars, governance). For source history, run `git log -- config/sources.yaml`.
