type LoadingProps = { label: string; dashboard?: boolean; compact?: boolean };

export function Loading({
  label,
  dashboard = false,
  compact = false,
}: LoadingProps) {
  return (
    <div
      className={`loading-shell ${dashboard ? "dashboard-loading" : compact ? "compact-loading" : "detail-loading"}`}
    >
      <p role="status">{label}</p>
      {dashboard && <small>A free backend may take a moment to wake up.</small>}
      <div className="skeleton-layout" aria-hidden="true">
        <div className="skeleton skeleton-title" />
        {!compact && <div className="skeleton skeleton-banner" />}
        <div className="skeleton-cards">
          {Array.from({ length: dashboard ? 4 : 2 }, (_, index) => (
            <div className="skeleton skeleton-card" key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
