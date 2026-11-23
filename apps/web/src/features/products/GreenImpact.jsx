// Pirento Green's home: the live planting record, counted from paid sponsorships by the orders service.
import {MapPin} from 'lucide-react';
import {StatsRow} from '../../components/ui/Blocks';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {green as copy} from '../../data/site';
import {useApi} from '../../lib/api/useApi';
import {formatDay} from '../../lib/format';

export function GreenImpact({n}) {
  const {data, error} = useApi('/orders/green/impact');
  // A failed count hides the section rather than showing made-up zeros.
  if (error) return null;
  const v = (x) => (data ? x.toLocaleString('en-IN') : '—');
  return (
    <Section id="record">
      <SectionHeader n={n} label={copy.impact.label} title={copy.impact.title} intro={copy.impact.intro} />
      <div className="mt-16">
        <StatsRow
          stats={[
            {value: v(data?.trees ?? 0), label: 'trees sponsored'},
            {value: v(data?.planted ?? 0), label: 'trees planted'},
            {value: v(data?.sponsors ?? 0), label: 'sponsors'},
          ]}
        />
      </div>
      {data && data.trees === 0 && <p className="mt-8 text-muted">{copy.impact.empty}</p>}
      {data?.drives.length > 0 && (
        <ul className="mt-12 border-t border-rule">
          {data.drives.map((d) => (
            <li
              key={d.slug}
              className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule py-4"
              data-reveal
            >
              <span className="font-medium">{d.name.replace(/^Sponsor trees · /, '')}</span>
              <span className="text-sm tabular-nums text-muted">
                {d.trees.toLocaleString('en-IN')} sponsored · {d.planted.toLocaleString('en-IN')} planted
              </span>
            </li>
          ))}
        </ul>
      )}
      {data?.recent.length > 0 && (
        <div className="mt-12">
          <p className="eyebrow">{copy.impact.recent}</p>
          <ul className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.recent.map((r, i) => (
              <li key={i} className="flex gap-4 rounded-[18px] border border-rule p-5" data-reveal>
                <MapPin aria-hidden className="mt-1 size-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block font-medium break-words">{r.site}</span>
                  <span className="block text-sm text-muted">
                    {r.trees} tree{r.trees === 1 ? '' : 's'} · {r.drive.replace(/^Sponsor trees · /, '')}
                    {r.plantedOn && ` · ${formatDay(r.plantedOn)}`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}
