// One scene per product, showing the work it does: books and returns, planting, learning, an assistant, a safe,
// partners, a loan, an identity check, a delivery. Same line style and theme colours as the other scenes.
import {A, Check, Person, S, card, lift} from './parts';

export const PRODUCT_SCENES = {
  // Pirento Black: an open ledger, a calculator and a filed return.
  ledger: (
    <>
      <rect x="120" y="130" width="150" height="200" rx="12" {...card} />
      <path d="M144 166h100M144 192h70" {...S} strokeWidth="5" />
      <path d="M144 230h100M144 256h100M144 282h60" {...S} opacity=".5" />
      <circle cx="240" cy="300" r="20" fill={A} stroke="var(--ink)" strokeWidth="2" />
      <Check x={240} y={300} size={0.7} />
      <g className={lift}>
        <path d="M300 150h170l20 20 20-20h170v250H510l-20 20-20-20H300z" {...card} />
        <path d="M490 170v250" {...S} />
        {[0, 1, 2, 3, 4].map((r) => (
          <g key={r}>
            <path d={`M320 ${200 + r * 36}h150M510 ${200 + r * 36}h150`} {...S} opacity=".45" />
            <path d={`M430 ${190 + r * 36}h30M620 ${190 + r * 36}h30`} {...S} strokeWidth="4" />
          </g>
        ))}
      </g>
      <rect x="560" y="300" width="130" height="160" rx="14" {...card} fill="var(--ink)" />
      <rect x="576" y="316" width="98" height="34" rx="6" {...card} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <rect
            key={`${r}${c}`}
            x={578 + c * 34}
            y={364 + r * 30}
            width="24"
            height="20"
            rx="5"
            fill={r === 2 && c === 2 ? A : 'var(--paper)'}
          />
        )),
      )}
    </>
  ),
  // Pirento Green: saplings planted on a drive, a pin on the planting site, and water.
  planting: (
    <>
      <circle cx="640" cy="110" r="40" fill={A} stroke="var(--ink)" strokeWidth="2" />
      <path d="M640 50v-18M700 110h18M682 68l12-12M598 68l-12-12" {...S} />
      <path d="M100 400c120-30 480-30 600 0" {...S} />
      {[
        [220, 0.6],
        [370, 0.85],
        [530, 1.1],
      ].map(([x, k]) => (
        <g key={x} className={k > 1 ? lift : undefined}>
          <path d={`M${x - 46} 392c10-22 82-22 92 0`} {...card} />
          <path d={`M${x} 380v-${120 * k}`} {...S} strokeWidth="3" />
          <path
            d={`M${x} ${380 - 90 * k}c-${60 * k} 0-${90 * k}-${40 * k}-${90 * k}-${90 * k} ${60 * k} 0 ${90 * k} ${40 * k} ${90 * k} ${90 * k}z`}
            {...card}
          />
          <path
            d={`M${x} ${380 - 70 * k}c${56 * k} 0 ${84 * k}-${36 * k} ${84 * k}-${82 * k}-${56 * k} 0-${84 * k} ${36 * k}-${84 * k} ${82 * k}z`}
            {...card}
            fill={A}
          />
        </g>
      ))}
      <path d="M370 120c-30 0-52 22-52 50 0 38 52 86 52 86s52-48 52-86c0-28-22-50-52-50z" {...card} fill="var(--ink)" />
      <circle cx="370" cy="170" r="18" fill="var(--paper)" />
      <path d="M640 300h60l20 50h-80zM700 300l40-30" {...card} />
      <path d="M744 262v16M754 270v14M734 272v12" {...S} opacity=".6" />
    </>
  ),
  // Pirento Intern: a lesson playing on a laptop, a learner, and a certificate earned.
  classroom: (
    <>
      <Person x={200} y={190} shirt={A} long />
      <rect x="90" y="350" width="620" height="20" rx="8" {...card} />
      <g className={lift}>
        <rect x="320" y="140" width="280" height="180" rx="14" {...card} />
        <rect x="336" y="156" width="248" height="148" rx="6" fill="var(--stone)" stroke="var(--ink)" strokeWidth="2" />
        <circle cx="460" cy="230" r="34" fill={A} stroke="var(--ink)" strokeWidth="2" />
        <path d="M450 214v32l26-16z" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
        <path d="M290 350l30-30h280l30 30z" {...card} />
      </g>
      <rect x="610" y="120" width="130" height="96" rx="10" {...card} />
      <path d="M630 148h90M630 170h60" {...S} opacity=".5" />
      <circle cx="712" cy="200" r="22" fill={A} stroke="var(--ink)" strokeWidth="2" />
      <Check x={712} y={200} size={0.75} />
      <path d="M150 370v80M650 370v80" {...S} />
    </>
  ),
  // Pirento AI: a question asked in plain words and an answer with a spark.
  assistant: (
    <>
      <Person x={170} y={200} />
      <rect x="300" y="80" width="300" height="340" rx="30" {...card} />
      <path d="M420 104h60" {...S} strokeWidth="5" />
      <path d="M330 140h200a14 14 0 0 1 14 14v40a14 14 0 0 1-14 14H344l-14 14z" {...card} fill="var(--stone)" />
      <path d="M350 168h150M350 186h90" {...S} opacity=".6" />
      <g className={lift}>
        <path d="M570 250H370a14 14 0 0 0-14 14v70a14 14 0 0 0 14 14h186l14 14z" {...card} fill={A} />
        <path d="M390 282h150M390 304h120M390 326h80" {...S} />
      </g>
      <path
        d="M660 150l12-30 12 30 30 12-30 12-12 30-12-30-30-12zM690 280l7-16 7 16 16 7-16 7-7 16-7-16-16-7z"
        {...card}
        fill={A}
      />
      <rect x="330" y="372" width="240" height="30" rx="15" {...card} />
    </>
  ),
  // Pirento Vault: a safe with its dial, papers inside, a key and a shield.
  vault: (
    <>
      <rect x="180" y="110" width="300" height="300" rx="22" {...card} />
      <rect x="206" y="136" width="248" height="248" rx="14" {...S} />
      <g className={lift}>
        <circle cx="330" cy="260" r="62" {...card} fill="var(--stone)" />
        <circle cx="330" cy="260" r="16" fill={A} stroke="var(--ink)" strokeWidth="2" />
        <path d="M330 198v18M330 304v18M268 260h18M374 260h18M286 216l12 12M362 292l12 12" {...S} />
      </g>
      <path d="M200 410v26M460 410v26" {...S} strokeWidth="4" />
      <path d="M560 130c40 0 70-14 70-14s30 14 70 14v90c0 70-70 110-70 110s-70-40-70-110z" {...card} fill={A} />
      <Check x={630} y={210} size={1.4} />
      <circle cx="560" cy="380" r="26" {...card} />
      <path d="M586 380h110M650 380v22M676 380v16" {...S} strokeWidth="4" />
    </>
  ),
  // Pirento One: a partner refers a client, the order goes through, a share comes back.
  partners: (
    <>
      <Person x={180} y={190} shirt={A} />
      <Person x={620} y={190} long />
      <path d="M260 220c80-60 200-60 280 0" {...S} strokeDasharray="4 10" strokeWidth="3" />
      <path d="M540 220l-24-4 10-20z" fill="var(--ink)" />
      <g className={lift}>
        <rect x="350" y="250" width="100" height="130" rx="10" {...card} />
        <path d="M370 280h60M370 302h44" {...S} opacity=".55" />
        <circle cx="400" cy="345" r="18" fill={A} stroke="var(--ink)" strokeWidth="2" />
        <Check x={400} y={345} size={0.6} />
      </g>
      <path d="M540 400c-80 40-200 40-280 0" {...S} strokeDasharray="4 10" strokeWidth="3" />
      <path d="M260 400l22 10-14 18z" fill="var(--ink)" />
      <ellipse cx="400" cy="440" rx="36" ry="12" {...card} fill={A} />
      <ellipse cx="400" cy="428" rx="36" ry="12" {...card} fill={A} />
    </>
  ),
  // Pirento Capital: a bank, an EMI plan month by month, and the loan amount.
  loan: (
    <>
      <path d="M140 170l130-70 130 70z" {...card} />
      <rect x="150" y="170" width="240" height="20" {...card} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={170 + i * 58} y="198" width="26" height="150" rx="4" {...card} />
      ))}
      <rect x="140" y="350" width="260" height="24" {...card} fill="var(--ink)" />
      <circle cx="270" cy="140" r="12" fill={A} stroke="var(--ink)" strokeWidth="2" />
      <g className={lift}>
        <rect x="450" y="120" width="230" height="250" rx="16" {...card} />
        <path d="M474 152h110" {...S} strokeWidth="5" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect
            key={i}
            x={480 + i * 32}
            y={330 - (6 - i) * 20}
            width="20"
            height={(6 - i) * 20}
            rx="4"
            fill={i === 0 ? A : 'var(--stone)'}
            stroke="var(--ink)"
            strokeWidth="2"
          />
        ))}
      </g>
      <circle cx="660" cy="390" r="44" fill={A} stroke="var(--ink)" strokeWidth="2" />
      <text x="642" y="408" fontSize="50" fontWeight="600" fill="var(--ink)">
        ₹
      </text>
    </>
  ),
  // Bharat ID: a face check on a phone, the ID card it unlocks, and a fingerprint.
  idcheck: (
    <>
      <rect x="150" y="80" width="200" height="350" rx="28" {...card} />
      <path d="M220 104h60" {...S} strokeWidth="5" />
      <g className={lift}>
        <path d="M190 160v-24h24M286 136h24v24M310 300v24h-24M214 324h-24v-24" {...S} stroke={A} strokeWidth="5" />
        <circle cx="250" cy="212" r="38" fill="var(--on-inverse)" stroke="var(--inverse)" strokeWidth="2" />
        <path
          d="M200 300c0-36 22-54 50-54s50 18 50 54"
          fill="var(--on-inverse)"
          stroke="var(--inverse)"
          strokeWidth="2"
        />
      </g>
      <rect x="190" y="360" width="120" height="34" rx="17" fill={A} stroke="var(--ink)" strokeWidth="2" />
      <rect x="400" y="150" width="280" height="180" rx="18" {...card} />
      <rect x="400" y="150" width="280" height="44" rx="18" fill={A} stroke="var(--ink)" strokeWidth="2" />
      <circle cx="460" cy="260" r="34" {...S} />
      <path d="M520 240h120M520 266h90M520 292h110" {...S} opacity=".55" />
      <g transform="translate(560 410)">
        {[12, 24, 36, 48].map((r) => (
          <path key={r} d={`M-${r} 0a${r} ${r} 0 0 1 ${r * 2} 0`} {...S} strokeWidth="3" />
        ))}
      </g>
    </>
  ),
  // Giftox: a gift box on its way in a van, with the drop pin ahead.
  delivery: (
    <>
      <path d="M80 420h640" {...S} />
      <path d="M100 440h90M260 440h140M480 440h120" {...S} strokeDasharray="2 14" opacity=".6" />
      <g className={lift}>
        <path d="M130 200h300v190H130z" {...card} />
        <path d="M430 250h100l60 70v70H430z" {...card} />
        <path
          d="M450 270h70l40 50H450z"
          fill="var(--stone)"
          stroke="var(--ink)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <rect x="210" y="240" width="140" height="110" rx="8" {...card} fill={A} />
        <path d="M280 240v110M210 290h140" {...S} />
        <path d="M280 240c-20-36-60-36-60-10s40 10 60 10c20 0 60 16 60-10s-40-26-60 10z" {...S} />
      </g>
      {[200, 520].map((x) => (
        <g key={x}>
          <circle cx={x} cy="396" r="30" {...card} fill="var(--ink)" />
          <circle cx={x} cy="396" r="10" fill="var(--paper)" />
        </g>
      ))}
      <path d="M660 160c-26 0-46 20-46 44 0 34 46 76 46 76s46-42 46-76c0-24-20-44-46-44z" {...card} fill={A} />
      <circle cx="660" cy="204" r="15" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
    </>
  ),
};
