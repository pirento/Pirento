// Editing a list of questions a customer answers: each one a short answer or a choice, in order.
import {ArrowDown, ArrowUp, Plus, Trash2} from 'lucide-react';
import {FIXED_QUESTION_IDS} from '@pirento/shared';
import {Field} from '../../components/ui/Field';
import {TextArea} from '../../components/ui/TextArea';

/** Questions as the server keeps them → rows the form edits (options as one per line). */
export const toRows = (questions) =>
  (questions ?? []).map((q) => ({...q, kind: q.options ? 'choice' : 'text', optionsText: q.options?.join('\n') ?? ''}));

// A readable id from the label ("Proposed company name" → proposedCompanyName); existing questions keep theirs,
// so answers on older orders still match.
const idFrom = (label, taken) => {
  const words = label.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  let base = words
    .map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w))
    .join('')
    .slice(0, 32);
  if (!/^[a-z]/.test(base)) base = `q${base}`;
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}${n}`;
  taken.add(id);
  return id;
};

/** Rows → questions for the server. */
export function toQuestions(rows) {
  const taken = new Set([...FIXED_QUESTION_IDS, ...rows.filter((r) => r.id).map((r) => r.id)]);
  return rows.map((r) => {
    const q = {id: r.id || idFrom(r.label, taken), label: r.label.trim()};
    if (r.help?.trim()) q.help = r.help.trim();
    if (r.kind === 'choice')
      q.options = r.optionsText
        .split('\n')
        .map((o) => o.trim())
        .filter(Boolean);
    else {
      if (r.placeholder?.trim()) q.placeholder = r.placeholder.trim();
      if (r.required) q.required = true;
    }
    return q;
  });
}

const iconButton =
  'flex size-9 items-center justify-center rounded-full border border-rule hover:border-ink disabled:opacity-30';

export function QuestionsEditor({rows, onChange, name}) {
  const set = (i, patch) => onChange(rows.map((r, j) => (j === i ? {...r, ...patch} : r)));
  const move = (i, by) => {
    const next = [...rows];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-4">
      {rows.length === 0 && <p className="text-sm text-muted">No questions yet.</p>}
      {rows.map((r, i) => (
        <fieldset key={i} className="space-y-4 rounded-[18px] border border-rule p-5">
          <div className="flex items-center justify-between gap-3">
            <legend className="eyebrow">
              {name} {i + 1}
            </legend>
            <div className="flex gap-2">
              <button type="button" className={iconButton} disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp aria-hidden className="size-4" />
                <span className="sr-only">Move question {i + 1} up</span>
              </button>
              <button type="button" className={iconButton} disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown aria-hidden className="size-4" />
                <span className="sr-only">Move question {i + 1} down</span>
              </button>
              <button type="button" className={iconButton} onClick={() => onChange(rows.filter((_, j) => j !== i))}>
                <Trash2 aria-hidden className="size-4" />
                <span className="sr-only">Remove question {i + 1}</span>
              </button>
            </div>
          </div>
          <Field
            label="Question"
            required
            maxLength={160}
            value={r.label}
            onChange={(e) => set(i, {label: e.target.value})}
          />
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`Answer type for question ${i + 1}`}>
            {[
              ['text', 'Short answer'],
              ['choice', 'Choice'],
            ].map(([kind, label]) => (
              <button
                key={kind}
                type="button"
                role="radio"
                aria-checked={r.kind === kind}
                onClick={() => set(i, {kind})}
                className={`rounded-full border px-4 py-1.5 text-sm ${r.kind === kind ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {r.kind === 'choice' ? (
            <TextArea
              label="Options, one per line (a choice always needs an answer)"
              rows={4}
              maxLength={2000}
              value={r.optionsText}
              onChange={(e) => set(i, {optionsText: e.target.value})}
            />
          ) : (
            <>
              <Field
                label="Example answer shown in the box (optional)"
                maxLength={120}
                value={r.placeholder ?? ''}
                onChange={(e) => set(i, {placeholder: e.target.value})}
              />
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={Boolean(r.required)}
                  onChange={(e) => set(i, {required: e.target.checked})}
                />
                The customer must answer this
              </label>
            </>
          )}
          <Field
            label="Hint under the question (optional)"
            maxLength={240}
            value={r.help ?? ''}
            onChange={(e) => set(i, {help: e.target.value})}
          />
        </fieldset>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rows, {label: '', kind: 'text', optionsText: ''}])}
        className="inline-flex items-center gap-2 rounded-full border border-rule px-4 py-2 text-sm hover:border-ink"
      >
        <Plus aria-hidden className="size-4" /> Add a question
      </button>
    </div>
  );
}
