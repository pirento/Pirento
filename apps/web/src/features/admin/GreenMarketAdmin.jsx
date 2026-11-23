// Admin → Pirento Green → Carbon market (finance and superadmins): price, open or closed, each drive's growth rate,
// and what is held and traded.
import {useState} from 'react';
import {GREEN_DONATION} from '@pirento/shared';
import {StatsRow} from '../../components/ui/Blocks';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {green} from '../../data/site';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';
import {PriceChart} from '../green/PriceChart';
import {credits, rupees} from '../green/money';

const copy = green.admin;
// Totals to the rupee, so they fit the stats row; trades below keep their paise.
const whole = (paise) => Math.round(paise / 100) * 100;

function PriceForm({m, onSaved}) {
  const [price, setPrice] = useState(m.price ? String(m.price / 100) : '');
  const [note, setNote] = useState('');
  const save = async (body, done) => {
    setNote('');
    try {
      await api('/green/staff/market', {method: 'PUT', body});
      setNote(done);
      onSaved();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save({price: Math.round(Number(price) * 100)}, 'Price saved.');
      }}
      className="space-y-4 rounded-[18px] border border-rule p-5"
    >
      <Field
        label="Price per credit (₹)"
        type="number"
        min="0.01"
        step="0.01"
        required
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="accent">
          Set price
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => save({open: !m.open}, m.open ? 'Market closed.' : 'Market open.')}
        >
          {m.open ? 'Close the market' : 'Open the market'}
        </Button>
      </div>
      <p className="text-sm text-muted" role="status">
        {note || (m.open ? 'Open for trading.' : 'Closed: nobody can buy or sell.')}
      </p>
    </form>
  );
}

function RateRow({drive, rate, onSaved}) {
  const [value, setValue] = useState(rate == null ? '' : String(rate));
  const [note, setNote] = useState('');
  const save = async (e) => {
    e.preventDefault();
    setNote('');
    try {
      await api('/green/staff/rates', {method: 'PUT', body: {slug: drive.slug, rate: Number(value)}});
      setNote('Saved.');
      onSaved();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <form onSubmit={save} className="flex flex-wrap items-end gap-3 border-b border-rule py-4">
      <span className="min-w-0 flex-1 basis-48">
        <span className="block font-medium">{drive.name.replace(/^Sponsor trees · /, '')}</span>
        <span className="block text-sm text-muted">{note || 'Credits per tree per year'}</span>
      </span>
      <label className="sr-only" htmlFor={`rate-${drive.slug}`}>
        Growth rate for {drive.name}
      </label>
      <input
        id={`rate-${drive.slug}`}
        type="number"
        min="0"
        max="10"
        step="0.001"
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-28 rounded-[14px] border border-rule bg-paper px-3 py-2 tabular-nums outline-none focus:border-ink"
      />
      <button type="submit" className="rounded-full border border-rule px-4 py-2 text-sm hover:border-ink">
        Save
      </button>
    </form>
  );
}

export function GreenMarketAdmin({drives}) {
  const staff = useApi('/green/staff/market');
  const pub = useApi('/green/market');
  const m = staff.data;
  if (staff.error) return <p className="text-muted">⚠ {staff.error.message}</p>;
  if (!m) return null;
  const reload = () => {
    staff.reload();
    pub.reload();
  };
  const vol = (side) => m.volume[side] ?? {units: 0, amount: 0, count: 0};

  return (
    <section aria-labelledby="green-market" className="space-y-8">
      <div>
        <h2 id="green-market" className="text-2xl">
          {copy.market}
        </h2>
        <p className="mt-2 text-sm text-muted">{copy.marketIntro}</p>
        {!m.tradingOn && <p className="mt-2 text-sm">⚠ {copy.switchOff}</p>}
      </div>
      <StatsRow
        compact
        stats={[
          {value: String(m.holders), label: 'holders'},
          {value: credits(m.unitsHeld), label: 'credits held'},
          {value: rupees(whole(vol('buy').amount)), label: `bought · ${credits(vol('buy').units)}`},
          {value: rupees(whole(vol('sell').amount)), label: `sold · ${credits(vol('sell').units)}`},
          {value: credits(vol('claim').units), label: 'grown by trees'},
        ]}
      />
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <PriceForm key={m.price} m={m} onSaved={reload} />
        </div>
        <div className="lg:col-span-7">
          {pub.data?.history.length ? (
            <PriceChart history={pub.data.history} height={180} />
          ) : (
            <p className="text-muted">No price set yet.</p>
          )}
        </div>
      </div>
      {m.prices.length > 0 && (
        <div>
          <p className="eyebrow">Price changes</p>
          <ul className="mt-4 border-t border-rule">
            {m.prices.map((p) => (
              <li
                key={String(p.at)}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-rule py-3 text-sm"
              >
                <span className="font-medium tabular-nums">{rupees(p.price)}</span>
                <span className="break-all text-muted">
                  {p.by ?? '—'} · {formatDate(p.at)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <p className="eyebrow">Growth rate by drive</p>
        <div className="mt-4 border-t border-rule">
          {/* Donated trees grow no credits, so the donation has no rate. */}
          {drives
            .filter((d) => d.slug !== GREEN_DONATION.slug)
            .map((d) => (
              <RateRow key={d.slug} drive={d} rate={m.rates[d.slug]} onSaved={reload} />
            ))}
        </div>
      </div>
      <div>
        <p className="eyebrow">
          Latest trades{m.owed > 0 && ` · ${m.owed} sale${m.owed === 1 ? '' : 's'} still paying out`}
        </p>
        {m.recent.length === 0 ? (
          <p className="mt-4 text-muted">No trades yet.</p>
        ) : (
          <ul className="mt-4 border-t border-rule">
            {m.recent.map((t) => (
              <li
                key={t._id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-rule py-3 text-sm"
              >
                <span>
                  <span className="font-medium capitalize">{t.side}</span> · {credits(t.units)} credits
                  {t.side !== 'claim' && ` at ${rupees(t.price)}`} · {t.status}
                </span>
                <span className="text-muted">
                  {t.amount > 0 && `${rupees(t.amount)} · `}
                  {formatDate(t.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
