// The carbon credit price over time: one line, a crosshair and tooltip on hover, and a table for screen readers.
import {useState} from 'react';
import {formatDay} from '../../lib/format';
import {rupees} from './money';

export function PriceChart({history, height = 220, label = 'Price per credit'}) {
  const [hover, setHover] = useState(null);
  if (!history?.length) return null;
  const prices = history.map((p) => p.price);
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  const pad = (hi - lo) * 0.15 || hi * 0.05;
  // x and y as percentages, so the chart fills any width without distorting its marks.
  const x = (i) => (history.length === 1 ? 50 : (i / (history.length - 1)) * 100);
  const y = (p) => 100 - ((p - (lo - pad)) / (hi - lo + 2 * pad)) * 100;
  const points = history.map((p, i) => `${x(i)},${y(p.price)}`).join(' ');
  const shown = hover ?? history.length - 1;
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setHover(Math.round(((e.clientX - r.left) / r.width) * (history.length - 1)));
  };

  return (
    <figure>
      <div
        className="relative touch-none select-none"
        style={{height}}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        aria-hidden
      >
        {/* Recessive guides at the top, middle and bottom of the range. */}
        {[0, 50, 100].map((g) => (
          <span key={g} className="absolute inset-x-0 border-t border-rule" style={{top: `${g}%`}} />
        ))}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
          <polyline
            points={points}
            fill="none"
            className="stroke-ink"
            strokeWidth="2"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {hover !== null && (
          <span className="absolute inset-y-0 border-l border-dashed border-muted" style={{left: `${x(shown)}%`}} />
        )}
        <span
          className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-accent"
          style={{left: `${x(shown)}%`, top: `${y(history[shown].price)}%`}}
        />
        {hover !== null && (
          <span
            className="absolute top-0 z-10 -translate-x-1/2 rounded-[10px] border border-rule bg-paper px-3 py-2 text-sm whitespace-nowrap shadow-sm"
            style={{left: `clamp(4rem, ${x(shown)}%, calc(100% - 4rem))`}}
          >
            <span className="block font-medium tabular-nums">{rupees(history[shown].price)}</span>
            <span className="block text-xs text-muted">{formatDay(history[shown].at)}</span>
          </span>
        )}
      </div>
      <figcaption className="mt-3 flex justify-between text-xs text-muted">
        <span>{formatDay(history[0].at)}</span>
        <span>{label}</span>
        <span>{formatDay(history.at(-1).at)}</span>
      </figcaption>
      <table className="sr-only">
        <caption>{label}, as set by the Pirento Green team</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {history.map((p) => (
            <tr key={String(p.at)}>
              <td>{formatDay(p.at)}</td>
              <td>{rupees(p.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
