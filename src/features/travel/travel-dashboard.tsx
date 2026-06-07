// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { travelApi } from "../../api/hrm-api";
import { getErrorMessage } from "../../api/http";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { SkeletonCard } from "../../components/ui/skeleton";
import { Tabs } from "../../components/ui/tabs";
import { Modal } from "../../components/ui/modal";
import { Field, Input, Select, Textarea } from "../../components/ui/field";
import { useToast } from "../../components/ui/toast";
import { formatAmount, formatEmployeeName } from "../../lib/hrm-display";

export function TravelDashboard() {
  const [activeTab, setActiveTab] = useState("requests");

  return (
    <div className="performance-page page-fade">
      <div className="page-title">
        <div>
          <h1>Travel Management</h1>
          <p>Manage travel requests, expenses and company travel policies.</p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        tabs={[
          { value: "requests", label: "Travel Requests" },
          { value: "expenses", label: "Travel Expenses" },
          { value: "policies", label: "Travel Policies" }
        ]}
        onChange={setActiveTab}
      />

      <div className="tab-panel">
        {activeTab === "requests" && <RequestsTab />}
        {activeTab === "expenses" && <ExpensesTab />}
        {activeTab === "policies" && <PoliciesTab />}
      </div>
    </div>
  );
}

function RequestsTab() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["travel-requests"],
    queryFn: () => travelApi.getRequests().then((res) => res || [])
  });

  const updateStatus = async (id: string, status: string) => {
    try {
      await travelApi.updateRequestStatus(id, { status });
      await queryClient.invalidateQueries({ queryKey: ["travel-requests"] });
      notify(`Travel request ${status.toLowerCase()}`, "success");
    } catch (error) {
      notify(getErrorMessage(error), "error");
    }
  };

  return (
    <Card>
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Travel Authorizations</h3>
        <CreateRequestModal />
      </div>
      <div className="p-4">
        {isLoading ? <DashboardCardSkeletons /> : (
          <div className="space-y-4">
            {requests.map((r: any) => (
              <div key={r._id || r.id} className="p-4 border rounded-lg flex justify-between items-center bg-white shadow-sm">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-lg">{r.destination}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100">{r.travelType}</span>
                  </div>
                  <p className="text-sm text-gray-500">Employee: {formatEmployeeName(r.employee)}</p>
                  <p className="text-sm text-gray-500">Purpose: {r.purpose}</p>
                  <p className="text-sm text-gray-500">Dates: {new Date(r.departureDate).toLocaleDateString()} - {new Date(r.returnDate).toLocaleDateString()}</p>
                  {!r.travelPolicyMatched && <p className="text-xs text-red-600 mt-1 font-semibold">Policy Violation: {r.policyReason}</p>}
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className="text-xl font-bold text-slate-700">Est. {formatAmount(r.estimatedCost)}</span>
                  <StatusBadge status={r.status} />
                  {r.status === "Submitted" && (
                    <div className="flex space-x-2 mt-2">
                      <Button size="sm" variant="secondary" className="text-green-600 border-green-600 hover:bg-green-50" onClick={() => updateStatus(r._id || r.id, "Approved")}>Approve</Button>
                      <Button size="sm" variant="secondary" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => updateStatus(r._id || r.id, "Rejected")}>Reject</Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {requests.length === 0 && <p className="text-gray-500">Travel requests will appear here once submitted.</p>}
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
  if (status === "Submitted" || status === "PendingApproval") color = "bg-yellow-100 text-yellow-800";
  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>{status}</span>;
}

function CreateRequestModal() {
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [purpose, setPurpose] = useState("");
  const [travelType, setTravelType] = useState("Domestic");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [modeOfTransport, setModeOfTransport] = useState("Air");
  const [estimatedCost, setEstimatedCost] = useState("");
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const reset = () => {
    setDestination("");
    setPurpose("");
    setTravelType("Domestic");
    setDepartureDate("");
    setReturnDate("");
    setModeOfTransport("Air");
    setEstimatedCost("");
  };

  const mutation = useMutation({
    mutationFn: travelApi.createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["travel-requests"] });
      setOpen(false);
      reset();
      notify("Travel request submitted", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>Submit Request</Button>
      <Modal title="New Travel Request" open={open} onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate({
            destination,
            purpose,
            travelType,
            departureDate,
            returnDate,
            modeOfTransport,
            estimatedCost: Number(estimatedCost) || 0
          });
        }}>
          <Field label="Destination" required><Input value={destination} onChange={(e) => setDestination(e.target.value)} required /></Field>
          <Field label="Purpose" required><Input value={purpose} onChange={(e) => setPurpose(e.target.value)} required /></Field>
          <div className="form-row">
            <Field label="Travel Type" required>
              <Select value={travelType} onChange={(e) => setTravelType(e.target.value)}>
                <option value="Domestic">Domestic</option>
                <option value="International">International</option>
              </Select>
            </Field>
            <Field label="Transport" required>
              <Select value={modeOfTransport} onChange={(e) => setModeOfTransport(e.target.value)}>
                <option value="Air">Air</option>
                <option value="Train">Train</option>
                <option value="Bus">Bus</option>
                <option value="Car">Car</option>
                <option value="Other">Other</option>
              </Select>
            </Field>
          </div>
          <div className="form-row">
            <Field label="Departure" required><Input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} required /></Field>
            <Field label="Return" required><Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} required /></Field>
          </div>
          <Field label="Estimated Cost ($)"><Input type="number" min="0" step="0.01" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} /></Field>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending} disabled={!destination || !purpose || !departureDate || !returnDate}>Submit Request</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function ExpensesTab() {
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["travel-expenses"],
    queryFn: () => travelApi.getExpenses().then((res) => res || [])
  });

  return (
    <Card>
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Travel Expenses</h3>
        <CreateTravelExpenseModal />
      </div>
      <div className="p-4">
        {isLoading ? <DashboardCardSkeletons count={4} /> : (
          <div className="grid gap-4 md:grid-cols-2">
            {expenses.map((e: any) => (
              <div key={e._id || e.id} className="p-4 border rounded-lg bg-orange-50 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-600">{e.category}</span>
                  <span className="text-lg font-bold text-orange-800">{formatAmount(e.amount)}</span>
                </div>
                <p className="text-sm font-medium mb-1">Employee: {formatEmployeeName(e.employee)}</p>
                <p className="text-sm text-gray-700">Trip: {e.travelRequest?.destination || "—"}</p>
                <p className="text-sm text-gray-700">Date: {new Date(e.expenseDate).toLocaleDateString()}</p>
                {e.description && <p className="text-sm text-gray-600 mt-1">{e.description}</p>}
                <div className="mt-2"><StatusBadge status={e.status} /></div>
              </div>
            ))}
            {expenses.length === 0 && <p className="text-gray-500">Travel expenses will appear here once logged.</p>}
          </div>
        )}
      </div>
    </Card>
  );
}

function CreateTravelExpenseModal() {
  const [open, setOpen] = useState(false);
  const [travelRequest, setTravelRequest] = useState("");
  const [category, setCategory] = useState("Hotel");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const { data: requests = [] } = useQuery({
    queryKey: ["travel-requests"],
    queryFn: () => travelApi.getRequests().then((res) => res || []),
    enabled: open
  });

  const reset = () => {
    setTravelRequest("");
    setCategory("Hotel");
    setAmount("");
    setExpenseDate("");
    setDescription("");
  };

  const mutation = useMutation({
    mutationFn: travelApi.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["travel-expenses"] });
      setOpen(false);
      reset();
      notify("Travel expense logged", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Log Expense</Button>
      <Modal title="Log Travel Expense" open={open} onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate({
            travelRequest,
            category,
            amount: Number(amount),
            expenseDate,
            description: description || undefined
          });
        }}>
          <Field label="Travel Request" required>
            <Select value={travelRequest} onChange={(e) => setTravelRequest(e.target.value)} required>
              <option value="">Select a travel request</option>
              {requests.map((r: any) => (
                <option key={r._id || r.id} value={r._id || r.id}>
                  {r.destination} ({new Date(r.departureDate).toLocaleDateString()})
                </option>
              ))}
            </Select>
          </Field>
          <div className="form-row">
            <Field label="Category" required>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Hotel">Hotel</option>
                <option value="Meal">Meal</option>
                <option value="Transport">Transport</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </Select>
            </Field>
            <Field label="Amount" required><Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></Field>
          </div>
          <Field label="Expense Date" required><Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required /></Field>
          <Field label="Description"><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending} disabled={!travelRequest || !amount || !expenseDate}>Log Expense</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function PoliciesTab() {
  const { data: policies = [], isLoading } = useQuery({
    queryKey: ["travel-policies"],
    queryFn: () => travelApi.getPolicies().then((res) => res || [])
  });

  return (
    <Card>
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Organization Travel Policies</h3>
        <CreatePolicyModal />
      </div>
      <div className="p-4">
        {isLoading ? <DashboardCardSkeletons count={4} /> : (
          <div className="space-y-4">
            {policies.map((p: any) => (
              <div key={p._id || p.id} className="p-4 border-l-4 border-slate-700 bg-slate-50 rounded-r-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900">{p.policyName}</h3>
                    <p className="text-sm font-medium text-slate-700">Applicable To: {p.applicableTo || "All"}</p>
                    <p className="text-sm text-slate-600 mt-2">Max Budget: <span className="font-bold">{formatAmount(p.maxBudget)}</span></p>
                    <p className="text-sm text-slate-600">Intl. Approval Required: {p.internationalApprovalRequired ? "Yes" : "No"}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                </div>
              </div>
            ))}
            {policies.length === 0 && <p className="text-gray-500">Travel policies will appear here once created.</p>}
          </div>
        )}
      </div>
    </Card>
  );
}

function CreatePolicyModal() {
  const [open, setOpen] = useState(false);
  const [policyName, setPolicyName] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [applicableTo, setApplicableTo] = useState("All Employees");
  const [internationalApprovalRequired, setInternationalApprovalRequired] = useState(false);
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const reset = () => {
    setPolicyName("");
    setMaxBudget("");
    setApplicableTo("All Employees");
    setInternationalApprovalRequired(false);
  };

  const mutation = useMutation({
    mutationFn: travelApi.createPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["travel-policies"] });
      setOpen(false);
      reset();
      notify("Travel policy created", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>New Policy</Button>
      <Modal title="New Travel Policy" open={open} onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate({
            policyName,
            maxBudget: Number(maxBudget),
            applicableTo,
            internationalApprovalRequired
          });
        }}>
          <Field label="Policy Name" required><Input value={policyName} onChange={(e) => setPolicyName(e.target.value)} required /></Field>
          <Field label="Max Budget ($)" required><Input type="number" min="0" step="0.01" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} required /></Field>
          <Field label="Applicable To"><Input value={applicableTo} onChange={(e) => setApplicableTo(e.target.value)} /></Field>
          <Field label="International approval required">
            <Select value={internationalApprovalRequired ? "yes" : "no"} onChange={(e) => setInternationalApprovalRequired(e.target.value === "yes")}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </Select>
          </Field>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending} disabled={!policyName || !maxBudget}>Create Policy</Button>
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
