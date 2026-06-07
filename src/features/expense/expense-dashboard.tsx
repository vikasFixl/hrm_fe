// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expenseApi, employeeApi } from "../../api/hrm-api";
import { getErrorMessage } from "../../api/http";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { SkeletonCard } from "../../components/ui/skeleton";
import { Tabs } from "../../components/ui/tabs";
import { Modal } from "../../components/ui/modal";
import { Field, Input, Select, Textarea } from "../../components/ui/field";
import { AsyncSelect } from "../../components/ui/async-select";
import { useToast } from "../../components/ui/toast";
import { formatAmount, formatEmployeeName } from "../../lib/hrm-display";

export function ExpenseDashboard() {
  const [activeTab, setActiveTab] = useState("submissions");

  return (
    <div className="performance-page page-fade">
      <div className="page-title">
        <div>
          <h1>Expense Management</h1>
          <p>Review employee claims, approvals and reimbursement processing.</p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        tabs={[
          { value: "submissions", label: "Expenses" },
          { value: "reimbursements", label: "Reimbursements" }
        ]}
        onChange={setActiveTab}
      />

      <div className="tab-panel">
        {activeTab === "submissions" && <ExpensesTab />}
        {activeTab === "reimbursements" && <ReimbursementsTab />}
      </div>
    </div>
  );
}

function ExpensesTab() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expense-submissions"],
    queryFn: () => expenseApi.getExpenses().then((res) => res || [])
  });

  const updateStatus = async (id: string, status: string) => {
    try {
      await expenseApi.updateExpense(id, { status });
      await queryClient.invalidateQueries({ queryKey: ["expense-submissions"] });
      notify(`Expense ${status.toLowerCase()}`, "success");
    } catch (error) {
      notify(getErrorMessage(error), "error");
    }
  };

  return (
    <Card>
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Expense Claims</h3>
        <CreateExpenseModal />
      </div>
      <div className="p-4">
        {isLoading ? <DashboardCardSkeletons /> : (
          <div className="space-y-4">
            {expenses.map((e: any) => (
              <div key={e._id || e.id} className="p-4 border rounded-lg flex justify-between items-center bg-white shadow-sm">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-lg">{e.title}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100">{e.category}</span>
                  </div>
                  <p className="text-sm text-gray-500">Employee: {formatEmployeeName(e.employee)}</p>
                  <p className="text-sm text-gray-500">Date: {new Date(e.expenseDate).toLocaleDateString()}</p>
                  {e.description && <p className="text-sm text-gray-600 mt-1">{e.description}</p>}
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className="text-xl font-bold text-green-700">{formatAmount(e.amount)}</span>
                  <StatusBadge status={e.status} />
                  {e.status === "Submitted" && (
                    <div className="flex space-x-2 mt-2">
                      <Button size="sm" variant="secondary" className="text-green-600 border-green-600 hover:bg-green-50" onClick={() => updateStatus(e._id || e.id, "Approved")}>Approve</Button>
                      <Button size="sm" variant="secondary" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => updateStatus(e._id || e.id, "Rejected")}>Reject</Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {expenses.length === 0 && <p className="text-gray-500">Expense claims will appear here once submitted.</p>}
          </div>
        )}
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  let color = "bg-gray-100 text-gray-800";
  if (status === "Approved") color = "bg-green-100 text-green-800";
  if (status === "Rejected") color = "bg-red-100 text-red-800";
  if (status === "Submitted") color = "bg-yellow-100 text-yellow-800";
  if (status === "Paid") color = "bg-blue-100 text-blue-800";
  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>{status}</span>;
}

function CreateExpenseModal() {
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Travel");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const reset = () => {
    setEmployeeId("");
    setTitle("");
    setCategory("Travel");
    setAmount("");
    setExpenseDate("");
    setDescription("");
  };

  const mutation = useMutation({
    mutationFn: expenseApi.submitExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-submissions"] });
      setOpen(false);
      reset();
      notify("Expense claim submitted", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>Submit Expense</Button>
      <Modal title="New Expense Claim" open={open} onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate({
            employee: employeeId,
            title,
            category,
            amount: Number(amount),
            expenseDate,
            description: description || undefined
          });
        }}>
          <Field label="Employee" required>
            <AsyncSelect value={employeeId} onChange={setEmployeeId} fetchOptions={employeeApi.searchEmployeesByEmail} placeholder="Search employee by email..." />
          </Field>
          <Field label="Title" required><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></Field>
          <div className="form-row">
            <Field label="Category" required>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Travel">Travel</option>
                <option value="Food">Food</option>
                <option value="Accommodation">Accommodation</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Training">Training</option>
                <option value="Other">Other</option>
              </Select>
            </Field>
            <Field label="Amount" required><Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></Field>
          </div>
          <Field label="Date" required><Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required /></Field>
          <Field label="Description"><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending} disabled={!employeeId || !title || !amount || !expenseDate}>Submit Claim</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function ReimbursementsTab() {
  const { data: reimbursements = [], isLoading } = useQuery({
    queryKey: ["expense-reimbursements"],
    queryFn: () => expenseApi.getReimbursements().then((res) => res || [])
  });

  return (
    <Card>
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Reimbursement Processing</h3>
        <CreateReimbursementModal />
      </div>
      <div className="p-4">
        {isLoading ? <DashboardCardSkeletons count={4} /> : (
          <div className="space-y-4">
            {reimbursements.map((r: any) => (
              <div key={r._id || r.id} className="p-4 border rounded-lg bg-slate-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">Reimbursement to {formatEmployeeName(r.employee)}</h3>
                    <p className="text-sm text-gray-500">Date: {new Date(r.reimbursementDate).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-500">Method: {r.paymentMethod} {r.paymentReference && `(${r.paymentReference})`}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-slate-800">{formatAmount(r.totalAmount)}</span>
                    <div className="mt-1"><StatusBadge status={r.status} /></div>
                  </div>
                </div>
              </div>
            ))}
            {reimbursements.length === 0 && <p className="text-gray-500">Reimbursements will appear here once processed.</p>}
          </div>
        )}
      </div>
    </Card>
  );
}

function CreateReimbursementModal() {
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [reimbursementDate, setReimbursementDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const reset = () => {
    setEmployeeId("");
    setTotalAmount("");
    setReimbursementDate("");
    setPaymentMethod("Bank Transfer");
    setPaymentReference("");
    setNotes("");
  };

  const mutation = useMutation({
    mutationFn: expenseApi.createReimbursement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-reimbursements"] });
      setOpen(false);
      reset();
      notify("Reimbursement processed", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>Process Reimbursement</Button>
      <Modal title="Process Reimbursement" open={open} onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate({
            employee: employeeId,
            totalAmount: Number(totalAmount),
            reimbursementDate,
            paymentMethod,
            paymentReference: paymentReference || undefined,
            notes: notes || undefined
          });
        }}>
          <Field label="Employee" required>
            <AsyncSelect value={employeeId} onChange={setEmployeeId} fetchOptions={employeeApi.searchEmployeesByEmail} placeholder="Search employee by email..." />
          </Field>
          <div className="form-row">
            <Field label="Total Amount" required><Input type="number" min="0" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required /></Field>
            <Field label="Reimbursement Date" required><Input type="date" value={reimbursementDate} onChange={(e) => setReimbursementDate(e.target.value)} required /></Field>
          </div>
          <Field label="Payment Method" required>
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Other">Other</option>
            </Select>
          </Field>
          <Field label="Payment Reference"><Input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} /></Field>
          <Field label="Notes"><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending} disabled={!employeeId || !totalAmount || !reimbursementDate}>Process</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function DashboardCardSkeletons({ count = 6 }: { count?: number }) {
  return (
    <div className="performance-grid">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} lines={4} />
      ))}
    </div>
  );
}
