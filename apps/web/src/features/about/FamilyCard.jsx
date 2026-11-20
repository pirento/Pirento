// One part of the Pirento family as a card. With a website the whole card opens it in a new tab.
import {ArrowUpRight} from 'lucide-react';
import {PEOPLE} from '../../data/group';
import {Avatar} from './Avatar';

const monogram = (name) =>
  name
    .split(' ')
    .filter((w) => /^[A-Z]/.test(w))
    .map((w) => w[0])
    .slice(0, 2)
    .join('');

export function FamilyCard({item}) {
  const lead = item.lead && PEOPLE[item.lead];
  const Tag = item.href ? 'a' : 'article';
  const link = item.href ? {href: item.href, target: '_blank', rel: 'noopener noreferrer', 'data-cursor': 'Visit'} : {};
  return (
    <Tag
      {...link}
      data-reveal
      className={`group flex flex-col rounded-[22px] border border-rule p-6 transition-[border-color,transform] duration-500 ease-ui md:p-8 ${
        item.featured ? 'inverse lg:col-span-2' : 'bg-paper'
      } ${item.href ? 'hover:-translate-y-1 hover:border-ink' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          aria-hidden
          className={`flex size-12 shrink-0 items-center justify-center rounded-[14px] font-display text-lg font-semibold ${
            item.featured ? 'bg-accent text-on-accent' : 'bg-inverse text-on-inverse'
          }`}
        >
          {monogram(item.name)}
        </span>
        <span className="rounded-full border border-rule px-3 py-1 text-right text-xs text-muted">{item.kind}</span>
      </div>
      <h3 className={`mt-8 ${item.featured ? 'text-[clamp(1.8rem,3vw,2.6rem)]' : 'text-2xl'}`}>{item.name}</h3>
      {item.tagline && <p className="mt-1 text-sm text-muted">{item.tagline}</p>}
      <p className="mt-4 max-w-2xl leading-relaxed">{item.body}</p>
      {item.programmes && (
        <ul className="mt-6 flex flex-wrap gap-2">
          {item.programmes.map((p) => (
            <li key={p.title} className="rounded-full border border-rule px-3 py-1.5 text-sm">
              {p.title}
            </li>
          ))}
        </ul>
      )}
      {item.status && <p className="mt-4 text-xs text-muted">{item.status}</p>}
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
          <span className="inline-flex items-center gap-1.5 text-sm font-medium">
            {item.domain ?? 'Visit website'}
            <ArrowUpRight
              aria-hidden
              className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
            <span className="sr-only">(opens in a new tab)</span>
          </span>
        ) : (
          item.domain && <span className="text-sm text-muted">{item.domain}</span>
        )}
      </div>
    </Tag>
  );
}

export function FamilyGrid({items}) {
  return (
    <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <FamilyCard key={item.name} item={item} />
      ))}
    </div>
  );
}
