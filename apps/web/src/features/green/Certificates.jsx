// Pirento Green → Certificates: one per planted sponsorship, each opening its printable certificate.
import {Link} from 'react-router-dom';
import {Award, Clock} from 'lucide-react';
import {greenCertNo, hasGreenCert, isDonation} from '@pirento/shared';
import {green} from '../../data/site';
import {formatDay} from '../../lib/format';

const copy = green.certificate;
const LIVE = ['paid', 'in_progress', 'completed'];

export function Certificates({mine, loading}) {
  const live = mine.filter((o) => LIVE.includes(o.status));
  if (!loading && live.length === 0) return <p className="text-muted">{copy.empty}</p>;
  return (
    <>
      <p className="body -mt-2 mb-8">{copy.intro}</p>
      <ul className="border-t border-rule">
        {live.map((o) => {
          const ready = hasGreenCert(o);
          const kind = isDonation(o) ? copy.donate : copy.invest;
          return (
            <li key={o._id} className="flex flex-wrap items-center gap-4 border-b border-rule py-5" data-reveal>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-rule">
                {ready ? <Award aria-hidden className="size-4" /> : <Clock aria-hidden className="size-4" />}
              </span>
              <span className="min-w-0 flex-1 basis-56">
                <span className="block font-medium">{kind.title}</span>
                <span className="block text-sm break-words text-muted">
                  {o.quantity} tree{o.quantity === 1 ? '' : 's'} · {o.serviceName.replace(/^Sponsor trees · /, '')}
                  {ready ? (
                    <>
                      {' · '}
                      <span className="whitespace-nowrap">{greenCertNo(o)}</span> · issued {formatDay(o.fulfilment.at)}
                    </>
                  ) : (
                    ` · ${copy.waiting}`
                  )}
                </span>
              </span>
              {ready && (
                <Link
                  to={`/green/dashboard/certificates/${o._id}`}
                  className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent"
                >
                  Download
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
