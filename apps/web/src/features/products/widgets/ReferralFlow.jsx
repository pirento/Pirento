// Pirento One: how a referral travels, drawn as a path from your code to your dashboard.
export function ReferralFlow({product}) {
  const steps = product.steps.filter((s) => !/^Sign in/.test(s.title));
  return (
    <ol className="relative grid gap-6 md:grid-cols-[repeat(var(--n),minmax(0,1fr))]" style={{'--n': steps.length}}>
      {/* The path: a hairline behind the stops on desktop. */}
      <span aria-hidden className="absolute top-6 right-[12%] left-[12%] hidden h-px bg-rule md:block" />
      {steps.map((s, i) => (
        <li key={s.title} className="relative flex gap-4 md:flex-col md:items-center md:text-center" data-reveal>
          <span
            className={`flex size-12 shrink-0 items-center justify-center rounded-full border text-sm tabular-nums ${
              i === steps.length - 1 ? 'border-accent bg-accent text-on-accent' : 'border-rule bg-paper'
            }`}
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          <span>
            <span className="block text-lg font-medium md:mt-5">{s.title}</span>
            <span className="mt-1 block text-sm text-muted md:mx-auto md:max-w-[16rem]">{s.body}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
