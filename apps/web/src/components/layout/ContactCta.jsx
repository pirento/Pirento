// The dark "talk to us" block that ends most pages; worded for the current site.
import {useState} from 'react';
import {Check, Copy, Mail} from 'lucide-react';
import {Button} from '../ui/Button';
import {Heading, Label} from '../ui/Heading';
import {brand, home} from '../../data/site';
import {useProductSite} from '../../lib/site';

export function ContactCta({n}) {
  const product = useProductSite();
  const [copied, setCopied] = useState(false);
  const copy = () =>
    navigator.clipboard.writeText(brand.email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  return (
    <section id="contact" className="inverse py-28 md:py-40">
      <div className="container-x">
        <Label n={n}>{home.contact.label}</Label>
        <Heading
          text={product ? `Questions about / ${product.short}? Ask us.` : home.contact.title}
          className="h-cta mt-8"
          data-lines
        />
        <div className="mt-12 flex flex-wrap gap-3" data-reveal>
          <Button to={product ? `/${product.slug}/dashboard` : '/legal/services'} variant="inverse">
            {product ? `Open ${product.short} dashboard` : 'Browse legal services'}
          </Button>
          <Button href={`mailto:${brand.email}?subject=Enquiry from pirento.com`} variant="outline" icon={Mail}>
            Email us
          </Button>
        </div>
        <div className="mt-20 flex flex-wrap items-end gap-4 border-t border-rule pt-10" data-reveal>
          <a
            href={`mailto:${brand.email}`}
            className="display text-[clamp(1.75rem,5vw,4rem)] underline decoration-1 underline-offset-[0.2em] hover:decoration-accent"
          >
            {brand.email}
          </a>
          <button
            onClick={copy}
            className="mb-2 inline-flex items-center gap-2 rounded-full border border-rule px-3 py-1 text-xs text-muted hover:border-ink hover:text-ink"
          >
            {copied ? <Check aria-hidden className="size-3.5" /> : <Copy aria-hidden className="size-3.5" />}
            <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <p className="body mt-6">
          Support:{' '}
          <a className="text-ink underline underline-offset-4" href={`mailto:${brand.supportEmail}`}>
            {brand.supportEmail}
          </a>
        </p>
      </div>
    </section>
  );
}
