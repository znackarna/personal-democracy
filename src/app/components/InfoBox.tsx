import Link from 'next/link';
import {
  getMessages,
  methodologyDocPath,
  type Locale,
  type MethodologyDocKey,
} from '@/i18n';

interface Props {
  locale: Locale;
  title: string;
  /** Stable doc key of related methodology — produces a localized "read more" link. */
  readMore?: { doc: MethodologyDocKey; label?: string };
  /** Or pass a pre-built href (e.g. for /metodika/zmeny/ which is a doc with no callout pattern). */
  readMoreHref?: { href: string; label: string };
  children: React.ReactNode;
  /** Visual variant. Default 'info'. */
  variant?: 'info' | 'warn';
}

const VARIANT_STYLES = {
  info: {
    border: 'border-slate-200',
    bg: 'bg-slate-50',
    iconBg: 'bg-slate-200',
    icon: 'ⓘ',
    iconColor: 'text-slate-700',
  },
  warn: {
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-200',
    icon: '⚠',
    iconColor: 'text-amber-800',
  },
} as const;

/**
 * Collapsible methodology callout. Uses native `<details>` so it works
 * without client-side JS (matters for static export). Closed by default to
 * keep the dashboard scannable; reader can expand for context.
 */
export function InfoBox({ locale, title, readMore, readMoreHref, children, variant = 'info' }: Props) {
  const t = getMessages(locale);
  const v = VARIANT_STYLES[variant];

  const link =
    readMore !== undefined
      ? { href: methodologyDocPath(readMore.doc, locale), label: readMore.label ?? t.infoBox.readMoreDefault }
      : readMoreHref;

  return (
    <details className={`group rounded-xl border ${v.border} ${v.bg} text-sm`}>
      <summary
        className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-slate-700 transition hover:text-slate-900"
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${v.iconBg} text-xs font-bold ${v.iconColor}`}
        >
          {v.icon}
        </span>
        <span className="font-medium">{title}</span>
        <span className="ml-auto text-xs text-slate-500 group-open:hidden">{t.infoBox.expand}</span>
        <span className="ml-auto hidden text-xs text-slate-500 group-open:inline">{t.infoBox.collapse}</span>
      </summary>
      <div className="space-y-3 border-t border-slate-200/70 px-4 py-3 text-slate-700">
        {children}
        {link && (
          <p className="pt-1">
            <Link
              href={link.href}
              className="text-xs font-medium text-slate-700 underline hover:text-slate-900"
            >
              {link.label}
            </Link>
          </p>
        )}
      </div>
    </details>
  );
}
