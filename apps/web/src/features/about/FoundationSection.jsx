// Pirento Foundation on the home: one large panel in the Foundation's own colours (deep blue, yellow, cream), its
// promise in big capitals, what it is, a link to its site, its four programmes and its registration status.
import {GraduationCap, HeartPulse, Sprout, UtensilsCrossed} from 'lucide-react';
import {FOUNDATION_COLOURS as F} from '@pirento/shared';
import {Section} from '../../components/ui/Heading';
import {Button} from '../../components/ui/Button';
import {FOUNDATION} from '../../data/group';

const ICONS = {tree: Sprout, food: UtensilsCrossed, school: GraduationCap, health: HeartPulse};

// Inside the panel the site's own tokens take the Foundation's colours, so every shared part (button, text, rules)
// follows them. They come from the brand register, never from here.
const THEME = {
  '--paper': F.dark,
  '--ink': F.cream,
  '--muted': F.soft,
  '--rule': `color-mix(in srgb, ${F.soft} 28%, ${F.dark})`,
  '--stone': `color-mix(in srgb, ${F.soft} 10%, ${F.dark})`,
  '--accent': F.accent,
  '--on-accent': F.dark,
};
// The faint 72px line grid of the design system, fading out toward the panel's edges.
const GRID = {
  backgroundImage:
    'linear-gradient(to right, var(--rule) 1px, transparent 1px), linear-gradient(to bottom, var(--rule) 1px, transparent 1px)',
  backgroundSize: '72px 72px',
  maskImage: 'radial-gradient(ellipse at 30% 20%, black, transparent 75%)',
};

const two = (n) => String(n).padStart(2, '0');

export function FoundationSection({n}) {
  return (
    <Section id="foundation">
      <div
        style={THEME}
        className="relative overflow-hidden rounded-[28px] bg-paper px-6 py-12 text-ink md:rounded-[40px] md:px-12 md:py-16 lg:px-16 lg:py-20"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60" style={GRID} />

        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-4" data-reveal>
            <div>
              <p className="eyebrow text-muted">
                <span className="text-ink">{two(n)}</span> / {FOUNDATION.name}
              </p>
              <span aria-hidden className="mt-4 block h-0.5 w-12 bg-ink" />
            </div>
            <p className="text-sm text-muted sm:text-right">
              {FOUNDATION.status.split('.')[0]}
              <br />
              {FOUNDATION.place}
            </p>
          </div>

          <h2
            className="mt-12 font-display text-[clamp(3.25rem,11vw,9.5rem)] leading-[0.88] font-bold tracking-[-0.035em] uppercase"
            data-reveal
          >
            People.
            <br />
            Planet.
            <br />
            <span className="text-accent">Possibility.</span>
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-12 md:items-end" data-reveal>
            <p className="body max-w-xl text-muted md:col-span-7">{FOUNDATION.body}</p>
            <div className="md:col-span-5 md:justify-self-end">
              <Button href={FOUNDATION.href} target="_blank" rel="noopener noreferrer" variant="accent">
                Visit Pirento Foundation <span className="sr-only">(opens in a new tab)</span>
              </Button>
            </div>
          </div>

          <ol className="mt-16 grid gap-px overflow-hidden rounded-[22px] border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
            {FOUNDATION.programmes.map((p, i) => {
              const Icon = ICONS[p.icon] ?? Sprout;
              return (
                <li key={p.title} className="group/prog bg-paper p-6 md:p-8" data-reveal>
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-full border border-rule transition-colors duration-500 ease-ui group-hover/prog:border-accent group-hover/prog:bg-accent group-hover/prog:text-on-accent">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <span className="font-mono text-xs text-muted tabular-nums">{two(i + 1)}</span>
                  </div>
                  <h3 className="mt-8 text-xl">{p.title}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{p.body}</p>
                </li>
              );
            })}
          </ol>

          <p className="mt-8 text-sm text-muted" data-reveal>
            {FOUNDATION.status}
          </p>
        </div>
      </div>
    </Section>
  );
}
