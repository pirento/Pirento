// The sign-in page frame: a side panel that says whose door this is, and the form, which comes first on phones.
import {Link} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import {PRODUCTS} from '@pirento/shared';

/**
 * `side` = {eyebrow, quote, points: [{title, body}], Icon, showProducts}.
 * The page's one <h1> is in the form column (children), so this panel uses no heading.
 */
export function AuthShell({side, home, homeLabel, children, innerRef}) {
  const {Icon} = side;
  return (
    <div ref={innerRef} className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Desktop: the door's own dark panel, in this site's colours. */}
      <aside className="inverse relative hidden flex-col justify-between overflow-hidden p-12 lg:flex xl:p-16">
        <div aria-hidden className="grid-bg absolute inset-0 opacity-25" />
        <Link
          to={home}
          className="relative flex items-center gap-2.5 text-sm font-semibold tracking-[0.04em] uppercase"
        >
          <span aria-hidden className="size-2.5 rounded-[3px] bg-accent" />
          {side.eyebrow}
        </Link>

        <div className="relative">
          <span className="flex size-14 items-center justify-center rounded-[16px] bg-accent text-on-accent">
            <Icon aria-hidden className="size-6" />
          </span>
          <p className="mt-10 max-w-md font-display text-[clamp(2rem,3vw,2.75rem)] leading-[1.1]">{side.quote}</p>
          <ul className="mt-12 space-y-6 border-l border-inverse-rule pl-6">
            {side.points.map((p) => (
              <li key={p.title}>
                <p className="font-medium">{p.title}</p>
                <p className="mt-1 text-sm text-muted">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          {side.showProducts && (
            <>
              <p className="text-xs text-muted">One Pirento account also opens</p>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                {PRODUCTS.map((p) => (
                  <li key={p.slug} className="flex items-center gap-1.5">
                    <span aria-hidden className="size-2 rounded-[2px]" style={{background: p.color}} />
                    {p.short}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-8 text-xs text-muted">© {new Date().getFullYear()} Pirento Ecosystem Pvt. Ltd.</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Phones: a slim bar instead of the panel, so the form is on the first screen. */}
        <header className="inverse flex items-center justify-between gap-4 px-5 py-4 lg:hidden">
          <Link to={home} className="flex items-center gap-2.5 text-sm font-semibold tracking-[0.04em] uppercase">
            <span className="flex size-8 items-center justify-center rounded-[10px] bg-accent text-on-accent">
              <Icon aria-hidden className="size-4" />
            </span>
            {side.eyebrow}
          </Link>
        </header>

        <div className="flex flex-1 flex-col px-5 py-10 sm:px-12 lg:justify-center lg:py-16 xl:px-24">
          <div className="mx-auto w-full max-w-[26rem]">
            <Link to={home} className="mb-10 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
              <ArrowLeft aria-hidden className="size-4" /> Back to {homeLabel}
            </Link>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
