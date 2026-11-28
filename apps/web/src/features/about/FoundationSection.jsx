// Pirento Foundation: the company's social-impact arm, its four programmes and its registration status.
import {Section, SectionHeader} from '../../components/ui/Heading';
import {FOUNDATION} from '../../data/group';

export function FoundationSection({n}) {
  return (
    <Section inverse>
      <SectionHeader n={n} label={FOUNDATION.name} title="People. / Planet. / Possibility." intro={FOUNDATION.body} />
      <ol className="mt-16 grid gap-px overflow-hidden rounded-[22px] border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
        {FOUNDATION.programmes.map((p, i) => (
          <li key={p.title} className="bg-paper p-6 md:p-8" data-reveal>
            <span className="text-sm text-muted tabular-nums">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="mt-6 text-xl">{p.title}</h3>
            <p className="mt-2 leading-relaxed text-muted">{p.body}</p>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-sm text-muted" data-reveal>
        {FOUNDATION.status}
      </p>
    </Section>
  );
}
