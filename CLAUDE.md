# CLAUDE.md — Index demokracie ČR

> Tento soubor je trvalý kontext pro Claude Code. Čti ho na začátku každé session.
> Aktualizuje se ručně commitem, nikdy ne automaticky agentem.

## Cíl projektu

Týdenní automatizované sledování stavu demokracie v České republice. **Cílem není nahradit** zavedené indexy (EIU, V-Dem, Freedom House), ale **doplnit je o rychlejší detekci směru pohybu** mezi jejich ročními aktualizacemi.

Veřejný výstup: statický web na Vercelu s časovou řadou skóre, breakdown po pilířích a auditovatelný seznam událostí s odkazy na zdroje.

## Architektura

**Hybrid GitHub Actions + Vercel:**

- **Pipeline** (fetch, klasifikace, výpočet skóre) běží jako týdenní GitHub Actions workflow. Commituje výsledky jako PR do repa.
- **Dashboard** je Next.js App Router s `output: 'export'`, deployovaný na Vercel. Auto-redeploy při merge do `main`.
- **Source of truth** je Git repo — všechna data, prompty, kód a rozhodnutí jsou versioned. Žádná externí DB.

Důvod hybridu: pipeline má dlouhé doby běhu, mnoho externích volání a musí commitnout do Gitu kvůli auditovatelnosti; Vercel Cron na to není správný nástroj. GitHub Actions má 6h limit, je zdarma a Git-native. Vercel dělá výhradně to, v čem je nejlepší — hostování statického frontendu.

## Metodologie — dvouvrstvý model

### A) Strukturální skóre (0–100) — pomalá vrstva
- Vychází z ročních dat zavedených indexů (V-Dem, EIU, FH, RSF, TI, WJP).
- Aktualizuje se **kvartálně**, když vyjdou nové reporty.
- Reprezentuje „základní stav" demokratických institucí.
- Snapshoty v `data/structural/YYYY-Qx.json`.

### B) Týdenní indikátor událostí — rychlá vrstva
- Co se za uplynulý týden stalo, jak to posunuje skóre.
- Každá událost má bodovou úpravu podle rubric (viz níže).
- Události typu `one_off` **stárnou lineárně přes 12 týdnů** (úprava klesá o 1/12 týdně).
- Události typu `persistent` zůstávají, dokud je ruční commit neuzavře jako `resolved`.
- Týdenní soubory v `data/events/YYYY-Wxx.json`.

**Finální zveřejněné skóre = strukturální baseline + součet aktuálně živých eventových úprav, vážené po pilířích.**

## Klíčové principy (nepřekročitelné)

1. **Deterministická aritmetika.** Claude kategorizuje události, ale **NEPOČÍTÁ skóre**. Veškerá matematika je v `src/pipeline/score.ts` a má unit testy.
2. **Pevné rubrics.** Váhy pilířů a kritéria závažnosti jsou zafixované. Změny pouze přes Git commit s odůvodněním v `methodology/CHANGELOG.md`.
3. **Transparentnost.** Kód, data, prompty a všechna rozhodnutí jsou veřejné.
4. **Auditovatelnost.** Každá úprava skóre má JSON záznam s odkazy na ≥ 2 nezávislé zdroje, kde je to možné.
5. **Anti-bias.** Vědomě hledat i události, které skóre **zvyšují**. Aplikovat rubric stejně přísně bez ohledu na to, kdo je u moci.
6. **Lidský review je povinný.** Žádný týdenní commit se neslučuje do `main` bez schválení (Jakub).

## Pilíře a váhy

| Kód | Pilíř | Váha |
|---|---|---|
| `electoral` | Volební proces a pluralismus | 15 % |
| `governance` | Fungování vlády a parlamentu | 20 % |
| `judicial` | Soudní nezávislost a právní stát | 20 % |
| `media` | Mediální svoboda | 15 % |
| `civil` | Občanské svobody | 15 % |
| `corruption` | Korupce a transparentnost | 15 % |

Detailní vymezení každého pilíře v `methodology/pillars.md`. Zdůvodnění vah v `methodology/weights.md`.

## Rubric závažnosti událostí

| Závažnost | Popis | Bodová úprava subskóre pilíře |
|---|---|---|
| 1 | Zanedbatelný incident, výroky bez institucionálního dopadu | ±0.2 |
| 2 | Drobný jednorázový incident s lokálním dopadem | ±0.5 |
| 3 | Významný incident, široký dopad nebo precedent | ±1.5 |
| 4 | Závažné porušení normy nebo procesu | ±3.0 |
| 5 | Strukturální posun, ústavní krize, systémová změna | ±6.0 |

Příklady a kalibrační pravidla v `methodology/severity_rubric.md`.

## Zdroje dat

### Strukturální (kvartální)
V-Dem · EIU Democracy Index · Freedom House (FitW, NiT) · RSF Press Freedom Index · Transparency International CPI · World Justice Project Rule of Law Index · EK Rule of Law Report (CZ kapitola) · Bertelsmann BTI

### Týdenní (event monitoring)
- **Česká média:** Deník N, iROZHLAS, ČT24, HN, Aktuálně.cz, Investigace.cz, A2larm
- **Otevřená data:** Hlídač státu API, psp.cz (hlasování, zkrácená čtení), nsoud.cz, usoud.cz
- **Watchdogy:** Transparency International ČR, Rekonstrukce státu, Iuridicum Remedium, Frank Bold
- **Mezinárodní:** GRECO, Venice Commission, ESLP, EK (právní stát)

Plný seznam s URL a typem feedu v `config/sources.yaml`.

## Struktura repozitáře

```
democracy-index-cz/
├── CLAUDE.md                      # tento soubor
├── README.md                      # veřejný popis
├── package.json
├── tsconfig.json
├── next.config.mjs                # output: 'export'
├── vercel.json                    # build config
│
├── methodology/
│   ├── pillars.md                 # vymezení pilířů
│   ├── severity_rubric.md         # rubric s příklady
│   ├── weights.md                 # zdůvodnění vah
│   └── CHANGELOG.md               # log změn metodiky
│
├── config/
│   └── sources.yaml               # feedy a API endpointy
│
├── data/                          # source of truth
│   ├── structural/                # YYYY-Qx.json
│   ├── events/                    # YYYY-Wxx.json
│   └── scores/timeline.json       # historie skóre
│
├── schemas/
│   ├── event.schema.json
│   └── score.schema.json
│
├── prompts/
│   ├── event_extraction.md
│   └── classification.md
│
├── src/
│   ├── pipeline/                  # běží v GitHub Actions
│   │   ├── fetch-sources.ts       # RSS/API agregace
│   │   ├── extract-events.ts      # Claude API (Sonnet)
│   │   ├── pre-filter.ts          # Claude API (Haiku) — relevance gate
│   │   ├── score.ts               # ČISTĚ DETERMINISTICKÝ
│   │   ├── validate.ts            # AJV schema validace
│   │   └── run-weekly.ts          # orchestrátor
│   ├── lib/
│   │   ├── claude.ts              # @anthropic-ai/sdk wrapper
│   │   ├── feeds.ts               # rss-parser wrapper
│   │   └── types.ts               # Zod schemas + TS typy
│   └── app/                       # Next.js App Router (dashboard)
│       ├── layout.tsx
│       ├── page.tsx               # hlavní dashboard
│       ├── events/page.tsx        # seznam events
│       ├── methodology/page.tsx
│       └── components/
│           ├── ScoreTimeline.tsx
│           ├── PillarBreakdown.tsx
│           └── EventCard.tsx
│
├── tests/
│   └── score.test.ts              # vitest, povinný coverage
│
├── .github/
│   └── workflows/
│       ├── weekly-pipeline.yml    # cron Po 06:00 UTC
│       ├── validate-pr.yml        # JSON schema check na PR
│       └── recompute-scores.yml   # přepočet skóre po merge
│
└── public/                        # statická aktiva pro Next.js
```

## Týdenní workflow

GitHub Actions workflow `weekly-pipeline.yml`, trigger: cron `0 6 * * 1` (Po 06:00 UTC), pokrývá uplynulý týden (Po–Ne).

1. **Sběr** — `src/pipeline/fetch-sources.ts` stáhne všechny zdroje pomocí `rss-parser` + native `fetch`, dedupuje podle URL/titulku, ukládá do `tmp/raw/` (mimo Git).
2. **Pre-filter** — `pre-filter.ts` použije Claude Haiku, aby z hrubého feedu vyfiltroval relevantní zprávy (drasticky snižuje token usage v dalším kroku).
3. **Klasifikace** — `extract-events.ts` použije Claude Sonnet s `prompts/classification.md` + `methodology/severity_rubric.md` jako kontextem. Vyplní `pillar`, `severity`, `direction`, `duration`, `rationale`. Validuje proti `schemas/event.schema.json` přes AJV.
4. **PR návrh** — workflow otevře PR do `data/events/YYYY-Wxx.json` přes `peter-evans/create-pull-request` action. **Není auto-merge.**
5. **Lidský review** (Jakub) — schválit / upravit / zamítnout. Anti-bias checklist (viz níže).
6. **Výpočet skóre** — po merge do `main` se spustí `recompute-scores.yml`, který zavolá `src/pipeline/score.ts`, přečte strukturální baseline + všechny živé events, aplikuje stárnutí, spočítá vážený průměr, zapíše do `data/scores/timeline.json` a commitne.
7. **Deploy** — Vercel detekuje push do `main`, rebuilduje Next.js a deployuje. Žádná manuální akce.

## JSON schémata

### Event
```json
{
  "id": "2026-W17-001",
  "date": "2026-04-22",
  "headline": "string",
  "summary": "1–3 věty, vlastní parafráze, žádný citát 15+ slov",
  "pillar": "judicial",
  "severity": 3,
  "direction": -1,
  "duration": "one_off",
  "sources": [
    {"title": "string", "url": "string", "outlet": "string", "fetched_at": "ISO8601"}
  ],
  "score_impact": -1.5,
  "rationale": "Proč právě tato závažnost a pilíř, odkaz na příslušné kritérium rubric.",
  "reviewer": "manual|auto",
  "status": "active|resolved|disputed",
  "created_at": "ISO8601",
  "expires_at": "ISO8601 (jen pro one_off)"
}
```

### Score snapshot
```json
{
  "week": "2026-W17",
  "computed_at": "ISO8601",
  "overall_score": 76.4,
  "pillars": {
    "electoral": 82.0, "governance": 71.5, "judicial": 78.0,
    "media": 74.5, "civil": 79.0, "corruption": 72.5
  },
  "active_events_count": 14,
  "structural_baseline": "2026-Q2"
}
```

## Mantinely pro Claude

**Claude DĚLÁ:**
- Identifikuje a parafrázuje události z poskytnutého feedu
- Klasifikuje podle pevného rubric
- Navrhuje závažnost s explicitním odůvodněním odkazujícím na rubric
- Hlásí problémy s metodikou do `methodology/issues.md` (nikdy je nemění sám)

**Claude NEDĚLÁ:**
- Nepočítá finální skóre — to dělá výhradně `score.ts`
- Neupravuje váhy, pilíře ani rubric
- Necituje doslova (parafráze, max 1 citát < 15 slov na zdroj)
- Nepřidává události bez ověřitelného URL zdroje
- Nehodnotí podle „atmosféry" — pouze podle konkrétních ověřitelných faktů
- Nezaujímá pozice politických aktérů — popisuje **institucionální dopad**, ne morální hodnocení

**Když si není jistý:**
- `severity: null, status: "needs_review"` + komentář pro reviewera
- Lepší falešně neutrální než falešný poplach

## Anti-bias checklist (každý týden, před merge)

1. Je v seznamu alespoň jedna událost s `direction: +1`? Pokud ne, je to opravdu realita uplynulého týdne, nebo selektivní pozornost?
2. Jsou zdroje rozmanité? (Žádné jedno médium > 50 % event sourců.)
3. Aplikoval bych stejné kritérium na opačnou politickou stranu?
4. Je každá událost se `severity ≥ 3` doložená alespoň 2 nezávislými zdroji?
5. Mám pro každou událost konkrétní odkaz na bod rubric, ne jen obecné odůvodnění?

## Validace (kvartálně)

- Spočítej korelaci vlastního indexu s EIU / V-Dem / FH za poslední rok.
- Pokud trvalá divergence > 10 bodů: prošetři, zveřejni `methodology/validation_YYYY-Qx.md`.
- Backtesting: aplikuj aktuální metodiku na minulé období (např. 2018–2020) a porovnej, zda dává smysluplné výsledky.

## Tech stack

- **Runtime:** Node.js 20+, TypeScript (strict mode)
- **Pipeline:** `@anthropic-ai/sdk`, `rss-parser`, `js-yaml`, `ajv`, `zod` (runtime types)
- **Frontend:** Next.js 15+ (App Router, `output: 'export'` pro statické sestavení), React, Tailwind CSS, Recharts
- **Testing:** `vitest` (pipeline + score function), `@testing-library/react` (komponenty)
- **Linting:** `eslint`, `prettier`
- **CI/CD:** GitHub Actions pro pipeline, Vercel pro deploy
- **Storage:** plain JSON v Git repu (žádná DB)

### Proč TypeScript strict
JSON schémata mají odpovídající Zod typy v `src/lib/types.ts`. Pipeline by měla parsovat všechna externí data přes Zod schemas — chyba ve struktuře feed dat se musí projevit hned, ne tiše.

### Proč Next.js static export
Dashboard nepotřebuje SSR. Build čte `data/scores/timeline.json` a `data/events/*.json`, vše se předrenderuje. Vercel pak hostí jen static files. Žádné runtime náklady, žádné cold starty, žádné runtime API klíče.

## Časté příkazy

```bash
# Setup
npm install

# Lokální vývoj dashboardu
npm run dev

# Build dashboardu (static export do `out/`)
npm run build

# Pipeline lokálně (s .env z .env.example)
npm run pipeline:fetch -- --week current
npm run pipeline:extract -- --week 2026-W17
npm run pipeline:score -- --rebuild

# Validace eventů proti schématu
npm run validate -- data/events/2026-W17.json

# Testy
npm test
npm run test:watch

# Backtesting
npm run pipeline:replay -- --from 2024-Q1 --to 2025-Q4
```

## GitHub Actions workflows

### `.github/workflows/weekly-pipeline.yml`
- Trigger: `cron: '0 6 * * 1'` + `workflow_dispatch` (pro manuální spuštění)
- Secrets: `ANTHROPIC_API_KEY`
- Permissions: `pull-requests: write`, `contents: write`
- Outputs: PR s navrženými events pro daný týden
- Time limit: 30 minut (default), v praxi pod 10 minut

### `.github/workflows/validate-pr.yml`
- Trigger: PR do `main`
- Spustí `npm run validate` na změněné event soubory
- Spustí `npm test` (score function tests)
- Blocking — PR nelze merge bez green checks

### `.github/workflows/recompute-scores.yml`
- Trigger: push do `main` na cestě `data/events/**`
- Spustí `npm run pipeline:score -- --rebuild`
- Commitne `data/scores/timeline.json` zpět (s `[skip ci]` v message)

## Vercel konfigurace

- **Framework preset:** Next.js
- **Build command:** `npm run build`
- **Output directory:** `out` (kvůli static export)
- **Install command:** `npm install`
- **Root directory:** `./`
- **Environment variables:** žádné runtime (static), build-only pokud potřeba
- **Cron jobs:** **NEPOUŽÍVAT.** Pipeline běží na GitHub Actions, ne na Vercelu.
- **Production branch:** `main`
- **Preview deployments:** zapnuté pro všechny PR (užitečné pro review event změn před merge)

## Initial setup (jednorázově, před první týdnem)

1. `npm create next-app@latest` (App Router, TS, Tailwind, ESLint).
2. Přidat strukturu adresářů, schemas, prompts, methodology.
3. Sepsat `methodology/pillars.md` — co každý pilíř konkrétně měří, podrobně.
4. Sepsat `methodology/severity_rubric.md` s 5–10 příklady na každou úroveň závažnosti.
5. Vyplnit počáteční strukturální skóre z V-Dem/EIU dat (2025) do `data/structural/2026-Q2.json`.
6. Naimplementovat `src/pipeline/score.ts` jako čistou funkci + vitest testy. Před vším ostatním.
7. Otestovat pipeline retroaktivně na 4–8 týdnech zpětně pro kalibraci závažností.
8. Připojit Vercel k repu, ověřit static export.
9. Teprve potom zapnout GitHub Actions cron.

## Co Claude Code typicky řeší v této code base

- Implementace nových source adapterů v `src/pipeline/fetch-sources.ts`
- Vylepšování promptů pro extrakci/klasifikaci (s respektem k rubric)
- Refactor `score.ts` při zachování test coverage
- Generování dashboard komponent v `src/app/`
- Psaní validačních skriptů, Zod schémat a unit testů
- Drobné úpravy `methodology/` na základě issue diskuze (vždy s commit message vysvětlujícím dopad)

## Co Claude Code NEŘEŠÍ sám bez explicitní instrukce

- Změny vah pilířů
- Změny bodových hodnot v rubric
- Mazání nebo přepisování již commitnutých events (jen status změny přes nový commit)
- Cokoli, co by retroaktivně měnilo historické skóre
- Přesun pipeline z GitHub Actions na Vercel runtime (architektonické rozhodnutí)
