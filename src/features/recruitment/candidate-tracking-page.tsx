// @ts-nocheck
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter, Plus } from "lucide-react";
import { recruitmentApi } from "../../api/hrm-api";
import { Candidate } from "../../api/types";
import { getErrorMessage } from "../../api/http";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Field, Input, Select } from "../../components/ui/field";
import { Modal } from "../../components/ui/modal";
import { Avatar } from "../../components/ui/avatar";
import { useToast } from "../../components/ui/toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CandidateDetailDrawer } from "./candidate-detail-drawer";

const STAGES = [
  "Applied",
  "Screening",
  "Shortlisted",
  "Interview_Scheduled",
  "Interview_Completed",
  "Offered",
  "Hired",
  "Rejected"
];

const candidateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  phoneNumber: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  linkedInProfile: z.string().url("Must be a valid URL").min(1, "LinkedIn profile is required"),
  portfolio: z.string().optional(),
  coverLetter: z.string().optional(),
  jobApplication: z.string().min(1, "Job application is required"),
  source: z.enum(["LinkedIn", "Indeed", "Referral", "Walk-in", "Other"]),
  referral: z.string().optional(),
  skills: z.string().min(1, "Skills are required"),
  experience: z.coerce.number().min(0, "Experience must be at least 0"),
  education: z.string().min(1, "Education is required"),
  expectedSalary: z.coerce.number().min(0),
  currentSalary: z.coerce.number().min(0),
  noticePeriod: z.string().min(1, "Notice period is required"),
  tags: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional().or(z.nan().transform(() => undefined)),
  resumeScore: z.coerce.number().min(0).max(100).optional().or(z.nan().transform(() => undefined)),
  resume: z.any().optional()
});

type CandidateForm = z.infer<typeof candidateSchema>;

export function CandidateTrackingPage() {
  const [open, setOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const form = useForm<CandidateForm>({
    resolver: zodResolver(candidateSchema)
  });
  const queryClient = useQueryClient();
  const { notify } = useToast();
  
  const jobs = useQuery({ queryKey: ["jobs"], queryFn: recruitmentApi.listJobs });
  const candidates = useQuery({ queryKey: ["candidates"], queryFn: recruitmentApi.listCandidates });

  const create = useMutation({
    mutationFn: (values: CandidateForm) => {
      const skillsArray = values.skills.split(",").map(s => s.trim()).filter(Boolean);
      const tagsArray = values.tags ? values.tags.split(",").map(s => s.trim()).filter(Boolean) : [];
      
      const formData = new FormData();
      
      Object.keys(values).forEach(key => {
        if (key === 'resume') {
          if (values.resume && values.resume.length > 0) {
            formData.append('resume', values.resume[0]);
          }
        } else if (key === 'skills') {
          formData.append('skills', JSON.stringify(skillsArray));
        } else if (key === 'tags') {
          formData.append('tags', JSON.stringify(tagsArray));
        } else {
          const val = (values as any)[key];
          if (val !== undefined && val !== null && val !== "" && !Number.isNaN(val)) {
            formData.append(key, String(val));
          }
        }
      });

      return recruitmentApi.createCandidate(formData);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["candidates"] });
      setOpen(false);
      form.reset();
      notify("Candidate added", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const moveStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => recruitmentApi.updateCandidateStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["candidates"] });
      notify("Candidate status updated", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Candidate Tracking</h1>
          <p>Kanban board to track candidate pipeline across job postings.</p>
        </div>
        <div className="toolbar">
          <Button variant="secondary" icon={<Filter size={16} />}>Filter</Button>
          <Button icon={<Plus size={16} />} onClick={() => setOpen(true)}>Add Candidate</Button>
        </div>
      </div>

      <div className="kanban-board" style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16, minHeight: 'calc(100vh - 180px)' }}>
        {STAGES.map((stage) => {
          const stageCandidates = candidates.data?.filter(c => (c.status || "Applied") === stage) || [];
          return (
            <div key={stage} className="kanban-column" style={{ flex: '0 0 320px', background: 'var(--surface-50)', padding: 16, borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{stage}</strong>
                <Badge tone="blue">{stageCandidates.length}</Badge>
              </div>
              
              <div className="kanban-items" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stageCandidates.map((candidate) => (
                  <div 
                    key={candidate._id} 
                    className="kanban-card" 
                    style={{ background: 'var(--surface)', padding: 16, borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setSelectedCandidate(candidate._id)}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                      <Avatar name={candidate.name || `${candidate.firstName} ${candidate.lastName}`} size="sm" />
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{candidate.name || `${candidate.firstName} ${candidate.lastName}`}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {candidate.email}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text)", marginTop: 4 }}>
                          {candidate.jobTitle || (typeof candidate.jobApplication === 'object' ? candidate.jobApplication.title : candidate.jobApplication)}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                      <span style={{ fontSize: 11, background: 'var(--surface-100)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-muted)' }}>
                        Interviews: {candidate.interviewCount || 0}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }} onClick={e => e.stopPropagation()}>
                       <Select 
                          style={{ fontSize: 12, padding: '4px 8px', height: 'auto', background: 'var(--surface-50)' }}
                          value="" 
                          onChange={(e) => {
                            if(e.target.value) moveStatus.mutate({ id: candidate._id, status: e.target.value })
                          }}
                       >
                         <option value="" disabled>Move to...</option>
                         {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                       </Select>
                    </div>
                  </div>
                ))}
                {stageCandidates.length === 0 && (
                  <div className="empty-state" style={{ padding: '24px 0', border: '1px dashed var(--border)', background: 'transparent' }}>
                    <p style={{ margin: 0, fontSize: 13 }}>No candidates in {stage}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal title="Add Candidate" open={open} onClose={() => setOpen(false)} size="wide">
        <form className="form-grid" onSubmit={form.handleSubmit((values) => create.mutate(values))}>
          <div className="form-grid two">
            <Field label="First Name" required error={form.formState.errors.firstName?.message}>
              <Input {...form.register("firstName")} />
            </Field>
            <Field label="Last Name" required error={form.formState.errors.lastName?.message}>
              <Input {...form.register("lastName")} />
            </Field>
            <Field label="Email" required error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register("email")} />
            </Field>
            <Field label="Phone Number" error={form.formState.errors.phoneNumber?.message}>
              <Input {...form.register("phoneNumber")} />
            </Field>
            <Field label="Job Application (Role)" required error={form.formState.errors.jobApplication?.message}>
              <Select {...form.register("jobApplication")}>
                <option value="">Select job posting</option>
                {jobs.data?.filter(j => j.status === 'Open').map(job => <option key={job._id} value={job._id}>{job.title}</option>)}
              </Select>
            </Field>
            <Field label="Source" required error={form.formState.errors.source?.message}>
              <Select {...form.register("source")}>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Indeed">Indeed</option>
                <option value="Referral">Referral</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Other">Other</option>
              </Select>
            </Field>
            
            <Field label="Referral Name (Optional)" error={form.formState.errors.referral?.message}>
              <Input {...form.register("referral")} />
            </Field>
            <Field label="Location" required error={form.formState.errors.location?.message}>
              <Input {...form.register("location")} />
            </Field>
            
            <Field label="LinkedIn Profile" required error={form.formState.errors.linkedInProfile?.message}>
              <Input {...form.register("linkedInProfile")} placeholder="https://linkedin.com/in/..." />
            </Field>
            <Field label="Portfolio URL" error={form.formState.errors.portfolio?.message}>
              <Input {...form.register("portfolio")} placeholder="https://github.com/..." />
            </Field>

            <Field label="Experience (Years)" required error={form.formState.errors.experience?.message}>
              <Input type="number" step="0.5" {...form.register("experience")} />
            </Field>
            <Field label="Education" required error={form.formState.errors.education?.message}>
              <Input {...form.register("education")} placeholder="e.g. B.Tech Computer Science" />
            </Field>
            
            <Field label="Current Salary" required error={form.formState.errors.currentSalary?.message}>
              <Input type="number" {...form.register("currentSalary")} />
            </Field>
            <Field label="Expected Salary" required error={form.formState.errors.expectedSalary?.message}>
              <Input type="number" {...form.register("expectedSalary")} />
            </Field>
            
            <Field label="Notice Period" required error={form.formState.errors.noticePeriod?.message}>
              <Input {...form.register("noticePeriod")} placeholder="e.g. 30 days" />
            </Field>
            <Field label="Skills (comma separated)" required error={form.formState.errors.skills?.message}>
              <Input {...form.register("skills")} placeholder="React, Node.js, TypeScript" />
            </Field>

            <Field label="Tags (comma separated)" error={form.formState.errors.tags?.message}>
              <Input {...form.register("tags")} placeholder="Urgent, Frontend" />
            </Field>
            <Field label="Resume / CV" error={form.formState.errors.resume?.message as string}>
              <Input type="file" {...form.register("resume")} accept=".pdf,.doc,.docx" />
            </Field>
            
            <Field label="Rating (1-5)" error={form.formState.errors.rating?.message}>
              <Input type="number" min="1" max="5" {...form.register("rating")} />
            </Field>
            <Field label="Resume Score (0-100)" error={form.formState.errors.resumeScore?.message}>
              <Input type="number" min="0" max="100" {...form.register("resumeScore")} />
            </Field>
          </div>
          
          <div className="form-actions" style={{ marginTop: 24 }}>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={create.isPending}>Add Candidate</Button>
          </div>
        </form>
      </Modal>

      <CandidateDetailDrawer candidateId={selectedCandidate} onClose={() => setSelectedCandidate(null)} />
    </>
  );
}
