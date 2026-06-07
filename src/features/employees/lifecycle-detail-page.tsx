// @ts-nocheck
import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, ExternalLink, FileCheck2, FileSearch, ShieldCheck, X } from "lucide-react";
import { hrOnboardingReviewApi, lifecycleApi } from "../../api/hrm-api";
import { getErrorMessage } from "../../api/http";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardBody, CardHeader, KpiCard } from "../../components/ui/card";
import { Field, Select, Textarea } from "../../components/ui/field";
import { Modal } from "../../components/ui/modal";
import { DataTable } from "../../components/ui/table";
import { useToast } from "../../components/ui/toast";
import { formatDate } from "../../lib/format";

function statusTone(status?: string) {
  if (status === "Completed" || status === "Approved") return "green";
  if (status === "Rejected" || status === "Cancelled") return "red";
  if (status === "Submitted" || status === "UnderReview" || status === "InProgress") return "blue";
  if (status === "Pending" || status === "PendingEmployeeAction") return "yellow";
  return "purple";
}

function personName(employee: any) {
  return [employee?.firstName, employee?.lastName].filter(Boolean).join(" ") || employee?.employeeCode || employee?.email || "Employee";
}

export function OnboardingReviewDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [rejectDoc, setRejectDoc] = useState<any>(null);
  const [rejectAllOpen, setRejectAllOpen] = useState(false);
  const [reason, setReason] = useState("");

  const review = useQuery({
    queryKey: ["hr-onboarding-review", id],
    queryFn: () => hrOnboardingReviewApi.get(id),
    enabled: Boolean(id)
  });

  const onboarding = review.data?.onboarding;
  const submission = review.data?.submission;
  const employee = onboarding?.employeeId;
  const documents = submission?.documents || [];

  const completion = useMemo(() => {
    const approvedDocs = documents.filter((doc) => doc.verificationStatus === "Approved").length;
    return {
      documents: documents.length,
      approvedDocs,
      requiredDocs: 3
    };
  }, [documents]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["hr-onboarding-review", id] });
    await queryClient.invalidateQueries({ queryKey: ["lifecycle"] });
  };

  const approveDoc = useMutation({
    mutationFn: (documentId: string) => hrOnboardingReviewApi.approveDocument(id, documentId),
    onSuccess: async () => { await invalidate(); notify("Document approved", "success"); },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const rejectDocMutation = useMutation({
    mutationFn: ({ documentId, reason }: { documentId: string; reason: string }) => hrOnboardingReviewApi.rejectDocument(id, documentId, reason),
    onSuccess: async () => {
      await invalidate();
      setRejectDoc(null);
      setReason("");
      notify("Document rejected", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const approveOnboarding = useMutation({
    mutationFn: () => hrOnboardingReviewApi.approveOnboarding(id),
    onSuccess: async () => { await invalidate(); notify("Onboarding approved", "success"); },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const rejectOnboarding = useMutation({
    mutationFn: (reason: string) => hrOnboardingReviewApi.rejectOnboarding(id, reason),
    onSuccess: async () => {
      await invalidate();
      setRejectAllOpen(false);
      setReason("");
      notify("Onboarding rejected", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  function submitDocumentRejection(event: FormEvent) {
    event.preventDefault();
    if (!rejectDoc) return;
    rejectDocMutation.mutate({ documentId: rejectDoc._id, reason });
  }

  function submitOnboardingRejection(event: FormEvent) {
    event.preventDefault();
    rejectOnboarding.mutate(reason);
  }

  if (review.isLoading) {
    return <Card><CardBody>Loading onboarding review...</CardBody></Card>;
  }

  if (!onboarding) {
    return (
      <Card>
        <CardBody>
          <div className="empty-state">
            <h3>Onboarding not found</h3>
            <p>The selected onboarding workflow could not be loaded.</p>
            <Button variant="secondary" onClick={() => navigate("/hrm/lifecycle")}>Back to lifecycle</Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <div className="page-title">
        <div>
          <Link className="btn btn-secondary btn-sm" to="/hrm/lifecycle"><ArrowLeft size={15} /> Back</Link>
          <h1>Onboarding Review</h1>
          <p>Review employee onboarding data, verify documents, and complete HR approval.</p>
        </div>
        <div className="toolbar">
          <Badge tone={statusTone(onboarding.status)} dot>{onboarding.status}</Badge>
          <Button variant="secondary" icon={<X size={16} />} onClick={() => setRejectAllOpen(true)} disabled={onboarding.status === "Completed"}>Reject</Button>
          <Button icon={<ShieldCheck size={16} />} loading={approveOnboarding.isPending} onClick={() => approveOnboarding.mutate()} disabled={onboarding.status === "Completed"}>Approve Onboarding</Button>
        </div>
      </div>

      <section className="kpi-grid">
        <KpiCard icon={<FileSearch size={20} />} iconColor="blue" label="Progress" value={`${onboarding.completionPercentage || 0}%`} meta={onboarding.currentStep || "Current step"} />
        <KpiCard icon={<FileCheck2 size={20} />} iconColor="green" label="Documents" value={`${completion.approvedDocs}/${completion.requiredDocs}`} meta={`${completion.documents} uploaded`} />
        <KpiCard icon={<ShieldCheck size={20} />} iconColor="purple" label="Submission" value={submission?.status || "No draft"} meta={submission?.submittedAt ? formatDate(submission.submittedAt) : "Not submitted"} />
        <KpiCard icon={<FileSearch size={20} />} iconColor="amber" label="Employee" value={personName(employee)} meta={employee?.workEmail || employee?.email || employee?.employeeCode} />
      </section>

      <div className="lifecycle-detail-grid">
        <Card>
          <CardHeader><h2>Employee Profile</h2></CardHeader>
          <CardBody><DetailGrid data={{
            "Employee": personName(employee),
            "Employee Code": employee?.employeeCode,
            "Email": employee?.workEmail || employee?.email,
            "Started": formatDate(onboarding.createdAt),
            "Completed": formatDate(onboarding.completedAt),
            "Rejection Reason": onboarding.rejectionReason
          }} /></CardBody>
        </Card>

        <Card>
          <CardHeader><h2>Personal Information</h2></CardHeader>
          <CardBody><DetailGrid data={submission?.personalInfo || {}} /></CardBody>
        </Card>

        <Card>
          <CardHeader><h2>Emergency Contact</h2></CardHeader>
          <CardBody><DetailGrid data={submission?.emergencyContact || {}} /></CardBody>
        </Card>

        <Card>
          <CardHeader><h2>Bank Details</h2></CardHeader>
          <CardBody><DetailGrid data={submission?.bankDetails || {}} /></CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader><h2>Submitted Documents</h2></CardHeader>
        <DataTable columns={["Type", "Number", "Status", "Reason", "File", "Actions"]} empty={!documents.length} loading={review.isLoading}>
          {documents.map((document) => (
            <tr key={document._id}>
              <td><strong>{document.type}</strong></td>
              <td>{document.number || "-"}</td>
              <td><Badge tone={statusTone(document.verificationStatus)} dot>{document.verificationStatus}</Badge></td>
              <td>{document.rejectionReason || "-"}</td>
              <td>{document.fileUrl ? <a className="btn btn-secondary btn-sm" href={document.fileUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Open</a> : "-"}</td>
              <td>
                <div className="toolbar">
                  <Button size="sm" variant="secondary" icon={<Check size={15} />} loading={approveDoc.isPending} onClick={() => approveDoc.mutate(document._id)}>Approve</Button>
                  <Button size="sm" variant="danger" icon={<X size={15} />} onClick={() => { setRejectDoc(document); setReason(""); }}>Reject</Button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Card>

      <Modal title={`Reject ${rejectDoc?.type || "document"}`} open={Boolean(rejectDoc)} onClose={() => setRejectDoc(null)}>
        <form className="form-grid" onSubmit={submitDocumentRejection}>
          <Field label="Rejection reason" required><Textarea value={reason} onChange={(event) => setReason(event.target.value)} required rows={4} /></Field>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setRejectDoc(null)}>Cancel</Button>
            <Button type="submit" variant="danger" loading={rejectDocMutation.isPending}>Reject Document</Button>
          </div>
        </form>
      </Modal>

      <Modal title="Reject Onboarding" open={rejectAllOpen} onClose={() => setRejectAllOpen(false)}>
        <form className="form-grid" onSubmit={submitOnboardingRejection}>
          <Field label="Reason" required><Textarea value={reason} onChange={(event) => setReason(event.target.value)} required rows={4} /></Field>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setRejectAllOpen(false)}>Cancel</Button>
            <Button type="submit" variant="danger" loading={rejectOnboarding.isPending}>Reject Onboarding</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function OffboardingDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [status, setStatus] = useState("");
  const [feedback, setFeedback] = useState("");

  const offboarding = useQuery({
    queryKey: ["offboarding-detail", id],
    queryFn: () => lifecycleApi.getOffboarding(id),
    enabled: Boolean(id)
  });

  const record = offboarding.data;

  const update = useMutation({
    mutationFn: (payload: any) => lifecycleApi.updateOffboarding(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["offboarding-detail", id] });
      await queryClient.invalidateQueries({ queryKey: ["lifecycle"] });
      notify("Offboarding updated", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  if (offboarding.isLoading) return <Card><CardBody>Loading offboarding...</CardBody></Card>;
  if (!record) {
    return (
      <Card><CardBody><div className="empty-state"><h3>Offboarding not found</h3><Button variant="secondary" onClick={() => navigate("/hrm/lifecycle")}>Back to lifecycle</Button></div></CardBody></Card>
    );
  }

  const checklist = record.checklist || [];
  const completed = checklist.filter((item) => item.completed).length;

  function toggleTask(index: number) {
    const nextChecklist = checklist.map((item, taskIndex) => taskIndex === index ? { ...item, completed: !item.completed, completedAt: !item.completed ? new Date().toISOString() : undefined } : item);
    update.mutate({ checklist: nextChecklist });
  }

  function submitStatus(event: FormEvent) {
    event.preventDefault();
    update.mutate({ status: status || record.status, feedback });
  }

  return (
    <>
      <div className="page-title">
        <div>
          <Link className="btn btn-secondary btn-sm" to="/hrm/lifecycle"><ArrowLeft size={15} /> Back</Link>
          <h1>Offboarding Review</h1>
          <p>Track exit status, checklist completion, final feedback, and handover progress.</p>
        </div>
        <Badge tone={statusTone(record.status)} dot>{record.status}</Badge>
      </div>

      <section className="kpi-grid">
        <KpiCard icon={<FileCheck2 size={20} />} iconColor="blue" label="Checklist" value={`${completed}/${checklist.length || 0}`} />
        <KpiCard icon={<FileSearch size={20} />} iconColor="amber" label="Last Working Day" value={formatDate(record.lastWorkingDay)} />
        <KpiCard icon={<ShieldCheck size={20} />} iconColor="purple" label="Status" value={record.status} />
        <KpiCard icon={<FileSearch size={20} />} iconColor="green" label="Employee" value={personName(record.employeeId)} />
      </section>

      <div className="lifecycle-detail-grid">
        <Card>
          <CardHeader><h2>Offboarding Details</h2></CardHeader>
          <CardBody><DetailGrid data={{
            Employee: personName(record.employeeId),
            Email: record.employeeId?.email || record.employeeId?.workEmail,
            Reason: record.reason,
            "Last Working Day": formatDate(record.lastWorkingDay),
            Feedback: record.feedback
          }} /></CardBody>
        </Card>

        <Card>
          <CardHeader><h2>Update Status</h2></CardHeader>
          <CardBody>
            <form className="form-grid" onSubmit={submitStatus}>
              <Field label="Status">
                <Select value={status || record.status} onChange={(event) => setStatus(event.target.value)}>
                  <option>Initiated</option>
                  <option>InProgress</option>
                  <option>Completed</option>
                </Select>
              </Field>
              <Field label="Feedback"><Textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={4} /></Field>
              <div className="form-actions"><Button loading={update.isPending} type="submit">Update Offboarding</Button></div>
            </form>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader><h2>Exit Checklist</h2></CardHeader>
        <DataTable columns={["Task", "Status", "Completed At", "Action"]} empty={!checklist.length}>
          {checklist.map((item, index) => (
            <tr key={`${item.task}-${index}`}>
              <td><strong>{item.task}</strong></td>
              <td><Badge tone={item.completed ? "green" : "yellow"} dot>{item.completed ? "Completed" : "Pending"}</Badge></td>
              <td>{formatDate(item.completedAt)}</td>
              <td><Button size="sm" variant="secondary" onClick={() => toggleTask(index)}>{item.completed ? "Mark Pending" : "Complete"}</Button></td>
            </tr>
          ))}
        </DataTable>
      </Card>
    </>
  );
}

function DetailGrid({ data }: { data: Record<string, any> }) {
  const entries = Object.entries(data || {}).filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (!entries.length) return <p className="muted">No details submitted yet.</p>;
  return (
    <dl className="detail-grid">
      {entries.map(([key, value]) => (
        <div key={key}>
          <dt>{key.replace(/([A-Z])/g, " $1").trim()}</dt>
          <dd>{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
