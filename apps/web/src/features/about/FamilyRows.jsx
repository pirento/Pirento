// The Pirento family beyond the ten products, in the design system's own patterns: Pirento Foundation as its panel in
// its own colours (with its picture on the About page), then the other parts as small 3D cards grouped like the
// products above them, each with a round button to its website.
import {ArrowUpDown, ArrowUpRight, Gem, HandHeart, Receipt, Sofa, Sparkles, TrendingUp} from 'lucide-react';
import {useRef} from 'react';
import gsap from 'gsap';
import {FAMILY_GROUPS, PEOPLE} from '../../data/group';
import {reducedMotion} from '../../lib/motion';
import {Avatar} from './Avatar';
import {FoundationPanel} from './FoundationSection';

const ICONS = {
  elevator: ArrowUpDown,
  facility: Sparkles,
  interior: Sofa,
  jewellery: Gem,
  trust: HandHeart,
  journal: TrendingUp,
  billing: Receipt,
};

const two = (n) => String(n).padStart(2, '0');

/** A small 3D card: its icon, what it is, its name and line, who leads it, and a round button to its website. On a
 * mouse it tilts toward the pointer, the icon and name standing off the card. */
function Card({item, index, count}) {
  const Icon = ICONS[item.icon] ?? Sparkles;
  const lead = item.lead && PEOPLE[item.lead];
  const ref = useRef(null);
  const tilt = (e) => {
    if (e.pointerType !== 'mouse' || reducedMotion()) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(ref.current, {rotationY: x * 14, rotationX: -y * 12, duration: 0.5, ease: 'power3.out'});
  };
  const settle = () => {
    gsap.to(ref.current, {rotationY: 0, rotationX: 0, duration: 0.7, ease: 'power3.out'});
  };
  return (
    <article data-reveal onPointerMove={tilt} onPointerLeave={settle} style={{perspective: '900px'}}>
      <div
        ref={ref}
        style={{transformStyle: 'preserve-3d'}}
        className="group/fam flex h-full flex-col rounded-[24px] border border-rule bg-paper p-6 transition-[border-color,box-shadow] duration-500 ease-ui hover:border-ink hover:shadow-[0_30px_60px_-40px_rgba(15,38,32,0.5)]"
      >
        <div className="flex items-center justify-between" style={{transform: 'translateZ(36px)'}}>
          <span className="flex size-12 items-center justify-center rounded-full bg-stone transition-colors duration-500 ease-ui group-hover/fam:bg-ink group-hover/fam:text-paper">
            <Icon aria-hidden className="size-5" />
          </span>
          <span className="font-mono text-[0.65rem] text-muted tabular-nums">
            {two(index + 1)} / {two(count)}
          </span>
        </div>
        <div className="mt-10" style={{transform: 'translateZ(24px)'}}>
          {item.meta && <p className="text-[0.7rem] tracking-[0.12em] text-muted uppercase">{item.meta}</p>}
          <h4 className="mt-2 text-2xl leading-tight">{item.name}</h4>
          {item.tagline && <p className="mt-1.5 text-sm text-muted">{item.tagline}</p>}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-8">
          {lead ? (
            <span className="flex min-w-0 items-center gap-2 text-xs">
              <Avatar person={lead} className="size-7 text-[0.6rem]" />
              <span className="truncate">{lead.name}</span>
            </span>
          ) : (
            <span />
          )}
          {item.href && (
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="Visit"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent transition-transform duration-500 ease-ui hover:scale-110"
            >
              <ArrowUpRight
                aria-hidden
                className="size-5 transition-transform duration-500 group-hover/fam:rotate-45"
              />
              <span className="sr-only">{item.domain} (opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/** `art`: the Foundation's picture (the About page shows it); every picture is used once. */
export function FamilyRows({art = true}) {
  return (
    <div className="mt-16">
      <FoundationPanel art={art} as="h3" />
      <div className="mt-20 border-t border-rule">
        {FAMILY_GROUPS.map((g, i) => (
          <div key={g.title} className="grid gap-6 border-b border-rule py-10 lg:grid-cols-12" data-reveal>
            <div className="lg:col-span-4">
              <span className="text-sm text-muted tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 text-2xl">{g.title}</h3>
              <p className="mt-2 text-muted">{g.body}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3">
              {g.items.map((item, k) => (
                <Card key={item.name} item={item} index={k} count={g.items.length} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
