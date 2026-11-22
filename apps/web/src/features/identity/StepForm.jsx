// A form drawn from a shared field definition: a Bharat ID step by default, or any other (`validate` and `save`).
import {useState} from 'react';
import {ArrowLeft} from 'lucide-react';
import {validateSection} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {api} from '../../lib/api/client';

function Select({f, value, onChange}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">
        {f.label} <span className="text-muted">(required)</span>
      </span>
      <select
        required
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 block w-full rounded-[14px] border border-rule bg-paper px-4 py-3 text-base focus:border-ink"
      >
        <option value="" disabled>
          Choose one
        </option>
        {f.options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

/** One step's fields, driven by the shared definition. */
export function StepForm({
  section,
  initial,
  onSaved,
  onBack,
  validate = (values) => validateSection(section.id, values),
  save = (values) => api(`/identity/draft/${section.id}`, {method: 'PUT', body: values}),
  submitLabel = 'Save and continue',
  children,
}) {
  // Reduced values (XXXX…) cannot be sent back, so those fields start empty and are typed again.
  const [values, setValues] = useState(() =>
    Object.fromEntries(section.fields.map((f) => [f.id, f.store ? '' : (initial?.[f.id] ?? '')])),
  );
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (id) => (v) => setValues((s) => ({...s, [id]: v}));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    const local = validate(values);
    if (local.error) return setError(local);
    setBusy(true);
    try {
      onSaved(await save(values));
    } catch (err) {
      setError({error: err.message});
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {section.intro && <p className="body">{section.intro}</p>}
      <div className="grid gap-6 sm:grid-cols-2">
        {section.fields.map((f) =>
          f.options && f.options.length > 6 ? (
            <Select key={f.id} f={f} value={values[f.id]} onChange={set(f.id)} />
          ) : f.options ? (
            <fieldset key={f.id} className="sm:col-span-2">
              <legend className="text-sm font-medium">
                {f.label} <span className="text-muted">(required)</span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {f.options.map((o) => (
                  <label
                    key={o}
                    className={`cursor-pointer rounded-full border px-4 py-2 text-sm has-focus-visible:outline-2 has-focus-visible:outline-offset-2 ${
                      values[f.id] === o ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'
                    }`}
                  >
                    <input
                      type="radio"
                      name={f.id}
                      className="sr-only"
                      checked={values[f.id] === o}
                      onChange={() => set(f.id)(o)}
                    />
                    {o}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <div key={f.id} className={f.id === 'line' || f.wide ? 'sm:col-span-2' : ''}>
              <Field
                label={f.label + (f.optional ? ' (optional)' : '')}
                required={!f.optional}
                type={f.type ?? 'text'}
                inputMode={f.inputMode}
                autoComplete={f.autoComplete ?? 'off'}
                placeholder={f.store && initial?.[f.id] ? `Saved as ${initial[f.id]}. Type it again.` : f.placeholder}
                maxLength={f.maxLength}
                value={values[f.id]}
                onChange={(e) => set(f.id)(f.upper ? e.target.value.toUpperCase() : e.target.value)}
                error={error?.field === f.id ? error.error : undefined}
              />
            </div>
          ),
        )}
      </div>
      {section.id === 'nominee' && (
        <button
          type="button"
          onClick={() => setValues((s) => ({...s, emergencyName: s.nomineeName, emergencyMobile: s.nomineeMobile}))}
          className="text-sm underline underline-offset-4"
        >
          Emergency contact is the same as my nominee
        </button>
      )}
      {children}
      {error && !error.field && (
        <p role="alert" className="text-sm">
          ⚠ {error.error}
        </p>
      )}
      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" variant="accent" disabled={busy}>
          {busy ? 'Saving' : submitLabel}
        </Button>
        {onBack && (
          <Button type="button" variant="outline" icon={ArrowLeft} onClick={onBack}>
            Back
          </Button>
        )}
      </div>
    </form>
  );
}

/** Every saved step as a read-only list; staff see the same view. */
