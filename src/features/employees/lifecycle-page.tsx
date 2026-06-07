// @ts-nocheck
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleUserRound, ClipboardCheck, Eye, Play, RefreshCw, UserMinus, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { employeeApi, lifecycleApi } from "../../api/hrm-api";
import { getErrorMessage } from "../../api/http";
import { Avatar } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, KpiCard } from "../../components/ui/card";
import { Field, Input, Select, Textarea } from "../../components/ui/field";
import { Modal } from "../../components/ui/modal";
import { DataTable } from "../../components/ui/table";
import { Tabs } from "../../components/ui/tabs";
import { useToast } from "../../components/ui/toast";
import { formatDate } from "../../lib/format";

type LifecycleTab = "onboarding" | "offboarding";

const onboardingStatuses = ["Initiated", "PendingEmployeeAction", "Submitted", "UnderReview", "Completed", "Rejected", "Cancelled"];
const offboardingStatuses = ["Initiated", "InProgress", "Completed"];

function employeeName(employee: any) {
  if (!employee) return "Unknown employee";
  const personal = employee.personalInfo || {};
  return [employee.firstName || personal.firstName, employee.lastName || personal.lastName].filter(Boolean).join(" ")
    || employee.employeeId || employee.employeeCode || employee.email || "Unknown employee";
}

function employeeEmail(employee: any) {
  return employee?.email || employee?.workEmail || employee?.personalInfo?.email || "-";
}

function statusTone(status: string) {
  if (status === "Completed") return "green";
  if (status === "Rejected" || status === "Cancelled") return "red";
  if (status === "UnderReview" || status === "Submitted") return "blue";
  if (status === "Pending" || status === "PendingEmployeeAction") return "yellow";
  return "purple";
}

export function LifecyclePage() {
  const [tab, setTab] = useState<LifecycleTab>("onboarding");
  const [onboardingFilter, setOnboardingFilter] = useState("");
  const [offboardingFilter, setOffboardingFilter] = useState("");
  const [startType, setStartType] = useState<LifecycleTab | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [employeeId, setEmployeeId] = useState("");
  const [nextStatus, setNextStatus] = useState("");
  const [reason, setReason] = useState("");
  const [lastWorkingDay, setLastWorkingDay] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [attendanceStartDate, setAttendanceStartDate] = useState("");
  const [feedback, setFeedback] = useState("");
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const navigate = useNavigate();

  const onboardings = useQuery({
    queryKey: ["lifecycle", "onboarding", onboardingFilter],
    queryFn: () => lifecycleApi.listOnboardings({ status: onboardingFilter || undefined, limit: 100 })
  });
  const offboardings = useQuery({
    queryKey: ["lifecycle", "offboarding", offboardingFilter],
    queryFn: () => lifecycleApi.listOffboardings({ status: offboardingFilter || undefined })
  });
  const employees = useQuery({ queryKey: ["employees"], queryFn: employeeApi.list });

  const onboardingRows = onboardings.data?.onboardings || [];
  const offboardingRows = offboardings.data || [];
  const metrics = useMemo(() => {
    const all = [...onboardingRows, ...offboardingRows];
    return {
      onboarding: onboardingRows.length,
      offboarding: offboardingRows.length,
      active: all.filter((item) => ["Initiated", "Pending", "InProgress"].includes(item.status)).length,
      completed: all.filter((item) => item.status === "Completed").length
    };
  }, [onboardingRows, offboardingRows]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["lifecycle"] });
  };
  const mutationOptions = (message: string, close = true) => ({
    onSuccess: async () => {
      await refresh();
      if (close) {
        setStartType(null);
        setSelected(null);
      }
      notify(message, "success");
    },
    onError: (error: unknown) => notify(getErrorMessage(error), "error")
  });
  const initiateOnboarding = useMutation({
    mutationFn: lifecycleApi.initiateOnboarding,
    ...mutationOptions("Onboarding initiated")
  });
  const initiateOffboarding = useMutation({
    mutationFn: lifecycleApi.initiateOffboarding,
    ...mutationOptions("Offboarding initiated")
  });
  const updateOnboarding = useMutation({
    mutationFn: ({ id, payload }: any) => lifecycleApi.updateOnboarding(id, payload),
    ...mutationOptions("Onboarding status updated")
  });
  const updateOffboarding = useMutation({
    mutationFn: ({ id, payload }: any) => lifecycleApi.updateOffboarding(id, payload),
    ...mutationOptions("Offboarding updated")
  });

  function openStatus(record: any, type: LifecycleTab) {
    setSelected({ ...record, lifecycleType: type });
    setNextStatus(record.status === "Initiated" ? "PendingEmployeeAction" : record.status === "Submitted" ? "UnderReview" : "Completed");
    setRejectionReason("");
    setShiftId("");
    setAttendanceStartDate(new Date().toISOString().slice(0, 10));
    setFeedback(record.feedback || "");
  }

  function submitStart(event: React.FormEvent) {
    event.preventDefault();
    if (startType === "onboarding") initiateOnboarding.mutate(employeeId);
    if (startType === "offboarding") {
      initiateOffboarding.mutate({ employeeId, reason, lastWorkingDay, checklist: [] });
    }
  }

  function submitStatus(event: React.FormEvent) {
    event.preventDefault();
    if (selected.lifecycleType === "onboarding") {
      updateOnboarding.mutate({
        id: selected.onboardingId,
        payload: {
          status: nextStatus,
          rejectionReason: nextStatus === "Rejected" ? rejectionReason : undefined,
          shiftId: nextStatus === "Completed" ? shiftId : undefined,
          attendanceStartDate: nextStatus === "Completed" ? attendanceStartDate : undefined
        }
      });
    } else {
      updateOffboarding.mutate({ id: selected._id, payload: { status: nextStatus, feedback } });
    }
  }

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Employee Lifecycle</h1>
          <p>Track and manage every employee onboarding and offboarding workflow.</p>
        </div>
        <div className="toolbar">
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={refresh}>Refresh</Button>
          <Button variant="secondary" icon={<UserMinus size={16} />} onClick={() => setStartType("offboarding")}>Start Offboarding</Button>
          <Button icon={<UserPlus size={16} />} onClick={() => setStartType("onboarding")}>Start Onboarding</Button>
        </div>
      </div>

      <section className="kpi-grid">
        <KpiCard icon={<CircleUserRound size={20} />} iconColor="blue" label="Onboarding Records" value={metrics.onboarding} />
        <KpiCard icon={<UserMinus size={20} />} iconColor="amber" label="Offboarding Records" value={metrics.offboarding} />
        <KpiCard icon={<Play size={20} />} iconColor="purple" label="Active Workflows" value={metrics.active} />
        <KpiCard icon={<CheckCircle2 size={20} />} iconColor="green" label="Completed" value={metrics.completed} />
      </section>

      <Tabs value={tab} onChange={setTab} tabs={[
        { value: "onboarding", label: `Onboarding (${onboardingRows.length})` },
        { value: "offboarding", label: `Offboarding (${offboardingRows.length})` }
      ]} />

      <Card>
        {tab === "onboarding" ? (
          <DataTable
            columns={["Employee", "Started", "Bank Verification", "Status", "Actions"]}
            loading={onboardings.isLoading}
            empty={!onboardingRows.length}
            toolbar={<StatusFilter value={onboardingFilter} statuses={onboardingStatuses} onChange={setOnboardingFilter} />}
          >
            {onboardingRows.map((record) => (
              <tr key={record.onboardingId}>
                <td><EmployeeCell employee={record.employee} /></td>
                <td>{formatDate(record.createdAt)}</td>
                <td><Badge tone={record.bankDetailsVerified ? "green" : "yellow"} dot>{record.bankDetailsVerified ? "Verified" : "Pending"}</Badge></td>
                <td><Badge tone={statusTone(record.status)} dot>{record.status}</Badge></td>
                <td>
                  <div className="toolbar">
                    <Button size="sm" variant="secondary" icon={<Eye size={15} />} onClick={() => navigate(`/hrm/lifecycle/onboarding/${record.onboardingId}`)}>View</Button>
                    <Button size="sm" variant="ghost" icon={<ClipboardCheck size={15} />} onClick={() => openStatus(record, "onboarding")}>Status</Button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <DataTable
            columns={["Employee", "Last Working Day", "Reason", "Checklist", "Status", "Actions"]}
            loading={offboardings.isLoading}
            empty={!offboardingRows.length}
            toolbar={<StatusFilter value={offboardingFilter} statuses={offboardingStatuses} onChange={setOffboardingFilter} />}
          >
            {offboardingRows.map((record) => {
              const completed = record.checklist?.filter((item: any) => item.completed).length || 0;
              const total = record.checklist?.length || 0;
              return (
                <tr key={record._id}>
                  <td><EmployeeCell employee={record.employeeId} /></td>
                  <td>{formatDate(record.lastWorkingDay)}</td>
                  <td>{record.reason || "-"}</td>
                  <td>{completed}/{total}</td>
                  <td><Badge tone={statusTone(record.status)} dot>{record.status}</Badge></td>
                  <td>
                    <div className="toolbar">
                      <Button size="sm" variant="secondary" icon={<Eye size={15} />} onClick={() => navigate(`/hrm/lifecycle/offboarding/${record._id}`)}>View</Button>
                      <Button size="sm" variant="ghost" icon={<ClipboardCheck size={15} />} onClick={() => openStatus(record, "offboarding")}>Status</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Card>

      <Modal title={`Start ${startType === "onboarding" ? "Onboarding" : "Offboarding"}`} open={Boolean(startType)} onClose={() => setStartType(null)}>
        <form className="form-grid" onSubmit={submitStart}>
          <Field label="Employee" required>
            <Select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} required>
              <option value="">Select employee</option>
              {employees.data?.map((employee) => <option key={employee._id} value={employee._id}>{employeeName(employee)} - {employeeEmail(employee)}</option>)}
            </Select>
          </Field>
          {startType === "offboarding" && (
            <>
              <Field label="Last working day" required><Input type="date" value={lastWorkingDay} onChange={(event) => setLastWorkingDay(event.target.value)} required /></Field>
              <Field label="Reason"><Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} /></Field>
            </>
          )}
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setStartType(null)}>Cancel</Button>
            <Button type="submit" loading={initiateOnboarding.isPending || initiateOffboarding.isPending}>Start Workflow</Button>
          </div>
        </form>
      </Modal>

      <Modal title={`Manage ${selected?.lifecycleType === "onboarding" ? "Onboarding" : "Offboarding"}`} open={Boolean(selected)} onClose={() => setSelected(null)}>
        <form className="form-grid" onSubmit={submitStatus}>
          <Field label="Status" required>
            <Select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} required>
              {(selected?.lifecycleType === "onboarding" ? onboardingStatuses : offboardingStatuses).map((status) => <option key={status}>{status}</option>)}
            </Select>
          </Field>
          {selected?.lifecycleType === "onboarding" && nextStatus === "Rejected" && (
            <Field label="Rejection reason" required><Textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} required /></Field>
          )}
          {selected?.lifecycleType === "onboarding" && nextStatus === "Completed" && (
            <div className="form-grid two">
              <Field label="Shift ID" required><Input value={shiftId} onChange={(event) => setShiftId(event.target.value)} required /></Field>
              <Field label="Attendance start date" required><Input type="date" value={attendanceStartDate} onChange={(event) => setAttendanceStartDate(event.target.value)} required /></Field>
            </div>
          )}
          {selected?.lifecycleType === "offboarding" && (
            <Field label="Feedback"><Textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={4} /></Field>
          )}
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
            <Button type="submit" loading={updateOnboarding.isPending || updateOffboarding.isPending}>Update Status</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function EmployeeCell({ employee }: { employee: any }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Avatar name={employeeName(employee)} size="sm" />
      <div style={{ display: "grid", gap: 2 }}>
        <strong>{employeeName(employee)}</strong>
        <span className="muted">{employeeEmail(employee)}</span>
      </div>
    </div>
  );
}

function StatusFilter({ value, statuses, onChange }: { value: string; statuses: string[]; onChange: (value: string) => void }) {
  return (
    <div className="toolbar">
      <span className="muted">Status</span>
      <Select value={value} onChange={(event) => onChange(event.target.value)} style={{ minWidth: 170 }}>
        <option value="">All statuses</option>
        {statuses.map((status) => <option key={status}>{status}</option>)}
      </Select>
    </div>
  );
}
