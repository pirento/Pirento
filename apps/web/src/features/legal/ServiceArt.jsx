// The picture beside a service page section: the scene admin picked (or the section's default), or the team's own
// https image, with its caption underneath.
import {ART_SECTIONS} from '@pirento/shared';
import {ArtFigure} from '../../components/ArtFigure';
import {servicePageCopy as copy} from '../../data/site';

export function ServiceArt({page, section, className = ''}) {
  const art = page?.art?.[section] ?? {};
  // On a phone the picture stays small and centred, so the page does not grow by a screen per section.
  return (
    <div className={className}>
      <ArtFigure
        scene={art.scene ?? ART_SECTIONS[section]}
        caption={art.caption ?? copy.art[section]}
        image={art.image}
        className="mx-auto max-w-[19rem] sm:mx-0 sm:max-w-none"
      />
    </div>
  );
}
