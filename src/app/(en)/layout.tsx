import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import Link from 'next/link';
import '../globals.css';
import { Header } from '../components/Header';
import { getMessages, methodologyIndexPath, supportPath } from '@/i18n';

const t = getMessages('en');

export const metadata: Metadata = {
  title: t.meta.siteTitle,
  description: t.meta.siteDescription,
  alternates: {
    languages: {
      cs: '/',
      en: '/en',
    },
  },
};

export default function EnglishRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header
          locale="en"
          labels={{
            siteTitle: t.meta.siteTitle,
            tagline: t.meta.tagline,
            overview: t.nav.overview,
            events: t.nav.events,
            comparison: t.nav.comparison,
            methodology: t.nav.methodology,
            support: t.nav.support,
            languageSwitchAria: t.nav.languageSwitchAria,
          }}
        />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-500 sm:px-6 lg:px-8">
          <p>
            {t.footer.leadIn}{' '}
            <a
              href={t.meta.repoUrl}
              className="underline hover:text-slate-900"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.footer.repoLink}
            </a>
            . {t.footer.afterRepo} {t.footer.methodologyLeadIn}{' '}
            <Link href={methodologyIndexPath('en')} className="underline hover:text-slate-900">
              {methodologyIndexPath('en')}
            </Link>
            . {t.footer.supportLeadIn}{' '}
            <Link href={supportPath('en')} className="underline hover:text-slate-900">
              {t.footer.supportLink}
            </Link>
            {t.footer.supportTail}
          </p>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
