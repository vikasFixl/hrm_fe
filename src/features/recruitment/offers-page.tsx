// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { recruitmentApi } from "../../api/hrm-api";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/modal";
import { Input, Select } from "../../components/ui/field";
import { AsyncSelect } from "../../components/ui/async-select";
import { useToast } from "../../components/ui/toast";
import { getErrorMessage } from "../../api/http";
import { Badge } from "../../components/ui/badge";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Offer } from "../../api/types";

const offerSchema = z.object({
  candidate: z.string().min(1, "Candidate is required"),
  jobPosting: z.string().min(1, "Job Posting is required"),
  offerDate: z.string().min(1, "Offer Date is required"),
  offerDetails: z.object({
    baseSalary: z.coerce.number().min(1, "Base salary is required"),
    bonus: z.coerce.number().optional().default(0),
    currency: z.string().default("INR"),
    payFrequency: z.enum(["Monthly", "Annually"]).default("Monthly"),
    location: z.string().optional()
  })
});

export function OffersPage() {
  const [open, setOpen] = useState(false);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [offerToAccept, setOfferToAccept] = useState<string | null>(null);
  const [acceptedDate, setAcceptedDate] = useState(new Date().toISOString().split("T")[0]);
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const { data: offers, isLoading } = useQuery({
    queryKey: ["offers"],
    queryFn: recruitmentApi.listOffers
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
    resolver: zodResolver(offerSchema),
    defaultValues: {
      candidate: "",
      jobPosting: "",
      offerDate: new Date().toISOString().split("T")[0],
      offerDetails: {
        baseSalary: 0,
        bonus: 0,
        currency: "INR",
        payFrequency: "Monthly" as const,
        location: ""
      }
    }
  });

  const createMutation = useMutation({
    mutationFn: recruitmentApi.createOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      notify("Offer generated successfully", "success");
      setOpen(false);
      reset();
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, acceptedDate }: { id: string; status: string; acceptedDate?: string }) => 
      recruitmentApi.updateOfferStatus(id, status, acceptedDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      notify("Offer status updated", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const handleConfirmAccept = () => {
    if (!offerToAccept) return;
    statusMutation.mutate(
      { id: offerToAccept, status: "Accepted", acceptedDate },
      {
        onSuccess: () => {
          setAcceptModalOpen(false);
          setOfferToAccept(null);
        }
      }
    );
  };

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "Pending": return <Badge tone="yellow"><Clock size={12} style={{marginRight:4}}/>Pending</Badge>;
      case "Accepted": return <Badge tone="green"><CheckCircle size={12} style={{marginRight:4}}/>Accepted</Badge>;
      case "Rejected": return <Badge tone="red"><XCircle size={12} style={{marginRight:4}}/>Rejected</Badge>;
      default: return <Badge tone="neutral">{status}</Badge>;
    }
  };

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Offer Management</h1>
          <p>Generate and track job offers sent to candidates.</p>
        </div>
        <div className="toolbar">
          <Button icon={<FileText size={16} />} onClick={() => setOpen(true)}>Generate Offer</Button>
        </div>
      </div>

      <div className="data-table-container" style={{ marginTop: 24, overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Job & Position</th>
              <th>Offer Details</th>
              <th>Offer Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 20 }}>Loading offers...</td></tr>
            ) : offers?.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No offers generated yet.</td></tr>
            ) : (
              offers?.map((offer) => {
                const candidate = typeof offer.candidate === 'object' ? offer.candidate : null;
                const job = typeof offer.jobPosting === 'object' ? offer.jobPosting : null;
                
                return (
                  <tr key={offer._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{candidate?.firstName} {candidate?.lastName}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{candidate?.email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{job?.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{job?.location}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{offer.offerDetails?.currency} {offer.offerDetails?.baseSalary?.toLocaleString()}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{offer.offerDetails?.payFrequency}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{new Date(offer.offerDate).toLocaleDateString()}</div>
                    </td>
                    <td>{getStatusBadge(offer.status)}</td>
                    <td>
                      {offer.status === "Pending" && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => {
                              setOfferToAccept(offer._id);
                              setAcceptedDate(new Date().toISOString().split("T")[0]);
                              setAcceptModalOpen(true);
                            }}
                            style={{ borderColor: "var(--success)", color: "var(--success)" }}
                          >
                            Accept
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => statusMutation.mutate({ id: offer._id, status: "Rejected" })}
                            style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Generate Offer"
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
                  {jobs?.filter(j => j.status === "Open").map(j => (
                    <option key={j._id} value={j._id}>{j.title}</option>
                  ))}
                </Select>
              )}
            />
          </div>

          <div className="form-group">
            <label>Offer Date</label>
            <Controller
              name="offerDate"
              control={control}
              render={({ field }) => <Input type="date" {...field} />}
            />
          </div>

          <div className="form-group">
            <label>Base Salary</label>
            <Controller
              name="offerDetails.baseSalary"
              control={control}
              render={({ field }) => <Input type="number" placeholder="e.g. 100000" {...field} />}
            />
          </div>
          
          <div className="form-group">
            <label>Bonus (Optional)</label>
            <Controller
              name="offerDetails.bonus"
              control={control}
              render={({ field }) => <Input type="number" placeholder="e.g. 10000" {...field} />}
            />
          </div>

          <div className="form-group">
            <label>Pay Frequency</label>
            <Controller
              name="offerDetails.payFrequency"
              control={control}
              render={({ field }) => (
                <Select {...field}>
                  <option value="Monthly">Monthly</option>
                  <option value="Annually">Annually</option>
                </Select>
              )}
            />
          </div>

          <div className="drawer-footer" style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Generate</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={acceptModalOpen}
        onClose={() => setAcceptModalOpen(false)}
        title="Accept Offer"
        size="normal"
      >
        <div style={{ padding: "10px 0" }}>
          <div className="form-group">
            <label>Accepted Date</label>
            <Input 
              type="date" 
              value={acceptedDate} 
              onChange={(e) => setAcceptedDate(e.target.value)} 
            />
          </div>
          <div className="drawer-footer" style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button type="button" variant="secondary" onClick={() => setAcceptModalOpen(false)}>Cancel</Button>
            <Button type="button" loading={statusMutation.isPending} onClick={handleConfirmAccept}>Confirm</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
