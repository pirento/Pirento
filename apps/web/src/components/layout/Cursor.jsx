// Custom cursor (dot + ring) for mouse users; off for touch and reduced motion.
import {useEffect, useRef, useState} from 'react';
import gsap from 'gsap';
import {reducedMotion} from '../../lib/motion';

// Dot + trailing ring, mouse devices only. Ring grows over interactive
// elements and shows the `data-cursor` label when one is set.
export function Cursor() {
  const [on] = useState(() => matchMedia('(pointer: fine)').matches && !reducedMotion());
  const dot = useRef(null);
  const ring = useRef(null);
  const [label, setLabel] = useState('');
  const [big, setBig] = useState(false);
  const [moved, setMoved] = useState(false);

  useEffect(() => {
    if (!on) return;
    const dx = gsap.quickTo(dot.current, 'x', {duration: 0.1});
    const dy = gsap.quickTo(dot.current, 'y', {duration: 0.1});
    const rx = gsap.quickTo(ring.current, 'x', {duration: 0.45, ease: 'power3.out'});
    const ry = gsap.quickTo(ring.current, 'y', {duration: 0.45, ease: 'power3.out'});
    const move = (e) => {
      setMoved(true);
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
      const target = e.target.closest?.('a, button, summary, [data-cursor], input, label');
      setBig(Boolean(target));
      setLabel(target?.closest('[data-cursor]')?.dataset.cursor ?? '');
    };
    addEventListener('pointermove', move);
    return () => removeEventListener('pointermove', move);
  }, [on]);

  if (!on) return null;
  return (
    <div aria-hidden className={`pointer-events-none fixed inset-0 z-[90] ${moved ? '' : 'opacity-0'}`}>
      <div ref={dot} className="absolute -top-1 -left-1 size-2 rounded-full bg-ink" />
      <div
        ref={ring}
        className={`absolute flex items-center justify-center rounded-full border border-ink text-[0.65rem] font-medium tracking-widest uppercase transition-[width,height,margin,background-color] duration-300 ease-ui ${
          label
            ? '-mt-10 -ml-10 size-20 bg-accent text-on-accent border-accent'
            : big
              ? '-mt-7 -ml-7 size-14'
              : '-mt-4 -ml-4 size-8'
        }`}
      >
        {label}
      </div>
    </div>
  );
}
