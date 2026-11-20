// The hero feature card every product widget sits in: the one soft shadow the design system allows.
export const WidgetCard = ({label, children, className = ''}) => (
  <div
    className={`rounded-[22px] border border-rule bg-paper p-6 shadow-[0_30px_80px_-40px_rgba(15,38,32,0.4)] md:p-8 ${className}`}
  >
    {label && <p className="eyebrow">{label}</p>}
    {children}
  </div>
);
