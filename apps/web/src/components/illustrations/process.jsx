// Hand-drawn process scenes (people at work, papers, filing, dates, costs) in the same line style as Illustration:
// ink lines, paper cards, one accent, all from theme variables so they follow light and dark. viewBox 800×500.
import {A, Check, Person, S, card, lift} from './parts';

export const PROCESS_SCENES = {
  // Two people at a desk going through an open file: agreeing the scope.
  meeting: (
    <>
      <path d="M640 120h60M640 120v240" {...S} opacity=".5" />
      <rect x="596" y="160" width="40" height="70" rx="6" {...card} />
      <rect x="606" y="142" width="40" height="88" rx="6" {...card} fill={A} />
      <Person x={290} y={170} shirt={A} long />
      <Person x={500} y={176} />
      <rect x="110" y="330" width="580" height="22" rx="8" {...card} />
      <path d="M150 352v90M650 352v90" {...S} />
      <path d="M150 330l40-50h110l20 50z" {...card} />
      <path d="M190 280l14 30" {...S} opacity=".5" />
      <g className={lift}>
        <path d="M340 330l20-46h80l20 46z" {...card} />
        <path d="M400 284v46" {...S} />
        <path d="M356 300h34M352 314h38M410 300h34M412 314h38" {...S} opacity=".5" />
      </g>
      <path d="M560 300l44-20" {...S} strokeWidth="3" />
      <path d="M590 330c0-26 22-26 22-26s22 0 22 26" {...card} fill={A} />
    </>
  ),
  // A building with its papers: the company and its registered office.
  office: (
    <>
      <ellipse
        cx="400"
        cy="420"
        rx="300"
        ry="26"
        fill="var(--stone)"
        stroke="var(--ink)"
        strokeWidth="2"
        opacity=".6"
      />
      <rect x="230" y="120" width="230" height="300" rx="6" {...card} />
      <path d="M220 120h250" {...S} strokeWidth="6" />
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2].map((c) => (
          <rect
            key={`${r}${c}`}
            x={252 + c * 68}
            y={146 + r * 56}
            width="48"
            height="36"
            rx="4"
            {...card}
            fill={r === 1 && c === 2 ? A : 'var(--paper)'}
          />
        )),
      )}
      <rect x="318" y="356" width="54" height="64" rx="4" {...card} fill="var(--ink)" />
      <circle cx="190" cy="330" r="44" {...card} />
      <path d="M190 330v90M190 360l-18-18M190 370l18-18" {...S} />
      <g className={lift}>
        <path d="M480 190l130-18 26 230-130 18z" {...card} />
        <path d="M508 226l90-12M512 256l86-12M516 286l60-8" {...S} opacity=".5" />
        <circle cx="580" cy="360" r="22" fill={A} stroke="var(--ink)" strokeWidth="2" />
        <Check x={580} y={360} size={0.8} />
      </g>
      <rect x="610" y="250" width="70" height="170" rx="8" {...card} fill="var(--ink)" />
    </>
  ),
  // A magnifier over the company's papers and a bright idea: name, activity and ownership checked together.
  search: (
    <>
      <rect x="250" y="130" width="300" height="230" rx="18" {...card} />
      <rect x="290" y="180" width="56" height="70" rx="4" {...card} fill={A} />
      <path d="M300 196h12M300 212h12M300 228h12M322 196h12M322 212h12M322 228h12" {...S} />
      <path d="M370 196h140M370 222h110M370 248h130M290 296h220M290 322h160" {...S} opacity=".5" />
      <g className={lift}>
        <circle cx="430" cy="270" r="96" {...card} fill="var(--stone)" fillOpacity=".55" />
        <circle cx="430" cy="270" r="96" {...S} strokeWidth="10" />
        <path d="M500 340l90 90" {...S} strokeWidth="22" />
      </g>
      <circle cx="610" cy="120" r="34" fill={A} stroke="var(--ink)" strokeWidth="2" />
      <path d="M598 156h24M600 168h20M610 92v-26M650 120h26M570 120h-26M640 90l18-18M580 90l-18-18" {...S} />
      <Person x={160} y={230} shirt={A} long />
    </>
  ),
  // Three cards ticked off on one path: every stage has an input and a review point.
  filing: (
    <>
      <path d="M140 410h520" {...S} strokeDasharray="2 12" strokeWidth="4" />
      {[
        [170, 170, A, 0],
        [330, 120, 'var(--paper)', 1],
        [490, 180, 'var(--paper)', 2],
      ].map(([x, y, fill, i]) => (
        <g key={x} className={i === 1 ? lift : undefined}>
          <rect x={x} y={y} width="140" height="180" rx="14" {...card} />
          <path d={`M${x + 24} ${y + 34}h92M${x + 24} ${y + 58}h60`} {...S} strokeWidth="6" />
          <rect x={x + 30} y={y + 96} width="80" height="56" rx="10" fill={fill} stroke="var(--ink)" strokeWidth="2" />
          <Check x={x + 70} y={y + 122} />
          <circle cx={x + 70} cy={410} r="10" fill={i === 0 ? A : 'var(--paper)'} stroke="var(--ink)" strokeWidth="2" />
        </g>
      ))}
      <path d="M650 410l-16-10v20z" fill="var(--ink)" />
    </>
  ),
  // A calendar with marked dates and a clock: what changes how long it takes.
  calendar: (
    <>
      <rect x="200" y="100" width="340" height="300" rx="18" {...card} />
      <rect x="200" y="100" width="340" height="64" rx="18" fill={A} stroke="var(--ink)" strokeWidth="2" />
      <path d="M260 84v40M480 84v40" {...S} strokeWidth="6" />
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3, 4].map((c) => (
          <rect
            key={`${r}${c}`}
            x={226 + c * 60}
            y={188 + r * 50}
            width="44"
            height="34"
            rx="6"
            {...card}
            fill={(r === 1 && c === 3) || (r === 3 && c === 1) ? A : 'var(--paper)'}
          />
        )),
      )}
      <g className={lift}>
        <circle cx="560" cy="360" r="74" {...card} />
        <path d="M560 360v-44M560 360l30 18" {...S} strokeWidth="4" />
        <circle cx="560" cy="360" r="6" fill="var(--ink)" />
      </g>
    </>
  ),
  // A bill with its parts and a stack of coins: the fee read part by part.
  costs: (
    <>
      <path
        d="M230 90h250v300l-20 14-20-14-20 14-20-14-20 14-20-14-20 14-20-14-20 14-20-14-20 14-20-14-20 14z"
        {...card}
      />
      <text x="262" y="170" fontSize="64" fontWeight="600" fill="var(--ink)">
        ₹
      </text>
      <path d="M320 150h120M320 176h80M262 230h190M262 266h150M262 302h170" {...S} opacity=".5" />
      <path d="M262 340h190" {...S} strokeWidth="4" />
      <g className={lift}>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <ellipse cx="570" cy={392 - i * 26} rx="64" ry="20" {...card} fill={i === 3 ? A : 'var(--paper)'} />
            <path d={`M506 ${392 - i * 26}v14M634 ${392 - i * 26}v14`} {...S} />
          </g>
        ))}
      </g>
    </>
  ),
  // A folder handed over with a sealed certificate: what you receive at the end.
  handover: (
    <>
      <path d="M190 200h150l30 30h240v190H190z" {...card} fill="var(--ink)" />
      <g className={lift}>
        <rect x="260" y="110" width="290" height="220" rx="12" {...card} />
        <path d="M300 160h210M300 196h170M300 232h190" {...S} opacity=".5" />
        <circle cx="480" cy="290" r="34" fill={A} stroke="var(--ink)" strokeWidth="2" />
        <Check x={480} y={290} />
      </g>
      <path d="M190 260h420v160H190z" {...card} />
      <path d="M190 260l40 160M610 260l-40 160" {...S} opacity=".35" />
      <path
        d="M640 140l10-24 10 24 24 10-24 10-10 24-10-24-24-10zM150 150l6-14 6 14 14 6-14 6-6 14-6-14-14-6z"
        {...card}
        fill={A}
      />
    </>
  ),
  // Two speech bubbles, a question and an answer: questions before you buy.
  questions: (
    <>
      <path
        d="M150 110h300a24 24 0 0 1 24 24v120a24 24 0 0 1-24 24H250l-50 40v-40h-50a24 24 0 0 1-24-24V134a24 24 0 0 1 24-24z"
        {...card}
      />
      <text x="282" y="232" fontSize="110" fontWeight="600" fill="var(--ink)">
        ?
      </text>
      <g className={lift}>
        <path
          d="M380 260h250a24 24 0 0 1 24 24v90a24 24 0 0 1-24 24h-40v36l-44-36H380a24 24 0 0 1-24-24v-90a24 24 0 0 1 24-24z"
          {...card}
          fill={A}
        />
        <path d="M410 310h190M410 346h130" {...S} strokeWidth="5" />
      </g>
    </>
  ),
  // Bars rising to a flag: what it gives you.
  growth: (
    <>
      <path d="M150 420h500" {...S} />
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={200 + i * 100}
          y={330 - i * 60}
          width="64"
          height={90 + i * 60}
          rx="8"
          {...card}
          fill={i === 3 ? A : 'var(--paper)'}
        />
      ))}
      <g className={lift}>
        <path d="M232 300L332 236 432 180 532 118" {...S} strokeWidth="4" />
        <path d="M532 118V40" {...S} strokeWidth="4" />
        <path d="M532 40h70l-18 20 18 20h-70z" fill={A} stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
      </g>
    </>
  ),
};
