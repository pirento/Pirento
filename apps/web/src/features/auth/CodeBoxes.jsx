// Six boxes for a 6-digit code: typing moves on, backspace moves back, pasting fills them all.
import {useRef} from 'react';

export function CodeBoxes({value, onChange, onComplete, error, disabled}) {
  const boxes = useRef([]);
  const digits = Array.from({length: 6}, (_, i) => value[i] ?? '');

  const set = (next) => {
    const clean = next.replace(/\D/g, '').slice(0, 6);
    onChange(clean);
    if (clean.length === 6) onComplete?.(clean);
    return clean;
  };
  const focus = (i) => boxes.current[Math.max(0, Math.min(5, i))]?.focus();

  const onInput = (i, raw) => {
    const typed = raw.replace(/\D/g, '');
    if (!typed) return;
    // A paste or an SMS/autofill suggestion can bring several digits at once.
    const clean = set(value.slice(0, i) + typed + value.slice(i + typed.length));
    focus(Math.min(i + typed.length, clean.length));
  };
  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[i]) set(value.slice(0, i) + value.slice(i + 1));
      else if (i > 0) {
        set(value.slice(0, i - 1) + value.slice(i));
        focus(i - 1);
      }
    } else if (e.key === 'ArrowLeft') focus(i - 1);
    else if (e.key === 'ArrowRight') focus(i + 1);
  };

  return (
    <fieldset>
      <legend className="text-sm font-medium">6-digit code</legend>
      <div className="mt-2 grid grid-cols-6 gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              boxes.current[i] = el;
            }}
            value={d}
            disabled={disabled}
            onChange={(e) => onInput(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`Digit ${i + 1}`}
            aria-invalid={Boolean(error)}
            // Pasting six digits into the first box works too: maxLength stays loose for that.
            maxLength={i === 0 ? 6 : 1}
            className="h-14 w-full min-w-0 rounded-[14px] border border-rule bg-paper text-center text-xl tabular-nums outline-none transition-colors focus:border-ink aria-invalid:border-ink"
          />
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm">
          ⚠ {error}
        </p>
      )}
    </fieldset>
  );
}
