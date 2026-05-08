import { type Pillar } from '@/lib/types';
import type { Locale } from './index';

/**
 * Per-pillar context for the dashboard. Holds a brief digest of methodology/pillars.md
 * (or pillars.en.md) so a casual reader can grasp:
 *   - what the pillar measures (1-2 sentences)
 *   - which subcomponents it contains (3-4 main ones)
 *   - examples of events that **lower** the score
 *   - examples of events that **raise** the score
 *
 * Changes here must correspond to methodology/pillars.md (single source of truth).
 * If they diverge, the full description in the methodology wins.
 */

export interface PillarInfo {
  /** Short locale-specific name. */
  shortName: string;
  /** Full locale-specific name. */
  fullName: string;
  /** 1-2 sentences describing what the pillar measures. */
  description: string;
  /** Main subcomponents (3-4). */
  subcomponents: readonly string[];
  /** Examples of events that **lower** the score (3 items, varied severity). */
  lowerExamples: readonly string[];
  /** Examples of events that **raise** the score (2 items). */
  raiseExamples: readonly string[];
}

const PILLAR_INFO_CS: Record<Pillar, PillarInfo> = {
  electoral: {
    shortName: 'Volby',
    fullName: 'Volební proces a pluralismus',
    description:
      'Schopnost občanů svobodně volit zástupce v férových volbách s reálnou politickou soutěží. Měří **input** demokratického procesu — jak se moc získává a předává.',
    subcomponents: [
      'Férovost voleb (rovný přístup, transparentní financování, regulérnost sčítání)',
      'Politický pluralismus (reálná soutěž více stran, dostupnost veřejnoprávních médií napříč spektrem)',
      'Volební infrastruktura (auditovatelnost, ochrana před zahraniční manipulací)',
      'Pokojné předání moci (respekt k institucionální posloupnosti)',
    ],
    lowerExamples: [
      'Změna volebního zákona ve prospěch jedné strany (severity 4–5)',
      'Odhalení dezinformační kampaně cizího státu zaměřené na konkrétní volby (severity 3–4)',
      'Pokus o zpochybnění výsledků voleb významným politickým aktérem bez důkazů (severity 3)',
    ],
    raiseExamples: [
      'Posílení transparentnosti financování kampaní (severity 2–3)',
      'Úspěšná obrana proti pokusu o volební manipulaci (severity 2–3)',
    ],
  },

  governance: {
    shortName: 'Vládnutí',
    fullName: 'Fungování vlády a parlamentu',
    description:
      'Funkční dělba moci mezi exekutivou a legislativou, dodržování ústavních procesů, kvalita legislativního procesu. Pilíř s nejvyšší vahou — tady se nejčastěji projevují backsliding tendence.',
    subcomponents: [
      'Dělba moci (kontrola exekutivy parlamentem, role prezidenta a Senátu)',
      'Kvalita legislativy (připomínkové řízení, přiměřená legisvakance, vyhýbání se přílepkům)',
      'Stabilita ústavních norem (respekt k nálezům ÚS)',
      'Transparentnost vládnutí (zákon 106, registr smluv, výkaznost ministerstev)',
    ],
    lowerExamples: [
      'Schválení rozsáhlé novely ve zkráceném čtení bez připomínkového řízení (severity 3)',
      'Vláda systematicky ignoruje nález ÚS po > 60 dnech (severity 4)',
      'Premiér odmítá interpelace opozice po dobu měsíců (severity 3)',
    ],
    raiseExamples: [
      'Posílení parlamentní kontroly přes novou vyšetřovací komisi (severity 2–3)',
      'Vláda akceptuje a implementuje nepříjemný nález ÚS (severity 2)',
    ],
  },

  judicial: {
    shortName: 'Justice',
    fullName: 'Soudní nezávislost a právní stát',
    description:
      'Nezávislost soudnictví, předvídatelnost a vymahatelnost práva, ochrana před politickým ovlivňováním justice. Společně s Vládnutím má nejvyšší váhu — útoky na nezávislost justice jsou nejčastějším ukazatelem demokratického backslidingu.',
    subcomponents: [
      'Nezávislost ÚS, NS, NSS (procedury jmenování, nezasahování exekutivy)',
      'Nezávislost obecných soudů (soudcovské rady, ochrana před politickým tlakem na konkrétní soudce)',
      'Nezávislost státního zastupitelství (postavení NSZ, ochrana před politickými instrukcemi)',
      'Rovnost před zákonem (stejné zacházení bez ohledu na politické postavení)',
    ],
    lowerExamples: [
      'Premiér veřejně útočí na konkrétního soudce v probíhající kauze (severity 3–4)',
      'Vláda navrhne novelu zákona o soudech rozšiřující politické zásahy do jmenování (severity 4–5)',
      'Změna kárného řízení směrem ke snazšímu odvolávání soudců politicky kontrolovaným orgánem (severity 5)',
    ],
    raiseExamples: [
      'Posílení role soudcovských rad v personálních věcech (severity 2–3)',
      'Úspěšná obrana proti politickému tlaku na NSZ (severity 2)',
    ],
  },

  media: {
    shortName: 'Média',
    fullName: 'Mediální svoboda',
    description:
      'Pluralita a nezávislost médií, ochrana novinářů, přístup k informacím veřejného zájmu, nezávislost veřejnoprávních médií.',
    subcomponents: [
      'Mediální pluralita (vlastnická diverzita, ochrana před koncentrací)',
      'Nezávislost ČT a ČRo (volba Rady ČT/ČRo, koncesionářské poplatky)',
      'Bezpečnost novinářů (žádné fyzické útoky, právní šikana SLAPP)',
      'Přístup k informacím (zákon 106/1999, otevřená data)',
    ],
    lowerExamples: [
      'Politik podá SLAPP žalobu v hodnotě milionů Kč na investigativního novináře (severity 3)',
      'Akvizice významného média osobou s aktivní politickou rolí (severity 4)',
      'Novela zákona o ČT/ČRo zavádějící politickou volbu generálního ředitele (severity 5)',
    ],
    raiseExamples: [
      'Zlepšení ochrany zdrojů novinářů legislativou (severity 2–3)',
      'Odmítnutí SLAPP žaloby soudem s jasným precedentem (severity 2)',
    ],
  },

  civil: {
    shortName: 'Svobody',
    fullName: 'Občanské svobody',
    description:
      'Svoboda projevu, shromažďování, sdružování; ochrana menšin; rovnost před zákonem v praxi, nikoli jen formálně.',
    subcomponents: [
      'Svoboda projevu (ochrana kritického projevu, absence cenzury)',
      'Svoboda shromažďování (reálné právo demonstrovat, přiměřená policejní reakce)',
      'Svoboda sdružování (NGOs, odbory, ochrana před administrativní šikanou)',
      'Ochrana menšin (Romové, LGBTQ+, migranti, náboženské menšiny)',
      'Práva v digitálním prostoru (soukromí, ochrana před masovým sledováním)',
    ],
    lowerExamples: [
      'Útok policie na pokojnou demonstraci (severity 3–4)',
      'Schválení zákona omezujícího právo demonstrovat za stanovených podmínek (severity 3–5)',
      'Nový zákon o NGO zavádějící povinné registry „zahraničních agentů" (severity 5)',
    ],
    raiseExamples: [
      'Legalizace stejnopohlavních partnerství / manželství (severity 3)',
      'Posílení ochrany před masovým sledováním státem (severity 2–3)',
    ],
  },

  corruption: {
    shortName: 'Korupce',
    fullName: 'Korupce a transparentnost',
    description:
      'Vnímaná i prokázaná míra korupce; transparentnost veřejných zakázek, financování stran, majetkových přiznání; účinnost protikorupčních institucí.',
    subcomponents: [
      'Politická korupce (střet zájmů ústavních činitelů, zneužívání pravomoci)',
      'Veřejné zakázky (transparentnost ZZVZ, registr smluv)',
      'Financování politiky (transparentní účty stran, kontrola Úřadu pro dohled)',
      'Protikorupční instituce (NÚKIB, NKÚ, GIBS, BIS)',
      'Whistleblowing (zákon 171/2023 o ochraně oznamovatelů)',
    ],
    lowerExamples: [
      'Premiér nepřizná aktiva v majetkovém přiznání (severity 4)',
      'Porušení ZZVZ ve velké zakázce s politickou návazností (severity 3–4)',
      'Oslabení pravomocí NKÚ (severity 4–5)',
    ],
    raiseExamples: [
      'Anti-korupční razie NCOZ s zadrženími a EPPO dohledem (severity 3 ↑)',
      'Posílení Úřadu pro dohled nad hospodařením politických stran (severity 3)',
    ],
  },
};

const PILLAR_INFO_EN: Record<Pillar, PillarInfo> = {
  electoral: {
    shortName: 'Elections',
    fullName: 'Electoral process and pluralism',
    description:
      'Citizens’ ability to freely choose their representatives in fair elections with real political competition. Measures the **input** of the democratic process — how power is gained and transferred.',
    subcomponents: [
      'Electoral fairness (equal access, transparent financing, integrity of the count)',
      'Political pluralism (real multi-party competition, public-service media access across the spectrum)',
      'Electoral infrastructure (auditability, defence against foreign manipulation)',
      'Peaceful transfer of power (respect for institutional succession)',
    ],
    lowerExamples: [
      'Electoral law amended to favour one party (severity 4–5)',
      'A foreign-state disinformation campaign targeted at a specific election uncovered (severity 3–4)',
      'Major political actor questions election results without evidence (severity 3)',
    ],
    raiseExamples: [
      'Stronger transparency in campaign financing (severity 2–3)',
      'Successful defence against an attempt at electoral manipulation (severity 2–3)',
    ],
  },

  governance: {
    shortName: 'Governance',
    fullName: 'Functioning of government and parliament',
    description:
      'A working separation of powers between executive and legislature, adherence to constitutional processes, quality of the legislative process. The pillar with the highest weight — backsliding tendencies show up here most often.',
    subcomponents: [
      'Separation of powers (parliamentary control of the executive, role of the president and the Senate)',
      'Legislative quality (consultation procedures, adequate vacatio legis, avoiding "riders")',
      'Stability of constitutional norms (respect for Constitutional Court rulings)',
      'Transparency of governance (FOIA / Act 106, contracts register, ministerial reporting)',
    ],
    lowerExamples: [
      'Sweeping amendment passed under expedited reading without consultation (severity 3)',
      'Government systematically ignores a Constitutional Court ruling for > 60 days (severity 4)',
      'Prime minister refuses opposition interpellations for months (severity 3)',
    ],
    raiseExamples: [
      'Stronger parliamentary control through a new investigative committee (severity 2–3)',
      'Government accepts and implements an unwelcome Constitutional Court ruling (severity 2)',
    ],
  },

  judicial: {
    shortName: 'Judiciary',
    fullName: 'Judicial independence and rule of law',
    description:
      'Independence of the judiciary, predictability and enforceability of law, protection from political influence over the courts. Tied with Governance for highest weight — attacks on judicial independence are the most common indicator of democratic backsliding.',
    subcomponents: [
      'Independence of the Constitutional, Supreme and Supreme Administrative courts (appointment procedures, no executive interference)',
      'Independence of ordinary courts (judicial councils, protection from political pressure on individual judges)',
      'Independence of the prosecution service (status of the Supreme State Prosecution, protection from political instructions)',
      'Equality before the law (same treatment regardless of political position)',
    ],
    lowerExamples: [
      'Prime minister publicly attacks a specific judge in an ongoing case (severity 3–4)',
      'Government proposes an amendment expanding political interference in judicial appointments (severity 4–5)',
      'Disciplinary procedure changed to make removing judges easier via a politically controlled body (severity 5)',
    ],
    raiseExamples: [
      'Stronger role for judicial councils in personnel matters (severity 2–3)',
      'Successful defence against political pressure on the prosecution service (severity 2)',
    ],
  },

  media: {
    shortName: 'Media',
    fullName: 'Media freedom',
    description:
      'Plurality and independence of media, protection of journalists, access to information of public interest, independence of public-service broadcasters.',
    subcomponents: [
      'Media plurality (ownership diversity, protection from concentration)',
      'Independence of Czech Television and Czech Radio (election of the boards, licence fees)',
      'Journalist safety (no physical attacks, no SLAPP-style legal harassment)',
      'Access to information (Act 106/1999, open data)',
    ],
    lowerExamples: [
      'Politician files a SLAPP suit worth millions of crowns against an investigative journalist (severity 3)',
      'A major outlet acquired by a person with an active political role (severity 4)',
      'Public-broadcaster law amended to introduce political appointment of the director-general (severity 5)',
    ],
    raiseExamples: [
      'Stronger legal protection of journalists’ sources (severity 2–3)',
      'Court rejects a SLAPP suit with a clear precedent (severity 2)',
    ],
  },

  civil: {
    shortName: 'Civil rights',
    fullName: 'Civil liberties',
    description:
      'Freedom of expression, assembly, association; protection of minorities; equality before the law in practice, not only on paper.',
    subcomponents: [
      'Freedom of expression (protection of critical speech, absence of censorship)',
      'Freedom of assembly (real right to demonstrate, proportionate police response)',
      'Freedom of association (NGOs, unions, protection from administrative harassment)',
      'Protection of minorities (Roma, LGBTQ+, migrants, religious minorities)',
      'Rights in the digital sphere (privacy, protection from mass surveillance)',
    ],
    lowerExamples: [
      'Police attack on a peaceful demonstration (severity 3–4)',
      'Law passed restricting the right to demonstrate under specified conditions (severity 3–5)',
      'New NGO law introducing mandatory "foreign agent" registers (severity 5)',
    ],
    raiseExamples: [
      'Legalisation of same-sex partnerships / marriage (severity 3)',
      'Stronger protection from state mass surveillance (severity 2–3)',
    ],
  },

  corruption: {
    shortName: 'Corruption',
    fullName: 'Corruption and transparency',
    description:
      'Both perceived and proven levels of corruption; transparency of public procurement, party financing, and asset declarations; effectiveness of anti-corruption institutions.',
    subcomponents: [
      'Political corruption (conflicts of interest of constitutional officials, abuse of power)',
      'Public procurement (transparency under the Public Procurement Act, contracts register)',
      'Political financing (transparent party accounts, oversight by the supervisory authority)',
      'Anti-corruption institutions (NÚKIB, Supreme Audit Office, GIBS, BIS)',
      'Whistleblowing (Act 171/2023 on the protection of whistleblowers)',
    ],
    lowerExamples: [
      'Prime minister fails to declare assets in their statement (severity 4)',
      'Public Procurement Act violated in a large contract with a political nexus (severity 3–4)',
      'Supreme Audit Office’s powers weakened (severity 4–5)',
    ],
    raiseExamples: [
      'Anti-corruption raid by NCOZ with arrests and EPPO oversight (severity 3 ↑)',
      'Strengthened oversight of political-party finances (severity 3)',
    ],
  },
};

export function getPillarInfo(locale: Locale): Record<Pillar, PillarInfo> {
  return locale === 'cs' ? PILLAR_INFO_CS : PILLAR_INFO_EN;
}

/**
 * pillars.md uses headings like "## 3. Judicial — ...". rehype-slug turns
 * these into anchor IDs; for simplicity we link to the pillar's section
 * heading using a known suffix pattern. Both files (pillars.md and pillars.en.md)
 * are written with the same heading numbering and pillar names so a single
 * map works.
 */
export function pillarAnchorId(pillar: Pillar, locale: Locale): string {
  if (locale === 'cs') {
    return {
      electoral: '1-electoral--volební-proces-a-pluralismus-váha-15-',
      governance: '2-governance--fungování-vlády-a-parlamentu-váha-20-',
      judicial: '3-judicial--soudní-nezávislost-a-právní-stát-váha-20-',
      media: '4-media--mediální-svoboda-váha-15-',
      civil: '5-civil--občanské-svobody-váha-15-',
      corruption: '6-corruption--korupce-a-transparentnost-váha-15-',
    }[pillar];
  }
  return {
    electoral: '1-electoral--electoral-process-and-pluralism-weight-15-',
    governance: '2-governance--functioning-of-government-and-parliament-weight-20-',
    judicial: '3-judicial--judicial-independence-and-rule-of-law-weight-20-',
    media: '4-media--media-freedom-weight-15-',
    civil: '5-civil--civil-liberties-weight-15-',
    corruption: '6-corruption--corruption-and-transparency-weight-15-',
  }[pillar];
}
