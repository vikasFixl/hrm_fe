export const HRM_ROLES = [
  "OrganizationAdmin",
  "HRAdmin",
  "HRManager",
  "HRExecutive",
  "Recruiter",
  "HiringManager",
  "PayrollAdmin",
  "PayrollManager",
  "AttendanceManager",
  "PerformanceManager",
  "TrainingManager",
  "TravelManager",
  "AssetManager",
  "FinanceManager",
  "DepartmentHead",
  "TeamLead",
  "Manager",
  "Employee",
  "Candidate",
  "Auditor"
] as const;

export type HrmRole = (typeof HRM_ROLES)[number];

export type FeatureKey =
  | "dashboard"
  | "employees"
  | "organization"
  | "recruitment"
  | "attendance"
  | "leave"
  | "payroll"
  | "performance"
  | "training"
  | "surveys"
  | "expenses"
  | "travel"
  | "assets"
  | "wellness"
  | "compliance"
  | "audit"
  | "reports"
  | "settings";

const allRoles = HRM_ROLES;
const orgAdmins = ["OrganizationAdmin", "HRAdmin"] as const;
const hrOps = ["OrganizationAdmin", "HRAdmin", "HRManager", "HRExecutive"] as const;
const peopleManagers = ["DepartmentHead", "TeamLead", "Manager"] as const;
const payrollRoles = ["PayrollAdmin", "PayrollManager", "FinanceManager"] as const;

export const featureAccess: Record<FeatureKey, readonly HrmRole[]> = {
  dashboard: allRoles,
  employees: [...hrOps, ...peopleManagers, "Auditor"],
  organization: [...hrOps, "DepartmentHead", "Auditor"],
  recruitment: [...hrOps, "Recruiter", "HiringManager", "DepartmentHead"],
  attendance: [...hrOps, ...peopleManagers, "AttendanceManager", "PayrollAdmin", "PayrollManager", "Employee"],
  leave: [...hrOps, ...peopleManagers, "AttendanceManager", "Employee"],
  payroll: [...orgAdmins, ...payrollRoles, "Auditor"],
  performance: [...hrOps, ...peopleManagers, "PerformanceManager", "Employee", "Auditor"],
  training: [...hrOps, "TrainingManager", "DepartmentHead", "TeamLead", "Manager", "Employee"],
  surveys: [...hrOps, "PerformanceManager", "DepartmentHead", "TeamLead", "Manager", "Employee"],
  expenses: [...hrOps, ...peopleManagers, "FinanceManager", "Employee", "Auditor"],
  travel: [...hrOps, ...peopleManagers, "TravelManager", "FinanceManager", "Employee"],
  assets: [...orgAdmins, "AssetManager", "HRManager", "HRExecutive", "Employee", "Auditor"],
  wellness: [...hrOps, "TrainingManager", "PerformanceManager", "Employee"],
  compliance: [...orgAdmins, "Auditor", "HRManager"],
  audit: [...orgAdmins, "Auditor"],
  reports: [...orgAdmins, "HRManager", "FinanceManager", "PayrollAdmin", "PayrollManager", "Auditor"],
  settings: orgAdmins
};

const writeFeatureAccess: Partial<Record<FeatureKey, readonly HrmRole[]>> = {
  employees: hrOps,
  organization: hrOps,
  recruitment: [...hrOps, "Recruiter", "HiringManager"],
  attendance: [...hrOps, "AttendanceManager"],
  leave: [...hrOps, ...peopleManagers, "AttendanceManager"],
  payroll: [...orgAdmins, ...payrollRoles],
  performance: [...hrOps, ...peopleManagers, "PerformanceManager"],
  training: [...hrOps, "TrainingManager"],
  surveys: [...hrOps, "PerformanceManager"],
  expenses: [...hrOps, ...peopleManagers, "FinanceManager"],
  travel: [...hrOps, ...peopleManagers, "TravelManager", "FinanceManager"],
  assets: [...orgAdmins, "AssetManager", "HRManager", "HRExecutive"],
  wellness: [...hrOps, "TrainingManager", "PerformanceManager"],
  compliance: [...orgAdmins, "Auditor", "HRManager"],
  reports: [...orgAdmins, "HRManager", "FinanceManager", "PayrollAdmin", "PayrollManager"]
};

export function normalizeRole(role?: string | null): HrmRole {
  return HRM_ROLES.includes(role as HrmRole) ? (role as HrmRole) : "Employee";
}

export function canAccessFeature(role: string | null | undefined, feature: FeatureKey) {
  return featureAccess[feature].includes(normalizeRole(role));
}

export function canWriteFeature(role: string | null | undefined, feature: FeatureKey) {
  return (writeFeatureAccess[feature] || []).includes(normalizeRole(role));
}

export function canApproveFeature(role: string | null | undefined, feature: FeatureKey) {
  return canWriteFeature(role, feature);
}

