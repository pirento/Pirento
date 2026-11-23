// Pirento Green → Carbon market: the price and its chart, the person's credits, buying and selling from the wallet.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {AlertTriangle, ArrowDownRight, ArrowUpRight} from 'lucide-react';
import {StatsRow} from '../../components/ui/Blocks';
import {Button} from '../../components/ui/Button';
import {green} from '../../data/site';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';
import {PriceChart} from './PriceChart';
import {credits, rupees} from './money';

const copy = green.market;
const SIDE = {buy: 'Bought', sell: 'Sold', claim: 'Grown by your trees'};

/** The price with its move since the last change, as an arrow and a percentage (never colour alone). */
export function PriceLine({market}) {
  const up = market.changePct > 0;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  return (
    <p className="flex flex-wrap items-baseline gap-x-3">
      <span className="num">{market.price ? rupees(market.price) : '—'}</span>
      {market.changePct !== null && market.changePct !== 0 && (
        <span className="inline-flex items-center gap-1 text-sm tabular-nums text-muted">
          <Arrow aria-hidden className="size-4" />
          {up ? '+' : ''}
          {market.changePct}%<span className="sr-only">{up ? 'up' : 'down'} since the last price</span>
        </span>
      )}
    </p>
  );
}

function TradeForm({market, me, onDone}) {
  const [side, setSide] = useState('buy');
  const [amount, setAmount] = useState('1');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const units = Math.round(Number(amount) * 100);
  const valid = Number.isFinite(units) && units >= 1;
  const estimate = valid ? (side === 'buy' ? Math.ceil : Math.floor)((units * market.price) / 100) : 0;
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setNote('');
    try {
      await api('/green/trade', {method: 'POST', body: {side, units}});
      setNote(`${side === 'buy' ? 'Bought' : 'Sold'} ${credits(units)} credits for ${rupees(estimate)}.`);
      onDone();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-5 rounded-[22px] border border-rule p-6 md:p-8">
      <div role="tablist" aria-label="Buy or sell" className="flex gap-2">
        {['buy', 'sell'].map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={side === s}
            onClick={() => setSide(s)}
            className={`rounded-full border px-5 py-2 text-sm capitalize ${side === s ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`}
          >
            {s}
          </button>
        ))}
      </div>
      <label className="block">
        <span className="text-sm font-medium">Credits</span>
        <input
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          max={side === 'sell' ? me.units / 100 : 10000}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-2 block w-full rounded-[14px] border border-rule bg-paper px-4 py-3 text-base tabular-nums outline-none focus:border-ink"
        />
      </label>
      <p className="text-sm text-muted" aria-live="polite">
        {valid
          ? `${side === 'buy' ? 'You pay' : 'You get'} ${rupees(estimate)} at ${rupees(market.price)} a credit`
          : ''}
        {side === 'sell' && ` · you hold ${credits(me.units)}`}
      </p>
      {side === 'sell' && me.units > 0 && (
        <button
          type="button"
          onClick={() => setAmount(String(me.units / 100))}
          className="rounded-full border border-rule px-4 py-1.5 text-sm hover:border-ink"
        >
          Sell all {credits(me.units)}
        </button>
      )}
      <Button variant="accent" type="submit" disabled={busy || !valid}>
        {side === 'buy' ? 'Buy from wallet' : 'Sell to wallet'}
      </Button>
      {note && (
        <p role="status" className="text-sm">
          {note}{' '}
          {note.startsWith('⚠') && side === 'buy' && (
            <Link to="/green/dashboard/wallet" className="underline underline-offset-4">
              Add money
            </Link>
          )}
        </p>
      )}
    </form>
  );
}

export function Market() {
  const market = useApi('/green/market');
  const me = useApi('/green/me');
  const m = market.data;
  const mine = me.data;
  if (market.error || me.error) return <p className="text-muted">⚠ {(market.error ?? me.error).message}</p>;
  const reload = () => {
    market.reload();
    me.reload();
  };
  const gain = mine && mine.value !== null ? mine.value - mine.cost : null;

  return (
    <div className="space-y-12">
      <p className="body -mt-2">{copy.intro}</p>
      <StatsRow
        compact
        stats={[
          {value: mine ? credits(mine.units) : '—', label: 'your credits'},
          {value: mine?.value != null ? rupees(mine.value) : '—', label: 'worth now'},
          {value: mine ? rupees(mine.cost) : '—', label: 'you paid'},
          {value: gain === null ? '—' : `${gain >= 0 ? '+' : '−'}${rupees(Math.abs(gain))}`, label: 'gain or loss'},
        ]}
      />
      {m && (
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <PriceLine market={m} />
            <div className="mt-6">
              {m.history.length ? <PriceChart history={m.history} /> : <p className="text-muted">No price yet.</p>}
            </div>
          </div>
          <div className="lg:col-span-5">
            {m.open && mine ? (
              <TradeForm market={m} me={mine} onDone={reload} />
            ) : (
              <p className="rounded-[22px] border border-rule p-6 text-muted">{copy.closed}</p>
            )}
          </div>
        </div>
      )}
      <p className="flex gap-3 text-sm text-muted">
        <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" /> {copy.caveat}
      </p>
      <div>
        <p className="eyebrow">{copy.trades}</p>
        {mine?.trades.length === 0 ? (
          <p className="mt-4 text-muted">{copy.noTrades}</p>
        ) : (
          <ul className="mt-4 border-t border-rule">
            {mine?.trades.map((t) => (
              <li key={t._id} className="flex flex-wrap items-center justify-between gap-3 border-b border-rule py-4">
                <span className="min-w-0">
                  <span className="block font-medium">
                    {SIDE[t.side]} · {credits(t.units)} credits
                  </span>
                  <span className="block text-sm text-muted">
                    {formatDate(t.createdAt)}
                    {t.side !== 'claim' && ` · ${rupees(t.price)} a credit`}
                    {t.orderNo && ` · sponsorship #${t.orderNo}`}
                    {t.status === 'failed' && ' · not done, nothing moved'}
                    {t.status === 'owed' && ' · paying into your wallet'}
                  </span>
                </span>
                {t.amount > 0 && (
                  <span className="tabular-nums">
                    {t.side === 'buy' ? '−' : '+'}
                    {rupees(t.amount)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
