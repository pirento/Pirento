// One checkout question: text, chips or a dropdown.
import {Field} from '../../components/ui/Field';

export function Question({q, value, onChange}) {
  if (!q.options) {
    const field = (
      <Field
        label={q.label}
        required={Boolean(q.pattern || q.required)}
        placeholder={q.placeholder}
        inputMode={q.pattern ? 'numeric' : undefined}
        maxLength={q.pattern ? 10 : 500}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
    return q.help ? (
      <div>
        {field}
        <p className="mt-2 text-sm text-muted">{q.help}</p>
      </div>
    ) : (
      field
    );
  }
  if (q.options.length > 6) {
    return (
      <label className="block">
        <span className="text-sm font-medium">
          {q.label} <span className="text-muted">(required)</span>
        </span>
        {q.help && <span className="mt-1 block text-sm text-muted">{q.help}</span>}
        <select
          required
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 block w-full rounded-[14px] border border-rule bg-paper px-4 py-3 text-base focus:border-ink"
        >
          <option value="" disabled>
            Choose one
          </option>
          {q.options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </label>
    );
  }
  return (
    <fieldset>
      <legend className="text-sm font-medium">
        {q.label} <span className="text-muted">(required)</span>
      </legend>
      {q.help && <p className="mt-1 text-sm text-muted">{q.help}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {q.options.map((o) => (
          <label
            key={o}
            className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 ${
              value === o ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'
            }`}
          >
            <input
              type="radio"
              name={q.id}
              value={o}
              checked={value === o}
              onChange={() => onChange(o)}
              className="sr-only"
            />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
