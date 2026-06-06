// @ts-nocheck
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, Copy, Edit, MapPin, Plus, Trash2 } from "lucide-react";
import { departmentApi, positionApi, recruitmentApi } from "../../api/hrm-api";
import { JobPosting } from "../../api/types";
import { getErrorMessage } from "../../api/http";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, KpiCard } from "../../components/ui/card";
import { Field, Input, Select, Textarea } from "../../components/ui/field";
import { Modal } from "../../components/ui/modal";
import { DataTable } from "../../components/ui/table";
import { useToast } from "../../components/ui/toast";

const jobPostingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  department: z.string().min(1, "Department is required"),
  position: z.string().min(1, "Position is required"),
  location: z.string().min(1, "Location is required"),
  employmentType: z.enum(["Full-Time", "Part-Time", "Contract", "Internship"]),
  openingCount: z.coerce.number().min(1),
  salaryRange: z.object({
    min: z.coerce.number().optional(),
    max: z.coerce.number().optional(),
    currency: z.string().optional()
  }).optional(),
  isPublished: z.boolean().optional(),
  status: z.enum(["Open", "Closed", "Filled", "Draft"]).optional(),
  closingDate: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  qualifications: z.string().min(1, "Qualifications are required"),
  responsibilities: z.string().min(1, "Responsibilities are required"),
  tags: z.string().optional()
});

type JobPostingFormValues = z.infer<typeof jobPostingSchema>;

export function JobPostingsPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<JobPosting | null>(null);
  const form = useForm<JobPostingFormValues>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: {
      employmentType: "Full-Time",
      openingCount: 1,
      status: "Open",
      isPublished: true,
      salaryRange: { currency: "INR" }
    }
  });
  const queryClient = useQueryClient();
  const { notify } = useToast();
  
  const jobs = useQuery({ queryKey: ["jobs"], queryFn: recruitmentApi.listJobs });
  const departments = useQuery({ queryKey: ["departments"], queryFn: departmentApi.list });
  const positions = useQuery({ queryKey: ["positions"], queryFn: positionApi.list });

  const save = useMutation({
    mutationFn: (values: JobPostingFormValues) => {
      const payload: Partial<JobPosting> = {
        ...values,
        qualifications: values.qualifications.split("\n").map(q => q.trim()).filter(Boolean),
        responsibilities: values.responsibilities.split("\n").map(r => r.trim()).filter(Boolean),
        tags: values.tags?.split(",").map(t => t.trim()).filter(Boolean) || [],
      } as any;
      return editing ? recruitmentApi.updateJob(editing._id, payload) : recruitmentApi.createJob(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setOpen(false);
      setEditing(null);
      notify("Job posting saved", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const remove = useMutation({
    mutationFn: recruitmentApi.removeJob,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["jobs"] });
      notify("Job posting archived", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  function openForm(job?: JobPosting) {
    setEditing(job || null);
    if (job) {
      form.reset({
        title: job.title || "",
        department: typeof job.department === "object" ? job.department._id : (job.department || (typeof job.departmentId === "object" ? job.departmentId._id : job.departmentId) || ""),
        position: typeof job.position === "object" ? job.position._id : job.position || "",
        location: job.location || "",
        employmentType: job.employmentType || "Full-Time",
        openingCount: job.openingCount || 1,
        salaryRange: {
          min: job.salaryRange?.min || undefined,
          max: job.salaryRange?.max || undefined,
          currency: job.salaryRange?.currency || "INR"
        },
        isPublished: job.isPublished ?? true,
        status: job.status || "Open",
        closingDate: job.closingDate ? new Date(job.closingDate).toISOString().slice(0, 10) : "",
        description: job.description || "",
        qualifications: job.qualifications?.join("\n") || "",
        responsibilities: job.responsibilities?.join("\n") || "",
        tags: job.tags?.join(", ") || ""
      });
    } else {
      form.reset({
        employmentType: "Full-Time",
        openingCount: 1,
        status: "Open",
        isPublished: true,
        salaryRange: { currency: "INR" }
      });
    }
    setOpen(true);
  }

  const openCount = jobs.data?.filter(j => j.status === "Open").length ?? 0;
  const closedCount = jobs.data?.filter(j => j.status === "Closed" || j.status === "Filled").length ?? 0;
  const draftCount = jobs.data?.filter(j => j.status === "Draft" || !j.isPublished).length ?? 0;

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Job Postings</h1>
          <p>Manage open positions, requirements, and hiring pipeline.</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => openForm()}>Create Job Posting</Button>
      </div>

      <section className="kpi-grid">
        <KpiCard icon={<Briefcase size={20} />} iconColor="purple" label="Total Jobs" value={jobs.data?.length ?? 0} />
        <KpiCard icon={<Briefcase size={20} />} iconColor="green" label="Open / Published" value={openCount} />
        <KpiCard icon={<Briefcase size={20} />} iconColor="amber" label="Draft / Unpublished" value={draftCount} />
        <KpiCard icon={<Briefcase size={20} />} iconColor="blue" label="Closed / Filled" value={closedCount} />
      </section>

      <Card>
        <DataTable
          columns={["Job Title", "Department", "Location", "Type", "Openings", "Status", "Actions"]}
          empty={!jobs.data?.length}
          loading={jobs.isLoading}
        >
          {jobs.data?.map((job) => (
            <tr key={job._id}>
              <td><strong>{job.title}</strong></td>
              <td>{typeof job.department === "object" ? job.department.name : (typeof job.departmentId === "object" ? job.departmentId.name : "-")}</td>
              <td>
                <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-muted)" }}>
                  <MapPin size={13} /> {job.location || "-"}
                </span>
              </td>
              <td><Badge tone="neutral">{job.employmentType}</Badge></td>
              <td style={{ color: "var(--text-muted)" }}>{job.openingCount}</td>
              <td>
                <div style={{ display: "flex", gap: 4 }}>
                   <Badge tone={job.status === "Open" ? "green" : job.status === "Closed" ? "red" : "yellow"} dot>{job.status}</Badge>
                   {job.isPublished && <Badge tone="blue">Published</Badge>}
                </div>
              </td>
              <td>
                <div className="toolbar">
                  <Button variant="ghost" size="sm" iconOnly icon={<Edit size={15} />} onClick={() => openForm(job)} aria-label="Edit" />
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    icon={<Copy size={15} />}
                    onClick={() => {
                      if (window.confirm("Duplicate this job posting?")) {
                        recruitmentApi.duplicateJob(job._id).then(() => {
                          queryClient.invalidateQueries({ queryKey: ["jobs"] });
                          notify("Job duplicated", "success");
                        }).catch(err => notify(getErrorMessage(err), "error"));
                      }
                    }}
                    aria-label="Duplicate"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    icon={<Trash2 size={15} />}
                    onClick={() => window.confirm("Archive this job posting?") && remove.mutate(job._id)}
                    aria-label="Archive"
                  />
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Card>

      <Modal title={editing ? "Edit Job Posting" : "Create Job Posting"} open={open} onClose={() => setOpen(false)} size="wide">
        <form className="form-grid" onSubmit={form.handleSubmit((values) => save.mutate(values))}>
          <div className="form-grid two">
            <Field label="Job Title" required error={form.formState.errors.title?.message}>
              <Input {...form.register("title")} />
            </Field>
            <Field label="Department" required error={form.formState.errors.department?.message}>
              <Select {...form.register("department")}>
                <option value="">Select department</option>
                {departments.data?.map((dept) => <option key={dept._id} value={dept._id}>{dept.name}</option>)}
              </Select>
            </Field>
            <Field label="Position" required error={form.formState.errors.position?.message}>
              <Select {...form.register("position")}>
                <option value="">Select position</option>
                {positions.data?.map((pos) => <option key={pos._id} value={pos._id}>{pos.title}</option>)}
              </Select>
            </Field>
            <Field label="Location" required error={form.formState.errors.location?.message}>
              <Input {...form.register("location")} placeholder="e.g. Remote, New York HQ" />
            </Field>
            <Field label="Employment Type" required error={form.formState.errors.employmentType?.message}>
              <Select {...form.register("employmentType")}>
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </Select>
            </Field>
            <Field label="Opening Count" required error={form.formState.errors.openingCount?.message}>
              <Input type="number" {...form.register("openingCount")} />
            </Field>
            <Field label="Status" error={form.formState.errors.status?.message}>
              <Select {...form.register("status")}>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
                <option value="Filled">Filled</option>
                <option value="Draft">Draft</option>
              </Select>
            </Field>
            <Field label="Closing Date">
              <Input type="date" {...form.register("closingDate")} />
            </Field>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', gridColumn: '1 / -1' }}>
                <Field label="Min Salary" error={form.formState.errors.salaryRange?.min?.message}>
                  <Input type="number" {...form.register("salaryRange.min")} />
                </Field>
                <Field label="Max Salary" error={form.formState.errors.salaryRange?.max?.message}>
                  <Input type="number" {...form.register("salaryRange.max")} />
                </Field>
                <Field label="Currency" error={form.formState.errors.salaryRange?.currency?.message}>
                  <Input {...form.register("salaryRange.currency")} />
                </Field>
            </div>
            
            <Field label="Tags (comma separated)" error={form.formState.errors.tags?.message}>
              <Input {...form.register("tags")} placeholder="React, Remote, Senior" />
            </Field>
            
            <Field label="Publish Status">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input type="checkbox" {...form.register("isPublished")} />
                Publish this job opening immediately
              </label>
            </Field>
          </div>
          
          <Field label="Job Description" required error={form.formState.errors.description?.message}>
            <Textarea {...form.register("description")} rows={4} placeholder="Describe the role..." />
          </Field>
          <Field label="Qualifications (One per line)" required error={form.formState.errors.qualifications?.message}>
            <Textarea {...form.register("qualifications")} rows={4} placeholder="- 5+ years experience&#10;- B.S. in Computer Science" />
          </Field>
          <Field label="Responsibilities (One per line)" required error={form.formState.errors.responsibilities?.message}>
            <Textarea {...form.register("responsibilities")} rows={4} placeholder="- Lead the frontend team&#10;- Architect the core platform" />
          </Field>
          
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={save.isPending}>Save Job Posting</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
