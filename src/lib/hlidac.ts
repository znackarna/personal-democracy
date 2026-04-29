import { type RawArticle } from './types';

/**
 * Client for hlidacstatu.cz API v2 ([swagger](https://api.hlidacstatu.cz/swagger/index.html)).
 * License key (free tier) sent via `Authorization: Token <key>` header.
 *
 * Iter 1 surface: sponzoring (donations to political parties). Smlouvy + dotace
 * defer to next iteration — they need a watchlist + threshold strategy that
 * deserves dedicated design.
 */

const API_BASE = 'https://api.hlidacstatu.cz/api/v2';
const HLIDAC_OUTLET = 'Hlídač státu';
const HLIDAC_HOMEPAGE = 'https://www.hlidacstatu.cz';

/**
 * Major Czech political parties with active parliamentary representation,
 * keyed by IČO. Used to fan out sponzoring queries.
 *
 * Source: veřejný rejstřík (justice.cz). When a new party rises, add here.
 * If a party renames or merges, both the old IČO (for history) and new IČO
 * stay listed — historical donations won't move.
 */
export const POLITICAL_PARTIES: Record<string, string> = {
  '71443339': 'ANO 2011',
  '16192656': 'ODS',
  '00442704': 'KDU-ČSL',
  '71339728': 'TOP 09',
  '22875327': 'SPD',
  '26673908': 'STAN',
  '71339698': 'Česká pirátská strana',
  '22878660': 'Motoristé sobě',
  '00409171': 'ČSSD',
};

export interface HlidacClientOptions {
  apiKey?: string;
  /** For tests: inject custom fetcher. Receives URL + headers, returns raw text. */
  fetchJson?: (url: string, headers: Record<string, string>) => Promise<unknown>;
}

interface SponzoringRow {
  nameIdDarce?: string | null;
  jmenoDarce?: string | null;
  prijmeniDarce?: string | null;
  daumNarozeniDarce?: string | null;
  icoDarce?: string | null;
  icoPrijemce: string;
  typDaru?: string | null;
  hodnotaDaru: number;
  popis?: string | null;
  darovanoDne: string;
}

export class HlidacClient {
  private readonly apiKey: string;
  private readonly fetchJson: NonNullable<HlidacClientOptions['fetchJson']>;

  constructor(options: HlidacClientOptions = {}) {
    const apiKey = options.apiKey ?? process.env['HLIDAC_API_KEY'];
    if (!apiKey) {
      throw new Error('HLIDAC_API_KEY is not set. Set it in .env (free key from hlidacstatu.cz/api).');
    }
    this.apiKey = apiKey;
    this.fetchJson = options.fetchJson ?? defaultFetchJson;
  }

  /**
   * Returns all sponzoring records (donations) received by the party with
   * the given IČO. Hlídač returns full history, no pagination params; client
   * filters by date downstream.
   */
  async getSponzoring(icoStrany: string): Promise<SponzoringRow[]> {
    const url = `${API_BASE}/sponzoring/${encodeURIComponent(icoStrany)}`;
    const data = (await this.fetchJson(url, {
      Authorization: `Token ${this.apiKey}`,
    })) as SponzoringRow[];
    return Array.isArray(data) ? data : [];
  }
}

export interface FetchSponzoringOptions {
  client?: HlidacClient;
  /** Inclusive start date (ISO YYYY-MM-DD) for the donation window. */
  fromDate: string;
  /** Inclusive end date (ISO YYYY-MM-DD). */
  toDate: string;
  /** Donations below this CZK threshold are dropped (noise filter). Default 100 000 Kč. */
  minHodnotaCzk?: number;
  /** Override the party list (used in tests). */
  parties?: Record<string, string>;
}

const DEFAULT_MIN_HODNOTA = 100_000;

/**
 * Fetches sponzoring (party donations) for the given window and returns
 * them as RawArticle records ready to feed to the pre-filter / extractor.
 *
 * Filters:
 * - Donation date in [fromDate, toDate] inclusive.
 * - Donation value ≥ minHodnotaCzk (default 100 000 Kč) — drops the long tail
 *   of small individual contributions that aren't index-worthy.
 *
 * Each donation maps to one RawArticle. Text is synthesized in Czech with
 * structural data; the classifier decides whether it's a democracy event.
 */
export async function fetchPartyDonationsAsArticles(
  options: FetchSponzoringOptions,
): Promise<RawArticle[]> {
  const client = options.client ?? new HlidacClient();
  const parties = options.parties ?? POLITICAL_PARTIES;
  const minHodnota = options.minHodnotaCzk ?? DEFAULT_MIN_HODNOTA;
  const from = new Date(options.fromDate);
  const to = new Date(options.toDate);
  const fetchedAt = new Date().toISOString();

  const articles: RawArticle[] = [];
  for (const [ico, partyName] of Object.entries(parties)) {
    let rows: SponzoringRow[];
    try {
      rows = await client.getSponzoring(ico);
    } catch {
      // Fail soft: one party fetch error doesn't sink the whole adapter.
      continue;
    }
    for (const row of rows) {
      const date = new Date(row.darovanoDne);
      if (Number.isNaN(date.getTime())) continue;
      if (date < from || date > to) continue;
      if (row.hodnotaDaru < minHodnota) continue;
      articles.push(rowToArticle(row, ico, partyName, fetchedAt));
    }
  }
  return articles;
}

function rowToArticle(
  row: SponzoringRow,
  icoStrany: string,
  partyName: string,
  fetchedAt: string,
): RawArticle {
  const donor = formatDonor(row);
  const dateOnly = row.darovanoDne.slice(0, 10);
  const amount = formatAmountCzk(row.hodnotaDaru);
  const typLabel = formatTypDaru(row.typDaru);
  const title = `${partyName} obdržela ${typLabel} ${amount} od ${donor}`;
  const summary = [
    `${partyName} (IČO ${icoStrany}) přijala ${typLabel} v hodnotě ${amount} Kč od ${donor} dne ${dateOnly}.`,
    row.popis ? `Popis: ${row.popis}` : '',
    'Údaje pocházejí z databáze sponzoringu Hlídače státu (zdroj: výroční finanční zprávy stran v rejstříku stran a hnutí).',
  ]
    .filter(Boolean)
    .join(' ');

  // Hlídač nemá per-záznam URL; linkujeme na profil strany s donations výpisem.
  const url = `${HLIDAC_HOMEPAGE}/subjekt/${icoStrany}`;

  return {
    url,
    title,
    outlet: HLIDAC_OUTLET,
    fetched_at: fetchedAt,
    published_at: row.darovanoDne,
    summary,
  };
}

function formatDonor(row: SponzoringRow): string {
  const namedPerson = [row.jmenoDarce, row.prijmeniDarce].filter(Boolean).join(' ').trim();
  if (namedPerson) {
    return row.daumNarozeniDarce
      ? `${namedPerson} (nar. ${row.daumNarozeniDarce.slice(0, 10)})`
      : namedPerson;
  }
  if (row.icoDarce) return `IČO ${row.icoDarce}`;
  return 'neuvedený dárce';
}

function formatAmountCzk(value: number): string {
  // Intl `cs-CZ` separuje skupiny tisíců non-breaking space ().
  // Pro JSON-friendly output a snadné testování normalizujeme na ASCII space.
  return Math.round(value).toLocaleString('cs-CZ').replace(/\s/g, ' ');
}

function formatTypDaru(typ: string | null | undefined): string {
  switch (typ) {
    case 'FinancniDar':
      return 'finanční dar';
    case 'NepenezniDar':
    case 'NefinancniDar':
      return 'nefinanční dar';
    case 'BezuplatnePlneni':
      return 'bezúplatné plnění';
    case 'Ostatni':
      return 'jiné plnění';
    default:
      return typ ? `dar (${typ})` : 'dar';
  }
}

async function defaultFetchJson(url: string, headers: Record<string, string>): Promise<unknown> {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Hlídač státu fetch failed: HTTP ${res.status} for ${url}`);
  }
  return res.json();
}
