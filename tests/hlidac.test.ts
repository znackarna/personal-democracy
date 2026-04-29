import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchPartyDonationsAsArticles,
  HlidacClient,
} from '../src/lib/hlidac';

afterEach(() => {
  delete process.env['HLIDAC_API_KEY'];
});

describe('HlidacClient', () => {
  it('throws if HLIDAC_API_KEY is not set', () => {
    expect(() => new HlidacClient()).toThrow(/HLIDAC_API_KEY/);
  });

  it('passes Authorization: Token header to fetcher', async () => {
    const fetchJson = vi.fn().mockResolvedValue([]);
    const client = new HlidacClient({ apiKey: 'test-key', fetchJson });
    await client.getSponzoring('71443339');
    expect(fetchJson).toHaveBeenCalledWith(
      expect.stringContaining('/sponzoring/71443339'),
      { Authorization: 'Token test-key' },
    );
  });

  it('handles non-array API response gracefully (returns [])', async () => {
    const fetchJson = vi.fn().mockResolvedValue({ error: 'unknown' });
    const client = new HlidacClient({ apiKey: 'test-key', fetchJson });
    expect(await client.getSponzoring('71443339')).toEqual([]);
  });
});

describe('fetchPartyDonationsAsArticles', () => {
  it('returns articles for donations within the date window above threshold', async () => {
    const fetchJson = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/sponzoring/71443339')) {
        return [
          {
            icoDarce: '00011835',
            icoPrijemce: '71443339',
            typDaru: 'FinancniDar',
            hodnotaDaru: 1_000_000,
            darovanoDne: '2025-06-15T00:00:00',
          },
          {
            icoDarce: '00011836',
            icoPrijemce: '71443339',
            typDaru: 'FinancniDar',
            hodnotaDaru: 50_000, // below threshold
            darovanoDne: '2025-06-16T00:00:00',
          },
          {
            icoDarce: '00011837',
            icoPrijemce: '71443339',
            typDaru: 'FinancniDar',
            hodnotaDaru: 500_000,
            darovanoDne: '2024-12-15T00:00:00', // outside window
          },
        ];
      }
      return [];
    });
    const client = new HlidacClient({ apiKey: 'test-key', fetchJson });
    const articles = await fetchPartyDonationsAsArticles({
      client,
      fromDate: '2025-06-01',
      toDate: '2025-06-30',
      parties: { '71443339': 'ANO 2011' },
    });
    expect(articles).toHaveLength(1);
    expect(articles[0]?.title).toContain('ANO 2011');
    expect(articles[0]?.title).toContain('1 000 000');
    expect(articles[0]?.title).toContain('IČO 00011835');
    expect(articles[0]?.outlet).toBe('Hlídač státu');
    expect(articles[0]?.url).toContain('71443339');
    expect(articles[0]?.published_at).toBe('2025-06-15T00:00:00');
  });

  it('formats donor name when present', async () => {
    const fetchJson = vi.fn().mockResolvedValue([
      {
        jmenoDarce: 'Jan',
        prijmeniDarce: 'Novák',
        daumNarozeniDarce: '1970-05-12T00:00:00',
        icoDarce: null,
        icoPrijemce: '71443339',
        typDaru: 'FinancniDar',
        hodnotaDaru: 200_000,
        darovanoDne: '2025-06-15T00:00:00',
      },
    ]);
    const client = new HlidacClient({ apiKey: 'test-key', fetchJson });
    const articles = await fetchPartyDonationsAsArticles({
      client,
      fromDate: '2025-06-01',
      toDate: '2025-06-30',
      parties: { '71443339': 'ANO 2011' },
    });
    expect(articles[0]?.title).toContain('Jan Novák');
    expect(articles[0]?.summary).toContain('Jan Novák');
    expect(articles[0]?.summary).toContain('1970-05-12');
  });

  it('respects custom minHodnotaCzk threshold', async () => {
    const fetchJson = vi.fn().mockResolvedValue([
      {
        icoDarce: '00011835',
        icoPrijemce: '71443339',
        typDaru: 'FinancniDar',
        hodnotaDaru: 75_000,
        darovanoDne: '2025-06-15T00:00:00',
      },
    ]);
    const client = new HlidacClient({ apiKey: 'test-key', fetchJson });
    const above = await fetchPartyDonationsAsArticles({
      client,
      fromDate: '2025-06-01',
      toDate: '2025-06-30',
      minHodnotaCzk: 50_000,
      parties: { '71443339': 'ANO 2011' },
    });
    const below = await fetchPartyDonationsAsArticles({
      client,
      fromDate: '2025-06-01',
      toDate: '2025-06-30',
      minHodnotaCzk: 100_000,
      parties: { '71443339': 'ANO 2011' },
    });
    expect(above).toHaveLength(1);
    expect(below).toHaveLength(0);
  });

  it('soft-fails when one party fetch errors (others continue)', async () => {
    const fetchJson = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/sponzoring/71443339')) {
        throw new Error('HTTP 500');
      }
      return [
        {
          icoDarce: '00099999',
          icoPrijemce: '16192656',
          typDaru: 'FinancniDar',
          hodnotaDaru: 500_000,
          darovanoDne: '2025-06-15T00:00:00',
        },
      ];
    });
    const client = new HlidacClient({ apiKey: 'test-key', fetchJson });
    const articles = await fetchPartyDonationsAsArticles({
      client,
      fromDate: '2025-06-01',
      toDate: '2025-06-30',
      parties: { '71443339': 'ANO 2011', '16192656': 'ODS' },
    });
    expect(articles).toHaveLength(1);
    expect(articles[0]?.title).toContain('ODS');
  });
});
