import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Edit, Filter, Plus, Search, Trash2, Users } from "lucide-react";
import { departmentApi, employeeApi, positionApi } from "../../api/hrm-api";
import { Employee } from "../../api/types";
import { getErrorMessage } from "../../api/http";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, KpiCard } from "../../components/ui/card";
import { Input, Select } from "../../components/ui/field";
import { Modal } from "../../components/ui/modal";
import { DataTable } from "../../components/ui/table";
import { Avatar } from "../../components/ui/avatar";
import { useToast } from "../../components/ui/toast";
import { useAuth } from "../auth/auth-context";
import { canWriteFeature } from "../auth/role-access";
import { departmentName, formatDate, personName, positionName } from "../../lib/format";
import { EmployeeForm, EmployeeFormValues, employeePayload } from "./employee-form";

export function EmployeesPage() {
  const [editing, setEditing] = useState<Employee | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const { employee: sessionEmployee } = useAuth();
  const navigate = useNavigate();
  const canManageEmployees = canWriteFeature(sessionEmployee?.role, "employees");

  const handleSearchEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail) return;
    try {
      const emp = await employeeApi.searchByEmail(searchEmail) as any;
      if (emp && (emp.id || emp._id)) {
        navigate(`/hrm/employees/${emp.id || emp._id}`);
      }
    } catch (err: any) {
      notify("Employee not found with that email", "error");
    }
  };

  const employees = useQuery({ queryKey: ["employees"], queryFn: employeeApi.list });
  const departments = useQuery({ queryKey: ["departments"], queryFn: departmentApi.list });
  const positions = useQuery({ queryKey: ["positions"], queryFn: positionApi.list });

  const saveMutation = useMutation({
    mutationFn: (values: EmployeeFormValues) =>
      editing ? employeeApi.update(editing._id, employeePayload(values)) : employeeApi.create(employeePayload(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      setFormOpen(false);
      setEditing(null);
      notify("Employee saved", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const deleteMutation = useMutation({
    mutationFn: employeeApi.remove,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      notify("Employee deleted", "success");
    },
    onError: (error) => notify(getErrorMessage(error), "error")
  });

  const rows = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return (employees.data || []).filter((employee) => {
      const matchesSearch = [employee.employeeCode, employee.firstName, employee.lastName, employee.workEmail]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(lowerSearch);
      const matchesStatus = !status || employee.status === status;
      const matchesRole = !role || employee.role === role;
      const employeeDepartment = typeof employee.departmentId === "object" ? employee.departmentId._id : employee.departmentId;
      const matchesDepartment = !department || employeeDepartment === department;
      return matchesSearch && matchesStatus && matchesRole && matchesDepartment;
    });
  }, [department, employees.data, role, search, status]);

  const activeCount = employees.data?.filter(e => e.status === "Active").length ?? 0;
  const exitedCount = employees.data?.filter(e => e.status === "Exited").length ?? 0;

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Employee Directory</h1>
          <p>Manage employee profiles, job details, reporting lines, and status.</p>
        </div>
        <div className="toolbar">
          <Button variant="secondary" icon={<Download size={16} />}>Export</Button>
          {canManageEmployees && (
            <Button icon={<Plus size={16} />} onClick={() => { setEditing(null); setFormOpen(true); }}>
              Add Employee
            </Button>
          )}
        </div>
      </div>

      {/* KPI Summary */}
      <section className="kpi-grid">
        <KpiCard icon={<Users size={20} />} iconColor="purple" label="Total Employees" value={employees.data?.length ?? 0} />
        <KpiCard icon={<Users size={20} />} iconColor="green" label="Active" value={activeCount} />
        <KpiCard icon={<Users size={20} />} iconColor="amber" label="Exited" value={exitedCount} />
        <KpiCard icon={<Users size={20} />} iconColor="blue" label="Departments" value={departments.data?.length ?? 0} />
      </section>

      {/* Data Table */}
      <Card>
        <DataTable
          columns={["Employee", "Work Email", "Department", "Position", "Role", "Status", "Joined", "Actions"]}
          empty={!rows.length}
          loading={employees.isLoading}
          toolbar={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%" }}>
              <div className="table-toolbar-left">
                <div className="topbar-search" style={{ width: 240 }}>
                  <Search size={14} />
                  <input
                    placeholder="Search employees..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <form onSubmit={handleSearchEmail} style={{ display: "flex", gap: 6 }}>
                  <Input placeholder="Exact email lookup" value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} style={{ width: 200 }} />
                  <Button type="submit" variant="secondary" icon={<Search size={14} />} size="sm" iconOnly />
                </form>
                <Button
                  variant={showFilters ? "primary" : "secondary"}
                  icon={<Filter size={14} />}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filters
                </Button>
              </div>
            </div>
          }
        >
          {rows.map((employee) => (
            <tr key={employee._id}>
              <td>
                <Link to={`/hrm/employees/${employee._id}`} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={personName(employee)} size="sm" />
                  <div>
                    <div style={{ fontWeight: 500 }}>{personName(employee)}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{employee.employeeCode}</div>
                  </div>
                </Link>
              </td>
              <td style={{ color: "var(--text-muted)" }}>{employee.workEmail || "-"}</td>
              <td>{departmentName(employee.departmentId)}</td>
              <td>{positionName(employee.positionId)}</td>
              <td><Badge tone="purple">{employee.role || "Employee"}</Badge></td>
              <td>
                <Badge
                  tone={employee.status === "Active" ? "green" : employee.status === "Exited" ? "red" : "yellow"}
                  dot
                >
                  {employee.status || "Active"}
                </Badge>
              </td>
              <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{formatDate(employee.joinDate)}</td>
              <td>
                {canManageEmployees ? (
                  <div className="toolbar">
                    <Button variant="ghost" size="sm" iconOnly icon={<Edit size={15} />} onClick={() => { setEditing(employee); setFormOpen(true); }} aria-label="Edit" />
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      icon={<Trash2 size={15} />}
                      onClick={() => window.confirm("Delete this employee?") && deleteMutation.mutate(employee._id)}
                      aria-label="Delete"
                    />
                  </div>
                ) : <span className="muted">View</span>}
              </td>
            </tr>
          ))}
        </DataTable>

        {/* Collapsible Filters */}
        {showFilters && (
          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 160 }}>
              <option value="">All statuses</option>
              <option>Active</option>
              <option>Suspended</option>
              <option>Exited</option>
            </Select>
            <Select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: 160 }}>
              <option value="">All roles</option>
              <option>Employee</option>
              <option>Manager</option>
              <option>Admin</option>
            </Select>
            <Select value={department} onChange={(e) => setDepartment(e.target.value)} style={{ width: 200 }}>
              <option value="">All departments</option>
              {departments.data?.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </Select>
            {(status || role || department) && (
              <Button variant="ghost" size="sm" onClick={() => { setStatus(""); setRole(""); setDepartment(""); }}>
                Clear filters
              </Button>
            )}
          </div>
        )}
      </Card>

      <Modal title={editing ? "Edit Employee" : "Add Employee"} open={formOpen} onClose={() => setFormOpen(false)} size="wide">
        <EmployeeForm
          employee={editing || undefined}
          employees={employees.data || []}
          departments={departments.data || []}
          positions={positions.data || []}
          onSubmit={(values) => saveMutation.mutate(values)}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>
    </>
  );
}
