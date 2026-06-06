export type Employee = {
  _id: string;
  employeeCode: string;
  firstName: string;
  lastName?: string;
  email?: string;
  workEmail?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  departmentId?: Department | string;
  positionId?: Position | string;
  reportingManagerId?: Employee | string;
  joinDate?: string;
  employmentType?: "Permanent" | "Contract" | "Intern";
  workLocation?: "Onsite" | "Remote" | "Hybrid";
  role?: "Employee" | "Manager" | "Admin";
  status?: "Active" | "Suspended" | "Exited";
  isActive?: boolean;
  salary?: { ctc?: number; currency?: string };
  bankDetails?: {
    accountHolder?: string;
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
  };
  kycStatus?: "Pending" | "Verified";
};

export type Department = {
  _id: string;
  name: string;
  description?: string;
  head?: string | Employee;
};

export type JobPosting = {
  _id: string;
  title: string;
  departmentId: string | { _id: string; name: string };
  department?: string | { _id: string; name: string };
  position: string | Position;
  location: string;
  employmentType: "Full-Time" | "Part-Time" | "Contract" | "Internship";
  description: string;
  qualifications: string[];
  responsibilities: string[];
  tags: string[];
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  openingCount: number;
  isPublished: boolean;
  closingDate?: string;
  status: "Open" | "Closed" | "Filled" | "Draft";
};

export type Candidate = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  location: string;
  linkedInProfile: string;
  portfolio?: string;
  resumeKey?: string;
  resumeBucket?: string;
  coverLetter?: string;
  jobApplication: string | JobPosting;
  source: "LinkedIn" | "Indeed" | "Referral" | "Walk-in" | "Other";
  referral?: string;
  skills: string[];
  experience: number;
  education: string;
  expectedSalary: number;
  currentSalary: number;
  noticePeriod: string;
  status: string;
  tags?: string[];
  rating?: number;
  resumeScore?: number;
  // Summary fields from list API
  name?: string;
  jobTitle?: string;
  interviewCount?: number;
  offerStatus?: string;
};

export type Interview = {
  _id: string;
  candidate: string | Candidate;
  jobPosting: string | JobPosting;
  interviewer: string | Employee;
  scheduledDate: string;
  interviewType: 'Phone' | 'Video' | 'In-person';
  panel?: (string | Employee)[];
  meetingUrl?: string;
  meetingId?: string;
  timezone?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  feedbacks?: {
    interviewer: string | Employee;
    comments: string;
    rating: number;
    createdAt: string;
  }[];
  followUp?: string;
};

export type Offer = {
  _id: string;
  candidate: string | Candidate;
  jobPosting: string | JobPosting;
  position: string | Position;
  offerDate: string;
  acceptedDate?: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  offerDetails: {
    baseSalary: number;
    bonus?: number;
    currency?: string;
    payFrequency?: 'Monthly' | 'Annually';
    benefits?: string[];
    jobTitle?: string;
    location?: string;
  };
  signedDocumentUrl?: string;
};

export type RecruitmentAnalytics = {
  _id: string;
  jobPosting: string | JobPosting;
  totalApplicants: number;
  totalInterviews: number;
  totalOffers: number;
  totalHires: number;
  averageTimeToHire: number;
  offerConversionRate: number;
  hireConversionRate: number;
  sourceBreakdown: {
    linkedIn: number;
    indeed: number;
    referral: number;
    walkIn: number;
    other: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type SalaryComponent = {
  key: string;
  label?: string;
  type: "EARNING" | "DEDUCTION";
  mode: "AMOUNT" | "PERCENT";
  value: number;
  isTaxable?: boolean;
};

export type SalaryConfig = {
  _id: string;
  employee: string | Employee;
  salaryType: "Hourly" | "Monthly" | "Weekly";
  base: number;
  components: SalaryComponent[];
  currency: string;
  bonusEligible: boolean;
  effectiveFrom: string;
  status: "Active" | "Inactive" | "Archived";
};

export type Payroll = {
  _id: string;
  employee: string | Employee;
  payrollPeriod: string;
  payrollCycleName?: string;
  components: (SalaryComponent & { amount: number })[];
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  currency: string;
  status: "Pending" | "Processed" | "Approved" | "Paid" | "Failed" | "Reversed";
};

export type Position = {
  _id: string;
  title: string;
  level?: "Junior" | "Mid" | "Senior" | "Lead" | "Executive";
  description?: string;
  department?: Department | string;
  isActive?: boolean;
};

export type LeaveRequest = {
  _id: string;
  employeeId?: Employee | string;
  leaveType: string;
  startDate: string;
  endDate: string;
  isHalfDay?: boolean;
  halfDaySession?: "FIRST_HALF" | "SECOND_HALF" | null;
  hours?: number;
  reason?: string;
  status: "Pending" | "Approved" | "Rejected";
  approvedBy?: Employee | string;
  approvedAt?: string;
};

export type DailyAttendance = {
  _id: string;
  employeeId?: Employee | string;
  date: string;
  firstIn?: string;
  lastOut?: string;
  totalWorkMinutes?: number;
  lateMinutes?: number;
  earlyMinutes?: number;
  overtimeMinutes?: number;
  status: "Present" | "Absent" | "HalfDay" | "Leave" | "Holiday" | "Weekend";
  source?: "system" | "regularized" | "manual";
  isLocked?: boolean;
};

export type RawTimeLog = {
  _id: string;
  timestamp: string;
  logicalDay: string;
  punchType: "IN" | "OUT";
  source: "mobile" | "web" | "biometric" | "admin";
};

export type HrmEmployeeSession = {
  employeeId: string;
  employeeCode: string;
  role: string;
  organizationId: string;
  organizationName: string;
};

export type LoginResponse =
  | { loginType: "DIRECT"; employee: HrmEmployeeSession }
  | { loginType: "MULTI_ORG"; tempToken: string; organizations: HrmEmployeeSession[] }
  | { loginType: "MFA_REQUIRED"; mfaToken: string; message: string }
  | { loginType: "ONBOARDING_PENDING"; onboardingStatus: string; redirectTo: string };

// --- PERFORMANCE MANAGEMENT TYPES ---
export type PerformanceAppraisal = {
  id?: string;
  _id?: string;
  employee: any;
  period: string;
  rating: number;
  criteria: { label: string; score: number; comments: string }[];
  comments?: string;
  managerComments?: string;
  reviewedBy?: any;
  recommendation?: string;
  status: string;
  appraisalDate: string;
};

export type Goal = {
  id?: string;
  _id?: string;
  employee: any;
  goal: string;
  keyPerformanceIndicators: string[];
  targetDate: string;
  status: string;
  progress: number;
};

export type ImprovementPlan = {
  id?: string;
  _id?: string;
  employee: any;
  createdBy?: any;
  planDate: string;
  objectives: string[];
  actions: string[];
  timeline: string;
  status: string;
  managerComments?: string;
};

export type Feedback = {
  id?: string;
  _id?: string;
  employee: any;
  feedbackType: string;
  feedbackFrom?: any;
  rating: number;
  comments: string;
  feedbackDate: string;
};

// --- EXPENSE MANAGEMENT TYPES ---
export type ExpenseSubmission = {
  id?: string;
  _id?: string;
  employee: any;
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  description?: string;
  receiptUrl?: string;
  status: string;
  approver?: any;
};

export type Reimbursement = {
  id?: string;
  _id?: string;
  employee: any;
  expenses: any[];
  totalAmount: number;
  reimbursementDate: string;
  paymentMethod: string;
  paymentReference?: string;
  status: string;
  processedBy?: any;
  notes?: string;
};

// --- TRAINING & DEVELOPMENT TYPES ---
export type TrainingSession = {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  instructor: any;
  participants: any[];
  status: string;
};

export type LearningMaterial = {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  materialType: string;
  fileUrl: string;
};

export type CertificationTracking = {
  id?: string;
  _id?: string;
  employee: any;
  certificationName: string;
  certificationDate: string;
  expirationDate?: string;
  issuingOrganization: string;
  certificationUrl?: string;
  status: string;
};

// --- SURVEYS & FEEDBACK TYPES ---
export type SurveyDelivery = {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  questions: any[];
  audience: string;
  department?: any;
  startDate: string;
  endDate: string;
  status: string;
  responseCount: number;
};

export type EmployeeFeedback = {
  id?: string;
  _id?: string;
  employee?: any;
  category: string;
  message: string;
  sentiment: string;
  isAnonymous: boolean;
};

export type ActionPlanTracking = {
  id?: string;
  _id?: string;
  survey: any;
  title: string;
  description?: string;
  owner: any;
  dueDate: string;
  priority: string;
  status: string;
  progress: number;
  notes?: string;
};

// --- TRAVEL MANAGEMENT TYPES ---
export type TravelRequest = {
  id?: string;
  _id?: string;
  employee: any;
  destination: string;
  purpose: string;
  travelType: string;
  departureDate: string;
  returnDate: string;
  modeOfTransport: string;
  estimatedCost: number;
  travelPolicy?: any;
  travelPolicyMatched: boolean;
  policyReason?: string;
  status: string;
  approver?: any;
  approvedDate?: string;
  notes?: string;
};

export type TravelExpense = {
  id?: string;
  _id?: string;
  travelRequest: any;
  employee: any;
  category: string;
  amount: number;
  approvedAmount: number;
  currency: string;
  expenseDate: string;
  receiptUrl?: string;
  description?: string;
  status: string;
  approver?: any;
  approvedDate?: string;
};

export type TravelPolicy = {
  id?: string;
  _id?: string;
  policyName: string;
  maxBudget: number;
  maxPerCategory: any;
  allowedModes: string[];
  applicableTo: string;
  internationalApprovalRequired: boolean;
  active: boolean;
};


