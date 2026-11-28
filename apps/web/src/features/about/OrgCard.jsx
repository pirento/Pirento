// A card for a venture, a tool or a body alongside the company: name, line, what it does, who leads it, its site.
import {ArrowUpRight} from 'lucide-react';
import {PEOPLE} from '../../data/group';
import {Avatar} from './Avatar';

export function OrgCard({item}) {
  const lead = item.lead && PEOPLE[item.lead];
  return (
    <article className="flex flex-col rounded-[18px] border border-rule bg-paper p-6 md:p-8" data-reveal>
      {item.note && <p className="text-xs tracking-[0.12em] text-muted uppercase">{item.note}</p>}
      <h3 className={`text-2xl ${item.note ? 'mt-3' : ''}`}>{item.name}</h3>
      {item.tagline && <p className="mt-1 text-sm text-muted">{item.tagline}</p>}
      <p className="mt-4 leading-relaxed">{item.body}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-8">
        {lead ? (
          <span className="flex items-center gap-3 text-sm">
            <Avatar person={lead} className="size-9 text-xs" />
            <span>
              <span className="block font-medium">{lead.name}</span>
              <span className="block text-muted">Leads it</span>
            </span>
          </span>
        ) : (
          <span />
        )}
        {item.href ? (
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
          >
            {item.domain ?? 'Visit'} <ArrowUpRight aria-hidden className="size-4" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : (
          item.domain && <span className="text-sm text-muted">{item.domain}</span>
        )}
      </div>
    </article>
  );
}
