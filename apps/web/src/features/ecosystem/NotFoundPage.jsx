// 404.
import {useRef} from 'react';
import {Button} from '../../components/ui/Button';
import {Heading} from '../../components/ui/Heading';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';

export function NotFound() {
  const ref = useRef(null);
  usePageMotion(ref);
  usePageMeta({title: 'Page not found — Pirento'});
  return (
    <div ref={ref} className="hero relative flex min-h-dvh items-center overflow-hidden">
      <div aria-hidden className="grid-bg absolute inset-0" />
      <div className="container-x relative">
        <p className="eyebrow" data-hero-fade>
          404
        </p>
        <Heading as="h1" text="This page / is not here." className="h-hero mt-6" />
        <div className="mt-10" data-hero-fade>
          <Button to="/">Back to home</Button>
        </div>
      </div>
    </div>
  );
}
