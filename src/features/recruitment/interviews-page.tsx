// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Video, Phone, Users, ExternalLink, CalendarPlus, X } from "lucide-react";
import { recruitmentApi, employeeApi } from "../../api/hrm-api";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/modal";
import { Input, Select } from "../../components/ui/field";
import { AsyncSelect } from "../../components/ui/async-select";
import { useToast } from "../../components/ui/toast";
import { getErrorMessage } from "../../api/http";
import { Avatar } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Employee, JobPosting, Candidate, Interview } from "../../api/types";

const interviewSchema = z.object({
  candidate: z.string().min(1, "Candidate is required"),
  jobPosting: z.string().min(1, "Job Posting is required"),
  interviewer: z.string().min(1, "Interviewer is required"),
  scheduledDate: z.string().min(1, "Scheduled Date is required"),
  interviewType: z.enum(["Phone", "Video", "In-person"]),
  status: z.enum(["Scheduled", "Completed", "Cancelled"]).default("Scheduled"),
  meetingUrl: z.string().optional(),
  timezone: z.string().optional()
});

export function InterviewsPage() {
  const [open, setOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const { data: interviews, isLoading } = useQuery({
    queryKey: ["interviews"],
    queryFn: recruitmentApi.listInterviews
  });

  const { data: candidates } = useQuery({
    queryKey: ["candidates"],
    queryFn: recruitmentApi.listCandidates
  });

  const { data: jobs } = useQuery({
    queryKey: ["jobs"],
    queryFn: recruitmentApi.listJobs
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      candidate: "",
      jobPosting: "",
      interviewer: "",
      scheduledDate: "",
      interviewType: "Video" as const,
      status: "Scheduled" as const,
      meetingUrl: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  });

  const createMutation = useMutation({
    mutationFn: recruitmentApi.createInterview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      notify("Interview scheduled successfully", "success");
      setOpen(false);
      reset();
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => recruitmentApi.updateInterviewStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      notify("Status updated", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  const getStatusColor = (status: string): "blue" | "green" | "red" | "neutral" => {
    switch(status) {
      case "Scheduled": return "blue";
      case "Completed": return "green";
      case "Cancelled": return "red";
      default: return "neutral";
    }
  };

  const getInterviewIcon = (type: string) => {
    switch(type) {
      case "Video": return <Video size={14} />;
      case "Phone": return <Phone size={14} />;
      default: return <MapPin size={14} />;
    }
  };

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Interviews</h1>
          <p>Schedule and track candidate interviews.</p>
        </div>
        <div className="toolbar">
          <Button icon={<CalendarPlus size={16} />} onClick={() => setOpen(true)}>Schedule Interview</Button>
        </div>
      </div>

      <div className="content-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', marginTop: '24px' }}>
        {isLoading ? (
          <div className="loading-state">Loading interviews...</div>
        ) : !interviews?.length ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <CalendarIcon size={48} />
            <h3>No Interviews Scheduled</h3>
            <p>Get started by scheduling an interview with a candidate.</p>
            <Button onClick={() => setOpen(true)} style={{ marginTop: 16 }}>Schedule Now</Button>
          </div>
        ) : (
          interviews.map((interview) => {
            const candidate = typeof interview.candidate === 'object' ? interview.candidate : null;
            const job = typeof interview.jobPosting === 'object' ? interview.jobPosting : null;
            const interviewer = typeof interview.interviewer === 'object' ? interview.interviewer : null;
            
            const date = new Date(interview.scheduledDate);
            
            return (
              <div key={interview._id} className="kanban-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16 }}>{candidate?.firstName} {candidate?.lastName}</h3>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: 13 }}>{job?.title || "Unknown Job"}</p>
                  </div>
                  <Badge tone={getStatusColor(interview.status)}>{interview.status}</Badge>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--surface-50)', padding: 12, borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <CalendarIcon size={14} color="var(--primary)" />
                    <span>{date.toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <Clock size={14} color="var(--primary)" />
                    <span>{date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <Users size={14} color="var(--primary)" />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{interviewer?.firstName} {interviewer?.lastName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    {getInterviewIcon(interview.interviewType)}
                    <span>{interview.interviewType}</span>
                  </div>
                </div>

                {interview.meetingUrl && (
                  <a href={interview.meetingUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', textDecoration: 'none' }}>
                    <ExternalLink size={14} /> Join Meeting
                  </a>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                   <Select 
                      style={{ fontSize: 12, padding: '4px 8px', height: '30px' }}
                      value={interview.status} 
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => statusMutation.mutate({ id: interview._id, status: e.target.value })}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </Select>
                    {/* Add Download ICS here if needed, but for now UI is basic */}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Schedule Interview"
        size="normal"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
          <div className="form-group">
            <label>Candidate</label>
            <Controller
              name="candidate"
              control={control}
              render={({ field }) => (
                <AsyncSelect 
                  value={field.value} 
                  onChange={field.onChange} 
                  fetchOptions={recruitmentApi.searchCandidatesByEmail} 
                  placeholder="Search candidate by email..."
                />
              )}
            />
          </div>

          <div className="form-group">
            <label>Job Posting</label>
            <Controller
              name="jobPosting"
              control={control}
              render={({ field }) => (
                <Select {...field}>
                  <option value="">Select Job</option>
                  {jobs?.map(j => (
                    <option key={j._id} value={j._id}>{j.title}</option>
                  ))}
                </Select>
              )}
            />
          </div>

          <div className="form-group">
            <label>Interviewer</label>
            <Controller
              name="interviewer"
              control={control}
              render={({ field }) => (
                <AsyncSelect 
                  value={field.value} 
                  onChange={field.onChange} 
                  fetchOptions={employeeApi.searchEmployeesByEmail} 
                  placeholder="Search interviewer by email..."
                />
              )}
            />
          </div>

          <div className="form-group">
            <label>Date & Time</label>
            <Controller
              name="scheduledDate"
              control={control}
              render={({ field }) => <Input type="datetime-local" {...field} />}
            />
          </div>

          <div className="form-group">
            <label>Interview Type</label>
            <Controller
              name="interviewType"
              control={control}
              render={({ field }) => (
                <Select {...field}>
                  <option value="Video">Video</option>
                  <option value="Phone">Phone</option>
                  <option value="In-person">In-person</option>
                </Select>
              )}
            />
          </div>

          <div className="form-group">
            <label>Meeting URL (optional)</label>
            <Controller
              name="meetingUrl"
              control={control}
              render={({ field }) => <Input placeholder="e.g. https://meet.google.com/xyz" {...field} />}
            />
          </div>

          <div className="drawer-footer" style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Schedule</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
