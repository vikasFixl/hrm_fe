// @ts-nocheck
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assetApi } from "../../api/hrm-api";
import { getErrorMessage } from "../../api/http";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Modal } from "../../components/ui/modal";
import { Field, Input, Select, Textarea } from "../../components/ui/field";
import { Tabs } from "../../components/ui/tabs";
import { useToast } from "../../components/ui/toast";
import { useAuth } from "../auth/auth-context";
import { canWriteFeature } from "../auth/role-access";

export function AssetsPage() {
  const [activeTab, setActiveTab] = useState("assets");
  const { employee } = useAuth();
  const canWrite = canWriteFeature(employee?.role, "assets");

  return (
    <div className="performance-page page-fade">
      <div className="page-title">
        <div>
          <h1>Asset Management</h1>
          <p>Track assets, assignments, returns, and employee-owned inventory.</p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        tabs={[
          { value: "assets", label: "Assets" },
          { value: "assigned", label: "Assigned To Me" }
        ]}
        onChange={setActiveTab}
      />

      <div className="tab-panel">
        {activeTab === "assets" ? <AssetsTab canWrite={canWrite} /> : <AssignedTab />}
      </div>
    </div>
  );
}

function AssetsTab({ canWrite }: { canWrite: boolean }) {
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: () => assetApi.list()
  });

  return (
    <Card>
      <div className="flex flex-row items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">Organization Assets</h3>
        {canWrite && <CreateAssetModal />}
      </div>
      {isLoading ? <p className="p-4 text-gray-500">Loading assets...</p> : (
        <div className="p-4 space-y-4">
          {assets.map((asset: any) => (
            <div key={asset._id || asset.id} className="p-4 border rounded-lg bg-white shadow-sm flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{asset.assetName}</h3>
                  <Badge tone="blue">{asset.status || "Available"}</Badge>
                </div>
                <p className="text-sm text-gray-500">Type: {asset.assetType}</p>
                <p className="text-sm text-gray-500">Serial: {asset.serialNumber}</p>
                {asset.condition && <p className="text-sm text-gray-500">Condition: {asset.condition}</p>}
                {asset.notes && <p className="text-sm text-gray-600 mt-1">{asset.notes}</p>}
              </div>
            </div>
          ))}
          {assets.length === 0 && <p className="text-gray-500">Assets will appear here once created.</p>}
        </div>
      )}
    </Card>
  );
}

function AssignedTab() {
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["assets", "assigned"],
    queryFn: () => assetApi.assigned()
  });

  return (
    <Card>
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">My Assigned Assets</h3>
      </div>
      {isLoading ? <p className="p-4 text-gray-500">Loading assignments...</p> : (
        <div className="p-4 space-y-4">
          {assignments.map((assignment: any) => {
            const asset = assignment.assetId || assignment;
            return (
              <div key={assignment._id || asset._id} className="p-4 border rounded-lg bg-slate-50">
                <h3 className="font-semibold">{asset.assetName || "Asset"}</h3>
                <p className="text-sm text-gray-500">Type: {asset.assetType}</p>
                <p className="text-sm text-gray-500">Serial: {asset.serialNumber}</p>
                {assignment.assignmentDate && (
                  <p className="text-sm text-gray-500">Assigned: {new Date(assignment.assignmentDate).toLocaleDateString()}</p>
                )}
              </div>
            );
          })}
          {assignments.length === 0 && <p className="text-gray-500">No assets are currently assigned to you.</p>}
        </div>
      )}
    </Card>
  );
}

function CreateAssetModal() {
  const [open, setOpen] = useState(false);
  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState("Laptop");
  const [serialNumber, setSerialNumber] = useState("");
  const [condition, setCondition] = useState("Good");
  const [status, setStatus] = useState("Available");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const reset = () => {
    setAssetName("");
    setAssetType("Laptop");
    setSerialNumber("");
    setCondition("Good");
    setStatus("Available");
    setPurchaseDate("");
    setCost("");
    setNotes("");
  };

  const mutation = useMutation({
    mutationFn: assetApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["assets"] });
      setOpen(false);
      reset();
      notify("Asset created", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>Create Asset</Button>
      <Modal title="Create Asset" open={open} onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate({
            assetName,
            assetType,
            serialNumber,
            condition,
            status,
            purchaseDate: purchaseDate || undefined,
            cost: cost ? Number(cost) : undefined,
            notes: notes || undefined
          });
        }}>
          <Field label="Asset Name" required><Input value={assetName} onChange={(e) => setAssetName(e.target.value)} required /></Field>
          <div className="form-row">
            <Field label="Asset Type" required>
              <Select value={assetType} onChange={(e) => setAssetType(e.target.value)}>
                <option value="Laptop">Laptop</option>
                <option value="Mobile">Mobile</option>
                <option value="Monitor">Monitor</option>
                <option value="Chair">Chair</option>
                <option value="Other">Other</option>
              </Select>
            </Field>
            <Field label="Serial Number" required><Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} required /></Field>
          </div>
          <div className="form-row">
            <Field label="Condition">
              <Select value={condition} onChange={(e) => setCondition(e.target.value)}>
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Needs Repair">Needs Repair</option>
                <option value="Retired">Retired</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Available">Available</option>
                <option value="Assigned">Assigned</option>
                <option value="Lost">Lost</option>
                <option value="Damaged">Damaged</option>
                <option value="Retired">Retired</option>
              </Select>
            </Field>
          </div>
          <div className="form-row">
            <Field label="Purchase Date"><Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} /></Field>
            <Field label="Cost"><Input type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} /></Field>
          </div>
          <Field label="Notes"><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending} disabled={!assetName || !assetType || !serialNumber}>Create Asset</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
