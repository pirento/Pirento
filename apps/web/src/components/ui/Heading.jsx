// Headings and section scaffolding: masked heading lines, numbered labels, sections.
import {useInApp} from '../layout/AppLayout';
import {lines} from '../../lib/motion';

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

export function Section({id, inverse, className = '', children}) {
  // In a dashboard, sections are just spaced blocks: the app shell already sets the width.
  if (useInApp()) {
    return (
      <section id={id} className="pb-10">
        {children}
      </section>
    );
  }
  return (
    <section id={id} className={`py-28 md:py-40 ${inverse ? 'inverse' : ''} ${className}`}>
      <div className="container-x">{children}</div>
    </section>
  );
}
