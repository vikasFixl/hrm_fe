import clsx from "clsx";

type SkeletonProps = {
  variant?: "text" | "heading" | "card" | "circle" | "avatar";
  width?: string;
  height?: string;
  className?: string;
};

export function Skeleton({ variant = "text", width, height, className }: SkeletonProps) {
  return (
    <div
      className={clsx("skeleton", `skeleton-${variant}`, className)}
      style={{ width, height }}
    />
  );
}

export function SkeletonRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  const widths = ["74%", "58%", "66%", "46%", "62%", "52%"];

  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c}>
              <div className="skeleton skeleton-text" style={{ width: widths[(r + c) % widths.length] }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkeletonCard({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={clsx("skeleton-card-shell", className)}>
      <Skeleton variant="heading" width="62%" />
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} width={index % 2 ? "72%" : "88%"} />
      ))}
      <Skeleton height="8px" width="100%" className="skeleton-progress" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, index) => (
              <th key={index}>
                <Skeleton width="70%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <SkeletonRows rows={rows} cols={cols} />
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="skeleton-chart">
      {Array.from({ length: 7 }).map((_, index) => (
        <span key={index} style={{ height: `${34 + index * 8}%` }} />
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton-list-row">
          <Skeleton variant="avatar" />
          <div>
            <Skeleton width={index % 2 ? "58%" : "72%"} />
            <Skeleton width={index % 2 ? "76%" : "54%"} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonAvatar() {
  return <Skeleton variant="avatar" />;
}

export function SkeletonProfile() {
  return (
    <div className="skeleton-profile">
      <Skeleton variant="avatar" width="64px" height="64px" />
      <div>
        <Skeleton variant="heading" width="180px" />
        <Skeleton width="240px" />
        <Skeleton width="160px" />
      </div>
    </div>
  );
}

export function SkeletonForm({ fields = 6 }: { fields?: number }) {
  return (
    <div className="skeleton-form">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index}>
          <Skeleton width="34%" />
          <Skeleton height="42px" width="100%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="kpi-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="kpi-card">
          <Skeleton variant="avatar" width="42px" height="42px" />
          <Skeleton width="52%" />
          <Skeleton variant="heading" width="38%" />
          <Skeleton width="66%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCalendar() {
  return (
    <div className="skeleton-calendar">
      {Array.from({ length: 35 }).map((_, index) => (
        <Skeleton key={index} height="46px" />
      ))}
    </div>
  );
}
