import Link from 'next/link';
import { CrossCountryBars } from '../components/CrossCountryBars';
import { CrossCountryMatrix } from '../components/CrossCountryMatrix';
import { InfoBox } from '../components/InfoBox';
import { readCrossCountry } from '../lib/data';

export default async function CrossCountryPage() {
  const data = await readCrossCountry();

  if (!data) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
        <p>Cross-country data nejsou k dispozici.</p>
      </section>
    );
  }

  const highlightCount = data.countries.filter((c) => c.highlight).length;

  return (
    <div className="space-y-10">
      <section>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
          Srovnání zemí
        </h1>
        <p className="max-w-3xl text-slate-600">
          Jak si Česko stojí ve srovnání s {data.countries.length - 1} dalšími zeměmi (V4 +
          Německo, Rakousko, USA, UK) napříč {data.indexes.length} mezinárodními indexy
          demokracie a právního státu. Externí benchmark — <strong>nevstupuje do našeho
          týdenního indexu</strong>, slouží jen pro kontextové srovnání.
        </p>
      </section>

      <InfoBox title="Co tady vidíš a co tady nevidíš" readMore={{ slug: 'srovnani-zemi' }}>
        <p>
          <strong>Heatmap matice</strong> dole zobrazuje všechny indexy normalizované do
          stupnice 0–100, aby se daly porovnat (EIU 0–10 a V-Dem 0–1 jsou jinak v jiných
          jednotkách). Barva buňky odpovídá normalizovanému skóre — zelená ≥80, žlutá
          50–79, oranžová/červená pod tím. Raw hodnoty (originální stupnice) jsou
          v tooltipu po najetí.
        </p>
        <p>
          <strong>Bar charty</strong> pod tabulkou ukazují každý index zvlášť na své
          nativní stupnici, aby zůstaly čitelné originální hodnoty. EIU má navíc 5
          subpilířů (volební proces, fungování vlády, politická participace, politická
          kultura, občanské svobody) — ty často odhalí, co konkrétně overall skóre
          posunulo.
        </p>
        <p>
          <strong>{highlightCount} země</strong> jsou barevně highlightnuté: ČR (modře)
          a SK (tyrkysově) jako primární kontext pro českého čtenáře. Ostatní jsou
          šedé. <strong>Drobné rozdíly</strong> mezi sousedními zeměmi (1–3 b.) typicky
          leží uvnitř měřicí chyby každého indexu — reálná interpretace stojí na
          trajektorii v čase, ne na konkrétním pořadí v daném roce.
        </p>
      </InfoBox>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          Přehled — všechny indexy, všechny země
        </h2>
        <CrossCountryMatrix data={data} />
        <p className="mt-3 text-xs text-slate-500">
          Stupnice: zelená ≥80 (volný / plně demokratický), světle zelená 70–79,
          žlutá 60–69, oranžová 50–59, červená pod tím. Hodnoty zachovávají originální
          stupnici indexu (EIU 0–10, V-Dem a WJP 0–1, ostatní 0–100); barva buňky podle
          normalizace. Pro detail metodiky každého indexu klikni na zkratku v záhlaví
          sloupce.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          Detail po jednotlivých indexech
        </h2>
        <p className="mb-6 max-w-3xl text-sm text-slate-600">
          Každý index s nativní stupnicí. EIU má rozpad na 5 subpilířů, FH na PR + CL.
          Země seřazené sestupně podle skóre (CZ a SK barevně highlightnuté).
        </p>
        <CrossCountryBars countries={data.countries} indexes={data.indexes} />
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Metodika a zdroje</h3>
        <p className="text-sm text-slate-700">
          Plný popis výběru zemí, indexů, ročníků publikace a procesu manuálního
          updatu v{' '}
          <Link href="/metodika/srovnani-zemi/" className="underline hover:text-slate-900">
            metodice srovnání zemí
          </Link>
          . Pro mapping externích indexů na náš weekly CZ index viz{' '}
          <Link
            href="/metodika/strukturalni-mapovani/"
            className="underline hover:text-slate-900"
          >
            Strukturální mapování
          </Link>
          .
        </p>
        {data.notes && (
          <p className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-500">
            {data.notes}
          </p>
        )}
      </section>
    </div>
  );
}
