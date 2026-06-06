// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trainingApi, employeeApi } from "../../api/hrm-api";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";



import { AsyncSelect } from "../../components/ui/async-select";

export function TrainingDashboard() {
  const [activeTab, setActiveTab] = useState("sessions");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Training & Development</h1>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-2 border-b pb-2">
          <button className={`px-4 py-2 font-medium ${activeTab === "sessions" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`} onClick={() => setActiveTab("sessions")}>Training Sessions</button>
          <button className={`px-4 py-2 font-medium ${activeTab === "materials" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`} onClick={() => setActiveTab("materials")}>Learning Materials</button>
          <button className={`px-4 py-2 font-medium ${activeTab === "certifications" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`} onClick={() => setActiveTab("certifications")}>Certifications</button>
        </div>

        {activeTab === "sessions" && (<div>
          <SessionsTab />
        </div>)}
        {activeTab === "materials" && (<div>
          <MaterialsTab />
        </div>)}
        {activeTab === "certifications" && (<div>
          <CertificationsTab />
        </div>)}
      </div>
    </div>
  );
}

// --- SESSIONS TAB ---
function SessionsTab() {
  const queryClient = useQueryClient();
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["training-sessions"],
    queryFn: () => trainingApi.getSessions().then(res => res || [])
  });

  return (
    <Card>
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Upcoming & Active Sessions</h3>
        <CreateSessionModal />
      </div>
      <div className="p-4">
        {isLoading ? <p>Loading sessions...</p> : (
          <div className="space-y-4">
            {sessions.map((s: any) => (
              <div key={s._id || s.id} className="p-4 border rounded-lg flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="font-semibold text-lg">{s.title}</h3>
                  <p className="text-sm text-gray-500">Instructor: {s.instructor?.name || s.instructor?.email}</p>
                  <p className="text-sm text-gray-500">Date: {new Date(s.startDate).toLocaleDateString()} - {new Date(s.endDate).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">Location: {s.location}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    s.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    s.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    s.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
            {sessions.length === 0 && <p className="text-gray-500">No training sessions found.</p>}
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

  const mutation = useMutation({
    mutationFn: trainingApi.createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-sessions"] });
      setOpen(false);
    }
  });

  return (
    <>
      <div onClick={() => setOpen(true)} className="inline-block">
        <Button>Schedule Session</Button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative"><button onClick={() => setOpen(false)} className="absolute top-2 right-2 border rounded px-2">X</button>
        <div className="mb-4"><h2 className="text-xl font-bold">New Training Session</h2></div>
        <div className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={title} onChange={(e: any) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Instructor</label>
            <input className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Search employee..." onChange={(e: any) => setEmployeeId(e.target.value)} />
          </div>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Start Date</label>
              <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" type="date" value={startDate} onChange={(e: any) => setStartDate(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">End Date</label>
              <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" type="date" value={endDate} onChange={(e: any) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Location</label>
            <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={location} onChange={(e: any) => setLocation(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={description} onChange={(e: any) => setDescription(e.target.value)} />
          </div>
          <Button onClick={() => mutation.mutate({ title, description, startDate, endDate, location, instructor: instructorId })} disabled={mutation.isPending}>
            Create Session
          </Button>
        </div>
      </div>
        </div>
      )}
    </>
  );
}

// --- MATERIALS TAB ---
function MaterialsTab() {
  const { data: materials = [], isLoading } = useQuery({
    queryKey: ["training-materials"],
    queryFn: () => trainingApi.getMaterials().then(res => res || [])
  });

  return (
    <Card>
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Learning Library</h3>
        <Button variant="secondary">Upload Material</Button>
      </div>
      <div className="p-4">
        {isLoading ? <p>Loading...</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {materials.map((m: any) => (
              <div key={m._id || m.id} className="p-4 border rounded-lg bg-white shadow-sm flex items-start space-x-4">
                <div className="bg-indigo-100 text-indigo-700 p-3 rounded-lg font-bold">
                  {m.materialType.substring(0,3).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold">{m.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">{m.description}</p>
                  <a href={m.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">View Material</a>
                </div>
              </div>
            ))}
            {materials.length === 0 && <p className="text-gray-500">No learning materials found.</p>}
          </div>
        )}
      </div>
    </Card>
  );
}

// --- CERTIFICATIONS TAB ---
function CertificationsTab() {
  const { data: certs = [], isLoading } = useQuery({
    queryKey: ["training-certs"],
    queryFn: () => trainingApi.getCertifications().then(res => res || [])
  });

  return (
    <Card>
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Employee Certifications</h3>
        <Button>Add Certification</Button>
      </div>
      <div className="p-4">
        {isLoading ? <p>Loading...</p> : (
          <div className="space-y-4">
            {certs.map((c: any) => (
              <div key={c._id || c.id} className="p-4 border-l-4 border-amber-500 bg-amber-50 rounded-r-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-amber-900">{c.certificationName}</h3>
                    <p className="text-sm font-medium text-amber-800">Employee: {c.employee?.email}</p>
                    <p className="text-sm text-amber-700">Issued by: {c.issuingOrganization}</p>
                    <p className="text-sm text-amber-700">Earned: {new Date(c.certificationDate).toLocaleDateString()}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-200 text-amber-900">
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
