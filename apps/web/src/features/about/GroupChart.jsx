// About: the group as a chart. The company on top, its four parts under it, and the bodies run on their own below.
import {Link} from 'react-router-dom';
import {PRODUCTS} from '@pirento/shared';
import {ALONGSIDE, COMPANY, FOUNDATION, TOOLS, VENTURES} from '../../data/group';
import {brand} from '../../data/site';

// `tick` draws the short line from the cross line down to the box, where the four boxes sit in one row.
const Box = ({title, sub, tick, children}) => (
  <div className="relative rounded-[18px] border border-rule bg-paper p-5" data-reveal>
    {tick && <span aria-hidden className="absolute -top-8 left-1/2 hidden h-8 w-px bg-rule lg:block" />}
    <h3 className="text-lg">{title}</h3>
    {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    {children}
  </div>
);

const Names = ({items}) => (
  <ul className="mt-4 space-y-1.5 text-sm">
    {items.map((x) => (
      <li key={x.name}>{x.name}</li>
    ))}
  </ul>
);

export function GroupChart() {
  return (
    <div className="mt-16">
      <div className="mx-auto max-w-md rounded-[18px] bg-inverse p-6 text-center text-on-inverse" data-reveal>
        <p className="text-xs tracking-[0.12em] uppercase opacity-70">The company</p>
        <h3 className="mt-2 text-xl">{COMPANY.name}</h3>
        <p className="mt-1 text-sm opacity-70">CIN {brand.cin}</p>
      </div>
      {/* The connector: one line down, then across the four parts (the cross line only where they sit in a row). */}
      <div aria-hidden className="mx-auto h-8 w-px bg-rule" />
      <div aria-hidden className="mx-[12.5%] hidden h-px bg-rule lg:block" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:pt-8">
        <Box tick title="Pirento Ecosystem" sub={`The brand: ${PRODUCTS.length} products on one account.`}>
          <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
            {PRODUCTS.map((p) => (
              <li key={p.slug} className="min-w-0">
                <Link to={`/${p.slug}`} className="flex items-center gap-2 hover:underline">
                  <span aria-hidden className="size-2 shrink-0 rounded-[2px]" style={{background: p.color}} />
                  <span className="truncate">{p.short}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Box>
        <Box tick title={FOUNDATION.name} sub="The social-impact arm. Registration pending.">
          <Names items={FOUNDATION.programmes.map((p) => ({name: p.title}))} />
        </Box>
        <Box tick title="Ventures" sub="Businesses run with the company.">
          <Names items={VENTURES} />
        </Box>
        <Box tick title="Tools" sub="Software the group runs on.">
          <Names items={TOOLS} />
        </Box>
      </div>
      <p className="mt-12 mb-4 flex items-center gap-4 text-xs tracking-[0.12em] text-muted uppercase">
        <span className="h-px flex-1 border-t border-dashed border-rule" /> Run on their own
        <span className="h-px flex-1 border-t border-dashed border-rule" />
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {ALONGSIDE.map((a) => (
          <Box key={a.name} title={a.name} sub={a.note} />
        ))}
      </div>
    </div>
  );
}
