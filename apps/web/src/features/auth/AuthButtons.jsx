// The sign-in pages' own buttons: squarer and full width, so a form reads as one column of actions.
//   primary: the main action, in this site's dark (Send code, Sign in, Verify)
//   create:  "Create an account", in this site's accent
//   outline / soft: the paired secondary choices (Use password · Google)
import {Link} from 'react-router-dom';
import {ArrowRight} from 'lucide-react';

const BASE =
  'inline-flex w-full items-center justify-center gap-2 rounded-[8px] text-[0.95rem] font-medium transition-[background-color,border-color,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50';

const VARIANTS = {
  primary: 'h-[50px] bg-inverse text-on-inverse hover:opacity-90',
  create: 'h-[50px] bg-accent text-on-accent hover:opacity-90',
  outline: 'h-11 border border-rule bg-paper text-ink hover:border-ink',
  soft: 'h-11 border border-rule bg-stone text-ink hover:border-ink',
};

export const authButton = (variant = 'primary', extra = '') => `${BASE} ${VARIANTS[variant]} ${extra}`;

/** A button; `arrow` adds the → the primary actions carry. */
export function AuthButton({variant = 'primary', arrow = false, className = '', children, ...rest}) {
  return (
    <button className={authButton(variant, className)} {...rest}>
      {children}
      {arrow && <ArrowRight aria-hidden className="size-4" />}
    </button>
  );
}

export function AuthLink({variant = 'create', arrow = true, className = '', children, ...rest}) {
  return (
    <Link className={authButton(variant, className)} {...rest}>
      {children}
      {arrow && <ArrowRight aria-hidden className="size-4" />}
    </Link>
  );
}

/** "or", between the main action and the other ways in. */
export const OrDivider = ({label = 'or'}) => (
  <p className="my-6 flex items-center gap-4 text-xs text-muted">
    <span className="h-px flex-1 bg-rule" /> {label} <span className="h-px flex-1 bg-rule" />
  </p>
);
