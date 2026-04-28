# Index demokracie ČR

Týdně aktualizovaný index stavu demokracie v České republice. Cílem **není** nahradit zavedené roční indexy (V-Dem, EIU, Freedom House), ale **doplnit je o rychlejší detekci směru pohybu** mezi jejich aktualizacemi.

> **Stav: WIP, iterace 1.** Foundation a deterministická skórovací funkce. Pipeline (sběr zpráv, klasifikace) ani veřejný dashboard zatím neexistují. Detail metodiky a architektury je v [CLAUDE.md](CLAUDE.md).

## Jak to funguje

1. **Strukturální skóre 0–100** vychází z ročních dat zavedených indexů a aktualizuje se kvartálně. Je to "základní stav" demokratických institucí.
2. **Týdenní indikátor událostí** přičítá/odečítá body za konkrétní události uplynulého týdne podle [pevné rubriky závažnosti](methodology/severity_rubric.md). Jednorázové události stárnou lineárně přes 12 týdnů.
3. **Finální skóre** = strukturální baseline + součet aktivních eventových úprav, vážené přes [šest pilířů](methodology/pillars.md).

Veškerá aritmetika je deterministická a má unit testy ([`src/pipeline/score.ts`](src/pipeline/score.ts), [`tests/score.test.ts`](tests/score.test.ts)). LLM se používá pouze pro klasifikaci událostí, **nikdy** pro výpočet skóre.

## Klíčové principy

- **Auditovatelnost:** každá úprava má JSON záznam s odkazy na ≥ 2 nezávislé zdroje.
- **Anti-bias:** rubric se aplikuje stejně bez ohledu na to, kdo je u moci. Aktivně se hledají i události, které skóre **zvyšují**.
- **Lidský review je povinný** před každým týdenním commitem.
- **Source of truth je Git repo:** žádná externí DB, všechna data, kód, prompty a rozhodnutí jsou veřejná.

## Struktura repa

| Cesta | Obsah |
|---|---|
| `methodology/` | Definice pilířů, rubric závažnosti, váhy, changelog |
| `schemas/` | JSON schémata pro events a score snapshoty |
| `src/lib/types.ts` | Zod schémata (single source of truth pro TS typy) |
| `src/pipeline/score.ts` | Čistá deterministická skórovací funkce |
| `tests/` | Vitest testy, povinné 100% coverage pro `score.ts` |
| `config/sources.yaml` | Seznam zdrojů pro budoucí pipeline |
| `data/` | Strukturální baseline, týdenní events, historie skóre (zatím prázdné) |
| `prompts/` | Prompty pro Claude (zatím stuby) |
| `CLAUDE.md` | Trvalý kontext pro Claude Code, plný projektový spec |

## Lokální běh

```bash
npm install
npm test          # vitest, score function
npm run typecheck # tsc --noEmit
npm run lint      # eslint
```

## Roadmap

- **Iterace 1 (current):** Foundation + score.ts + methodology drafty.
- **Iterace 2:** Pipeline (`fetch-sources`, `pre-filter`, `extract-events`, `validate`), prompty, počáteční strukturální baseline pro 2026-Q2.
- **Iterace 3:** Next.js dashboard se statickým exportem, deploy na Vercel.
- **Iterace 4:** GitHub Actions workflows (`weekly-pipeline`, `validate-pr`, `recompute-scores`).
- **Iterace 5+:** Backtesting na 2018–2020, kvartální validace proti V-Dem/EIU.

## Licence

TBD.
