# Váhy pilířů — zdůvodnění

## Aktuální váhy (v0.1)

| Pilíř | Váha | Pozn. |
|---|---|---|
| `electoral` | 15 % | Volební proces a pluralismus |
| `governance` | **20 %** | Dělba moci, kvalita legislativy |
| `judicial` | **20 %** | Nezávislost soudnictví, právní stát |
| `media` | 15 % | Mediální svoboda a pluralita |
| `civil` | 15 % | Občanské svobody |
| `corruption` | 15 % | Korupce a transparentnost |

Součet = 100 %.

> **Status: v0.1 draft (2026-04-28). Vyžaduje review.**

---

## Princip vážení

Váhy jsou normativní volba. Tento dokument vysvětluje **proč právě tyto hodnoty**, ne **jaká hodnota je objektivně správná** — žádná taková neexistuje.

Vodítka, podle kterých byly váhy stanoveny:

1. **Empirická literatura backslidingu.** Studie demokratického backslidingu (Bermeo 2016, Levitsky & Ziblatt 2018, V-Dem reports 2020+) opakovaně identifikují útoky na **soudní nezávislost** a **kvalitu legislativního procesu** jako nejčastější a nejúčinnější kanály eroze. Proto `judicial` a `governance` dostávají mírně vyšší váhu (20 % každý).
2. **Detekovatelnost mezi ročními aktualizacemi.** Cíl projektu je včasná detekce změny směru. `electoral` se mění zřídka (volby v intervalech 4 let pro PSP); `media` a `corruption` se sledují kontinuálně. Vyšší frekvence událostí v některém pilíři neznamená vyšší váhu — to by zkreslilo skóre. Proto **frekvence sama o sobě neovlivňuje váhu**.
3. **Nezávislost dimenzí.** Pilíře jsou navrženy jako co nejvíce nezávislé (viz [`pillars.md`](pillars.md), sekce o překryvu). Stejné váhy odpovídají hypotéze, že jsou srovnatelně důležité; rozdílné váhy 15/20 odráží empirický důkaz, že některé jsou kanálem rychlejšího backslidingu.

---

## Diskuze alternativ

### A) Stejné váhy (16.67 % každý)

**Pro:** Jednoduché, žádný subjektivní vstup, snadno obhajitelné jako "neutrální". V-Dem v některých sub-indexech používá rovné váhy.

**Proti:** Implicitně tvrdí, že např. úplné zrušení nezávislosti soudů má stejnou váhu jako lokální mediální incident s podobnou závažností. Empiricky to neodpovídá tomu, jak demokracie umírají.

**Závěr:** Zamítnuto, ale rovné váhy jsou užitečný **kontrolní výpočet** — index by měl být uveden i s touto variantou na stránce metodiky pro transparentnost.

### B) `judicial` a `governance` po 25 % (zbývajících 50 % rovnoměrně)

**Pro:** Silnější důraz na strukturální dimenze, konzistentnější s literaturou.

**Proti:** Marginalizuje `civil` a `media`, které jsou v ČR kontextu velmi živé (mediální koncentrace, ochrana menšin). Riziko, že důležité trendy v těchto oblastech zaniknou v skóre.

**Závěr:** Zamítnuto, příliš agresivní. Pokud by validace ukázala, že `judicial` + `governance` korelují více s EIU/V-Dem než ostatní pilíře, lze v0.2 posunout na 22.5/22.5.

### C) Dynamické váhy (závislé na kontextu)

**Pro:** Adaptivní na situaci.

**Proti:** Ničí porovnatelnost v čase. Backtesting přestává dávat smysl. Otevírá obrovský prostor pro motivované manipulace ("v této situaci dáváme judiciál vyšší váhu, protože…").

**Závěr:** **Trvale zamítnuto.** Váhy musí být fixní v rámci verze metodiky.

---

## Pravidla pro změnu vah

1. Změna vah = **nová verze metodiky** (v0.1 → v0.2). Není to oprava, je to revize.
2. Každá změna vyžaduje:
    - Commit do [`weights.md`](weights.md) a [`CHANGELOG.md`](CHANGELOG.md) s explicitním odůvodněním.
    - **Přepočet celé historické řady skóre** s novými vahami a uložení obou řad (v0.x a v0.y) v `data/scores/`. Stará verze nezaniká.
    - Vyznačení změny v dashboardu.
3. Změnu lze navrhnout pouze:
    - Po **kvartální validaci** (viz `methodology/validation_YYYY-Qx.md`), pokud se index trvale a systematicky odchyluje od EIU/V-Dem o > 10 bodů ve směru, který nelze vysvětlit aktuální událostí.
    - Po podstatné změně metodiky některého z primárních zdrojů (V-Dem zásadně přepočítá EDI, EIU změní subkategorie).
4. **Nikdy** nelze měnit váhy v reakci na konkrétní politický výsledek (volby, krize) — to by byl jasný signál motivované úpravy.
