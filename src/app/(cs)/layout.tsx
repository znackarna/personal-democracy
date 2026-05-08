import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '../globals.css';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { readTimeline } from '../lib/data';
import { formatUpdateLabel } from '@/i18n/dates';
import { getMessages } from '@/i18n';

const t = getMessages('cs');

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

export default async function CzechRootLayout({ children }: { children: React.ReactNode }) {
  // Real last-update label is built from the latest snapshot's
  // `computed_at` timestamp (pipeline run time) — not Monday of the ISO
  // week. Used identically in the masthead and the footer so a reader
  // sees one consistent "freshness" signal.
  const timeline = await readTimeline();
  const latest = timeline.at(-1);
  const updateLabel = latest
    ? formatUpdateLabel(latest.computed_at, latest.week, 'cs')
    : '';

  return (
    <html lang="cs" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">
        <Header
          locale="cs"
          labels={{
            brand: t.meta.siteTitle,
            overview: t.nav.overview,
            pillars: t.nav.pillars,
            events: t.nav.events,
            comparison: t.nav.comparison,
            methodology: t.nav.methodology,
            support: t.nav.support,
            languageSwitchAria: t.nav.languageSwitchAria,
            openMenuAria: t.nav.openMenuAria,
            closeMenuAria: t.nav.closeMenuAria,
            updateLabel,
          }}
        />
        <main>{children}</main>
        <Footer locale="cs" updateLabel={updateLabel} />
        <Analytics />
      </body>
    </html>
  );
}
