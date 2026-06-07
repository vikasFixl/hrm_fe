import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Ban, CircleAlert, ClipboardList, Clock3, FileCheck2, FileSearch, UploadCloud } from "lucide-react";
import { employeeOnboardingApi } from "../../api/hrm-api";
import { getErrorMessage } from "../../api/http";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Field, Input, Select } from "../../components/ui/field";
import { useToast } from "../../components/ui/toast";
import { useAuth } from "./auth-context";

type StatusKey = "start" | "initiated" | "pending" | "submitted" | "under-review" | "rejected" | "cancelled" | "in-progress";

const editableRoutes = new Set<StatusKey>(["initiated", "pending", "rejected"]);

const statusContent: Record<StatusKey, { icon: typeof ClipboardList; title: string; description: string; tone: "neutral" | "green" | "red" | "yellow" | "blue" | "purple" }> = {
  start: {
    icon: ClipboardList,
    title: "Onboarding not started",
    description: "Your employee profile exists, but HR has not started your onboarding workflow yet.",
    tone: "yellow"
  },
  initiated: {
    icon: Clock3,
    title: "Complete your onboarding",
    description: "HR has started your onboarding. Complete each section and submit it for review.",
    tone: "purple"
  },
  pending: {
    icon: ClipboardList,
    title: "Onboarding action required",
    description: "Complete the pending sections and submit your onboarding package.",
    tone: "yellow"
  },
  "in-progress": {
    icon: FileSearch,
    title: "Onboarding in progress",
    description: "HR is reviewing your onboarding details. Access will be enabled after completion.",
    tone: "blue"
  },
  submitted: {
    icon: FileCheck2,
    title: "Onboarding submitted",
    description: "Your onboarding documents were submitted successfully and are waiting for HR review.",
    tone: "blue"
  },
  "under-review": {
    icon: FileSearch,
    title: "Onboarding under review",
    description: "HR is reviewing your submitted onboarding information. Access will be enabled after approval.",
    tone: "blue"
  },
  rejected: {
    icon: CircleAlert,
    title: "Onboarding needs changes",
    description: "HR rejected your onboarding. Correct the requested sections and resubmit.",
    tone: "red"
  },
  cancelled: {
    icon: Ban,
    title: "Onboarding cancelled",
    description: "This onboarding workflow has been cancelled. Contact HR for further assistance.",
    tone: "red"
  }
};

const documentTypes = [
  { type: "AADHAR", label: "Aadhar", placeholder: "12 digit Aadhar number" },
  { type: "PAN", label: "PAN", placeholder: "ABCDE1234F" },
  { type: "BANK_CHEQUE", label: "Bank cheque", placeholder: "Optional reference" }
];

const emptyPersonal = { firstName: "", lastName: "", phone: "", dob: "", gender: "Male" };
const emptyEmergency = { name: "", relationship: "", phone: "" };
const emptyBank = { accountHolder: "", bankName: "", accountNumber: "", ifsc: "" };

export function OnboardingPendingPage() {
  const location = useLocation();
  const routeStatus = (location.pathname.split("/").pop() || "pending") as StatusKey;
  const content = statusContent[routeStatus] || statusContent.pending;
  const Icon = content.icon;
  const { pendingAuth } = useAuth();
  const { notify } = useToast();
  const onboardingToken = pendingAuth?.type === "ONBOARDING" ? pendingAuth.onboardingToken : null;
  const canEdit = Boolean(onboardingToken && editableRoutes.has(routeStatus));

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [personalInfo, setPersonalInfo] = useState(emptyPersonal);
  const [emergencyContact, setEmergencyContact] = useState(emptyEmergency);
  const [bankDetails, setBankDetails] = useState(emptyBank);
  const [documentForms, setDocumentForms] = useState<Record<string, { number: string; file: File | null }>>({
    AADHAR: { number: "", file: null },
    PAN: { number: "", file: null },
    BANK_CHEQUE: { number: "", file: null }
  });

  const submittedDocuments = useMemo(() => summary?.submittedDocuments || submission?.documents || [], [summary, submission]);

  async function refresh() {
    if (!onboardingToken || !canEdit) return;
    setLoading(true);
    try {
      const [nextSummary, nextSubmission] = await Promise.all([
        employeeOnboardingApi.me(onboardingToken),
        employeeOnboardingApi.submission(onboardingToken)
      ]);
      setSummary(nextSummary);
      setSubmission(nextSubmission);
      setPersonalInfo({ ...emptyPersonal, ...(nextSubmission.personalInfo || {}) });
      setEmergencyContact({ ...emptyEmergency, ...(nextSubmission.emergencyContact || {}) });
      setBankDetails({ ...emptyBank, ...(nextSubmission.bankDetails || {}) });
    } catch (error) {
      notify(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingToken, routeStatus]);

  async function saveSection(section: "personal" | "emergency" | "bank", event: FormEvent) {
    event.preventDefault();
    if (!onboardingToken) return;
    setSaving(section);
    try {
      if (section === "personal") await employeeOnboardingApi.savePersonalInfo(onboardingToken, personalInfo);
      if (section === "emergency") await employeeOnboardingApi.saveEmergencyContact(onboardingToken, emergencyContact);
      if (section === "bank") await employeeOnboardingApi.saveBankDetails(onboardingToken, { ...bankDetails, ifsc: bankDetails.ifsc.toUpperCase() });
      notify("Saved successfully", "success");
      await refresh();
    } catch (error) {
      notify(getErrorMessage(error), "error");
    } finally {
      setSaving(null);
    }
  }

  async function uploadDocument(type: string, event: FormEvent) {
    event.preventDefault();
    if (!onboardingToken) return;
    const form = documentForms[type];
    if (!form.file) {
      notify("Select a file before uploading", "error");
      return;
    }
    setSaving(`document-${type}`);
    try {
      await employeeOnboardingApi.uploadDocument(onboardingToken, { type, number: form.number, file: form.file });
      notify("Document uploaded", "success");
      setDocumentForms((current) => ({ ...current, [type]: { number: "", file: null } }));
      await refresh();
    } catch (error) {
      notify(getErrorMessage(error), "error");
    } finally {
      setSaving(null);
    }
  }

  async function deleteDocument(type: string) {
    if (!onboardingToken) return;
    setSaving(`delete-${type}`);
    try {
      await employeeOnboardingApi.deleteDocument(onboardingToken, type);
      notify("Document deleted", "success");
      await refresh();
    } catch (error) {
      notify(getErrorMessage(error), "error");
    } finally {
      setSaving(null);
    }
  }

  async function submitOnboarding() {
    if (!onboardingToken) return;
    setSaving("submit");
    try {
      await employeeOnboardingApi.submit(onboardingToken);
      window.sessionStorage.removeItem("erp_hrm_onboarding");
      notify("Onboarding submitted", "success");
      window.location.replace("/hrm/onboarding/submitted");
    } catch (error) {
      notify(getErrorMessage(error), "error");
    } finally {
      setSaving(null);
    }
  }

  if (!canEdit) {
    return (
      <main className="auth-page">
        <section className="auth-card onboarding-auth-card">
          <div className="onboarding-status-header">
            <Icon size={34} />
            <Badge tone={content.tone} dot>{routeStatus.replace(/-/g, " ")}</Badge>
          </div>
          <h1>{content.title}</h1>
          <p>{content.description}</p>
          <div className="form-actions">
            <Link className="btn btn-primary" to="/hrm/login">Back to login</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page onboarding-page">
      <section className="auth-card onboarding-auth-card">
        <div className="onboarding-status-header">
          <Icon size={34} />
          <Badge tone={content.tone} dot>{summary?.status || (pendingAuth?.type === "ONBOARDING" ? pendingAuth.onboardingStatus : "Onboarding")}</Badge>
        </div>
        <h1>{content.title}</h1>
        <p>{content.description}</p>

        <div className="onboarding-progress">
          <div className="onboarding-progress-copy">
            <strong>{loading ? "Loading..." : `${summary?.completionPercentage ?? 0}% complete`}</strong>
            <span>{summary?.currentStep ? `Current step: ${summary.currentStep}` : "Complete all sections to submit"}</span>
          </div>
          <div className="progress-track"><span style={{ width: `${summary?.completionPercentage ?? 0}%` }} /></div>
        </div>

        <div className="onboarding-workflow-grid">
          <form className="form-grid onboarding-section" onSubmit={(event) => saveSection("personal", event)}>
            <SectionTitle title="Personal information" complete={Boolean(submission?.personalInfo && Object.keys(submission.personalInfo).length)} />
            <div className="form-grid two">
              <Field label="First name" required><Input value={personalInfo.firstName} onChange={(event) => setPersonalInfo({ ...personalInfo, firstName: event.target.value })} required /></Field>
              <Field label="Last name"><Input value={personalInfo.lastName} onChange={(event) => setPersonalInfo({ ...personalInfo, lastName: event.target.value })} /></Field>
              <Field label="Phone" required><Input value={personalInfo.phone} onChange={(event) => setPersonalInfo({ ...personalInfo, phone: event.target.value })} required /></Field>
              <Field label="Date of birth" required><Input type="date" value={personalInfo.dob?.slice(0, 10)} onChange={(event) => setPersonalInfo({ ...personalInfo, dob: event.target.value })} required /></Field>
              <Field label="Gender" required>
                <Select value={personalInfo.gender} onChange={(event) => setPersonalInfo({ ...personalInfo, gender: event.target.value })}>
                  <option>Male</option><option>Female</option><option>Other</option><option>PreferNotToSay</option>
                </Select>
              </Field>
            </div>
            <div className="form-actions"><Button loading={saving === "personal"} type="submit">Save Personal Info</Button></div>
          </form>

          <form className="form-grid onboarding-section" onSubmit={(event) => saveSection("emergency", event)}>
            <SectionTitle title="Emergency contact" complete={Boolean(submission?.emergencyContact && Object.keys(submission.emergencyContact).length)} />
            <div className="form-grid two">
              <Field label="Contact name" required><Input value={emergencyContact.name} onChange={(event) => setEmergencyContact({ ...emergencyContact, name: event.target.value })} required /></Field>
              <Field label="Relationship" required><Input value={emergencyContact.relationship} onChange={(event) => setEmergencyContact({ ...emergencyContact, relationship: event.target.value })} required /></Field>
              <Field label="Phone" required><Input value={emergencyContact.phone} onChange={(event) => setEmergencyContact({ ...emergencyContact, phone: event.target.value })} required /></Field>
            </div>
            <div className="form-actions"><Button loading={saving === "emergency"} type="submit">Save Contact</Button></div>
          </form>

          <form className="form-grid onboarding-section" onSubmit={(event) => saveSection("bank", event)}>
            <SectionTitle title="Bank details" complete={Boolean(submission?.bankDetails && Object.keys(submission.bankDetails).length)} />
            <div className="form-grid two">
              <Field label="Account holder" required><Input value={bankDetails.accountHolder} onChange={(event) => setBankDetails({ ...bankDetails, accountHolder: event.target.value })} required /></Field>
              <Field label="Bank name" required><Input value={bankDetails.bankName} onChange={(event) => setBankDetails({ ...bankDetails, bankName: event.target.value })} required /></Field>
              <Field label="Account number" required><Input value={bankDetails.accountNumber} onChange={(event) => setBankDetails({ ...bankDetails, accountNumber: event.target.value })} required /></Field>
              <Field label="IFSC" required><Input value={bankDetails.ifsc} onChange={(event) => setBankDetails({ ...bankDetails, ifsc: event.target.value.toUpperCase() })} required /></Field>
            </div>
            <div className="form-actions"><Button loading={saving === "bank"} type="submit">Save Bank Details</Button></div>
          </form>

          <div className="form-grid onboarding-section">
            <SectionTitle title="Documents" complete={(summary?.requiredDocuments || documentTypes.map((doc) => doc.type)).every((type: string) => submittedDocuments.some((doc: any) => doc.type === type))} />
            {documentTypes.map((docType) => {
              const uploaded = submittedDocuments.find((doc: any) => doc.type === docType.type);
              return (
                <form className="onboarding-document-row" key={docType.type} onSubmit={(event) => uploadDocument(docType.type, event)}>
                  <div>
                    <strong>{docType.label}</strong>
                    <span>{uploaded ? uploaded.verificationStatus : "Not uploaded"}</span>
                  </div>
                  <Input value={documentForms[docType.type].number} placeholder={docType.placeholder} onChange={(event) => setDocumentForms((current) => ({ ...current, [docType.type]: { ...current[docType.type], number: event.target.value } }))} />
                  <Input type="file" onChange={(event) => setDocumentForms((current) => ({ ...current, [docType.type]: { ...current[docType.type], file: event.target.files?.[0] || null } }))} />
                  <Button size="sm" type="submit" icon={<UploadCloud size={15} />} loading={saving === `document-${docType.type}`}>{uploaded ? "Replace" : "Upload"}</Button>
                  {uploaded && <Button size="sm" variant="ghost" type="button" loading={saving === `delete-${docType.type}`} onClick={() => deleteDocument(docType.type)}>Delete</Button>}
                </form>
              );
            })}
          </div>
        </div>

        <div className="form-actions onboarding-submit-actions">
          <Link className="btn btn-secondary" to="/hrm/login">Back to login</Link>
          <Button loading={saving === "submit"} onClick={submitOnboarding}>Submit for HR Review</Button>
        </div>
      </section>
    </main>
  );
}

function SectionTitle({ title, complete }: { title: string; complete: boolean }) {
  return (
    <div className="onboarding-section-title">
      <h2>{title}</h2>
      <Badge tone={complete ? "green" : "yellow"} dot>{complete ? "Saved" : "Pending"}</Badge>
    </div>
  );
}
