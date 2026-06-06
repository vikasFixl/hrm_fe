import clsx from "clsx";
import { ReactNode } from "react";

export function Card({ className, style, children }: { className?: string; style?: React.CSSProperties; children: ReactNode }) {
  return <section className={clsx("card", className)} style={style}>{children}</section>;
}

export function CardHeader({ children, action, className, style }: { children: ReactNode; action?: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={clsx("card-header", className)} style={style}>
      <div>{children}</div>
      {action}
    </div>
  );
}

export function CardBody({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={clsx("card-body", className)} style={style}>{children}</div>;
}

export function KpiCard({
  label,
  value,
  meta,
  icon,
  iconColor = "purple",
}: {
  label: string;
  value: string | number;
  meta?: string;
  icon?: ReactNode;
  iconColor?: "purple" | "green" | "amber" | "blue";
}) {
  return (
    <div className="kpi-card">
      {icon && <div className={clsx("kpi-icon", iconColor)}>{icon}</div>}
      <span className="kpi-label">{label}</span>
      <strong>{value}</strong>
      {meta && <small>{meta}</small>}
    </div>
  );
}
