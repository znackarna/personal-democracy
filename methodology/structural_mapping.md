# Strukturální mapping — externí indexy → pilíře

> **Status: v0.2 (2026-04-28).** První produkční mapping. Nahrazuje placeholder z iterace 3.

## Princip

Každý pilíř (electoral, governance, judicial, media, civil, corruption) získává skóre 0–100 jako **vážený průměr normalizovaných hodnot vybraných externích indikátorů**. Indikátory jsou voleny tak, aby každý pilíř měl ≥ 1 zdroj, ideálně ≥ 2 nezávislé.

Mapování je **explicitní a fixní v rámci verze metodiky**. Změny vyžadují bump v `methodology/CHANGELOG.md` a přepočet historické řady.

## Použité externí indexy (Q2 2026)

| Index | Rok | CZ hodnota | Originální škála | Normalizované 0–100 | Zdroj |
|---|---|---|---|---|---|
| V-Dem Liberal Democracy Index | 2024 | 0.817 | 0–1 | 81.7 | [v-dem.net](https://v-dem.net/) |
| EIU Democracy Index | 2024 | 8.08 | 0–10 | 80.8 | [EIU 2024 PDF](https://d1qqtien6gys07.cloudfront.net/wp-content/uploads/2025/03/Democracy_INDEX_2024.pdf) |
| Freedom House FitW | 2025 | 95 (PR 37, CL 58) | 0–100 (40+60) | 95 | [freedomhouse.org/country/czechia/freedom-world/2025](https://freedomhouse.org/country/czechia/freedom-world/2025) |
| RSF Press Freedom Index | 2025 | 83.96 (rank 10) | 0–100 | 83.96 | [rsf.org](https://rsf.org/en/index) |
| TI Corruption Perceptions Index | 2024 | 59 (rank 39) | 0–100 | 59 | [transparency.org](https://www.transparency.org/en/cpi/2024/index/cze) |
| WJP Rule of Law Index | 2024 | 0.74 (rank 20/140) | 0–1 | 74 | [worldjusticeproject.org](https://worldjusticeproject.org/rule-of-law-index/global/2024) |

### FH FitW per-category (2025)

Freedom House publikuje 7 kategorií se svými skóre. Tyto se používají v mappingu místo agregátu kde dává smysl:

| Kategorie | Hodnota | Normalizované |
|---|---|---|
| A — Electoral Process | 4 / 4 | 100 |
| B — Political Pluralism & Participation | 3.75 / 4 | 93.75 |
| C — Functioning of Government | 3.67 / 4 | 91.75 |
| D — Freedom of Expression & Belief | 4 / 4 | 100 |
| E — Associational & Organizational Rights | 4 / 4 | 100 |
| F — Rule of Law | 3.75 / 4 | 93.75 |
| G — Personal Autonomy & Individual Rights | 3.75 / 4 | 93.75 |

## Mapování per pilíř

Každý pilíř = nevážený průměr (mean) zvolených indexů. Volba indexů per pilíř:

### `electoral` (15 % váha)

| Index | Hodnota |
|---|---|
| V-Dem LDI | 81.7 |
| FH A — Electoral Process | 100 |
| FH B — Political Pluralism | 93.75 |

**Pilíř score: (81.7 + 100 + 93.75) / 3 = 91.8**

Rationale: V-Dem LDI je širší než jen electoral, ale obsahuje EDI (Electoral Democracy Index) jako hlavní složku. FH A a B jsou přímé měření voleb a politické soutěže.

### `governance` (20 % váha)

| Index | Hodnota |
|---|---|
| EIU Democracy Index | 80.8 |
| FH C — Functioning of Government | 91.75 |

**Pilíř score: (80.8 + 91.75) / 2 = 86.3**

Rationale: EIU má samostatnou kategorii „Functioning of government" jako součást indexu, FH C přímo měří totéž. WJP „Constraints on Government Powers" by sem patřilo, ale per-faktor data nemáme; v iter 5 použijeme jen tyto dva.

### `judicial` (20 % váha)

| Index | Hodnota |
|---|---|
| WJP Rule of Law (overall) | 74 |
| FH F — Rule of Law | 93.75 |

**Pilíř score: (74 + 93.75) / 2 = 83.9**

Rationale: WJP overall je hlavní mezinárodní mérítko soudní nezávislosti a vymahatelnosti práva. FH F má širší pojetí rule of law (zahrnuje policii, ochranu před zatčením). Bez WJP per-factor dat (Constraints on Government, Civil Justice, Criminal Justice) je WJP overall přijatelný proxy.

### `media` (15 % váha)

| Index | Hodnota |
|---|---|
| RSF Press Freedom Index | 83.96 |
| FH D — Freedom of Expression & Belief | 100 |

**Pilíř score: (83.96 + 100) / 2 = 92.0**

Rationale: RSF je referenční index pro mediální svobodu. FH D zahrnuje svobodu projevu obecně (ne jen mediální). Diskrepance mezi RSF (84) a FH D (100) je realistická — RSF zachycuje konkrétní problémy (SLAPPs, oligarchická koncentrace), FH D je formálnější.

### `civil` (15 % váha)

| Index | Hodnota |
|---|---|
| FH E — Associational & Organizational Rights | 100 |
| FH G — Personal Autonomy & Individual Rights | 93.75 |

**Pilíř score: (100 + 93.75) / 2 = 96.9**

Rationale: Občanské svobody jsou nejlépe pokryté FH subskóre E (NGO, odbory, sdružování) a G (osobní autonomie, ochrana menšin). V-Dem civil liberties index by také seděl, ale per-faktor data nemáme.

### `corruption` (15 % váha)

| Index | Hodnota |
|---|---|
| TI Corruption Perceptions Index | 59 |

**Pilíř score: 59.0**

Rationale: TI CPI je referenční mezinárodní mérítko pro vnímání korupce. WJP „Absence of Corruption" by mělo být přidáno, ale per-faktor data nemáme; v současné iteraci je corruption pilíř jediný, který má jen jeden zdroj. Toto je vědomé — TI CPI je nejvíce respektovaný a CZ-specific signál.

**Důsledek:** corruption pilíř (59) je výrazně nižší než ostatní (84–97), což odráží reálnou diskrepanci v ČR — silné formální instituce, ale dlouhodobě vnímaná korupce. Toto **nepotřebuje normalizovat**, je to věrný signál.

## Vážený overall score

```
overall = electoral × 0.15 + governance × 0.20 + judicial × 0.20
        + media × 0.15 + civil × 0.15 + corruption × 0.15

       = 91.8 × 0.15 + 86.3 × 0.20 + 83.9 × 0.20
       + 92.0 × 0.15 + 96.9 × 0.15 + 59.0 × 0.15
       = 13.77 + 17.26 + 16.78 + 13.80 + 14.535 + 8.85
       = 85.0
```

**Strukturální baseline 2026-Q2 overall: 85.0**

Pro srovnání: EIU 2024 dává CZ 80.8, V-Dem LDI 81.7. Náš agregát 85.0 je o 3–4 body vyšší — odráží zahrnutí FH (95) a vážení směrem k oblastem, kde CZ skóruje silně (electoral, civil). Diskrepance je v rozsahu „normální variability mezi indexy" (~5–10 bodů), ne signál špatného mappingu.

## Pravidla pro update

1. **Roční:** když vyjdou nové reporty (typicky únor–květen), vytvoří se nový quarterly snapshot `data/structural/{nextQ}.json` s aktualizovanými hodnotami. Mapping zůstává stejný.
2. **Při změně mappingu:** bump verze v `methodology/CHANGELOG.md` (v0.2 → v0.3), nový quarterly snapshot, **nezasahovat do historických snapshotů**.
3. **Při dostupnosti per-faktor dat:** pokud V-Dem nebo WJP zveřejní per-factor scores, mapping se může zpřesnit — explicit changelog entry.

## Otevřené otázky (zdroje pro iter 6+)

1. **WJP per-factor scores.** WJP Rule of Law publikuje 8 faktorů (Constraints on Govt, Absence of Corruption, Open Govt, Fundamental Rights, Order & Security, Regulatory Enforcement, Civil Justice, Criminal Justice). Per-factor data jsou v interaktivním WJP profilu nebo v Excel datasetu — vyžaduje jednorázové ruční extrahování, ne web scrape. Při doplnění:
   - `governance` přidá WJP Constraints on Government + Regulatory Enforcement
   - `judicial` upřesní s Civil Justice + Criminal Justice (drop overall proxy)
   - `corruption` přidá WJP Absence of Corruption (víc než jen TI CPI)
   - `civil` přidá WJP Fundamental Rights + Order & Security

2. **V-Dem per-component.** V-Dem zveřejňuje desítky komponent (`v2x_polyarchy`, `v2x_libdem`, `v2x_partipdem`, `v2x_delibdem`, `v2x_egaldem`, plus jejich subindexy). Pro budoucí iteraci by `electoral` měl vytáhnout `v2x_polyarchy`, `governance` `v2x_libdem` (constraints), `media` `v2x_freexp_altinf`, etc.

3. **Bertelsmann BTI** zmíněný v CLAUDE.md není v tomto iter použit — chybí volně dostupné API/JSON, vyžaduje ruční extrakci. Iter 6+.

4. **EK Rule of Law Report (CZ kapitola)** zmíněný v CLAUDE.md také není použit — obsahuje kvalitativní hodnocení, ne numerické skóre. Mohl by sloužit jako kvalitativní validátor (např. pokud EK report z roku Y popisuje konkrétní problém v justici, očekáváme nižší WJP score v Y+1).

5. **Backtesting historických hodnot.** Iter 9+ by měl spočítat baseline pro 2018–2020 stejnou metodikou a porovnat s tehdejšími EIU/V-Dem skóre.
