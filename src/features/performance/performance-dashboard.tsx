// @ts-nocheck
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ClipboardCheck, MessageSquare, Plus, Target, TrendingUp } from "lucide-react";
import { performanceApi } from "../../api/hrm-api";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { SkeletonCard, SkeletonList, SkeletonTable } from "../../components/ui/skeleton";
import { Tabs } from "../../components/ui/tabs";

type PerformanceTab = "goals" | "appraisals" | "pips" | "feedback";

const tabs: Array<{ value: PerformanceTab; label: string }> = [
  { value: "goals", label: "Goals" },
  { value: "appraisals", label: "Appraisals" },
  { value: "pips", label: "Improvement Plans" },
  { value: "feedback", label: "Feedback" },
];

export function PerformanceDashboard() {
  const [activeTab, setActiveTab] = useState<PerformanceTab>("goals");

  return (
    <div className="performance-page page-fade">
      <div className="page-title performance-hero">
        <div>
          <h1>Performance Management</h1>
          <p>Track goals, appraisals, feedback and employee development.</p>
        </div>
        <CreateGoalModal />
      </div>

      <Tabs value={activeTab} tabs={tabs} onChange={setActiveTab} />

      <div className="tab-panel">
        {activeTab === "goals" && <GoalsTab />}
        {activeTab === "appraisals" && <AppraisalsTab />}
        {activeTab === "pips" && <ImprovementPlansTab />}
        {activeTab === "feedback" && <FeedbackTab />}
      </div>
    </div>
  );
}

function GoalsTab() {
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["performance-goals"],
    queryFn: () => performanceApi.getGoals().then((res) => res || []),
  });

  if (isLoading) {
    return (
      <div className="performance-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} lines={4} />
        ))}
      </div>
    );
  }

  if (!goals.length) {
    return (
      <Card className="empty-card">
        <EmptyState
          icon={Target}
          title="No Goals Yet"
          description="Start tracking company objectives."
          action={<CreateGoalModal label="Create First Goal" />}
        />
      </Card>
    );
  }

  return (
    <div className="performance-grid">
      {goals.map((goal: any) => {
        const progress = clampPercent(goal.progress);
        return (
          <article key={goal._id || goal.id} className="performance-card goal-card">
            <div className="performance-card-head">
              <div className="card-icon blue">
                <Target size={18} />
              </div>
              <span className="badge badge-blue badge-dot">{goal.status || "In Progress"}</span>
            </div>
            <h3>{goal.goal || "Untitled Goal"}</h3>
            <div className="progress-summary">
              <span>Progress</span>
              <strong>{progress}%</strong>
            </div>
            <div className="progress-track" aria-label={`Goal progress ${progress}%`}>
              <span style={{ width: `${progress}%` }} />
            </div>
            <div className="card-meta-grid">
              <span>
                <CalendarDays size={14} />
                Due: {formatDate(goal.targetDate)}
              </span>
              <span>
                <TrendingUp size={14} />
                Owner: {goal.employee?.name || goal.employee?.email || "Unassigned"}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function CreateGoalModal({ label = "Create Goal" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [goal, setGoal] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: performanceApi.createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-goals"] });
      setEmployeeId("");
      setGoal("");
      setTargetDate("");
      setOpen(false);
    },
  });

  const saveGoal = () => {
    mutation.mutate({
      employee: employeeId,
      goal,
      targetDate,
      status: "In Progress",
      progress: 0,
      keyPerformanceIndicators: [],
    });
  };

  return (
    <>
      <Button icon={<Plus size={16} />} onClick={() => setOpen(true)}>
        {label}
      </Button>
      {open && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>New Goal</h2>
                <p className="muted">Assign a measurable objective to an employee.</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Employee</span>
                <input className="input" placeholder="Employee ID or email" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} />
              </label>
              <label className="field">
                <span>Goal Title</span>
                <input className="input" value={goal} onChange={(event) => setGoal(event.target.value)} />
              </label>
              <label className="field">
                <span>Target Date</span>
                <input className="input" type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
              </label>
            </div>
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" loading={mutation.isPending} onClick={saveGoal} disabled={!employeeId || !goal || !targetDate}>
                Save Goal
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AppraisalsTab() {
  const { data: appraisals = [], isLoading } = useQuery({
    queryKey: ["performance-appraisals"],
    queryFn: () => performanceApi.getAppraisals().then((res) => res || []),
  });

  if (isLoading) {
    return <SkeletonTable rows={5} cols={5} />;
  }

  if (!appraisals.length) {
    return (
      <Card className="empty-card">
        <EmptyState icon={ClipboardCheck} title="No Appraisals Yet" description="Create review cycles to capture employee performance ratings." action={<Button variant="secondary">New Appraisal</Button>} />
      </Card>
    );
  }

  return (
    <div className="performance-grid two">
      {appraisals.map((appraisal: any) => (
        <article key={appraisal._id || appraisal.id} className="performance-card">
          <div className="performance-card-head">
            <div className="card-icon purple">
              <ClipboardCheck size={18} />
            </div>
            <strong className="rating-pill">{appraisal.rating || 0}/5</strong>
          </div>
          <h3>{appraisal.employee?.name || appraisal.employee?.email || "Employee Review"}</h3>
          <p className="muted">Period: {appraisal.period || "Not specified"}</p>
          <div className="quote-block">{appraisal.managerComments || "No comments added."}</div>
        </article>
      ))}
    </div>
  );
}

function ImprovementPlansTab() {
  const { data: pips = [], isLoading } = useQuery({
    queryKey: ["performance-pips"],
    queryFn: () => performanceApi.getPIPs().then((res) => res || []),
  });

  if (isLoading) {
    return (
      <div className="performance-grid two">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index} lines={5} />
        ))}
      </div>
    );
  }

  if (!pips.length) {
    return (
      <Card className="empty-card">
        <EmptyState icon={TrendingUp} title="No Improvement Plans" description="Structured coaching plans will appear here when created." action={<Button variant="danger">Create PIP</Button>} />
      </Card>
    );
  }

  return (
    <div className="performance-grid two">
      {pips.map((pip: any) => (
        <article key={pip._id || pip.id} className="performance-card pip-card">
          <div className="performance-card-head">
            <div className="card-icon red">
              <TrendingUp size={18} />
            </div>
            <span className="badge badge-red badge-dot">{pip.status || "Open"}</span>
          </div>
          <h3>{pip.employee?.name || pip.employee?.email || "Improvement Plan"}</h3>
          <p className="muted">Timeline: {formatDate(pip.timeline)}</p>
          <div className="timeline-line" />
          <ul className="compact-list">
            {(pip.objectives || ["Objectives pending"]).map((objective: string, index: number) => (
              <li key={index}>{objective}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function FeedbackTab() {
  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ["performance-feedback"],
    queryFn: () => performanceApi.getFeedback().then((res) => res || []),
  });

  if (isLoading) {
    return <SkeletonList rows={5} />;
  }

  if (!feedback.length) {
    return (
      <Card className="empty-card">
        <EmptyState icon={MessageSquare} title="No Feedback Yet" description="Feedback requests and peer comments will be organized here." action={<Button variant="secondary">Request Feedback</Button>} />
      </Card>
    );
  }

  return (
    <div className="performance-grid two">
      {feedback.map((item: any) => (
        <article key={item._id || item.id} className="performance-card feedback-card">
          <div className="performance-card-head">
            <div className="card-icon blue">
              <MessageSquare size={18} />
            </div>
            <span className="muted">{formatDate(item.feedbackDate)}</span>
          </div>
          <div className="feedback-people">
            <span>To: {item.employee?.name || item.employee?.email || "Employee"}</span>
            <span>From: {item.feedbackFrom?.name || item.feedbackFrom?.email || "Anonymous"}</span>
          </div>
          <div className="quote-block">{item.comments || "No feedback comments added."}</div>
          <strong className="rating-pill">Rating: {item.rating || 0}/5</strong>
        </article>
      ))}
    </div>
  );
}

function clampPercent(value: unknown) {
  const percent = Number(value ?? 0);
  if (Number.isNaN(percent)) return 0;
  return Math.min(100, Math.max(0, percent));
}

function formatDate(value: string | Date | undefined) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString();
}
