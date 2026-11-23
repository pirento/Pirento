// The picture beside a service page section: the scene admin picked (or the section's default), or the team's own
// https image, with its caption underneath.
import {ART_SECTIONS} from '@pirento/shared';
import {Illustration} from '../../components/Illustration';
import {servicePageCopy as copy} from '../../data/site';

export function ServiceArt({page, section, className = ''}) {
  const art = page?.art?.[section] ?? {};
  const caption = art.caption ?? copy.art[section];
  return (
    <figure className={className} data-reveal>
      {art.image ? (
        <img
          src={art.image}
          alt={caption ?? ''}
          loading="lazy"
          className="block aspect-[8/5] w-full rounded-[22px] border border-rule bg-stone object-cover"
        />
      ) : (
        <Illustration name={art.scene ?? ART_SECTIONS[section]} />
      )}
      {caption && <figcaption className="mt-4 text-center text-sm text-muted">{caption}</figcaption>}
    </figure>
  );
}
