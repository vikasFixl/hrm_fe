import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Employee } from "../../api/types";
import { Button } from "../../components/ui/button";
import { Field, Input, Textarea } from "../../components/ui/field";

const schema = z.object({
  reason: z.string().min(1, "Reason is required"),
  lastWorkingDay: z.string().min(1, "Last working day is required")
});

export type OffboardingFormValues = z.infer<typeof schema>;

export function OffboardingForm({
  employee,
  onSubmit,
  onCancel
}: {
  employee: Employee;
  onSubmit: (values: OffboardingFormValues) => void;
  onCancel: () => void;
}) {
  const form = useForm<OffboardingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      reason: "",
      lastWorkingDay: new Date().toISOString().slice(0, 10)
    }
  });

  return (
    <form className="form-grid" onSubmit={form.handleSubmit(onSubmit)}>
      <p className="muted" style={{ gridColumn: "1 / -1" }}>
        You are about to terminate the employment of <strong>{employee.firstName} {employee.lastName}</strong>. This action will change their status to <strong>Exited</strong>.
      </p>
      <div className="form-grid">
        <Field label="Last working day" error={form.formState.errors.lastWorkingDay?.message}>
          <Input type="date" {...form.register("lastWorkingDay")} />
        </Field>
        <Field label="Reason for termination" error={form.formState.errors.reason?.message}>
          <Textarea {...form.register("reason")} rows={4} placeholder="Provide a brief reason for offboarding..." />
        </Field>
      </div>
      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="danger">Terminate Employee</Button>
      </div>
    </form>
  );
}
