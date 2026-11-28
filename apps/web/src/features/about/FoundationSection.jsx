// Pirento Foundation as its brand panel (deep blue, yellow, cream): its promise, what it is, a link to its site, its
// four programmes and its registration status. The home shows it as a section; the About page shows it inside the
// family, with the Foundation's picture (used there only).
import {GraduationCap, HeartPulse, Sprout, UtensilsCrossed} from 'lucide-react';
import {PANEL_COLOURS} from '@pirento/shared';
import {Section} from '../../components/ui/Heading';
import {FOUNDATION} from '../../data/group';
import {BrandPanel} from './BrandPanel';

const ICONS = {tree: Sprout, food: UtensilsCrossed, school: GraduationCap, health: HeartPulse};

/** `n`: the section number on the home; `art`: the Foundation's picture (the About page only); `as`: heading level. */
export function FoundationPanel({n, art = false, as = 'h2'}) {
  return (
    <BrandPanel
      colours={PANEL_COLOURS.foundation}
      n={n}
      name={FOUNDATION.name}
      side={[FOUNDATION.status.split('.')[0], FOUNDATION.place]}
      title={['People.', 'Planet.', 'Possibility.']}
      body={FOUNDATION.body}
      link={{href: FOUNDATION.href, label: 'Visit Pirento Foundation'}}
      items={FOUNDATION.programmes.map((p) => ({icon: p.icon, title: p.title, body: p.body}))}
      icons={ICONS}
      note={FOUNDATION.status}
      art={art ? 'leaf' : undefined}
      as={as}
    />
  );
}

export function FoundationSection({n}) {
  return (
    <Section id="foundation">
      <FoundationPanel n={n} />
    </Section>
  );
}
