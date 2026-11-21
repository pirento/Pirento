// A product's mark in lists and tabs: its icon on its own colour (the pair the brand test keeps readable).
import {PRODUCT_ICONS} from '../../lib/productIcons';

export function ProductIcon({product, className = 'size-6'}) {
  const Icon = PRODUCT_ICONS[product.slug];
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-[30%] ${className}`}
      style={{background: product.color, color: product.onColor}}
    >
      {Icon && <Icon className="size-[60%]" strokeWidth={2.25} />}
    </span>
  );
}
