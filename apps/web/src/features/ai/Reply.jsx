// An assistant reply, with Pirento paths (/services/…, /support/…, /<product>/dashboard/…) turned into links.
import {Fragment} from 'react';
import {Link} from 'react-router-dom';

const PATH = /(\/(?:services|support|verify|[a-z-]+\/dashboard)(?:\/[\w-]+)*(?:\?[\w=&-]+)?)/g;

// Only paths on this site become links; everything else stays plain text.
export function Reply({text, onNavigate}) {
  return text.split(PATH).map((part, i) =>
    i % 2 ? (
      <Link key={i} to={part} onClick={onNavigate} className="underline underline-offset-4">
        {part}
      </Link>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
