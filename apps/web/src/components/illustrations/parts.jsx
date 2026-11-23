// The pieces every scene is drawn with: line and card styles from theme variables, a seated person, a tick.
export const S = {fill: 'none', stroke: 'var(--ink)', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round'};
export const card = {fill: 'var(--paper)', stroke: 'var(--ink)', strokeWidth: 2, strokeLinejoin: 'round'};
export const A = 'var(--accent)';
export const lift = 'transition-transform duration-700 ease-ui group-hover:-translate-y-2.5';

// Skin and hair keep their colours in both themes: --inverse stays dark and --on-inverse stays light.
const skin = {fill: 'var(--on-inverse)', stroke: 'var(--inverse)', strokeWidth: 2};
const hair = 'var(--inverse)';

/** A seated person seen from the front, head at (x, y): a shirt colour and short or long hair. Faceless on purpose. */
export function Person({x, y, shirt = 'var(--paper)', long = false}) {
  return (
    <g>
      {long && (
        <path
          d={`M${x - 40} ${y - 4}C${x - 50} ${y + 40} ${x - 46} ${y + 78} ${x - 30} ${y + 92}L${x + 30} ${y + 92}C${x + 46} ${y + 78} ${x + 50} ${y + 40} ${x + 40} ${y - 4}Z`}
          fill={hair}
        />
      )}
      <path
        d={`M${x - 66} ${y + 170}C${x - 66} ${y + 96} ${x - 44} ${y + 54} ${x} ${y + 54}C${x + 44} ${y + 54} ${x + 66} ${y + 96} ${x + 66} ${y + 170}Z`}
        fill={shirt}
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d={`M${x - 16} ${y + 54}L${x} ${y + 76}L${x + 16} ${y + 54}`} {...S} />
      <rect x={x - 11} y={y + 28} width="22" height="28" rx="6" {...skin} />
      <circle cx={x} cy={y} r="36" {...skin} />
      <path
        d={`M${x - 37} ${y + 4}C${x - 42} ${y - 40} ${x + 42} ${y - 50} ${x + 38} ${y + 2}C${x + 18} ${y - 20} ${x - 12} ${y - 22} ${x - 37} ${y + 4}Z`}
        fill={hair}
      />
    </g>
  );
}

export const Check = ({x, y, size = 1}) => (
  <path d={`M${x - 10 * size} ${y}l${7 * size} ${7 * size} ${13 * size}-${15 * size}`} {...S} strokeWidth={3} />
);
