// Bharat ID dashboard: where the application stands (and the card once issued), and the application itself.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Check, Clock} from 'lucide-react';
import {DashSection} from '../../components/ui/DashSection';
import {Tag} from '../../components/ui/Tag';
import {appDashboards} from '../../data/site';
import {useSignedIn} from '../auth/useSignedIn';
import {AppFrame} from '../products/AppFrame';
import {IdCard} from './IdCard';
import {SectionSummary} from './SectionSummary';
import {Wizard} from './Wizard';
import {useSession} from '../../lib/api/session';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';
import {usePageMeta} from '../../lib/page';

const copy = appDashboards['bharat-id'];

/** How far along the application is, as an index into copy.steps (fill, video, submit, review, issued). */
function stepOf(doc) {
  if (!doc) return 0;
  if (doc.status === 'approved') return 5;
  if (doc.status === 'submitted') return 3;
  return doc.kyc?.recordedAt ? 2 : doc.sections && Object.keys(doc.sections).length ? 1 : 0;
}

function Timeline({at}) {
  return (
    <ol className="grid gap-3 sm:grid-cols-5">
      {copy.steps.map((label, i) => {
        const done = i < at;
        const now = i === at;
        return (
          <li
            key={label}
            className={`flex items-center gap-3 rounded-[14px] border p-4 text-sm ${now ? 'border-ink' : 'border-rule'}`}
            aria-current={now ? 'step' : undefined}
          >
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs ${done ? 'border-ink bg-ink text-paper' : 'border-rule'}`}
            >
              {done ? <Check aria-hidden className="size-3.5" /> : i + 1}
            </span>
            <span className={done || now ? '' : 'text-muted'}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function BharatId({product, section}) {
  const {redirect, user} = useSignedIn();
  const {user: me} = useSession();
  const res = useApi(user ? '/identity/me' : null);
  const [fresh, setFresh] = useState(null);
  usePageMeta({
    title: 'Bharat ID — apply',
    description: 'Apply for your Bharat ID: seven short steps and a short video.',
  });
  if (redirect) return redirect;
  const doc = fresh ?? res.data;
  const frame = {product, section, ready: !res.loading};

  if (section === 'apply') {
    return (
      <AppFrame {...frame} title={copy.apply.title} intro={copy.intro}>
        {res.loading ? null : doc?.status === 'approved' || doc?.status === 'submitted' ? (
          <SectionSummary sections={doc.sections} email={me?.email} kyc={doc.kyc ?? null} />
        ) : (
          <>
            {doc?.status === 'rejected' && (
              <div role="status" className="max-w-3xl rounded-[22px] border border-accent p-6">
                <p className="font-medium">Your application needs a change</p>
                <p className="body mt-2">
                  <strong>Reason:</strong> {doc.reason}. Fix the step, then submit again from the last step.
                </p>
              </div>
            )}
            <Wizard key={doc?.status ?? 'new'} doc={doc} email={me?.email} onChange={setFresh} />
          </>
        )}
      </AppFrame>
    );
  }

  // Overview
  const at = stepOf(doc);
  return (
    <AppFrame {...frame} title={copy.hello} intro={copy.intro}>
      {doc?.status === 'approved' && (
        <DashSection n={1} id="card" label={copy.card.label} title={copy.card.title}>
          <IdCard doc={doc} />
        </DashSection>
      )}
      <DashSection
        n={doc?.status === 'approved' ? 2 : 1}
        id="status"
        label={copy.status.label}
        title={copy.status.title}
      >
        {!res.loading && (
          <>
            <Timeline at={at} />
            <div className="mt-8 max-w-3xl">
              {doc?.status === 'submitted' && (
                <p className="flex items-start gap-3">
                  <Clock aria-hidden className="mt-1 size-5 shrink-0" />
                  <span className="body">
                    <Tag tone="accent">In review</Tag> Submitted on {formatDate(doc.submittedAt)}. Our team checks your
                    details by hand; your ID appears here once it is approved, and we email you.
                  </span>
                </p>
              )}
              {doc?.status === 'rejected' && (
                <p className="body">
                  <strong>Needs a change:</strong> {doc.reason}.{' '}
                  <Link to="/bharat-id/dashboard/apply" className="text-ink underline underline-offset-4">
                    Fix it and submit again
                  </Link>
                </p>
              )}
              {doc?.status === 'approved' && (
                <p className="body">
                  Issued on {formatDate(doc.issuedAt)}. Anyone you share your ID with can check it on{' '}
                  <Link to={`/verify/${doc.bharatId}`} className="text-ink underline underline-offset-4">
                    its verify page
                  </Link>
                  .
                </p>
              )}
              {(!doc || doc.status === 'draft') && (
                <Link
                  to="/bharat-id/dashboard/apply"
                  className="inline-flex rounded-full bg-accent px-6 py-3 text-sm font-medium text-on-accent"
                >
                  {at === 0 ? 'Start your application' : 'Continue your application'}
                </Link>
              )}
            </div>
          </>
        )}
      </DashSection>
    </AppFrame>
  );
}
