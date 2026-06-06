import { useState } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Award, LogOut as LogOutIcon, Mail, MapPin, Phone } from "lucide-react";
import { employeeApi, departmentApi, positionApi } from "../../api/hrm-api";
import { getErrorMessage } from "../../api/http";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardBody, CardHeader } from "../../components/ui/card";
import { Avatar } from "../../components/ui/avatar";
import { Modal } from "../../components/ui/modal";
import { Tabs } from "../../components/ui/tabs";
import { Field, Input, Select } from "../../components/ui/field";
import { useToast } from "../../components/ui/toast";
import { departmentName, formatDate, personName, positionName } from "../../lib/format";
import { OffboardingForm, OffboardingFormValues } from "./offboarding-form";

type Tab = "profile" | "job" | "attendance" | "leave" | "documents" | "hierarchy";

export function EmployeeDetailPage() {
  const { id = "" } = useParams();
  const [tab, setTab] = useState<Tab>("profile");
  const [offboardOpen, setOffboardOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const employee = useQuery({ queryKey: ["employees", id], queryFn: () => employeeApi.get(id), enabled: Boolean(id) });
  const data = employee.data;

  const departments = useQuery({ queryKey: ["departments"], queryFn: departmentApi.list });
  const positions = useQuery({ queryKey: ["positions"], queryFn: positionApi.list });
  const employees = useQuery({ queryKey: ["employees"], queryFn: employeeApi.list });
  
  const hierarchy = useQuery({ 
    queryKey: ["employees", "hierarchy", id], 
    queryFn: () => employeeApi.hierarchy(id), 
    enabled: Boolean(id) && tab === "hierarchy" 
  });

  const terminateMutation = useMutation({
    mutationFn: (values: OffboardingFormValues) => employeeApi.terminate(id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employees", id] });
      setOffboardOpen(false);
      notify("Employee terminated successfully", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const promoteMutation = useMutation({
    mutationFn: (values: any) => employeeApi.promote(id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employees", id] });
      setPromoteOpen(false);
      notify("Employee promoted successfully", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const transferMutation = useMutation({
    mutationFn: (values: any) => employeeApi.transfer(id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employees", id] });
      setTransferOpen(false);
      notify("Employee transferred successfully", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const promoteForm = useForm();
  const transferForm = useForm();

  const empName = data ? personName(data) : "Employee";

  return (
    <>
      {/* Profile Header */}
      <Card>
        <CardBody>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            <Avatar name={empName} size="xl" />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                <h1 style={{ margin: 0, fontSize: "1.5rem" }}>{empName}</h1>
                {data?.status && (
                  <Badge tone={data.status === "Active" ? "green" : data.status === "Exited" ? "red" : "yellow"} dot>
                    {data.status}
                  </Badge>
                )}
              </div>
              <p style={{ color: "var(--text-muted)", margin: "0 0 12px", fontSize: 14 }}>
                {positionName(data?.positionId)} · {departmentName(data?.departmentId)} · {data?.employeeCode}
              </p>
              <div style={{ display: "flex", gap: 20, fontSize: 13, color: "var(--text-muted)" }}>
                {data?.workEmail && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Mail size={14} /> {data.workEmail}</span>}
                {data?.phone && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={14} /> {data.phone}</span>}
                {data?.workLocation && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={14} /> {data.workLocation}</span>}
              </div>
            </div>
            {data?.status === "Active" && (
              <div className="toolbar">
                <Button variant="secondary" size="sm" icon={<ArrowRightLeft size={14} />} onClick={() => setTransferOpen(true)}>Transfer</Button>
                <Button variant="secondary" size="sm" icon={<Award size={14} />} onClick={() => setPromoteOpen(true)}>Promote</Button>
                <Button variant="danger" size="sm" icon={<LogOutIcon size={14} />} onClick={() => setOffboardOpen(true)}>Offboard</Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "profile", label: "Personal Info" },
          { value: "job", label: "Employment" },
          { value: "hierarchy", label: "Reporting" },
          { value: "attendance", label: "Attendance" },
          { value: "leave", label: "Leave" },
          { value: "documents", label: "Documents" },
        ]}
      />

      <Card>
        <CardBody>
          {tab === "profile" && (
            <div className="detail-grid">
              <Detail label="Work Email" value={data?.workEmail || (data as any)?.personal?.email} />
              <Detail label="Phone" value={data?.phone || (data as any)?.personal?.phone} />
              <Detail label="Gender" value={data?.gender || (data as any)?.personal?.gender} />
              <Detail label="Date of Birth" value={formatDate(data?.dob || (data as any)?.personal?.dob)} />
              <Detail label="KYC Status" value={data?.kycStatus} />
              <Detail label="Role" value={data?.role} />
            </div>
          )}
          {tab === "job" && (
            <div className="detail-grid">
              <Detail label="Department" value={departmentName(data?.departmentId) || (data as any)?.job?.department?.name} />
              <Detail label="Position" value={positionName(data?.positionId) || (data as any)?.job?.position?.title} />
              <Detail label="Reporting Manager" value={personName(data?.reportingManagerId)} />
              <Detail label="Join Date" value={formatDate(data?.joinDate || (data as any)?.job?.joinDate)} />
              <Detail label="Employment Type" value={data?.employmentType || (data as any)?.job?.employmentType} />
              <Detail label="Work Location" value={data?.workLocation} />
              <Detail label="CTC" value={data?.salary?.ctc ? `${data.salary.currency || "INR"} ${data.salary.ctc}` : "-"} />
            </div>
          )}
          {tab === "hierarchy" && (
            <div>
              <h3 style={{ marginBottom: 16 }}>Reporting Manager</h3>
              {hierarchy.data?.employee?.reportingManagerId ? (
                <Card className="card-padded" style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar name={personName(hierarchy.data.employee.reportingManagerId)} />
                    <div>
                      <strong>{personName(hierarchy.data.employee.reportingManagerId)}</strong>
                      <p className="muted" style={{ margin: 0, fontSize: 13 }}>{hierarchy.data.employee.reportingManagerId.positionId?.title}</p>
                    </div>
                  </div>
                </Card>
              ) : <p className="muted" style={{ marginBottom: 24 }}>No manager assigned</p>}

              <h3 style={{ marginBottom: 16 }}>Direct Reports ({hierarchy.data?.directReports?.length || 0})</h3>
              {hierarchy.data?.directReports?.length ? (
                <div className="grid-2">
                  {hierarchy.data.directReports.map((report: any) => (
                    <Card key={report._id} className="card-padded">
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <Avatar name={personName(report)} size="sm" />
                        <div>
                          <strong style={{ fontSize: 14 }}>{personName(report)}</strong>
                          <p className="muted" style={{ margin: 0, fontSize: 12 }}>{report.positionId?.title} · {report.departmentId?.name}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : <p className="muted">No direct reports.</p>}
            </div>
          )}
          {tab !== "profile" && tab !== "job" && tab !== "hierarchy" && (
            <div className="empty-state">
              <div className="empty-state-icon"><Mail size={24} /></div>
              <h3>{tab.charAt(0).toUpperCase() + tab.slice(1)}</h3>
              <p>This section will display {tab} records once the related endpoints are configured.</p>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal title="Promote Employee" open={promoteOpen} onClose={() => setPromoteOpen(false)}>
        <form className="form-grid" onSubmit={promoteForm.handleSubmit((v) => promoteMutation.mutate(v))}>
          <Field label="New Position" required error={promoteForm.formState.errors.newPositionId?.message as string}>
            <Select {...promoteForm.register("newPositionId", { required: "Position is required" })}>
              <option value="">Select position...</option>
              {positions.data?.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
            </Select>
          </Field>
          <Field label="New Salary (CTC)" required error={promoteForm.formState.errors.newSalary?.message as string}>
            <Input type="number" {...promoteForm.register("newSalary", { required: "Salary is required", valueAsNumber: true })} />
          </Field>
          <Field label="Reason / Notes">
            <Input {...promoteForm.register("reason")} />
          </Field>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setPromoteOpen(false)}>Cancel</Button>
            <Button type="submit" loading={promoteMutation.isPending}>Promote</Button>
          </div>
        </form>
      </Modal>

      <Modal title="Transfer Employee" open={transferOpen} onClose={() => setTransferOpen(false)}>
        <form className="form-grid" onSubmit={transferForm.handleSubmit((v) => transferMutation.mutate(v))}>
          <Field label="New Department" required error={transferForm.formState.errors.newDepartmentId?.message as string}>
            <Select {...transferForm.register("newDepartmentId", { required: "Department is required" })}>
              <option value="">Select department...</option>
              {departments.data?.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </Select>
          </Field>
          <Field label="New Manager (Optional)">
            <Select {...transferForm.register("newManagerId")}>
              <option value="">Select manager...</option>
              {employees.data?.map((e) => <option key={e.id} value={e.id}>{e.name || e.firstName}</option>)}
            </Select>
          </Field>
          <Field label="Reason / Notes">
            <Input {...transferForm.register("reason")} />
          </Field>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setTransferOpen(false)}>Cancel</Button>
            <Button type="submit" loading={transferMutation.isPending}>Transfer</Button>
          </div>
        </form>
      </Modal>

      <Modal title="Offboard Employee" open={offboardOpen} onClose={() => setOffboardOpen(false)}>
        {data && (
          <OffboardingForm
            employee={data}
            onSubmit={(values) => terminateMutation.mutate(values)}
            onCancel={() => setOffboardOpen(false)}
          />
        )}
      </Modal>
    </>
  );
}

function Detail({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
}
