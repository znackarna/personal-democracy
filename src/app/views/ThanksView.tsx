import Link from 'next/link';
import { getMessages, homePath, type Locale } from '@/i18n';

interface Props {
  locale: Locale;
}

export function ThanksView({ locale }: Props) {
  const t = getMessages(locale);
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t.thanks.pageTitle}</h1>
      <p className="text-slate-700">{t.thanks.pageBody}</p>
      <p className="text-sm text-slate-500">{t.thanks.recurringNote}</p>
      <Link
        href={homePath(locale)}
        className="inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
      >
        ← {t.thanks.backHome}
      </Link>
    </div>
  );
}
