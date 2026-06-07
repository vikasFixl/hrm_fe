export type DashboardWidget = {
  id: string;
  label: string;
  value: string | number;
  meta?: string;
  tone?: "blue" | "green" | "amber" | "purple" | "red";
};

export type DashboardChart = {
  id: string;
  title: string;
  type: "line" | "bar" | "pie";
  data: Array<Record<string, unknown>>;
};

export type DashboardTable = {
  id: string;
  title: string;
  columns: string[];
  rows: Array<Record<string, unknown>>;
};

export type DashboardAction = {
  label: string;
  route: string;
  icon?: string;
};

export type HrmDashboardResponse = {
  success: boolean;
  role: string;
  dashboardType: string;
  widgets: DashboardWidget[];
  charts: DashboardChart[];
  tables: DashboardTable[];
  actions: DashboardAction[];
};
