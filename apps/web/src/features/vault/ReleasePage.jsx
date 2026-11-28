// /vault/release/:token: a nominee opens what a Pirento Vault owner left them. The link came from our team after a
// verified death certificate; a code to the nominee's own mobile (from the owner's Bharat ID) opens it. The page
// shows only what the owner chose to release, and prints or saves as a PDF.
import {useState} from 'react';
import {useParams} from 'react-router-dom';
import {Download, Printer} from 'lucide-react';
import {vaultKind} from '@pirento/shared';
import {PageHero} from '../../components/PageHero';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Label} from '../../components/ui/Heading';
import {vaultCopy} from '../../data/site';
import {api} from '../../lib/api/client';
import {mb} from '../../lib/api/binary';
import {formatDate} from '../../lib/format';
import {usePageMeta} from '../../lib/page';

const copy = vaultCopy.release;

export function Release() {
  const {token} = useParams();
  const [sent, setSent] = useState(null);
  const [code, setCode] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  usePageMeta({title: 'Pirento Vault — left for you'});

  const run = async (fn) => {
    setError('');
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const send = () => run(async () => setSent(await api(`/vault/release/${token}/code`, {method: 'POST'})));
  const open = (e) => {
    e.preventDefault();
    run(async () => setData(await api(`/vault/release/${token}/open`, {method: 'POST', body: {code}})));
  };
  const download = (f) =>
    run(async () => {
      const res = await fetch(`/api/vault/release/${token}/files/${f._id}?t=${encodeURIComponent(data.fileToken)}`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message ?? 'Could not download');
      const url = URL.createObjectURL(await res.blob());
      Object.assign(document.createElement('a'), {href: url, download: f.name}).click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

  if (!data) {
    return (
      <PageHero label="Pirento Vault" title={copy.title} intro={copy.intro}>
        <div className="mt-10 max-w-md" data-hero-fade>
          {!sent ? (
            <Button variant="accent" onClick={send} disabled={busy}>
              {copy.send}
            </Button>
          ) : (
            <form onSubmit={open} noValidate className="space-y-4">
              <p className="text-sm text-muted">Sent to {sent.sentTo}.</p>
              <Field
                label={copy.code}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
              <Button type="submit" variant="accent" disabled={busy || code.length !== 6}>
                {copy.open}
              </Button>
            </form>
          )}
          {error && (
            <p role="alert" className="mt-4 text-sm">
              ⚠ {error}
            </p>
          )}
        </div>
      </PageHero>
    );
  }

  return (
    <div className="container-x pt-36 pb-28 md:pt-44">
      <p className="eyebrow">Pirento Vault</p>
      <h1 className="mt-6 text-[clamp(2.25rem,5vw,4rem)] leading-tight">
        {copy.from} {data.owner.name}
      </h1>
      <p className="mt-4 text-muted">
        Bharat ID {data.owner.bharatId} · {copy.certificate} {data.certificate.number} ({data.certificate.date}) ·
        released {formatDate(data.releasedAt)}
      </p>
      <p className="mt-6 max-w-2xl text-sm text-muted">{copy.note}</p>
      <div className="mt-8 print:hidden">
        <Button variant="outline" icon={Printer} onClick={() => window.print()}>
          {copy.print}
        </Button>
      </div>

      {data.records.length > 0 && (
        <section className="mt-16">
          <Label n={1}>{copy.records}</Label>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {data.records.map((r) => {
              const def = vaultKind(r.kind);
              return (
                <li key={r._id} className="break-inside-avoid rounded-[22px] border border-rule p-6">
                  <p className="text-xs text-muted">{def?.label ?? r.kind}</p>
                  <h2 className="mt-1 text-xl">{r.title}</h2>
                  <dl className="mt-4 space-y-3 text-sm">
                    {(def?.fields ?? [])
                      .filter((f) => r.fields[f.id])
                      .map((f) => (
                        <div key={f.id}>
                          <dt className="text-xs text-muted">{f.label}</dt>
                          <dd className="break-words whitespace-pre-wrap">{r.fields[f.id]}</dd>
                        </div>
                      ))}
                  </dl>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {data.credentials.length > 0 && (
        <section className="mt-16">
          <Label n={2}>{copy.passwords}</Label>
          <ul className="mt-6 border-t border-rule">
            {data.credentials.map((c) => (
              <li key={c._id} className="grid gap-1 border-b border-rule py-4 sm:grid-cols-3">
                <span className="font-medium">{c.label}</span>
                <span className="text-muted">{c.username || '—'}</span>
                <span className="font-mono break-all">{c.password}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.files.length > 0 && (
        <section className="mt-16">
          <Label n={3}>{copy.files}</Label>
          <ul className="mt-6 border-t border-rule">
            {data.files.map((f) => (
              <li key={f._id} className="flex items-center justify-between gap-4 border-b border-rule py-4">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{f.name}</span>
                  <span className="text-xs text-muted">
                    {f.label ? `${f.label} · ` : ''}
                    {mb(f.size)}
                  </span>
                </span>
                <span className="print:hidden">
                  <Button variant="outline" icon={Download} onClick={() => download(f)} disabled={busy}>
                    {copy.download}
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {error && (
        <p role="alert" className="mt-6 text-sm">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}
