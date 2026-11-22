// Downloads a signed Bharat ID declaration (the applicant's own, or one a staffer opens) through the signed-in session.
import {useState} from 'react';
import {Download} from 'lucide-react';
import {authFetch} from '../../lib/api/client';

export function DeclarationLink({path = '/api/identity/declaration', label = 'Download signed declaration'}) {
  const [error, setError] = useState('');
  const open = async () => {
    setError('');
    const res = await authFetch(path);
    if (!res.ok) return setError('The declaration could not be loaded. Try again.');
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement('a'), {href: url, download: 'Bharat-ID-declaration.pdf'});
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };
  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={open}
        className="inline-flex items-center gap-1.5 text-sm underline underline-offset-4"
      >
        <Download aria-hidden className="size-4" /> {label}
      </button>
      {error && (
        <span role="alert" className="text-sm">
          ⚠ {error}
        </span>
      )}
    </span>
  );
}
