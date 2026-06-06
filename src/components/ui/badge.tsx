import clsx from "clsx";

type BadgeTone = "neutral" | "green" | "red" | "yellow" | "blue" | "purple";

export function Badge({
  children,
  tone = "neutral",
  dot,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
}) {
  return (
    <span className={clsx("badge", `badge-${tone}`, dot && "badge-dot")}>
      {children}
    </span>
  );
}
