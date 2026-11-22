// Ctrl/Cmd+K: jump to any product, page or priced service from anywhere in the app shell, plus Intern lessons
// and open roles found on the server (OpenSearch when it is set up).
import {useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {CornerDownLeft, FileText, Search} from 'lucide-react';
import {PRODUCTS, SERVICES} from '@pirento/shared';
import {inr} from '../../lib/format';
import {api} from '../../lib/api/client';
import {ProductIcon} from '../ui/ProductIcon';

const OPEN_EVENT = 'pirento:command-palette';
/** Opens the palette from any button. */
export const openCommandPalette = () => window.dispatchEvent(new Event(OPEN_EVENT));

const PAGES = [
  {label: 'Dashboard', hint: 'Pirento', to: '/dashboard'},
  {label: 'Wallet', hint: 'Add money, withdraw, history', to: '/wallet'},
  {label: 'Account', hint: 'Name, sign out, deletion', to: '/account'},
  {label: 'Support', hint: 'Your requests', to: '/support'},
  {label: 'Verify a code', hint: 'Bharat ID, certificate, order', to: '/verify'},
  {label: 'All legal services', hint: 'Pirento Legal', to: '/legal/services'},
];

const ITEMS = [
  ...PAGES.map((p) => ({...p, kind: 'Page'})),
  ...PRODUCTS.map((p) => ({
    label: p.name,
    hint: p.overview,
    to: `/${p.slug}/dashboard`,
    kind: 'Product',
    product: p,
  })),
  ...SERVICES.filter((s) => s.price).map((s) => ({
    label: s.name,
    hint: `${PRODUCTS.find((p) => p.slug === s.product)?.short} · from ${inr(s.price)}`,
    to: `/services/${s.slug}`,
    kind: 'Service',
    product: PRODUCTS.find((p) => p.slug === s.product),
  })),
];

export function CommandPalette() {
  const ref = useRef(null);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [found, setFound] = useState([]);
  const navigate = useNavigate();

  // Server hits arrive a moment after typing stops; the local list shows at once.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setFound([]);
      return undefined;
    }
    let live = true;
    const t = setTimeout(() => {
      api(`/learning/search?q=${encodeURIComponent(term)}`).then(
        (hits) => {
          if (live) setFound(hits.map((h) => ({label: h.title, hint: 'Pirento Intern', to: h.to, kind: h.kind})));
        },
        () => {
          if (live) setFound([]);
        },
      );
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q]);

  useEffect(() => {
    const open = () => {
      setQ('');
      setActive(0);
      ref.current?.showModal();
    };
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener(OPEN_EVENT, open);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, open);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const results = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const hits = words.length
      ? ITEMS.filter((it) => words.every((w) => `${it.label} ${it.hint} ${it.kind}`.toLowerCase().includes(w)))
      : ITEMS.filter((it) => it.kind !== 'Service');
    return [...hits.slice(0, 8), ...found.filter((f) => !hits.some((h) => h.to === f.to))].slice(0, 12);
  }, [q, found]);

  const go = (item) => {
    ref.current?.close();
    if (item) navigate(item.to);
  };
  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]);
    }
  };

  return (
    <dialog
      ref={ref}
      aria-label="Search Pirento"
      onClick={(e) => e.target === ref.current && go(null)}
      className="m-auto mt-[12vh] w-[min(40rem,calc(100vw-2rem))] rounded-[22px] border border-rule bg-paper p-0 text-ink backdrop:bg-inverse/50"
    >
      <div className="flex items-center gap-3 border-b border-rule px-5">
        <Search aria-hidden className="size-4 text-muted" />
        <input
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search products, pages, services and courses"
          aria-label="Search"
          aria-controls="palette-results"
          aria-activedescendant={results[active] ? `palette-${active}` : undefined}
          className="h-14 min-w-0 flex-1 bg-transparent outline-none focus-visible:outline-none!"
        />
        <kbd className="rounded-md border border-rule px-1.5 text-xs text-muted">Esc</kbd>
      </div>
      <ul id="palette-results" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
        {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">Nothing matches “{q}”.</li>}
        {results.map((it, i) => (
          <li
            key={it.kind + it.to}
            id={`palette-${i}`}
            role="option"
            aria-selected={i === active}
            onMouseEnter={() => setActive(i)}
            onClick={() => go(it)}
            className={`flex cursor-pointer items-center gap-3 rounded-[12px] px-3 py-2.5 ${i === active ? 'bg-stone' : ''}`}
          >
            {it.product ? (
              <ProductIcon product={it.product} className="size-6" />
            ) : (
              <span
                aria-hidden
                className="flex size-6 shrink-0 items-center justify-center rounded-[30%] border border-rule"
              >
                <FileText className="size-3.5 text-muted" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{it.label}</span>
              <span className="block truncate text-xs text-muted">{it.hint}</span>
            </span>
            <span className="shrink-0 text-xs text-muted">{it.kind}</span>
            {i === active && <CornerDownLeft aria-hidden className="size-3.5 shrink-0 text-muted" />}
          </li>
        ))}
      </ul>
    </dialog>
  );
}
