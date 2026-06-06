import { useQuery } from "@tanstack/react-query";
import { Clock, CalendarDays, Settings as SettingsIcon, Shield } from "lucide-react";
import { http, unwrap } from "../../api/http";
import { Badge } from "../../components/ui/badge";
import { Card, CardHeader, KpiCard } from "../../components/ui/card";
import { DataTable } from "../../components/ui/table";

type Shift = { _id: string; name?: string; startTime?: string; endTime?: string; isActive?: boolean };
type Holiday = { _id: string; name?: string; date?: string; isActive?: boolean };

export function SettingsPage() {
  const shifts = useQuery({
    queryKey: ["settings", "shifts"],
    queryFn: async () => unwrap<Shift[]>((await http.get("/attendance/shifts/active")).data)
  });
  const holidays = useQuery({
    queryKey: ["settings", "holidays"],
    queryFn: async () => unwrap<Holiday[]>((await http.get("/attendance/holidays")).data)
  });

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Settings</h1>
          <p>Operational HRM setup, shift management, and holiday calendars.</p>
        </div>
      </div>

      <section className="kpi-grid">
        <KpiCard icon={<Clock size={20} />} iconColor="purple" label="Active Shifts" value={shifts.data?.length ?? 0} />
        <KpiCard icon={<CalendarDays size={20} />} iconColor="green" label="Holidays" value={holidays.data?.length ?? 0} />
        <KpiCard icon={<Shield size={20} />} iconColor="blue" label="Roles" value="RBAC" meta="Coming soon" />
        <KpiCard icon={<SettingsIcon size={20} />} iconColor="amber" label="Workflows" value="—" meta="Coming soon" />
      </section>

      <section className="grid-2">
        <Card>
          <CardHeader><h3>Active Shifts</h3></CardHeader>
          <DataTable columns={["Shift Name", "Start", "End", "Status"]} empty={!shifts.data?.length} loading={shifts.isLoading}>
            {shifts.data?.map((shift) => (
              <tr key={shift._id}>
                <td><strong>{shift.name || "-"}</strong></td>
                <td>{shift.startTime || "-"}</td>
                <td>{shift.endTime || "-"}</td>
                <td><Badge tone={shift.isActive === false ? "red" : "green"} dot>{shift.isActive === false ? "Inactive" : "Active"}</Badge></td>
              </tr>
            ))}
          </DataTable>
        </Card>

        <Card>
          <CardHeader><h3>Holiday Calendar</h3></CardHeader>
          <DataTable columns={["Holiday", "Date", "Status"]} empty={!holidays.data?.length} loading={holidays.isLoading}>
            {holidays.data?.map((holiday) => (
              <tr key={holiday._id}>
                <td><strong>{holiday.name || "-"}</strong></td>
                <td style={{ color: "var(--text-muted)" }}>{holiday.date ? new Date(holiday.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-"}</td>
                <td><Badge tone={holiday.isActive === false ? "red" : "green"} dot>{holiday.isActive === false ? "Inactive" : "Active"}</Badge></td>
              </tr>
            ))}
          </DataTable>
        </Card>
      </section>
    </>
  );
}
