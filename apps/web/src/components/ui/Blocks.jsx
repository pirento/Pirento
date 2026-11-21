// Content blocks used across pages: steps, FAQ, check lists, stat rows.
import {Check, Plus} from 'lucide-react';

export function Steps({steps}) {
  return (
    <ol
      // One row on a desktop; two across on a tablet, where four would be too narrow to read.
      className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-(--cols) lg:gap-6"
      style={{'--cols': `repeat(${steps.length}, minmax(0, 1fr))`}}
    >
      <span aria-hidden className="absolute top-5 right-0 left-0 hidden h-px bg-rule lg:block" />
      {steps.map((s, i) => (
        <li key={s.title} className="relative" data-reveal>
          <span className="num relative inline-flex size-10 items-center justify-center rounded-full border border-rule bg-paper text-base">
            {String(i + 1).padStart(2, '0')}
          </span>
          <h3 className="mt-6 text-2xl">{s.title}</h3>
          <p className="body mt-3 text-base">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function Faq({items}) {
  return (
    <div className="border-t border-rule">
      {items.map((item) => (
        <details key={item.q} className="group border-b border-rule" data-reveal>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-lg font-medium md:text-xl [&::-webkit-details-marker]:hidden">
            {item.q}
            <Plus
              aria-hidden
              className="size-5 shrink-0 transition-transform duration-500 ease-ui group-open:rotate-45"
            />
          </summary>
          <p className="body pb-6">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export const CheckList = ({items}) => (
  <ul className="space-y-3 border-l border-rule pl-5">
    {items.map((t) => (
      <li key={t} className="flex gap-3 text-[0.95rem] text-muted">
        <Check aria-hidden className="mt-1 size-4 shrink-0 text-ink" />
        {t}
      </li>
    ))}
  </ul>
);

/** `compact` fits two to a row on a phone, for dashboards. */
export function StatsRow({stats, compact = false}) {
  return (
    // Flex-wrap, not a fixed grid: any number of stats fills each row with no empty cell.
    <dl className="flex flex-wrap gap-px overflow-hidden rounded-[22px] border border-rule bg-rule">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`min-w-0 flex-1 bg-paper ${compact ? 'basis-36 p-5 md:p-7' : 'basis-52 p-6 md:p-8'}`}
          data-reveal
        >
          <dt className="eyebrow">{s.label}</dt>
          <dd className="num mt-6 text-[clamp(1.75rem,3vw,2.75rem)]!">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
