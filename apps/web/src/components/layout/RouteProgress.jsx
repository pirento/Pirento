// A loading bar along the top on every page change, so a new page is seen to open even when it looks like the last
// one. It runs across the screen, then fills and fades; under reduced motion it only shows and hides.
import {useEffect, useRef, useState} from 'react';
import {useLocation} from 'react-router-dom';

export function RouteProgress() {
  const {pathname} = useLocation();
  const [phase, setPhase] = useState('idle'); // idle → run → done → idle
  const first = useRef(true);

  useEffect(() => {
    // The first page has the preloader; the bar is for moving between pages.
    if (first.current) {
      first.current = false;
      return undefined;
    }
    setPhase('run');
    const done = setTimeout(() => setPhase('done'), 450);
    const hide = setTimeout(() => setPhase('idle'), 900);
    return () => {
      clearTimeout(done);
      clearTimeout(hide);
    };
  }, [pathname]);

  if (phase === 'idle') return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]">
      <div
        key={pathname}
        className={`route-progress h-full bg-accent ${phase === 'done' ? 'route-progress-done' : 'route-progress-run'}`}
      />
    </div>
  );
}
