// One support conversation.
import {useState} from 'react';
import {useParams} from 'react-router-dom';
import {PageHero} from '../../components/PageHero';
import {Button} from '../../components/ui/Button';
import {Section} from '../../components/ui/Heading';
import {Tag} from '../../components/ui/Tag';
import {TextArea} from '../../components/ui/TextArea';
import {useSignedIn} from '../auth/useSignedIn';
import {NotFound} from '../ecosystem/NotFoundPage';
import {STATUS} from './status';
import {TeamPanel} from './TeamPanel';
import {api} from '../../lib/api/client';
import {useSession} from '../../lib/api/session';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';
import {usePageMeta} from '../../lib/page';

export function Ticket() {
  const {id} = useParams();
  const {redirect, user} = useSignedIn();
  const {user: me} = useSession();
  const ticket = useApi(user ? `/support/${id}` : null);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  usePageMeta({title: ticket.data ? `#${ticket.data.ticketNo} — Support` : 'Support — Pirento'});
  if (redirect) return redirect;
  if (ticket.error) return <NotFound />;
  const t = ticket.data;
  if (!t) return <div className="min-h-dvh" />;
  const staffView = t.userId !== me?._id;

  const act = async (path, body) => {
    setBusy(true);
    setError('');
    try {
      await api(`/support/${t._id}${path}`, {method: 'POST', body});
      setReply('');
      ticket.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHero label={`Request #${t.ticketNo}${t.orderNo ? ` · order #${t.orderNo}` : ''}`} title={t.subject}>
        <div className="mt-8 flex items-center gap-3">
          <Tag tone={t.status === 'answered' ? 'accent' : 'rule'}>{STATUS[t.status]}</Tag>
          {staffView && <span className="text-sm text-muted">{t.email}</span>}
        </div>
      </PageHero>
      <Section className="pt-0! md:pt-0!">
        <ol className="max-w-3xl space-y-4">
          {t.messages.map((m, i) => (
            <li
              key={i}
              className={`rounded-[18px] border p-6 ${m.from === 'staff' ? 'border-rule bg-stone' : 'border-rule'} ${
                (m.from === 'staff') === staffView ? 'ml-auto max-w-[85%]' : 'max-w-[85%]'
              }`}
            >
              <p className="text-xs text-muted">
                {m.from === 'staff' ? 'Pirento team' : staffView ? t.email : 'You'} · {formatDate(m.at)}
              </p>
              <p className="mt-2 whitespace-pre-wrap">{m.body}</p>
            </li>
          ))}
        </ol>
        {staffView && <TeamPanel ticket={t} me={me} onChange={ticket.reload} />}
        {t.status !== 'closed' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              act('/messages', {body: reply});
            }}
            noValidate
            className="mt-10 max-w-3xl space-y-4"
          >
            <TextArea label="Reply" value={reply} onChange={(e) => setReply(e.target.value)} />
            {error && (
              <p role="alert" className="text-sm">
                ⚠ {error}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="accent" disabled={busy}>
                Send reply
              </Button>
              <Button type="button" variant="outline" icon={null} disabled={busy} onClick={() => act('/close')}>
                Close request
              </Button>
            </div>
          </form>
        )}
      </Section>
    </div>
  );
}
