// Product home hero in the product's own layout (see designs.js), with its working widget.
import {Button} from '../../components/ui/Button';
import {Heading} from '../../components/ui/Heading';
import {StatusTag} from '../../components/ui/Tag';
import {useSession} from '../../lib/api/session';

// "A, b." → two heading lines; the last line gets the highlighter.
const titleLines = (quote) => quote.replace(/([,;]) /, '$1 / ');

export function Hero({product, design}) {
  const {user} = useSession();
  const {hero, Widget} = design;
  // The widget takes the id of the section it stands in for, so in-page links still land on it.
  const covers = design.covers === 'how' ? 'how' : design.covers ? 'services' : undefined;
  const dashboard = `/${product.slug}/dashboard`;
  const title = titleLines(product.quote);
  const hl = title.includes(' / ') ? title.split(' / ').at(-1) : undefined;
  const actions = (
    <div className={`mt-10 flex flex-wrap gap-3 ${hero === 'center' ? 'justify-center' : ''}`} data-hero-fade>
      <Button to={user ? dashboard : `/login?next=${encodeURIComponent(dashboard)}`} variant="accent">
        {user ? 'Open dashboard' : `Sign in to ${product.short}`}
      </Button>
      <Button to={`#${product.services ? 'services' : 'how'}`} variant="outline">
        {product.services ? 'See prices' : 'How it works'}
      </Button>
    </div>
  );
  const meta = (
    <p
      className={`eyebrow flex flex-wrap items-center gap-3 ${hero === 'center' ? 'justify-center' : ''}`}
      data-hero-fade
    >
      {product.name} <StatusTag status={product.status} />
    </p>
  );
  const widget = <Widget product={product} />;
  const shell = (children, extra = '') => (
    <section className={`hero relative overflow-hidden pt-36 pb-20 md:pt-44 md:pb-28 ${extra}`}>
      <div aria-hidden className="grid-bg absolute inset-0" />
      <div className="container-x relative">{children}</div>
    </section>
  );

  if (hero === 'center') {
    return shell(
      <>
        <div className="flex flex-col items-center text-center">
          {meta}
          <Heading as="h1" text={title} hl={hl} className="h-hero mt-6 max-w-5xl" />
          <p className="body mx-auto mt-8" data-hero-fade>
            {product.overview}
          </p>
          {actions}
        </div>
        <div id={covers} className="mt-20 scroll-mt-24" data-hero-visual>
          {widget}
        </div>
      </>,
    );
  }

  if (hero === 'editorial') {
    // Type first, at full width; the widget gets its own band so the heading can breathe.
    return (
      <>
        {shell(
          <>
            {meta}
            <Heading as="h1" text={title} hl={hl} className="h-hero mt-8 max-w-[14ch] text-[clamp(3rem,9vw,8.5rem)]!" />
            <div className="mt-14 grid gap-8 border-t border-rule pt-10 md:grid-cols-12">
              <p className="body md:col-span-6" data-hero-fade>
                {product.overview}
              </p>
              <div className="md:col-span-6 md:justify-self-end">{actions}</div>
            </div>
          </>,
          'pb-12! md:pb-16!',
        )}
        <section id={covers} className="scroll-mt-24 pb-20 md:pb-28">
          <div className="container-x grid gap-10 lg:grid-cols-12 lg:items-start">
            <p className="eyebrow lg:col-span-4" data-reveal>
              {product.short} · at a glance
            </p>
            <div className="lg:col-span-8" data-reveal>
              {widget}
            </div>
          </div>
        </section>
      </>
    );
  }

  const reverse = hero === 'split-reverse';
  return shell(
    <div className="grid gap-14 lg:grid-cols-12 lg:items-center">
      <div className={`lg:col-span-7 ${reverse ? 'lg:order-2' : ''}`}>
        {meta}
        <Heading as="h1" text={title} hl={hl} className="h-hero mt-6" />
        <p className="body mt-8" data-hero-fade>
          {product.overview}
        </p>
        {actions}
      </div>
      <div id={covers} className={`scroll-mt-24 lg:col-span-5 ${reverse ? 'lg:order-1' : ''}`} data-hero-visual>
        {widget}
      </div>
    </div>,
  );
}
