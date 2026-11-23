// Pirento AI: the kind of questions people ask, shown as a conversation you can start.
import {Sparkles} from 'lucide-react';
import {Button} from '../../../components/ui/Button';
import {useSession} from '../../../lib/api/session';
import {WidgetCard} from './Card';

export function ChatSample({product}) {
  const {user} = useSession();
  const to = user ? '/ai/dashboard' : `/login?next=${encodeURIComponent('/ai/dashboard')}`;
  return (
    <WidgetCard label="Ask it like this">
      <ol className="mt-5 space-y-3">
        {product.examples.map((q) => (
          <li key={q} className="ml-auto w-fit max-w-[85%] rounded-[18px] rounded-br-md bg-stone px-4 py-3 text-sm">
            {q}
          </li>
        ))}
        <li className="flex w-fit max-w-[85%] items-start gap-3 rounded-[18px] rounded-bl-md border border-rule px-4 py-3 text-sm text-muted">
          <Sparkles aria-hidden className="mt-0.5 size-4 shrink-0 text-ink" />
          Answers name the Pirento service that fits, with its price and a link, and can read your own orders when you
          ask.
        </li>
      </ol>
      <Button to={to} variant="accent" className="mt-6">
        Ask your own question
      </Button>
    </WidgetCard>
  );
}
