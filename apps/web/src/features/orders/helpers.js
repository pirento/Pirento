// Small order helpers shared by several order views.
export const savedRef = () => {
  try {
    return localStorage.getItem('pirento.ref') ?? undefined;
  } catch {
    return undefined;
  }
};

export const qty = (o) => (o.quantity > 1 ? ` × ${o.quantity}` : '');

// ── Checkout ─────────────────────────────────────────────────────────────
