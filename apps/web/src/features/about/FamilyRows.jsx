// The Pirento family beyond the ten products: Pirento Foundation as one large card with a touch of Pirento Green's
// colour (illustration, tags, link, its programmes along the bottom), then the other parts as slim cards, one per line,
// grouped like the products above them. A card with a website opens it in a new tab.
import {ArrowUpDown, ArrowUpRight, Gem, HandHeart, Receipt, Sofa, Sparkles, TrendingUp} from 'lucide-react';
import {getProduct} from '@pirento/shared';
import {Illustration} from '../../components/Illustration';
import {Button} from '../../components/ui/Button';
import {Tag} from '../../components/ui/Tag';
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

// The Foundation wears Pirento Green's colour from the brand register: Green is its first programme.
const GREEN = getProduct('green');

function FoundationRow({art}) {
  return (
    <article
      style={{'--accent': GREEN.color, '--on-accent': GREEN.onColor}}
      className="group/foundation overflow-hidden rounded-[22px] border border-rule bg-paper transition-colors duration-500 ease-ui hover:border-accent"
      data-reveal
    >
      <div aria-hidden className="h-1.5 bg-accent" />
      <div className="grid bg-[color-mix(in_srgb,var(--accent)_7%,var(--paper))] lg:grid-cols-12">
        {art && (
          <div className="flex items-center border-b border-rule bg-stone lg:col-span-5 lg:border-r lg:border-b-0">
            <Illustration name="leaf" className="w-full rounded-none border-0" />
          </div>
        )}
        <div className={`p-6 md:p-10 ${art ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone="accent">Foundation</Tag>
            <Tag>{FOUNDATION.status.split('.')[0]}</Tag>
          </div>
          <h3 className="mt-6 text-[clamp(1.75rem,3.6vw,3rem)] leading-[1.02]">{FOUNDATION.name}</h3>
          <p className="mt-2 text-muted">{FOUNDATION.tagline}</p>
          <p className="body mt-6 max-w-xl">{FOUNDATION.body}</p>
          <div className="mt-8">
            <Button href={FOUNDATION.href} target="_blank" rel="noopener noreferrer" variant="outline">
              Visit Pirento Foundation <span className="sr-only">(opens in a new tab)</span>
            </Button>
          </div>
        </div>
      </div>
      <ul className="grid border-t border-rule sm:grid-cols-2 lg:grid-cols-4">
        {FOUNDATION.programmes.map((p, i) => (
          <li
            key={p.title}
            className={`p-6 ${i ? 'border-t border-rule sm:border-t-0' : ''} ${i % 2 ? 'sm:border-l' : ''} ${i > 1 ? 'sm:border-t lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l' : ''} border-rule`}
          >
            <p className="flex items-center gap-2 text-xs text-muted">
              <span aria-hidden className="size-1.5 rounded-full bg-accent" />0{i + 1}
            </p>
            <p className="mt-3 font-medium">{p.title}</p>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{p.body}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}

function Card({item}) {
  const Icon = ICONS[item.icon] ?? Sparkles;
  const lead = item.lead && PEOPLE[item.lead];
  const El = item.href ? 'a' : 'article';
  const link = item.href ? {href: item.href, target: '_blank', rel: 'noopener noreferrer', 'data-cursor': 'Visit'} : {};
  return (
    <El
      {...link}
      data-reveal
      className={`group flex items-start gap-4 rounded-[16px] border border-rule bg-paper px-5 py-4 transition-colors duration-500 ease-ui ${
        item.href ? 'hover:border-ink' : ''
      }`}
    >
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-rule transition-colors duration-500 group-hover:border-accent group-hover:bg-accent group-hover:text-on-accent">
        <Icon aria-hidden className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h4 className="text-lg leading-snug">{item.name}</h4>
          {item.meta && <span className="text-xs text-muted">{item.meta}</span>}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{item.body}</p>
        {(lead || item.domain) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {lead && <span className="text-muted">Led by {lead.name}</span>}
            {item.domain && (
              <span className={`inline-flex items-center gap-1 ${item.href ? 'font-medium' : 'text-muted'}`}>
                {item.domain}
                {item.href && (
                  <>
                    <ArrowUpRight aria-hidden className="size-3.5" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </>
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </El>
  );
}

/** `art`: the Foundation's picture, shown where these rows appear first (the home page); every picture is used once. */
export function FamilyRows({art = true}) {
  return (
    <div className="mt-16">
      <FoundationRow art={art} />
      <div className="mt-20 border-t border-rule">
        {FAMILY_GROUPS.map((g, i) => (
          <div key={g.title} className="grid gap-6 border-b border-rule py-10 lg:grid-cols-12" data-reveal>
            <div className="lg:col-span-4">
              <span className="text-sm text-muted tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 text-2xl">{g.title}</h3>
              <p className="mt-2 text-muted">{g.body}</p>
            </div>
            <div className="grid gap-3 lg:col-span-8">
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
