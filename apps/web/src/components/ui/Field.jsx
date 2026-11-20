// Text input with its label, required marker and inline error.
export function Field({label, error, required, ...input}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-muted"> (required)</span>}
      </span>
      <input
        required={required}
        aria-invalid={Boolean(error)}
        className="mt-2 block w-full rounded-[14px] border border-rule bg-paper px-4 py-3 text-base outline-none transition-colors focus:border-ink focus-visible:outline-2"
        {...input}
      />
      {error && (
        <span role="alert" className="mt-2 block text-sm text-ink">
          ⚠ {error}
        </span>
      )}
    </label>
  );
}
