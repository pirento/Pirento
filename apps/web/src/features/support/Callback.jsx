// Ask for a call back: a mobile number and a topic, filed as a high-priority request the team sees in its queue.
import {useState} from 'react';
import {maskPhone, toPhone} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {support as copy} from '../../data/site';
import {api} from '../../lib/api/client';

export function Callback({product, onDone}) {
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState(copy.call.topics[0]);
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const number = toPhone(phone);
    if (!number) return setError('Enter a 10-digit Indian mobile number');
    setState('busy');
    try {
      await api('/support', {
        method: 'POST',
        body: {
          subject: `Callback request · ${maskPhone(number)}`,
          message: `Please call me on ${number} about: ${topic}`,
          priority: 'high',
          ...(product ? {product} : {}),
        },
      });
      setState('done');
      onDone();
    } catch (err) {
      setError(err.message);
      setState('idle');
    }
  };

  if (state === 'done') return <p role="status">{copy.call.done}</p>;
  return (
    <form onSubmit={submit} noValidate className="max-w-xl space-y-6">
      <label className="block">
        <span className="text-sm font-medium">Mobile number</span>
        <span className="joined-field mt-2 flex overflow-hidden rounded-[14px] border border-rule bg-paper focus-within:border-ink">
          <span className="flex items-center border-r border-rule bg-stone px-4 text-muted">+91</span>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile number"
            className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none"
          />
        </span>
      </label>
      <label className="block">
        <span className="text-sm font-medium">What it is about</span>
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="mt-2 block w-full rounded-[14px] border border-rule bg-paper px-4 py-3 outline-none focus:border-ink"
        >
          {copy.call.topics.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert" className="text-sm">
          ⚠ {error}
        </p>
      )}
      <Button type="submit" variant="accent" disabled={state === 'busy'}>
        {state === 'busy' ? 'Sending' : 'Request a call'}
      </Button>
    </form>
  );
}
