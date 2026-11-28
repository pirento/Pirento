// The group's two tools on the Pirento home, each as a brand panel in its own colours: Pirento Blank (the trading app,
// on pirento.in, not live yet) and Pirento INV (the group's billing and accounts app). Words from TOOL_PANELS.
import {
  BarChart3,
  BookOpen,
  Calculator,
  ClipboardCheck,
  FileText,
  Landmark,
  LayoutGrid,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
  Receipt,
} from 'lucide-react';
import {PANEL_COLOURS} from '@pirento/shared';
import {Section} from '../../components/ui/Heading';
import {TOOL_PANELS} from '../../data/group';
import {BrandPanel} from './BrandPanel';

const ICONS = {
  book: BookOpen,
  calculator: Calculator,
  review: ClipboardCheck,
  shield: ShieldCheck,
  broker: Landmark,
  chart: BarChart3,
  ai: Sparkles,
  tools: Wrench,
  invoice: Receipt,
  pdf: FileText,
  mail: Mail,
  team: Users,
  lock: LockKeyhole,
  more: LayoutGrid,
};

export function ToolSection({tool, n}) {
  const t = TOOL_PANELS.find((p) => p.key === tool);
  return (
    <Section id={t.key} className="pt-0! md:pt-0!">
      <BrandPanel
        colours={PANEL_COLOURS[t.key]}
        n={n}
        name={t.name}
        side={t.side}
        title={t.title}
        body={t.body}
        status={t.status}
        items={t.items}
        icons={ICONS}
        note={t.note}
      />
    </Section>
  );
}
