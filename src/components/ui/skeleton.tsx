import clsx from "clsx";

type SkeletonProps = {
  variant?: "text" | "heading" | "card" | "circle";
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
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c}>
              <div className="skeleton skeleton-text" style={{ width: `${50 + Math.random() * 30}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
