// @ts-nocheck
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Check, FileText, Settings as SettingsIcon } from "lucide-react";
import { employeeApi, payrollApi } from "../../api/hrm-api";
import { SalaryConfig, Payroll } from "../../api/types";
import { getErrorMessage } from "../../api/http";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Field, Input, Select } from "../../components/ui/field";
import { Modal } from "../../components/ui/modal";
import { DataTable } from "../../components/ui/table";
import { Tabs } from "../../components/ui/tabs";
import { useToast } from "../../components/ui/toast";
import { useAuth } from "../auth/auth-context";
import { canApproveFeature, canWriteFeature } from "../auth/role-access";
import { formatDate, personName } from "../../lib/format";

type PayrollTab = "payrolls" | "configs";

type ConfigForm = {
  employee: string;
  salaryType: "Hourly" | "Monthly" | "Weekly";
  base: number;
  currency: string;
  bonusEligible: boolean;
  effectiveFrom: string;
  components: {
    key: string;
    label: string;
    type: "EARNING" | "DEDUCTION";
    mode: "AMOUNT" | "PERCENT";
    value: number;
  }[];
};

type GenerateForm = {
  employee: string;
  payrollPeriod: string;
};

export function PayrollPage() {
  const [tab, setTab] = useState<PayrollTab>("payrolls");
  const [configOpen, setConfigOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const { employee } = useAuth();
  const canManagePayroll = canWriteFeature(employee?.role, "payroll");
  const canApprovePayroll = canApproveFeature(employee?.role, "payroll");
  
  const configForm = useForm<ConfigForm>({
    defaultValues: {
      salaryType: "Monthly",
      currency: "INR",
      bonusEligible: false,
      components: []
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control: configForm.control,
    name: "components"
  });

  const generateForm = useForm<GenerateForm>();

  const employees = useQuery({ queryKey: ["employees"], queryFn: employeeApi.list });
  const configs = useQuery({ queryKey: ["payroll", "configs"], queryFn: payrollApi.configs });
  const payrolls = useQuery({ queryKey: ["payroll", "list"], queryFn: payrollApi.payrolls });

  const createConfig = useMutation({
    mutationFn: payrollApi.createConfig,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["payroll", "configs"] });
      setConfigOpen(false);
      configForm.reset();
      notify("Salary configuration created", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const generatePayroll = useMutation({
    mutationFn: payrollApi.generate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["payroll", "list"] });
      setGenerateOpen(false);
      generateForm.reset();
      notify("Payroll generated successfully", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const approvePayroll = useMutation({
    mutationFn: payrollApi.approve,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["payroll", "list"] });
      notify("Payroll approved", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Payroll Management</h1>
          <p>Configure salary structures and process monthly payroll.</p>
        </div>
        <div className="toolbar">
          {canManagePayroll && <Button variant="secondary" icon={<SettingsIcon size={16} />} onClick={() => setConfigOpen(true)}>New Config</Button>}
          {canManagePayroll && <Button icon={<Plus size={16} />} onClick={() => setGenerateOpen(true)}>Generate Payroll</Button>}
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "payrolls", label: "Payrolls (Payslips)" },
          { value: "configs", label: "Salary Configurations" }
        ]}
      />

      <Card>
        {tab === "payrolls" && (
          <DataTable columns={["Employee", "Period", "Gross Pay", "Deductions", "Net Pay", "Status", "Actions"]} empty={!payrolls.data?.length}>
            {payrolls.data?.map((payroll) => (
              <tr key={payroll._id}>
                <td>{personName(payroll.employee)}</td>
                <td>{formatDate(payroll.payrollPeriod)}</td>
                <td>{payroll.currency} {payroll.grossPay}</td>
                <td>{payroll.currency} {payroll.totalDeductions}</td>
                <td><strong>{payroll.currency} {payroll.netPay}</strong></td>
                <td>
                  <Badge tone={payroll.status === "Approved" ? "green" : payroll.status === "Paid" ? "blue" : "yellow"}>
                    {payroll.status}
                  </Badge>
                </td>
                <td>
                  <div className="toolbar">
                    {canApprovePayroll && payroll.status === "Pending" && (
                      <Button variant="ghost" icon={<Check size={15} />} onClick={() => approvePayroll.mutate(payroll._id)} aria-label="Approve" />
                    )}
                    <Button variant="ghost" icon={<FileText size={15} />} aria-label="View Payslip" />
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}

        {tab === "configs" && (
          <DataTable columns={["Employee", "Type", "Base Salary", "Effective From", "Status"]} empty={!configs.data?.length}>
            {configs.data?.map((config) => (
              <tr key={config._id}>
                <td>{personName(config.employee)}</td>
                <td>{config.salaryType}</td>
                <td>{config.currency} {config.base}</td>
                <td>{formatDate(config.effectiveFrom)}</td>
                <td><Badge tone={config.status === "Active" ? "green" : "red"}>{config.status}</Badge></td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>

      <Modal title="Create Salary Configuration" open={configOpen} onClose={() => setConfigOpen(false)} size="wide">
        <form className="form-grid" onSubmit={configForm.handleSubmit((values) => createConfig.mutate(values))}>
          <div className="form-grid two">
            <Field label="Employee">
              <Select {...configForm.register("employee", { required: true })}>
                <option value="">Select employee...</option>
                {employees.data?.map(emp => <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>)}
              </Select>
            </Field>
            <Field label="Effective From">
              <Input type="date" {...configForm.register("effectiveFrom", { required: true })} />
            </Field>
            <Field label="Base Salary">
              <Input type="number" {...configForm.register("base", { required: true, valueAsNumber: true })} />
            </Field>
            <Field label="Salary Type">
              <Select {...configForm.register("salaryType")}>
                <option>Monthly</option>
                <option>Hourly</option>
                <option>Weekly</option>
              </Select>
            </Field>
          </div>
          
          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <strong>Salary Components</strong>
              <Button type="button" variant="secondary" onClick={() => append({ key: "", label: "", type: "EARNING", mode: "AMOUNT", value: 0 })}>Add Component</Button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {fields.map((field, index) => (
                <div key={field.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
                  <Field label="Key (e.g. HRA)"><Input {...configForm.register(`components.${index}.key`, { required: true })} /></Field>
                  <Field label="Label"><Input {...configForm.register(`components.${index}.label`)} /></Field>
                  <Field label="Type">
                    <Select {...configForm.register(`components.${index}.type`)}>
                      <option value="EARNING">Earning</option>
                      <option value="DEDUCTION">Deduction</option>
                    </Select>
                  </Field>
                  <Field label="Mode">
                    <Select {...configForm.register(`components.${index}.mode`)}>
                      <option value="AMOUNT">Amount</option>
                      <option value="PERCENT">Percent</option>
                    </Select>
                  </Field>
                  <Field label="Value"><Input type="number" {...configForm.register(`components.${index}.value`, { valueAsNumber: true, required: true })} /></Field>
                  <Button type="button" variant="danger" style={{ marginBottom: '4px' }} onClick={() => remove(index)}>Remove</Button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setConfigOpen(false)}>Cancel</Button>
            <Button type="submit">Save Configuration</Button>
          </div>
        </form>
      </Modal>

      <Modal title="Generate Payroll" open={generateOpen} onClose={() => setGenerateOpen(false)}>
        <form className="form-grid" onSubmit={generateForm.handleSubmit((values) => generatePayroll.mutate(values))}>
          <Field label="Employee">
            <Select {...generateForm.register("employee", { required: true })}>
              <option value="">Select employee...</option>
              {employees.data?.map(emp => <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>)}
            </Select>
          </Field>
          <Field label="Payroll Period (e.g. 2025-03-01)">
            <Input type="date" {...generateForm.register("payrollPeriod", { required: true })} />
          </Field>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setGenerateOpen(false)}>Cancel</Button>
            <Button type="submit">Generate</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
