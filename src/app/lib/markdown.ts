import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import {
  METHODOLOGY_DOC_KEYS,
  METHODOLOGY_SLUGS,
  getMessages,
  methodologyDocPath,
  validationReportPath,
  type Locale,
  type MethodologyDocKey,
} from '@/i18n';

const METHODOLOGY_ROOT = path.resolve(process.cwd(), 'methodology');
const SOURCES_YAML = path.resolve(process.cwd(), 'config', 'sources.yaml');

/** File-on-disk basename for each methodology doc key (without .md). */
const DOC_FILE: Record<MethodologyDocKey, string> = {
  pillars: 'pillars',
  severity: 'severity_rubric',
  weights: 'weights',
  governance: 'governance',
  structuralMapping: 'structural_mapping',
  sources: 'sources',
  publicOpinion: 'public_opinion',
  crossCountry: 'cross_country',
  changelog: 'CHANGELOG',
  openIssues: 'issues',
};

export interface MethodologyDocMeta {
  /** Stable doc key, locale-independent. */
  key: MethodologyDocKey;
  /** Localized URL slug. */
  slug: string;
  /** Localized title shown in TOC. */
  title: string;
  /** Localized description shown in TOC. */
  description: string;
}

/**
 * Build the per-locale methodology TOC. Order matches METHODOLOGY_DOC_KEYS
 * (which itself reflects the curated registry order).
 */
export function getMethodologyDocs(locale: Locale): readonly MethodologyDocMeta[] {
  const t = getMessages(locale);
  return METHODOLOGY_DOC_KEYS.map((key) => ({
    key,
    slug: METHODOLOGY_SLUGS[key][locale],
    title: t.methodologyDocs[key].title,
    description: t.methodologyDocs[key].description,
  }));
}

/**
 * Read a methodology MD file (locale-aware). Tries `<file>.<locale>.md` first
 * for non-CS locales; falls back to `<file>.md` if a translation is missing.
 * Returns the rendered HTML and a flag indicating whether the requested locale
 * was actually found (so the page can show a "translation pending" notice).
 */
export async function renderMethodologyDoc(
  locale: Locale,
  slug: string,
): Promise<{ doc: MethodologyDocMeta; html: string; translationMissing: boolean } | null> {
  const key = METHODOLOGY_DOC_KEYS.find((k) => METHODOLOGY_SLUGS[k][locale] === slug);
  if (!key) return null;
  const file = DOC_FILE[key];
  const result = await readLocalizedMarkdown(METHODOLOGY_ROOT, file, locale);
  if (!result) return null;
  const meta: MethodologyDocMeta = {
    key,
    slug,
    title: getMessages(locale).methodologyDocs[key].title,
    description: getMessages(locale).methodologyDocs[key].description,
  };
  return { doc: meta, html: result.html, translationMissing: result.translationMissing };
}

/**
 * Validation reports live alongside the curated docs but use a YYYY-Qx slug
 * pattern. Listed dynamically so new quarterly reports show up automatically.
 *
 * Same dynamic listing for both locales — file names are
 * `validation_2026-Q2.md` for CS, `validation_2026-Q2.en.md` for EN.
 */
export async function listValidationReports(
  locale: Locale,
): Promise<Array<{ slug: string; quarter: string }>> {
  let entries: string[];
  try {
    entries = await readdir(METHODOLOGY_ROOT);
  } catch {
    return [];
  }
  const seen = new Set<string>();
  for (const f of entries) {
    const m = /^validation_(\d{4}-Q[1-4])(?:\.en)?\.md$/.exec(f);
    if (m) seen.add(m[1]!);
  }
  return [...seen]
    .sort((a, b) => b.localeCompare(a))
    .map((quarter) => ({
      slug: locale === 'cs' ? `validace-${quarter.toLowerCase()}` : `validation-${quarter.toLowerCase()}`,
      quarter,
    }));
}

export async function renderValidationReport(
  locale: Locale,
  quarter: string,
): Promise<{ html: string; translationMissing: boolean } | null> {
  const file = `validation_${quarter.toUpperCase()}`;
  return readLocalizedMarkdown(METHODOLOGY_ROOT, file, locale);
}

/**
 * Reads <root>/<file>.<locale>.md if it exists (for non-CS), else falls back
 * to <root>/<file>.md. Returns null if neither file exists.
 */
async function readLocalizedMarkdown(
  root: string,
  file: string,
  locale: Locale,
): Promise<{ html: string; translationMissing: boolean } | null> {
  const localized = path.join(root, `${file}.${locale}.md`);
  const fallback = path.join(root, `${file}.md`);

  if (locale !== 'cs') {
    try {
      const html = await renderMarkdownFile(localized, locale);
      return { html, translationMissing: false };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      // Translation missing — fall through to CS fallback.
    }
  }

  try {
    const html = await renderMarkdownFile(fallback, locale);
    return { html, translationMissing: locale !== 'cs' };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

/**
 * Convert a Markdown file to HTML. Pre-processes `.md` links to point at our
 * web routes (so cross-references inside methodology files resolve to
 * `/metodika/<slug>/` for CS or `/en/methodology/<slug>/` for EN).
 *
 * Also expands the `<!-- SOURCES_TABLE -->` marker into a live table generated
 * from config/sources.yaml — used by methodology/sources.md (and sources.en.md).
 */
async function renderMarkdownFile(file: string, locale: Locale): Promise<string> {
  const raw = await readFile(file, 'utf-8');
  const withTable = await injectSourcesTable(raw, locale);
  const rewritten = rewriteInternalLinks(withTable, locale);
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: 'wrap' })
    .use(rehypeStringify)
    .process(rewritten);
  return result.toString();
}

// ============================================================
// Auto-rendered sources table (used by methodology/sources.md)
// ============================================================

const IMPLEMENTED_NON_RSS_ADAPTERS = new Set<string>([
  'psp-cz',
  'hlidac-statu',
  'hlidac-smlouvy',
  'hlidac-dotace',
]);

const CATEGORY_LABELS: Record<Locale, Record<string, string>> = {
  cs: {
    czech_media: 'Česká média',
    open_data: 'Otevřená data',
    watchdog: 'Watchdog',
    international: 'Mezinárodní',
  },
  en: {
    czech_media: 'Czech media',
    open_data: 'Open data',
    watchdog: 'Watchdog',
    international: 'International',
  },
};

const TYPE_LABELS: Record<Locale, Record<string, string>> = {
  cs: {
    rss: 'RSS feed',
    api: 'API',
    html: 'HTML scraper',
  },
  en: {
    rss: 'RSS feed',
    api: 'API',
    html: 'HTML scraper',
  },
};

const SOURCES_TABLE_HEADERS: Record<Locale, { state: string; source: string; type: string; note: string }> = {
  cs: { state: 'Stav', source: 'Zdroj', type: 'Typ', note: 'Poznámka' },
  en: { state: 'Status', source: 'Source', type: 'Type', note: 'Note' },
};

const SOURCES_TABLE_STATUS: Record<Locale, { active: string; inactive: string; activeShort: string }> = {
  cs: { active: '✓ aktivní', inactive: '⏸ nezapojený', activeShort: 'aktivních' },
  en: { active: '✓ active', inactive: '⏸ not wired up', activeShort: 'active' },
};

interface YamlSource {
  id: string;
  name: string;
  category: string;
  type: string;
  url: string;
  homepage?: string;
  notes?: string;
  notes_en?: string;
}

interface YamlSourcesFile {
  version: number;
  sources: YamlSource[];
}

async function injectSourcesTable(md: string, locale: Locale): Promise<string> {
  if (!md.includes('<!-- SOURCES_TABLE -->')) return md;
  const sources = await loadYamlSources();
  return md.replace('<!-- SOURCES_TABLE -->', renderSourcesMarkdown(sources, locale));
}

async function loadYamlSources(): Promise<YamlSource[]> {
  const raw = await readFile(SOURCES_YAML, 'utf-8');
  const parsed = yaml.load(raw) as YamlSourcesFile;
  return parsed.sources ?? [];
}

function isActive(s: YamlSource): boolean {
  if (s.type === 'rss') return true;
  return IMPLEMENTED_NON_RSS_ADAPTERS.has(s.id);
}

function renderSourcesMarkdown(sources: YamlSource[], locale: Locale): string {
  const order: ReadonlyArray<string> = ['czech_media', 'open_data', 'watchdog', 'international'];
  const grouped = new Map<string, YamlSource[]>();
  for (const s of sources) {
    const list = grouped.get(s.category) ?? [];
    list.push(s);
    grouped.set(s.category, list);
  }
  const sections: string[] = [];
  const headers = SOURCES_TABLE_HEADERS[locale];
  const status = SOURCES_TABLE_STATUS[locale];
  for (const cat of order) {
    const list = grouped.get(cat);
    if (!list || list.length === 0) continue;
    const active = list.filter(isActive).length;
    const label = CATEGORY_LABELS[locale][cat] ?? cat;
    sections.push(`### ${label} (${active}/${list.length} ${status.activeShort})`);
    sections.push('');
    sections.push(`| ${headers.state} | ${headers.source} | ${headers.type} | ${headers.note} |`);
    sections.push('|------|-------|-----|----------|');
    for (const s of list) {
      sections.push(renderRow(s, locale));
    }
    sections.push('');
  }
  return sections.join('\n');
}

function renderRow(s: YamlSource, locale: Locale): string {
  const status = SOURCES_TABLE_STATUS[locale];
  const stav = isActive(s) ? status.active : status.inactive;
  const link = s.homepage ?? s.url;
  const name = `[${escapeCell(s.name)}](${link})`;
  const typ = TYPE_LABELS[locale][s.type] ?? s.type;
  const localizedNotes = locale === 'en' ? (s.notes_en ?? s.notes) : s.notes;
  const note = firstNoteSentence(localizedNotes);
  return `| ${stav} | ${name} | ${typ} | ${note} |`;
}

function firstNoteSentence(notes: string | undefined): string {
  if (!notes) return '–';
  const flattened = notes.replace(/\s+/g, ' ').trim();
  if (!flattened) return '–';
  const firstSentence = flattened.split(/(?<=[.!?])\s/)[0] ?? flattened;
  const trimmed = firstSentence.length > 220 ? `${firstSentence.slice(0, 217)}…` : firstSentence;
  return escapeCell(trimmed);
}

function escapeCell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/**
 * Map of disk-file basenames (`pillars.md`, `governance.md`, ...) to the
 * canonical doc key. Used by rewriteInternalLinks to translate cross-doc
 * references in methodology Markdown files into web URLs in the active locale.
 */
const FILE_TO_DOC_KEY: Record<string, MethodologyDocKey> = Object.fromEntries(
  (Object.entries(DOC_FILE) as Array<[MethodologyDocKey, string]>).map(([k, v]) => [`${v}.md`, k]),
);

/**
 * Rewrites links in Markdown source so methodology cross-references resolve
 * on the web rather than as broken .md paths.
 *
 * - Cross-references between methodology files (e.g. `pillars.md` → /metodika/pilire/
 *   in CS, /en/methodology/pillars/ in EN).
 * - Validation reports (validation_YYYY-Qx.md → corresponding web route).
 * - Strips `.en` infix from links inside English files (so `pillars.en.md` and
 *   `pillars.md` both resolve to the right destination URL).
 */
function rewriteInternalLinks(md: string, locale: Locale): string {
  return md.replace(/\]\(([^)\s]+\.md)(#[^)]*)?\)/g, (match, target: string, anchor?: string) => {
    let filename = path.basename(target);
    // Strip .en suffix so pillars.en.md resolves the same as pillars.md
    filename = filename.replace(/\.en\.md$/, '.md');
    const docKey = FILE_TO_DOC_KEY[filename];
    if (docKey) {
      return `](${methodologyDocPath(docKey, locale)}${anchor ?? ''})`;
    }
    const validation = /^validation_(\d{4}-Q[1-4])\.md$/.exec(filename);
    if (validation) {
      return `](${validationReportPath(validation[1]!, locale)}${anchor ?? ''})`;
    }
    return match;
  });
}
