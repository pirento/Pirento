// The legal pages: /terms, /privacy and /refunds for Pirento, and /<product>/terms, /privacy and /refunds for
// each product, in that product's colours. A product's pages are the main ones with its own parts added.
import {useRef} from 'react';
import {Link, useParams} from 'react-router-dom';
import {SERVICES, TERMS_VERSION, getProduct} from '@pirento/shared';
import {PageHero} from '../../components/PageHero';
import {Section} from '../../components/ui/Heading';
import {PRODUCT_LEGAL, privacy, refunds} from '../../data/legal';
import {brand, terms} from '../../data/site';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {NotFound} from './NotFoundPage';

const NAMES = {terms: 'Terms and Conditions', privacy: 'Privacy Policy', refunds: 'Refund and Cancellation Policy'};
const TITLES = {
  terms: 'Terms and / Conditions.',
  privacy: 'Privacy / Policy.',
  refunds: 'Refunds and / cancellations.',
};

const takesPayment = (p) => SERVICES.some((s) => s.product === p.slug && s.price);

/** The product's own version of a page: its name, what it is, what it keeps, how its money works. */
function productDoc(page, p) {
  const extra = PRODUCT_LEGAL[p.slug] ?? {keeps: []};
  if (page === 'terms')
    return {
      updated: terms.updated,
      sections: [
        {
          title: 'Agreement to terms',
          body: [
            `These terms cover your use of ${p.name}, a product of the Pirento Ecosystem brand run by ${brand.legalName} ("Pirento", "we", "us" or "our"). They go with the Pirento account you sign in with.`,
          ],
        },
        {
          title: `About ${p.name}`,
          body: [
            p.overview,
            p.caveat,
            p.status === 'now' ? null : `${p.name} is expected, not open yet. Nothing on its pages is an offer.`,
          ].filter(Boolean),
        },
        ...(takesPayment(p)
          ? [
              {
                title: 'Prices and payment',
                body: [
                  'Every price is shown before you order. You pay from your Pirento wallet, or by card or UPI through Razorpay. The refund page for this product explains what happens if an order is cancelled.',
                ],
              },
            ]
          : []),
        ...terms.sections.slice(1),
      ],
    };
  if (page === 'privacy')
    return {
      updated: privacy.updated,
      intro: `How ${p.name} handles your data. Your Pirento account itself (name, email, mobile and sign-in) is handled the same way on every Pirento site.`,
      sections: [
        {title: `What ${p.name} keeps`, list: extra.keeps},
        ...(extra.public ? [{title: 'What anyone can see', body: [extra.public]}] : []),
        // The safety lines about Vault and Bharat ID belong to those products' own "keeps" lists.
        {...privacy.sections[1], list: privacy.sections[1].list.slice(2)},
        ...privacy.sections.slice(2),
      ],
    };
  return takesPayment(p)
    ? {...refunds, intro: `What happens to your money when a ${p.name} order is cancelled.`}
    : {
        updated: refunds.updated,
        intro: `${p.name} takes no payment today.`,
        sections: [
          {
            title: 'Nothing to refund',
            body: [
              `${p.name} does not charge you today, so there is nothing to refund. If it starts taking payments, this page will say how refunds work before you can pay.`,
            ],
          },
          refunds.sections.at(-1),
        ],
      };
}

function LegalPage({page}) {
  const {slug} = useParams();
  const product = slug ? getProduct(slug) : null;
  const ref = useRef(null);
  usePageMotion(ref);
  usePageMeta({title: `${NAMES[page]} — ${product?.name ?? 'Pirento Ecosystem'}`});
  if (slug && !product) return <NotFound />;
  const doc = product ? productDoc(page, product) : {terms, privacy, refunds}[page];
  const version = page === 'terms' ? ` · version ${TERMS_VERSION}` : '';
  return (
    <div ref={ref}>
      <PageHero
        label={product ? `${product.name} · Policies` : 'Legal'}
        title={TITLES[page]}
        intro={[doc.intro, `Last updated ${doc.updated}${version}`].filter(Boolean).join(' ')}
      />
      <Section className="pt-0! md:pt-0!">
        <ol className="max-w-3xl space-y-12">
          {doc.sections.map((s, i) => (
            <li key={s.title} data-reveal>
              <h2 className="text-2xl">
                <span className="mr-3 text-muted tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                {s.title}
              </h2>
              {s.body?.map((p) => (
                <p key={p} className="mt-4 leading-relaxed text-muted">
                  {p}
                </p>
              ))}
              {s.list && (
                <ul className="mt-4 list-disc space-y-2 pl-6 leading-relaxed text-muted">
                  {s.list.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
        {product && (
          <p className="mt-16 max-w-3xl border-t border-rule pt-6 text-sm text-muted">
            These pages are for {product.name}. The Pirento{' '}
            <Link to={`/${page}`} className="text-ink underline underline-offset-4">
              {NAMES[page]}
            </Link>{' '}
            cover the Pirento Ecosystem site.
          </p>
        )}
      </Section>
    </div>
  );
}

export const Terms = () => <LegalPage page="terms" />;
export const Privacy = () => <LegalPage page="privacy" />;
export const Refunds = () => <LegalPage page="refunds" />;
