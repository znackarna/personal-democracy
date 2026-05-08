'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  comparisonPath,
  eventsPath,
  homePath,
  methodologyIndexPath,
  supportPath,
  switchLocalePath,
  type Locale,
} from '@/i18n';

interface Props {
  locale: Locale;
  /** Pre-resolved labels passed from server. Avoids importing the i18n module client-side. */
  labels: {
    siteTitle: string;
    tagline: string;
    overview: string;
    events: string;
    comparison: string;
    methodology: string;
    support: string;
    languageSwitchAria: string;
  };
}

export function Header({ locale, labels }: Props) {
  // Pathname is needed so the locale switcher resolves to the equivalent page
  // in the other locale. Falls back to "/" or "/en" before hydration so SSR
  // output is stable.
  const pathname = usePathname() ?? homePath(locale);
  const switchHref = switchLocalePath(pathname, locale);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href={homePath(locale)} className="flex flex-col">
          <span className="text-lg font-semibold text-slate-900">{labels.siteTitle}</span>
          <span className="text-xs text-slate-500">{labels.tagline}</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href={homePath(locale)} className="text-slate-700 hover:text-slate-900">
            {labels.overview}
          </Link>
          <Link href={eventsPath(locale)} className="text-slate-700 hover:text-slate-900">
            {labels.events}
          </Link>
          <Link href={comparisonPath(locale)} className="text-slate-700 hover:text-slate-900">
            {labels.comparison}
          </Link>
          <Link href={methodologyIndexPath(locale)} className="text-slate-700 hover:text-slate-900">
            {labels.methodology}
          </Link>
          <Link
            href={supportPath(locale)}
            className="rounded-full border border-slate-300 px-3 py-1 text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            {labels.support}
          </Link>
          <span className="ml-2 flex items-center gap-1 border-l border-slate-200 pl-4 text-xs uppercase tracking-wide">
            {locale === 'cs' ? (
              <span className="font-semibold text-slate-900" aria-current="true">CS</span>
            ) : (
              <Link
                href={switchHref}
                hrefLang="cs"
                aria-label={labels.languageSwitchAria}
                className="text-slate-400 hover:text-slate-900"
              >
                CS
              </Link>
            )}
            <span className="text-slate-300">/</span>
            {locale === 'en' ? (
              <span className="font-semibold text-slate-900" aria-current="true">EN</span>
            ) : (
              <Link
                href={switchHref}
                hrefLang="en"
                aria-label={labels.languageSwitchAria}
                className="text-slate-400 hover:text-slate-900"
              >
                EN
              </Link>
            )}
          </span>
        </nav>
      </div>
    </header>
  );
}
