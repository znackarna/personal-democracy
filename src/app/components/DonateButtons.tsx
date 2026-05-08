'use client';

import { useState } from 'react';
import type { Currency, CurrencyLinks, DonationMode, PaymentLink } from '../lib/donations';

interface Props {
  links: { czk: CurrencyLinks; eur: CurrencyLinks };
  /** Pre-resolved labels — keeps the i18n module out of this client bundle. */
  labels: {
    currencyHeading: string;
    currencyCzk: string;
    currencyEur: string;
    modeHeading: string;
    modeOneTime: string;
    modeRecurring: string;
    customAmount: string;
    customAmountAria: string;
    monthlyBadge: string;
    proceedAria: string;
    paymentMethods: string;
  };
}

export function DonateButtons({ links, labels }: Props) {
  const [currency, setCurrency] = useState<Currency>('czk');
  const [mode, setMode] = useState<DonationMode>('one_time');

  const set = links[currency];
  const presets: readonly PaymentLink[] = mode === 'one_time' ? set.one_time : set.monthly;
  const customUrl = set.custom_url;

  const symbol = currency === 'czk' ? 'Kč' : '€';
  const placement = currency === 'czk' ? 'after' : 'before';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <fieldset className="mb-4">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {labels.currencyHeading}
        </legend>
        <div className="flex gap-2">
          <TabButton active={currency === 'czk'} onClick={() => setCurrency('czk')}>
            {labels.currencyCzk}
          </TabButton>
          <TabButton active={currency === 'eur'} onClick={() => setCurrency('eur')}>
            {labels.currencyEur}
          </TabButton>
        </div>
      </fieldset>

      <fieldset className="mb-6">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {labels.modeHeading}
        </legend>
        <div className="flex gap-2">
          <TabButton active={mode === 'one_time'} onClick={() => setMode('one_time')}>
            {labels.modeOneTime}
          </TabButton>
          <TabButton active={mode === 'monthly'} onClick={() => setMode('monthly')}>
            {labels.modeRecurring}
          </TabButton>
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-3">
        {presets.map((link) => (
          <AmountButton
            key={link.amount}
            url={link.url}
            display={formatAmount(link.amount, symbol, placement)}
            badge={mode === 'monthly' ? labels.monthlyBadge : null}
            ariaLabel={labels.proceedAria}
          />
        ))}
      </div>

      {mode === 'one_time' && (
        <div className="mt-3">
          <CustomAmountButton
            url={customUrl}
            label={labels.customAmount}
            ariaLabel={labels.customAmountAria}
          />
        </div>
      )}

      <p className="mt-6 text-xs text-slate-500">{labels.paymentMethods}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition'
          : 'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900'
      }
    >
      {children}
    </button>
  );
}

function AmountButton({
  url,
  display,
  badge,
  ariaLabel,
}: {
  url: string;
  display: string;
  badge: string | null;
  ariaLabel: string;
}) {
  const placeholder = url === 'PLACEHOLDER';
  if (placeholder) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Stripe link not yet configured"
        className="cursor-not-allowed rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center text-lg font-semibold text-slate-400"
      >
        {display}
        {badge && <span className="ml-1 text-xs font-normal">{badge}</span>}
      </button>
    );
  }
  return (
    <a
      href={url}
      aria-label={ariaLabel}
      className="block rounded-xl border border-slate-300 bg-white px-4 py-4 text-center text-lg font-semibold text-slate-900 transition hover:border-slate-900 hover:bg-slate-50"
    >
      {display}
      {badge && <span className="ml-1 text-xs font-normal text-slate-500">{badge}</span>}
    </a>
  );
}

function CustomAmountButton({
  url,
  label,
  ariaLabel,
}: {
  url: string;
  label: string;
  ariaLabel: string;
}) {
  const placeholder = url === 'PLACEHOLDER';
  if (placeholder) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Stripe link not yet configured"
        className="block w-full cursor-not-allowed rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-center text-sm font-medium text-slate-400"
      >
        {label} →
      </button>
    );
  }
  return (
    <a
      href={url}
      aria-label={ariaLabel}
      className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:bg-slate-50 hover:text-slate-900"
    >
      {label} →
    </a>
  );
}

function formatAmount(amount: number, symbol: string, placement: 'before' | 'after'): string {
  return placement === 'before' ? `${symbol} ${amount}` : `${amount} ${symbol}`;
}
