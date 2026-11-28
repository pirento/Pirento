// Vault → Will: the four steps (draft with Pirento AI, sign with two witnesses, register if they choose, keep it
// here), the will's details as a sealed record, and the signed or registered copy as documents labelled "Will",
// each of which the owner may release to their nominee.
import {Label} from '../../components/ui/Heading';
import {vaultCopy} from '../../data/site';
import {AiTool} from '../ai/AiTool';
import {Files} from './FilesPanel';
import {Records} from './RecordsPanel';

const copy = vaultCopy.will;

export function Will() {
  return (
    <div className="space-y-8">
      <ol className="grid gap-4 md:grid-cols-4" data-reveal>
        {copy.steps.map(([title, body], i) => (
          <li key={title} className="rounded-[22px] border border-rule p-6">
            <span className="text-xs text-muted tabular-nums">0{i + 1}</span>
            <p className="mt-3 font-medium">{title}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
          </li>
        ))}
      </ol>
      <div className="rounded-[22px] border border-rule p-6 md:p-8" data-reveal>
        <Label n={1}>{copy.draft}</Label>
        <div className="mt-4">
          <AiTool id="willDraft" />
        </div>
      </div>
      <div>
        <Label n={2}>{copy.details}</Label>
        <div className="mt-4">
          <Records only={['will']} />
        </div>
      </div>
      <Files only="Will" title={copy.files} n={3} />
      <p className="text-xs text-muted">{copy.legal}</p>
    </div>
  );
}
