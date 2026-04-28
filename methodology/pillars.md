# Pilíře indexu

Index je strukturovaný do šesti pilířů, které dohromady pokrývají institucionální dimenze liberální demokracie. Každý pilíř má vlastní subskóre 0–100; finální index je vážený průměr (váhy viz [`weights.md`](weights.md)).

Tento dokument vymezuje, co každý pilíř měří a neměří, jaké subkomponenty zahrnuje a jak se mapuje na zavedené externí indexy. Slouží jako referenční manuál pro klasifikaci událostí — rationale každé události musí odkazovat na konkrétní subkomponentu zde.

> **Status: v0.1 draft (2026-04-28). Vyžaduje review před použitím v produkci.**

---

## 1. Electoral — Volební proces a pluralismus (váha 15 %)

### Co měří
Schopnost občanů svobodně volit zástupce v férových volbách s reálnou politickou soutěží. Tento pilíř je o **inputu** demokratického procesu — jak se moc získává a předává.

### Subkomponenty
- **E1. Férovost voleb.** Rovný přístup ke kandidatuře, transparentní financování kampaní, regulérnost sčítání hlasů, nezávislost volebních orgánů (ÚVK, ČSÚ při volbách).
- **E2. Politický pluralismus.** Reálná soutěž více stran, žádné zákonné ani de facto bariéry pro nové subjekty, dostupnost veřejnoprávních médií napříč spektrem.
- **E3. Volební infrastruktura.** Bezpečnost a auditovatelnost hlasování, ochrana před zahraniční manipulací, registr voličů.
- **E4. Pokojné předání moci.** Schopnost a ochota poražených uznat výsledek; respekt k institucionální posloupnosti (Poslanecká sněmovna → vláda → prezident).

### Co nepatří jinam
- Manipulace s mediální agendou v kampani patří do `media`, ne sem.
- Korupční financování konkrétní kampaně patří do `corruption` (a obvykle i sem; pak se klasifikuje primárně do `corruption` a křížově se zmiňuje v rationale).

### Mapování na externí indexy
- **V-Dem:** Electoral Democracy Index (EDI), zejm. komponenty `v2x_polyarchy`, `v2elfrfair`, `v2elmulpar`.
- **EIU Democracy Index:** kategorie *Electoral process and pluralism*.
- **Freedom House FitW:** sekce A (Electoral Process), B (Political Pluralism and Participation).

### Příklady událostí
- Změna volebního zákona ve prospěch jedné strany (severity 4–5).
- Odhalení dezinformační kampaně cizího státu zaměřené na konkrétní volby (severity 3–4).
- Pokus o zpochybnění výsledků voleb významným politickým aktérem bez důkazů (severity 3, eskaluje na 4 při násilných projevech).

---

## 2. Governance — Fungování vlády a parlamentu (váha 20 %)

### Co měří
Funkční dělba moci mezi exekutivou a legislativou, dodržování ústavních procesů, kvalita legislativního procesu. Pilíř s nejvyšší vahou společně s `judicial` — tady se nejčastěji projevují backsliding tendence.

### Subkomponenty
- **G1. Dělba moci.** Reálná kontrola exekutivy parlamentem (interpelace, vyšetřovací komise), nezneužívání zkrácených čtení, respekt k roli prezidenta a Senátu.
- **G2. Kvalita legislativy.** Standardní připomínkové řízení, přiměřená legisvakance, dostatek času pro debatu, vyhýbání se přílepkům.
- **G3. Stabilita ústavních norem.** Frekvence ústavních krizí, respekt k nálezům ÚS ze strany vlády a parlamentu.
- **G4. Transparentnost vládnutí.** Přístup k informacím (zákon 106/1999), zveřejňování smluv (registr smluv), výkaznost ministerstev.

### Co nepatří jinam
- Kompromitace nezávislosti soudů → `judicial`.
- Skandály ohledně střetu zájmů ministrů → `corruption` (ale pokud způsobují ústavní krizi, sekundárně i sem).
- Útoky na ČT/ČRo → `media`.

### Mapování
- **V-Dem:** `v2x_libdem` (liberal democracy), `v2lglegplo` (legislature constrains executive), `v2juhcind` (high court independence — křížově s judicial).
- **EIU:** *Functioning of government*.
- **Bertelsmann BTI:** Status Index — *Stability of democratic institutions*.
- **EK Rule of Law Report:** kapitola o legislativním procesu CZ.

### Příklady událostí
- Schválení rozsáhlé novely ve zkráceném čtení bez připomínkového řízení (severity 3).
- Vláda systematicky ignoruje nález ÚS (severity 5).
- Premiér odmítne odpovídat na interpelace opozice po dobu měsíců (severity 3).
- Prezident odmítne jmenovat členy vlády navrženého premiérem bez ústavně přijatelného důvodu (severity 4).

---

## 3. Judicial — Soudní nezávislost a právní stát (váha 20 %)

### Co měří
Nezávislost soudnictví, předvídatelnost a vymahatelnost práva, ochrana před politickým ovlivňováním justice. Společně s `governance` má nejvyšší váhu — ohrožení nezávislosti justice je jeden z nejčastějších ukazatelů demokratického backslidingu.

### Subkomponenty
- **J1. Nezávislost ÚS, NS, NSS.** Procedury jmenování, nezasahování exekutivy do personálních věcí, respekt k rozhodnutím.
- **J2. Nezávislost obecných soudů.** Soudcovské rady, kárné řízení, ochrana před politickým tlakem na konkrétní soudce nebo kauzy.
- **J3. Nezávislost státního zastupitelství.** Postavení NSZ, ochrana před politickými instrukcemi v konkrétních kauzách.
- **J4. Rovnost před zákonem.** Stejné zacházení bez ohledu na politické postavení; doba trvání řízení proti politicky exponovaným osobám.

### Co nepatří jinam
- Korupce uvnitř justice (úplatkářství soudce) → primárně `corruption`, sekundárně sem.
- Kritická média o soudci → `media` (svoboda kritiky), nikoli sem.

### Mapování
- **V-Dem:** `v2x_jucon`, `v2juhcind`, `v2juncind`, `v2juflow`.
- **WJP Rule of Law Index:** všechny faktory, zejm. *Constraints on Government Powers* a *Civil/Criminal Justice*.
- **EK Rule of Law Report:** sekce *Justice system*.
- **Freedom House:** F1 (Independent judiciary).

### Příklady událostí
- Vláda navrhne novelu zákona o soudech, která rozšiřuje politické zásahy do jmenování (severity 4–5 podle hloubky).
- Premiér veřejně útočí na konkrétního soudce v probíhající kauze (severity 3–4).
- Senát zamítne jmenování ústavního soudce z politických důvodů bez věcné kritiky kandidáta (severity 3, eskaluje na 4 při opakování).
- Změna kárného řízení směrem ke snazšímu odvolávání soudců politicky kontrolovaným orgánem (severity 5).

---

## 4. Media — Mediální svoboda (váha 15 %)

### Co měří
Pluralita a nezávislost médií, ochrana novinářů, přístup k informacím veřejného zájmu, nezávislost veřejnoprávních médií.

### Subkomponenty
- **M1. Mediální pluralita.** Vlastnická diverzita, ochrana před koncentrací (zejm. spojení politické a mediální moci v jedné osobě).
- **M2. Nezávislost ČT a ČRo.** Procedura volby Rady ČT/ČRo, financování koncesionářskými poplatky, ochrana před politickým tlakem na editoriální obsah.
- **M3. Bezpečnost novinářů.** Žádné fyzické útoky, právní šikana (SLAPP), zákazy přístupu na akce z politických důvodů.
- **M4. Přístup k informacím.** Funkční zákon 106/1999, sankce za jeho porušení, dostupnost otevřených dat.

### Co nepatří jinam
- Dezinformační kampaně v kampani → `electoral`.
- Korupce konkrétního novináře → `corruption`.

### Mapování
- **RSF Press Freedom Index:** celkové skóre + indikátory *Political*, *Legal framework*, *Safety*.
- **V-Dem:** `v2x_freexp_altinf`, `v2mecenefm`, `v2meharjrn`.
- **Freedom House:** D1 (Free media).
- **EK Rule of Law Report:** sekce *Media pluralism and freedom*.

### Příklady událostí
- Změna zákona o ČT zavádějící politickou volbu generálního ředitele (severity 5).
- Politik podá SLAPP žalobu na investigativního novináře (severity 3, závažnější při větších částkách nebo opakování).
- Veřejnoprávní médium zruší pořad po politickém tlaku (severity 3–4).
- Akvizice významného média osobou s aktivní politickou rolí (severity 4).

---

## 5. Civil — Občanské svobody (váha 15 %)

### Co měří
Svoboda projevu, shromažďování, sdružování; ochrana menšin; rovnost před zákonem v praxi, nikoli jen formálně.

### Subkomponenty
- **C1. Svoboda projevu.** Ochrana kritického projevu (i nepříjemného pro vládu), absence cenzury.
- **C2. Svoboda shromažďování.** Reálné, nikoli jen formální právo demonstrovat; přiměřená policejní reakce.
- **C3. Svoboda sdružování.** NGOs, odbory, politické strany — ochrana před administrativní šikanou.
- **C4. Ochrana menšin.** Romové, LGBTQ+, migranti, náboženské menšiny — ochrana před diskriminací a státním nezájmem.
- **C5. Práva v digitálním prostoru.** Soukromí, ochrana před masovým sledováním státem.

### Co nepatří jinam
- Politicky motivovaná trestní stíhání → `judicial`.
- Diskriminace v médiích → `media` (pluralita) nebo zde, podle povahy.

### Mapování
- **V-Dem:** `v2x_civlib`, `v2cseeorgs`, `v2caassemb`.
- **Freedom House:** sekce D (Freedom of Expression and Belief), E (Associational and Organizational Rights), F (Personal Autonomy and Individual Rights).
- **WJP:** *Fundamental Rights*.

### Příklady událostí
- Schválení zákona omezujícího právo demonstrovat za určitých podmínek (severity 3–5 podle rozsahu).
- Útok policie na pokojnou demonstraci (severity 3–4).
- Nový zákon o NGO zavádějící povinné registry pro tzv. "zahraniční agenty" (severity 5).
- Soustavné odmítání ochrany menšiny při útocích (severity 3, eskaluje při systematičnosti).

---

## 6. Corruption — Korupce a transparentnost (váha 15 %)

### Co měří
Vnímaná i prokázaná míra korupce; transparentnost veřejných zakázek, financování stran, majetkových přiznání; účinnost protikorupčních institucí.

### Subkomponenty
- **K1. Politická korupce.** Střet zájmů ústavních činitelů, zneužívání pravomoci pro osobní prospěch.
- **K2. Veřejné zakázky.** Transparentnost zadávacích řízení, ZZVZ, registr smluv.
- **K3. Financování politiky.** Transparentní účty stran, pravidla pro velké dary, kontrola Úřadu pro dohled nad hospodařením politických stran.
- **K4. Protikorupční instituce.** NÚKIB, NKÚ, GIBS, BIS — jejich nezávislost a účinnost.
- **K5. Whistleblowing.** Funkčnost zákona o ochraně oznamovatelů (171/2023).

### Co nepatří jinam
- Korupce uvnitř soudů → primárně sem, sekundárně `judicial`.
- Korupce ve volební kampani → primárně sem, sekundárně `electoral`.

### Mapování
- **TI CPI:** celkový index a změny meziročně.
- **GRECO:** doporučení a jejich plnění.
- **V-Dem:** `v2x_corr`, `v2excrptps`.
- **EK Rule of Law Report:** kapitola *Anti-corruption framework*.

### Příklady událostí
- Premiér nepřizná aktiva v majetkovém přiznání (severity 4).
- Porušení ZZVZ ve velké zakázce s politickou návazností (severity 3–4).
- Oslabení pravomocí NKÚ (severity 4–5).
- Odhalení strukturálního schématu praní úplatků (severity 4–5 podle rozsahu).

---

## Jak vyřešit překryv pilířů

Pravidla:

1. **Primární pilíř = nejbližší kořenová příčina.** Skandál ministra → `corruption` (kořen), nikoli `governance` (důsledek).
2. **Pokud událost má dva srovnatelné dopady:** klasifikuj podle váhy. Pilíř s vyšší váhou (governance/judicial = 20 %) má přednost před lehčím (electoral/media/civil/corruption = 15 %), protože jinak by se těžké backsliding události systematicky podceňovaly.
3. **Křížové odkazy patří do `rationale`.** Hlavní pilíř je jeden, ale rationale uvádí všechny relevantní dimenze.
4. **Při skutečné nejistotě:** `severity: null, status: needs_review`. Lepší pauza než špatné zařazení.
