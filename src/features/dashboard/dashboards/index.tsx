import React from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../../../api/hrm-api";
import { getErrorMessage } from "../../../api/http";
import { DashboardView } from "../components/dashboard-view";
import type { HrmDashboardResponse } from "../types";
import { normalizeRole } from "../../auth/role-access";
import { useAuth } from "../../auth/auth-context";

const dashboardMeta: Record<string, { title: string; subtitle: string }> = {
  OrganizationAdminDashboard: { title: "Executive Overview", subtitle: "Organization-wide workforce and operations snapshot." },
  HRAdminDashboard: { title: "HR Operations", subtitle: "People, onboarding, leave, and recruitment oversight." },
  HRManagerDashboard: { title: "HR Manager", subtitle: "Hiring pipeline and workforce coordination." },
  HRExecutiveDashboard: { title: "HR Executive", subtitle: "Daily HR tasks and follow-ups." },
  RecruitmentDashboard: { title: "Recruitment", subtitle: "Jobs, candidates, interviews, and offers." },
  PayrollDashboard: { title: "Payroll", subtitle: "Payroll runs, cost, and reimbursements." },
  AttendanceDashboard: { title: "Attendance", subtitle: "Presence, compliance, shifts, and policies." },
  PerformanceDashboard: { title: "Performance", subtitle: "Goals, reviews, and appraisals." },
  TrainingDashboard: { title: "Training", subtitle: "Learning sessions and certifications." },
  TravelDashboard: { title: "Travel", subtitle: "Travel requests, spend, and upcoming trips." },
  AssetDashboard: { title: "Assets", subtitle: "Inventory allocation and assignments." },
  FinanceDashboard: { title: "Finance", subtitle: "Expense claims and HR cost visibility." },
  ManagerDashboard: { title: "Manager", subtitle: "Team status and approval queue." },
  EmployeeDashboard: { title: "My Workspace", subtitle: "Your attendance, leave, goals, and tasks." },
  CandidateDashboard: { title: "Candidate Portal", subtitle: "Applications, interviews, and onboarding." },
  AuditorDashboard: { title: "Audit & Compliance", subtitle: "Read-only audit and compliance monitoring." }
};

function useRoleDashboard() {
  return useQuery<HrmDashboardResponse>({
    queryKey: ["hrm-dashboard"],
    queryFn: () => dashboardApi.get() as Promise<HrmDashboardResponse>,
    staleTime: 60_000
  });
}

function RoleDashboard({ fallbackType }: { fallbackType: string }) {
  const query = useRoleDashboard();
  const dashboardType = query.data?.dashboardType || fallbackType;
  const meta = dashboardMeta[dashboardType] || { title: "Dashboard", subtitle: "HRM overview" };

  return (
    <DashboardView
      title={meta.title}
      subtitle={meta.subtitle}
      data={query.data}
      loading={query.isLoading}
      error={query.isError ? getErrorMessage(query.error) : null}
    />
  );
}

export function OrganizationAdminDashboard() { return <RoleDashboard fallbackType="OrganizationAdminDashboard" />; }
export function HRAdminDashboard() { return <RoleDashboard fallbackType="HRAdminDashboard" />; }
export function HRManagerDashboard() { return <RoleDashboard fallbackType="HRManagerDashboard" />; }
export function HRExecutiveDashboard() { return <RoleDashboard fallbackType="HRExecutiveDashboard" />; }
export function RecruitmentDashboard() { return <RoleDashboard fallbackType="RecruitmentDashboard" />; }
export function PayrollDashboard() { return <RoleDashboard fallbackType="PayrollDashboard" />; }
export function AttendanceDashboard() { return <RoleDashboard fallbackType="AttendanceDashboard" />; }
export function PerformanceDashboard() { return <RoleDashboard fallbackType="PerformanceDashboard" />; }
export function TrainingDashboard() { return <RoleDashboard fallbackType="TrainingDashboard" />; }
export function TravelDashboard() { return <RoleDashboard fallbackType="TravelDashboard" />; }
export function AssetDashboard() { return <RoleDashboard fallbackType="AssetDashboard" />; }
export function FinanceDashboard() { return <RoleDashboard fallbackType="FinanceDashboard" />; }
export function ManagerDashboard() { return <RoleDashboard fallbackType="ManagerDashboard" />; }
export function EmployeeDashboard() { return <RoleDashboard fallbackType="EmployeeDashboard" />; }
export function CandidateDashboard() { return <RoleDashboard fallbackType="CandidateDashboard" />; }
export function AuditorDashboard() { return <RoleDashboard fallbackType="AuditorDashboard" />; }

const roleComponentMap: Record<string, () => React.ReactElement> = {
  OrganizationAdmin: OrganizationAdminDashboard,
  HRAdmin: HRAdminDashboard,
  HRManager: HRManagerDashboard,
  HRExecutive: HRExecutiveDashboard,
  Recruiter: RecruitmentDashboard,
  HiringManager: RecruitmentDashboard,
  PayrollAdmin: PayrollDashboard,
  PayrollManager: PayrollDashboard,
  AttendanceManager: AttendanceDashboard,
  PerformanceManager: PerformanceDashboard,
  TrainingManager: TrainingDashboard,
  TravelManager: TravelDashboard,
  AssetManager: AssetDashboard,
  FinanceManager: FinanceDashboard,
  DepartmentHead: ManagerDashboard,
  TeamLead: ManagerDashboard,
  Manager: ManagerDashboard,
  Employee: EmployeeDashboard,
  Candidate: CandidateDashboard,
  Auditor: AuditorDashboard
};

export function RoleDashboardRouter() {
  const { employee } = useAuth();
  const role = normalizeRole(employee?.role);
  const Component = roleComponentMap[role] || EmployeeDashboard;
  return <Component />;
}
