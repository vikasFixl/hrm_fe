// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trainingApi, employeeApi } from "../../api/hrm-api";
import { getErrorMessage } from "../../api/http";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { SkeletonCard } from "../../components/ui/skeleton";
import { Tabs } from "../../components/ui/tabs";
import { Modal } from "../../components/ui/modal";
import { Field, Input, Select, Textarea } from "../../components/ui/field";
import { AsyncSelect } from "../../components/ui/async-select";
import { useToast } from "../../components/ui/toast";
import { formatEmployeeName } from "../../lib/hrm-display";

export function TrainingDashboard() {
  const [activeTab, setActiveTab] = useState("sessions");

  return (
    <div className="performance-page page-fade">
      <div className="page-title">
        <div>
          <h1>Training & Development</h1>
          <p>Manage learning sessions, materials and employee certifications.</p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        tabs={[
          { value: "sessions", label: "Training Sessions" },
          { value: "materials", label: "Learning Materials" },
          { value: "certifications", label: "Certifications" }
        ]}
        onChange={setActiveTab}
      />

      <div className="tab-panel">
        {activeTab === "sessions" && <SessionsTab />}
        {activeTab === "materials" && <MaterialsTab />}
        {activeTab === "certifications" && <CertificationsTab />}
      </div>
    </div>
  );
}

function SessionsTab() {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["training-sessions"],
    queryFn: () => trainingApi.getSessions().then((res) => res || [])
  });

  return (
    <Card>
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Upcoming & Active Sessions</h3>
        <CreateSessionModal />
      </div>
      <div className="p-4">
        {isLoading ? <DashboardCardSkeletons /> : (
          <div className="space-y-4">
            {sessions.map((s: any) => (
              <div key={s._id || s.id} className="p-4 border rounded-lg flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="font-semibold text-lg">{s.title}</h3>
                  <p className="text-sm text-gray-500">Instructor: {formatEmployeeName(s.instructor)}</p>
                  <p className="text-sm text-gray-500">Date: {new Date(s.startDate).toLocaleDateString()} - {new Date(s.endDate).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">Location: {s.location}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  s.status === "Completed" ? "bg-green-100 text-green-800" :
                  s.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                  s.status === "Cancelled" ? "bg-red-100 text-red-800" :
                  "bg-yellow-100 text-yellow-800"
                }`}>
                  {s.status}
                </span>
              </div>
            ))}
            {sessions.length === 0 && <p className="text-gray-500">Training sessions will appear here once scheduled.</p>}
          </div>
        )}
      </div>
    </Card>
  );
}

function CreateSessionModal() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const reset = () => {
    setTitle("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setLocation("");
    setInstructorId("");
  };

  const mutation = useMutation({
    mutationFn: trainingApi.createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-sessions"] });
      setOpen(false);
      reset();
      notify("Training session scheduled", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>Schedule Session</Button>
      <Modal title="New Training Session" open={open} onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate({ title, description, startDate, endDate, location, instructor: instructorId });
        }}>
          <Field label="Title" required><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></Field>
          <Field label="Instructor" required>
            <AsyncSelect value={instructorId} onChange={setInstructorId} fetchOptions={employeeApi.searchEmployeesByEmail} placeholder="Search instructor by email..." />
          </Field>
          <div className="form-row">
            <Field label="Start Date" required><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></Field>
            <Field label="End Date" required><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required /></Field>
          </div>
          <Field label="Location" required><Input value={location} onChange={(e) => setLocation(e.target.value)} required /></Field>
          <Field label="Description"><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending} disabled={!title || !startDate || !endDate || !location || !instructorId}>Create Session</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function MaterialsTab() {
  const { data: materials = [], isLoading } = useQuery({
    queryKey: ["training-materials"],
    queryFn: () => trainingApi.getMaterials().then((res) => res || [])
  });

  return (
    <Card>
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Learning Library</h3>
        <CreateMaterialModal />
      </div>
      <div className="p-4">
        {isLoading ? <DashboardCardSkeletons count={4} /> : (
          <div className="grid gap-4 md:grid-cols-2">
            {materials.map((m: any) => (
              <div key={m._id || m.id} className="p-4 border rounded-lg bg-white shadow-sm flex items-start space-x-4">
                <div className="bg-indigo-100 text-indigo-700 p-3 rounded-lg font-bold">
                  {(m.materialType || "DOC").substring(0, 3).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold">{m.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">{m.description}</p>
                  <a href={m.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">View Material</a>
                </div>
              </div>
            ))}
            {materials.length === 0 && <p className="text-gray-500">Learning materials will appear here once uploaded.</p>}
          </div>
        )}
      </div>
    </Card>
  );
}

function CreateMaterialModal() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [materialType, setMaterialType] = useState("Document");
  const [fileUrl, setFileUrl] = useState("");
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const reset = () => { setTitle(""); setDescription(""); setMaterialType("Document"); setFileUrl(""); };

  const mutation = useMutation({
    mutationFn: trainingApi.createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-materials"] });
      setOpen(false);
      reset();
      notify("Learning material uploaded", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Upload Material</Button>
      <Modal title="Upload Learning Material" open={open} onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate({ title, description, materialType, fileUrl });
        }}>
          <Field label="Title" required><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></Field>
          <Field label="Type" required>
            <Select value={materialType} onChange={(e) => setMaterialType(e.target.value)} required>
              <option value="Document">Document</option>
              <option value="Video">Video</option>
              <option value="Presentation">Presentation</option>
              <option value="Other">Other</option>
            </Select>
          </Field>
          <Field label="File URL" required><Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." required /></Field>
          <Field label="Description" required><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required /></Field>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending} disabled={!title || !description || !fileUrl}>Upload</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function CertificationsTab() {
  const { data: certs = [], isLoading } = useQuery({
    queryKey: ["training-certs"],
    queryFn: () => trainingApi.getCertifications().then((res) => res || [])
  });

  return (
    <Card>
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Employee Certifications</h3>
        <CreateCertificationModal />
      </div>
      <div className="p-4">
        {isLoading ? <DashboardCardSkeletons count={4} /> : (
          <div className="space-y-4">
            {certs.map((c: any) => (
              <div key={c._id || c.id} className="p-4 border-l-4 border-amber-500 bg-amber-50 rounded-r-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-amber-900">{c.certificationName}</h3>
                    <p className="text-sm font-medium text-amber-800">Employee: {formatEmployeeName(c.employee)}</p>
                    <p className="text-sm text-amber-700">Issued by: {c.issuingOrganization}</p>
                    <p className="text-sm text-amber-700">Earned: {new Date(c.certificationDate).toLocaleDateString()}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-200 text-amber-900">{c.status}</span>
                </div>
              </div>
            ))}
            {certs.length === 0 && <p className="text-gray-500">Employee certifications will appear here once logged.</p>}
          </div>
        )}
      </div>
    </Card>
  );
}

function CreateCertificationModal() {
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [certificationName, setCertificationName] = useState("");
  const [certificationDate, setCertificationDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [issuingOrganization, setIssuingOrganization] = useState("");
  const [certificationUrl, setCertificationUrl] = useState("");
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const reset = () => {
    setEmployeeId("");
    setCertificationName("");
    setCertificationDate("");
    setExpirationDate("");
    setIssuingOrganization("");
    setCertificationUrl("");
  };

  const mutation = useMutation({
    mutationFn: trainingApi.logCertification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-certs"] });
      setOpen(false);
      reset();
      notify("Certification logged", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add Certification</Button>
      <Modal title="Log Certification" open={open} onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate({
            employee: employeeId,
            certificationName,
            certificationDate,
            expirationDate: expirationDate || undefined,
            issuingOrganization,
            certificationUrl: certificationUrl || undefined
          });
        }}>
          <Field label="Employee" required>
            <AsyncSelect value={employeeId} onChange={setEmployeeId} fetchOptions={employeeApi.searchEmployeesByEmail} placeholder="Search employee by email..." />
          </Field>
          <Field label="Certification Name" required><Input value={certificationName} onChange={(e) => setCertificationName(e.target.value)} required /></Field>
          <Field label="Issuing Organization" required><Input value={issuingOrganization} onChange={(e) => setIssuingOrganization(e.target.value)} required /></Field>
          <div className="form-row">
            <Field label="Certification Date" required><Input type="date" value={certificationDate} onChange={(e) => setCertificationDate(e.target.value)} required /></Field>
            <Field label="Expiration Date"><Input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} /></Field>
          </div>
          <Field label="Certificate URL"><Input value={certificationUrl} onChange={(e) => setCertificationUrl(e.target.value)} placeholder="https://..." /></Field>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending} disabled={!employeeId || !certificationName || !certificationDate || !issuingOrganization}>Save</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function DashboardCardSkeletons({ count = 6 }: { count?: number }) {
  return (
    <div className="performance-grid">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} lines={4} />
      ))}
    </div>
  );
}
