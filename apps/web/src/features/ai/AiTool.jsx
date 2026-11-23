// One AI tool as a small form (from data/aiTools.js), and its answer shown plainly, whatever its shape: text as
// paragraphs, lists as lists, picked services as links, code as code. AiToolBox lists a product's tools.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Check, Copy, Sparkles} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {TextArea} from '../../components/ui/TextArea';
import {AI_TOOLS, AI_TOOLS_FOR} from '../../data/aiTools';
import {api} from '../../lib/api/client';
import {inr} from '../../lib/format';
import {selectCls} from '../learning/Pipeline';

const MAX_FILE = 5 * 1024 * 1024;
const human = (key) => key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

const readFile = (f) =>
  new Promise((resolve, reject) => {
    if (f.size > MAX_FILE) return reject(new Error('Attach a file up to 5 MB'));
    const r = new FileReader();
    r.onload = () => resolve({name: f.name, type: f.type, data: String(r.result).split(',')[1]});
    r.onerror = () => reject(new Error('Could not read that file'));
    r.readAsDataURL(f);
  });

function CopyButton({text}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard?.writeText(text).then(
          () => setDone(true),
          () => {},
        )
      }
      className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
    >
      {done ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}

/** Any answer the AI tools give, shown without knowing its shape in advance. */
export function AiResult({value, depth = 0}) {
  if (value == null || value === '' || value === -1) return null;
  if (typeof value === 'string') return <p className="whitespace-pre-wrap">{value}</p>;
  if (typeof value === 'number' || typeof value === 'boolean') return <p>{String(value)}</p>;
  if (Array.isArray(value)) {
    if (!value.length) return null;
    if (value.every((v) => typeof v === 'string')) {
      return (
        <ul className="list-disc space-y-1 pl-5">
          {value.map((v, i) => (
            <li key={i} className="whitespace-pre-wrap">
              {v}
            </li>
          ))}
        </ul>
      );
    }
    return (
      <ul className="space-y-3">
        {value.map((v, i) =>
          v?.link ? (
            <li key={i}>
              <Link to={v.link} className="block rounded-[14px] border border-rule p-4 hover:border-ink">
                <span className="block font-medium">{v.name}</span>
                {v.rupees && <span className="text-sm text-muted">from {inr(v.rupees)}</span>}
                {v.why && <span className="mt-1 block text-sm">{v.why}</span>}
              </Link>
            </li>
          ) : (
            <li key={i} className="rounded-[14px] border border-rule p-4">
              <AiResult value={v} depth={depth + 1} />
            </li>
          ),
        )}
      </ul>
    );
  }
  return (
    <dl className="space-y-3">
      {Object.entries(value).map(([k, v]) =>
        v == null || v === '' || v === -1 || (Array.isArray(v) && !v.length) ? null : (
          <div key={k}>
            <dt className={depth ? 'text-xs text-muted' : 'eyebrow'}>{human(k)}</dt>
            <dd className="mt-1">
              {k === 'code' ? (
                <pre className="overflow-x-auto rounded-[12px] border border-rule bg-stone p-4 text-xs">{v}</pre>
              ) : typeof v === 'number' && /rupees|amount|emi|paid|interest/i.test(k) ? (
                inr(v)
              ) : (
                <AiResult value={v} depth={depth + 1} />
              )}
            </dd>
          </div>
        ),
      )}
    </dl>
  );
}

const asText = (v) =>
  typeof v === 'string'
    ? v
    : Array.isArray(v)
      ? v.map(asText).join('\n')
      : v && typeof v === 'object'
        ? Object.values(v).map(asText).join('\n\n')
        : '';

/** A tool from AI_TOOLS by id; `fixed` values go with every request (a product, a lesson, a step). */
export function AiTool({id, fixed = {}}) {
  const tool = AI_TOOLS[id];
  const [values, setValues] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setValues((x) => ({...x, [k]: v}));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const body = {...fixed};
      for (const [name, , type] of tool.fields) {
        const v = values[name];
        if (type === 'file') body[name] = v ? await readFile(v) : undefined;
        else if (type === 'number') body[name] = v === '' || v == null ? undefined : Number(v);
        else if (type === 'multi') body[name] = v ?? [];
        else if (v != null && v !== '') body[name] = v;
      }
      setResult(await api(`/ai/assist/${tool.kind ?? id}`, {method: 'POST', body}));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{tool.intro}</p>
      <form onSubmit={submit} className="space-y-3">
        {tool.fields.map(([name, label, type, options]) =>
          type === 'area' ? (
            <TextArea
              key={name}
              label={label}
              required={false}
              rows={3}
              value={values[name] ?? ''}
              onChange={(e) => set(name, e.target.value)}
            />
          ) : type === 'select' ? (
            <label key={name} className="grid gap-1 text-sm">
              {label}
              <select
                value={values[name] ?? options[0]}
                onChange={(e) => set(name, e.target.value)}
                className={selectCls}
              >
                {options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          ) : type === 'multi' ? (
            <fieldset key={name} className="space-y-2 text-sm">
              <legend className="font-medium">{label}</legend>
              {options.map((o) => (
                <label key={o} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={(values[name] ?? []).includes(o)}
                    onChange={(e) =>
                      set(
                        name,
                        e.target.checked ? [...(values[name] ?? []), o] : (values[name] ?? []).filter((x) => x !== o),
                      )
                    }
                  />
                  {o}
                </label>
              ))}
            </fieldset>
          ) : type === 'file' ? (
            <label key={name} className="grid gap-1 text-sm">
              <span className="font-medium">{label}</span>
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => set(name, e.target.files?.[0] ?? null)}
                className="text-sm"
              />
            </label>
          ) : (
            <Field
              key={name}
              label={label}
              type={type === 'number' ? 'number' : 'text'}
              value={values[name] ?? ''}
              onChange={(e) => set(name, e.target.value)}
            />
          ),
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="outline" icon={Sparkles} disabled={busy}>
            {busy ? 'Thinking…' : 'Ask Pirento AI'}
          </Button>
          {error && (
            <p role="alert" className="text-sm">
              ⚠ {error}
            </p>
          )}
        </div>
      </form>
      {result && (
        <div className="space-y-3 rounded-[18px] border border-rule p-5" aria-live="polite">
          <AiResult value={result} />
          <div className="flex justify-between gap-3 border-t border-rule pt-3">
            <span className="text-xs text-muted">Written by AI. Check before you rely on it.</span>
            <CopyButton text={asText(result)} />
          </div>
        </div>
      )}
    </div>
  );
}

/** A product's AI tools, each opening on click. */
export function AiToolBox({product}) {
  const tools = AI_TOOLS_FOR[product] ?? [];
  if (!tools.length) return null;
  return (
    <div className="space-y-3">
      {tools.map(([id, fixed]) => (
        <details key={id} className="rounded-[18px] border border-rule px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center gap-3 font-medium [&::-webkit-details-marker]:hidden">
            <Sparkles aria-hidden className="size-4 shrink-0" />
            {AI_TOOLS[id].title}
          </summary>
          <div className="mt-4">
            <AiTool id={id} fixed={fixed} />
          </div>
        </details>
      ))}
    </div>
  );
}
