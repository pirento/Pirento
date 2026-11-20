// "Get started" checklist, worked out from your own records; it disappears once everything is done.
import {Link} from 'react-router-dom';
import {Check} from 'lucide-react';
import {dashboard} from '../../data/site';

export function NextSteps({user, data}) {
  const done = {
    name: Boolean(user.name),
    order: data.orders?.length > 0,
    identity: Boolean(data.identity),
    certificate: data.learning?.certificates.length > 0,
  };
  const left = dashboard.steps.filter((s) => !done[s.id]).length;
  // Wait for the records, so a finished checklist never flashes on screen.
  if (left === 0 || data.orders === undefined) return null;
  return (
    <section aria-labelledby="next" className="rounded-[22px] border border-rule p-6 md:p-8" data-reveal>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="next" className="text-2xl">
          Get started
        </h2>
        <span className="text-sm text-muted tabular-nums">
          {dashboard.steps.length - left} of {dashboard.steps.length} done
        </span>
      </div>
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-stone" aria-hidden>
        <div
          className="h-full bg-accent transition-[width] duration-700"
          style={{width: `${((dashboard.steps.length - left) / dashboard.steps.length) * 100}%`}}
        />
      </div>
      <ol className="mt-6 grid gap-3 sm:grid-cols-2">
        {dashboard.steps.map((s) => (
          <li key={s.id}>
            <Link
              to={s.to}
              className={`flex h-full items-start gap-4 rounded-[18px] border p-4 transition-colors ${
                done[s.id] ? 'border-rule text-muted' : 'border-rule hover:border-ink'
              }`}
            >
              <span
                className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border ${
                  done[s.id] ? 'border-ink bg-ink text-paper' : 'border-rule'
                }`}
              >
                {done[s.id] && <Check aria-hidden className="size-3.5" />}
              </span>
              <span>
                <span className={`block font-medium ${done[s.id] ? 'line-through' : ''}`}>{s.title}</span>
                <span className="text-sm text-muted">{s.body}</span>
                <span className="sr-only">{done[s.id] ? ' (done)' : ''}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
