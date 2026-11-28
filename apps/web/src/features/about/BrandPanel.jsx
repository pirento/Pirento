// One large panel in a part of the group's own colours (PANEL_COLOURS): a numbered label with two short lines beside
// it, a heading of three short lines in big capitals with the last one highlighted, what it is, its link or its status,
// its offers as a grid with icon badges, and a closing note. Pirento Foundation, Pirento Blank and Pirento INV use it.
import {Illustration} from '../../components/Illustration';
import {Button} from '../../components/ui/Button';

// Inside the panel the site's own tokens take the part's colours, so every shared piece (button, text, rules) follows
// them. The values come from the brand register, never from a component.
const themeOf = (c) => ({
  '--paper': c.paper,
  '--ink': c.ink,
  '--muted': c.muted,
  '--rule': `color-mix(in srgb, ${c.muted} 28%, ${c.paper})`,
  '--stone': `color-mix(in srgb, ${c.muted} 10%, ${c.paper})`,
  '--accent': c.accent,
  '--on-accent': c.onAccent,
  '--highlight': c.highlight,
});
// The faint 72px line grid of the design system, fading out toward the panel's edges.
const GRID = {
  backgroundImage:
    'linear-gradient(to right, var(--rule) 1px, transparent 1px), linear-gradient(to bottom, var(--rule) 1px, transparent 1px)',
  backgroundSize: '72px 72px',
  maskImage: 'radial-gradient(ellipse at 30% 20%, black, transparent 75%)',
};

const two = (n) => String(n).padStart(2, '0');

/**
 * `colours`: one entry of PANEL_COLOURS. `n`: the section number on the home (left out on the About page). `side`:
 * two short lines at the top right. `title`: three lines. `link`: {href, label} to its site, else `status` shows as a
 * pill. `items`: [{icon, title, body}] drawn with `icons`. `art`: a scene beside the heading. `as`: heading level.
 */
export function BrandPanel({
  colours,
  n,
  name,
  side,
  title,
  body,
  link,
  status,
  items,
  icons,
  note,
  art,
  as: Title = 'h2',
}) {
  return (
    <div
      style={themeOf(colours)}
      className="relative overflow-hidden rounded-[28px] bg-paper px-6 py-12 text-ink md:rounded-[40px] md:px-12 md:py-16 lg:px-16 lg:py-20"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60" style={GRID} />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-4" data-reveal>
          <div>
            <p className="eyebrow text-muted">
              {n && <span className="text-ink">{two(n)} / </span>}
              {name}
            </p>
            <span aria-hidden className="mt-4 block h-0.5 w-12 bg-ink" />
          </div>
          <p className="text-sm text-muted sm:text-right">
            {side[0]}
            <br />
            {side[1]}
          </p>
        </div>

        <div className={`mt-12 ${art ? 'grid gap-10 lg:grid-cols-12 lg:items-end' : ''}`}>
          <Title
            className={`font-display ${art ? 'text-[clamp(3.25rem,8vw,6.25rem)] lg:col-span-7' : 'text-[clamp(3rem,10vw,8.5rem)]'} leading-[0.88] font-bold tracking-[-0.035em] uppercase`}
            data-reveal
          >
            {title[0]}
            <br />
            {title[1]}
            <br />
            <span className="text-(--highlight)">{title[2]}</span>
          </Title>
          {art && (
            <div className="lg:col-span-5" data-reveal>
              <Illustration name={art} />
            </div>
          )}
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-12 md:items-end" data-reveal>
          <p className="body max-w-xl text-muted md:col-span-7">{body}</p>
          <div className="md:col-span-5 md:justify-self-end">
            {link ? (
              <Button href={link.href} target="_blank" rel="noopener noreferrer" variant="accent">
                {link.label} <span className="sr-only">(opens in a new tab)</span>
              </Button>
            ) : (
              status && (
                <span className="inline-flex items-center gap-2 rounded-full border border-rule px-4 py-2 text-sm">
                  <span aria-hidden className="size-2 rounded-full bg-accent" />
                  {status}
                </span>
              )
            )}
          </div>
        </div>

        <ol
          className={`mt-16 grid gap-px overflow-hidden rounded-[22px] border border-rule bg-rule sm:grid-cols-2 ${
            items.length % 4 === 0 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
          }`}
        >
          {items.map((p, i) => {
            const Icon = icons[p.icon] ?? Object.values(icons)[0];
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

        {note && (
          <p className="mt-8 max-w-3xl text-sm text-muted" data-reveal>
            {note}
          </p>
        )}
      </div>
    </div>
  );
}
