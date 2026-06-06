// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recruitmentApi, employeeApi } from "../../api/hrm-api";
import { getErrorMessage } from "../../api/http";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Field, Input, Select } from "../../components/ui/field";
import { Modal } from "../../components/ui/modal";
import { Card, CardBody } from "../../components/ui/card";
import { Avatar } from "../../components/ui/avatar";
import { useToast } from "../../components/ui/toast";
import { Calendar, FileText, X } from "lucide-react";
import { useForm } from "react-hook-form";

type CandidateDetailDrawerProps = {
  candidateId: string | null;
  onClose: () => void;
};

export function CandidateDetailDrawer({ candidateId, onClose }: CandidateDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<"details" | "interviews" | "offers" | "notes">("details");
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const { data: candidate } = useQuery({
    queryKey: ["candidate", candidateId],
    queryFn: () => recruitmentApi.getCandidate(candidateId!),
    enabled: !!candidateId,
  });

  const { data: interviews } = useQuery({
    queryKey: ["interviews", candidateId],
    queryFn: () => recruitmentApi.listInterviews().then(res => res.filter(i => 
      typeof i.candidate === 'object' ? i.candidate._id === candidateId : i.candidate === candidateId
    )),
    enabled: !!candidateId,
  });

  const { data: offers } = useQuery({
    queryKey: ["offers", candidateId],
    queryFn: () => recruitmentApi.getOffersByCandidate(candidateId!),
    enabled: !!candidateId,
  });

  const { data: employees } = useQuery({ queryKey: ["employees"], queryFn: employeeApi.list });
  
  const [interviewFormOpen, setInterviewFormOpen] = useState(false);
  const interviewForm = useForm<any>();

  const createInterview = useMutation({
    mutationFn: (values: any) => recruitmentApi.createInterview({
      ...values,
      candidate: candidateId!,
      jobPosting: typeof candidate?.jobApplication === "object" ? candidate.jobApplication._id : candidate?.jobApplication,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews", candidateId] });
      setInterviewFormOpen(false);
      interviewForm.reset();
      notify("Interview scheduled", "success");
    },
    onError: (err) => notify(getErrorMessage(err), "error"),
  });

  const [offerFormOpen, setOfferFormOpen] = useState(false);
  const offerForm = useForm<any>();

  const createOffer = useMutation({
    mutationFn: (values: any) => recruitmentApi.createOffer({
      candidate: candidateId!,
      jobPosting: typeof candidate?.jobApplication === "object" ? candidate.jobApplication._id : candidate?.jobApplication,
      position: values.position,
      offerDate: values.offerDate,
      offerDetails: {
        baseSalary: values.baseSalary,
        currency: values.currency,
        jobTitle: values.jobTitle,
        location: values.location
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers", candidateId] });
      setOfferFormOpen(false);
      offerForm.reset();
      notify("Offer generated", "success");
    },
    onError: (err) => notify(getErrorMessage(err), "error"),
  });

  if (!candidateId || !candidate) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 600, maxWidth: '100vw',
      background: 'var(--surface)', boxShadow: 'var(--shadow-xl)',
      zIndex: 1000, display: 'flex', flexDirection: 'column',
      animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Avatar name={`${candidate.firstName} ${candidate.lastName}`} size="lg" />
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: 20 }}>{candidate.firstName} {candidate.lastName}</h2>
            <div style={{ display: 'flex', gap: 8, alignItems: "center" }}>
              <Badge tone="blue" dot>{candidate.status}</Badge>
              <Badge tone="neutral">{typeof candidate.jobApplication === 'object' ? candidate.jobApplication.title : candidate.jobApplication}</Badge>
            </div>
          </div>
        </div>
        <Button variant="ghost" iconOnly icon={<X size={20} />} onClick={onClose} aria-label="Close" />
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 32px' }}>
        {(["details", "interviews", "offers", "notes"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '16px 0', marginRight: 24, background: 'none', border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: activeTab === tab ? 600 : 500, cursor: 'pointer', textTransform: 'capitalize',
              fontSize: 14
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ padding: 32, flex: 1, overflowY: 'auto' }}>
        {activeTab === "details" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="detail-grid">
              <div className="detail-item"><span>Email</span><strong>{candidate.email}</strong></div>
              <div className="detail-item"><span>Phone</span><strong>{candidate.phoneNumber || '-'}</strong></div>
              <div className="detail-item"><span>Location</span><strong>{candidate.location}</strong></div>
              <div className="detail-item"><span>Source</span><strong>{candidate.source}</strong></div>
              <div className="detail-item"><span>Experience</span><strong>{candidate.experience} years</strong></div>
              <div className="detail-item"><span>Current Salary</span><strong>{candidate.currentSalary}</strong></div>
              <div className="detail-item"><span>Expected Salary</span><strong>{candidate.expectedSalary}</strong></div>
              <div className="detail-item"><span>Notice Period</span><strong>{candidate.noticePeriod}</strong></div>
            </div>
            
            <div>
              <span style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>Skills</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {candidate.skills?.map(s => <Badge key={s} tone="neutral">{s}</Badge>)}
              </div>
            </div>
            
            <div>
              <span style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>LinkedIn</span>
              <div><a href={candidate.linkedInProfile} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>{candidate.linkedInProfile}</a></div>
            </div>
          </div>
        )}

        {activeTab === "interviews" && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Scheduled Interviews</h3>
              <Button icon={<Calendar size={14} />} size="sm" onClick={() => setInterviewFormOpen(true)}>Schedule</Button>
            </div>
            {interviews?.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Calendar size={24} /></div>
                <p>No interviews scheduled.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {interviews?.map(inv => (
                  <Card key={inv._id}>
                    <CardBody>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <strong style={{ fontSize: 15 }}>{new Date(inv.scheduledDate).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</strong>
                        <Badge tone={inv.status === 'Completed' ? 'green' : inv.status === 'Cancelled' ? 'red' : 'blue'} dot>{inv.status}</Badge>
                      </div>
                      <div style={{ display: "flex", gap: 24, fontSize: 14, color: "var(--text-muted)" }}>
                        <span>Type: {inv.interviewType}</span>
                        <span>Interviewer: {typeof inv.interviewer === 'object' ? inv.interviewer.firstName : inv.interviewer}</span>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "offers" && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Generated Offers</h3>
              <Button icon={<FileText size={14} />} size="sm" onClick={() => setOfferFormOpen(true)}>Create Offer</Button>
            </div>
            {offers?.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><FileText size={24} /></div>
                <p>No offers generated.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {offers?.map(offer => (
                  <Card key={offer._id}>
                    <CardBody>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <strong style={{ fontSize: 15 }}>{offer.offerDetails.jobTitle}</strong>
                        <Badge tone={offer.status === 'Accepted' ? 'green' : offer.status === 'Rejected' ? 'red' : 'yellow'} dot>{offer.status}</Badge>
                      </div>
                      <div style={{ display: "flex", gap: 24, fontSize: 14, color: "var(--text-muted)" }}>
                        <span>Base: {offer.offerDetails.baseSalary} {offer.offerDetails.currency}</span>
                        <span>Date: {new Date(offer.offerDate).toLocaleDateString("en-US", { dateStyle: "medium" })}</span>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <div className="empty-state">
            <div className="empty-state-icon"><FileText size={24} /></div>
            <h3>Notes</h3>
            <p>Notes and attachments coming soon in v2.1</p>
          </div>
        )}
      </div>

      <Modal title="Schedule Interview" open={interviewFormOpen} onClose={() => setInterviewFormOpen(false)}>
        <form className="form-grid" onSubmit={interviewForm.handleSubmit(v => createInterview.mutate(v))}>
          <Field label="Interviewer" required>
            <Select {...interviewForm.register("interviewer", { required: true })}>
              <option value="">Select interviewer</option>
              {employees?.map(emp => <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>)}
            </Select>
          </Field>
          <Field label="Date & Time" required>
            <Input type="datetime-local" {...interviewForm.register("scheduledDate", { required: true })} />
          </Field>
          <Field label="Interview Type" required>
            <Select {...interviewForm.register("interviewType", { required: true })}>
              <option value="Phone">Phone</option>
              <option value="Video">Video</option>
              <option value="In-person">In-person</option>
            </Select>
          </Field>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setInterviewFormOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createInterview.isPending}>Schedule</Button>
          </div>
        </form>
      </Modal>

      <Modal title="Create Offer" open={offerFormOpen} onClose={() => setOfferFormOpen(false)}>
        <form className="form-grid" onSubmit={offerForm.handleSubmit(v => createOffer.mutate(v))}>
          <Field label="Position ID (Reference)" required>
            <Input {...offerForm.register("position", { required: true })} placeholder="Position ID" />
          </Field>
          <Field label="Job Title" required>
            <Input {...offerForm.register("jobTitle", { required: true })} />
          </Field>
          <Field label="Offer Date" required>
            <Input type="date" {...offerForm.register("offerDate", { required: true })} />
          </Field>
          <div className="form-grid two">
            <Field label="Base Salary" required>
              <Input type="number" {...offerForm.register("baseSalary", { required: true, valueAsNumber: true })} />
            </Field>
            <Field label="Currency">
              <Input {...offerForm.register("currency")} defaultValue="INR" />
            </Field>
          </div>
          <Field label="Location" required>
             <Input {...offerForm.register("location", { required: true })} />
          </Field>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setOfferFormOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createOffer.isPending}>Generate Offer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
