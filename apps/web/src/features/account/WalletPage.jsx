// The wallet on its own page: balance, add money, withdraw to UPI, and the full history.
import {useRef} from 'react';
import {PageHero} from '../../components/PageHero';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {useSignedIn} from '../auth/useSignedIn';
import {WalletPanel} from './WalletPanel';

export function Wallet() {
  const {redirect, user} = useSignedIn();
  const ref = useRef(null);
  usePageMotion(ref, [Boolean(user)]);
  usePageMeta({title: 'Wallet — Pirento Ecosystem'});
  if (redirect) return redirect;
  if (!user) return <div className="min-h-dvh" />;
  return (
    <div ref={ref} className="space-y-10">
      <PageHero
        label="Pirento Ecosystem · Wallet"
        title="Wallet"
        intro="One balance for Legal, Black, Green and Giftox. Amounts are kept in paise and every move is on record."
      />
      <div className="max-w-3xl">
        <WalletPanel n={1} full />
      </div>
    </div>
  );
}
