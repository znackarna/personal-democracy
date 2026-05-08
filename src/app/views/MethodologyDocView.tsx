import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  renderMethodologyDoc,
  renderValidationReport,
} from '../lib/markdown';
import { getMessages, methodologyIndexPath, type Locale } from '@/i18n';

interface Props {
  locale: Locale;
  slug: string;
}

export async function MethodologyDocView({ locale, slug }: Props) {
  const t = getMessages(locale);

  const validationPattern = locale === 'cs' ? /^validace-(\d{4}-q[1-4])$/ : /^validation-(\d{4}-q[1-4])$/;
  const validationMatch = validationPattern.exec(slug);
  if (validationMatch) {
    const quarter = validationMatch[1]!;
    const result = await renderValidationReport(locale, quarter);
    if (!result) notFound();
    return (
      <article className="space-y-6">
        <Link href={methodologyIndexPath(locale)} className="text-sm text-slate-500 hover:text-slate-900">
          {t.methodologyDocPage.backToIndex}
        </Link>
        {result.translationMissing && <TranslationPendingBanner locale={locale} />}
        <div
          className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-a:text-slate-900 prose-a:font-medium"
          dangerouslySetInnerHTML={{ __html: result.html }}
        />
      </article>
    );
  }

  const result = await renderMethodologyDoc(locale, slug);
  if (!result) notFound();

  return (
    <article className="space-y-6">
      <Link
        href={methodologyIndexPath(locale)}
        className="text-sm text-slate-500 hover:text-slate-900"
      >
        {t.methodologyDocPage.backToIndex}
      </Link>
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{result.doc.title}</h1>
        <p className="mt-2 max-w-3xl text-slate-600">{result.doc.description}</p>
      </header>
      {result.translationMissing && <TranslationPendingBanner locale={locale} />}
      <div
        className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-a:text-slate-900 prose-a:font-medium"
        dangerouslySetInnerHTML={{ __html: result.html }}
      />
    </article>
  );
}

function TranslationPendingBanner({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  return (
    <aside className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <strong className="block">{t.methodologyDocPage.translationPendingTitle}</strong>
      <p className="mt-1 text-xs">{t.methodologyDocPage.translationPendingBody}</p>
    </aside>
  );
}
