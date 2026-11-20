// The sign-in page frame: the site's own dark panel on the left, the form on the right.
import {Link} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import {Heading} from '../../components/ui/Heading';

export function AuthShell({brand, title, perks, home, homeLabel, children, innerRef}) {
  return (
    <div ref={innerRef} className="grid min-h-dvh lg:grid-cols-2">
      {/* Left: the site's own dark field, so you always know where you are signing in. */}
      <aside className="inverse relative flex flex-col justify-between overflow-hidden p-8 sm:p-12">
        <div aria-hidden className="grid-bg absolute inset-0 opacity-30" />
        <Link
          to={home}
          className="relative flex items-center gap-2.5 font-display font-semibold tracking-[0.04em] uppercase"
        >
          <span aria-hidden className="size-2.5 rounded-[3px] bg-accent" />
          {brand}
        </Link>
        <div className="relative mt-16 lg:mt-0">
          <Heading as="h1" text={title} hl={title.split(' / ')[1]} className="h-section" />
          <ul className="mt-10 space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-3 text-[0.95rem] text-muted">
                <span aria-hidden className="size-1.5 rounded-full bg-accent" /> {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative mt-16 text-xs text-muted">© {new Date().getFullYear()} Pirento Ecosystem Pvt. Ltd.</p>
      </aside>

      {/* Right: the form. */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <Link to={home} className="mb-10 inline-flex items-center gap-2 self-start text-sm text-muted hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" /> Back to {homeLabel}
        </Link>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
