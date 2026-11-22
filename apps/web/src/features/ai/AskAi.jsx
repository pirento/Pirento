// "Ask Pirento AI" in every product dashboard: a button in the corner opens a panel with the assistant, which
// knows which product you are in and can read your own account there. Not for staff, not on the AI's own page.
import {useEffect, useRef, useState} from 'react';
import {useLocation} from 'react-router-dom';
import {Sparkles, X} from 'lucide-react';
import {appDashboards} from '../../data/site';
import {useSession} from '../../lib/api/session';
import {useApi} from '../../lib/api/useApi';
import {useProductSite} from '../../lib/site';
import {isStaffRole} from '../admin/adminNav';
import {ChatPanel} from './ChatPanel';
import {useChat} from './useChat';

function Panel({product, onClose}) {
  const status = useApi('/ai/status');
  const chat = useChat({product: product?.slug ?? ''});
  const examples = appDashboards.ai.askExamples[product?.slug] ?? appDashboards.ai.askExamples.default;
  return (
    <>
      <header className="flex items-center justify-between border-b border-rule px-5 py-4">
        <span className="font-medium">Pirento AI{product ? ` · ${product.short}` : ''}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Pirento AI"
          className="flex size-9 items-center justify-center rounded-full border border-rule"
        >
          <X aria-hidden className="size-4" />
        </button>
      </header>
      <ChatPanel
        chat={chat}
        off={status.data && !status.data.enabled}
        examples={examples}
        compact
        onNavigate={onClose}
      />
    </>
  );
}

export function AskAi() {
  const ref = useRef(null);
  const {user} = useSession();
  const {pathname} = useLocation();
  const product = useProductSite();
  if (!user || isStaffRole(user.role) || pathname.startsWith('/ai') || pathname.startsWith('/admin')) return null;
  const close = () => ref.current?.close();
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="group/ask fixed right-5 bottom-5 z-30 flex items-center gap-2 rounded-full border border-rule bg-ink px-4 py-3 text-sm font-medium text-paper shadow-lg hover:bg-accent hover:text-on-accent"
      >
        <Sparkles aria-hidden className="size-4" />
        <span className="hidden sm:inline">Ask Pirento AI</span>
        <span className="sm:hidden">Ask AI</span>
      </button>
      <dialog
        ref={ref}
        aria-label="Pirento AI"
        onClick={(e) => e.target === ref.current && close()}
        className="m-0 mt-auto ml-auto h-[min(42rem,100dvh)] max-h-dvh w-full max-w-[28rem] flex-col rounded-t-[22px] border border-rule bg-paper p-0 text-ink backdrop:bg-inverse/40 open:flex sm:mr-5 sm:mb-5 sm:rounded-[22px]"
      >
        {/* Mounted only while open, so the chat starts fresh in each product. */}
        <PanelWhenOpen dialog={ref} product={product} onClose={close} />
      </dialog>
    </>
  );
}

/** Renders the panel only while the dialog is open. */
function PanelWhenOpen({dialog, product, onClose}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const d = dialog.current;
    if (!d) return undefined;
    const watch = new MutationObserver(() => setOpen(d.open));
    watch.observe(d, {attributes: true, attributeFilter: ['open']});
    return () => {
      watch.disconnect();
    };
  }, [dialog]);
  return open ? <Panel product={product} onClose={onClose} /> : null;
}
