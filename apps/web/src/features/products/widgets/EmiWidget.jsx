// Pirento Capital: the EMI calculator, right in the hero. An estimate, never an offer.
import {useState} from 'react';
import {emi} from '@pirento/shared';
import {inr} from '../../../lib/format';
import {WidgetCard} from './Card';

const FIELDS = [
  {id: 'amount', label: 'Amount (₹)', min: 10000, max: 5000000, step: 10000},
  {id: 'rate', label: 'Interest (% a year)', min: 1, max: 36, step: 0.5},
  {id: 'months', label: 'Months', min: 3, max: 120, step: 1},
];

export function EmiWidget() {
  const [v, setV] = useState({amount: 500000, rate: 12, months: 36});
  const monthly = emi(v.amount, v.rate, v.months);
  const total = monthly * v.months;
  return (
    <WidgetCard label="EMI estimate">
      <div className="mt-5 space-y-5">
        {FIELDS.map((f) => (
          <label key={f.id} className="block text-sm">
            <span className="flex justify-between text-muted">
              {f.label}
              <span className="text-ink tabular-nums">{f.id === 'amount' ? inr(v.amount) : v[f.id]}</span>
            </span>
            <input
              type="range"
              min={f.min}
              max={f.max}
              step={f.step}
              value={v[f.id]}
              onChange={(e) => setV((x) => ({...x, [f.id]: Number(e.target.value)}))}
              className="mt-2 w-full accent-current"
            />
          </label>
        ))}
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-rule pt-5">
        <div>
          <dt className="text-xs text-muted">Every month</dt>
          <dd className="num mt-1 text-3xl!">{inr(Math.round(monthly))}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Total interest</dt>
          <dd className="num mt-1 text-3xl!">{inr(Math.round(total - v.amount))}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-muted">
        Reducing balance. An estimate, not a loan offer: Pirento does not lend yet.
      </p>
    </WidgetCard>
  );
}
