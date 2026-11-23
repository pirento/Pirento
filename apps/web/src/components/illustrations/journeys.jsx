// How each product's work goes, one scene per product home's "How it works" (and Legal's scales of justice), each
// drawn once and used once. Same line style and theme colours as the other scenes; viewBox 800×500.
import {A, Check, Person, S, card, lift} from './parts';

export const JOURNEY_SCENES = {
  // Pirento Legal: the scales of justice over a case file and a gavel.
  justice: (
    <>
      <path d="M400 90v300M330 400h140" {...S} strokeWidth="5" />
      <circle cx="400" cy="90" r="14" fill={A} stroke="var(--ink)" strokeWidth="2" />
      <g className={lift}>
        <path d="M250 150h300" {...S} strokeWidth="5" />
        <path d="M270 150l-50 110M270 150l50 110M530 150l-50 110M530 150l50 110" {...S} />
        <path d="M210 260h120a60 30 0 0 1-120 0z" {...card} fill={A} />
        <path d="M470 260h120a60 30 0 0 1-120 0z" {...card} />
      </g>
      <rect x="110" y="330" width="150" height="100" rx="10" {...card} />
      <path d="M110 350h150M130 380h90M130 402h60" {...S} opacity=".5" />
      <g transform="rotate(-30 640 380)">
        <rect x="590" y="360" width="110" height="40" rx="10" {...card} fill="var(--ink)" />
        <path d="M645 400v70" {...S} strokeWidth="10" />
      </g>
      <path d="M560 450h160" {...S} strokeWidth="6" />
    </>
  ),
  // Legal's steps: a document signed with a pen and sealed with a stamp.
  signing: (
    <>
      <path d="M230 70h260l60 60v300H230z" {...card} />
      <path d="M490 70v60h60" {...S} />
      <path d="M270 140h170M270 176h230M270 212h200M270 248h220M270 284h150" {...S} opacity=".45" />
      <path d="M270 360c20-30 40 20 60-10s30 10 50-6 30 20 60 0" {...S} strokeWidth="3" />
      <g className={lift}>
        <path d="M560 150l60 60-170 170-74 14 14-74z" {...card} fill={A} />
        <path d="M546 164l60 60" {...S} />
      </g>
      <circle cx="180" cy="370" r="56" fill={A} stroke="var(--ink)" strokeWidth="2" />
      <circle cx="180" cy="370" r="40" {...S} strokeDasharray="4 6" />
      <Check x={180} y={370} size={1.3} />
    </>
  ),
  // Black's steps: a return on the tax portal, filed, with its acknowledgement printing out.
  gstportal: (
    <>
      <rect x="120" y="80" width="420" height="280" rx="16" {...card} />
      <rect x="120" y="80" width="420" height="40" rx="16" fill="var(--ink)" />
      <circle cx="146" cy="100" r="6" fill={A} />
      <path d="M150 150h140M150 176h100" {...S} strokeWidth="5" />
      {[0, 1, 2].map((r) => (
        <g key={r}>
          <rect x="150" y={210 + r * 40} width="230" height="26" rx="6" {...card} fill="var(--stone)" />
          <rect x="400" y={210 + r * 40} width="110" height="26" rx="6" {...card} />
        </g>
      ))}
      <path d="M290 360v50h80v-50M250 410h160" {...S} />
      <g className={lift}>
        <rect x="560" y="180" width="140" height="190" rx="8" {...card} />
        <path d="M584 214h92M584 240h70M584 266h86" {...S} opacity=".5" />
        <rect x="584" y="300" width="92" height="40" rx="20" fill={A} stroke="var(--ink)" strokeWidth="2" />
        <path d="M600 320h60" {...S} strokeWidth="3" />
      </g>
    </>
  ),
  // Green's steps: the carbon credit price over time, with a leaf coin bought and one sold.
  carbonmarket: (
    <>
      <path d="M120 420h560M120 420V100" {...S} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const up = [1, 0, 1, 1, 0, 1, 1, 1][i];
        const y = 340 - i * 26;
        return (
          <g key={i}>
            <path d={`M${170 + i * 60} ${y - 40}v100`} {...S} opacity=".6" />
            <rect
              x={158 + i * 60}
              y={up ? y - 20 : y}
              width="24"
              height="44"
              rx="4"
              fill={up ? A : 'var(--paper)'}
              stroke="var(--ink)"
              strokeWidth="2"
            />
          </g>
        );
      })}
      <g className={lift}>
        <circle cx="260" cy="140" r="50" {...card} fill={A} />
        <path d="M260 170c-26 0-36-24-36-46 22 0 36 14 36 46zM260 170c0-28 14-44 38-44 0 26-14 44-38 44z" {...card} />
      </g>
      <path d="M560 110l60-40M620 70h-26M620 70v26" {...S} strokeWidth="3" />
    </>
  ),
  // Intern's steps: a task board moving from to-do to done, with a trophy at the end.
  taskboard: (
    <>
      {[0, 1, 2].map((c) => (
        <g key={c}>
          <rect x={110 + c * 190} y="90" width="170" height="320" rx="16" {...card} fill="var(--stone)" />
          <path d={`M${132 + c * 190} 124h70`} {...S} strokeWidth="5" />
          {[0, 1, 2 - c]
            .filter((r) => r >= 0)
            .map((r) => (
              <rect
                key={r}
                x={126 + c * 190}
                y={150 + r * 76}
                width="138"
                height="62"
                rx="10"
                {...card}
                fill={c === 2 ? A : 'var(--paper)'}
              />
            ))}
        </g>
      ))}
      <g className={lift}>
        <path d="M660 150h80v40a40 40 0 0 1-80 0z" {...card} fill={A} />
        <path d="M660 160h-24a20 20 0 0 0 24 30M740 160h24a20 20 0 0 1-24 30" {...S} />
        <path d="M700 230v30M676 262h48" {...S} strokeWidth="5" />
      </g>
    </>
  ),
  // AI's steps: a long document goes in, a spark reads it, a short summary comes out.
  summary: (
    <>
      <rect x="90" y="90" width="180" height="250" rx="12" {...card} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path key={i} d={`M114 ${126 + i * 28}h${130 - (i % 3) * 20}`} {...S} opacity=".45" />
      ))}
      <path d="M290 215h70" {...S} strokeWidth="3" strokeDasharray="4 8" />
      <g className={lift}>
        <circle cx="410" cy="215" r="58" {...card} fill={A} />
        <path d="M410 175l12 28 28 12-28 12-12 28-12-28-28-12 28-12z" {...card} />
      </g>
      <path d="M470 215h70" {...S} strokeWidth="3" strokeDasharray="4 8" />
      <rect x="560" y="150" width="160" height="130" rx="12" {...card} />
      <path d="M584 186h112M584 214h86M584 242h100" {...S} strokeWidth="4" />
      <Person x={410} y={360} />
    </>
  ),
  // Vault's steps: files in folders going up to safe storage, each with a lock.
  cloudfiles: (
    <>
      <path
        d="M250 210c-50 0-80-30-80-66s34-66 80-60c16-40 60-60 100-50 40-30 110-10 120 44 50 0 80 30 80 66s-30 66-80 66z"
        {...card}
      />
      <g className={lift}>
        <rect x="370" y="130" width="70" height="56" rx="10" {...card} fill={A} />
        <path d="M384 130v-14a21 21 0 0 1 42 0v14" {...S} strokeWidth="3" />
      </g>
      <path d="M300 300v-70M500 300v-70M405 300v-70" {...S} strokeDasharray="4 8" strokeWidth="3" />
      {[240, 440].map((x, i) => (
        <g key={x}>
          <path d={`M${x} 320h70l16 18h94v100H${x}z`} {...card} fill={i ? 'var(--paper)' : 'var(--stone)'} />
          <circle cx={x + 130} cy="410" r="14" fill={A} stroke="var(--ink)" strokeWidth="2" />
        </g>
      ))}
      <rect x="370" y="330" width="60" height="80" rx="6" {...card} />
      <path d="M384 356h32M384 376h24" {...S} opacity=".5" />
    </>
  ),
  // One's partners: a wallet filling with the share from each completed order.
  commission: (
    <>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={110} y={110 + i * 96} width="190" height="70" rx="12" {...card} />
          <path d={`M130 ${136 + i * 96}h90M130 ${156 + i * 96}h60`} {...S} opacity=".5" />
          <circle cx="270" cy={145 + i * 96} r="14" fill={A} stroke="var(--ink)" strokeWidth="2" />
          <path d={`M300 ${145 + i * 96}C380 ${145 + i * 96} 400 250 470 250`} {...S} strokeDasharray="4 8" />
        </g>
      ))}
      <g className={lift}>
        <rect x="470" y="170" width="230" height="170" rx="22" {...card} fill="var(--ink)" />
        <rect x="600" y="220" width="120" height="70" rx="14" {...card} />
        <circle cx="640" cy="255" r="12" fill={A} stroke="var(--ink)" strokeWidth="2" />
      </g>
      {[0, 1, 2].map((i) => (
        <ellipse key={i} cx="585" cy={410 - i * 18} rx="56" ry="16" {...card} fill={A} />
      ))}
    </>
  ),
  // Capital's steps: a waitlist with your name in it, and a bell for when it opens.
  waitlist: (
    <>
      <rect x="200" y="80" width="300" height="350" rx="20" {...card} />
      <path d="M230 120h140" {...S} strokeWidth="6" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <circle
            cx="250"
            cy={180 + i * 50}
            r="14"
            fill={i === 2 ? A : 'var(--stone)'}
            stroke="var(--ink)"
            strokeWidth="2"
          />
          <path
            d={`M280 ${180 + i * 50}h${150 - (i % 2) * 40}`}
            {...S}
            strokeWidth={i === 2 ? 5 : 2}
            opacity={i === 2 ? 1 : 0.45}
          />
        </g>
      ))}
      <g className={lift}>
        <path d="M580 160c-40 0-60 30-60 70v50l-20 30h160l-20-30v-50c0-40-20-70-60-70z" {...card} fill={A} />
        <path d="M560 330a20 20 0 0 0 40 0M580 160v-20" {...S} strokeWidth="3" />
      </g>
      <path d="M660 180c16 14 16 46 0 60M680 160c28 24 28 76 0 100" {...S} opacity=".5" />
    </>
  ),
  // Bharat ID's steps: details shared with a business only once the holder agrees.
  consent: (
    <>
      <rect x="110" y="110" width="180" height="300" rx="26" {...card} />
      <circle cx="200" cy="200" r="34" fill="var(--on-inverse)" stroke="var(--inverse)" strokeWidth="2" />
      <path d="M150 280h100M150 306h70" {...S} opacity=".5" />
      <g className={lift}>
        <rect x="140" y="340" width="120" height="44" rx="22" fill={A} stroke="var(--ink)" strokeWidth="2" />
        <circle cx="236" cy="362" r="16" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
      </g>
      <path d="M300 260h200" {...S} strokeWidth="3" strokeDasharray="4 8" />
      <path d="M500 260l-18-12v24z" fill="var(--ink)" />
      <path d="M530 170l90-50 90 50z" {...card} />
      <rect x="540" y="170" width="160" height="16" {...card} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={556 + i * 52} y="192" width="22" height="120" rx="4" {...card} />
      ))}
      <rect x="530" y="312" width="180" height="20" {...card} fill="var(--ink)" />
      <circle cx="620" cy="390" r="34" fill={A} stroke="var(--ink)" strokeWidth="2" />
      <Check x={620} y={390} size={1.2} />
    </>
  ),
  // Giftox's steps: the box opened, with what was packed inside and a card.
  unboxing: (
    <>
      <path d="M220 250h360v180H220z" {...card} fill={A} />
      <path d="M400 250v180" {...S} />
      <g className={lift}>
        <path d="M220 250l-40-90 180 20 40 70z" {...card} />
        <path d="M580 250l40-90-180 20-40 70z" {...card} />
      </g>
      <rect x="290" y="170" width="60" height="100" rx="10" {...card} />
      <circle cx="420" cy="190" r="34" {...card} fill="var(--stone)" />
      <rect x="470" y="160" width="40" height="110" rx="8" {...card} />
      <path d="M470 186h40" {...S} />
      <rect x="610" y="300" width="120" height="86" rx="8" {...card} transform="rotate(-8 670 343)" />
      <path d="M628 328l84-12M630 350l60-8" {...S} opacity=".5" transform="rotate(-8 670 343)" />
      <path
        d="M160 120l8-18 8 18 18 8-18 8-8 18-8-18-18-8zM650 110l6-14 6 14 14 6-14 6-6 14-6-14-14-6z"
        {...card}
        fill={A}
      />
    </>
  ),
};
