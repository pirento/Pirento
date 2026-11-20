// The standard page top: eyebrow, big heading, intro, optional actions.
import {Heading} from './ui/Heading';
import {useInApp} from './layout/AppLayout';

export function PageHero({label, title, hl, intro, children}) {
  // Inside a dashboard the hero shrinks to a working header: same words, less drama.
  if (useInApp()) {
    return (
      <header className="pb-8">
        <p className="eyebrow">{label}</p>
        <h1 className="mt-3 text-[clamp(1.9rem,3.4vw,2.75rem)]">{title.replace(' / ', ' ')}</h1>
        {intro && <p className="body mt-3 text-base">{intro}</p>}
        {children}
      </header>
    );
  }
  return (
    <section className="hero relative overflow-hidden pt-36 pb-16 md:pt-44 md:pb-24">
      <div aria-hidden className="grid-bg absolute inset-0" />
      <div className="container-x relative">
        <p className="eyebrow" data-hero-fade>
          {label}
        </p>
        <Heading as="h1" text={title} hl={hl} className="h-hero mt-6" />
        {intro && (
          <p className="body mt-8" data-hero-fade>
            {intro}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
