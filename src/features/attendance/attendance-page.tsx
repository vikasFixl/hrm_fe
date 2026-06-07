// @ts-nocheck
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Clock, Edit, Lock, Unlock } from "lucide-react";
import { attendanceApi, employeeApi } from "../../api/hrm-api";
import { DailyAttendance } from "../../api/types";
import { getErrorMessage } from "../../api/http";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, KpiCard } from "../../components/ui/card";
import { Field, Input, Select } from "../../components/ui/field";
import { Modal } from "../../components/ui/modal";
import { DataTable } from "../../components/ui/table";
import { Tabs } from "../../components/ui/tabs";
import { AsyncSelect } from "../../components/ui/async-select";
import { useToast } from "../../components/ui/toast";
import { useAuth } from "../auth/auth-context";
import { canWriteFeature } from "../auth/role-access";
import { formatDate, formatTime, minutesToHours } from "../../lib/format";

type AttendanceTab = "mine" | "punches" | "employee";
type OverrideForm = { status: DailyAttendance["status"] };

export function AttendancePage() {
  const [tab, setTab] = useState<AttendanceTab>("mine");
  const [employeeId, setEmployeeId] = useState("");
  const [overrideRow, setOverrideRow] = useState<DailyAttendance | null>(null);
  const overrideForm = useForm<OverrideForm>();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const { employee } = useAuth();
  const canManageAttendance = canWriteFeature(employee?.role, "attendance");
  const mine = useQuery({ queryKey: ["attendance", "mine"], queryFn: attendanceApi.mine });
  const punches = useQuery({ queryKey: ["attendance", "today-punches"], queryFn: attendanceApi.todayPunches });
  const employeeAttendance = useQuery({
    queryKey: ["attendance", "employee", employeeId],
    queryFn: () => attendanceApi.employee(employeeId),
    enabled: Boolean(employeeId)
  });

  const punch = useMutation({
    mutationFn: attendanceApi.punch,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["attendance"] });
      notify("Punch recorded", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const lockAll = useMutation({
    mutationFn: attendanceApi.lockAll,
    onSuccess: () => notify("Attendance locked for payroll", "success"),
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const lockEmployee = useMutation({
    mutationFn: attendanceApi.lockEmployee,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["attendance"] });
      notify("Employee attendance locked", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const unlockEmployee = useMutation({
    mutationFn: attendanceApi.unlockEmployee,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["attendance"] });
      notify("Employee attendance unlocked", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const overrideAttendance = useMutation({
    mutationFn: (values: OverrideForm) => attendanceApi.override(overrideRow!._id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["attendance"] });
      setOverrideRow(null);
      notify("Attendance overridden", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const rows = tab === "employee" ? employeeAttendance.data : mine.data;
  const today = new Date();
  const monthRange = {
    from: new Date(today.getFullYear(), today.getMonth(), 1).toISOString(),
    to: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString()
  };

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Attendance</h1>
          <p>Track daily attendance, punches, and payroll locks.</p>
        </div>
        <div className="toolbar">
          <Button icon={<Clock size={16} />} onClick={() => punch.mutate("IN")} loading={punch.isPending}>Punch In</Button>
          <Button variant="secondary" icon={<Clock size={16} />} onClick={() => punch.mutate("OUT")}>Punch Out</Button>
          {canManageAttendance && <Button variant="secondary" icon={<Lock size={16} />} onClick={() => lockAll.mutate(monthRange)} loading={lockAll.isPending}>Lock Payroll</Button>}
        </div>
      </div>

      <section className="kpi-grid">
        <KpiCard icon={<CalendarCheck size={20} />} iconColor="purple" label="My Records" value={mine.data?.length ?? 0} />
        <KpiCard icon={<Clock size={20} />} iconColor="green" label="Today Punches" value={punches.data?.length ?? 0} />
      </section>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "mine", label: "My Attendance" },
          { value: "punches", label: "Today Punches" },
          ...(canManageAttendance ? [{ value: "employee", label: "Employee Lookup" }] : [])
        ]}
      />

      {tab === "employee" && (
        <Card className="card-padded">
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <Field label="Employee">
              <AsyncSelect value={employeeId} onChange={setEmployeeId} fetchOptions={employeeApi.searchEmployeesByEmail} placeholder="Search employee by email..." />
            </Field>
            {canManageAttendance && <Button variant="secondary" size="sm" icon={<Lock size={14} />} onClick={() => employeeId && lockEmployee.mutate({ employeeId, ...monthRange })}>Lock</Button>}
            {canManageAttendance && <Button variant="secondary" size="sm" icon={<Unlock size={14} />} onClick={() => employeeId && unlockEmployee.mutate({ employeeId, ...monthRange, reason: "Manual unlock from HRM UI" })}>Unlock</Button>}
          </div>
        </Card>
      )}

      <Card>
        {tab === "punches" ? (
          <DataTable columns={["Time", "Logical Day", "Type", "Source"]} empty={!punches.data?.length} loading={punches.isLoading}>
            {punches.data?.map((row) => (
              <tr key={row._id}>
                <td style={{ fontWeight: 500 }}>{formatTime(row.timestamp)}</td>
                <td style={{ color: "var(--text-muted)" }}>{formatDate(row.logicalDay)}</td>
                <td><Badge tone={row.punchType === "IN" ? "green" : "blue"} dot>{row.punchType}</Badge></td>
                <td>{row.source}</td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <DataTable
            columns={["Date", "First In", "Last Out", "Worked", "Late", "Overtime", "Status", "Locked", "Actions"]}
            empty={!rows?.length}
            loading={tab === "mine" ? mine.isLoading : employeeAttendance.isLoading}
          >
            {rows?.map((row) => (
              <tr key={row._id}>
                <td style={{ fontWeight: 500 }}>{formatDate(row.date)}</td>
                <td>{formatTime(row.firstIn)}</td>
                <td>{formatTime(row.lastOut)}</td>
                <td>{minutesToHours(row.totalWorkMinutes)}</td>
                <td>{minutesToHours(row.lateMinutes)}</td>
                <td>{minutesToHours(row.overtimeMinutes)}</td>
                <td><Badge tone={row.status === "Present" ? "green" : row.status === "Absent" ? "red" : "yellow"} dot>{row.status}</Badge></td>
                <td>{row.isLocked ? <Badge tone="blue">Locked</Badge> : <span className="muted">Open</span>}</td>
                <td>
                  {canManageAttendance ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      icon={<Edit size={15} />}
                      onClick={() => {
                        setOverrideRow(row);
                        overrideForm.reset({ status: row.status });
                      }}
                      aria-label="Override"
                    />
                  ) : <span className="muted">View</span>}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>

      <Modal title="Override Attendance" open={Boolean(overrideRow)} onClose={() => setOverrideRow(null)}>
        <form className="form-grid" onSubmit={overrideForm.handleSubmit((values) => overrideAttendance.mutate(values))}>
          <Field label="Status" required>
            <Select {...overrideForm.register("status")}>
              <option>Present</option>
              <option>Absent</option>
              <option>HalfDay</option>
              <option>Leave</option>
              <option>Holiday</option>
              <option>Weekend</option>
            </Select>
          </Field>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setOverrideRow(null)}>Cancel</Button>
            <Button type="submit" loading={overrideAttendance.isPending}>Override</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
