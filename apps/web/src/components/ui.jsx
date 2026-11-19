import {useRef} from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight, Check, Plus} from 'lucide-react';
import {lines} from '../lib/motion';

const variants = {
  primary: 'bg-ink text-paper border-ink [--wipe:var(--accent)] hover:text-on-accent',
  outline: 'border-rule text-ink [--wipe:var(--ink)] hover:text-paper hover:border-ink',
  accent: 'bg-accent text-on-accent border-accent [--wipe:var(--ink)] hover:text-paper',
  inverse: 'bg-on-inverse text-inverse border-on-inverse [--wipe:var(--accent)] hover:text-on-accent',
};

/** Pill button: fill wipes up on hover, icon nudges, magnetic on mouse. */
export function Button({to, href, variant = 'primary', icon: Icon = ArrowUpRight, children, className = '', ...rest}) {
  const ref = useRef(null);
  const onMove = (e) => {
    if (!matchMedia('(pointer: fine)').matches) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.25}px)`;
  };
  const onLeave = () => (ref.current.style.transform = '');
  const cls = `group relative inline-flex items-center gap-2 overflow-hidden rounded-full border px-6 py-3.5 text-[0.95rem] font-medium transition-[color,border-color,transform] duration-500 ease-ui disabled:opacity-50 ${variants[variant]} ${className}`;
  const inner = (
    <>
      <span
        aria-hidden
        className="absolute inset-0 translate-y-full rounded-full bg-(--wipe) transition-transform duration-500 ease-ui group-hover:translate-y-0"
      />
      <span className="relative">{children}</span>
      {Icon && (
        <Icon
          aria-hidden
          className="relative size-4 transition-transform duration-500 ease-ui group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      )}
    </>
  );
  const common = {ref, className: cls, onMouseMove: onMove, onMouseLeave: onLeave, ...rest};
  if (to)
    return (
      <Link to={to} {...common}>
        {inner}
      </Link>
    );
  if (href)
    return (
      <a href={href} {...common}>
        {inner}
      </a>
    );
  return <button {...common}>{inner}</button>;
}

export const Tag = ({children, tone = 'rule'}) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
      tone === 'accent' ? 'border-accent bg-accent text-on-accent' : 'border-rule text-muted'
    }`}
  >
    {children}
  </span>
);

export const StatusTag = ({status}) => (status === 'now' ? <Tag tone="accent">Now</Tag> : <Tag>Expected</Tag>);

/** "Line one / Line two" → masked lines; `hl` gets the highlighter. */
export function Heading({as: As = 'h2', text, hl, className = 'h-section', ...rest}) {
  return (
    <As className={className} {...rest}>
      {lines(text).map((line) => (
        <span className="line" key={line}>
          <span>{hl && line === hl ? <span className="hl">{line}</span> : line}</span>
        </span>
      ))}
    </As>
  );
}

export const Label = ({n, children}) => (
  <p className="eyebrow">
    <span className="text-ink">{String(n).padStart(2, '0')}</span> / {children}
  </p>
);

/** `01 / Label` → big heading (left) → short intro (right). */
export function SectionHeader({n, label, title, intro, hl}) {
  return (
    <div className="grid gap-8 md:grid-cols-12 md:items-end">
      <div className="md:col-span-8">
        <Label n={n}>{label}</Label>
        <Heading text={title} hl={hl} className="h-section mt-6" data-lines />
      </div>
      {intro && (
        <p className="body max-w-sm md:col-span-4 md:justify-self-end" data-reveal>
          {intro}
        </p>
      )}
    </div>
  );
}

export const Section = ({id, inverse, className = '', children}) => (
  <section id={id} className={`py-28 md:py-40 ${inverse ? 'inverse' : ''} ${className}`}>
    <div className="container-x">{children}</div>
  </section>
);

export function Steps({steps}) {
  return (
    <ol
      className="relative grid gap-10 md:grid-cols-(--cols) md:gap-6"
      style={{'--cols': `repeat(${steps.length}, minmax(0, 1fr))`}}
    >
      <span aria-hidden className="absolute top-5 right-0 left-0 hidden h-px bg-rule md:block" />
      {steps.map((s, i) => (
        <li key={s.title} className="relative" data-reveal>
          <span className="num relative inline-flex size-10 items-center justify-center rounded-full border border-rule bg-paper text-base">
            {String(i + 1).padStart(2, '0')}
          </span>
          <h3 className="mt-6 text-2xl">{s.title}</h3>
          <p className="body mt-3 text-base">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function Faq({items}) {
  return (
    <div className="border-t border-rule">
      {items.map((item) => (
        <details key={item.q} className="group border-b border-rule" data-reveal>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-lg font-medium md:text-xl [&::-webkit-details-marker]:hidden">
            {item.q}
            <Plus
              aria-hidden
              className="size-5 shrink-0 transition-transform duration-500 ease-ui group-open:rotate-45"
            />
          </summary>
          <p className="body pb-6">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export const CheckList = ({items}) => (
  <ul className="space-y-3 border-l border-rule pl-5">
    {items.map((t) => (
      <li key={t} className="flex gap-3 text-[0.95rem] text-muted">
        <Check aria-hidden className="mt-1 size-4 shrink-0 text-ink" />
        {t}
      </li>
    ))}
  </ul>
);

export function StatsRow({stats}) {
  return (
    // Flex-wrap, not a fixed grid: any number of stats fills each row with no empty cell.
    <dl className="flex flex-wrap gap-px overflow-hidden rounded-[22px] border border-rule bg-rule">
      {stats.map((s) => (
        <div key={s.label} className="min-w-0 flex-1 basis-52 bg-paper p-6 md:p-8" data-reveal>
          <dt className="eyebrow">{s.label}</dt>
          <dd className="num mt-6 text-[clamp(1.75rem,3vw,2.75rem)]!">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Field({label, error, required, ...input}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-muted"> (required)</span>}
      </span>
      <input
        required={required}
        aria-invalid={Boolean(error)}
        className="mt-2 block w-full rounded-[14px] border border-rule bg-paper px-4 py-3 text-base outline-none transition-colors focus:border-ink focus-visible:outline-2"
        {...input}
      />
      {error && (
        <span role="alert" className="mt-2 block text-sm text-ink">
          ⚠ {error}
        </span>
      )}
    </label>
  );
}
