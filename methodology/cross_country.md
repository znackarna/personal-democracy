# Srovnání zemí napříč indexy

Stránka [/srovnani/](/srovnani/) zobrazuje, jak si Česko stojí ve srovnání
s vybranými zeměmi (V4 + DE/AT + USA + UK) napříč šesti mezinárodními indexy
demokracie a právního státu. Slouží jako externí benchmark pro náš týdenní
index — ne jako jeho input.

## Vybrané země

8 zemí ve dvou skupinách:

- **Česko (CZ)** a **Slovensko (SK)** — visuálně highlightnuté, primární
  reference pro českého čtenáře (společná historie, obdobné postkomunistické
  výchozí podmínky, dnes různé trajektorie).
- **V4 zbytek** — Polsko (PL), Maďarsko (HU). Rozšiřují postkomunistický
  kontext a ukazují polarizaci uvnitř regionu (PL po vládní změně 2023
  rule-of-law improvement, HU pokračující backsliding).
- **Sousedé** — Německo (DE), Rakousko (AT). Konsolidované demokracie
  s podobnou geografií a obchodními vazbami; benchmark "kde bychom mohli
  být".
- **Globální anglosféra** — USA, UK. Velké západní demokracie, často
  citované jako reference; oba indexy je nyní řadí níže než ČR.

EU-27 průměr záměrně **vynechán**: jednotlivé indexy ho oficiálně publikují
nekonzistentně a neoficiální výpočet (simple vs population-weighted) by
zaváděl methodology bias. 8 konkrétních zemí je čitelnější než agregát.

## Vybrané indexy

| Index | Vydavatel | Rok | Stupnice | Typ |
|---|---|---|---|---|
| **EIU** Democracy Index | Economist Intelligence Unit | 2025 | 0–10 | multi-dimension (5 sub-pillarů) |
| **V-Dem** Liberal Democracy Index | V-Dem Institute (Gothenburg) | 2025 | 0–1 | multi-dimension |
| **FH FitW** Freedom in the World | Freedom House | 2025 | 0–100 | multi-dimension (PR + CL) |
| **RSF** Press Freedom Index | Reporters Without Borders | 2025 | 0–100 | single-dimension (média) |
| **TI CPI** Corruption Perceptions Index | Transparency International | 2025 | 0–100 | single-dimension (korupce) |
| **WJP** Rule of Law Index | World Justice Project | 2024 | 0–1 | single-dimension (justice) |

Pro fair vizuální srovnání jsou v UI heatmap matice **všechny indexy
normalizované do 0–100** (přes `scale_max`). Bar charty zachovávají raw
hodnoty s nativní stupnicí indexu (osa Y odpovídá originálnímu rozsahu).

## Metodologické pozadí

### Multi-dimension vs single-dimension

- **Multi-dimension** (EIU, V-Dem, FH) jsou kompozitní indexy — agregace
  desítek až stovek indikátorů. Měří „celkový stav demokracie".
- **Single-dimension** (RSF, TI CPI, WJP) měří jednu konkrétní dimenzi
  (mediální svobodu, vnímání korupce, právní stát). Tyto indexy se
  v našem CZ baselinu používají jako proxy pro konkrétní pilíř (RSF
  → media, TI → corruption, WJP → judicial).

Detail mappingu na náš index v
[Strukturální mapování](/metodika/strukturalni-mapovani/).

### Roky publikace

Každý index má jiný cyklus:

| Index | Cyklus publikace | Aktuální edice |
|---|---|---|
| EIU | jaro | duben 2026 (Democracy Index 2025) |
| V-Dem | jaro | jaro 2026 (V-Dem 2026 edition, data 2025) |
| FH FitW | březen | březen 2025 (FitW 2025, data 2024) |
| RSF | květen | květen 2025 (PFI 2025, data 2024) |
| TI CPI | leden/únor | únor 2026 (CPI 2025, data 2025) |
| WJP | říjen | říjen 2024 (WJP 2024, data 2024) |

Naše CZ baseline (`data/structural/2026-Q3.json`) může mít na některé
indexy o jednu edici starší data — ne všechny indexy stíháme inkorporovat
ihned (viz
[CHANGELOG v0.2.2](/metodika/zmeny/) → TODO Q4 baseline). Cross-country
stránka používá vždy **nejnovější dostupnou edici**, takže drobné rozdíly
mezi cross-country zobrazením a CZ baseline jsou očekávané.

### Proč CZ + SK highlight

CZ je primárně český projekt, SK je nejbližší srovnání (společná historie,
obdobný geografický a kulturní kontext, podobná míra postkomunistické
transformace). Vizuální highlight pomáhá scan paternu „kde jsme my
+ kde jsou ti nejbližší". Ostatní země jsou kontextový bench.

## Co cross-country srovnání NENÍ

- **Není to predikce** — indexy měří minulé období, naše dashboard
  doplňuje prvky z aktuálního týdne.
- **Není to ranking championship** — drobné rozdíly mezi sousedními
  zeměmi (1–3 body) typicky leží uvnitř measurement error každého
  indexu. Reálná interpretace stojí na trajektorii v čase, ne na
  konkrétním pořadí v daném roce.
- **Nezahrnuje to politické názory** — zobrazujeme čísla z metodologie
  každého indexu, žádné vlastní hodnocení.

## Update workflow

Cross-country data se aktualizují **manuálně po publikaci nové edice
indexu** (typicky 1–4× ročně podle indexu). Workflow:

1. Sledovat publikační kalendář (V-Dem jaro, EIU jaro, FH březen,
   RSF květen, TI leden/únor, WJP říjen).
2. Po publikaci nové edice fetch dat pro všech 8 zemí (Wikipedia
   agregát + vlastní stránka indexu pro verifikaci).
3. Edit `data/cross_country/indexes.json` — bump `year`, update
   `values`, případně `sub_pillars`.
4. Aktualizovat `source_note` (datum publikace).
5. Commit s message `cross-country: <index> <rok>`.

Není to automatizované, protože tato data se nemění týdně a manuální
audit per-zem je důležitější než frekvence updatů.

## Související

- [Šest pilířů](/metodika/pilire/) — co každý pilíř měří v našem indexu
- [Strukturální mapování](/metodika/strukturalni-mapovani/) — jak se
  z těchto externích indexů počítá CZ baseline
- [Validation report 2026-Q2](/metodika/validace-2026-q2/) — kvartální
  porovnání náš index ↔ jednotlivé externí indexy pro CZ
