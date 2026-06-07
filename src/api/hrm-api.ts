import axios from "axios";
import { apiBaseUrl, http, unwrap, unwrapList } from "./http";
import {
  DailyAttendance,
  Department,
  Employee,
  LeaveRequest,
  LoginResponse,
  Position,
  RawTimeLog,
  JobPosting,
  Candidate,
  Interview,
  Offer,
  SalaryConfig,
  Payroll,
  PerformanceAppraisal,
  Goal,
  ImprovementPlan,
  Feedback,
  ExpenseSubmission,
  Reimbursement
} from "./types";

export const authApi = {
  login: async (payload: { email: string; password: string }) => {
    const { data } = await http.post<LoginResponse>("/auth/login", payload);
    return data;
  },
  verifyMfa: async (payload: { mfaToken: string; token: string }) => {
    const { data } = await http.post<LoginResponse>("/auth/verify-2fa", payload);
    return data;
  },
  selectOrg: async (payload: { tempToken: string; organizationId: string }) => {
    const { data } = await http.post<LoginResponse>(
      "/auth/select-org",
      { organizationId: payload.organizationId },
      { headers: { Authorization: `Bearer ${payload.tempToken}` } }
    );
    return data;
  },
  logout: async () => http.post("/auth/logout")
};

const onboardingHttp = axios.create({
  baseURL: apiBaseUrl.replace(/\/api\/hrm\/?$/, "/api/onboarding"),
  withCredentials: true
});

const hrOnboardingReviewHttp = axios.create({
  baseURL: apiBaseUrl.replace(/\/api\/hrm\/?$/, "/api/hr/onboarding"),
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
});

const onboardingHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export const employeeOnboardingApi = {
  me: async (token: string) => {
    const { data } = await onboardingHttp.get("/me", { headers: onboardingHeaders(token) });
    return data.data as {
      status: string;
      currentStep: string;
      completionPercentage: number;
      requiredDocuments: string[];
      submittedDocuments: any[];
    };
  },
  submission: async (token: string) => {
    const { data } = await onboardingHttp.get("/me/submission", { headers: onboardingHeaders(token) });
    return data.data as any;
  },
  savePersonalInfo: async (token: string, payload: any) => {
    const { data } = await onboardingHttp.patch("/me/personal-info", payload, { headers: onboardingHeaders(token) });
    return data.data;
  },
  saveEmergencyContact: async (token: string, payload: any) => {
    const { data } = await onboardingHttp.patch("/me/emergency-contact", payload, { headers: onboardingHeaders(token) });
    return data.data;
  },
  saveBankDetails: async (token: string, payload: any) => {
    const { data } = await onboardingHttp.patch("/me/bank-details", payload, { headers: onboardingHeaders(token) });
    return data.data;
  },
  uploadDocument: async (token: string, payload: { type: string; number?: string; file: File }) => {
    const formData = new FormData();
    formData.append("type", payload.type);
    if (payload.number) formData.append("number", payload.number);
    formData.append("document", payload.file);
    const { data } = await onboardingHttp.post("/me/documents", formData, {
      headers: { ...onboardingHeaders(token), "Content-Type": "multipart/form-data" }
    });
    return data.data;
  },
  deleteDocument: async (token: string, documentType: string) => {
    const { data } = await onboardingHttp.delete(`/me/documents/${documentType}`, { headers: onboardingHeaders(token) });
    return data;
  },
  submit: async (token: string) => {
    const { data } = await onboardingHttp.post("/me/submit", null, { headers: onboardingHeaders(token) });
    return data.data;
  }
};

export const dashboardApi = {
  get: async () => {
    const { data } = await http.get("/dashboard");
    return data;
  }
};

export const attendanceShiftApi = {
  list: async (params?: { search?: string }) => {
    const { data } = await http.get("/attendance/shifts/list", { params });
    return unwrapList<any>(data, ["data"]);
  },
  create: async (payload: any) => {
    const { data } = await http.post("/attendance/shifts", payload);
    return unwrap<any>(data);
  },
  update: async (id: string, payload: any) => {
    const { data } = await http.patch(`/attendance/shifts/${id}`, payload);
    return unwrap<any>(data);
  },
  disable: async (id: string) => {
    const { data } = await http.delete(`/attendance/shifts/${id}`);
    return data;
  }
};

export const attendancePolicyApi = {
  active: async () => {
    const { data } = await http.get("/attendance/policy/active");
    return unwrap<any>(data);
  },
  upsert: async (payload: any) => {
    const { data } = await http.post("/attendance/policy", payload);
    return unwrap<any>(data);
  }
};

export const hrOnboardingReviewApi = {
  list: async (params?: Record<string, any>) => {
    const { data } = await hrOnboardingReviewHttp.get("/", { params });
    return data as { data: any[]; pagination?: any };
  },
  get: async (id: string) => {
    const { data } = await hrOnboardingReviewHttp.get(`/${id}`);
    return data.data as { onboarding: any; submission?: any };
  },
  approveDocument: async (onboardingId: string, documentId: string) => {
    const { data } = await hrOnboardingReviewHttp.patch(`/${onboardingId}/document/${documentId}/approve`);
    return data.data;
  },
  rejectDocument: async (onboardingId: string, documentId: string, reason: string) => {
    const { data } = await hrOnboardingReviewHttp.patch(`/${onboardingId}/document/${documentId}/reject`, { reason });
    return data.data;
  },
  approveOnboarding: async (onboardingId: string, payload?: { shiftId?: string; attendanceStartDate?: string }) => {
    const { data } = await hrOnboardingReviewHttp.patch(`/${onboardingId}/approve`, payload || {});
    return data.data;
  },
  rejectOnboarding: async (onboardingId: string, reason: string) => {
    const { data } = await hrOnboardingReviewHttp.patch(`/${onboardingId}/reject`, { reason });
    return data.data;
  }
};

export const employeeApi = {
  list: async () => {
    const { data } = await http.get("/employees/all");
    return unwrapList<Employee & { id?: string; name?: string; department?: string; position?: string }>(data, ["employees"]).map(
      (employee) => {
        const [firstName = employee.name || "-", ...rest] = (employee.name || "").split(" ");
        return {
          ...employee,
          _id: employee._id || employee.id || "",
          firstName: employee.firstName || firstName,
          lastName: employee.lastName || rest.join(" "),
          email: employee.email,
          workEmail: employee.workEmail || employee.email,
          departmentId: employee.departmentId || (employee.department ? { _id: employee.department, name: employee.department } : undefined),
          positionId: employee.positionId || (employee.position ? { _id: employee.position, title: employee.position } : undefined)
        };
      }
    );
  },
  get: async (id: string) => {
    const { data } = await http.get(`/employees/${id}`);
    return (data as any).employee as Employee;
  },
  searchEmployeesByEmail: async (email: string) => {
    const { data } = await http.get(`/employees/list/email?email=${encodeURIComponent(email)}`);
    return data.employees as { _id: string; email: string; name: string }[];
  },
  create: async (payload: Partial<Employee>) => {
    const { data } = await http.post("/employees", payload);
    return unwrap<Employee>(data);
  },
  update: async (id: string, payload: Partial<Employee>) => {
    const { data } = await http.patch(`/employees/update/${id}`, payload);
    return unwrap<Employee>(data);
  },
  remove: async (id: string) => http.delete(`/employees/delete/${id}`),
  terminate: async (id: string, payload: { reason: string; lastWorkingDay: string }) => {
    const { data } = await http.post(`/employees/terminate/${id}`, payload);
    return unwrap<Employee>(data);
  },
  searchByEmail: async (email: string) => {
    const { data } = await http.get(`/employees/search/email?email=${encodeURIComponent(email)}`);
    return unwrap<Employee>(data);
  },
  listByEmail: async (email: string) => {
    const { data } = await http.get(`/employees/list/email?email=${encodeURIComponent(email)}`);
    return unwrapList<{ id: string; email: string; name: string }>(data, ["employees"]);
  },
  promote: async (id: string, payload: { newSalary: number; newPositionId: string; reason: string }) => {
    const { data } = await http.post(`/employees/promote/${id}`, payload);
    return unwrap<Employee>(data);
  },
  transfer: async (id: string, payload: { newDepartmentId: string; newManagerId?: string; reason: string }) => {
    const { data } = await http.post(`/employees/transfer/${id}`, payload);
    return unwrap<Employee>(data);
  },
  hierarchy: async (id: string) => {
    const { data } = await http.get(`/employees/hierarchy/${id}`);
    // data.directReports is an array of Employee
    return data as { employee: any; directReports: any[] };
  }
};

export const lifecycleApi = {
  listOnboardings: async (params?: { status?: string; page?: number; limit?: number }) => {
    const { data } = await http.get("/employees/onboarding/all", { params });
    return data as {
      onboardings: any[];
      pagination: { totalRecords: number; currentPage: number; totalPages: number; limit: number };
    };
  },
  initiateOnboarding: async (employeeId: string) => {
    const { data } = await http.post(`/employees/onboarding/initiate/${employeeId}`);
    return data;
  },
  updateOnboarding: async (
    onboardingId: string,
    payload: { status: string; rejectionReason?: string; shiftId?: string; attendanceStartDate?: string }
  ) => {
    const { data } = await http.patch(`/employees/onboarding/status/${onboardingId}`, payload);
    return data;
  },
  deleteOnboarding: async (onboardingId: string) => {
    const { data } = await http.delete(`/employees/onboarding/${onboardingId}`);
    return data;
  },
  listOffboardings: async (params?: { status?: string; employeeId?: string }) => {
    const { data } = await http.get("/employees/offboarding", { params });
    return (data as { offboardings: any[] }).offboardings || [];
  },
  getOffboarding: async (id: string) => {
    const { data } = await http.get("/employees/offboarding");
    return ((data as { offboardings: any[] }).offboardings || []).find((record) => record._id === id);
  },
  initiateOffboarding: async (payload: {
    employeeId: string;
    reason?: string;
    lastWorkingDay: string;
    checklist?: { task: string; completed: boolean }[];
  }) => {
    const { data } = await http.post("/employees/offboarding", payload);
    return data;
  },
  updateOffboarding: async (
    id: string,
    payload: { status?: string; checklist?: { task: string; completed: boolean; completedAt?: string }[]; feedback?: string }
  ) => {
    const { data } = await http.patch(`/employees/offboarding/${id}`, payload);
    return data;
  }
};

export const departmentApi = {
  list: async () => {
    const { data } = await http.get("/organization/departments/all");
    return unwrapList<Department>(data, ["departments"]);
  },
  create: async (payload: Partial<Department>) => {
    const { data } = await http.post("/organization/departments", payload);
    return unwrap<Department>(data);
  },
  update: async (id: string, payload: Partial<Department>) => {
    const { data } = await http.patch(`/organization/departments/${id}`, payload);
    return unwrap<Department>(data);
  },
  remove: async (id: string) => http.delete(`/organization/departments/${id}`),
  searchUser: async (email: string) => {
    const { data } = await http.get(`/organization/departments/search-user?email=${encodeURIComponent(email)}`);
    return unwrapList<{ id: string; email: string; name: string }>(data, ["users"]);
  }
};

export const positionApi = {
  list: async () => {
    const { data } = await http.get("/organization/positions/all");
    return unwrapList<Position>(data, ["positions"]);
  },
  create: async (payload: Partial<Position>) => {
    const { data } = await http.post("/organization/positions", payload);
    return unwrap<Position>(data);
  },
  update: async (id: string, payload: Partial<Position>) => {
    const { data } = await http.patch(`/organization/positions/${id}`, payload);
    return unwrap<Position>(data);
  },
  remove: async (id: string) => http.delete(`/organization/positions/${id}`),
  toggle: async (id: string) => http.post(`/organization/positions/${id}`)
};

export const leaveApi = {
  mine: async () => {
    const { data } = await http.get("/leave/request/me");
    return unwrapList<any>(data, ["requests"]);
  },
  pending: async () => {
    const { data } = await http.get("/leave/request/pending");
    return unwrapList<any>(data, ["requests"]);
  },
  types: async () => {
    const { data } = await http.get("/leave/types");
    return unwrapList<any>(data, ["types"]);
  },
  create: async (payload: any) => {
    const { data } = await http.post("/leave/request", payload);
    return data;
  },
  approve: async (id: string) => {
    const { data } = await http.post(`/leave/request/approve/${id}`);
    return data;
  },
  reject: async (id: string, reason: string) => {
    const { data } = await http.post(`/leave/request/reject/${id}`, { reason });
    return data;
  },
  createType: async (payload: any) => {
    const { data } = await http.post("/leave/types", payload);
    return data;
  }
};

// ==========================================
// PAYROLL API
// ==========================================
export const payrollApi = {
  configs: async () => {
    const { data } = await http.get("/payroll/config");
    return unwrapList<any>(data, ["configs"]);
  },
  payrolls: async () => {
    const { data } = await http.get("/payroll/list");
    return unwrapList<any>(data, ["payrolls"]);
  },
  createConfig: async (payload: any) => {
    const { data } = await http.post("/payroll/config", payload);
    return data;
  },
  generate: async (payload: any) => {
    const { data } = await http.post("/payroll/generate", payload);
    return data;
  },
  approve: async (id: string) => {
    const { data } = await http.patch(`/payroll/${id}/approve`);
    return data;
  },
  taxes: async () => { const { data } = await http.get("/payroll/tax"); return unwrapList<any>(data, ["taxes"]); },
  deposits: async () => { const { data } = await http.get("/payroll/deposit"); return unwrapList<any>(data, ["deposits"]); },
  reports: async () => { const { data } = await http.get("/payroll/report"); return unwrapList<any>(data, ["reports"]); }
};


export const attendanceApi = {
  mine: async () => { const { data } = await http.get('/attendance/me'); return unwrapList<any>(data, ['data']); },
  todayPunches: async () => { const { data } = await http.get('/attendance/punches/today'); return unwrapList<any>(data, ['data']); },
  employee: async (employeeId: string) => { const { data } = await http.get(`/attendance/employee/${employeeId}`); return unwrapList<any>(data, ['data']); },
  punch: async (punchType: "IN" | "OUT") => { const { data } = await http.post('/attendance/punch', { punchType, source: "web" }); return data; },
  override: async (id: string, payload: any) => { const { data } = await http.patch(`/attendance/${id}/override`, payload); return data; },
  lockAll: async (payload: { from: string, to: string }) => { const { data } = await http.post('/attendance/lock', payload); return data; },
  lockEmployee: async ({ employeeId, ...payload }: { employeeId: string, from: string, to: string }) => { const { data } = await http.post(`/attendance/employee/${employeeId}/lock`, payload); return data; },
  unlockEmployee: async ({ employeeId, ...payload }: { employeeId: string, from: string, to: string, reason: string }) => { const { data } = await http.post(`/attendance/employee/${employeeId}/unlock`, payload); return data; }
};

// Restored APIs
export const recruitmentApi = {
  listJobs: async () => { const { data } = await http.get("/recruitment/jobs/all"); return unwrapList<any>(data, ["jobPostings", "jobs"]); },
  createJob: async (payload: any) => { const { data } = await http.post("/recruitment/jobs", payload); return data; },
  updateJob: async (id: string, payload: any) => { const { data } = await http.patch(`/recruitment/jobs/${id}`, payload); return data; },
  removeJob: async (id: string) => http.delete(`/recruitment/jobs/${id}`),
  createCandidate: async (payload: any) => { const { data } = await http.post("/recruitment/candidates", payload); return data; },
  getCandidate: async (id: string) => { const { data } = await http.get(`/recruitment/candidates/${id}`); return data; },
  listCandidates: async () => { const { data } = await http.get("/recruitment/candidates/all"); return unwrapList<any>(data, ["candidates"]); },
  searchCandidatesByEmail: async (email: string) => { const { data } = await http.get(`/recruitment/candidates/search-email?email=${encodeURIComponent(email)}`); return unwrapList<any>(data, ["data", "candidates"]); },
  updateCandidate: async (id: string, payload: any) => { const { data } = await http.patch(`/recruitment/candidates/${id}`, payload); return data; },
  updateCandidateStatus: async (id: string, payload: string | Record<string, any>) => {
    const body = typeof payload === "string" ? { status: payload } : payload;
    const { data } = await http.patch(`/recruitment/candidates/update-status/${id}`, body);
    return data;
  },
  createInterview: async (payload: any) => { const { data } = await http.post("/recruitment/interviews", payload); return data; },
  scheduleInterview: async (payload: any) => { const { data } = await http.post("/recruitment/interviews", payload); return data; },
  listInterviews: async (params?: Record<string, any>) => { const { data } = await http.get("/recruitment/interviews", { params }); return unwrapList<any>(data, ["interviews"]); },
  updateInterviewStatus: async (id: string, status: string) => { const { data } = await http.patch(`/recruitment/interviews/${id}/status`, { status }); return data; },
  createOffer: async (payload: any) => { const { data } = await http.post("/recruitment/offers", payload); return data; },
  listOffers: async (params?: Record<string, any>) => { const { data } = await http.get("/recruitment/offers/all", { params }); return unwrapList<any>(data, ["offers"]); },
  updateOfferStatus: async (id: string, status: string, acceptedDate?: string) => { const { data } = await http.patch(`/recruitment/offers/${id}`, { status, acceptedDate }); return data; },
  getAnalytics: async () => { const { data } = await http.get("/recruitment/analytics/all"); return data; },
  generateAnalytics: async (jobPostingId: string) => { const { data } = await http.post(`/recruitment/analytics/generate/${jobPostingId}`); return data; }
};

export const performanceApi = {
  getAppraisals: async () => { const { data } = await http.get("/performance/appraisal"); return unwrapList<any>(data, ["appraisals"]); },
  createAppraisal: async (payload: any) => { const { data } = await http.post("/performance/appraisal", payload); return data; },
  getGoals: async () => { const { data } = await http.get("/performance/goals/all"); return unwrapList<any>(data, ["goals"]); },
  createGoal: async (payload: any) => { const { data } = await http.post("/performance/goals", payload); return data; },
  getPIPs: async () => { const { data } = await http.get("/performance/improvement/all"); return unwrapList<any>(data, ["pips", "plans"]); },
  createPIP: async (payload: any) => { const { data } = await http.post("/performance/improvement", payload); return data; },
  getFeedback: async () => { const { data } = await http.get("/performance/feedback/all"); return unwrapList<any>(data, ["feedback"]); },
  submitFeedback: async (payload: any) => { const { data } = await http.post("/performance/feedback", payload); return data; }
};

export const surveyApi = {
  getSurveys: async () => { const { data } = await http.get("/surveys/deliveries"); return unwrapList<any>(data, ["surveys"]); },
  createSurvey: async (payload: any) => { const { data } = await http.post("/surveys/deliveries", payload); return data; },
  getFeedback: async () => { const { data } = await http.get("/surveys/feedback"); return unwrapList<any>(data, ["feedback"]); },
  submitFeedback: async (payload: any) => { const { data } = await http.post("/surveys/feedback", payload); return data; },
  getActionPlans: async () => { const { data } = await http.get("/surveys/action-plans"); return unwrapList<any>(data, ["plans"]); },
  createActionPlan: async (payload: any) => { const { data } = await http.post("/surveys/action-plans", payload); return data; }
};

export const trainingApi = {
  getSessions: async () => { const { data } = await http.get("/training/sessions"); return unwrapList<any>(data, ["sessions"]); },
  createSession: async (payload: any) => { const { data } = await http.post("/training/sessions", payload); return data; },
  getMaterials: async () => { const { data } = await http.get("/training/materials"); return unwrapList<any>(data, ["materials"]); },
  createMaterial: async (payload: any) => { const { data } = await http.post("/training/materials", payload); return data; },
  getCertifications: async () => { const { data } = await http.get("/training/certifications"); return unwrapList<any>(data, ["certifications"]); },
  logCertification: async (payload: any) => { const { data } = await http.post("/training/certifications", payload); return data; }
};

export const travelApi = {
  getRequests: async () => { const { data } = await http.get("/travel/requests"); return unwrapList<any>(data, ["requests"]); },
  createRequest: async (payload: any) => { const { data } = await http.post("/travel/requests", payload); return data; },
  updateRequestStatus: async (id: string, payload: any) => { const { data } = await http.patch(`/travel/requests/${id}/status`, payload); return data; },
  getExpenses: async () => { const { data } = await http.get("/travel/expenses"); return unwrapList<any>(data, ["expenses"]); },
  createExpense: async (payload: any) => { const { data } = await http.post("/travel/expenses", payload); return data; },
  updateExpenseStatus: async (id: string, payload: any) => { const { data } = await http.patch(`/travel/expenses/${id}/status`, payload); return data; },
  getPolicies: async () => { const { data } = await http.get("/travel/policies"); return unwrapList<any>(data, ["policies"]); },
  createPolicy: async (payload: any) => { const { data } = await http.post("/travel/policies", payload); return data; }
};

export const expenseApi = {
  getExpenses: async () => { const { data } = await http.get("/expenses/submissions"); return unwrapList<any>(data, ["expenses"]); },
  submitExpense: async (payload: any) => { const { data } = await http.post("/expenses/submissions", payload); return data; },
  updateExpense: async (id: string, payload: any) => { const { data } = await http.put(`/expenses/submissions/${id}`, payload); return data; },
  getWorkflows: async () => { const { data } = await http.get("/expenses/workflows"); return unwrapList<any>(data, ["workflows"]); },
  getReimbursements: async () => { const { data } = await http.get("/expenses/reimbursements"); return unwrapList<any>(data, ["reimbursements"]); },
  createReimbursement: async (payload: any) => { const { data } = await http.post("/expenses/reimbursements", payload); return data; }
};

export const assetApi = {
  list: async () => { const { data } = await http.get("/resource/asset/all"); return unwrapList<any>(data, ["assets"]); },
  assigned: async () => { const { data } = await http.get("/resource/asset/assets/assigned"); return unwrapList<any>(data, ["assets", "assignments"]); },
  create: async (payload: any) => { const { data } = await http.post("/resource/asset", payload); return data; },
  update: async (id: string, payload: any) => { const { data } = await http.patch(`/resource/asset/${id}`, payload); return data; },
  assign: async (payload: any) => { const { data } = await http.post("/resource/asset-assignment", payload); return data; },
  returnAsset: async (id: string) => { const { data } = await http.post(`/resource/asset-assignment/${id}/return`); return data; }
};

export const wellnessApi = {
  list: async () => { const { data } = await http.get("/wellness"); return unwrapList<any>(data, ["programs", "data"]); },
  create: async (payload: any) => { const { data } = await http.post("/wellness", payload); return data; },
  enroll: async (id: string) => { const { data } = await http.post(`/wellness/${id}/enroll`); return data; }
};

export const complianceApi = {
  audits: async () => { const { data } = await http.get("/compliance/audit"); return unwrapList<any>(data, ["audits", "data"]); },
  createAudit: async (payload: any) => { const { data } = await http.post("/compliance/audit", payload); return data; },
  updateAudit: async (id: string, payload: any) => { const { data } = await http.patch(`/compliance/audit/${id}`, payload); return data; }
};

export const auditApi = {
  list: async () => { const { data } = await http.get("/audit-logs"); return unwrapList<any>(data, ["logs", "data"]); },
  summary: async () => { const { data } = await http.get("/audit-logs/summary"); return unwrap<any>(data); },
  export: async () => http.get("/audit-logs/export")
};

export const reportingApi = {
  list: async () => { const { data } = await http.get("/reports"); return unwrapList<any>(data, ["reports", "data"]); },
  generate: async (payload: any) => { const { data } = await http.post("/reports", payload); return data; }
};
