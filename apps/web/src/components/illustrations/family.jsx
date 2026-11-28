// One small scene per card in the home's family stacks (the Foundation's programmes, the ventures, the bodies
// alongside), each drawn once and used only there. Same line style and theme colours as the other scenes. 800×500.
import {A, S, card, lift} from './parts';

const ground = <path d="M120 430h560" {...S} strokeWidth="4" />;
const sparkle = (x, y, r = 12) =>
  `M${x} ${y - 2 * r}l${r * 0.8} ${r * 1.2} ${r * 1.2} ${r * 0.8}-${r * 1.2} ${r * 0.8}-${r * 0.8} ${r * 1.2}-${r * 0.8}-${r * 1.2}-${r * 1.2}-${r * 0.8} ${r * 1.2}-${r * 0.8}z`;

export const FAMILY_SCENES = {
  // Foundation · Pirento Green: three young native trees, the middle one marked on the map.
  saplings: (
    <>
      {ground}
      {[
        [220, 130, 50],
        [400, 170, 64],
        [580, 130, 50],
      ].map(([x, h, r]) => (
        <g key={x}>
          <path d={`M${x} 430v-${h}`} {...S} strokeWidth="5" />
          <circle cx={x} cy={430 - h} r={r} {...card} fill={x === 400 ? A : 'var(--paper)'} />
          <path d={`M${x - 34} 430c6-20 20-28 34-28s28 8 34 28`} {...card} />
        </g>
      ))}
      <g className={lift}>
        <path d="M400 60c-28 0-46 20-46 44 0 34 46 72 46 72s46-38 46-72c0-24-18-44-46-44z" {...card} />
        <circle cx="400" cy="104" r="14" fill={A} stroke="var(--ink)" strokeWidth="2" />
      </g>
    </>
  ),
  // Foundation · Food and relief: a sack of grain beside a warm bowl.
  ration: (
    <>
      {ground}
      <g className={lift}>
        <path d="M210 430q-34-120 26-200l-20-44h150l-20 44q60 80 26 200z" {...card} />
        <path d="M236 230h106" {...S} strokeWidth="4" />
        <path d="M250 330h80M262 360h56" {...S} opacity=".5" />
      </g>
      <path d="M450 330h240c0 64-52 96-120 96s-120-32-120-96z" {...card} fill={A} />
      <path d="M436 330h268" {...S} strokeWidth="4" />
      <path d="M530 290c-16-20 16-30 0-52M570 290c-16-20 16-30 0-52M610 290c-16-20 16-30 0-52" {...S} strokeWidth="3" />
    </>
  ),
  // Foundation · Education: a school bag, a pencil and two books.
  schoolbag: (
    <>
      {ground}
      <g className={lift}>
        <path d="M310 150v-30c0-36 120-36 120 0v30" {...S} strokeWidth="6" />
        <rect x="260" y="150" width="220" height="280" rx="44" {...card} />
        <rect x="290" y="280" width="160" height="110" rx="20" {...card} fill={A} />
        <path d="M330 310h80" {...S} strokeWidth="4" />
      </g>
      <g transform="rotate(-28 610 250)">
        <rect x="530" y="235" width="150" height="30" rx="4" {...card} />
        <path d="M680 235l30 15-30 15z" {...card} />
        <path d="M556 235v30" {...S} />
      </g>
      <rect x="530" y="396" width="160" height="34" rx="4" {...card} />
      <rect x="544" y="362" width="132" height="34" rx="4" {...card} fill={A} />
    </>
  ),
  // Foundation · Health and livelihood: a camp tent with a medical cross, and a spool of thread for training.
  healthcamp: (
    <>
      {ground}
      <path d="M140 430L320 170l180 260z" {...card} />
      <path d="M274 430l46-110 46 110" {...card} fill="var(--stone)" />
      <g className={lift}>
        <circle cx="590" cy="220" r="70" {...card} fill={A} />
        <path d="M590 184v72M554 220h72" stroke="var(--on-accent)" strokeWidth="18" strokeLinecap="round" />
      </g>
      <rect x="550" y="334" width="80" height="18" rx="4" {...card} />
      <rect x="560" y="352" width="60" height="58" {...card} />
      <rect x="550" y="410" width="80" height="18" rx="4" {...card} />
      <path d="M560 370h60M560 392h60" {...S} opacity=".5" />
    </>
  ),
  // A T Elevator: lift doors, the floor sign above and the call buttons beside.
  liftdoors: (
    <>
      {ground}
      <rect x="250" y="90" width="300" height="340" rx="14" {...card} />
      <rect x="276" y="144" width="122" height="286" {...card} fill="var(--stone)" />
      <rect x="402" y="144" width="122" height="286" {...card} fill="var(--stone)" />
      <g className={lift}>
        <rect x="360" y="104" width="80" height="28" rx="8" {...card} fill={A} />
        <path d="M390 124l10-12 10 12" stroke="var(--on-accent)" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
      <rect x="590" y="220" width="60" height="124" rx="14" {...card} />
      <circle cx="620" cy="254" r="17" {...card} />
      <path d="M612 258l8-8 8 8" {...S} strokeWidth="3" />
      <circle cx="620" cy="308" r="17" {...card} fill={A} />
      <path d="M612 304l8 8 8-8" {...S} strokeWidth="3" />
    </>
  ),
  // A T Facility: a bucket and a mop, the floor shining.
  mop: (
    <>
      {ground}
      <path d="M250 310h180l-20 120H270z" {...card} fill={A} />
      <path d="M262 310c0-64 156-64 156 0" {...S} strokeWidth="4" />
      <g className={lift}>
        <g transform="rotate(12 540 260)">
          <path d="M540 80v270" {...S} strokeWidth="8" />
          <path d="M490 350h100l12 74H478z" {...card} />
          <path d="M500 362v56M520 362v56M540 362v56M560 362v56M580 362v56" {...S} />
        </g>
      </g>
      <path d={`${sparkle(190, 190)}${sparkle(660, 170, 9)}`} {...card} />
    </>
  ),
  // Inzario Space: a sofa under a framed picture, a floor lamp beside.
  sofa: (
    <>
      {ground}
      <rect x="300" y="80" width="200" height="124" rx="8" {...card} />
      <path d="M320 184l50-52 40 40 30-30 40 42" {...S} />
      <g className={lift}>
        <rect x="220" y="256" width="360" height="110" rx="30" {...card} fill={A} />
        <rect x="180" y="300" width="70" height="110" rx="24" {...card} />
        <rect x="550" y="300" width="70" height="110" rx="24" {...card} />
        <rect x="240" y="330" width="320" height="64" rx="14" {...card} />
        <path d="M400 330v64" {...S} />
      </g>
      <path d="M226 410v20M574 410v20" {...S} strokeWidth="5" />
      <path d="M680 430V210" {...S} strokeWidth="4" />
      <path d="M640 210h80l-20-60h-40z" {...card} />
      <path d="M650 430h60" {...S} strokeWidth="5" />
    </>
  ),
  // Shri Sarraf: a ring set with a stone, and a pendant on a chain.
  ring: (
    <>
      <g className={lift}>
        <path
          fillRule="evenodd"
          d="M250 320a110 110 0 1 0 220 0a110 110 0 1 0-220 0zM274 320a86 86 0 1 0 172 0a86 86 0 1 0-172 0z"
          {...card}
        />
        <path d="M318 214l22-44h40l22 44-42 46z" {...card} fill={A} />
        <path d="M318 214h84M340 170l20 44 20-44" {...S} />
      </g>
      <path d="M500 110c20 170 200 170 220 0" {...S} strokeWidth="3" strokeDasharray="2 10" />
      <path d="M610 236l-18 28 18 28 18-28z" {...card} fill={A} />
      <path d={`${sparkle(200, 150, 10)}${sparkle(560, 400)}`} {...card} />
    </>
  ),
  // JBC Seva Trust: cupped hands holding a heart, a leaf beside for the trees it plants.
  carehands: (
    <>
      <path d="M190 360c70 60 350 60 420 0l46-66c12-18-10-34-26-20l-54 46H226l-54-46c-16-14-38 2-26 20z" {...card} />
      <path d="M300 410c60 14 140 14 200 0" {...S} opacity=".5" />
      <g className={lift}>
        <path
          d="M400 316c-70-44-110-78-110-122 0-30 24-52 52-52 24 0 44 14 58 38 14-24 34-38 58-38 28 0 52 22 52 52 0 44-40 78-110 122z"
          {...card}
          fill={A}
        />
      </g>
      <path d="M600 170c0-44 32-66 76-66 0 44-32 66-76 66z" {...card} />
      <path d="M600 170l40-34" {...S} />
    </>
  ),
};
