# Index pillars

The index is structured into six pillars that together cover the institutional dimensions of liberal democracy. Each pillar has its own 0–100 subscore; the final index is a weighted average (weights see [`weights.md`](weights.md)).

This document defines what each pillar measures and does not measure, what subcomponents it covers, and how it maps onto established external indices. It serves as a reference manual for event classification — the rationale of every event must reference a specific subcomponent listed here.

> **Status: v0.1 draft (2026-04-28). Requires review before production use.**

---

## 1. Electoral — Electoral process and pluralism (weight 15 %)

### What it measures
Citizens’ ability to freely choose their representatives in fair elections with real political competition. This pillar is about the **input** of the democratic process — how power is gained and transferred.

### Subcomponents
- **E1. Electoral fairness.** Equal access to candidacy, transparent campaign financing, integrity of the count, independence of electoral bodies (the Central Electoral Commission, the Czech Statistical Office during elections).
- **E2. Political pluralism.** Real multi-party competition, no legal or de facto barriers for new entrants, public-service media access across the spectrum.
- **E3. Electoral infrastructure.** Vote security and auditability, defence against foreign manipulation, voter registry.
- **E4. Peaceful transfer of power.** The losers’ ability and willingness to accept the result; respect for institutional succession (Chamber of Deputies → government → president).

### What does not belong here
- Manipulation of the media agenda during a campaign belongs in `media`, not here.
- Corrupt financing of a specific campaign belongs in `corruption` (and usually here too; in that case it is classified primarily as `corruption` with a cross-reference in the rationale).

### Mapping to external indices
- **V-Dem:** Electoral Democracy Index (EDI), particularly components `v2x_polyarchy`, `v2elfrfair`, `v2elmulpar`.
- **EIU Democracy Index:** category *Electoral process and pluralism*.
- **Freedom House FitW:** sections A (Electoral Process), B (Political Pluralism and Participation).

### Example events
- Electoral law amended to favour one party (severity 4–5).
- A foreign-state disinformation campaign targeted at a specific election uncovered (severity 3–4).
- Major political actor questions election results without evidence (severity 3, escalates to 4 in case of violent expressions).

---

## 2. Governance — Functioning of government and parliament (weight 20 %)

### What it measures
A working separation of powers between executive and legislature, adherence to constitutional processes, quality of the legislative process. The pillar with the highest weight together with `judicial` — backsliding tendencies show up here most often.

### Subcomponents
- **G1. Separation of powers.** Real parliamentary control of the executive (interpellations, investigative committees), no abuse of expedited reading, respect for the role of the president and the Senate.
- **G2. Legislative quality.** Standard consultation procedures, adequate vacatio legis, sufficient time for debate, avoiding "riders".
- **G3. Stability of constitutional norms.** Frequency of constitutional crises, respect for Constitutional Court rulings by the government and parliament.
- **G4. Transparency of governance.** Access to information (Act 106/1999), publishing contracts (the contracts register), reporting by ministries.

### What does not belong here
- Compromising judicial independence → `judicial`.
- Conflict-of-interest scandals about ministers → `corruption` (but if they cause a constitutional crisis, secondarily here as well).
- Attacks on Czech Television / Czech Radio → `media`.

### Mapping
- **V-Dem:** `v2x_libdem` (liberal democracy), `v2lglegplo` (legislature constrains executive), `v2juhcind` (high court independence — cross-reference with judicial).
- **EIU:** *Functioning of government*.
- **Bertelsmann BTI:** Status Index — *Stability of democratic institutions*.
- **EC Rule of Law Report:** the chapter on the Czech legislative process.

### Example events
- Sweeping amendment passed under expedited reading without consultation (severity 3).
- Government systematically ignores a Constitutional Court ruling (severity 5).
- Prime minister refuses opposition interpellations for months (severity 3).
- President refuses to appoint members of a government proposed by the prime minister without a constitutionally acceptable reason (severity 4).

---

## 3. Judicial — Judicial independence and rule of law (weight 20 %)

### What it measures
Independence of the judiciary, predictability and enforceability of the law, protection from political influence over the courts. Tied with `governance` for highest weight — threats to judicial independence are one of the most common indicators of democratic backsliding.

### Subcomponents
- **J1. Independence of the Constitutional, Supreme and Supreme Administrative courts.** Appointment procedures, no executive interference in personnel matters, respect for rulings.
- **J2. Independence of ordinary courts.** Judicial councils, disciplinary procedures, protection from political pressure on individual judges or cases.
- **J3. Independence of the prosecution service.** The status of the Supreme State Prosecution, protection from political instructions in specific cases.
- **J4. Equality before the law.** Same treatment regardless of political position; length of proceedings against politically exposed persons.

### What does not belong here
- Corruption inside the judiciary (a judge taking bribes) → primarily `corruption`, secondarily here.
- Critical media coverage of a judge → `media` (freedom to criticise), not here.

### Mapping
- **V-Dem:** `v2x_jucon`, `v2juhcind`, `v2juncind`, `v2juflow`.
- **WJP Rule of Law Index:** all factors, particularly *Constraints on Government Powers* and *Civil/Criminal Justice*.
- **EC Rule of Law Report:** section *Justice system*.
- **Freedom House:** F1 (Independent judiciary).

### Example events
- Government proposes an amendment to the courts act expanding political interference in appointments (severity 4–5 depending on depth).
- Prime minister publicly attacks a specific judge in an ongoing case (severity 3–4).
- Senate rejects a constitutional-court appointment for political reasons without substantive criticism of the candidate (severity 3, escalates to 4 on repetition).
- Disciplinary procedure changed to make removing judges easier via a politically controlled body (severity 5).

---

## 4. Media — Media freedom (weight 15 %)

### What it measures
Plurality and independence of media, protection of journalists, access to information of public interest, independence of public-service broadcasters.

### Subcomponents
- **M1. Media plurality.** Ownership diversity, protection from concentration (especially the merging of political and media power in one person).
- **M2. Independence of Czech Television and Czech Radio.** Procedure for electing the boards, financing through licence fees, protection from political pressure on editorial content.
- **M3. Journalist safety.** No physical attacks, no legal harassment (SLAPP), no event-access bans for political reasons.
- **M4. Access to information.** A working Act 106/1999, sanctions for its breach, availability of open data.

### What does not belong here
- Disinformation campaigns during an election → `electoral`.
- Corruption by a specific journalist → `corruption`.

### Mapping
- **RSF Press Freedom Index:** overall score plus the *Political*, *Legal framework* and *Safety* indicators.
- **V-Dem:** `v2x_freexp_altinf`, `v2mecenefm`, `v2meharjrn`.
- **Freedom House:** D1 (Free media).
- **EC Rule of Law Report:** section *Media pluralism and freedom*.

### Example events
- Public-broadcaster law amended to introduce political appointment of the director-general (severity 5).
- Politician files a SLAPP suit against an investigative journalist (severity 3, more serious for larger amounts or repetition).
- A public broadcaster cancels a programme after political pressure (severity 3–4).
- A major outlet acquired by a person with an active political role (severity 4).

---

## 5. Civil — Civil liberties (weight 15 %)

### What it measures
Freedom of expression, assembly, association; protection of minorities; equality before the law in practice, not only on paper.

### Subcomponents
- **C1. Freedom of expression.** Protection of critical speech (even when uncomfortable for the government), absence of censorship.
- **C2. Freedom of assembly.** A real, not merely formal, right to demonstrate; proportionate police response.
- **C3. Freedom of association.** NGOs, unions, political parties — protection from administrative harassment.
- **C4. Protection of minorities.** Roma, LGBTQ+, migrants, religious minorities — protection from discrimination and from state indifference.
- **C5. Rights in the digital sphere.** Privacy, protection from state mass surveillance.

### What does not belong here
- Politically motivated criminal prosecutions → `judicial`.
- Discrimination in media → `media` (plurality) or here, depending on the nature.

### Mapping
- **V-Dem:** `v2x_civlib`, `v2cseeorgs`, `v2caassemb`.
- **Freedom House:** sections D (Freedom of Expression and Belief), E (Associational and Organizational Rights), F (Personal Autonomy and Individual Rights).
- **WJP:** *Fundamental Rights*.

### Example events
- Law passed restricting the right to demonstrate under specified conditions (severity 3–5 depending on scope).
- Police attack on a peaceful demonstration (severity 3–4).
- New NGO law introducing mandatory "foreign agent" registers (severity 5).
- Sustained refusal to protect a minority during attacks (severity 3, escalates with systematic pattern).

---

## 6. Corruption — Corruption and transparency (weight 15 %)

### What it measures
Both perceived and proven levels of corruption; transparency of public procurement, party financing, and asset declarations; effectiveness of anti-corruption institutions.

### Subcomponents
- **K1. Political corruption.** Conflicts of interest of constitutional officials, abuse of power for personal gain.
- **K2. Public procurement.** Transparency of tender procedures, the Public Procurement Act (ZZVZ), the contracts register.
- **K3. Political financing.** Transparent party accounts, rules for large donations, oversight by the Office for Supervision of the Management of Political Parties.
- **K4. Anti-corruption institutions.** NÚKIB, the Supreme Audit Office, GIBS, BIS — their independence and effectiveness.
- **K5. Whistleblowing.** A working Act 171/2023 on the protection of whistleblowers.

### What does not belong here
- Corruption inside the judiciary → primarily here, secondarily `judicial`.
- Corruption during an election campaign → primarily here, secondarily `electoral`.

### Mapping
- **TI CPI:** the overall index and year-on-year changes.
- **GRECO:** recommendations and their compliance.
- **V-Dem:** `v2x_corr`, `v2excrptps`.
- **EC Rule of Law Report:** the *Anti-corruption framework* chapter.

### Example events
- Prime minister fails to declare assets in their statement (severity 4).
- Public Procurement Act violated in a large contract with a political nexus (severity 3–4).
- Supreme Audit Office’s powers weakened (severity 4–5).
- A structural bribery scheme exposed (severity 4–5 depending on scope).

---

## How to resolve pillar overlap

Rules:

1. **Primary pillar = closest root cause.** A minister scandal → `corruption` (root cause), not `governance` (consequence).
2. **If an event has two comparable impacts:** classify by weight. The higher-weight pillar (governance/judicial = 20 %) takes precedence over the lighter ones (electoral/media/civil/corruption = 15 %), otherwise heavy backsliding events would be systematically underweighted.
3. **Cross-references go in the `rationale`.** The main pillar is one, but the rationale lists all relevant dimensions.
4. **In case of genuine uncertainty:** `severity: null, status: needs_review`. A pause is better than a wrong classification.
