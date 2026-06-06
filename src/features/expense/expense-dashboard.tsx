// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expenseApi, employeeApi } from "../../api/hrm-api";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { SkeletonCard } from "../../components/ui/skeleton";
import { Tabs } from "../../components/ui/tabs";



import { AsyncSelect } from "../../components/ui/async-select";

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
        {activeTab === "submissions" && (<div>
          <ExpensesTab />
        </div>)}
        {activeTab === "reimbursements" && (<div>
          <ReimbursementsTab />
        </div>)}
      </div>
    </div>
  );
}

// --- EXPENSES TAB ---
function ExpensesTab() {
  const queryClient = useQueryClient();
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expense-submissions"],
    queryFn: () => expenseApi.getExpenses().then(res => res || [])
  });

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
                  <p className="text-sm text-gray-500">Employee: {e.employee?.name || e.employee?.email}</p>
                  <p className="text-sm text-gray-500">Date: {new Date(e.expenseDate).toLocaleDateString()}</p>
                  {e.description && <p className="text-sm text-gray-600 mt-1">{e.description}</p>}
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className="text-xl font-bold text-green-700">${e.amount.toFixed(2)}</span>
                  <StatusBadge status={e.status} />
                  {e.status === 'Submitted' && (
                    <div className="flex space-x-2 mt-2">
                      <Button size="sm" variant="secondary" className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => expenseApi.updateExpense(e._id || e.id, { status: "Approved" }).then(() => queryClient.invalidateQueries({ queryKey: ["expense-submissions"] }))}
                      >Approve</Button>
                      <Button size="sm" variant="secondary" className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => expenseApi.updateExpense(e._id || e.id, { status: "Rejected" }).then(() => queryClient.invalidateQueries({ queryKey: ["expense-submissions"] }))}
                      >Reject</Button>
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

  const mutation = useMutation({
    mutationFn: expenseApi.submitExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-submissions"] });
      setOpen(false);
    }
  });

  return (
    <>
      <div onClick={() => setOpen(true)} className="inline-block">
        <Button>Submit Expense</Button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative">
            <button onClick={() => setOpen(false)} className="absolute top-2 right-2 border rounded px-2">X</button>
            <div className="mb-4"><h2 className="text-xl font-bold">New Expense Claim</h2></div>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Employee</label>
                <input className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Search employee..." onChange={(e: any) => setEmployeeId(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Title</label>
                <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={title} onChange={(e: any) => setTitle(e.target.value)} />
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">Category</label>
                  <select className="w-full border p-2 rounded-md" value={category} onChange={(e: any) => setCategory(e.target.value)}>
                    <option>Travel</option>
                    <option>Food</option>
                    <option>Accommodation</option>
                    <option>Office Supplies</option>
                    <option>Training</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">Amount</label>
                  <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" type="number" value={amount} onChange={(e: any) => setAmount(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Date</label>
                <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" type="date" value={expenseDate} onChange={(e: any) => setExpenseDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={description} onChange={(e: any) => setDescription(e.target.value)} />
              </div>
              <Button onClick={() => mutation.mutate({ employee: employeeId, title, category, amount: Number(amount), expenseDate, description })} disabled={mutation.isPending}>
                Submit Claim
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- REIMBURSEMENTS TAB ---
function ReimbursementsTab() {
  const queryClient = useQueryClient();
  const { data: reimbursements = [], isLoading } = useQuery({
    queryKey: ["expense-reimbursements"],
    queryFn: () => expenseApi.getReimbursements().then(res => res || [])
  });

  return (
    <Card>
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Reimbursement Processing</h3>
        <Button>Process Reimbursement</Button>
      </div>
      <div className="p-4">
        {isLoading ? <DashboardCardSkeletons count={4} /> : (
          <div className="space-y-4">
            {reimbursements.map((r: any) => (
              <div key={r._id || r.id} className="p-4 border rounded-lg bg-slate-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">Reimbursement to {r.employee?.email}</h3>
                    <p className="text-sm text-gray-500">Date: {new Date(r.reimbursementDate).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-500">Method: {r.paymentMethod} {r.paymentReference && `(${r.paymentReference})`}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-slate-800">${r.totalAmount.toFixed(2)}</span>
                    <div className="mt-1">
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
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
