// The Pirento wordmark and its "t" mark, from the brand files in public/brand.
// On paper the dark artwork shows (the light one in dark mode); on dark panels pass tone="light".
// Size it with classes, e.g. "h-6 w-auto".

const FILES = {
  logo: {dark: '/brand/pirento-logo.png', light: '/brand/pirento-logo-light.png', ratio: 686 / 216},
  mark: {dark: '/brand/pirento-mark.png', light: '/brand/pirento-mark-light.png', ratio: 365 / 636},
};

function Art({kind, tone = 'auto', className = '', alt = 'Pirento'}) {
  const f = FILES[kind];
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
