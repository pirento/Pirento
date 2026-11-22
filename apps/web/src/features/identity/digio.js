// Digio's web SDK: load its script, then open a KYC or sign request in its window and wait for it to close.

/** Loads the SDK once. Load it before the click: the SDK's window must open inside the click itself. */
export function loadDigio(src) {
  if (window.Digio) return Promise.resolve(window.Digio);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve(window.Digio);
    s.onerror = () => reject(new Error('Could not load Digio. Check your connection and try again.'));
    document.head.append(s);
  });
}

/**
 * Opens Digio for a request the server makes on demand. Call it straight from a click: the window opens
 * at once, then `start()` asks our server for the request id and token, then Digio shows that request.
 * Resolves when Digio closes (an `error_code` means the person stopped or it failed).
 */
export function openDigio({environment, start}) {
  return new Promise((resolve, reject) => {
    const digio = new window.Digio({
      environment,
      is_iframe: true,
      logo: `${window.location.origin}/brand/bharat-id/icon-192.png`,
      callback: (response) => resolve(response ?? {}),
    });
    digio.init();
    start().then(
      ({id, identifier, token}) => digio.submit(id, identifier, token),
      (err) => {
        digio.cancel();
        reject(err);
      },
    );
  });
}
