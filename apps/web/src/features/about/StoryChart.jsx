// About: the company's story as a vertical chart, each step with the people who joined at it.
import {PEOPLE, STORY} from '../../data/group';
import {Avatar} from './Avatar';

export function StoryChart() {
  return (
    <ol className="relative mt-16 ml-4 border-l border-rule pl-8 md:pl-12">
      {STORY.map((step, i) => (
        <li key={step.title} className="relative pb-14 last:pb-0" data-reveal>
          <span
            aria-hidden
            className="absolute top-0 -left-[calc(2rem+1.125rem)] flex size-9 items-center justify-center rounded-full border border-rule bg-paper text-xs tabular-nums md:-left-[calc(3rem+1.125rem)]"
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h3 className="text-[clamp(1.4rem,2.2vw,1.9rem)]">{step.title}</h3>
            {step.tag && <span className="text-sm text-muted tabular-nums">{step.tag}</span>}
          </div>
          <p className="mt-2 max-w-2xl leading-relaxed text-muted">{step.body}</p>
          {step.people && (
            <ul className="mt-5 flex flex-wrap gap-3">
              {step.people.map((key) => (
                <li key={key} className="flex items-center gap-2.5 rounded-full border border-rule py-1.5 pr-4 pl-1.5">
                  <Avatar person={PEOPLE[key]} className="size-8 text-xs" />
                  <span className="text-sm">{PEOPLE[key].name}</span>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}
