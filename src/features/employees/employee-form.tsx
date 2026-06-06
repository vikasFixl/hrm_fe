import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Department, Employee, Position } from "../../api/types";
import { Button } from "../../components/ui/button";
import { Field, Input, Select } from "../../components/ui/field";

const schema = z.object({
  employeeCode: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  workEmail: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  reportingManagerId: z.string().optional(),
  joinDate: z.string().min(1),
  employmentType: z.enum(["Permanent", "Contract", "Intern"]).optional(),
  workLocation: z.enum(["Onsite", "Remote", "Hybrid"]).optional(),
  role: z.enum(["Employee", "Manager", "Admin"]).optional(),
  status: z.enum(["Active", "Suspended", "Exited"]).optional(),
  salaryCtc: z.coerce.number().optional(),
  salaryCurrency: z.string().optional(),
  bankName: z.string().optional(),
  accountHolder: z.string().optional(),
  accountNumber: z.string().optional(),
  ifsc: z.string().optional(),
  kycStatus: z.enum(["Pending", "Verified"]).optional()
});

export type EmployeeFormValues = z.infer<typeof schema>;

function getId(value?: string | { _id: string }) {
  return typeof value === "object" ? value._id : value || "";
}

export function employeePayload(values: EmployeeFormValues): Partial<Employee> {
  return {
    employeeCode: values.employeeCode,
    firstName: values.firstName,
    lastName: values.lastName,
    workEmail: values.workEmail,
    phone: values.phone,
    departmentId: values.departmentId,
    positionId: values.positionId,
    reportingManagerId: values.reportingManagerId,
    joinDate: values.joinDate,
    employmentType: values.employmentType,
    workLocation: values.workLocation,
    role: values.role,
    status: values.status,
    salary: { ctc: values.salaryCtc, currency: values.salaryCurrency || "INR" },
    bankDetails: {
      bankName: values.bankName,
      accountHolder: values.accountHolder,
      accountNumber: values.accountNumber,
      ifsc: values.ifsc
    },
    kycStatus: values.kycStatus
  };
}

export function EmployeeForm({
  employee,
  employees,
  departments,
  positions,
  onSubmit,
  onCancel
}: {
  employee?: Employee;
  employees: Employee[];
  departments: Department[];
  positions: Position[];
  onSubmit: (values: EmployeeFormValues) => void;
  onCancel: () => void;
}) {
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeCode: "",
      firstName: "",
      joinDate: new Date().toISOString().slice(0, 10),
      employmentType: "Permanent",
      workLocation: "Onsite",
      role: "Employee",
      status: "Active",
      salaryCurrency: "INR",
      kycStatus: "Pending"
    }
  });

  useEffect(() => {
    if (!employee) return;
    form.reset({
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName || "",
      workEmail: employee.workEmail || "",
      phone: employee.phone || "",
      departmentId: getId(employee.departmentId),
      positionId: getId(employee.positionId),
      reportingManagerId: getId(employee.reportingManagerId),
      joinDate: employee.joinDate?.slice(0, 10) || "",
      employmentType: employee.employmentType || "Permanent",
      workLocation: employee.workLocation || "Onsite",
      role: employee.role || "Employee",
      status: employee.status || "Active",
      salaryCtc: employee.salary?.ctc,
      salaryCurrency: employee.salary?.currency || "INR",
      bankName: employee.bankDetails?.bankName || "",
      accountHolder: employee.bankDetails?.accountHolder || "",
      accountNumber: employee.bankDetails?.accountNumber || "",
      ifsc: employee.bankDetails?.ifsc || "",
      kycStatus: employee.kycStatus || "Pending"
    });
  }, [employee, form]);

  return (
    <form className="form-grid" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="form-grid two">
        <Field label="Employee code" error={form.formState.errors.employeeCode?.message}>
          <Input {...form.register("employeeCode")} disabled={Boolean(employee)} />
        </Field>
        <Field label="First name" error={form.formState.errors.firstName?.message}>
          <Input {...form.register("firstName")} />
        </Field>
        <Field label="Last name">
          <Input {...form.register("lastName")} />
        </Field>
        <Field label="Work email" error={form.formState.errors.workEmail?.message}>
          <Input type="email" {...form.register("workEmail")} />
        </Field>
        <Field label="Phone">
          <Input {...form.register("phone")} />
        </Field>
        <Field label="Join date" error={form.formState.errors.joinDate?.message}>
          <Input type="date" {...form.register("joinDate")} />
        </Field>
        <Field label="Department">
          <Select {...form.register("departmentId")}>
            <option value="">Select department</option>
            {departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}
          </Select>
        </Field>
        <Field label="Position">
          <Select {...form.register("positionId")}>
            <option value="">Select position</option>
            {positions.map((position) => <option key={position._id} value={position._id}>{position.title}</option>)}
          </Select>
        </Field>
        <Field label="Reporting manager">
          <Select {...form.register("reportingManagerId")}>
            <option value="">Select manager</option>
            {employees.map((item) => <option key={item._id} value={item._id}>{item.firstName} {item.lastName}</option>)}
          </Select>
        </Field>
        <Field label="Employment type">
          <Select {...form.register("employmentType")}>
            <option>Permanent</option>
            <option>Contract</option>
            <option>Intern</option>
          </Select>
        </Field>
        <Field label="Work location">
          <Select {...form.register("workLocation")}>
            <option>Onsite</option>
            <option>Remote</option>
            <option>Hybrid</option>
          </Select>
        </Field>
        <Field label="Role">
          <Select {...form.register("role")}>
            <option>Employee</option>
            <option>Manager</option>
            <option>Admin</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select {...form.register("status")}>
            <option>Active</option>
            <option>Suspended</option>
            <option>Exited</option>
          </Select>
        </Field>
        <Field label="KYC status">
          <Select {...form.register("kycStatus")}>
            <option>Pending</option>
            <option>Verified</option>
          </Select>
        </Field>
        <Field label="CTC">
          <Input type="number" {...form.register("salaryCtc")} />
        </Field>
        <Field label="Currency">
          <Input {...form.register("salaryCurrency")} />
        </Field>
        <Field label="Account holder">
          <Input {...form.register("accountHolder")} />
        </Field>
        <Field label="Bank name">
          <Input {...form.register("bankName")} />
        </Field>
        <Field label="Account number">
          <Input {...form.register("accountNumber")} />
        </Field>
        <Field label="IFSC">
          <Input {...form.register("ifsc")} />
        </Field>
      </div>
      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{employee ? "Update employee" : "Create employee"}</Button>
      </div>
    </form>
  );
}
