// Staff: the files Digio's KYC steps produced (video, selfie, documents), opened through the signed-in session.
import {useEffect, useState} from 'react';
import {authFetch} from '../../lib/api/client';

function DigioFile({appId, action}) {
  const [file, setFile] = useState(null); // {url, type}
  const [error, setError] = useState('');

  // The object URL holds the whole file in memory; free it when we leave.
  useEffect(() => {
    return () => {
      if (file) URL.revokeObjectURL(file.url);
    };
  }, [file]);

  const open = async () => {
    setError('');
    const res = await authFetch(`/api/identity/staff/${appId}/media/${encodeURIComponent(action.fileId)}`);
    if (!res.ok) return setError('Could not load it from Digio.');
    const blob = await res.blob();
    setFile({url: URL.createObjectURL(blob), type: blob.type});
  };

  return (
    <li className="rounded-[14px] border border-rule p-4">
      <p className="text-sm">
        <span className="font-medium capitalize">{action.kind?.replace(/_/g, ' ') ?? 'File'}</span>
        <span className="text-muted"> · {action.status}</span>
      </p>
      {!file ? (
        <button type="button" onClick={open} className="mt-2 text-sm underline underline-offset-4">
          Open
        </button>
      ) : file.type.startsWith('video/') ? (
        <video
          src={file.url}
          controls
          playsInline
          className="mt-3 w-full rounded-[10px] bg-inverse"
          aria-label="KYC video"
        />
      ) : file.type.startsWith('image/') ? (
        <img src={file.url} alt={`KYC ${action.kind ?? 'file'}`} className="mt-3 w-full rounded-[10px]" />
      ) : (
        <a href={file.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm underline">
          Open the file (new tab)
        </a>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm">
          ⚠ {error}
        </p>
      )}
    </li>
  );
}

export function DigioFiles({doc}) {
  const files = (doc.digio?.kycActions ?? []).filter((a) => a.fileId);
  if (!files.length) return <p className="text-sm text-muted">No KYC files from Digio yet.</p>;
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {files.map((a) => (
        <DigioFile key={a.fileId} appId={doc._id} action={a} />
      ))}
    </ul>
  );
}
