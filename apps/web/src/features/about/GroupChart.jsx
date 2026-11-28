// About: the group as a map you can explore. The company on the left with its parts as a numbered list (each with
// how many it holds); the chosen part on the right as an orbit, its members around it (as chips on a phone), with a
// line on what it is and where to go next. The bodies run on their own are the last entry, marked as such.
import {useLayoutEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import gsap from 'gsap';
import {ArrowUpRight} from 'lucide-react';
import {PRODUCTS} from '@pirento/shared';
import {ProductIcon} from '../../components/ui/ProductIcon';
import {ALONGSIDE, COMPANY, FOUNDATION, TOOLS, VENTURES} from '../../data/group';
import {brand} from '../../data/site';
import {reducedMotion} from '../../lib/motion';

const PARTS = [
  {
    name: 'Pirento Ecosystem',
    sub: `The brand: ${PRODUCTS.length} products on one account.`,
    members: PRODUCTS.map((p) => ({name: p.short, product: p, to: `/${p.slug}`})),
    link: {to: '/products', label: 'See all products'},
  },
  {
    name: FOUNDATION.name,
    sub: 'The social-impact arm. Registration pending.',
    members: FOUNDATION.programmes.map((p) => ({name: p.title})),
    link: {href: FOUNDATION.href, label: 'Visit Pirento Foundation'},
  },
  {
    name: 'Ventures',
    sub: 'Businesses run with the company.',
    members: VENTURES.map((v) => ({name: v.name, href: v.href})),
    link: {to: '#family', label: 'Meet the ventures'},
  },
  {name: 'Tools', sub: 'Software the group runs on.', members: TOOLS.map((t) => ({name: t.name}))},
  {
    name: 'Run on their own',
    sub: 'Close to us, with their own books and decisions; not part of the company.',
    members: ALONGSIDE.map((a) => ({name: a.name, href: a.href})),
    apart: true,
  },
];

const two = (n) => String(n).padStart(2, '0');

/** One member: a link where it has a page or a site, else just its name. */
function Member({m, className}) {
  const inner = (
    <>
      {m.product && <ProductIcon product={m.product} className="size-5" />}
      {m.name}
    </>
  );
  if (m.to)
    return (
      <Link to={m.to} className={`${className} hover:border-ink`}>
        {inner}
      </Link>
    );
  if (m.href)
    return (
      <a href={m.href} target="_blank" rel="noopener noreferrer" className={`${className} hover:border-ink`}>
        {inner}
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    );
  return <span className={className}>{inner}</span>;
}

export function GroupChart() {
  const [at, setAt] = useState(0);
  const part = PARTS[at];
  const stage = useRef(null);

  // The chosen part's members come in one after another, round the orbit.
  useLayoutEffect(() => {
    if (reducedMotion() || !stage.current) return;
    gsap.fromTo(
      stage.current.querySelectorAll('[data-node]'),
      {autoAlpha: 0, scale: 0.6},
      {autoAlpha: 1, scale: 1, duration: 0.6, ease: 'power3.out', stagger: 0.05, overwrite: true},
    );
  }, [at]);

  const chip =
    'inline-flex items-center gap-2 rounded-full border border-rule bg-paper px-3.5 py-2 text-sm whitespace-nowrap';
  return (
    <div className="mt-16 grid gap-10 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-5" data-reveal>
        <div className="rounded-[22px] bg-inverse p-6 text-on-inverse md:p-8">
          <p className="text-xs tracking-[0.12em] uppercase opacity-70">The company</p>
          <h3 className="mt-3 text-2xl leading-tight">{COMPANY.name}</h3>
          <p className="mt-2 text-sm opacity-70">
            CIN {brand.cin} · since {COMPANY.founded}
          </p>
        </div>
        <ol className="mt-6" aria-label="The parts of the group">
          {PARTS.map((p, i) => (
            <li key={p.name}>
              <button
                type="button"
                onClick={() => setAt(i)}
                aria-pressed={i === at}
                className={`flex w-full items-center gap-4 border-b py-4 text-left transition-colors duration-500 ${
                  p.apart ? 'border-dashed border-rule' : 'border-rule'
                } ${i === at ? 'text-ink' : 'text-muted hover:text-ink'}`}
              >
                <span className="w-6 font-mono text-xs tabular-nums">{two(i + 1)}</span>
                <span className="flex-1 text-lg">{p.name}</span>
                <span className="num text-2xl tabular-nums">{p.members.length}</span>
                <span
                  aria-hidden
                  className={`size-2 rounded-full transition-colors duration-500 ${i === at ? 'bg-accent' : 'bg-rule'}`}
                />
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="lg:col-span-7" data-reveal>
        <div ref={stage}>
          {/* The orbit: the part in the middle, its members evenly round a ring. */}
          <div className="relative mx-auto hidden aspect-square w-full max-w-[34rem] sm:block">
            <div aria-hidden className="absolute inset-[12%] rounded-full border border-rule" />
            <div
              aria-hidden
              className={`absolute inset-[30%] rounded-full border ${part.apart ? 'border-dashed' : ''} border-rule`}
            />
            <div className="absolute inset-[34%] flex flex-col items-center justify-center rounded-full bg-stone text-center">
              <span className="num text-[clamp(2.5rem,5vw,3.5rem)] leading-none tabular-nums">
                {part.members.length}
              </span>
              <span className="mt-2 px-4 text-sm leading-tight">{part.name}</span>
            </div>
            <ul>
              {part.members.map((m, i) => {
                const a = (i / part.members.length) * Math.PI * 2 - Math.PI / 2;
                return (
                  <li
                    key={m.name}
                    data-node
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{left: `${50 + 38 * Math.cos(a)}%`, top: `${50 + 38 * Math.sin(a)}%`}}
                  >
                    <Member m={m} className={chip} />
                  </li>
                );
              })}
            </ul>
          </div>
          {/* On a phone the same members as a row of chips. */}
          <div className="sm:hidden">
            <p className="flex items-baseline gap-3">
              <span className="num text-5xl tabular-nums">{part.members.length}</span>
              <span className="text-lg">{part.name}</span>
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {part.members.map((m) => (
                <li key={m.name} data-node>
                  <Member m={m} className={chip} />
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-6">
          <p className="max-w-md text-muted">{part.sub}</p>
          {part.link &&
            (part.link.href ? (
              <a
                href={part.link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
              >
                {part.link.label} <ArrowUpRight aria-hidden className="size-4" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : part.link.to.startsWith('#') ? (
              <a
                href={part.link.to}
                className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
              >
                {part.link.label} <ArrowUpRight aria-hidden className="size-4" />
              </a>
            ) : (
              <Link
                to={part.link.to}
                className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
              >
                {part.link.label} <ArrowUpRight aria-hidden className="size-4" />
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
