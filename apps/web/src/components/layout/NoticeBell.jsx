// The bell in every dashboard: the person's notices (order updates, replies, parcels, Vault check-ins…), each opening
// the page it is about, and a link to /notifications for the full history and the channel choices. Opening it marks
// them read.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Bell} from 'lucide-react';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';

export function NoticeBell({align = 'left'}) {
  const notices = useApi('/auth/me/notices');
  const [open, setOpen] = useState(false);
  const unread = notices.data?.unread ?? 0;
  const toggle = async () => {
    setOpen((o) => !o);
    if (!open && unread) {
      await api('/auth/me/notices/read', {method: 'POST'}).catch(() => {});
      notices.reload();
    }
  };
  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={unread ? `Notifications, ${unread} new` : 'Notifications'}
        className="relative flex size-10 items-center justify-center rounded-full border border-rule hover:border-ink"
      >
        <Bell aria-hidden className="size-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[0.65rem] text-on-accent tabular-nums">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          className={`absolute bottom-12 z-50 w-[min(22rem,85vw)] rounded-[18px] border border-rule bg-paper p-2 shadow-[0_30px_80px_-40px_rgba(15,38,32,0.4)] ${
            align === 'right' ? 'right-0 top-12 bottom-auto' : 'left-0'
          }`}
        >
          <p className="px-3 pt-2 pb-1 text-xs tracking-[0.12em] text-muted uppercase">Notifications</p>
          {!notices.data?.items.length && <p className="px-3 py-4 text-sm text-muted">Nothing new.</p>}
          <ul className="max-h-[60dvh] overflow-y-auto">
            {notices.data?.items.map((n) => (
              <li key={n._id} className="relative rounded-[14px] px-3 py-3 hover:bg-stone">
                {n.link?.startsWith('/') && (
                  // The whole row opens what the notice is about.
                  <Link
                    to={n.link}
                    onClick={() => setOpen(false)}
                    className="absolute inset-0 rounded-[14px]"
                    aria-label={`${n.label}: ${n.big}`}
                  />
                )}
                <p className="text-xs text-muted">
                  {n.brand} · {formatDate(n.createdAt)}
                </p>
                <p className="mt-1 text-sm font-medium">
                  {n.label}: {n.big}
                </p>
                <p className="mt-1 text-xs leading-relaxed break-words text-muted">{n.note}</p>
              </li>
            ))}
          </ul>
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-[14px] px-3 py-3 text-sm underline underline-offset-4 hover:bg-stone"
          >
            See all, and choose email, SMS and WhatsApp
          </Link>
        </div>
      )}
    </div>
  );
}
