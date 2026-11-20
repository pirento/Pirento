// An assistant reply, with /services/… paths turned into links.
import {Fragment} from 'react';
import {Link} from 'react-router-dom';

// Turns /services/… paths in a reply into links; everything else stays plain text.
export function Reply({text}) {
  return text.split(/(\/services\/[a-z0-9-]+)/g).map((part, i) =>
    part.startsWith('/services/') ? (
      <Link key={i} to={part} className="underline underline-offset-4">
        {part}
      </Link>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
