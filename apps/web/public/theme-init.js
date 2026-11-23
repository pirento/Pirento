// Runs before first paint (blocking, in <head>): saved choice, else OS setting.
(function () {
  var mode;
  try {
    mode = localStorage.getItem('mode');
  } catch (e) {
    // storage blocked: fall back to the OS setting below
  }
  if (mode !== 'light' && mode !== 'dark') {
    mode = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.dataset.mode = mode;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = mode === 'dark' ? '#0e171c' : '#ffffff';
})();
