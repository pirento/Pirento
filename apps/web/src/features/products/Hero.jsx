// Product home hero, in one of two layouts.
import {Illustration} from '../../components/Illustration';
import {Button} from '../../components/ui/Button';
import {Heading} from '../../components/ui/Heading';
import {StatusTag} from '../../components/ui/Tag';
import {productIllustration} from '../../data/site';
import {useSession} from '../../lib/api/session';
import {useTilt} from '../../lib/page';

// "A, b." → two heading lines; the last line gets the highlighter.
const titleLines = (quote) => quote.replace(/([,;]) /, '$1 / ');

export function Hero({product, index}) {
  const tilt = useTilt();
  const {user} = useSession();
  const dashboard = `/${product.slug}/dashboard`;
  const title = titleLines(product.quote);
  const hl = title.includes(' / ') ? title.split(' / ').at(-1) : undefined;
  const actions = (
    <div className="mt-10 flex flex-wrap gap-3" data-hero-fade>
      <Button to={user ? dashboard : `/login?next=${encodeURIComponent(dashboard)}`} variant="accent">
        {user ? 'Open dashboard' : `Sign in to ${product.short}`}
      </Button>
      <Button to={`#${product.services ? 'services' : 'how'}`} variant="outline">
        {product.services ? 'See prices' : 'How it works'}
      </Button>
    </div>
  );
  const meta = (
    <p className="eyebrow flex flex-wrap items-center gap-3" data-hero-fade>
      {product.name} <StatusTag status={product.status} />
    </p>
  );
  const art = (
    <div ref={tilt} className="transition-transform duration-300 ease-out">
      <Illustration
        name={productIllustration[product.slug]}
        className="shadow-[0_30px_80px_-40px_rgba(15,38,32,0.4)]"
      />
    </div>
  );

  // Two layouts, alternating across the ten sites, so each one feels like its own place.
  return index % 2 === 0 ? (
    <section className="hero relative overflow-hidden pt-36 pb-20 md:pt-44 md:pb-28">
      <div aria-hidden className="grid-bg absolute inset-0" />
      <div className="container-x relative grid gap-14 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          {meta}
          <Heading as="h1" text={title} hl={hl} className="h-hero mt-6" />
          <p className="body mt-8" data-hero-fade>
            {product.overview}
          </p>
          {actions}
        </div>
        <div className="lg:col-span-5" data-hero-visual>
          {art}
        </div>
      </div>
    </section>
  ) : (
    <section className="hero relative overflow-hidden pt-36 pb-20 text-center md:pt-44 md:pb-28">
      <div aria-hidden className="grid-bg absolute inset-0" />
      <div className="container-x relative flex flex-col items-center">
        {meta}
        <Heading as="h1" text={title} hl={hl} className="h-hero mt-6 max-w-5xl" />
        <p className="body mx-auto mt-8" data-hero-fade>
          {product.overview}
        </p>
        <div className="flex justify-center">{actions}</div>
        <div className="mt-16 w-full max-w-4xl" data-hero-visual>
          {art}
        </div>
      </div>
    </section>
  );
}

/** The part that is different on every site. */
