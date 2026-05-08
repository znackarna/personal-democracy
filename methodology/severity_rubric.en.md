# Event severity rubric

Each event receives a severity 1–5 and a direction `-1 / 0 / +1`. The point impact on the pillar subscore is a deterministic function of severity × direction:

| Severity | Subscore impact magnitude |
|---|---|
| 1 | ±0.2 |
| 2 | ±0.5 |
| 3 | ±1.5 |
| 4 | ±3.0 |
| 5 | ±6.0 |

These values are fixed. Changes are only allowed via a Git commit to this file with reasoning recorded in [`CHANGELOG.md`](CHANGELOG.md). The `score_impact` of every JSON event **must** correspond (severity × direction × this table); `validate.ts` enforces it.

> **Status: v0.1 draft (2026-04-28). Examples are illustrative and require calibration against real Czech cases.**

---

## Level 1 — Negligible incident (±0.2)

Statements without institutional impact, minor procedural lapses with no precedent value, one-off verbal attacks with no follow-on.

**Examples:**
- A politician calls a journalist an "activist" on social media without further escalation.
- Routine multi-day delay in publishing a vote in the Chamber of Deputies.
- A small mistake in an asset declaration without any sign of intent (corrected within 30 days).
- Brief technical issues with the Central Electoral Commission website before an election, quickly resolved.
- A public broadcaster briefly fails to air an interview with an opposition politician for a neutral reason (technical failure).

**When NOT:** repeated statements by the same person within a short period → escalates to 2+. Attacks accompanied by threats → higher.

---

## Level 2 — Minor one-off incident with local impact (±0.5)

A specific breach of a norm or process with limited impact; a controversial decision that doesn’t threaten the institution on its own but deserves to be recorded.

**Examples:**
- A short expedited reading (one of three mandatory periods cut) on a non-controversial bill, with no precedent value.
- Single ejection of a journalist from a specific outlet from a press conference, with subsequent apology.
- Politically motivated personnel intervention at the mid-level civil service (e.g. removing a department head) without a cascade effect.
- Sustained criticism of a specific judge by a politician (≥ 3 statements in a week) without calls for removal.
- A fine for inaccurate party accounting on the order of tens of thousands of crowns.

**When NOT:** repeated cuts of the reading periods → escalation. Ejection with precedent value for the entire outlet → 3+.

---

## Level 3 — Significant incident, broad impact or precedent (±1.5)

A specific event that creates a precedent or affects how an institution operates; sustained ignoring of a norm; an attack on the independence of a specific institution without long-term compromise.

**Examples:**
- Sweeping amendment passed under expedited reading without a consultation procedure (typically as a response to a "crisis" that isn’t one).
- Prime minister publicly attacks a specific judge in an ongoing case in a way that can be read as pressure on the decision.
- Senate or president rejects a constitutional-court appointment for political (not substantive) reasons — first occurrence in a series.
- Politician files a SLAPP suit worth millions of crowns against an investigative journalist.
- A Constitutional Court ruling that the government does not formally acknowledge within 30 days but does not yet fully ignore.
- Public-broadcaster law with proposals that change political control over electing the boards, but at an early stage (introduced, not adopted).
- The Office for Supervision of Political-Party Finances has its powers weakened (budget cut > 30 %, competence changes).

**When NOT:** if the event is part of a clearly identifiable structural trend → escalation to 4. If it’s in the "grey zone" between 2 and 3 → 2 + comment.

---

## Level 4 — Serious breach of a norm or process (±3.0)

An action with a direct impact on how a key institution functions, that creates a significant precedent, or that clearly crosses constitutional limits. Typically requires 2+ independent sources and an explicit reference to the violated norm.

**Examples:**
- Government systematically refuses to take measures arising from a Constitutional Court ruling for > 60 days.
- Disciplinary procedure changed to make it easier for a politically controlled body to remove judges (proposal + adoption in one chamber).
- A public broadcaster cancels a programme or removes a host after demonstrable political pressure.
- A major outlet (top 5 in Czechia) is acquired by a person with an active political role without a credible separation guarantee.
- Prime minister fails to declare assets worth tens of millions in their statement.
- A law passed restricting the right to demonstrate under specified conditions (e.g. "safety zones" with vague definitions).
- Politically motivated removal of an intelligence-service director without substantive cause.

**When NOT:** if it is already part of an identifiable pattern with further escalation → 5. If a successful correction follows quickly (law withdrawn, court ruling overturned) → downgrade to 3 + persistent.

---

## Level 5 — Structural shift, constitutional crisis, systemic change (±6.0)

Changes that fundamentally alter the institutional environment. The maximum possible impact for a single event. Requires 3+ independent sources and typically a response from international institutions (EC, GRECO, Venice Commission).

**Examples:**
- Adopted and effective amendment to the Constitutional Court Act changing the appointment procedure to favour the ruling majority.
- A passed law allowing a politically controlled body to remove judges without disciplinary proceedings.
- A passed amendment to the Czech Television/Radio Act introducing direct political election of the director-general by the Chamber of Deputies.
- Government ignores repeated Constitutional Court rulings for > 6 months in a way that violates a specific civic right.
- An NGO law introducing a mandatory "foreign agents" register or tax discrimination based on funding source.
- Disclosure of a structural bribery scheme involving constitutional officials with evidence from multiple independent sources.
- The independence of the Czech National Bank weakened by amending the CNB Act despite a negative ECB opinion.
- The Chamber of Deputies fails to convene after an election within the constitutionally prescribed deadline.

**When NOT:** if the event hasn’t reached adopted + effective status (just a proposal) → typically 4 + persistent. If a quick reversal follows (within 30 days) → keep at 5 but with persistent + plan to resolved.

---

## Calibration rules

### Escalation (severity upgrade)
- **+1 level** if the event is part of a demonstrable pattern (≥ 3 similar incidents from the same actor in the last 12 weeks).
- **+1 level** if the response of an international body (EC, GRECO, Venice Commission, ECtHR) confirms a breach of a norm.
- **+1 level** if there is a formal document (law, decree, decision) versus a mere intent.

### De-escalation (severity downgrade)
- **−1 level** if the event is quickly corrected through an institutional mechanism (veto, Constitutional Court annulment, withdrawal) within < 30 days — but the event remains on record.
- **−1 level** if the event is purely verbal with no practical impact after > 30 days.

### When `severity: null + status: needs_review`
- Sources disagree on basic facts.
- Only one source and the event has potential severity 3+.
- Political context obscures the institutional impact (e.g. an interpretation fight over whether something is or is not a constitutional crisis).
- Claude API hesitates between two adjacent levels during classification (e.g. "3 or 4") → null + comment for a human reviewer.

### Direction (`+1 / 0 / -1`)
- `-1`: the event **weakens** democratic institutions.
- `+1`: the event **strengthens** them (passing a major anti-corruption law, appointing an independent figure, ratifying a protective convention).
- `0`: ambiguous; institutional impact is neither clearly positive nor negative (e.g. reorganisation without obvious benefit or harm). Rare in practice — when in doubt, prefer null + needs_review.

### Anti-bias check when picking severity
1. Would I assign the same severity to the opposite political party? If not, **adjust or escalate to needs_review**.
2. Am I responding to facts or to mood? If mood, **downgrade or null**.
3. Do I have a specific reference to a rubric point (e.g. "§3 — broad consequences")? If not, **the rationale is insufficient**.
