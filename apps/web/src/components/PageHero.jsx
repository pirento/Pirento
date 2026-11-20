// The standard page top: eyebrow, big heading, intro, optional actions.
import {Heading} from './ui/Heading';

export function PageHero({label, title, hl, intro, children}) {
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

/** Alternating feature row: illustration + meta, title, text, highlights, link. */
