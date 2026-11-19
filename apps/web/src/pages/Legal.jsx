import {useMemo, useRef, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {Clock, Mail, Search} from 'lucide-react';
import {LEGAL_CATALOGUE, getService, servicesFor} from '@pirento/shared';
import {brand} from '../data/site';
import {inr} from '../lib/api';
import {usePageMotion} from '../lib/motion';
import {usePageMeta} from '../lib/page';
import {ContactCta} from '../components/Footer';
import {Button, CheckList, Label, Section, Tag} from '../components/ui';
import {PageHero} from './Products';
import {NotFound} from './NotFound';

const legal = servicesFor('legal');

export function Legal() {
  const ref = useRef(null);
  const [q, setQ] = useState('');
  usePageMotion(ref);
  usePageMeta({
    title: 'Pirento Legal — services and prices',
    description: 'Company registration, licences, GST, ITR, trademark and legal consultations with prices up front.',
  });

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return LEGAL_CATALOGUE.map((c) => ({
      title: c.title,
      items: legal.filter((s) => s.category === c.title && (!needle || s.name.toLowerCase().includes(needle))),
    })).filter((g) => g.items.length);
  }, [q]);

  return (
    <div ref={ref}>
      <PageHero
        label="Pirento Legal"
        title="Legal work, / priced up front."
        hl="priced up front."
        intro={`${legal.length} services across ${LEGAL_CATALOGUE.length} categories. Fixed price where the work is fixed; a paid consultation where it depends on your matter.`}
      >
        <label
          className="mt-10 flex max-w-xl items-center gap-3 rounded-full border border-rule bg-paper px-5 py-3.5 focus-within:border-ink"
          data-hero-fade
        >
          <Search aria-hidden className="size-4 text-muted" />
          <span className="sr-only">Search legal services</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search, for example GST or trademark"
            className="w-full bg-transparent outline-none placeholder:text-muted"
          />
        </label>
      </PageHero>

      <div className="container-x pb-28">
        {groups.length === 0 && <p className="body py-16">No service matches “{q}”. Try a shorter word.</p>}
        {groups.map((g, i) => (
          <section
            key={g.title}
            className="grid gap-8 border-t border-rule py-12 md:grid-cols-12"
            aria-labelledby={`cat-${i}`}
          >
            <div className="md:col-span-4">
              <Label n={i + 1}>{g.items.length} services</Label>
              <h2 id={`cat-${i}`} className="mt-4 text-3xl">
                {g.title}
              </h2>
            </div>
            <ul className="grid gap-x-8 sm:grid-cols-2 md:col-span-8">
              {g.items.map((s) => (
                <li key={s.slug}>
                  <Link
                    to={`/services/${s.slug}`}
                    className="group flex items-baseline justify-between gap-4 border-b border-rule py-4 hover:border-ink"
                  >
                    <span className="font-medium">{s.name}</span>
                    <span className="shrink-0 text-sm text-muted tabular-nums group-hover:text-ink">
                      {s.price ? (s.model === 'consult' ? `from ${inr(s.price)}` : inr(s.price)) : 'Quote'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <ContactCta n={groups.length + 1} />
    </div>
  );
}

export function Service() {
  const {slug} = useParams();
  const service = getService(slug);
  const ref = useRef(null);
  usePageMotion(ref, [slug]);
  usePageMeta({
    title: `${service?.name ?? 'Not found'} — Pirento`,
    description: service && `${service.name} by Pirento.`,
  });
  if (!service) return <NotFound />;

  const consult = service.model === 'consult';
  const mail = `mailto:${brand.email}?subject=${encodeURIComponent(`Request: ${service.name}`)}&body=${encodeURIComponent(
    `Hello Pirento,\n\nI would like to start "${service.name}" (${slug}).\n\nName:\nPhone:\nDetails:\n`,
  )}`;

  return (
    <div ref={ref} key={slug}>
      <PageHero label={service.category} title={service.name} />
      <Section className="pt-0! md:pt-0!">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7" data-reveal>
            <p className="body">
              {consult ? (
                <>
                  The cost of this work depends on your matter. <strong>You book a paid consultation first</strong>, and
                  we quote the full fee after it.
                </>
              ) : (
                <>
                  <strong>This is a fixed-price service.</strong> The price below covers the whole job.
                </>
              )}
            </p>
            <div className="mt-8">
              <CheckList
                items={[
                  'Our team reviews your details before starting',
                  'Every update is recorded in your account',
                  'Support by email at any step',
                ]}
              />
            </div>
          </div>
          <aside className="rounded-[22px] border border-accent p-8 lg:col-span-5" data-reveal>
            <Tag tone="accent">{consult ? 'Consultation' : 'Fixed price'}</Tag>
            <p className="num mt-8 text-[clamp(2.5rem,5vw,4rem)]!">{service.price ? inr(service.price) : 'On quote'}</p>
            {service.deliveryTime && (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                <Clock aria-hidden className="size-4" /> {service.deliveryTime}
              </p>
            )}
            <div className="mt-8 flex flex-col gap-3">
              {service.price ? (
                <Button to={`/checkout/${service.slug}`} variant="accent">
                  Start this service
                </Button>
              ) : null}
              <Button href={mail} variant="outline" icon={Mail}>
                {service.price ? 'Ask a question first' : 'Request a quote'}
              </Button>
            </div>
          </aside>
        </div>
      </Section>
      <ContactCta n={1} />
    </div>
  );
}
