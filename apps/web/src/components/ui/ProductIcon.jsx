// A product's mark in lists and tabs: its own app icon from public/brand/<slug>/.
export function ProductIcon({product, className = 'size-6'}) {
  return (
    <img
      src={`/brand/${product.slug}/icon-192.png`}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      className={`inline-block shrink-0 rounded-[24%] object-cover ${className}`}
    />
  );
}
