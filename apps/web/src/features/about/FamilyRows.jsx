// The Pirento family beyond the ten products, in the design system's own patterns: Pirento Foundation as a
// feature row (illustration, meta line, highlights, link), then the other parts as card rows grouped like the
// products above them. A card with a website opens it in a new tab.
import {ArrowUpDown, ArrowUpRight, Gem, HandHeart, Receipt, Sofa, Sparkles, TrendingUp} from 'lucide-react';
import {Illustration} from '../../components/Illustration';
import {Button} from '../../components/ui/Button';
import {FAMILY_GROUPS, FOUNDATION, PEOPLE} from '../../data/group';

const ICONS = {
  elevator: ArrowUpDown,
  facility: Sparkles,
  interior: Sofa,
  jewellery: Gem,
  trust: HandHeart,
  journal: TrendingUp,
  billing: Receipt,
};

function FoundationRow() {
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:items-center" data-reveal>
      <Illustration name="leaf" className="lg:col-span-6" />
      <div className="lg:col-span-6">
        <p className="text-sm text-muted">Foundation · {FOUNDATION.status.split('.')[0]}</p>
        <h3 className="mt-4 text-[clamp(1.75rem,3.6vw,3.25rem)] leading-[1.02]">{FOUNDATION.name}</h3>
        <p className="mt-2 text-muted">{FOUNDATION.tagline}</p>
        <p className="body mt-6">{FOUNDATION.body}</p>
        <ul className="mt-8 space-y-3 border-l border-rule pl-5">
          {FOUNDATION.programmes.map((p) => (
            <li key={p.title}>
              <span className="font-medium">{p.title}</span>
              <span className="text-muted"> · {p.body}</span>
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <Button href={FOUNDATION.href} target="_blank" rel="noopener noreferrer" variant="outline">
            Visit Pirento Foundation <span className="sr-only">(opens in a new tab)</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Card({item}) {
  const Icon = ICONS[item.icon] ?? Sparkles;
  const lead = item.lead && PEOPLE[item.lead];
  const Tag = item.href ? 'a' : 'article';
  const link = item.href ? {href: item.href, target: '_blank', rel: 'noopener noreferrer', 'data-cursor': 'Visit'} : {};
  return (
    <Tag
      {...link}
      data-reveal
      className={`group flex flex-col rounded-[18px] border border-rule bg-paper p-6 transition-[border-color,transform] duration-500 ease-ui ${
        item.href ? 'hover:-translate-y-1 hover:border-ink' : ''
      }`}
    >
      <span className="flex size-11 items-center justify-center rounded-full border border-rule transition-colors duration-500 group-hover:border-accent group-hover:bg-accent group-hover:text-on-accent">
        <Icon aria-hidden className="size-5" />
      </span>
      {item.meta && <p className="mt-8 text-xs text-muted">{item.meta}</p>}
      <h4 className={`text-2xl ${item.meta ? 'mt-2' : 'mt-8'}`}>{item.name}</h4>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{item.body}</p>
      {(lead || item.domain) && (
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-6 text-sm">
          {lead && <span className="text-muted">Led by {lead.name}</span>}
          {item.domain && (
            <span className={`inline-flex items-center gap-1 ${item.href ? 'font-medium' : 'text-muted'}`}>
              {item.domain}
              {item.href && (
                <>
                  <ArrowUpRight aria-hidden className="size-4" />
                  <span className="sr-only">(opens in a new tab)</span>
                </>
              )}
            </span>
          )}
        </div>
      )}
    </Tag>
  );
}

export function FamilyRows() {
  return (
    <div className="mt-16">
      <FoundationRow />
      <div className="mt-20 border-t border-rule">
        {FAMILY_GROUPS.map((g, i) => (
          <div key={g.title} className="grid gap-6 border-b border-rule py-10 lg:grid-cols-12" data-reveal>
            <div className="lg:col-span-4">
              <span className="text-sm text-muted tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 text-2xl">{g.title}</h3>
              <p className="mt-2 text-muted">{g.body}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3">
              {g.items.map((item) => (
                <Card key={item.name} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
