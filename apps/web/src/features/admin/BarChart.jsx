// A 30-day bar chart in plain SVG: one bar per day, empty days drawn as gaps.
const DAY = 86_400_000;

/** The last `days` calendar days as YYYY-MM-DD (UTC, matching the services' $dateToString). */
const lastDays = (days) =>
  Array.from({length: days}, (_, i) => new Date(Date.now() - (days - 1 - i) * DAY).toISOString().slice(0, 10));

export function BarChart({title, rows, value, format = String, days = 30}) {
  const byDay = Object.fromEntries((rows ?? []).map((r) => [r.day, value(r)]));
  const series = lastDays(days).map((day) => ({day, v: byDay[day] ?? 0}));
  const max = Math.max(1, ...series.map((s) => s.v));
  const total = series.reduce((sum, s) => sum + s.v, 0);
  const w = 100 / days;

  return (
    <figure className="rounded-[22px] border border-rule p-6" data-reveal>
      <figcaption className="flex items-baseline justify-between gap-4">
        <span className="eyebrow">{title}</span>
        <span className="num text-2xl!">{rows ? format(total) : '—'}</span>
      </figcaption>
      <svg
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        className="mt-6 h-32 w-full"
        role="img"
        aria-label={`${title}: ${format(total)} in ${days} days`}
      >
        {series.map((s, i) => (
          <rect
            key={s.day}
            x={i * w + w * 0.15}
            width={w * 0.7}
            y={40 - (s.v / max) * 38}
            height={(s.v / max) * 38}
            className="fill-ink"
          >
            <title>{`${s.day}: ${format(s.v)}`}</title>
          </rect>
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>{series[0].day.slice(5)}</span>
        <span>today</span>
      </div>
    </figure>
  );
}
