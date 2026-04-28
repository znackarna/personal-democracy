# Classification prompt — TODO (iterace 2)

Prompt pro Claude Sonnet, kterým `src/pipeline/extract-events.ts` klasifikuje pre-filtrované zprávy do strukturovaných events.

**Stav:** Stub. Plný prompt se napíše až s implementací `extract-events.ts` v iteraci 2 — dříve nedává smysl, protože by se musel přepsat podle reálných pre-filter outputů.

## Hrubý nástřel obsahu (k dopracování)

1. Role a cíl: kategorizace zpráv do JSON eventů podle [`schemas/event.schema.json`](../schemas/event.schema.json).
2. Vstupní kontext: full text [`methodology/severity_rubric.md`](../methodology/severity_rubric.md) a [`methodology/pillars.md`](../methodology/pillars.md).
3. Output formát: striktně JSON, validovatelný proti event schématu.
4. Mantinely podle CLAUDE.md sekce „Mantinely pro Claude":
    - parafrázovat, max 1 citát < 15 slov / zdroj,
    - žádné události bez ověřitelného URL,
    - při nejistotě `severity: null + status: needs_review`,
    - rationale musí odkazovat na konkrétní bod rubric.
5. Anti-bias instrukce: aplikovat stejný práh napříč politickým spektrem.

## Závislosti
- Až se prompt psát bude, použít prompt caching pro celé methodology kontextu (změny vzácné, vstupní zprávy se mění).
