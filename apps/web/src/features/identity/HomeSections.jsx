// Bharat ID home page sections: the three ways to apply, and the ways to prove it is you once the ID is issued.
import {AUTH_METHODS} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {Tag} from '../../components/ui/Tag';
import {bharatIdHome as copy} from '../../data/site';

export function WaysSection({n}) {
  return (
    <Section id="apply">
      <SectionHeader n={n} label={copy.ways.label} title={copy.ways.title} intro={copy.ways.intro} />
      <ol className="mt-16 grid gap-4 md:grid-cols-3">
        {copy.ways.items.map((w, i) => (
          <li key={w.title} className="flex flex-col rounded-[22px] border border-rule p-8" data-reveal>
            <span className="num text-base! text-muted">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="mt-6 text-2xl">{w.title}</h3>
            <p className="body mt-3">{w.body}</p>
            {w.cta && (
              <div className="mt-auto pt-8">
                <Button to={w.to} variant="accent">
                  {w.cta}
                </Button>
              </div>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-8 max-w-3xl text-sm text-muted">{copy.ways.reminders}</p>
    </Section>
  );
}

export function AuthSection({n}) {
  return (
    <Section id="checks">
      <SectionHeader n={n} label={copy.auth.label} title={copy.auth.title} intro={copy.auth.intro} />
      <ul className="mt-16 grid gap-3 md:grid-cols-2">
        {AUTH_METHODS.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between gap-4 rounded-[18px] border border-rule p-5"
            data-reveal
          >
            <span>{m.label}</span>
            <span className="flex shrink-0 items-center gap-2 text-sm text-muted">
              Level {m.level}
              {m.expected && <Tag>Expected</Tag>}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
