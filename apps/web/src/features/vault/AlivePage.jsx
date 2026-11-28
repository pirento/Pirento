// /vault/alive?t=…: the link in a Vault check-in reminder. Opening it tells the vault its owner is well, which puts
// their legacy plan back to active. It works without signing in, and once.
import {useEffect, useRef, useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {PageHero} from '../../components/PageHero';
import {vaultCopy} from '../../data/site';
import {api} from '../../lib/api/client';
import {usePageMeta} from '../../lib/page';

const copy = vaultCopy.alive;

export function Alive() {
  const token = new URLSearchParams(useLocation().search).get('t') ?? '';
  const [state, setState] = useState('checking');
  const sent = useRef(false);
  usePageMeta({title: 'Pirento Vault — you are here'});
  useEffect(() => {
    if (sent.current) return; // the link works once: never post it twice
    sent.current = true;
    api('/vault/alive', {method: 'POST', body: {token}}).then(
      () => setState('done'),
      () => setState('failed'),
    );
  }, [token]);
  return (
    <PageHero
      label="Pirento Vault"
      title={state === 'done' ? copy.title : state === 'failed' ? 'This link / has done its job.' : 'One / moment.'}
      intro={state === 'done' ? copy.body : state === 'failed' ? copy.failed : copy.checking}
    >
      <Link to="/vault/dashboard/legacy" className="mt-10 inline-block underline underline-offset-4" data-hero-fade>
        Open my vault
      </Link>
    </PageHero>
  );
}
