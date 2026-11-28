// One small scene per product for its card on the Pirento home, each drawn once and used only there. Same line style
// and theme colours as the other scenes; the card sets --accent to the product's own colour. viewBox 800×500.
import {A, Check, S, card, lift} from './parts';

export const SPOT_SCENES = {
  // Legal: law books on a shelf, one open at a section mark.
  lawbook: (
    <>
      <path d="M140 400h520" {...S} strokeWidth="4" />
      {[
        [170, 150, 'var(--paper)'],
        [220, 120, A],
        [270, 160, 'var(--paper)'],
      ].map(([x, y, fill]) => (
        <g key={x}>
          <rect x={x} y={y} width="44" height={400 - y} rx="6" {...card} fill={fill} />
          <path d={`M${x + 10} ${y + 30}h24M${x + 10} ${y + 46}h24`} {...S} />
        </g>
      ))}
      <g className={lift}>
        <path d="M360 200c60-26 120-26 160 0v190c-40-26-100-26-160 0z" {...card} />
        <path d="M520 200c40-26 100-26 160 0v190c-60-26-120-26-160 0z" {...card} />
        <text x="410" y="320" fontSize="88" fontWeight="600" fill={A}>
          §
        </text>
        <path d="M560 250h80M560 280h70M560 310h80M560 340h50" {...S} opacity=".5" />
      </g>
    </>
  ),
  // Black: an invoice with its tax shown as a percentage, and a receipt roll.
  invoice: (
    <>
      <rect x="200" y="90" width="260" height="330" rx="14" {...card} />
      <path d="M230 130h120M230 160h80" {...S} strokeWidth="5" />
      <path d="M230 210h200M230 240h200M230 270h160" {...S} opacity=".45" />
      <path d="M230 320h200" {...S} />
      <path d="M380 350h50" {...S} strokeWidth="6" />
      <g className={lift}>
        <circle cx="540" cy="200" r="70" fill={A} stroke="var(--ink)" strokeWidth="2" />
        <circle cx="515" cy="175" r="12" {...S} strokeWidth="5" />
        <circle cx="565" cy="225" r="12" {...S} strokeWidth="5" />
        <path d="M565 165l-50 70" {...S} strokeWidth="6" />
      </g>
      <path d="M500 300h120v120l-15-10-15 10-15-10-15 10-15-10-15 10-15-10-15 10z" {...card} />
      <path d="M520 330h80M520 356h60" {...S} opacity=".5" />
    </>
  ),
  // Green: the earth with a sprout on top.
  earth: (
    <>
      <g className={lift}>
        <circle cx="400" cy="290" r="140" {...card} />
        <path
          d="M300 220c40-10 60 20 90 10s30-40 70-30M290 320c30 10 50-20 90-10s50 40 100 20M340 400c20-20 60-20 90 0"
          {...S}
          opacity=".55"
        />
        <path d="M400 150v-50" {...S} strokeWidth="4" />
        <path d="M400 120c-40 0-60-26-60-60 40 0 60 26 60 60z" {...card} fill={A} />
        <path d="M400 110c34 0 52-22 52-52-34 0-52 22-52 52z" {...card} fill={A} />
      </g>
      <path
        d="M190 160l10-24 10 24 24 10-24 10-10 24-10-24-24-10zM600 400l8-18 8 18 18 8-18 8-8 18-8-18-18-8z"
        {...card}
      />
    </>
  ),
  // Intern: a graduation cap above an open notebook.
  gradcap: (
    <>
      <g className={lift}>
        <path d="M400 110l230 90-230 90-230-90z" {...card} fill="var(--ink)" />
        <path d="M290 240v70c0 30 220 30 220 0v-70" {...card} />
        <path d="M630 200v110" {...S} strokeWidth="4" />
        <circle cx="630" cy="320" r="14" fill={A} stroke="var(--ink)" strokeWidth="2" />
      </g>
      <path d="M240 400c60-24 110-24 160 0 50-24 100-24 160 0v40c-60-24-110-24-160 0-50-24-100-24-160 0z" {...card} />
      <path d="M400 400v40" {...S} />
    </>
  ),
  // AI: a chip with its pins and a spark at its centre.
  chip: (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M${300 + i * 50} 120v-30M${300 + i * 50} 380v30M200 ${150 + i * 50}h-30M600 ${150 + i * 50}h30`}
          {...S}
          strokeWidth="4"
        />
      ))}
      <rect x="230" y="120" width="340" height="260" rx="30" {...card} />
      <g className={lift}>
        <rect x="300" y="180" width="200" height="140" rx="18" {...card} fill={A} />
        <path d="M400 210l14 32 32 14-32 14-14 32-14-32-32-14 32-14z" {...card} />
      </g>
    </>
  ),
  // Vault: a key ring with three keys.
  keyring: (
    <>
      <circle cx="320" cy="200" r="70" {...S} strokeWidth="6" />
      <g className={lift}>
        {[
          [-30, A],
          [10, 'var(--paper)'],
          [50, 'var(--paper)'],
        ].map(([deg, fill]) => (
          <g key={deg} transform={`rotate(${deg} 320 200)`}>
            <circle cx="420" cy="200" r="34" {...card} fill={fill} />
            <circle cx="420" cy="200" r="10" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
            <path d="M454 200h170M590 200v26M616 200v18" {...S} strokeWidth="8" />
          </g>
        ))}
      </g>
    </>
  ),
  // One: a megaphone spreading the word to three people.
  megaphone: (
    <>
      <g className={lift}>
        <path d="M200 220h60l170-80v240l-170-80h-60z" {...card} fill={A} />
        <path d="M230 300l20 90h40l-10-90" {...card} />
      </g>
      <path d="M480 200c30 30 30 90 0 120M520 170c50 50 50 130 0 180" {...S} strokeWidth="4" />
      {[150, 260, 370].map((y) => (
        <g key={y}>
          <circle cx="640" cy={y} r="24" fill="var(--on-inverse)" stroke="var(--inverse)" strokeWidth="2" />
          <path d={`M610 ${y + 56}c0-20 14-30 30-30s30 10 30 30`} {...card} />
        </g>
      ))}
    </>
  ),
  // Capital: a stack of coins growing beside a rising arrow.
  coins: (
    <>
      <path d="M150 420h500" {...S} />
      {[0, 1, 2].map((c) => (
        <g key={c}>
          {Array.from({length: 2 + c * 2}).map((_, i) => (
            <ellipse
              key={i}
              cx={260 + c * 140}
              cy={400 - i * 26}
              rx="54"
              ry="16"
              {...card}
              fill={i === 1 + c * 2 ? A : 'var(--paper)'}
            />
          ))}
        </g>
      ))}
      <g className={lift}>
        <path d="M200 260l140-60 120 30 180-130" {...S} strokeWidth="5" />
        <path d="M640 100h-50M640 100v50" {...S} strokeWidth="5" />
      </g>
    </>
  ),
  // Bharat ID: a card with a QR code to check it.
  qrcard: (
    <>
      <rect x="180" y="120" width="440" height="270" rx="22" {...card} />
      <circle cx="270" cy="230" r="44" fill="var(--on-inverse)" stroke="var(--inverse)" strokeWidth="2" />
      <path d="M220 320h120M220 346h90" {...S} opacity=".5" />
      <g className={lift}>
        <rect x="400" y="160" width="180" height="180" rx="12" {...card} />
        {[
          [416, 176],
          [512, 176],
          [416, 272],
        ].map(([x, y]) => (
          <g key={`${x}${y}`}>
            <rect x={x} y={y} width="52" height="52" rx="6" {...S} strokeWidth="4" />
            <rect x={x + 14} y={y + 14} width="24" height="24" rx="3" fill={A} />
          </g>
        ))}
        <path
          d="M516 284h16v16h-16zM548 284h16v16h-16zM532 300h16v16h-16zM516 316h16v16h-16zM548 316h16v16h-16z"
          fill="var(--ink)"
        />
      </g>
      <circle cx="600" cy="390" r="30" fill={A} stroke="var(--ink)" strokeWidth="2" />
      <Check x={600} y={390} />
    </>
  ),
  // Giftox: balloons tied to a small gift.
  balloons: (
    <>
      {[
        [300, 150, A],
        [400, 110, 'var(--paper)'],
        [500, 160, A],
      ].map(([x, y, fill]) => (
        <g key={x} className={x === 400 ? lift : undefined}>
          <ellipse cx={x} cy={y} rx="56" ry="68" {...card} fill={fill} />
          <path d={`M${x} ${y + 68}l-8 12h16z`} {...card} />
          <path d={`M${x} ${y + 80}C${x} ${y + 150} 400 260 400 330`} {...S} />
        </g>
      ))}
      <rect x="340" y="330" width="120" height="90" rx="8" {...card} fill={A} />
      <rect x="330" y="310" width="140" height="30" rx="8" {...card} />
      <path d="M400 310v110" {...S} />
    </>
  ),
};
