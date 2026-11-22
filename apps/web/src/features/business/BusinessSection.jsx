// The Bharat ID home page's way into Bharat ID for Business: who uses it, and the link to its own page.
import {Button} from '../../components/ui/Button';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {bharatIdBusiness as copy} from '../../data/site';

export function BusinessSection({n}) {
  return (
    <Section>
      <SectionHeader n={n} label={copy.home.label} title={copy.home.title} intro={copy.home.intro} />
      <div className="mt-16 grid gap-4 md:grid-cols-3">
        {copy.gives.items.slice(0, 3).map((g) => (
          <div key={g.title} className="rounded-[22px] border border-rule bg-stone p-8" data-reveal>
            <h3 className="text-2xl">{g.title}</h3>
            <p className="body mt-3">{g.body}</p>
          </div>
        ))}
      </div>
      <ul className="mt-8 flex flex-wrap gap-2" aria-label={copy.uses.label}>
        {copy.uses.items.map((u) => (
          <li key={u.title} className="rounded-full border border-rule px-4 py-2 text-sm">
            {u.title}
          </li>
        ))}
      </ul>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button to="/bharat-id/business" variant="accent">
          {copy.home.cta}
        </Button>
        <Button to="/bharat-id/business#request" variant="outline">
          {copy.ask}
        </Button>
      </div>
    </Section>
  );
}
