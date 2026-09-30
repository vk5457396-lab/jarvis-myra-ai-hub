/**
 * Shown instantly while the next page loads, so a click always gives visible feedback (the App
 * Router otherwise keeps the old page on screen until the new one is ready). Deliberately tiny —
 * no client JS — so it can't itself slow navigation down.
 */
export default function Loading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <span
        className="h-10 w-10 animate-spin rounded-full border-2 border-primary/25 border-t-primary motion-reduce:animate-none"
        aria-hidden="true"
      />
    </div>
  );
}
