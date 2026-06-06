// @ts-nocheck
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  Clock,
  Plus,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";
import { attendanceApi, departmentApi, employeeApi, leaveApi, recruitmentApi } from "../../api/hrm-api";
import { Badge } from "../../components/ui/badge";
import { Card, CardBody, CardHeader, KpiCard } from "../../components/ui/card";
import { DataTable } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Avatar } from "../../components/ui/avatar";
import { formatDate, formatTime, personName } from "../../lib/format";

export function DashboardPage() {
  const employees = useQuery({ queryKey: ["employees"], queryFn: employeeApi.list });
  const departments = useQuery({ queryKey: ["departments"], queryFn: departmentApi.list });
  const pendingLeave = useQuery({ queryKey: ["leave", "pending"], queryFn: leaveApi.pending });
  const punches = useQuery({ queryKey: ["attendance", "today-punches"], queryFn: attendanceApi.todayPunches });
  const jobs = useQuery({ queryKey: ["jobs"], queryFn: recruitmentApi.listJobs });

  const activeEmployees = employees.data?.filter((e) => e.status !== "Exited").length ?? 0;
  const openJobs = jobs.data?.filter((j) => j.status === "Open").length ?? 0;

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back. Here's what's happening today.</p>
        </div>
        <div className="toolbar">
          <Link className="btn btn-secondary" to="/hrm/employees">
            <Plus size={16} />
            <span>Employee</span>
          </Link>
          <Link className="btn btn-primary" to="/hrm/attendance">
            <Timer size={16} />
            <span>Punch In</span>
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <section className="kpi-grid">
        <KpiCard
          icon={<Users size={20} />}
          iconColor="purple"
          label="Active Employees"
          value={activeEmployees}
          meta="Active workforce"
        />
        <KpiCard
          icon={<Clock size={20} />}
          iconColor="amber"
          label="Pending Leave"
          value={pendingLeave.data?.length ?? 0}
          meta="Awaiting action"
        />
        <KpiCard
          icon={<CalendarDays size={20} />}
          iconColor="green"
          label="Today Punches"
          value={punches.data?.length ?? 0}
          meta="Check-in/out today"
        />
        <KpiCard
          icon={<Briefcase size={20} />}
          iconColor="blue"
          label="Open Positions"
          value={openJobs}
          meta="Active job postings"
        />
      </section>

      {/* Content Grid */}
      <section className="grid-2">
        {/* Pending Leave Approvals */}
        <Card>
          <CardHeader action={<Link className="btn btn-ghost btn-sm" to="/hrm/leave">View all <ArrowUpRight size={14} /></Link>}>
            <h3>Pending Leave Approvals</h3>
          </CardHeader>
          <DataTable
            columns={["Employee", "Type", "Duration", "Status"]}
            empty={!pendingLeave.data?.length}
            loading={pendingLeave.isLoading}
          >
            {pendingLeave.data?.slice(0, 5).map((req) => (
              <tr key={req._id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={personName(req.employeeId)} size="sm" />
                    <span>{personName(req.employeeId)}</span>
                  </div>
                </td>
                <td>{req.leaveType}</td>
                <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {formatDate(req.startDate)} – {formatDate(req.endDate)}
                </td>
                <td><Badge tone="yellow" dot>Pending</Badge></td>
              </tr>
            ))}
          </DataTable>
        </Card>

        {/* Today's Attendance */}
        <Card>
          <CardHeader action={<Link className="btn btn-ghost btn-sm" to="/hrm/attendance">Open <ArrowUpRight size={14} /></Link>}>
            <h3>Today's Attendance</h3>
          </CardHeader>
          <DataTable
            columns={["Time", "Type", "Source"]}
            empty={!punches.data?.length}
            loading={punches.isLoading}
          >
            {punches.data?.slice(0, 5).map((punch) => (
              <tr key={punch._id}>
                <td style={{ fontWeight: 500 }}>{formatTime(punch.timestamp)}</td>
                <td>
                  <Badge tone={punch.punchType === "IN" ? "green" : "blue"} dot>
                    {punch.punchType}
                  </Badge>
                </td>
                <td style={{ color: "var(--text-muted)" }}>{punch.source}</td>
              </tr>
            ))}
          </DataTable>
        </Card>
      </section>
    </>
  );
}
