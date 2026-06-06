import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Edit, Plus, Trash2 } from "lucide-react";
import { departmentApi } from "../../api/hrm-api";
import { Department } from "../../api/types";
import { getErrorMessage } from "../../api/http";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, KpiCard } from "../../components/ui/card";
import { Field, Input, Textarea } from "../../components/ui/field";
import { Modal } from "../../components/ui/modal";
import { DataTable } from "../../components/ui/table";
import { useToast } from "../../components/ui/toast";
import { useAuth } from "../auth/auth-context";
import { canWriteFeature } from "../auth/role-access";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const departmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  head: z.string().optional()
});

type DepartmentForm = z.infer<typeof departmentSchema>;

export function DepartmentsPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [emailSearch, setEmailSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{id: string, name: string, email: string}[]>([]);
  const form = useForm<DepartmentForm>({
    resolver: zodResolver(departmentSchema)
  });
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const { employee } = useAuth();
  const canManageOrganization = canWriteFeature(employee?.role, "organization");
  const departments = useQuery({ queryKey: ["departments"], queryFn: departmentApi.list });

  const save = useMutation({
    mutationFn: (values: DepartmentForm) =>
      editing ? departmentApi.update(editing._id, values) : departmentApi.create(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["departments"] });
      setOpen(false);
      setEditing(null);
      notify("Department saved", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const remove = useMutation({
    mutationFn: departmentApi.remove,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["departments"] });
      notify("Department deleted", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  function openForm(department?: Department) {
    setEditing(department || null);
    form.reset({ name: department?.name || "", description: department?.description || "", head: typeof department?.head === "string" ? department.head : "" });
    setEmailSearch("");
    setSearchResults([]);
    setOpen(true);
  }

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Departments</h1>
          <p>Maintain organization units used across employee and position records.</p>
        </div>
        {canManageOrganization && <Button icon={<Plus size={16} />} onClick={() => openForm()}>Add Department</Button>}
      </div>

      <section className="kpi-grid">
        <KpiCard icon={<Building2 size={20} />} iconColor="purple" label="Total Departments" value={departments.data?.length ?? 0} />
      </section>

      <Card>
        <DataTable
          columns={["Department", "Description", "Head", "Actions"]}
          empty={!departments.data?.length}
          loading={departments.isLoading}
        >
          {departments.data?.map((department) => (
            <tr key={department._id}>
              <td><strong>{department.name}</strong></td>
              <td style={{ color: "var(--text-muted)" }}>{department.description || "-"}</td>
              <td>{typeof department.head === "string" ? department.head : "-"}</td>
              <td>
                {canManageOrganization ? (
                  <div className="toolbar">
                    <Button variant="ghost" size="sm" iconOnly icon={<Edit size={15} />} onClick={() => openForm(department)} aria-label="Edit" />
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      icon={<Trash2 size={15} />}
                      onClick={() => window.confirm("Delete this department?") && remove.mutate(department._id)}
                      aria-label="Delete"
                    />
                  </div>
                ) : <span className="muted">View</span>}
              </td>
            </tr>
          ))}
        </DataTable>
      </Card>

      <Modal title={editing ? "Edit Department" : "Add Department"} open={open} onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={form.handleSubmit((values) => save.mutate(values))}>
          <Field label="Name" required>
            <Input {...form.register("name", { required: true })} />
          </Field>
          <Field label="Description">
            <Textarea {...form.register("description")} />
          </Field>
          
          <Field label="Department Head (Search by Email)" description="Type an email and press Enter or click Search">
            <div style={{ display: 'flex', gap: 8 }}>
              <Input 
                placeholder="Type email to search..." 
                value={emailSearch} 
                onChange={(e) => setEmailSearch(e.target.value)} 
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!emailSearch) return;
                    try {
                      const results = await departmentApi.searchUser(emailSearch);
                      setSearchResults(results || []);
                      if (!results?.length) notify("No active users found", "error");
                    } catch { notify("Search failed", "error"); }
                  }
                }}
              />
              <Button 
                type="button" 
                variant="secondary" 
                size="sm"
                onClick={async () => {
                  if (!emailSearch) return;
                  try {
                    const results = await departmentApi.searchUser(emailSearch);
                    setSearchResults(results || []);
                    if (!results?.length) notify("No active users found", "error");
                  } catch { notify("Search failed", "error"); }
                }}
              >
                Search
              </Button>
            </div>
          </Field>
          {searchResults.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {searchResults.map(emp => (
                <button
                  key={emp.id}
                  type="button"
                  className="dropdown-item"
                  onClick={() => { form.setValue("head", emp.id); setSearchResults([]); setEmailSearch(emp.email); }}
                >
                  <strong>{emp.name}</strong> <span style={{ color: "var(--text-muted)" }}>({emp.email})</span>
                </button>
              ))}
            </div>
          )}
          {form.watch("head") && !searchResults.length && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <Badge tone="blue">Selected: {emailSearch || form.watch("head")}</Badge>
              <Button type="button" variant="ghost" size="sm" onClick={() => { form.setValue("head", ""); setEmailSearch(""); }}>Clear</Button>
            </div>
          )}

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={save.isPending}>Save Department</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
