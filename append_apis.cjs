const fs = require('fs');
const path = 'c:/Users/vikas/OneDrive/Desktop/erp/ERP_FE/src/api/hrm-api.ts';
let content = fs.readFileSync(path, 'utf8');

const additionalAPIs = `
// Restored APIs
export const recruitmentApi = {
  listJobs: async () => { const { data } = await http.get("/recruitment/jobs/all"); return unwrapList<any>(data, ["jobPostings", "jobs"]); },
  createJob: async (payload: any) => { const { data } = await http.post("/recruitment/jobs", payload); return data; },
  updateJob: async (id: string, payload: any) => { const { data } = await http.patch(\`/recruitment/jobs/\${id}\`, payload); return data; },
  removeJob: async (id: string) => http.delete(\`/recruitment/jobs/\${id}\`),
  getCandidate: async (id: string) => { const { data } = await http.get(\`/recruitment/candidates/\${id}\`); return data; },
  listCandidates: async () => { const { data } = await http.get("/recruitment/candidates/all"); return unwrapList<any>(data, ["candidates"]); },
  updateCandidate: async (id: string, payload: any) => { const { data } = await http.patch(\`/recruitment/candidates/\${id}\`, payload); return data; },
  scheduleInterview: async (payload: any) => { const { data } = await http.post("/recruitment/interviews", payload); return data; },
  listInterviews: async () => { const { data } = await http.get("/recruitment/interviews/all"); return unwrapList<any>(data, ["interviews"]); },
  createOffer: async (payload: any) => { const { data } = await http.post("/recruitment/offers", payload); return data; },
  listOffers: async () => { const { data } = await http.get("/recruitment/offers/all"); return unwrapList<any>(data, ["offers"]); },
  getAnalytics: async () => { const { data } = await http.get("/recruitment/analytics"); return data; }
};

export const performanceApi = {
  getAppraisals: async () => { const { data } = await http.get("/performance/appraisals"); return unwrapList<any>(data, ["appraisals"]); },
  createAppraisal: async (payload: any) => { const { data } = await http.post("/performance/appraisals", payload); return data; },
  getGoals: async () => { const { data } = await http.get("/performance/goals"); return unwrapList<any>(data, ["goals"]); },
  createGoal: async (payload: any) => { const { data } = await http.post("/performance/goals", payload); return data; },
  getPIPs: async () => { const { data } = await http.get("/performance/pips"); return unwrapList<any>(data, ["pips"]); },
  createPIP: async (payload: any) => { const { data } = await http.post("/performance/pips", payload); return data; },
  getFeedback: async () => { const { data } = await http.get("/performance/feedback"); return unwrapList<any>(data, ["feedback"]); },
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
  getPolicies: async () => { const { data } = await http.get("/travel/policies"); return unwrapList<any>(data, ["policies"]); }
};

export const expenseApi = {
  getExpenses: async () => { const { data } = await http.get("/expense/submissions"); return unwrapList<any>(data, ["expenses"]); },
  submitExpense: async (payload: any) => { const { data } = await http.post("/expense/submissions", payload); return data; },
  updateExpense: async (id: string, payload: any) => { const { data } = await http.patch(\`/expense/submissions/\${id}\`, payload); return data; },
  getReimbursements: async () => { const { data } = await http.get("/expense/reimbursements"); return unwrapList<any>(data, ["reimbursements"]); }
};
`;

if (!content.includes('export const recruitmentApi')) {
  fs.writeFileSync(path, content + additionalAPIs);
}
console.log('Appended missing APIs');
