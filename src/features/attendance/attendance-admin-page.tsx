// @ts-nocheck
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CopyCheck, Moon, Plus, ShieldCheck, TimerReset } from "lucide-react";
import { attendancePolicyApi, attendanceShiftApi } from "../../api/hrm-api";
import { getErrorMessage } from "../../api/http";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardBody, CardHeader, KpiCard } from "../../components/ui/card";
import { Field, Input, Select } from "../../components/ui/field";
import { Modal } from "../../components/ui/modal";
import { DataTable } from "../../components/ui/table";
import { useToast } from "../../components/ui/toast";

type AttendanceAdminMode = "shifts" | "policy";

const defaultShift = {
  shiftType: "morning",
  startTime: "09:00",
  endTime: "18:00",
  breakMinutes: 60,
  graceInMinutes: 10,
  graceOutMinutes: 10,
  halfDayAfterMinutes: 240,
  overtimeAfterMinutes: 540,
  isNightShift: false
};

const defaultPolicy = {
  lateAllowedMinutes: 10,
  halfDayThresholdMinutes: 240,
  absentThresholdMinutes: 120,
  overtimeMinMinutes: 30,
  allowEarlyPunch: true,
  allowLatePunch: true,
  sandwichLeaveRule: false,
  allowBackdatedRegularization: true,
  maxBackdateDays: 30,
  effectiveFrom: new Date().toISOString().slice(0, 10)
};

export function AttendanceAdminPage({ mode }: { mode: AttendanceAdminMode }) {
  return mode === "policy" ? <AttendancePolicyPage /> : <ShiftMasterPage />;
}

function ShiftMasterPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultShift);
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const shifts = useQuery({
    queryKey: ["attendance", "shifts", "admin"],
    queryFn: () => attendanceShiftApi.list()
  });

  const createShift = useMutation({
    mutationFn: attendanceShiftApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["attendance", "shifts"] });
      setOpen(false);
      setForm(defaultShift);
      notify("Shift created", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const disableShift = useMutation({
    mutationFn: attendanceShiftApi.disable,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["attendance", "shifts"] });
      notify("Shift disabled", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const metrics = useMemo(() => {
    const rows = shifts.data || [];
    return {
      active: rows.length,
      night: rows.filter((shift: any) => shift.isNightShift).length,
      grace: rows.reduce((sum: number, shift: any) => sum + Number(shift.graceInMinutes || 0), 0)
    };
  }, [shifts.data]);

  function update(key: string, value: any) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    createShift.mutate({
      ...form,
      breakMinutes: Number(form.breakMinutes),
      graceInMinutes: Number(form.graceInMinutes),
      graceOutMinutes: Number(form.graceOutMinutes),
      halfDayAfterMinutes: Number(form.halfDayAfterMinutes),
      overtimeAfterMinutes: Number(form.overtimeAfterMinutes)
    });
  }

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Shift Master</h1>
          <p>Create and maintain organization shifts used during onboarding and attendance derivation.</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setOpen(true)}>Create Shift</Button>
      </div>

      <section className="kpi-grid">
        <KpiCard icon={<CalendarClock size={20} />} iconColor="blue" label="Active Shifts" value={metrics.active} />
        <KpiCard icon={<Moon size={20} />} iconColor="purple" label="Night Shifts" value={metrics.night} />
        <KpiCard icon={<TimerReset size={20} />} iconColor="amber" label="Total Grace In" value={`${metrics.grace} min`} />
        <KpiCard icon={<CopyCheck size={20} />} iconColor="green" label="Used In Onboarding" value="Enabled" />
      </section>

      <Card>
        <CardHeader><h2>Configured Shifts</h2></CardHeader>
        <DataTable columns={["Shift", "Timing", "Rules", "Status", "Actions"]} loading={shifts.isLoading} empty={!shifts.data?.length}>
          {shifts.data?.map((shift: any) => (
            <tr key={shift._id}>
              <td><strong>{labelShift(shift.shiftType)}</strong></td>
              <td>{shift.startTime} - {shift.endTime}<br /><span className="muted">Break {shift.breakMinutes || 0} min</span></td>
              <td>Grace {shift.graceInMinutes || 0}/{shift.graceOutMinutes || 0} min<br /><span className="muted">Half day after {shift.halfDayAfterMinutes} min</span></td>
              <td><Badge tone={shift.isActive ? "green" : "red"} dot>{shift.isActive ? "Active" : "Inactive"}</Badge></td>
              <td>
                <Button size="sm" variant="secondary" onClick={() => disableShift.mutate(shift._id)} disabled={disableShift.isPending}>
                  Disable
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      </Card>

      <Modal title="Create Shift" open={open} onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={submit}>
          <div className="form-grid two">
            <Field label="Shift type" required>
              <Select value={form.shiftType} onChange={(event) => update("shiftType", event.target.value)} required>
                <option value="morning">Morning</option>
                <option value="noon">Noon</option>
                <option value="night">Night</option>
              </Select>
            </Field>
            <Field label="Night shift">
              <Select value={form.isNightShift ? "yes" : "no"} onChange={(event) => update("isNightShift", event.target.value === "yes")}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </Select>
            </Field>
          </div>
          <div className="form-grid two">
            <Field label="Start time" required><Input type="time" value={form.startTime} onChange={(event) => update("startTime", event.target.value)} required /></Field>
            <Field label="End time" required><Input type="time" value={form.endTime} onChange={(event) => update("endTime", event.target.value)} required /></Field>
          </div>
          <div className="form-grid three">
            <Field label="Break minutes"><Input type="number" min="0" value={form.breakMinutes} onChange={(event) => update("breakMinutes", event.target.value)} /></Field>
            <Field label="Grace in minutes"><Input type="number" min="0" value={form.graceInMinutes} onChange={(event) => update("graceInMinutes", event.target.value)} /></Field>
            <Field label="Grace out minutes"><Input type="number" min="0" value={form.graceOutMinutes} onChange={(event) => update("graceOutMinutes", event.target.value)} /></Field>
          </div>
          <div className="form-grid two">
            <Field label="Half day after minutes" required><Input type="number" min="0" value={form.halfDayAfterMinutes} onChange={(event) => update("halfDayAfterMinutes", event.target.value)} required /></Field>
            <Field label="Overtime after minutes"><Input type="number" min="0" value={form.overtimeAfterMinutes} onChange={(event) => update("overtimeAfterMinutes", event.target.value)} /></Field>
          </div>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createShift.isPending}>Create Shift</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function AttendancePolicyPage() {
  const [form, setForm] = useState(defaultPolicy);
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const policy = useQuery({
    queryKey: ["attendance", "policy", "active"],
    queryFn: attendancePolicyApi.active,
    retry: false
  });

  const savePolicy = useMutation({
    mutationFn: attendancePolicyApi.upsert,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["attendance", "policy"] });
      notify("Attendance policy saved", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const active = policy.data;
  const values = active || form;

  useEffect(() => {
    if (!active) return;
    setForm({
      lateAllowedMinutes: active.lateAllowedMinutes ?? defaultPolicy.lateAllowedMinutes,
      halfDayThresholdMinutes: active.halfDayThresholdMinutes ?? defaultPolicy.halfDayThresholdMinutes,
      absentThresholdMinutes: active.absentThresholdMinutes ?? defaultPolicy.absentThresholdMinutes,
      overtimeMinMinutes: active.overtimeMinMinutes ?? defaultPolicy.overtimeMinMinutes,
      allowEarlyPunch: active.allowEarlyPunch ?? defaultPolicy.allowEarlyPunch,
      allowLatePunch: active.allowLatePunch ?? defaultPolicy.allowLatePunch,
      sandwichLeaveRule: active.sandwichLeaveRule ?? defaultPolicy.sandwichLeaveRule,
      allowBackdatedRegularization: active.allowBackdatedRegularization ?? defaultPolicy.allowBackdatedRegularization,
      maxBackdateDays: active.maxBackdateDays ?? defaultPolicy.maxBackdateDays,
      effectiveFrom: active.effectiveFrom ? new Date(active.effectiveFrom).toISOString().slice(0, 10) : defaultPolicy.effectiveFrom
    });
  }, [active?._id]);

  function update(key: string, value: any) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    savePolicy.mutate({
      ...form,
      lateAllowedMinutes: Number(form.lateAllowedMinutes),
      halfDayThresholdMinutes: Number(form.halfDayThresholdMinutes),
      absentThresholdMinutes: Number(form.absentThresholdMinutes),
      overtimeMinMinutes: Number(form.overtimeMinMinutes),
      maxBackdateDays: Number(form.maxBackdateDays),
      effectiveFrom: form.effectiveFrom
    });
  }

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Attendance Policy</h1>
          <p>Configure the active attendance rules used for late marks, half days, absence, overtime, and regularization.</p>
        </div>
      </div>

      <section className="kpi-grid">
        <KpiCard icon={<ShieldCheck size={20} />} iconColor="green" label="Policy Status" value={active ? "Active" : "Not Set"} />
        <KpiCard icon={<TimerReset size={20} />} iconColor="amber" label="Late Grace" value={`${values.lateAllowedMinutes ?? 0} min`} />
        <KpiCard icon={<CalendarClock size={20} />} iconColor="blue" label="Half Day Threshold" value={`${values.halfDayThresholdMinutes ?? 0} min`} />
        <KpiCard icon={<CopyCheck size={20} />} iconColor="purple" label="Backdated Regularization" value={values.allowBackdatedRegularization ? "Allowed" : "Blocked"} />
      </section>

      <Card>
        <CardHeader><h2>{active ? "Replace Active Policy" : "Create Active Policy"}</h2></CardHeader>
        <CardBody>
          <form className="form-grid" onSubmit={submit}>
            <div className="form-grid three">
              <Field label="Late allowed minutes"><Input type="number" min="0" value={form.lateAllowedMinutes} onChange={(event) => update("lateAllowedMinutes", event.target.value)} /></Field>
              <Field label="Half day threshold" required><Input type="number" min="0" value={form.halfDayThresholdMinutes} onChange={(event) => update("halfDayThresholdMinutes", event.target.value)} required /></Field>
              <Field label="Absent threshold" required><Input type="number" min="0" value={form.absentThresholdMinutes} onChange={(event) => update("absentThresholdMinutes", event.target.value)} required /></Field>
            </div>
            <div className="form-grid three">
              <Field label="Overtime minimum"><Input type="number" min="0" value={form.overtimeMinMinutes} onChange={(event) => update("overtimeMinMinutes", event.target.value)} /></Field>
              <Field label="Max backdate days"><Input type="number" min="0" value={form.maxBackdateDays} onChange={(event) => update("maxBackdateDays", event.target.value)} /></Field>
              <Field label="Effective from"><Input type="date" value={form.effectiveFrom} onChange={(event) => update("effectiveFrom", event.target.value)} /></Field>
            </div>
            <div className="form-grid three">
              <Field label="Early punch">
                <Select value={form.allowEarlyPunch ? "yes" : "no"} onChange={(event) => update("allowEarlyPunch", event.target.value === "yes")}>
                  <option value="yes">Allowed</option>
                  <option value="no">Blocked</option>
                </Select>
              </Field>
              <Field label="Late punch">
                <Select value={form.allowLatePunch ? "yes" : "no"} onChange={(event) => update("allowLatePunch", event.target.value === "yes")}>
                  <option value="yes">Allowed</option>
                  <option value="no">Blocked</option>
                </Select>
              </Field>
              <Field label="Sandwich leave">
                <Select value={form.sandwichLeaveRule ? "yes" : "no"} onChange={(event) => update("sandwichLeaveRule", event.target.value === "yes")}>
                  <option value="no">Disabled</option>
                  <option value="yes">Enabled</option>
                </Select>
              </Field>
            </div>
            <Field label="Backdated regularization">
              <Select value={form.allowBackdatedRegularization ? "yes" : "no"} onChange={(event) => update("allowBackdatedRegularization", event.target.value === "yes")}>
                <option value="yes">Allowed</option>
                <option value="no">Blocked</option>
              </Select>
            </Field>
            <div className="form-actions">
              <Button type="submit" loading={savePolicy.isPending}>Save Active Policy</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  );
}

function labelShift(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "Shift";
}
