import { readFile } from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { z } from 'zod';

const DONATIONS_YAML = path.resolve(process.cwd(), 'config', 'donations.yaml');

const PLACEHOLDER = 'PLACEHOLDER';

const PaymentLinkSchema = z.object({
  amount: z.number().int().positive(),
  url: z.string().min(1),
});

const CurrencyLinksSchema = z.object({
  one_time: z.array(PaymentLinkSchema),
  custom_url: z.string().min(1),
  monthly: z.array(PaymentLinkSchema),
});

const CostItemSchema = z.object({
  id: z.string().min(1),
  czk: z.number().int().min(0),
});

const DonationsConfigSchema = z.object({
  version: z.literal(1),
  links: z.object({
    czk: CurrencyLinksSchema,
    eur: CurrencyLinksSchema,
  }),
  costs: z.object({
    display_rate_czk_per_eur: z.number().positive(),
    monthly: z.array(CostItemSchema),
  }),
  total_monthly_czk: z.number().int().min(0),
});

export type DonationsConfig = z.infer<typeof DonationsConfigSchema>;
export type PaymentLink = z.infer<typeof PaymentLinkSchema>;
export type CurrencyLinks = z.infer<typeof CurrencyLinksSchema>;
export type Currency = 'czk' | 'eur';
export type DonationMode = 'one_time' | 'monthly';

let cached: DonationsConfig | null = null;

/**
 * Read and validate donations config. Cached across calls in the same build
 * because the config is static. Throws on schema mismatch — that means a bad
 * commit and we want the build to fail loudly rather than silently render
 * broken buttons.
 */
export async function readDonationsConfig(): Promise<DonationsConfig> {
  if (cached) return cached;
  const raw = await readFile(DONATIONS_YAML, 'utf-8');
  const parsed = yaml.load(raw);
  cached = DonationsConfigSchema.parse(parsed);
  return cached;
}

/**
 * Has the operator filled in any real Stripe URL yet, or is the whole config
 * still placeholders? The support page uses this to decide between rendering
 * buttons or a "not yet active" banner.
 */
export function isAnyLinkConfigured(config: DonationsConfig): boolean {
  for (const currency of ['czk', 'eur'] as const) {
    const c = config.links[currency];
    if (c.custom_url !== PLACEHOLDER) return true;
    if (c.one_time.some((l) => l.url !== PLACEHOLDER)) return true;
    if (c.monthly.some((l) => l.url !== PLACEHOLDER)) return true;
  }
  return false;
}

export function isPlaceholder(url: string): boolean {
  return url === PLACEHOLDER;
}
