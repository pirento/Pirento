// One service: what it is, its price, and the button to start.
import {useRef} from 'react';
import {useParams} from 'react-router-dom';
import {Clock, Mail} from 'lucide-react';
import {PageHero} from '../../components/PageHero';
import {ContactCta} from '../../components/layout/ContactCta';
import {CheckList} from '../../components/ui/Blocks';
import {Button} from '../../components/ui/Button';
import {Section} from '../../components/ui/Heading';
import {Tag} from '../../components/ui/Tag';
import {NotFound} from '../ecosystem/NotFoundPage';
import {inr} from '../../lib/format';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {useService} from '../../lib/prices';

export function Service() {
  const {slug} = useParams();
  const service = useService(slug);
  const ref = useRef(null);
  usePageMotion(ref, [slug]);
  usePageMeta({
    title: `${service?.name ?? 'Not found'} — Pirento`,
    description: service && `${service.name} by Pirento.`,
  });
  if (!service) return <NotFound />;

  const consult = service.model === 'consult';

  return (
    <div ref={ref} key={slug}>
      <PageHero label={service.category} title={service.name} intro={service.description} />
      <Section className="pt-0! md:pt-0!">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-7" data-reveal>
            <p className="body">
              {consult ? (
                <>
                  The cost of this work depends on your matter. <strong>You book a paid consultation first</strong>, and
                  we quote the full fee after it.
                </>
              ) : (
                <>
                  <strong>This is a fixed-price service.</strong>{' '}
                  {service.unit
                    ? `The price is per ${service.unit}; you choose how many at checkout.`
                    : 'The price below covers the whole job.'}
                </>
              )}
            </p>
            <div className="mt-8">
              <CheckList
                items={
                  service.items
                    ? service.items.map((i) => `In the box: ${i}`)
                    : service.includes?.length
                      ? service.includes
                      : [
                          'Our team reviews your details before starting',
                          'Every update is recorded in your account',
                          'Support by email at any step',
                        ]
                }
              />
            </div>
          </div>
          <aside className="rounded-[22px] border border-accent p-6 md:col-span-5 lg:p-8" data-reveal>
            <Tag tone="accent">{consult ? 'Consultation' : 'Fixed price'}</Tag>
            <p className="num mt-8 text-[clamp(2.5rem,5vw,4rem)]!">
              {service.price ? inr(service.price) : 'On quote'}
              {service.unit && <span className="text-xl text-muted"> / {service.unit}</span>}
            </p>
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
              <Button href="#contact" variant="outline" icon={Mail}>
                {service.price ? 'Ask a question first' : 'Request a quote'}
              </Button>
            </div>
          </aside>
        </div>
      </Section>
      <ContactCta n={1} service={service.slug} />
    </div>
  );
}
