# Event extraction prompt — TODO (iterace 2)

Prompt pro Claude Haiku v `src/pipeline/pre-filter.ts`, který z hrubého RSS/API feedu vybere zprávy relevantní pro index demokracie.

**Stav:** Stub. Plný prompt se napíše až s implementací `pre-filter.ts` v iteraci 2.

## Hrubý nástřel obsahu (k dopracování)

1. Role a cíl: drasticky redukovat objem feedu (typicky stovky zpráv/týden) na ~20–50 kandidátů, které stojí za klasifikaci.
2. Pozitivní kritéria: zpráva se týká institucí v některém z 6 pilířů (viz [`methodology/pillars.md`](../methodology/pillars.md)).
3. Negativní kritéria: čisté lifestyle, sport, zahraniční politika bez vazby na ČR, korporátní PR.
4. Output: array of `{url, headline, reason_kept, candidate_pillar}` — stručný, levný formát.
5. Důraz na recall, ne precision: lepší propustit 10 falešně pozitivních než zahodit 1 pravou událost.

## Závislosti
- Pre-filter je samostatný krok kvůli ekonomice — Haiku za ~10× nižší náklad než Sonnet, agresivně redukuje vstup do drahého klasifikačního kroku.
