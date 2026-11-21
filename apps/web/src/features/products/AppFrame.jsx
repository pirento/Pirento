// The frame of an app product's dashboard (Intern, Vault, One, Bharat ID): "<Product> · <Section>", one h1, an
// intro, then the section's numbered blocks. The order-based products have their own (OrdersDashboard).
import {useRef} from 'react';
import {Heading} from '../../components/ui/Heading';
import {productDashboards} from '../../data/site';
import {usePageMotion} from '../../lib/motion';

export function AppFrame({product, section, title, intro, action, ready = true, children}) {
  const ref = useRef(null);
  usePageMotion(ref, [ready, section]);
  const current = productDashboards[product.slug]?.find((s) => s.id === section);
  return (
    <div ref={ref} className="space-y-14 md:space-y-16">
      <header className="flex flex-wrap items-end justify-between gap-8">
        <div className="min-w-0">
          <p className="eyebrow">
            {product.name} · {current?.label ?? 'Dashboard'}
          </p>
          <Heading
            as="h1"
            text={title}
            className="mt-5 text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.02] break-words"
          />
          {intro && <p className="body mt-4 max-w-2xl">{intro}</p>}
        </div>
        {action}
      </header>
      {children}
    </div>
  );
}
