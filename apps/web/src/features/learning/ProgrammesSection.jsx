// The Pirento Intern home page's programme section: the four lengths as pricing cards, with the prices a superadmin
// set (read live), and what every programme includes.
import {Button} from '../../components/ui/Button';
import {CheckList} from '../../components/ui/Blocks';
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
      <ul className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {programs.map((p) => (
          <li key={p.months} className="flex flex-col rounded-[22px] border border-rule p-6 md:p-8" data-reveal>
            <h3 className="eyebrow">{copy.monthsLabel(p.months)}</h3>
            <p className="mt-6 display text-5xl tabular-nums">
              {p.onSale ? p.price ? inr(p.price / 100) : 'Free' : <span className="text-muted">—</span>}
            </p>
            <p className="mt-2 text-sm text-muted">{p.onSale ? copy.packageLabel : copy.soon}</p>
            <div className="mt-auto pt-8">
              <Button to="/intern/dashboard/programme" variant="outline" className="w-full justify-center">
                {copy.see}
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-12 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <CheckList items={copy.includes} />
        </div>
        <p className="text-sm text-muted lg:col-span-5">{copy.note}</p>
      </div>
    </Section>
  );
}
