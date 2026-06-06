// @ts-nocheck
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { performanceApi, employeeApi } from "../../api/hrm-api";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";


import { Goal, PerformanceAppraisal, ImprovementPlan, Feedback } from "../../api/types";

import { AsyncSelect } from "../../components/ui/async-select";

export function PerformanceDashboard() {
  const [activeTab, setActiveTab] = useState("goals");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Performance Management</h1>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-2 border-b pb-2">
          <button className={`px-4 py-2 font-medium ${activeTab === "goals" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`} onClick={() => setActiveTab("goals")}>Goals</button>
          <button className={`px-4 py-2 font-medium ${activeTab === "appraisals" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`} onClick={() => setActiveTab("appraisals")}>Appraisals</button>
          <button className={`px-4 py-2 font-medium ${activeTab === "pips" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`} onClick={() => setActiveTab("pips")}>Improvement Plans</button>
          <button className={`px-4 py-2 font-medium ${activeTab === "feedback" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`} onClick={() => setActiveTab("feedback")}>Feedback</button>
        </div>

        {activeTab === "goals" && (<div>
          <GoalsTab />
        </div>)}
        {activeTab === "appraisals" && (<div>
          <AppraisalsTab />
        </div>)}
        {activeTab === "pips" && (<div>
          <ImprovementPlansTab />
        </div>)}
        {activeTab === "feedback" && (<div>
          <FeedbackTab />
        </div>)}
      </div>
    </div>
  );
}

// --- GOALS TAB ---
function GoalsTab() {
  const queryClient = useQueryClient();
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["performance-goals"],
    queryFn: () => performanceApi.getGoals().then(res => res || [])
  });

  return (
    <Card>
      <div className="flex flex-row items-center justify-between p-10">
        <h3 className="text-lg font-semibold">Company Goals</h3>
        <CreateGoalModal />
      </div>
      <div className="p-4">
        {isLoading ? <p>Loading goals...</p> : (
          <div className="space-y-4">
            {goals.map((g: any) => (
              <div key={g._id || g.id} className="p-4 border rounded-lg flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="font-semibold">{g.goal}</h3>
                  <p className="text-sm text-gray-500">Employee: {g.employee?.name || g.employee?.email}</p>
                  <p className="text-sm text-gray-500">Target Date: {new Date(g.targetDate).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {g.status}
                  </span>
                  <span className="text-sm mt-1">{g.progress}% Complete</span>
                </div>
              </div>
            ))}
            {goals.length === 0 && <p className="text-gray-500">No goals found.</p>}
          </div>
        )}
      </div>
    </Card>
  );
}

function CreateGoalModal() {
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [goal, setGoal] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: performanceApi.createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-goals"] });
      setOpen(false);
    }
  });

  return (
    <>
      <div onClick={() => setOpen(true)} className="inline-block">
        <Button>Create Goal</Button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative"><button onClick={() => setOpen(false)} className="absolute top-2 right-2 border rounded px-2">X</button>
        <div className="mb-4"><h2 className="text-xl font-bold">New Goal</h2></div>
        <div className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium">Employee</label>
            <input className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Search employee..." onChange={(e: any) => setEmployeeId(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Goal Title</label>
            <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={goal} onChange={(e: any) => setGoal(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Target Date</label>
            <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" type="date" value={targetDate} onChange={(e: any) => setTargetDate(e.target.value)} />
          </div>
          <Button onClick={() => mutation.mutate({ employee: employeeId, goal, targetDate, status: "In Progress", progress: 0, keyPerformanceIndicators: [] })} disabled={mutation.isPending}>
            Save Goal
          </Button>
        </div>
      </div>
        </div>
      )}
    </>
  );
}

// --- APPRAISALS TAB ---
function AppraisalsTab() {
  const { data: appraisals = [], isLoading } = useQuery({
    queryKey: ["performance-appraisals"],
    queryFn: () => performanceApi.getAppraisals().then(res => res || [])
  });

  return (
    <Card>
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Performance Appraisals</h3>
        <Button>New Appraisal</Button>
      </div>
      <div className="p-4">
        {isLoading ? <p>Loading...</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {appraisals.map((a: any) => (
              <div key={a._id || a.id} className="p-4 border rounded-lg bg-white shadow-sm">
                <div className="flex justify-between">
                  <h3 className="font-semibold text-lg">{a.employee?.email}</h3>
                  <span className="text-2xl font-bold text-blue-600">{a.rating}/5</span>
                </div>
                <p className="text-sm text-gray-500 mb-2">Period: {a.period}</p>
                <div className="text-sm mt-2">
                  <p className="font-medium">Manager Comments:</p>
                  <p className="text-gray-600 italic">"{a.managerComments || 'No comments'}"</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// --- IMPROVEMENT PLANS TAB ---
function ImprovementPlansTab() {
  const { data: pips = [], isLoading } = useQuery({
    queryKey: ["performance-pips"],
    queryFn: () => performanceApi.getImprovementPlans().then(res => res || [])
  });

  return (
    <Card>
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Improvement Plans (PIP)</h3>
        <Button variant="danger">Create PIP</Button>
      </div>
      <div className="p-4">
        {isLoading ? <p>Loading...</p> : (
          <div className="space-y-4">
            {pips.map((p: any) => (
              <div key={p._id || p.id} className="p-4 border-l-4 border-red-500 bg-white rounded-r-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-red-700">PIP: {p.employee?.email}</h3>
                    <p className="text-sm text-gray-500">Timeline: {new Date(p.timeline).toLocaleDateString()}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {p.status}
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-medium">Objectives:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {p.objectives?.map((obj: string, i: number) => <li key={i}>{obj}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// --- FEEDBACK TAB ---
function FeedbackTab() {
  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ["performance-feedback"],
    queryFn: () => performanceApi.getFeedbacks().then(res => res || [])
  });

  return (
    <Card>
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">360° Feedback</h3>
        <Button variant="secondary">Request Feedback</Button>
      </div>
      <div className="p-4">
        {isLoading ? <p>Loading...</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {feedback.map((f: any) => (
              <div key={f._id || f.id} className="p-4 border rounded-lg bg-indigo-50">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">{f.feedbackType} FEEDBACK</span>
                  <span className="text-sm text-gray-500">{new Date(f.feedbackDate).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-medium mb-1">To: {f.employee?.email}</p>
                <p className="text-sm font-medium mb-3">From: {f.feedbackFrom?.email || 'Anonymous'}</p>
                <p className="text-gray-700 italic">"{f.comments}"</p>
                <div className="mt-3 flex items-center">
                  <span className="text-indigo-600 font-bold">Rating: {f.rating}/5</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
