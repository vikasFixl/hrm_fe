// @ts-nocheck
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { wellnessApi } from "../../api/hrm-api";
import { getErrorMessage } from "../../api/http";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Modal } from "../../components/ui/modal";
import { Field, Input, Select, Textarea } from "../../components/ui/field";
import { useToast } from "../../components/ui/toast";
import { useAuth } from "../auth/auth-context";
import { canWriteFeature } from "../auth/role-access";

export function WellnessPage() {
  const { employee } = useAuth();
  const canWrite = canWriteFeature(employee?.role, "wellness");
  const [open, setOpen] = useState(false);
  const [programName, setProgramName] = useState("");
  const [programDescription, setProgramDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetAudience, setTargetAudience] = useState("All Employees");
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ["wellness"],
    queryFn: () => wellnessApi.list()
  });

  const reset = () => {
    setProgramName("");
    setProgramDescription("");
    setStartDate("");
    setEndDate("");
    setTargetAudience("All Employees");
  };

  const create = useMutation({
    mutationFn: wellnessApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["wellness"] });
      setOpen(false);
      reset();
      notify("Wellness program created", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const enroll = useMutation({
    mutationFn: wellnessApi.enroll,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["wellness"] });
      notify("Enrolled in program", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  return (
    <div className="performance-page page-fade">
      <div className="page-title">
        <div>
          <h1>Wellness</h1>
          <p>Manage wellness programs and employee enrollment.</p>
        </div>
        {canWrite && <Button onClick={() => setOpen(true)}>Create Program</Button>}
      </div>

      <Card>
        {isLoading ? <p className="p-4 text-gray-500">Loading programs...</p> : (
          <div className="p-4 space-y-4">
            {programs.map((program: any) => (
              <div key={program._id || program.id} className="p-4 border rounded-lg bg-white shadow-sm flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{program.programName}</h3>
                    <Badge tone="blue">{program.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{program.programDescription || "No description"}</p>
                  <p className="text-sm text-gray-500">Audience: {program.targetAudience}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(program.startDate).toLocaleDateString()} - {new Date(program.endDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Enrolled: {program.enrolledEmployees?.length || 0}</p>
                </div>
                {program.status === "Active" && (
                  <Button variant="secondary" size="sm" loading={enroll.isPending} onClick={() => enroll.mutate(program._id || program.id)}>
                    Enroll
                  </Button>
                )}
              </div>
            ))}
            {programs.length === 0 && <p className="text-gray-500">Wellness programs will appear here once created.</p>}
          </div>
        )}
      </Card>

      <Modal title="Create Wellness Program" open={open} onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={(event) => {
          event.preventDefault();
          create.mutate({ programName, programDescription, startDate, endDate, targetAudience });
        }}>
          <Field label="Program Name" required><Input value={programName} onChange={(e) => setProgramName(e.target.value)} required /></Field>
          <Field label="Description" required><Textarea rows={3} value={programDescription} onChange={(e) => setProgramDescription(e.target.value)} required /></Field>
          <div className="form-row">
            <Field label="Start Date" required><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></Field>
            <Field label="End Date" required><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required /></Field>
          </div>
          <Field label="Target Audience" required>
            <Select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}>
              <option value="All Employees">All Employees</option>
              <option value="Department">Department</option>
              <option value="Role">Role</option>
            </Select>
          </Field>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={create.isPending} disabled={!programName || !programDescription || !startDate || !endDate}>Create Program</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
