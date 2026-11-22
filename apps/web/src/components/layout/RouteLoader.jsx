// Shown while a page's code loads: a thin accent bar sweeping along the top, and the page area kept so nothing
// jumps. Under reduced motion the bar sits still.
export function RouteLoader() {
  return (
    <div className="min-h-dvh" role="status" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div aria-hidden className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden">
        <div className="h-full w-1/3 bg-accent motion-safe:animate-[route-load_1.1s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
