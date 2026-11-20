// Brand artwork from public/brand: the Pirento wordmark and "t" mark, and each product's own logo
// once it has one. On paper the dark artwork shows (the light one in dark mode); on dark panels pass
// tone="light". Size with classes, e.g. "h-6 w-auto".
//
// To add a product's logo: put logo.png (for light backgrounds), logo-light.png (for its dark panels),
// mark.png and mark-light.png in public/brand/<slug>/, then add one line to ART. favicon-32.png,
// icon-192.png and apple-touch-icon.png in the same folder become that site's browser icons.

const art = (dir, logoRatio, markRatio) => ({
  logo: {dark: `${dir}/logo.png`, light: `${dir}/logo-light.png`, ratio: logoRatio},
  mark: {dark: `${dir}/mark.png`, light: `${dir}/mark-light.png`, ratio: markRatio},
  icons: dir,
});

const ART = {
  pirento: {
    logo: {dark: '/brand/pirento-logo.png', light: '/brand/pirento-logo-light.png', ratio: 686 / 216},
    mark: {dark: '/brand/pirento-mark.png', light: '/brand/pirento-mark-light.png', ratio: 365 / 636},
    icons: '/brand',
  },
  legal: art('/brand/legal', 771 / 368, 408 / 617),
  green: art('/brand/green', 769 / 356, 513 / 594),
  capital: art('/brand/capital', 767 / 366, 478 / 617),
};

/** True when this product has its own logo files (others show their name and colour square). */
export const hasLogo = (slug) => Boolean(ART[slug]);

/** The folder holding a site's favicons: the product's own, or Pirento's. */
export const iconDir = (slug) => (ART[slug] ?? ART.pirento).icons;

function Art({brand = 'pirento', kind, tone = 'auto', className = '', alt = 'Pirento'}) {
  const f = (ART[brand] ?? ART.pirento)[kind];
  // width/height give the browser the shape up front, so nothing jumps while the image loads.
  const size = {width: Math.round(f.ratio * 100), height: 100};
  if (tone === 'light') return <img src={f.light} alt={alt} {...size} className={className} />;
  return (
    <>
      <img src={f.dark} alt={alt} {...size} className={`dark:hidden ${className}`} />
      <img src={f.light} alt={alt} {...size} className={`hidden dark:block ${className}`} />
    </>
  );
}

export const PirentoLogo = (props) => <Art kind="logo" {...props} />;
export const PirentoMark = (props) => <Art kind="mark" {...props} />;
/** A product's logo or mark: <SiteLogo brand="legal" />. Check hasLogo(slug) first. */
export const SiteLogo = (props) => <Art kind="logo" {...props} />;
export const SiteMark = (props) => <Art kind="mark" {...props} />;
