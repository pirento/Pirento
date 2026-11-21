// Pirento Intern dashboard: an overview, the final exams with every attempt, certificates, and openings.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Award, Check, Copy, GraduationCap, Megaphone} from 'lucide-react';
import {StatsRow} from '../../components/ui/Blocks';
import {Button} from '../../components/ui/Button';
import {DashSection} from '../../components/ui/DashSection';
import {Tag} from '../../components/ui/Tag';
import {appDashboards} from '../../data/site';
import {useSignedIn} from '../auth/useSignedIn';
import {AppFrame} from '../products/AppFrame';
import {Exam} from './Exam';
import {Openings} from './Openings';
import {StartForm} from './StartForm';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';
import {usePageMeta} from '../../lib/page';

const copy = appDashboards.intern;
const verifyUrl = (code) => `${window.location.origin}/verify/${code}`;

function CertificateCard({c}) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl(c.code));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked: the link is one click away on the certificate itself.
    }
  };
  return (
    <li className="flex flex-col rounded-[18px] border border-rule p-6" data-reveal>
      <Award aria-hidden className="size-6" />
      <span className="mt-5 block text-lg font-medium">{c.trackName}</span>
      <span className="text-sm text-muted">
        {c.code} · {c.percent}% · {formatDate(c.issuedAt)}
      </span>
      <span className="mt-6 flex flex-wrap gap-3">
        <Link to={`/verify/${c.code}`} className="text-sm underline underline-offset-4">
          View certificate
        </Link>
        <button
          type="button"
          onClick={share}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
        >
          {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
          {copied ? 'Link copied' : 'Copy verify link'}
        </button>
      </span>
    </li>
  );
}

function NextLink({to, icon: Icon, title, body}) {
  return (
    <li>
      <Link to={to} className="flex items-center gap-4 border-b border-rule py-4 hover:border-ink" data-reveal>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-rule">
          <Icon aria-hidden className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block font-medium">{title}</span>
          <span className="text-sm text-muted">{body}</span>
        </span>
      </Link>
    </li>
  );
}

export function Intern({product, section}) {
  const {redirect, user} = useSignedIn();
  const tracks = useApi('/learning/tracks');
  const me = useApi(user ? '/learning/me' : null);
  const openings = useApi('/learning/openings');
  const mine = useApi(user ? '/learning/openings/mine' : null);
  const [exam, setExam] = useState(null);
  const [result, setResult] = useState(null);
  usePageMeta({title: `Pirento Intern · ${section === 'overview' ? 'Dashboard' : section}`});
  if (redirect) return redirect;

  const certs = me.data?.certificates ?? [];
  const attempts = me.data?.attempts ?? [];
  const nameOf = (slug) => tracks.data?.find((t) => t.slug === slug)?.name ?? slug;
  const best = attempts.reduce((m, a) => Math.max(m, a.percent ?? 0), 0);
  const titleOf = (id) => openings.data?.find((o) => o._id === id)?.title ?? 'A closed opening';
  const frame = {product, section, ready: Boolean(me.data)};

  if (section === 'exams') {
    return (
      <AppFrame {...frame} title={copy.exams.title} intro={copy.intro}>
        {result ? (
          <div className="max-w-2xl rounded-[22px] border border-accent p-8" data-reveal>
            <Tag tone={result.passed ? 'accent' : 'rule'}>{result.passed ? 'Passed' : 'Not passed'}</Tag>
            <p className="num mt-6">{result.percent}%</p>
            {result.passed ? (
              <p className="body mt-4">
                Your certificate is ready:{' '}
                <Link to={`/verify/${result.certificate.code}`} className="text-ink underline underline-offset-4">
                  {result.certificate.code}
                </Link>
              </p>
            ) : (
              <p className="body mt-4">You need 60% to pass. You can try this track again in 24 hours.</p>
            )}
            <Button
              onClick={() => {
                setResult(null);
                me.reload();
              }}
              variant="outline"
              className="mt-8"
            >
              Back to tracks
            </Button>
          </div>
        ) : exam ? (
          <Exam
            exam={exam}
            onDone={(r) => {
              setExam(null);
              setResult(r);
            }}
          />
        ) : (
          <>
            <StatsRow
              compact
              stats={[
                {value: '10', label: 'questions per exam'},
                {value: '30', label: 'minutes on the clock'},
                {value: '60%', label: 'to pass'},
                {value: '24h', label: 'before a retake'},
              ]}
            />
            <DashSection n={1} id="start" label={copy.exams.label} title={copy.exams.title}>
              {tracks.data && (
                <StartForm tracks={tracks.data} certified={new Set(certs.map((c) => c.track))} onStart={setExam} />
              )}
            </DashSection>
            <DashSection n={2} id="history" label={copy.exams.history} title="Every score, / kept.">
              {attempts.length === 0 && <p className="text-muted">{copy.exams.noHistory}</p>}
              <ul className="border-t border-rule">
                {attempts.map((a) => (
                  <li
                    key={a._id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-rule py-4"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium">{nameOf(a.track)}</span>
                      <span className="text-sm text-muted">{formatDate(a.startedAt)}</span>
                    </span>
                    {a.submittedAt ? (
                      <span className="flex items-center gap-3">
                        <span className="tabular-nums">{a.percent}%</span>
                        <Tag tone={a.passed ? 'accent' : 'rule'}>{a.passed ? 'Passed' : 'Not passed'}</Tag>
                      </span>
                    ) : (
                      <Tag>In progress</Tag>
                    )}
                  </li>
                ))}
              </ul>
            </DashSection>
          </>
        )}
      </AppFrame>
    );
  }

  if (section === 'certificates') {
    return (
      <AppFrame {...frame} title={copy.certificates.title}>
        {me.data && certs.length === 0 && (
          <p className="text-muted">
            {copy.certificates.empty}{' '}
            <Link to="/intern/dashboard/exams" className="underline underline-offset-4">
              Take an exam
            </Link>
          </p>
        )}
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {certs.map((c) => (
            <CertificateCard key={c.code} c={c} />
          ))}
        </ul>
      </AppFrame>
    );
  }

  if (section === 'openings') {
    return (
      <AppFrame {...frame} title={copy.openings.title}>
        <DashSection n={1} id="open" label={copy.openings.label} title="Posted by / the Pirento team.">
          {openings.data?.length === 0 && <p className="text-muted">No openings right now.</p>}
          <Openings bare />
        </DashSection>
        <DashSection n={2} id="mine" label={copy.openings.mine} title="Where you / applied.">
          {mine.data?.length === 0 && <p className="text-muted">{copy.openings.noMine}</p>}
          <ul className="border-t border-rule">
            {mine.data?.map((a) => (
              <li key={a._id} className="flex items-center justify-between gap-4 border-b border-rule py-4">
                <span className="min-w-0 truncate font-medium">{titleOf(a.openingId)}</span>
                <Tag tone={a.status === 'shortlisted' ? 'accent' : 'rule'}>{copy.applicationStatus[a.status]}</Tag>
              </li>
            ))}
          </ul>
        </DashSection>
      </AppFrame>
    );
  }

  // Overview
  const openCount = openings.data?.filter((o) => !mine.data?.some((a) => a.openingId === o._id)).length ?? 0;
  return (
    <AppFrame {...frame} title={copy.hello} intro={copy.intro}>
      <DashSection n={1} id="glance" label={copy.glance.label} title={copy.glance.title}>
        <StatsRow
          compact
          stats={[
            {label: 'Certificates', value: me.data ? String(certs.length) : '—'},
            {label: 'Exams taken', value: me.data ? String(attempts.filter((a) => a.submittedAt).length) : '—'},
            {label: 'Best score', value: me.data ? (attempts.length ? `${best}%` : '—') : '—'},
            {label: 'Applications', value: mine.data ? String(mine.data.length) : '—'},
          ]}
        />
      </DashSection>
      <DashSection n={2} id="next" label={copy.next.label} title={copy.next.title}>
        <ul className="border-t border-rule">
          <NextLink
            to="/intern/dashboard/exams"
            icon={GraduationCap}
            title={certs.length ? 'Take another track' : 'Take your first exam'}
            body="Ten questions, thirty minutes, 60% to pass."
          />
          {certs[0] && (
            <NextLink
              to="/intern/dashboard/certificates"
              icon={Award}
              title="Share your certificate"
              body={`${certs[0].trackName} · anyone can check it on its verify page.`}
            />
          )}
          {openCount > 0 && (
            <NextLink
              to="/intern/dashboard/openings"
              icon={Megaphone}
              title={`${openCount} opening${openCount === 1 ? '' : 's'} to apply for`}
              body="Internships and jobs posted by the Pirento team."
            />
          )}
        </ul>
      </DashSection>
    </AppFrame>
  );
}
