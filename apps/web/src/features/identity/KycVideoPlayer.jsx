// Staff: play an applicant's KYC video, with the code they were asked to say.
import {useEffect, useState} from 'react';
import {Play} from 'lucide-react';
import {authFetch} from '../../lib/api/client';
import {Button} from '../../components/ui/Button';

export function KycVideoPlayer({doc}) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState('');

  // The object URL holds the whole video in memory; free it when we leave.
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);

  const load = async () => {
    setError('');
    const res = await authFetch(`/api/identity/staff/${doc._id}/video`);
    if (!res.ok) return setError('The video could not be loaded.');
    setUrl(URL.createObjectURL(await res.blob()));
  };

  return (
    <div className="max-w-xl rounded-[18px] border border-rule p-5">
      <p className="text-sm">
        They should say their name and the code <span className="font-medium tabular-nums">{doc.kyc.challenge}</span>.
      </p>
      {url ? (
        <video
          src={url}
          controls
          playsInline
          className="mt-4 w-full rounded-[14px] bg-inverse"
          aria-label="KYC video"
        />
      ) : (
        <Button onClick={load} variant="outline" icon={Play} className="mt-4">
          Play video
        </Button>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}
