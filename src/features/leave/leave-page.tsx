// @ts-nocheck
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Check, ClipboardList, Plus, X } from "lucide-react";
import { leaveApi } from "../../api/hrm-api";
import { getErrorMessage } from "../../api/http";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, KpiCard } from "../../components/ui/card";
import { Field, Input, Select, Textarea } from "../../components/ui/field";
import { Modal } from "../../components/ui/modal";
import { DataTable } from "../../components/ui/table";
import { Tabs } from "../../components/ui/tabs";
import { Avatar } from "../../components/ui/avatar";
import { useToast } from "../../components/ui/toast";
import { useAuth } from "../auth/auth-context";
import { canApproveFeature, canWriteFeature } from "../auth/role-access";
import { formatDate, personName } from "../../lib/format";

type LeaveTab = "mine" | "pending" | "types";
type LeaveForm = {
  leaveType: string;
  startDate: string;
  endDate: string;
  isHalfDay?: boolean;
  halfDaySession?: "FIRST_HALF" | "SECOND_HALF";
  hours?: number;
  reason?: string;
};
type LeaveTypeForm = {
  name: string;
  code: string;
  isPaid: "true" | "false";
  annualAllocation?: number;
  allowHalfDay?: "true" | "false";
  accrualType?: "MONTHLY" | "YEARLY";
  monthlyAccrual?: number;
  maxCarryForward?: number;
  allowEncashment?: "true" | "false";
  maxEncashable?: number;
};

const leaveTypeDefaults: LeaveTypeForm = {
  name: "",
  code: "",
  isPaid: "true",
  allowHalfDay: "false",
  accrualType: "YEARLY",
  allowEncashment: "false",
  annualAllocation: 0,
  monthlyAccrual: 0,
  maxCarryForward: 0,
  maxEncashable: 0
};

export function LeavePage() {
  const [tab, setTab] = useState<LeaveTab>("mine");
  const [open, setOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const form = useForm<LeaveForm>();
  const typeForm = useForm<LeaveTypeForm>({ defaultValues: leaveTypeDefaults });
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const { employee } = useAuth();
  const canManageLeave = canWriteFeature(employee?.role, "leave");
  const canApproveLeave = canApproveFeature(employee?.role, "leave");
  const mine = useQuery({ queryKey: ["leave", "mine"], queryFn: leaveApi.mine });
  const pending = useQuery({ queryKey: ["leave", "pending"], queryFn: leaveApi.pending });
  const types = useQuery({ queryKey: ["leave", "types"], queryFn: leaveApi.types });

  const create = useMutation({
    mutationFn: leaveApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leave"] });
      setOpen(false);
      notify("Leave request submitted", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const approve = useMutation({
    mutationFn: leaveApi.approve,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leave"] });
      notify("Leave approved", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => leaveApi.reject(id, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leave"] });
      notify("Leave rejected", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const createType = useMutation({
    mutationFn: leaveApi.createType,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leave", "types"] });
      setTypeOpen(false);
      typeForm.reset(leaveTypeDefaults);
      notify("Leave type created", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const paidLeave = typeForm.watch("isPaid") !== "false";

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Leave Management</h1>
          <p>Submit leave requests, review approvals, and maintain leave types.</p>
        </div>
        <div className="toolbar">
          {canManageLeave && <Button variant="secondary" icon={<Plus size={16} />} onClick={() => { typeForm.reset(leaveTypeDefaults); setTypeOpen(true); }}>Leave Type</Button>}
          <Button icon={<Plus size={16} />} onClick={() => { form.reset(); setOpen(true); }}>Request Leave</Button>
        </div>
      </div>

      <section className="kpi-grid">
        <KpiCard icon={<CalendarDays size={20} />} iconColor="purple" label="My Requests" value={mine.data?.length ?? 0} />
        <KpiCard icon={<ClipboardList size={20} />} iconColor="amber" label="Pending Approvals" value={pending.data?.length ?? 0} />
        <KpiCard icon={<ClipboardList size={20} />} iconColor="green" label="Leave Types" value={types.data?.length ?? 0} />
      </section>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "mine", label: "My Requests" },
          ...(canApproveLeave ? [{ value: "pending", label: `Pending Approvals (${pending.data?.length ?? 0})` }] : []),
          ...(canManageLeave ? [{ value: "types", label: "Leave Types" }] : [])
        ]}
      />

      <Card>
        {tab === "mine" && (
          <DataTable columns={["Leave Type", "Duration", "Half Day", "Hours", "Reason", "Status"]} empty={!mine.data?.length} loading={mine.isLoading}>
            {mine.data?.map((request) => (
              <tr key={request._id}>
                <td><strong>{leaveTypeLabel(request.leaveType)}</strong></td>
                <td style={{ color: "var(--text-muted)" }}>{formatDate(request.startDate)} – {formatDate(request.endDate)}</td>
                <td>{request.isHalfDay ? <Badge tone="blue">{request.halfDaySession}</Badge> : <span className="muted">No</span>}</td>
                <td>{request.hours || "-"}</td>
                <td style={{ color: "var(--text-muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{request.reason || "-"}</td>
                <td><LeaveStatus status={request.status} /></td>
              </tr>
            ))}
          </DataTable>
        )}

        {tab === "pending" && (
          <DataTable columns={["Employee", "Type", "Duration", "Reason", "Status", "Actions"]} empty={!pending.data?.length} loading={pending.isLoading}>
            {pending.data?.map((request) => (
              <tr key={request._id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={personName(request.employeeId)} size="sm" />
                    <span>{personName(request.employeeId)}</span>
                  </div>
                </td>
                <td><strong>{leaveTypeLabel(request.leaveType)}</strong></td>
                <td style={{ color: "var(--text-muted)" }}>{formatDate(request.startDate)} – {formatDate(request.endDate)}</td>
                <td style={{ color: "var(--text-muted)" }}>{request.reason || "-"}</td>
                <td><LeaveStatus status={request.status} /></td>
                <td>
                  <div className="toolbar">
                    <Button variant="ghost" size="sm" iconOnly icon={<Check size={15} />} onClick={() => approve.mutate(request._id)} aria-label="Approve" />
                    <Button variant="ghost" size="sm" iconOnly icon={<X size={15} />} onClick={() => {
                      const reason = window.prompt("Rejection reason");
                      if (reason?.trim()) reject.mutate({ id: request._id, reason: reason.trim() });
                    }} aria-label="Reject" />
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}

        {tab === "types" && (
          <DataTable columns={["Name", "Code", "Paid", "Allocation", "Half Day", "Status"]} empty={!types.data?.length} loading={types.isLoading}>
            {types.data?.map((type) => (
              <tr key={type._id}>
                <td><strong>{type.name || "-"}</strong></td>
                <td><Badge tone="neutral">{type.code || "-"}</Badge></td>
                <td><Badge tone={type.isPaid ? "green" : "yellow"}>{type.isPaid ? "Paid" : "Unpaid"}</Badge></td>
                <td>{type.annualAllocation ?? "-"}</td>
                <td>{type.allowHalfDay ? "Allowed" : "No"}</td>
                <td><Badge tone={type.isActive === false ? "red" : "green"} dot>{type.isActive === false ? "Inactive" : "Active"}</Badge></td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>

      <Modal title="Request Leave" open={open} onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={form.handleSubmit((values) => create.mutate({ ...values, isHalfDay: Boolean(values.halfDaySession) }))}>
          <Field label="Leave Type" required>
            <Select {...form.register("leaveType", { required: true })}>
              <option value="">Select leave type</option>
              {types.data?.map((type) => (
                <option key={type._id} value={type._id}>
                  {type.name} ({type.code}){type.allowHalfDay ? " - half day allowed" : ""}
                </option>
              ))}
            </Select>
          </Field>
          <div className="form-grid two">
            <Field label="Start Date" required>
              <Input type="date" {...form.register("startDate", { required: true })} />
            </Field>
            <Field label="End Date" required>
              <Input type="date" {...form.register("endDate", { required: true })} />
            </Field>
            <Field label="Half Day Session">
              <Select {...form.register("halfDaySession")}>
                <option value="">Full day</option>
                <option value="FIRST_HALF">First half</option>
                <option value="SECOND_HALF">Second half</option>
              </Select>
            </Field>
            <Field label="Hours">
              <Input type="number" {...form.register("hours", { valueAsNumber: true })} />
            </Field>
          </div>
          <Field label="Reason">
            <Textarea {...form.register("reason")} />
          </Field>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={create.isPending}>Submit Request</Button>
          </div>
        </form>
      </Modal>

      <Modal title="Create Leave Type" open={typeOpen} onClose={() => setTypeOpen(false)}>
        <form className="form-grid" onSubmit={typeForm.handleSubmit((values) => createType.mutate({
          name: values.name,
          code: values.code,
          isPaid: values.isPaid !== "false",
          annualAllocation: values.isPaid !== "false" ? Number(values.annualAllocation || 0) : null,
          allowHalfDay: values.allowHalfDay === "true",
          accrualType: values.accrualType || "YEARLY",
          monthlyAccrual: Number(values.monthlyAccrual || 0),
          maxCarryForward: Number(values.maxCarryForward || 0),
          allowEncashment: values.allowEncashment === "true",
          maxEncashable: Number(values.maxEncashable || 0)
        }))}>
          <Field label="Name" required>
            <Input {...typeForm.register("name", { required: true })} />
          </Field>
          <div className="form-grid two">
          <Field label="Code" required>
            <Input {...typeForm.register("code", { required: true })} placeholder="AL, SL, LWP" />
          </Field>
          <Field label="Paid leave" required>
            <Select {...typeForm.register("isPaid", { required: true })}>
              <option value="true">Paid</option>
              <option value="false">Unpaid</option>
            </Select>
          </Field>
          </div>
          <div className="form-grid two">
            <Field label="Annual allocation" required={paidLeave}>
              <Input type="number" min="0" {...typeForm.register("annualAllocation", { valueAsNumber: true, required: paidLeave })} disabled={!paidLeave} />
            </Field>
            <Field label="Allow half day">
              <Select {...typeForm.register("allowHalfDay")}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </Select>
            </Field>
          </div>
          <div className="form-grid two">
            <Field label="Accrual type">
              <Select {...typeForm.register("accrualType")}>
                <option value="YEARLY">Yearly</option>
                <option value="MONTHLY">Monthly</option>
              </Select>
            </Field>
            <Field label="Monthly accrual">
              <Input type="number" min="0" step="0.5" {...typeForm.register("monthlyAccrual", { valueAsNumber: true })} />
            </Field>
          </div>
          <div className="form-grid two">
            <Field label="Max carry forward">
              <Input type="number" min="0" {...typeForm.register("maxCarryForward", { valueAsNumber: true })} />
            </Field>
            <Field label="Allow encashment">
              <Select {...typeForm.register("allowEncashment")}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </Select>
            </Field>
          </div>
          <Field label="Max encashable">
            <Input type="number" min="0" {...typeForm.register("maxEncashable", { valueAsNumber: true })} />
          </Field>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setTypeOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createType.isPending}>Create Type</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function LeaveStatus({ status }: { status: "Pending" | "Approved" | "Rejected" }) {
  const tone = status === "Approved" ? "green" : status === "Rejected" ? "red" : "yellow";
  return <Badge tone={tone} dot>{status}</Badge>;
}

function leaveTypeLabel(leaveType: any) {
  if (!leaveType) return "-";
  if (typeof leaveType === "string") return leaveType;
  return [leaveType.name, leaveType.code ? `(${leaveType.code})` : ""].filter(Boolean).join(" ");
}
