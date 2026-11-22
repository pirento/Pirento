// Intern → Programme: choose 3, 6, 9 or 12 months (paid from the wallet), fill the profile the AI and staff use,
// see what still blocks paid work, the mark so far, an AI resume draft, and the certificate at the end.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Check, X} from 'lucide-react';
import {PROGRAM_PASS, PROGRAM_SCORE} from '@pirento/shared';
import {StatsRow} from '../../components/ui/Blocks';
import {Button} from '../../components/ui/Button';
import {DashSection} from '../../components/ui/DashSection';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {TextArea} from '../../components/ui/TextArea';
import {appDashboards} from '../../data/site';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDay, inr} from '../../lib/format';
import {selectCls} from './Pipeline';

const copy = appDashboards.intern.programme;

function Packages({onBought}) {
  const list = useApi('/learning/programs');
  const [error, setError] = useState(null);
  const buy = async (months) => {
    setError(null);
    try {
      await api('/learning/program/buy', {method: 'POST', body: {months}});
      onBought();
    } catch (err) {
      setError(err);
    }
  };
  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {list.data?.map((p) => (
          <li key={p.months} className="flex flex-col rounded-[22px] border border-rule p-6" data-reveal>
            <p className="eyebrow">{copy.packageLabel}</p>
            <p className="mt-4 text-3xl">
              {p.months} <span className="text-lg text-muted">months</span>
            </p>
            <p className="mt-2 text-lg">{p.onSale ? (p.price ? inr(p.price / 100) : 'Free') : copy.soon}</p>
            <ul className="mt-5 grow space-y-1.5 text-sm text-muted">
              {copy.includes.map((line) => (
                <li key={line}>· {line}</li>
              ))}
            </ul>
            <Button className="mt-6" variant="outline" disabled={!p.onSale} onClick={() => buy(p.months)}>
              {p.onSale ? copy.buy : copy.soon}
            </Button>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="mt-4 text-sm">
          ⚠ {error.message}{' '}
          {error.code === 'NEEDS_BHARAT_ID' && (
            <Link to="/bharat-id/dashboard" className="underline underline-offset-4">
              Get your Bharat ID
            </Link>
          )}
          {error.code === 'INSUFFICIENT_BALANCE' && (
            <Link to="/intern/dashboard/wallet" className="underline underline-offset-4">
              Add money to your wallet
            </Link>
          )}
        </p>
      )}
      <p className="mt-4 text-sm text-muted">{copy.note}</p>
    </>
  );
}

function ProfileForm({enrolment, tracks, onSaved}) {
  const p = enrolment.profile ?? {};
  const [f, setF] = useState({
    fullName: p.fullName ?? '',
    track: p.track ?? '',
    skills: (p.skills ?? []).join(', '),
    education: p.education ?? '',
    goals: p.goals ?? '',
    bio: p.bio ?? '',
  });
  const [note, setNote] = useState('');
  const set = (k) => (e) => setF((x) => ({...x, [k]: e.target.value}));
  const save = async (e) => {
    e.preventDefault();
    setNote('');
    try {
      const skills = f.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await api('/learning/program/profile', {method: 'PUT', body: {...f, skills}});
      setNote('Saved.');
      onSaved();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <form onSubmit={save} className="max-w-3xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name (for your certificate)" required value={f.fullName} onChange={set('fullName')} />
        <label className="grid gap-1 text-sm">
          <span className="font-medium">
            Track <span className="text-muted">(required)</span>
          </span>
          <select required value={f.track} onChange={set('track')} className={selectCls}>
            <option value="">Choose</option>
            {tracks?.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <Field label="Skills, separated by commas" required value={f.skills} onChange={set('skills')} />
        <Field label="Education" value={f.education} onChange={set('education')} />
      </div>
      <TextArea
        label="What you want from this programme"
        required={false}
        rows={3}
        value={f.goals}
        onChange={set('goals')}
      />
      <TextArea label="About you" required={false} rows={3} value={f.bio} onChange={set('bio')} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="accent" icon={null}>
          Save profile
        </Button>
        {note && (
          <p role="status" className="text-sm">
            {note}
          </p>
        )}
      </div>
    </form>
  );
}

const CHECKS = {
  enrolled: 'On a running programme',
  bharatId: 'Bharat ID issued',
  certified: 'Passed a track exam (your proof you can do the work)',
  profile: 'Profile filled in (track and skills)',
};

function Resume({enrolment, onChange}) {
  const [note, setNote] = useState('');
  const draft = async () => {
    setNote('Writing your draft…');
    try {
      await api('/learning/program/resume', {method: 'POST'});
      setNote('');
      onChange();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  const r = enrolment.resume;
  return (
    <div className="max-w-3xl space-y-4">
      {r?.headline && (
        <div className="rounded-[18px] border border-rule p-6">
          <p className="text-lg font-medium">{r.headline}</p>
          <p className="mt-3 whitespace-pre-line">{r.summary}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            {r.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" icon={null} onClick={draft}>
          {r?.headline ? 'Write a new draft' : 'Write my resume draft'}
        </Button>
        {note && <p className="text-sm">{note}</p>}
      </div>
      <p className="text-sm text-muted">{copy.resumeNote}</p>
    </div>
  );
}

export function Programme({tracks}) {
  const me = useApi('/learning/program/me');
  const [note, setNote] = useState('');
  if (me.error) return <p className="body">⚠ {me.error.message}</p>;
  if (!me.data) return null;
  const {enrolment: e, checks, score} = me.data;
  const finishNow = async () => {
    setNote('');
    try {
      await api('/learning/program/finish', {method: 'POST'});
      me.reload();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };

  if (!e || e.status === 'finished') {
    return (
      <>
        {e && (
          <DashSection n={1} id="last" label="Your last programme" title={`${e.months} months, / finished.`}>
            <StatsRow
              compact
              stats={[
                {label: 'Final mark', value: `${e.score?.total ?? 0}%`},
                {label: 'Grade', value: e.score?.grade ?? '—'},
                {label: 'Tasks', value: `${e.score?.tasks ?? 0}%`},
                {label: 'Paid work', value: `${e.score?.work ?? 0}%`},
              ]}
            />
            {e.certificateCode && (
              <Link to={`/verify/${e.certificateCode}`} className="mt-6 inline-block underline underline-offset-4">
                Your programme certificate · {e.certificateCode}
              </Link>
            )}
          </DashSection>
        )}
        <DashSection n={e ? 2 : 1} id="packages" label={copy.label} title={copy.title}>
          <Packages onBought={me.reload} />
        </DashSection>
      </>
    );
  }

  const ended = new Date(e.endsAt) <= new Date();
  return (
    <>
      <DashSection n={1} id="now" label={`${e.months}-month programme`} title="Where you / stand.">
        <StatsRow
          compact
          stats={[
            {label: 'Mark so far', value: `${score?.total ?? 0}%`},
            {label: 'Grade so far', value: score?.grade ?? '—'},
            {label: 'Ends', value: formatDay(e.endsAt)},
            {label: 'To pass', value: `${PROGRAM_PASS}%`},
          ]}
        />
        <p className="mt-4 text-sm text-muted">
          The final mark: practice tasks {PROGRAM_SCORE.tasks}%, paid work {PROGRAM_SCORE.work}%, live classes{' '}
          {PROGRAM_SCORE.attendance}%, lessons {PROGRAM_SCORE.lessons}%. Now: tasks {score?.tasks ?? 0}%, work{' '}
          {score?.work ?? 0}%, classes {score?.attendance ?? 0}%, lessons {score?.lessons ?? 0}%.
        </p>
        {ended && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button variant="accent" onClick={finishNow}>
              Finish and get my certificate
            </Button>
            {note && <p className="text-sm">{note}</p>}
          </div>
        )}
      </DashSection>
      <DashSection n={2} id="eligible" label="Paid work" title="Ready for / real work?">
        <ul className="max-w-2xl border-t border-rule">
          {Object.entries(CHECKS).map(([k, label]) => (
            <li key={k} className="flex items-center gap-3 border-b border-rule py-3 text-sm">
              {checks[k] ? (
                <Check aria-label="Done" className="size-4" />
              ) : (
                <X aria-label="Not yet" className="size-4" />
              )}
              <span className={checks[k] ? '' : 'text-muted'}>{label}</span>
              {!checks[k] && k === 'bharatId' && (
                <Link to="/bharat-id/dashboard" className="ml-auto underline underline-offset-4">
                  Get it
                </Link>
              )}
              {!checks[k] && k === 'certified' && (
                <Link to="/intern/dashboard/exams" className="ml-auto underline underline-offset-4">
                  Take an exam
                </Link>
              )}
            </li>
          ))}
        </ul>
        {me.data.eligible && (
          <p className="mt-4">
            <Tag tone="accent">Eligible</Tag>{' '}
            <span className="text-sm text-muted">Paid work assigned to you shows under Work.</span>
          </p>
        )}
      </DashSection>
      <DashSection n={3} id="profile" label="Your profile" title="What the AI / sets work from.">
        <ProfileForm enrolment={e} tracks={tracks} onSaved={me.reload} />
      </DashSection>
      <DashSection n={4} id="resume" label="Resume" title="A draft, / from your record.">
        <Resume enrolment={e} onChange={me.reload} />
      </DashSection>
    </>
  );
}
