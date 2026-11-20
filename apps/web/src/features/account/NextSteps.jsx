// "Get started": numbered steps worked out from your own records, connected by a thin line.
import {Link} from 'react-router-dom';
import {Check} from 'lucide-react';
import {dashboard} from '../../data/site';

/** Which first steps are done; undefined until the records have loaded. */
export function stepsDone(user, data) {
  if (data.orders === undefined) return undefined;
  return {
    name: Boolean(user.name),
    order: data.orders.length > 0,
    identity: Boolean(data.identity),
    certificate: data.learning?.certificates.length > 0,
  };
}

export function NextSteps({done}) {
  return (
    <ol className="relative">
      {/* The thin line that joins the step numbers. */}
      <span aria-hidden className="absolute top-5 bottom-5 left-5 w-px bg-rule" />
      {dashboard.steps.map((s, i) => (
        <li key={s.id} className="relative pb-6 last:pb-0" data-reveal>
          <Link to={s.to} className="group flex items-start gap-4">
            <span
              className={`relative flex size-10 shrink-0 items-center justify-center rounded-full border text-sm tabular-nums transition-colors ${
                done[s.id] ? 'border-ink bg-ink text-paper' : 'border-rule bg-paper group-hover:border-ink'
              }`}
            >
              {done[s.id] ? <Check aria-hidden className="size-4" /> : String(i + 1).padStart(2, '0')}
            </span>
            <span className="min-w-0 pt-1.5">
              <span className={`block font-medium ${done[s.id] ? 'text-muted line-through' : 'group-hover:underline'}`}>
                {s.title}
              </span>
              <span className="block text-sm text-muted">{s.body}</span>
              <span className="sr-only">{done[s.id] ? ' (done)' : ''}</span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
