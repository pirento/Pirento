// The one button: pill shape, fill wipe on hover, magnetic on mouse. Its hover group is named (group/btn) so a
// hovered parent that is itself a `group` (an open order row, a card) does not fill every button inside it.
import {useRef} from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';

const variants = {
  primary: 'bg-ink text-paper border-ink [--wipe:var(--accent)] hover:text-on-accent',
  outline: 'border-rule text-ink [--wipe:var(--ink)] hover:text-paper hover:border-ink',
  accent: 'bg-accent text-on-accent border-accent [--wipe:var(--ink)] hover:text-paper',
  inverse: 'bg-on-inverse text-inverse border-on-inverse [--wipe:var(--accent)] hover:text-on-accent',
};

/** Pill button: fill wipes up on hover, icon nudges, magnetic on mouse. */
export function Button({to, href, variant = 'primary', icon: Icon = ArrowUpRight, children, className = '', ...rest}) {
  const ref = useRef(null);
  const onMove = (e) => {
    if (!matchMedia('(pointer: fine)').matches) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.25}px)`;
  };
  const onLeave = () => (ref.current.style.transform = '');
  const cls = `group/btn relative inline-flex items-center gap-2 overflow-hidden rounded-full border px-6 py-3.5 text-[0.95rem] font-medium transition-[color,border-color,transform] duration-500 ease-ui disabled:opacity-50 ${variants[variant]} ${className}`;
  // The wipe waits a hair past 100% below: at exactly 100% the rounded edge shows a sliver of it under the border.
  const inner = (
    <>
      <span
        aria-hidden
        className="absolute inset-0 translate-y-[105%] rounded-full bg-(--wipe) transition-transform duration-500 ease-ui group-hover/btn:translate-y-0"
      />
      <span className="relative">{children}</span>
      {Icon && (
        <Icon
          aria-hidden
          className="relative size-4 transition-transform duration-500 ease-ui group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
        />
      )}
    </>
  );
  const common = {ref, className: cls, onMouseMove: onMove, onMouseLeave: onLeave, ...rest};
  if (to)
    return (
      <Link to={to} {...common}>
        {inner}
      </Link>
    );
  if (href)
    return (
      <a href={href} {...common}>
        {inner}
      </a>
    );
  return <button {...common}>{inner}</button>;
}
