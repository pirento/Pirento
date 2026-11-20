// One numbered dashboard section: "01 / Label", a short heading, an optional link on the right, a hairline above.
import {Label} from '../../components/ui/Heading';

export function DashSection({n, id, label, title, action, children}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 border-t border-rule pt-8 md:pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Label n={n}>{label}</Label>
          <h2 id={`${id}-h`} className="mt-4 text-[clamp(1.6rem,2.6vw,2.25rem)] leading-[1.05]">
            {/* "Line one / Line two", as in every heading on the site. */}
            {title.split(' / ').map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
        </div>
        {action}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}
