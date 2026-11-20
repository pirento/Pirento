// The wallet as a dark card: balance, how it moved lately (a sparkline), and the two things you do with it.
import {Link} from 'react-router-dom';
import {ArrowDownLeft, ArrowUpRight} from 'lucide-react';
import {formatDate, inr} from '../../lib/format';

/** Balance after each of the last moves, oldest first, as an SVG line with a dot per move to hover. */
function Sparkline({transactions}) {
  const pts = [...transactions].slice(0, 20).reverse();
  if (pts.length < 2)
    return <p className="mt-8 text-sm text-muted">Your balance history shows here after a few moves.</p>;
  const max = Math.max(...pts.map((t) => t.balanceAfter), 1);
  const x = (i) => (i / (pts.length - 1)) * 100;
  const y = (v) => 36 - (v / max) * 32;
  return (
    <svg
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      className="mt-8 h-20 w-full overflow-visible"
      role="img"
      aria-label={`Balance over the last ${pts.length} moves, from ${inr(pts[0].balanceAfter / 100)} to ${inr(pts.at(-1).balanceAfter / 100)}`}
    >
      <polyline
        points={pts.map((t, i) => `${x(i)},${y(t.balanceAfter)}`).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.map((t, i) => (
        // A wide invisible hit area per move; the browser tooltip names it.
        <rect key={t._id} x={x(i) - 50 / pts.length} width={100 / pts.length} y="0" height="40" fill="transparent">
          <title>{`${formatDate(t.createdAt)} · ${t.type === 'credit' ? '+' : '−'}${inr(t.amount / 100)} · balance ${inr(t.balanceAfter / 100)}`}</title>
        </rect>
      ))}
    </svg>
  );
}

export function WalletCard({wallet}) {
  return (
    <section
      aria-labelledby="wallet-h"
      className="inverse relative flex h-full flex-col overflow-hidden rounded-[22px] p-7 md:p-8"
      data-reveal
    >
      <div aria-hidden className="grid-bg absolute inset-0 opacity-20" />
      <div className="relative flex items-center justify-between">
        <h2 id="wallet-h" className="eyebrow">
          Pirento wallet
        </h2>
        <Link to="/wallet" className="text-sm underline-offset-4 hover:underline">
          History
        </Link>
      </div>
      <p className="num relative mt-6 text-[clamp(2.5rem,5vw,3.75rem)]!">{wallet ? inr(wallet.balance / 100) : '—'}</p>
      <div className="relative">
        <Sparkline transactions={wallet?.transactions ?? []} />
      </div>
      <div className="relative mt-auto flex flex-wrap gap-2 pt-8">
        <Link
          to="/wallet#add"
          className="inline-flex items-center gap-2 rounded-full bg-on-inverse px-4 py-2 text-sm font-medium text-inverse"
        >
          <ArrowDownLeft aria-hidden className="size-4" /> Add money
        </Link>
        <Link
          to="/wallet#withdraw"
          className="inline-flex items-center gap-2 rounded-full border border-inverse-rule px-4 py-2 text-sm"
        >
          <ArrowUpRight aria-hidden className="size-4" /> Withdraw
        </Link>
      </div>
    </section>
  );
}
