// The Pirento Intern home page's programme section: the four lengths with the prices a superadmin set (read live).
import {Check} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {appDashboards} from '../../data/site';
import {useApi} from '../../lib/api/useApi';
import {inr} from '../../lib/format';

const copy = appDashboards.intern.programme;

export function ProgrammesSection({n}) {
  const programs = useApi('/learning/programs').data ?? [];
  return (
    <Section id="programmes">
      <SectionHeader n={n} label={copy.label} title={copy.title} intro={copy.homeIntro} />
      <ul className="mt-16 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {programs.map((p) => (
          <li key={p.months} className="rounded-[22px] border border-rule p-6" data-reveal>
            <p className="eyebrow">{copy.packageLabel}</p>
            <p className="num mt-6">{p.months}</p>
            <p className="mt-2 text-sm text-muted">{copy.months}</p>
            <p className="mt-4 text-lg">{p.onSale ? (p.price ? inr(p.price / 100) : 'Free') : copy.soon}</p>
          </li>
        ))}
      </ul>
      <ul className="mt-10 grid gap-3 md:grid-cols-2">
        {copy.includes.map((item) => (
          <li key={item} className="flex items-start gap-3" data-reveal>
            <Check aria-hidden className="mt-1 size-4 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button to="/intern/dashboard/programme" variant="outline">
          {copy.see}
        </Button>
        <p className="max-w-2xl text-sm text-muted">{copy.note}</p>
      </div>
    </Section>
  );
}
