'use client';

import { useEffect, useState } from 'react';
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
  /**
   * Pre-resolved labels passed from the server. Keeping the i18n module
   * out of this client bundle.
   */
  labels: {
    /** Wordmark shown only on the mobile masthead next to the hamburger
     *  (desktop honours the design's "no logo" rule). */
    brand: string;
    overview: string;
    pillars: string;
    events: string;
    comparison: string;
    methodology: string;
    support: string;
    languageSwitchAria: string;
    openMenuAria: string;
    closeMenuAria: string;
    /** Long-form last-update label, e.g. "Pondělí · 27. dubna 2026 ·
     *  Týden 18". Built in the layout from the latest snapshot. */
    updateLabel: string;
  };
}

/**
 * Editorial 56-px masthead with two layouts in one component:
 *
 * - **Desktop (≥ md)**: nav left, mono `updateLabel` + locale switch
 *   right. No logo (per design spec — wordmark lives in hero H1).
 * - **Mobile (< md)**: brand wordmark left, hamburger toggle right.
 *   Tapping the hamburger reveals a dropdown with the full nav stack
 *   plus the locale switch and the update label, then ESC / outside
 *   click closes it.
 */
export function Header({ locale, labels }: Props) {
  const pathname = usePathname() ?? homePath(locale);
  const switchHref = switchLocalePath(pathname, locale);
  const homeHref = homePath(locale);
  const pillarsAnchor = `${homeHref}#pilire`;

  const [open, setOpen] = useState(false);

  // Close mobile menu on Escape + on route change.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while menu is open so the dropdown sits over the page.
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [open]);

  return (
    <header className="border-b border-black bg-paper">
      <div className="mx-auto flex h-14 max-w-editorial items-center justify-between gap-4 px-6 md:gap-6 md:px-10">
        {/* Mobile: brand wordmark left */}
        <Link
          href={homeHref}
          className="text-[14px] font-medium tracking-tight text-black md:hidden"
          onClick={() => setOpen(false)}
        >
          {labels.brand}
        </Link>

        {/* Desktop: inline nav */}
        <nav className="hidden items-center gap-7 text-[14px] md:flex">
          <Link href={homeHref} className="uhover font-medium">
            {labels.overview}
          </Link>
          <Link href={pillarsAnchor} className="uhover">
            {labels.pillars}
          </Link>
          <Link href={eventsPath(locale)} className="uhover">
            {labels.events}
          </Link>
          <Link href={comparisonPath(locale)} className="uhover">
            {labels.comparison}
          </Link>
          <Link href={methodologyIndexPath(locale)} className="uhover">
            {labels.methodology}
          </Link>
          <Link href={supportPath(locale)} className="uhover">
            {labels.support}
          </Link>
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <span className="font-mono text-[12px] text-black/55 num">{labels.updateLabel}</span>
          <LocaleSwitch locale={locale} switchHref={switchHref} aria={labels.languageSwitchAria} />
        </div>

        {/* Mobile: hamburger toggle right */}
        <button
          type="button"
          aria-label={open ? labels.closeMenuAria : labels.openMenuAria}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="-mr-2 flex h-10 w-10 items-center justify-center md:hidden"
        >
          {open ? <CloseIcon /> : <HamburgerIcon />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div
          id="mobile-menu"
          className="border-t border-black bg-paper md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={labels.brand}
        >
          <nav className="mx-auto flex max-w-editorial flex-col divide-y divide-black/10 px-6 text-[16px]">
            <MobileLink href={homeHref} onClick={() => setOpen(false)} bold>
              {labels.overview}
            </MobileLink>
            <MobileLink href={pillarsAnchor} onClick={() => setOpen(false)}>
              {labels.pillars}
            </MobileLink>
            <MobileLink href={eventsPath(locale)} onClick={() => setOpen(false)}>
              {labels.events}
            </MobileLink>
            <MobileLink href={comparisonPath(locale)} onClick={() => setOpen(false)}>
              {labels.comparison}
            </MobileLink>
            <MobileLink href={methodologyIndexPath(locale)} onClick={() => setOpen(false)}>
              {labels.methodology}
            </MobileLink>
            <MobileLink href={supportPath(locale)} onClick={() => setOpen(false)}>
              {labels.support}
            </MobileLink>
          </nav>
          <div className="mx-auto flex max-w-editorial items-center justify-between gap-4 border-t border-black/10 px-6 py-4">
            <span className="font-mono text-[12px] text-black/55 num">{labels.updateLabel}</span>
            <LocaleSwitch locale={locale} switchHref={switchHref} aria={labels.languageSwitchAria} />
          </div>
        </div>
      )}
    </header>
  );
}

function MobileLink({
  href,
  onClick,
  bold,
  children,
}: {
  href: string;
  onClick: () => void;
  bold?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center justify-between py-4 ${bold ? 'font-medium' : ''}`}
    >
      {children}
      <span className="text-black/30" aria-hidden>
        →
      </span>
    </Link>
  );
}

function LocaleSwitch({
  locale,
  switchHref,
  aria,
}: {
  locale: Locale;
  switchHref: string;
  aria: string;
}) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-black/55">
      {locale === 'cs' ? (
        <span className="font-medium text-black" aria-current="true">
          CS
        </span>
      ) : (
        <Link href={switchHref} hrefLang="cs" aria-label={aria} className="hover:text-black">
          CS
        </Link>
      )}
      <span className="text-black/30">/</span>
      {locale === 'en' ? (
        <span className="font-medium text-black" aria-current="true">
          EN
        </span>
      ) : (
        <Link href={switchHref} hrefLang="en" aria-label={aria} className="hover:text-black">
          EN
        </Link>
      )}
    </span>
  );
}

function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M3 6h16M3 11h16M3 16h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M5 5l12 12M17 5L5 17" />
    </svg>
  );
}
