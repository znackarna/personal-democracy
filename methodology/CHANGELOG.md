# Methodology CHANGELOG

Každá změna metodiky (pilíře, váhy, rubric, mantinely) je zaznamenána zde s datem, autorem a odůvodněním. Změny vyžadují přepočet historické řady, viz [`weights.md`](weights.md), pravidla pro změnu vah.

## v0.1.4 — Prompt tuning + dedup infrastructure (2026-04-28, iter 4)

- Přidána infrastruktura pro zachycení duplicitních events napříč zdroji (`src/pipeline/dedupe.ts`). Slučování je deterministické a označí konflikt direction/severity jako `status: disputed`. Není to změna **metodiky**, ale ovlivňuje, jak se events finalizují. Pravidla pro merge:
  - Stejný pillar
  - Date ±3 dny
  - Headline Jaccard ≥ 0.3 nad 5-znakovými prefixy tokenů (Czech inflection-friendly)
- Pre-filter prompt rozšířený o explicitní drop kategorie (routine party events, ceremonial diplomatic acts, background context). Žádná změna pilířů ani vah.
- Classification prompt: explicitní `Today` a `Reference week` jako temporal frame, aby Sonnet nehalucinoval rok.

## v0.1 — Initial methodology draft (2026-04-28)

- Šest pilířů zavedeno: `electoral`, `governance`, `judicial`, `media`, `civil`, `corruption`.
- Váhy stanoveny na 15/20/20/15/15/15. Vyšší váha pro `governance` a `judicial` motivovaná literaturou demokratického backslidingu.
- Rubric závažnosti 1–5 s dopady ±0.2 / ±0.5 / ±1.5 / ±3.0 / ±6.0.
- One-off události stárnou lineárně přes 12 týdnů.
- Persistent události zůstávají do explicitní změny `status: resolved`.

**Status: draft, vyžaduje review před prvním produkčním týdnem.**
