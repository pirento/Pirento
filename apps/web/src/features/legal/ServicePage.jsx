// One service as a full page: packages to buy, then what it is, what is included, documents, how it works, benefits
// and questions. Every section comes from the catalogue and admin's edits (servicePage); an empty one is not shown.
import {useRef} from 'react';
import {Link, useParams} from 'react-router-dom';
import {Clock, Mail} from 'lucide-react';
import {packagesOf} from '@pirento/shared';
import {PageHero} from '../../components/PageHero';
import {ContactCta} from '../../components/layout/ContactCta';
import {CheckList, Faq, Steps} from '../../components/ui/Blocks';
import {Button} from '../../components/ui/Button';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {Tag} from '../../components/ui/Tag';
import {NotFound} from '../ecosystem/NotFoundPage';
import {inr} from '../../lib/format';
import {useApi} from '../../lib/api/useApi';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {useService, useServicesFor} from '../../lib/prices';
import {useSession} from '../../lib/api/session';
import {AiTool} from '../ai/AiTool';
import {servicePageCopy as copy} from '../../data/site';

function PackageCards({service}) {
  const packages = packagesOf(service);
  const consult = service.model === 'consult';
  const grid =
    packages.length === 1
      ? 'max-w-xl'
      : packages.length === 2
        ? 'max-w-4xl md:grid-cols-2'
        : packages.length === 3
          ? 'md:grid-cols-2 lg:grid-cols-3'
          : 'md:grid-cols-2 xl:grid-cols-4';
  return (
    <ul className={`grid gap-4 ${grid}`}>
      {packages.map((p) => (
        <li
          key={p.id}
          data-reveal
          className={`flex flex-col rounded-[22px] border p-6 md:p-8 ${p.recommended ? 'border-accent bg-stone' : 'border-rule'}`}
        >
          <div className="flex min-h-7 flex-wrap items-center gap-2">
            <h3 className="eyebrow mr-auto">{p.name}</h3>
            {p.recommended && <Tag tone="accent">{copy.recommended}</Tag>}
          </div>
          <p className="mt-6 flex flex-wrap items-baseline gap-x-3">
            <span className="display text-5xl tabular-nums">{inr(p.price)}</span>
            {p.strike && <s className="text-lg text-muted tabular-nums">{inr(p.strike)}</s>}
          </p>
          {p.deliveryTime && (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted">
              <Clock aria-hidden className="size-4" /> {p.deliveryTime}
            </p>
          )}
          {p.includes?.length > 0 && (
            <div className="mt-8">
              <CheckList items={p.includes} />
            </div>
          )}
          <div className="mt-auto pt-8">
            <Button
              to={`/checkout/${service.slug}?package=${p.id}`}
              variant={p.recommended || packages.length === 1 ? 'accent' : 'outline'}
              className="w-full justify-center"
            >
              {consult ? copy.book : packages.length === 1 ? copy.buyOne : copy.buy(p.name)}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Titled lists side by side (included / not included / documents, and so on); empty ones are left out. */
function ListCards({groups}) {
  const shown = groups.filter(([, items]) => items?.length);
  if (!shown.length) return null;
  return (
    <div className={`mt-16 grid gap-4 md:grid-cols-2 ${shown.length > 2 ? 'lg:grid-cols-3' : ''}`}>
      {shown.map(([title, items]) => (
        <div key={title} className="rounded-[22px] border border-rule p-8" data-reveal>
          <h3 className="text-2xl">{title}</h3>
          <div className="mt-6">
            <CheckList items={items} />
          </div>
        </div>
      ))}
    </div>
  );
}

const any = (...lists) => lists.some((l) => l?.length);

function Pairs({items}) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((b) => (
        <li key={b.title} className="rounded-[22px] border border-rule p-8" data-reveal>
          <h3 className="text-2xl">{b.title}</h3>
          {b.body && <p className="body mt-3 text-base">{b.body}</p>}
        </li>
      ))}
    </ul>
  );
}

export function Service() {
  const {slug} = useParams();
  const service = useService(slug);
  const page = useApi(service ? `/catalog/services/${slug}` : null).data?.page;
  const siblings = useServicesFor(service?.product ?? '');
  const {user} = useSession();
  const ref = useRef(null);
  usePageMotion(ref, [slug, Boolean(page)]);
  usePageMeta({
    title: `${service?.name ?? 'Not found'} — Pirento`,
    description: service && (page?.intro?.split('\n')[0] || `${service.name} by Pirento.`),
  });
  if (!service) return <NotFound />;

  const [lead, ...more] = (page?.intro || service.description || '').split('\n').filter(Boolean);
  const related = siblings.filter((s) => s.category === service.category && s.slug !== slug && s.price).slice(0, 3);
  // Numbers follow the sections actually shown.
  let n = 0;
  const next = () => ++n;

  return (
    <div ref={ref} key={slug}>
      <PageHero label={service.category} title={service.name} intro={lead}>
        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4" data-hero-fade>
          {service.price ? (
            <>
              <p className="text-lg">
                {copy.from} <span className="num text-3xl!">{inr(service.price)}</span>
              </p>
              <Button href="#packages" variant="accent">
                {copy.choose}
              </Button>
            </>
          ) : null}
          <Button href="#contact" variant="outline" icon={Mail}>
            {service.price ? copy.ask : copy.quote}
          </Button>
        </div>
      </PageHero>

      {service.price ? (
        <Section id="packages" className="pt-0! md:pt-0!">
          <SectionHeader
            n={next()}
            label={copy.packages.label}
            title={copy.packages.title}
            intro={copy.packages.intro}
          />
          <div className="mt-16">
            <PackageCards service={service} />
          </div>
        </Section>
      ) : null}

      {page && (more.length > 0 || page.whoFor.length > 0) && (
        <Section>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <SectionHeader n={next()} label={copy.overview.label} title={copy.overview.title} />
              <div className="mt-10 space-y-5">
                {more.map((p) => (
                  <p key={p} className="body" data-reveal>
                    {p}
                  </p>
                ))}
              </div>
            </div>
            {page.whoFor.length > 0 && (
              <div className="lg:col-span-5 lg:pt-24" data-reveal>
                <p className="eyebrow">{copy.whoFor}</p>
                <div className="mt-6">
                  <CheckList items={page.whoFor} />
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {page && any(page.included, page.notIncluded, page.documents) && (
        <Section>
          <SectionHeader n={next()} label={copy.ready.label} title={copy.ready.title} />
          <ListCards
            groups={[
              [copy.ready.included, page.included],
              [copy.ready.notIncluded, page.notIncluded],
              [copy.ready.documents, page.documents],
            ]}
          />
          {user && service.price && (
            <details className="mt-8 max-w-3xl rounded-[18px] border border-rule px-5 py-4" data-reveal>
              <summary className="cursor-pointer font-medium">{copy.ready.ai}</summary>
              <div className="mt-4">
                <AiTool id="checklist" fixed={{serviceSlug: service.slug}} />
              </div>
            </details>
          )}
        </Section>
      )}

      {page?.steps.length > 0 && (
        <Section id="how">
          <SectionHeader n={next()} label={copy.how.label} title={copy.how.title} />
          <div className="mt-16">
            <Steps steps={page.steps} />
          </div>
        </Section>
      )}

      {page && any(page.timeline, page.mistakes) && (
        <Section>
          <SectionHeader n={next()} label={copy.plan.label} title={copy.plan.title} />
          <ListCards
            groups={[
              [copy.plan.timeline, page.timeline],
              [copy.plan.mistakes, page.mistakes],
            ]}
          />
        </Section>
      )}

      {page?.costs.length > 0 && (
        <Section>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionHeader n={next()} label={copy.costs.label} title={copy.costs.title} />
            </div>
            <dl className="border-t border-rule lg:col-span-8">
              {page.costs.map((c) => (
                <div
                  key={c.title}
                  className="grid gap-2 border-b border-rule py-6 sm:grid-cols-[14rem_1fr]"
                  data-reveal
                >
                  <dt className="font-medium">{c.title}</dt>
                  <dd className="body text-base">{c.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Section>
      )}

      {page?.deliverables.length > 0 && (
        <Section>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionHeader n={next()} label={copy.deliverables.label} title={copy.deliverables.title} />
            </div>
            <div className="lg:col-span-7 lg:pt-24" data-reveal>
              <CheckList items={page.deliverables} />
            </div>
          </div>
        </Section>
      )}

      {page?.benefits.length > 0 && (
        <Section>
          <SectionHeader n={next()} label={copy.benefits.label} title={copy.benefits.title} />
          <div className="mt-16">
            <Pairs items={page.benefits} />
          </div>
        </Section>
      )}

      {page?.faqs.length > 0 && (
        <Section id="faq">
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-4">
              <SectionHeader n={next()} label={copy.faq.label} title={copy.faq.title} />
            </div>
            <div className="md:col-span-8">
              <Faq items={page.faqs} />
            </div>
          </div>
        </Section>
      )}

      {related.length > 0 && (
        <Section>
          <SectionHeader n={next()} label={copy.related.label} title={copy.related.title} />
          <ul className="mt-16 grid gap-4 md:grid-cols-3">
            {related.map((s) => (
              <li key={s.slug} data-reveal>
                <Link
                  to={`/services/${s.slug}`}
                  className="group/card block h-full rounded-[22px] border border-rule p-8 transition-colors hover:border-ink"
                >
                  <h3 className="text-2xl">{s.name}</h3>
                  <p className="mt-3 text-muted">
                    {copy.from} {inr(s.price)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <ContactCta n={next()} service={service.slug} />
    </div>
  );
}
