// One card in the home's family stacks: its picture with its place in the stack, what it is, its name and line, who
// leads it, and its website, which the whole card opens in a new tab. Smaller than the product cards above it.
import {ArrowUpRight} from 'lucide-react';
import {Illustration} from '../../components/Illustration';
import {familyArt} from '../../data/site';
import {Avatar} from './Avatar';

const two = (n) => String(n).padStart(2, '0');

export function FamilyCard({item, index, count, front}) {
  const El = item.href ? 'a' : 'div';
  // A card without a website still takes the focus when in front, so the keyboard can move the deck from it.
  const link = item.href
    ? {href: item.href, target: '_blank', rel: 'noopener noreferrer', 'data-cursor': 'Visit', tabIndex: front ? 0 : -1}
    : {tabIndex: front ? 0 : -1};
  return (
    <El
      {...link}
      className="group/fc flex h-full flex-col rounded-[24px] border border-rule bg-paper p-2 transition-[border-color] duration-500 ease-ui hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-4"
    >
      <div className="relative">
        <Illustration name={familyArt[item.name]} className="rounded-[18px] border-0" />
        <span className="absolute top-2.5 right-2.5 rounded-full bg-paper px-2 py-0.5 font-mono text-[0.65rem] text-muted tabular-nums shadow-sm">
          {two(index + 1)} / {two(count)}
        </span>
      </div>
      <div className="flex flex-1 flex-col px-3.5 pt-4 pb-2.5">
        {item.meta && <p className="text-[0.7rem] tracking-[0.12em] text-muted uppercase">{item.meta}</p>}
        <h3 className={`text-xl leading-tight ${item.meta ? 'mt-1.5' : ''}`}>{item.name}</h3>
        {item.tagline && <p className="mt-1 text-xs text-muted">{item.tagline}</p>}
        <p className="mt-2.5 text-sm leading-relaxed">{item.body}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-3 pt-4">
          {item.lead ? (
            <span className="flex items-center gap-2 text-xs whitespace-nowrap">
              <Avatar person={item.lead} className="size-7 text-[0.6rem]" />
              <span>
                <span className="block font-medium">{item.lead.name}</span>
                <span className="block text-muted">Leads it</span>
              </span>
            </span>
          ) : (
            <span className="text-xs text-muted">{!item.href && item.domain}</span>
          )}
          {item.href && (
            <span className="flex items-center gap-2 text-xs font-medium whitespace-nowrap">
              {item.domain}
              <span
                aria-hidden
                className="flex size-8 items-center justify-center rounded-full border border-rule transition-colors duration-500 ease-ui group-hover/fc:border-accent group-hover/fc:bg-accent group-hover/fc:text-on-accent"
              >
                <ArrowUpRight className="size-3.5 transition-transform duration-500 group-hover/fc:rotate-45" />
              </span>
              <span className="sr-only">(opens in a new tab)</span>
            </span>
          )}
        </div>
      </div>
    </El>
  );
}
