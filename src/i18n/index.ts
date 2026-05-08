/**
 * Minimal type-safe i18n. No runtime framework; the locale is passed as a prop
 * down the tree. Each route group ((cs) and (en)) has its own root layout that
 * sets <html lang> and the locale prop.
 *
 * Static export friendly: messages are imported (not fetched) so build output
 * contains both translations baked in.
 */
import { messagesCs } from './messages-cs';
import { messagesEn } from './messages-en';

export type Locale = 'cs' | 'en';

export const LOCALES: readonly Locale[] = ['cs', 'en'] as const;
export const DEFAULT_LOCALE: Locale = 'cs';

export type Messages = typeof messagesCs;

const ALL_MESSAGES: Record<Locale, Messages> = {
  cs: messagesCs,
  en: messagesEn,
};

export function getMessages(locale: Locale): Messages {
  return ALL_MESSAGES[locale];
}

// ============================================================
// Slug routing
// ============================================================

/**
 * Top-level route slug maps. Czech is canonical (without prefix); English is
 * always under /en/ with translated slugs.
 *
 * - /             ↔  /en
 * - /udalosti     ↔  /en/events
 * - /srovnani     ↔  /en/comparison
 * - /metodika     ↔  /en/methodology
 */
export const TOP_LEVEL_SLUGS: Record<Locale, { events: string; comparison: string; methodology: string }> = {
  cs: {
    events: 'udalosti',
    comparison: 'srovnani',
    methodology: 'metodika',
  },
  en: {
    events: 'events',
    comparison: 'comparison',
    methodology: 'methodology',
  },
};

/**
 * Methodology document slugs per locale. Order matches the curated registry
 * order shown in the TOC. Used by:
 *  - the methodology index page (TOC link generation)
 *  - the [slug] page (generateStaticParams)
 *  - the locale switcher (translates current methodology slug to other locale)
 *  - InfoBox readMore links (resolves a stable doc key to a locale-specific URL)
 *
 * The "key" here is the doc identifier — stable across locales, used when
 * components pass `readMore={{ doc: 'severity' }}`.
 */
export const METHODOLOGY_SLUGS = {
  pillars: { cs: 'pilire', en: 'pillars' },
  severity: { cs: 'zavaznost', en: 'severity' },
  weights: { cs: 'vahy', en: 'weights' },
  governance: { cs: 'model-dohledu', en: 'governance' },
  structuralMapping: { cs: 'strukturalni-mapovani', en: 'structural-mapping' },
  sources: { cs: 'zdroje', en: 'sources' },
  publicOpinion: { cs: 'verejne-mineni', en: 'public-opinion' },
  crossCountry: { cs: 'srovnani-zemi', en: 'cross-country' },
  changelog: { cs: 'zmeny', en: 'changelog' },
  openIssues: { cs: 'otevrene-otazky', en: 'open-issues' },
} as const;

export type MethodologyDocKey = keyof typeof METHODOLOGY_SLUGS;

export const METHODOLOGY_DOC_KEYS: readonly MethodologyDocKey[] = Object.keys(
  METHODOLOGY_SLUGS,
) as MethodologyDocKey[];

/**
 * Reverse lookup: given a localized slug, find the canonical doc key.
 * Used by the locale switcher on /metodika/<slug>/ pages.
 */
export function methodologyDocKeyFromSlug(
  slug: string,
  locale: Locale,
): MethodologyDocKey | null {
  const found = METHODOLOGY_DOC_KEYS.find((k) => METHODOLOGY_SLUGS[k][locale] === slug);
  return found ?? null;
}

// ============================================================
// Path helpers
// ============================================================

/**
 * Build a localized URL path.
 *
 * For Czech (default), the path starts at root: e.g. /, /udalosti/, /metodika/.
 * For English, the path is always under /en/: e.g. /en, /en/events/, /en/methodology/.
 *
 * Always returns trailing-slash form to match next.config.mjs `trailingSlash: true`.
 */
export function homePath(locale: Locale): string {
  return locale === 'cs' ? '/' : '/en';
}

export function eventsPath(locale: Locale): string {
  return locale === 'cs' ? '/udalosti/' : '/en/events/';
}

export function comparisonPath(locale: Locale): string {
  return locale === 'cs' ? '/srovnani/' : '/en/comparison/';
}

export function methodologyIndexPath(locale: Locale): string {
  return locale === 'cs' ? '/metodika/' : '/en/methodology/';
}

export function supportPath(locale: Locale): string {
  return locale === 'cs' ? '/podpora/' : '/en/support/';
}

export function thanksPath(locale: Locale): string {
  return locale === 'cs' ? '/dekuji/' : '/en/thanks/';
}

export function methodologyDocPath(doc: MethodologyDocKey, locale: Locale): string {
  const slug = METHODOLOGY_SLUGS[doc][locale];
  return locale === 'cs' ? `/metodika/${slug}/` : `/en/methodology/${slug}/`;
}

/** Path for a quarterly validation report (e.g. validace-2026-q2). */
export function validationReportPath(quarter: string, locale: Locale): string {
  const lower = quarter.toLowerCase();
  return locale === 'cs'
    ? `/metodika/validace-${lower}/`
    : `/en/methodology/validation-${lower}/`;
}

/**
 * Translate the *current* path into the other locale. Used by the locale
 * switcher in the header. If the current path is a methodology doc, the slug
 * is translated; otherwise we fall back to the home page.
 *
 * NOTE: this runs in a server component (the header is server-rendered) so
 * it must be passed the current pathname explicitly — there's no useRouter
 * on the server. The Header component receives `currentPath` as a prop.
 */
export function switchLocalePath(currentPath: string, currentLocale: Locale): string {
  const target: Locale = currentLocale === 'cs' ? 'en' : 'cs';

  // Trim trailing slash for comparison
  const p = currentPath.replace(/\/$/, '');

  // Home
  if (p === '' || p === '/en') return homePath(target);

  // Top-level pages
  if (p === '/udalosti' || p === '/en/events') return eventsPath(target);
  if (p === '/srovnani' || p === '/en/comparison') return comparisonPath(target);
  if (p === '/metodika' || p === '/en/methodology') return methodologyIndexPath(target);
  if (p === '/podpora' || p === '/en/support') return supportPath(target);
  if (p === '/dekuji' || p === '/en/thanks') return thanksPath(target);

  // Methodology docs
  const csDoc = /^\/metodika\/([^/]+)$/.exec(p);
  if (csDoc) {
    const slug = csDoc[1]!;
    const validation = /^validace-(\d{4}-q[1-4])$/.exec(slug);
    if (validation) return validationReportPath(validation[1]!, target);
    const key = methodologyDocKeyFromSlug(slug, 'cs');
    if (key) return methodologyDocPath(key, target);
  }
  const enDoc = /^\/en\/methodology\/([^/]+)$/.exec(p);
  if (enDoc) {
    const slug = enDoc[1]!;
    const validation = /^validation-(\d{4}-q[1-4])$/.exec(slug);
    if (validation) return validationReportPath(validation[1]!, target);
    const key = methodologyDocKeyFromSlug(slug, 'en');
    if (key) return methodologyDocPath(key, target);
  }

  // Unknown path — fall back to home in target locale.
  return homePath(target);
}
