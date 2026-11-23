// Original line illustrations, drawn only with theme variables.
// viewBox 800×500 on a stone card with a faint grid. Hover lifts the focus group.
import {PROCESS_SCENES} from './illustrations/process';

const S = {fill: 'none', stroke: 'var(--ink)', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round'};
const card = {fill: 'var(--paper)', stroke: 'var(--ink)', strokeWidth: 2};
const A = 'var(--accent)';

const scenes = {
  ecosystem: (
    <>
      <circle cx="400" cy="250" r="170" {...S} strokeDasharray="4 8" opacity=".5" />
      <circle cx="400" cy="250" r="100" {...S} opacity=".5" />
      <g
        className="origin-center transition-transform duration-[1.6s] ease-ui group-hover:rotate-45"
        style={{transformOrigin: '400px 250px'}}
      >
        {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg, i) => {
          const r = (deg * Math.PI) / 180;
          return (
            <g key={deg} transform={`translate(${400 + 170 * Math.cos(r)} ${250 + 170 * Math.sin(r)})`}>
              <rect x="-17" y="-17" width="34" height="34" rx="9" {...card} fill={i === 0 ? A : 'var(--paper)'} />
            </g>
          );
        })}
      </g>
      <rect x="350" y="200" width="100" height="100" rx="22" fill="var(--ink)" />
      <rect x="383" y="233" width="34" height="34" rx="8" fill={A} />
    </>
  ),
  document: (
    <>
      <rect x="250" y="70" width="300" height="370" rx="18" {...card} />
      <path d="M290 130h160M290 170h220M290 210h190" {...S} opacity=".6" />
      <g className="transition-transform duration-700 ease-ui group-hover:-translate-y-2.5">
        {[260, 310, 360].map((y, i) => (
          <g key={y}>
            <rect x="290" y={y - 14} width="28" height="28" rx="8" {...S} fill={i < 2 ? A : 'none'} />
            {i < 2 && <path d={`M297 ${y}l6 6 10-12`} {...S} />}
            <path d={`M338 ${y}h${150 - i * 30}`} {...S} />
          </g>
        ))}
      </g>
      <circle cx="560" cy="380" r="46" {...card} />
      <path d="M540 380l14 14 26-30" {...S} strokeWidth="3" />
    </>
  ),
  leaf: (
    <>
      <path d="M150 420h500" {...S} />
      <g className="transition-transform duration-700 ease-ui group-hover:-translate-y-2.5">
        <path d="M400 420V210" {...S} />
        <path d="M400 290c-90 0-140-60-140-140 90 0 140 60 140 140z" {...card} />
        <path d="M400 250c80 0 130-55 130-125-80 0-130 55-130 125z" {...card} fill={A} />
      </g>
      <path d="M220 420v-40M580 420v-60M520 420v-28" {...S} opacity=".5" />
    </>
  ),
  certificate: (
    <>
      <rect x="170" y="90" width="460" height="320" rx="18" {...card} />
      <path d="M230 160h240M230 200h340M230 240h300" {...S} opacity=".6" />
      <g className="transition-transform duration-700 ease-ui group-hover:-translate-y-2.5">
        <circle cx="530" cy="330" r="48" fill={A} stroke="var(--ink)" strokeWidth="2" />
        <path d="M512 330l12 12 22-26" {...S} strokeWidth="3" />
      </g>
      <rect x="230" y="300" width="80" height="80" rx="8" {...S} />
      <path d="M245 315h20v20h-20zM275 345h20v20h-20zM245 355h10M285 315h10" {...S} />
    </>
  ),
  chat: (
    <>
      <rect x="150" y="100" width="330" height="110" rx="22" {...card} />
      <path d="M190 145h200M190 175h140" {...S} opacity=".6" />
      <g className="transition-transform duration-700 ease-ui group-hover:-translate-y-2.5">
        <rect x="320" y="250" width="330" height="140" rx="22" {...card} fill={A} />
        <path d="M360 295h240M360 325h200M360 355h120" {...S} />
      </g>
    </>
  ),
  lock: (
    <>
      <path d="M330 220v-50a70 70 0 0 1 140 0v50" {...S} strokeWidth="3" />
      <g className="transition-transform duration-700 ease-ui group-hover:-translate-y-2.5">
        <rect x="280" y="220" width="240" height="190" rx="22" {...card} />
        <circle cx="400" cy="300" r="22" fill={A} stroke="var(--ink)" strokeWidth="2" />
        <path d="M400 322v40" {...S} strokeWidth="3" />
      </g>
    </>
  ),
  network: (
    <>
      <path d="M400 250L220 140M400 250L580 140M400 250L220 370M400 250L580 370" {...S} opacity=".6" />
      {[
        [220, 140],
        [580, 140],
        [220, 370],
        [580, 370],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="34" {...card} />
      ))}
      <g className="transition-transform duration-700 ease-ui group-hover:-translate-y-2.5">
        <circle cx="400" cy="250" r="56" fill={A} stroke="var(--ink)" strokeWidth="2" />
      </g>
    </>
  ),
  chart: (
    <>
      <path d="M160 420h480M160 420V90" {...S} />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={200 + i * 85} y={360 - i * 50} width="50" height={60 + i * 50} rx="8" {...card} />
      ))}
      <g className="transition-transform duration-700 ease-ui group-hover:-translate-y-2.5">
        <path d="M225 330L310 280 395 240 480 180 565 120" {...S} stroke={A} strokeWidth="4" />
        <circle cx="565" cy="120" r="10" fill={A} stroke="var(--ink)" strokeWidth="2" />
      </g>
    </>
  ),
  id: (
    <>
      <g className="transition-transform duration-700 ease-ui group-hover:-translate-y-2.5">
        <rect x="190" y="120" width="420" height="260" rx="22" {...card} />
        <rect x="190" y="120" width="420" height="56" rx="22" fill={A} stroke="var(--ink)" strokeWidth="2" />
        <circle cx="290" cy="270" r="48" {...S} />
        <path d="M370 240h180M370 275h140M370 310h170" {...S} opacity=".6" />
      </g>
    </>
  ),
  gift: (
    <>
      <g className="transition-transform duration-700 ease-ui group-hover:-translate-y-2.5">
        <rect x="270" y="210" width="260" height="190" rx="14" {...card} />
        <rect x="250" y="160" width="300" height="60" rx="14" {...card} fill={A} />
        <path d="M400 160v240" {...S} />
        <path d="M400 160c-30-60-90-60-90-20s60 20 90 20c30 0 90 20 90-20s-60-40-90 20z" {...S} />
      </g>
    </>
  ),
};

export function Illustration({name, className = ''}) {
  return (
    <div className={`group relative overflow-hidden rounded-[22px] border border-rule bg-stone ${className}`}>
      <div aria-hidden className="grid-bg absolute inset-0 opacity-60" />
      <svg viewBox="0 0 800 500" className="relative block h-auto w-full" aria-hidden>
        {scenes[name] ?? PROCESS_SCENES[name] ?? scenes.ecosystem}
      </svg>
    </div>
  );
}
