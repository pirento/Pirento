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

/** An order's name: the service, and the package when it had a choice of them. */
export const orderTitle = (order) =>
  order.package?.name && order.package.id !== 'standard'
    ? `${order.serviceName} · ${order.package.name}`
    : order.serviceName;
