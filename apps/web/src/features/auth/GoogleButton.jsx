// "Continue with Google", drawn by Google's own script; shown only when the server has a client id.
import {useEffect, useRef, useState} from 'react';

const SCRIPT = 'https://accounts.google.com/gsi/client';

function loadScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const tag = document.createElement('script');
    tag.src = SCRIPT;
    tag.async = true;
    tag.onload = resolve;
    tag.onerror = () => reject(new Error('Google sign-in could not load'));
    document.head.append(tag);
  });
}

export function GoogleButton({clientId, onCredential}) {
  const box = useRef(null);
  const [failed, setFailed] = useState(false);
  // Keep the latest handler without re-rendering Google's button on every keystroke.
  const handler = useRef(onCredential);
  handler.current = onCredential;

  useEffect(() => {
    let live = true;
    loadScript().then(
      () => {
        if (!live || !box.current) return;
        window.google.accounts.id.initialize({client_id: clientId, callback: (r) => handler.current(r.credential)});
        window.google.accounts.id.renderButton(box.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: box.current.offsetWidth || 360,
        });
      },
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [clientId]);

  if (failed) return <p className="text-sm text-muted">Google sign-in could not load here. Use another way below.</p>;
  return <div ref={box} className="min-h-11 w-full" />;
}
