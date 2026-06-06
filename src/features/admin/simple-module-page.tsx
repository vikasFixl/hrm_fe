// @ts-nocheck
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Download, Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, KpiCard } from "../../components/ui/card";
import { DataTable } from "../../components/ui/table";
import { Tabs } from "../../components/ui/tabs";
import { Badge } from "../../components/ui/badge";
import { Modal } from "../../components/ui/modal";
import { Field, Input, Textarea } from "../../components/ui/field";
import { useToast } from "../../components/ui/toast";
import { getErrorMessage } from "../../api/http";
import { useAuth } from "../auth/auth-context";
import { FeatureKey, canWriteFeature } from "../auth/role-access";

type ModuleTab = {
  value: string;
  label: string;
  queryKey: unknown[];
  queryFn: () => Promise<any[]>;
};

type SimpleModulePageProps = {
  title: string;
  description: string;
  feature: FeatureKey;
  tabs: ModuleTab[];
  createLabel?: string;
  onCreate?: (payload: any) => Promise<unknown>;
  onExport?: () => Promise<unknown>;
};

const displayKeys = ["name", "title", "code", "type", "status", "category", "action", "entityType", "createdAt", "updatedAt"];

function valueLabel(value: any) {
  if (value == null || value === "") return "-";
  if (typeof value === "object") {
    return value.name || value.title || value.firstName || value.email || value._id || JSON.stringify(value).slice(0, 60);
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return new Date(value).toLocaleDateString();
  return String(value);
}

export function SimpleModulePage({ title, description, feature, tabs, createLabel, onCreate, onExport }: SimpleModulePageProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.value);
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState("{}");
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const { employee } = useAuth();
  const canWrite = canWriteFeature(employee?.role, feature);
  const tab = tabs.find((item) => item.value === activeTab) || tabs[0];

  const query = useQuery({
    queryKey: tab.queryKey,
    queryFn: tab.queryFn
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!onCreate) return;
      return onCreate(JSON.parse(payload || "{}"));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tab.queryKey });
      setOpen(false);
      setPayload("{}");
      notify(`${title} saved`, "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const rows = query.data || [];
  const columns = useMemo(() => {
    const keySet = new Set<string>();
    rows.slice(0, 10).forEach((row) => {
      displayKeys.forEach((key) => {
        if (row && Object.prototype.hasOwnProperty.call(row, key)) keySet.add(key);
      });
    });
    const keys = Array.from(keySet).slice(0, 5);
    return keys.length ? keys : ["_id", "status", "createdAt"].filter((key) => rows.some((row) => row?.[key] !== undefined));
  }, [rows]);

  return (
    <>
      <div className="page-title">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="toolbar">
          {onExport && <Button variant="secondary" icon={<Download size={16} />} onClick={() => onExport()}>Export</Button>}
          {onCreate && canWrite && <Button icon={<Plus size={16} />} onClick={() => setOpen(true)}>{createLabel || "Create"}</Button>}
        </div>
      </div>

      <section className="kpi-grid">
        <KpiCard icon={<Check size={20} />} iconColor="green" label={tab.label} value={rows.length} />
      </section>

      {tabs.length > 1 && (
        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          tabs={tabs.map((item) => ({ value: item.value, label: item.label }))}
        />
      )}

      <Card>
        <DataTable columns={columns.map((key) => key.replace(/([A-Z])/g, " $1"))} empty={!rows.length} loading={query.isLoading}>
          {rows.map((row, index) => (
            <tr key={row._id || row.id || index}>
              {columns.map((key) => (
                <td key={key}>
                  {key === "status" ? <Badge tone="blue">{valueLabel(row[key])}</Badge> : valueLabel(row[key])}
                </td>
              ))}
            </tr>
          ))}
        </DataTable>
      </Card>

      <Modal title={createLabel || `Create ${title}`} open={open} onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={(event) => { event.preventDefault(); create.mutate(); }}>
          <Field label="Payload JSON" required>
            <Textarea rows={10} value={payload} onChange={(event) => setPayload(event.target.value)} />
          </Field>
          <Field label="Example">
            <Input readOnly value='{"name":"Policy name","status":"Active"}' />
          </Field>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={create.isPending}>Submit</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

