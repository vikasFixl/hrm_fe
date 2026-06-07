import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Card, CardBody, CardHeader, KpiCard } from "../../../components/ui/card";
import { DataTable } from "../../../components/ui/table";
import { Button } from "../../../components/ui/button";
import { SkeletonCard } from "../../../components/ui/skeleton";
import { DashboardChart } from "./dashboard-chart";
import type { HrmDashboardResponse } from "../types";
import { formatDate } from "../../../lib/format";

const toneMap = {
  blue: "blue",
  green: "green",
  amber: "amber",
  purple: "purple",
  red: "red"
} as const;

function formatCell(value: unknown) {
  if (value == null || value === "") return "-";
  if (value instanceof Date) return formatDate(value.toISOString());
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return formatDate(value);
  return String(value);
}

export function DashboardView({
  title,
  subtitle,
  data,
  loading,
  error
}: {
  title: string;
  subtitle?: string;
  data?: HrmDashboardResponse;
  loading?: boolean;
  error?: string | null;
}) {
  if (loading) {
    return (
      <>
        <div className="page-title"><div><h1>{title}</h1><p>{subtitle}</p></div></div>
        <section className="kpi-grid">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </section>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="page-title"><div><h1>{title}</h1><p>{subtitle}</p></div></div>
        <Card><CardBody><p className="field-error">{error}</p></CardBody></Card>
      </>
    );
  }

  const widgets = data?.widgets || [];
  const charts = data?.charts || [];
  const tables = data?.tables || [];
  const actions = data?.actions || [];

  return (
    <>
      <div className="page-title">
        <div>
          <h1>{title}</h1>
          <p>{subtitle || `Role: ${data?.role || "-"}`}</p>
        </div>
        {actions.length > 0 && (
          <div className="toolbar">
            {actions.slice(0, 3).map((action) => (
              <Link key={action.route} className="btn btn-secondary" to={action.route}>
                {action.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {widgets.length > 0 && (
        <section className="kpi-grid">
          {widgets.map((widget) => (
            <KpiCard
              key={widget.id}
              label={widget.label}
              value={widget.value}
              meta={widget.meta}
              iconColor={(widget.tone === "red" ? "amber" : toneMap[widget.tone || "blue"]) as "purple" | "green" | "amber" | "blue"}
            />
          ))}
        </section>
      )}

      {charts.length > 0 && (
        <section className="grid-2" style={{ marginBottom: 24 }}>
          {charts.map((chart) => (
            <Card key={chart.id}>
              <CardBody>
                <DashboardChart title={chart.title} type={chart.type} data={chart.data} />
              </CardBody>
            </Card>
          ))}
        </section>
      )}

      {tables.length > 0 && (
        <section className="grid-2">
          {tables.map((table) => (
            <Card key={table.id}>
              <CardHeader><h3>{table.title}</h3></CardHeader>
              <DataTable columns={table.columns} empty={!table.rows?.length}>
                {table.rows?.map((row, index) => (
                  <tr key={index}>
                    {table.columns.map((column) => {
                      const key = column.toLowerCase().replace(/\s+/g, "");
                      const aliases: Record<string, string[]> = {
                        name: ["name"],
                        code: ["code"],
                        department: ["department"],
                        joindate: ["joinDate", "joindate"],
                        status: ["status"],
                        employee: ["employee"],
                        type: ["type"],
                        from: ["from"],
                        to: ["to"],
                        title: ["title"],
                        amount: ["amount"],
                        destination: ["destination"],
                        departure: ["departure"],
                        action: ["action"],
                        date: ["date"],
                        period: ["period"],
                        netpay: ["netPay", "netpay"],
                        asset: ["asset"],
                        email: ["email"],
                        job: ["job"],
                        rating: ["rating"],
                        start: ["start"],
                        latemin: ["lateMin", "latemin"],
                        workmin: ["workMin", "workmin"]
                      };
                      const candidates = aliases[key] || [key.charAt(0).toLowerCase() + key.slice(1).replace(/\s/g, "")];
                      const value = candidates.map((candidate) => row[candidate]).find((v) => v !== undefined);
                      return <td key={column}>{formatCell(value)}</td>;
                    })}
                  </tr>
                ))}
              </DataTable>
            </Card>
          ))}
        </section>
      )}

      {actions.length > 3 && (
        <Card>
          <CardHeader><h3>Quick Actions</h3></CardHeader>
          <CardBody>
            <div className="toolbar" style={{ flexWrap: "wrap" }}>
              {actions.map((action) => (
                <Link key={action.route} to={action.route}>
                  <Button variant="secondary" icon={<ArrowUpRight size={14} />}>{action.label}</Button>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {!widgets.length && !charts.length && !tables.length && (
        <Card><CardBody><p className="muted">No dashboard widgets configured for this role yet.</p></CardBody></Card>
      )}
    </>
  );
}
