// A picture that explains a step: one of the site's drawings, or an https image of the team's own, with a caption.
import {Illustration} from './Illustration';

export function ArtFigure({scene, caption, image, className = ''}) {
  return (
    <figure className={className} data-reveal>
      {image ? (
        <img
          src={image}
          alt={caption ?? ''}
          loading="lazy"
          className="block aspect-[8/5] w-full rounded-[22px] border border-rule bg-stone object-cover"
        />
      ) : (
        <Illustration name={scene} />
      )}
      {caption && <figcaption className="mt-4 text-center text-sm text-muted">{caption}</figcaption>}
    </figure>
  );
}
