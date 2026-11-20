// The Pirento Ecosystem home page: hero, the ten products, the Foundation, the ventures and the bodies alongside,
// about us, one-account pillars, how it works, Legal, numbers.
import {useRef} from 'react';
import {Link} from 'react-router-dom';
import {LEGAL_CATALOGUE, PRODUCTS} from '@pirento/shared';
import {ContactCta} from '../../components/layout/ContactCta';
import {Faq, StatsRow, Steps} from '../../components/ui/Blocks';
import {Button} from '../../components/ui/Button';
import {Heading, Section, SectionHeader} from '../../components/ui/Heading';
import {home, stats} from '../../data/site';
import {FoundationSection} from '../about/FoundationSection';
import {AboutTeaser, AlongsideSection, VenturesSection} from '../about/GroupSections';
import {EcosystemPicker} from './EcosystemPicker';
import {Pillars} from './Pillars';
import {ProductGroups} from './ProductGroups';
import {ServiceSearch} from '../products/widgets/ServiceSearch';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';

export function Home() {
  const ref = useRef(null);
  usePageMotion(ref);
  usePageMeta({title: 'Pirento Ecosystem — one account for legal, tax, identity and more'});

  return (
    <div ref={ref}>
      <section className="hero relative overflow-hidden pt-36 pb-20 md:pt-44 md:pb-28">
        <div aria-hidden className="grid-bg absolute inset-0" />
        <div className="container-x relative grid gap-14 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="eyebrow" data-hero-fade>
              Pirento Ecosystem · {PRODUCTS.length} products
            </p>
            <Heading as="h1" text={home.title} hl={home.highlight} className="h-hero mt-6" />
            <p className="body mt-8" data-hero-fade dangerouslySetInnerHTML={{__html: home.intro}} />
            <div className="mt-10 flex flex-wrap gap-3" data-hero-fade>
              <Button to="/legal/services" variant="accent">
                Browse legal services
              </Button>
              <Button to="/products" variant="outline">
                See all products
              </Button>
            </div>
          </div>
          <div className="lg:col-span-5" data-hero-visual>
            <EcosystemPicker />
          </div>
        </div>
        <div aria-hidden className="container-x relative mt-16 hidden items-center gap-3 text-xs text-muted md:flex">
          <span className="relative h-10 w-px overflow-hidden bg-rule">
            <span className="scroll-line absolute inset-0 bg-ink" />
          </span>
          Scroll
        </div>
      </section>

      <ProductGroups copy={home.ecosystem} n={1} />

      <FoundationSection n={2} />

      <VenturesSection n={3} />

      <AlongsideSection n={4} />

      <AboutTeaser n={5} />

      <Pillars copy={home.pillars} n={6} />

      <Section inverse>
        <SectionHeader n={7} label={home.how.label} title={home.how.title} />
        <div className="mt-20">
          <Steps steps={home.how.steps} />
        </div>
      </Section>

      <Section>
        <SectionHeader
          n={8}
          label={home.legal.label}
          title={home.legal.title}
          hl="priced up front."
          intro={home.legal.intro}
        />
        <div className="mt-16 grid gap-10 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7" data-reveal>
            <ServiceSearch flat />
          </div>
          <div className="min-w-0 lg:col-span-5">
            <ul className="grid gap-x-6 border-t border-rule sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {LEGAL_CATALOGUE.map((c, i) => (
                <li key={c.title} data-reveal>
                  <Link
                    to={`/legal/services#cat-${i}`}
                    className="flex items-baseline justify-between gap-4 border-b border-rule py-3.5 hover:text-ink"
                  >
                    <span>{c.title}</span>
                    <span className="text-sm text-muted tabular-nums">{c.services.length}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8" data-reveal>
              <Button to="/legal" variant="outline">
                Visit Pirento Legal
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section className="pt-0! md:pt-0!">
        <SectionHeader n={9} label={home.numbers.label} title={home.numbers.title} />
        <div className="mt-16">
          <StatsRow stats={stats} />
        </div>
      </Section>

      <Section className="pt-0! md:pt-0!">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <SectionHeader n={10} label={home.faq.label} title={home.faq.title} />
          </div>
          <div className="md:col-span-8">
            <Faq items={home.faq.items} />
          </div>
        </div>
      </Section>

      <ContactCta n={11} />
    </div>
  );
}
