// Multi-line input with its label.
export function TextArea({label, required = true, ...props}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">
        {label} {required && <span className="text-muted">(required)</span>}
      </span>
      <textarea
        required={required}
        rows={5}
        maxLength={4000}
        className="mt-2 block w-full rounded-[14px] border border-rule bg-paper px-4 py-3 text-base outline-none focus:border-ink focus-visible:outline-2"
        {...props}
      />
    </label>
  );
}
