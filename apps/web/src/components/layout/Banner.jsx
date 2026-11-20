// The announcement a superadmin sets in admin → Settings. Sits bottom-left; closing it hides that message.
import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {X} from 'lucide-react';
import {useApi} from '../../lib/api/useApi';

const KEY = 'pirento.banner.closed';
const closedText = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export function Banner() {
  const settings = useApi('/catalog/settings');
  const banner = settings.data?.banner;
  const [closed, setClosed] = useState(closedText);
  useEffect(() => {
    setClosed(closedText());
  }, [banner?.text]);
  if (!banner?.on || !banner.text || closed === banner.text) return null;

  const close = () => {
    try {
      localStorage.setItem(KEY, banner.text);
    } catch {
      // Private mode: it just comes back on the next visit.
    }
    setClosed(banner.text);
  };
  const text = banner.link ? (
    <Link to={banner.link} className="underline underline-offset-4">
      {banner.text}
    </Link>
  ) : (
    banner.text
  );
  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-40 flex max-w-[calc(100vw-2rem)] items-start gap-3 rounded-[18px] border border-rule bg-paper p-4 pr-3 text-sm shadow-lg sm:max-w-sm"
    >
      <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />
      <p className="min-w-0 flex-1">{text}</p>
      <button onClick={close} aria-label="Close announcement" className="rounded-full p-1 text-muted hover:text-ink">
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}
