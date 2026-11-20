// Bharat ID dashboard: the application, its review status, or the issued card.
import {useRef, useState} from 'react';
import {Clock} from 'lucide-react';
import {PageHero} from '../../components/PageHero';
import {Section} from '../../components/ui/Heading';
import {Tag} from '../../components/ui/Tag';
import {useSignedIn} from '../auth/useSignedIn';
import {IdCard} from './IdCard';
import {SectionSummary} from './SectionSummary';
import {Wizard} from './Wizard';
import {useSession} from '../../lib/api/session';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';

export function BharatId() {
  const {redirect, user} = useSignedIn();
  const {user: me} = useSession();
  const res = useApi(user ? '/identity/me' : null);
  const [fresh, setFresh] = useState(null);
  const ref = useRef(null);
  usePageMotion(ref, [res.loading]);
  usePageMeta({
    title: 'Bharat ID — apply',
    description: 'Apply for your Bharat ID: seven short steps and a short video.',
  });
  if (redirect) return redirect;
  const doc = fresh ?? res.data;

  return (
    <div ref={ref}>
      <PageHero
        label="Bharat ID · Dashboard"
        title="One identity, / checked once."
        hl="checked once."
        intro="Seven short steps, a 20-second video, then review. Your progress is saved after each step, so you can stop and come back."
      />
      <Section className="pt-0! md:pt-0!">
        {res.loading ? null : doc?.status === 'approved' ? (
          <IdCard doc={doc} />
        ) : doc?.status === 'submitted' ? (
          <div className="max-w-3xl space-y-6">
            <div className="flex items-start gap-4 rounded-[22px] border border-rule p-8">
              <Clock aria-hidden className="mt-1 size-5" />
              <div>
                <Tag tone="accent">In review</Tag>
                <p className="body mt-4">
                  Submitted on {formatDate(doc.submittedAt)}. Our team checks your details by hand; your ID appears here
                  once it is approved.
                </p>
              </div>
            </div>
            <SectionSummary sections={doc.sections} email={me?.email} kyc={doc.kyc ?? null} />
          </div>
        ) : (
          <>
            {doc?.status === 'rejected' && (
              <div role="status" className="mb-10 max-w-3xl rounded-[22px] border border-accent p-6">
                <p className="font-medium">Your application needs a change</p>
                <p className="body mt-2">
                  <strong>Reason:</strong> {doc.reason}. Fix the step, then submit again from the last step.
                </p>
              </div>
            )}
            <Wizard key={doc?.status ?? 'new'} doc={doc} email={me?.email} onChange={setFresh} />
          </>
        )}
      </Section>
    </div>
  );
}

// ── Staff review ─────────────────────────────────────────────────────────
