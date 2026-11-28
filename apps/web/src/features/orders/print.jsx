// What every print page shares (shipping labels, invoices): the two paper formats and the picker that remembers the
// choice in this browser, the @page size set for the printer, and the portal that prints only the sheets.
import {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {shippingCopy as copy} from '../../data/site';

export const FORMATS = {
  thermal: {label: copy.formats.thermal, page: '4in 6in', sheet: 'sheet-4x6'},
  a4: {label: copy.formats.a4, page: 'A4', sheet: 'sheet-a4'},
};

const KEY = 'pirento.printFormat';

/** The paper format, remembered in this browser (storage may be blocked; then it is only not remembered). */
export function useFormat() {
  const [format, set] = useState(() => {
    try {
      return localStorage.getItem(KEY) === 'a4' ? 'a4' : 'thermal';
    } catch {
      return 'thermal';
    }
  });
  const choose = (f) => {
    set(f);
    try {
      localStorage.setItem(KEY, f);
    } catch {
      // Not remembered, still used.
    }
  };
  return [format, choose];
}

/** Tells the printer the paper size and hides the app, so only the portal's sheets print. */
export function usePrintPaper(format) {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `@media print { @page { size: ${FORMATS[format].page}; margin: 0 } #root { display: none !important } }`;
    document.head.append(style);
    return () => {
      style.remove();
    };
  }, [format]);
}

/** Runs `fn` after the print dialog closes (to mark things printed). */
export function useAfterPrint(fn, deps) {
  useEffect(() => {
    if (!fn) return undefined;
    window.addEventListener('afterprint', fn);
    return () => {
      window.removeEventListener('afterprint', fn);
    };
  }, deps);
}

const chip = (on) =>
  `rounded-full border px-4 py-2 text-sm ${on ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`;

export function FormatPicker({format, onChange}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={copy.format}>
      <span className="mr-1 text-sm text-muted">{copy.format}</span>
      {Object.entries(FORMATS).map(([f, x]) => (
        <button
          key={f}
          type="button"
          aria-pressed={format === f}
          onClick={() => onChange(f)}
          className={chip(format === f)}
        >
          {x.label}
        </button>
      ))}
    </div>
  );
}

/** One sheet at its real size, pure black on white, on its own printed page. */
export const Sheet = ({format, className = '', children}) => (
  <section
    className={`sheet print-mono ${FORMATS[format].sheet} overflow-hidden bg-paper shadow-[0_0_0_1px_var(--rule)] ${className}`}
  >
    {children}
  </section>
);

/** The sheets twice: at real size on screen, and in a portal outside the app for the printer. */
export function PrintArea({children}) {
  return (
    <>
      <div className="flex flex-wrap gap-6 overflow-x-auto pb-4">{children}</div>
      {createPortal(<div className="hidden print:block">{children}</div>, document.body)}
    </>
  );
}
