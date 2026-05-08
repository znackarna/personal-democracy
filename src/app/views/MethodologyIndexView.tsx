import Link from 'next/link';
import { getMethodologyDocs, listValidationReports } from '../lib/markdown';
import {
  getMessages,
  methodologyDocPath,
  validationReportPath,
  type Locale,
  type MethodologyDocKey,
} from '@/i18n';

interface Props {
  locale: Locale;
}

const AUDIT_TRAIL_KEYS: ReadonlySet<MethodologyDocKey> = new Set(['changelog', 'openIssues']);

export async function MethodologyIndexView({ locale }: Props) {
  const t = getMessages(locale);
  const docs = getMethodologyDocs(locale);
  const validations = await listValidationReports(locale);

  const primaryDocs = docs.filter((d) => !AUDIT_TRAIL_KEYS.has(d.key));
  const auditDocs = docs.filter((d) => AUDIT_TRAIL_KEYS.has(d.key));

  return (
    <div className="space-y-10">
      <section>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
          {t.methodologyIndex.title}
        </h1>
        <p className="max-w-3xl text-slate-600">
          {t.methodologyIndex.intro.pre}
          <Link
            href={methodologyDocPath('changelog', locale)}
            className="underline hover:text-slate-900"
          >
            {t.methodologyIndex.intro.link}
          </Link>
          {t.methodologyIndex.intro.tail}
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          {t.methodologyIndex.primaryDocsHeading}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {primaryDocs.map((doc) => (
            <Link
              key={doc.key}
              href={methodologyDocPath(doc.key, locale)}
              className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
            >
              <h3 className="text-base font-semibold text-slate-900">{doc.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{doc.description}</p>
              <span className="mt-3 inline-block text-xs text-slate-500">
                {t.methodologyIndex.readMore}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          {t.methodologyIndex.auditTrailHeading}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {auditDocs.map((doc) => (
            <Link
              key={doc.key}
              href={methodologyDocPath(doc.key, locale)}
              className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
            >
              <h3 className="text-base font-semibold text-slate-900">{doc.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{doc.description}</p>
              <span className="mt-3 inline-block text-xs text-slate-500">
                {t.methodologyIndex.readMore}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {validations.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            {t.methodologyIndex.validationHeading}
          </h2>
          <p className="mb-4 max-w-3xl text-sm text-slate-600">{t.methodologyIndex.validationIntro}</p>
          <ul className="space-y-2">
            {validations.map((v) => (
              <li key={v.slug}>
                <Link
                  href={validationReportPath(v.quarter, locale)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:border-slate-300 hover:text-slate-900"
                >
                  {t.methodologyIndex.validationLinkPrefix}
                  {v.quarter} →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
