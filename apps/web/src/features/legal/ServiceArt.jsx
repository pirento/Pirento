// The picture beside a service page section: the scene admin picked (or the section's default), or the team's own
// https image, with its caption underneath.
import {ART_SECTIONS} from '@pirento/shared';
import {ArtFigure} from '../../components/ArtFigure';
import {servicePageCopy as copy} from '../../data/site';

export function ServiceArt({page, section, className = ''}) {
  const art = page?.art?.[section] ?? {};
  return (
    <ArtFigure
      scene={art.scene ?? ART_SECTIONS[section]}
      caption={art.caption ?? copy.art[section]}
      image={art.image}
      className={className}
    />
  );
}
