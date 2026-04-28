# Rubric závažnosti událostí

Každá událost dostává závažnost 1–5 a směr `-1 / 0 / +1`. Bodový dopad na subskóre pilíře je deterministická funkce závažnosti × směru:

| Závažnost | Směrnicový dopad subskóre |
|---|---|
| 1 | ±0.2 |
| 2 | ±0.5 |
| 3 | ±1.5 |
| 4 | ±3.0 |
| 5 | ±6.0 |

Tyto hodnoty jsou zafixované. Změnu lze provést jen Git commitem do tohoto souboru s odůvodněním v [`CHANGELOG.md`](CHANGELOG.md). `score_impact` v každém JSON eventu **musí** odpovídat (severity × direction × této tabulce); `validate.ts` to bude kontrolovat.

> **Status: v0.1 draft (2026-04-28). Příklady jsou ilustrativní a vyžadují kalibraci podle reálných ČR případů.**

---

## Úroveň 1 — Zanedbatelný incident (±0.2)

Výroky bez institucionálního dopadu, drobné procedurální nedostatky bez precedentního charakteru, jednorázové verbální útoky bez následků.

**Příklady:**
- Politik na sociální síti označí novináře za „aktivistu" bez další eskalace.
- Rutinní zpoždění zveřejnění hlasování v PSP o několik dní.
- Drobná chyba v majetkovém přiznání bez náznaku úmyslu (oprava do 30 dnů).
- Krátkodobé technické problémy s webem ÚVK před volbami, rychle vyřešené.
- Veřejnoprávní médium krátce neodvysílá interview s opozičním politikem z neutrálního důvodu (technická závada).

**Kdy NE:** opakované výroky stejnou osobou v krátkém čase → eskalace na 2+. Útoky doprovázené hrozbami → vyšší.

---

## Úroveň 2 — Drobný jednorázový incident s lokálním dopadem (±0.5)

Konkrétní porušení normy nebo procesu s omezeným dopadem; kontroverzní rozhodnutí, které samo o sobě neohrožuje instituci, ale zaslouží si zaznamenání.

**Příklady:**
- Krátké zkrácené čtení (jedna ze tří povinných lhůt zkrácena) na nekontroverzním zákoně bez precedentu.
- Jednorázové vyloučení novináře konkrétního média z tiskové konference s následnou omluvou.
- Politicky motivovaný personální zásah na střední úrovni státní správy (např. odvolání ředitele odboru) bez kaskádového efektu.
- Soustavná kritika konkrétního soudce politikem (≥ 3 vystoupení v týdnu) bez výzev k odvolání.
- Pokuta za nepřesné účetnictví strany v řádu desítek tisíc Kč.

**Kdy NE:** opakované zkracování čtení → eskalace. Vyloučení s precedentní hodnotou pro celé médium → 3+.

---

## Úroveň 3 — Významný incident, široký dopad nebo precedent (±1.5)

Konkrétní událost, která vytváří precedent nebo má dopad na chod instituce; soustavné ignorování normy; útok na nezávislost konkrétní instituce bez její dlouhodobé kompromitace.

**Příklady:**
- Schválení rozsáhlé novely ve zkráceném čtení bez připomínkového řízení (typicky reagující na "krizi", která krizí není).
- Premiér veřejně útočí na konkrétního soudce v probíhající kauze způsobem, který lze interpretovat jako tlak na rozhodnutí.
- Senát nebo prezident zamítne jmenování ústavního soudce z politických (nikoli věcných) důvodů — první výskyt v sérii.
- Politik podá SLAPP žalobu v hodnotě milionů Kč na investigativního novináře.
- Nález ÚS, který vláda formálně neuzná během 30 dnů ale ještě plně nezačne ignorovat.
- Zákon o ČT/ČRo s návrhy, které mění politickou kontrolu nad volbou rad, ale je v rané fázi (předložen, neschválen).
- Oslabení pravomocí Úřadu pro dohled nad hospodařením politických stran (snížení rozpočtu o > 30 %, kompetenční změny).

**Kdy NE:** Pokud je událost součástí jasně identifikovatelného strukturálního trendu → eskalace na 4. Pokud je v "šedé zóně" mezi 2 a 3 → 2 + komentář.

---

## Úroveň 4 — Závažné porušení normy nebo procesu (±3.0)

Akce, která má přímý dopad na fungování klíčové instituce, vytváří významný precedent, nebo jasně překračuje ústavní hranice. Typicky vyžaduje 2+ nezávislé zdroje a explicitní odkaz na narušenou normu.

**Příklady:**
- Vláda systematicky odmítá přijmout opatření vyplývající z nálezu ÚS po > 60 dnech.
- Změna kárného řízení směrem ke snazšímu odvolávání soudců politicky kontrolovaným orgánem (návrh + schválení v jedné komoře).
- Veřejnoprávní médium zruší pořad nebo odvolá moderátora po prokazatelném politickém tlaku.
- Akvizice významného média (top 5 ČR) osobou s aktivní politickou rolí bez důvěryhodné záruky odstupu.
- Premiér nepřizná aktiva v hodnotě desítek milionů v majetkovém přiznání.
- Schválení zákona omezujícího právo demonstrovat za stanovených podmínek (např. „bezpečnostní zóny" s vágní definicí).
- Politicky motivované odvolání ředitele zpravodajské služby bez věcného důvodu.

**Kdy NE:** Pokud již je součástí identifikovatelného vzorce s další eskalací → 5. Pokud existuje úspěšná korekce (zákon vrácen, soud zrušen) v krátké době → downgrade na 3 + persistent.

---

## Úroveň 5 — Strukturální posun, ústavní krize, systémová změna (±6.0)

Změny, které zásadně mění institucionální prostředí. Maximální možný dopad jedné události. Vyžadují 3+ nezávislé zdroje a typicky reakci mezinárodních institucí (EK, GRECO, Venice Commission).

**Příklady:**
- Schválená a účinná novela zákona o ústavním soudě, která mění proceduru jmenování ve prospěch vládnoucí většiny.
- Schválený zákon, který umožňuje politicky kontrolovanému orgánu odvolávat soudce bez kárného řízení.
- Schválená novela zákona o ČT/ČRo, která zavádí přímou politickou volbu generálního ředitele Sněmovnou.
- Vláda ignoruje opakované nálezy ÚS po > 6 měsíců způsobem, který narušuje konkrétní právo občanů.
- Zákon o NGO zavádějící povinný registr „zahraničních agentů" nebo daňovou diskriminaci podle zdroje financování.
- Odhalení strukturálního schématu praní úplatků zahrnujícího ústavní činitele s důkazy z více nezávislých zdrojů.
- Oslabení nezávislosti ČNB cestou novelizace zákona o ČNB navzdory negativnímu stanovisku ECB.
- Nesvolání PSP po volbách v ústavně předpokládaném termínu.

**Kdy NE:** Pokud událost nemá schválenou + účinnou podobu (jen návrh) → typicky 4 + persistent. Pokud následuje rychlé zrušení (do 30 dnů) → ponechat 5 ale s persistent + plán na resolved.

---

## Pravidla kalibrace

### Eskalace (upgrade severity)
- **+1 úroveň** pokud je událost součástí prokazatelného vzorce (≥ 3 podobné incidenty od stejného aktéra v posledních 12 týdnech).
- **+1 úroveň** pokud reakce mezinárodního orgánu (EK, GRECO, Venice Commission, ESLP) potvrzuje porušení normy.
- **+1 úroveň** pokud existuje formální dokument (zákon, vyhláška, rozhodnutí) versus pouhý záměr.

### De-eskalace (downgrade severity)
- **−1 úroveň** pokud je událost rychle korigována institucionálním mechanismem (vetování, zrušení ÚS, návrat) ve lhůtě < 30 dnů — ale událost zůstává v záznamu.
- **−1 úroveň** pokud je událost čistě verbální bez praktického dopadu po > 30 dnech.

### Kdy `severity: null + status: needs_review`
- Zdroje se rozcházejí v základních faktech.
- Pouze jeden zdroj a událost má potenciálně závažnost 3+.
- Politický kontext zatemňuje institucionální dopad (např. interpretační boj o to, zda něco je nebo není ústavní krize).
- Claude API v rámci klasifikace váhá mezi dvěma sousedními úrovněmi (např. „3 nebo 4") → null + komentář pro lidského reviewera.

### Direction (`+1 / 0 / -1`)
- `-1`: událost demokratické instituce **oslabuje**.
- `+1`: událost je **posiluje** (přijetí klíčového protikorupčního zákona, jmenování nezávislé osobnosti, ratifikace ochranné konvence).
- `0`: ambivalentní; institucionální dopad není jednoznačně pozitivní ani negativní (např. reorganizace bez jasného přínosu nebo újmy). V praxi vzácné — pokud Claude váhá, preferuj null + needs_review.

### Anti-bias kontrola při výběru severity
1. Aplikoval bych stejnou závažnost na opačnou politickou stranu? Pokud ne, **upravit nebo eskalovat na needs_review**.
2. Reaguji na fakta nebo na atmosféru? Pokud na atmosféru, **downgrade nebo null**.
3. Mám konkrétní odkaz na bod rubric (např. „§3 — broad consequences")? Pokud ne, **rationale je nedostatečné**.
