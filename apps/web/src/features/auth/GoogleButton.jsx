// "Google" in the sign-in pages' own button style. When the install has a Google client id, Google's real
// button sits invisibly on top of ours, so the click goes to Google (its rules require its own button);
// without one, the button says Google sign-in is not set up yet.
import {useEffect, useRef, useState} from 'react';
import {authButton} from './AuthButtons';

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

export function GoogleButton({clientId, onCredential, onUnavailable}) {
  const box = useRef(null);
  const [ready, setReady] = useState(false);
  // Keep the latest handler without re-drawing Google's button on every keystroke.
  const handler = useRef(onCredential);
  handler.current = onCredential;

  useEffect(() => {
    if (!clientId) return;
    let live = true;
    loadScript().then(
      () => {
        if (!live || !box.current) return;
        window.google.accounts.id.initialize({client_id: clientId, callback: (r) => handler.current(r.credential)});
        window.google.accounts.id.renderButton(box.current, {
          type: 'standard',
          size: 'large',
          width: Math.min(400, box.current.offsetWidth || 200),
        });
        setReady(true);
      },
      () => {},
    );
    return () => {
      live = false;
    };
  }, [clientId]);

  return (
    <div className="relative">
      <button
        type="button"
        tabIndex={ready ? -1 : 0}
        onClick={() => !clientId && onUnavailable?.()}
        className={authButton('soft')}
        aria-hidden={ready || undefined}
      >
        <img src="/brand/google-g.svg" alt="" width="18" height="18" className="size-[18px]" />
        Google
      </button>
      {clientId && (
        // Google's own button, the size of ours and almost invisible: it takes the click and the focus.
        <div ref={box} className="absolute inset-0 overflow-hidden opacity-[0.011]" aria-label="Sign in with Google" />
      )}
    </div>
  );
}
