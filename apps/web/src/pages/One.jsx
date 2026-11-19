import {useState} from 'react';
import {Copy, Check} from 'lucide-react';
import {statusLabel} from '@pirento/shared';
import {api, inr, useApi} from '../lib/api';
import {usePageMeta} from '../lib/page';
import {Button, Label, Section, StatsRow, Tag} from '../components/ui';
import {PageHero} from './Products';
import {formatDate, useSignedIn} from './Orders';

export function One() {
  const {redirect, user} = useSignedIn();
  const me = useApi(user ? '/orders/partner/me' : null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  usePageMeta({
    title: 'Pirento One — partners',
    description: 'Share your partner code and track the orders it brings.',
  });
  if (redirect) return redirect;

  const join = async () => {
    setError('');
    try {
      await api('/orders/partner/join', {method: 'POST'});
      me.reload();
    } catch (err) {
      setError(err.message);
    }
  };
  const d = me.data;
  const link = d && `https://pirento.com/?ref=${d.code}`;
  const settled = d?.orders.filter((o) => ['paid', 'in_progress', 'completed'].includes(o.status)) ?? [];

  return (
    <div>
      <PageHero
        label="Pirento One · Dashboard"
        title="Share Pirento. / See what it brings."
        intro="Get a partner code. Every order a client places through your link shows up here."
      />
      <Section className="pt-0! md:pt-0!">
        {me.loading ? null : !d ? (
          <div className="max-w-2xl rounded-[22px] border border-rule p-8">
            <p className="body">Joining is free. You get a code and a link to share.</p>
            {error && (
              <p role="alert" className="mt-4 text-sm">
                ⚠ {error}
              </p>
            )}
            <Button onClick={join} variant="accent" className="mt-6">
              Become a partner
            </Button>
            <p className="mt-4 text-sm text-muted">
              Commission payout is not available yet. Today this tracks referrals only.
            </p>
          </div>
        ) : (
          <>
            <div className="flex max-w-3xl flex-wrap items-end justify-between gap-6 rounded-[22px] border border-accent p-8">
              <div className="min-w-0">
                <Label n={1}>Your link</Label>
                <p className="display mt-4 text-3xl">{d.code}</p>
                <p className="mt-2 truncate text-sm text-muted">{link}</p>
              </div>
              <Button
                variant="outline"
                icon={copied ? Check : Copy}
                onClick={() =>
                  navigator.clipboard.writeText(link).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1800);
                  })
                }
              >
                {copied ? 'Copied' : 'Copy link'}
              </Button>
            </div>
            <div className="mt-10">
              <StatsRow
                stats={[
                  {value: String(d.orders.length), label: 'orders with your code'},
                  {value: String(settled.length), label: 'paid'},
                  {value: inr(settled.reduce((n, o) => n + o.amount, 0) / 100), label: 'paid order value'},
                ]}
              />
            </div>
            <ul className="mt-10 max-w-3xl">
              {d.orders.map((o) => (
                <li key={o._id} className="flex items-center justify-between gap-4 border-b border-rule py-4">
                  <span>
                    <span className="block font-medium">{o.serviceName}</span>
                    <span className="text-xs text-muted">
                      #{o.orderNo} · {formatDate(o.createdAt)}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Tag>{statusLabel(o.status)}</Tag>
                    <span className="tabular-nums">{inr(o.amount / 100)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>
    </div>
  );
}
