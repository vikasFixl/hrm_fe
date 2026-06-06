import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, Power, Trash2, UserSquare2 } from "lucide-react";
import { departmentApi, positionApi } from "../../api/hrm-api";
import { Position } from "../../api/types";
import { getErrorMessage } from "../../api/http";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, KpiCard } from "../../components/ui/card";
import { Field, Input, Select, Textarea } from "../../components/ui/field";
import { Modal } from "../../components/ui/modal";
import { DataTable } from "../../components/ui/table";
import { useToast } from "../../components/ui/toast";
import { departmentName } from "../../lib/format";
import { useAuth } from "../auth/auth-context";
import { canWriteFeature } from "../auth/role-access";

type PositionForm = {
  title: string;
  department: string;
  level?: "Junior" | "Mid" | "Senior" | "Lead" | "Executive";
  description?: string;
};

export function PositionsPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const form = useForm<PositionForm>();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const { employee } = useAuth();
  const canManageOrganization = canWriteFeature(employee?.role, "organization");
  const positions = useQuery({ queryKey: ["positions"], queryFn: positionApi.list });
  const departments = useQuery({ queryKey: ["departments"], queryFn: departmentApi.list });

  const save = useMutation({
    mutationFn: (values: PositionForm) => editing ? positionApi.update(editing._id, values) : positionApi.create(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["positions"] });
      setOpen(false);
      setEditing(null);
      notify("Position saved", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const remove = useMutation({
    mutationFn: positionApi.remove,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["positions"] });
      notify("Position deleted", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const toggle = useMutation({
    mutationFn: positionApi.toggle,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["positions"] });
      notify("Position status updated", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  function openForm(position?: Position) {
    setEditing(position || null);
    form.reset({
      title: position?.title || "",
      department: typeof position?.department === "object" ? position.department._id : position?.department || "",
      level: position?.level || "Mid",
      description: position?.description || ""
    });
    setOpen(true);
  }

  const activeCount = positions.data?.filter(p => p.isActive !== false).length ?? 0;

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Positions</h1>
          <p>Manage role titles, levels, and active position availability.</p>
        </div>
        {canManageOrganization && <Button icon={<Plus size={16} />} onClick={() => openForm()}>Add Position</Button>}
      </div>

      <section className="kpi-grid">
        <KpiCard icon={<UserSquare2 size={20} />} iconColor="purple" label="Total Positions" value={positions.data?.length ?? 0} />
        <KpiCard icon={<UserSquare2 size={20} />} iconColor="green" label="Active" value={activeCount} />
      </section>

      <Card>
        <DataTable
          columns={["Title", "Department", "Level", "Status", "Description", "Actions"]}
          empty={!positions.data?.length}
          loading={positions.isLoading}
        >
          {positions.data?.map((position) => (
            <tr key={position._id}>
              <td><strong>{position.title}</strong></td>
              <td>{departmentName(position.department)}</td>
              <td><Badge tone="purple">{position.level || "Mid"}</Badge></td>
              <td><Badge tone={position.isActive === false ? "red" : "green"} dot>{position.isActive === false ? "Inactive" : "Active"}</Badge></td>
              <td style={{ color: "var(--text-muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{position.description || "-"}</td>
              <td>
                {canManageOrganization ? (
                  <div className="toolbar">
                    <Button variant="ghost" size="sm" iconOnly icon={<Edit size={15} />} onClick={() => openForm(position)} aria-label="Edit" />
                    <Button variant="ghost" size="sm" iconOnly icon={<Power size={15} />} onClick={() => toggle.mutate(position._id)} aria-label="Toggle" />
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      icon={<Trash2 size={15} />}
                      onClick={() => window.confirm("Delete this position?") && remove.mutate(position._id)}
                      aria-label="Delete"
                    />
                  </div>
                ) : <span className="muted">View</span>}
              </td>
            </tr>
          ))}
        </DataTable>
      </Card>

      <Modal title={editing ? "Edit Position" : "Add Position"} open={open} onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={form.handleSubmit((values) => save.mutate(values))}>
          <Field label="Title" required>
            <Input {...form.register("title", { required: true })} />
          </Field>
          <Field label="Department" required>
            <Select {...form.register("department", { required: true })}>
              <option value="">Select department</option>
              {departments.data?.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}
            </Select>
          </Field>
          <Field label="Level">
            <Select {...form.register("level")}>
              <option>Junior</option>
              <option>Mid</option>
              <option>Senior</option>
              <option>Lead</option>
              <option>Executive</option>
            </Select>
          </Field>
          <Field label="Description">
            <Textarea {...form.register("description")} />
          </Field>
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={save.isPending}>Save Position</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
