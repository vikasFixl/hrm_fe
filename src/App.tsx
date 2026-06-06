import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./features/auth/protected-route";
import { HrmLayout } from "./layout/hrm-layout";
import { LoginPage } from "./features/auth/login-page";
import { SelectOrgPage } from "./features/auth/select-org-page";
import { OnboardingPendingPage } from "./features/auth/onboarding-pending-page";
import { DashboardPage } from "./features/dashboard/dashboard-page";
import { EmployeesPage } from "./features/employees/employees-page";
import { EmployeeDetailPage } from "./features/employees/employee-detail-page";
import { DepartmentsPage } from "./features/org/departments-page";
import { PositionsPage } from "./features/org/positions-page";
import { LeavePage } from "./features/leave/leave-page";
import { AttendancePage } from "./features/attendance/attendance-page";
import { SettingsPage } from "./features/settings/settings-page";
import { JobPostingsPage } from "./features/recruitment/job-postings-page";
import { CandidateTrackingPage } from "./features/recruitment/candidate-tracking-page";
import { InterviewsPage } from "./features/recruitment/interviews-page";
import { OffersPage } from "./features/recruitment/offers-page";
import { RecruitmentAnalyticsPage } from "./features/recruitment/recruitment-analytics-page";
import { PayrollPage } from "./features/payroll/payroll-page";
import { PerformanceDashboard } from "./features/performance/performance-dashboard";
import { ExpenseDashboard } from "./features/expense/expense-dashboard";
import { TrainingDashboard } from "./features/training/training-dashboard";
import { SurveyDashboard } from "./features/surveys/survey-dashboard";
import { TravelDashboard } from "./features/travel/travel-dashboard";
import { AssetsPage } from "./features/assets/assets-page";
import { WellnessPage } from "./features/wellness/wellness-page";
import { CompliancePage } from "./features/compliance/compliance-page";
import { AuditLogsPage } from "./features/audit/audit-logs-page";
import { ReportsPage } from "./features/reports/reports-page";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/hrm/dashboard" replace />} />
      <Route path="/hrm/login" element={<LoginPage />} />
      <Route path="/hrm/select-org" element={<SelectOrgPage />} />
      <Route path="/hrm/onboarding/start" element={<OnboardingPendingPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<HrmLayout />}>
          <Route element={<ProtectedRoute feature="dashboard" />}>
            <Route path="/hrm/dashboard" element={<DashboardPage />} />
          </Route>
          <Route element={<ProtectedRoute feature="employees" />}>
            <Route path="/hrm/employees" element={<EmployeesPage />} />
            <Route path="/hrm/employees/:id" element={<EmployeeDetailPage />} />
          </Route>
          <Route element={<ProtectedRoute feature="organization" />}>
            <Route path="/hrm/departments" element={<DepartmentsPage />} />
            <Route path="/hrm/positions" element={<PositionsPage />} />
          </Route>
          <Route element={<ProtectedRoute feature="leave" />}>
            <Route path="/hrm/leave" element={<LeavePage />} />
          </Route>
          <Route element={<ProtectedRoute feature="attendance" />}>
            <Route path="/hrm/attendance" element={<AttendancePage />} />
          </Route>
          <Route element={<ProtectedRoute feature="recruitment" />}>
            <Route path="/hrm/jobs" element={<JobPostingsPage />} />
            <Route path="/hrm/candidates" element={<CandidateTrackingPage />} />
            <Route path="/hrm/interviews" element={<InterviewsPage />} />
            <Route path="/hrm/offers" element={<OffersPage />} />
            <Route path="/hrm/recruitment-analytics" element={<RecruitmentAnalyticsPage />} />
          </Route>
          <Route element={<ProtectedRoute feature="payroll" />}>
            <Route path="/hrm/payroll" element={<PayrollPage />} />
          </Route>
          <Route element={<ProtectedRoute feature="performance" />}>
            <Route path="/hrm/performance" element={<PerformanceDashboard />} />
          </Route>
          <Route element={<ProtectedRoute feature="training" />}>
            <Route path="/hrm/training" element={<TrainingDashboard />} />
          </Route>
          <Route element={<ProtectedRoute feature="surveys" />}>
            <Route path="/hrm/surveys" element={<SurveyDashboard />} />
          </Route>
          <Route element={<ProtectedRoute feature="expenses" />}>
            <Route path="/hrm/expenses" element={<ExpenseDashboard />} />
          </Route>
          <Route element={<ProtectedRoute feature="travel" />}>
            <Route path="/hrm/travel" element={<TravelDashboard />} />
          </Route>
          <Route element={<ProtectedRoute feature="assets" />}>
            <Route path="/hrm/assets" element={<AssetsPage />} />
          </Route>
          <Route element={<ProtectedRoute feature="wellness" />}>
            <Route path="/hrm/wellness" element={<WellnessPage />} />
          </Route>
          <Route element={<ProtectedRoute feature="compliance" />}>
            <Route path="/hrm/compliance" element={<CompliancePage />} />
          </Route>
          <Route element={<ProtectedRoute feature="audit" />}>
            <Route path="/hrm/audit-logs" element={<AuditLogsPage />} />
          </Route>
          <Route element={<ProtectedRoute feature="reports" />}>
            <Route path="/hrm/reports" element={<ReportsPage />} />
          </Route>
          <Route element={<ProtectedRoute feature="settings" />}>
            <Route path="/hrm/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/hrm/dashboard" replace />} />
    </Routes>
  );
}
