// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { travelApi, employeeApi } from "../../api/hrm-api";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { SkeletonCard } from "../../components/ui/skeleton";
import { Tabs } from "../../components/ui/tabs";




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
        {activeTab === "requests" && (<div>
          <RequestsTab />
        </div>)}
        {activeTab === "expenses" && (<div>
          <ExpensesTab />
        </div>)}
        {activeTab === "policies" && (<div>
          <PoliciesTab />
        </div>)}
      </div>
    </div>
  );
}

// --- REQUESTS TAB ---
function RequestsTab() {
  const queryClient = useQueryClient();
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["travel-requests"],
    queryFn: () => travelApi.getRequests().then(res => res || [])
  });

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
                  <p className="text-sm text-gray-500">Employee: {r.employee?.name || r.employee?.email}</p>
                  <p className="text-sm text-gray-500">Purpose: {r.purpose}</p>
                  <p className="text-sm text-gray-500">Dates: {new Date(r.departureDate).toLocaleDateString()} - {new Date(r.returnDate).toLocaleDateString()}</p>
                  {!r.travelPolicyMatched && <p className="text-xs text-red-600 mt-1 font-semibold">Policy Violation: {r.policyReason}</p>}
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className="text-xl font-bold text-slate-700">Est. ${r.estimatedCost.toFixed(2)}</span>
                  <StatusBadge status={r.status} />
                  {r.status === 'Submitted' && (
                    <div className="flex space-x-2 mt-2">
                      <Button size="sm" variant="secondary" className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => travelApi.updateRequestStatus(r._id || r.id, { status: "Approved" }).then(() => queryClient.invalidateQueries({ queryKey: ["travel-requests"] }))}
                      >Approve</Button>
                      <Button size="sm" variant="secondary" className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => travelApi.updateRequestStatus(r._id || r.id, { status: "Rejected" }).then(() => queryClient.invalidateQueries({ queryKey: ["travel-requests"] }))}
                      >Reject</Button>
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

  const mutation = useMutation({
    mutationFn: travelApi.createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["travel-requests"] });
      setOpen(false);
    }
  });

  return (
    <>
      <div onClick={() => setOpen(true)} className="inline-block">
        <Button>Submit Request</Button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative"><button onClick={() => setOpen(false)} className="absolute top-2 right-2 border rounded px-2">X</button>
        <div className="mb-4"><h2 className="text-xl font-bold">New Travel Request</h2></div>
        <div className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium">Destination</label>
            <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={destination} onChange={(e: any) => setDestination(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Purpose</label>
            <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={purpose} onChange={(e: any) => setPurpose(e.target.value)} />
          </div>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Travel Type</label>
              <select className="w-full border p-2 rounded-md" value={travelType} onChange={(e: any) => setTravelType(e.target.value)}>
                <option value="Domestic">Domestic</option>
                <option value="International">International</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Transport</label>
              <select className="w-full border p-2 rounded-md" value={modeOfTransport} onChange={(e: any) => setModeOfTransport(e.target.value)}>
                <option>Air</option>
                <option>Train</option>
                <option>Bus</option>
                <option>Car</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Departure</label>
              <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" type="date" value={departureDate} onChange={(e: any) => setDepartureDate(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Return</label>
              <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" type="date" value={returnDate} onChange={(e: any) => setReturnDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Estimated Cost ($)</label>
            <input className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" type="number" value={estimatedCost} onChange={(e: any) => setEstimatedCost(e.target.value)} />
          </div>
          <Button onClick={() => mutation.mutate({ destination, purpose, travelType, departureDate, returnDate, modeOfTransport, estimatedCost: Number(estimatedCost) })} disabled={mutation.isPending}>
            Submit Request
          </Button>
        </div>
      </div>
        </div>
      )}
    </>
  );
}

// --- EXPENSES TAB ---
function ExpensesTab() {
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["travel-expenses"],
    queryFn: () => travelApi.getExpenses().then(res => res || [])
  });

  return (
    <Card>
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Travel Expenses</h3>
        <Button variant="secondary">Log Expense</Button>
      </div>
      <div className="p-4">
        {isLoading ? <DashboardCardSkeletons count={4} /> : (
          <div className="grid gap-4 md:grid-cols-2">
            {expenses.map((e: any) => (
              <div key={e._id || e.id} className="p-4 border rounded-lg bg-orange-50 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-600">{e.category}</span>
                  <span className="text-lg font-bold text-orange-800">${e.amount.toFixed(2)}</span>
                </div>
                <p className="text-sm font-medium mb-1">Employee: {e.employee?.email}</p>
                <p className="text-sm text-gray-700">Date: {new Date(e.expenseDate).toLocaleDateString()}</p>
                <div className="mt-2">
                  <StatusBadge status={e.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// --- POLICIES TAB ---
function PoliciesTab() {
  const { data: policies = [], isLoading } = useQuery({
    queryKey: ["travel-policies"],
    queryFn: () => travelApi.getPolicies().then(res => res || [])
  });

  return (
    <Card>
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Organization Travel Policies</h3>
        <Button>New Policy</Button>
      </div>
      <div className="p-4">
        {isLoading ? <DashboardCardSkeletons count={4} /> : (
          <div className="space-y-4">
            {policies.map((p: any) => (
              <div key={p._id || p.id} className="p-4 border-l-4 border-slate-700 bg-slate-50 rounded-r-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900">{p.policyName}</h3>
                    <p className="text-sm font-medium text-slate-700">Applicable To: {p.applicableTo}</p>
                    <p className="text-sm text-slate-600 mt-2">Max Budget: <span className="font-bold">${p.maxBudget}</span></p>
                    <p className="text-sm text-slate-600">Intl. Approval Required: {p.internationalApprovalRequired ? 'Yes' : 'No'}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
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
