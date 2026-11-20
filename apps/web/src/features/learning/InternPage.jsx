// Pirento Intern dashboard: pick a track, take the exam, see certificates.
import {useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {Award} from 'lucide-react';
import {PageHero} from '../../components/PageHero';
import {StatsRow} from '../../components/ui/Blocks';
import {Button} from '../../components/ui/Button';
import {Label, Section} from '../../components/ui/Heading';
import {Tag} from '../../components/ui/Tag';
import {useSignedIn} from '../auth/useSignedIn';
import {Exam} from './Exam';
import {StartForm} from './StartForm';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';

export function Intern() {
  const {redirect, user} = useSignedIn();
  const tracks = useApi('/learning/tracks');
  const me = useApi(user ? '/learning/me' : null);
  const [exam, setExam] = useState(null);
  const [result, setResult] = useState(null);
  const ref = useRef(null);
  usePageMotion(ref, [Boolean(tracks.data && me.data)]);
  usePageMeta({
    title: 'Pirento Intern — exam and certificates',
    description: 'Take the final exam and earn a certificate.',
  });
  if (redirect) return redirect;
  const certs = me.data?.certificates ?? [];

  return (
    <div ref={ref}>
      <PageHero
        label="Pirento Intern · Dashboard"
        title="Pass the exam. / Prove it anywhere."
        hl="Prove it anywhere."
        intro="Pick a track and take the final exam. Score 60% or more and you get a certificate with a public verify page."
      />
      <Section className="pt-0! md:pt-0!">
        {!exam && !result && (
          <div className="mb-16">
            <StatsRow
              stats={[
                {value: '10', label: 'questions per exam'},
                {value: '30', label: 'minutes on the clock'},
                {value: '60%', label: 'to pass'},
                {value: '24h', label: 'before a retake'},
              ]}
            />
          </div>
        )}
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
          tracks.data && (
            <StartForm tracks={tracks.data} certified={new Set(certs.map((c) => c.track))} onStart={setExam} />
          )
        )}
      </Section>
      {certs.length > 0 && !exam && (
        <Section className="pt-0! md:pt-0!">
          <Label n={1}>Your certificates</Label>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {certs.map((c) => (
              <li key={c.code} data-reveal>
                <Link
                  to={`/verify/${c.code}`}
                  className="flex items-center gap-5 rounded-[18px] border border-rule p-6 hover:border-ink"
                >
                  <Award aria-hidden className="size-6" />
                  <span>
                    <span className="block text-lg font-medium">{c.trackName}</span>
                    <span className="text-sm text-muted">
                      {c.code} · {c.percent}% · {formatDate(c.issuedAt)} · View certificate
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
