// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { surveyApi, employeeApi } from "../../api/hrm-api";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";



import { AsyncSelect } from "../../components/ui/async-select";

export function SurveyDashboard() {
  const [activeTab, setActiveTab] = useState("surveys");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Surveys & Feedback</h1>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-2 border-b pb-2">
          <button className={`px-4 py-2 font-medium ${activeTab === "surveys" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`} onClick={() => setActiveTab("surveys")}>Active Surveys</button>
          <button className={`px-4 py-2 font-medium ${activeTab === "feedback" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`} onClick={() => setActiveTab("feedback")}>Employee Feedback</button>
          <button className={`px-4 py-2 font-medium ${activeTab === "action-plans" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`} onClick={() => setActiveTab("action-plans")}>Action Plans</button>
        </div>

        {activeTab === "surveys" && (<div>
          <SurveysTab />
        </div>)}
        {activeTab === "feedback" && (<div>
          <FeedbackTab />
        </div>)}
        {activeTab === "action-plans" && (<div>
          <ActionPlansTab />
        </div>)}
      </div>
    </div>
  );
}

// --- SURVEYS TAB ---
function SurveysTab() {
  const queryClient = useQueryClient();
  const { data: surveys = [], isLoading } = useQuery({
    queryKey: ["survey-deliveries"],
    queryFn: () => surveyApi.getSurveys().then(res => res || [])
  });

  return (
    <Card>
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Survey Campaigns</h3>
        <CreateSurveyModal />
      </div>
      <div className="p-4">
        {isLoading ? <p>Loading surveys...</p> : (
          <div className="space-y-4">
            {surveys.map((s: any) => (
              <div key={s._id || s.id} className="p-4 border rounded-lg flex justify-between items-center bg-white shadow-sm">
                <div>
                  <h3 className="font-semibold text-lg">{s.title}</h3>
                  <p className="text-sm text-gray-500">{s.description}</p>
                  <p className="text-sm text-gray-500 mt-1">Audience: {s.audience}</p>
                  <p className="text-sm text-gray-500">Timeline: {new Date(s.startDate).toLocaleDateString()} - {new Date(s.endDate).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    s.status === 'Sent' ? 'bg-blue-100 text-blue-800' :
                    s.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {s.status}
                  </span>
                  <div className="text-sm font-medium">Responses: {s.responseCount}</div>
                </div>
              </div>
            ))}
            {surveys.length === 0 && <p className="text-gray-500">No surveys found.</p>}
          </div>
        )}
      </div>
    </Card>
  );
}

function CreateSurveyModal() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [audience, setAudience] = useState("All");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: surveyApi.createSurvey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["survey-deliveries"] });
      setOpen(false);
    }
  });

  return (
    <>
      <div onClick={() => setOpen(true)} className="inline-block">
        <Button>Draft Survey</Button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative"><button onClick={() => setOpen(false)} className="absolute top-2 right-2 border rounded px-2">X</button>
        <div className="mb-4"><h2 className="text-xl font-bold">Draft New Survey</h2></div>
        <div className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={title} onChange={(e: any) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Audience</label>
            <select className="w-full border p-2 rounded-md" value={audience} onChange={(e: any) => setAudience(e.target.value)}>
              <option value="All">All Employees</option>
              <option value="Department">Specific Department</option>
              <option value="Role">Specific Role</option>
            </select>
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
            <label className="text-sm font-medium">Description</label>
            <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={description} onChange={(e: any) => setDescription(e.target.value)} />
          </div>
          <Button onClick={() => mutation.mutate({ title, description, startDate, endDate, audience })} disabled={mutation.isPending}>
            Save Draft
          </Button>
        </div>
      </div>
        </div>
      )}
    </>
  );
}

// --- FEEDBACK TAB ---
function FeedbackTab() {
  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ["survey-feedback"],
    queryFn: () => surveyApi.getFeedback().then(res => res || [])
  });

  return (
    <Card>
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Continuous Employee Feedback</h3>
      </div>
      <div className="p-4">
        {isLoading ? <p>Loading...</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {feedback.map((f: any) => (
              <div key={f._id || f.id} className="p-4 border rounded-lg bg-teal-50 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-600">{f.category}</span>
                  <span className={`text-xs font-bold ${
                    f.sentiment === 'Positive' ? 'text-green-600' :
                    f.sentiment === 'Negative' ? 'text-red-600' : 'text-gray-600'
                  }`}>{f.sentiment}</span>
                </div>
                <p className="text-sm font-medium mb-1">From: {f.isAnonymous ? 'Anonymous' : (f.employee?.email || 'Unknown')}</p>
                <p className="text-gray-700 italic mt-2">"{f.message}"</p>
                <div className="mt-2 text-xs text-gray-500 text-right">
                  {new Date(f.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// --- ACTION PLANS TAB ---
function ActionPlansTab() {
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["survey-action-plans"],
    queryFn: () => surveyApi.getActionPlans().then(res => res || [])
  });

  return (
    <Card>
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Post-Survey Action Plans</h3>
        <Button variant="secondary">Create Plan</Button>
      </div>
      <div className="p-4">
        {isLoading ? <p>Loading...</p> : (
          <div className="space-y-4">
            {plans.map((p: any) => (
              <div key={p._id || p.id} className="p-4 border-l-4 border-purple-500 bg-purple-50 rounded-r-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-purple-900">{p.title}</h3>
                    <p className="text-sm font-medium text-purple-800">Owner: {p.owner?.email}</p>
                    <p className="text-sm text-purple-700">Due: {new Date(p.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-200 text-purple-900 mb-2">
                      {p.status}
                    </span>
                    <span className="text-xs font-bold text-purple-800">{p.progress}% Complete</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
