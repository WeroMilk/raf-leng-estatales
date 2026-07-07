export default function ReactivosLoading() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-2 pt-1 pb-2 animate-fade-in">
      <div className="page-header shrink-0 py-1.5 sm:py-2">
        <div className="page-header__toolbar">
          <div className="h-5 w-40 rounded-md bg-[var(--fill-tertiary)]" />
          <div className="h-9 w-16 rounded-lg bg-[var(--fill-tertiary)]" />
        </div>
      </div>
      <div className="reactivos-page flex min-h-0 flex-1 flex-col gap-2 px-2 pb-2">
        <div className="card-ios h-12 shrink-0 rounded-xl border border-border bg-card" />
        <div className="card-ios flex flex-1 flex-col gap-2 rounded-xl border border-border bg-card p-3">
          <div className="h-4 w-32 rounded bg-[var(--fill-tertiary)]" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-[var(--fill-tertiary)]/70" />
          ))}
        </div>
      </div>
    </div>
  );
}
