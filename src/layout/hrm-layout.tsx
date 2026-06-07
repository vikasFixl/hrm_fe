import { type ReactNode, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart2,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  CalendarCheck,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  CreditCard,
  FileCheck2,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  Palette,
  Plane,
  PlusCircle,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import clsx from "clsx";
import { Button } from "../components/ui/button";
import { Avatar } from "../components/ui/avatar";
import { useAuth } from "../features/auth/auth-context";
import { FeatureKey, canAccessFeature } from "../features/auth/role-access";

type ModuleKey =
  | "dashboard"
  | "people"
  | "attendance"
  | "leave"
  | "payroll"
  | "recruitment"
  | "performance"
  | "learning"
  | "resources"
  | "travel"
  | "expenses"
  | "reports"
  | "audit"
  | "settings";

type ModuleNavItem = {
  key: ModuleKey;
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  features: FeatureKey[];
  paths: string[];
};

type SubNavItem = {
  label: string;
  to: string;
  feature: FeatureKey;
};

type CommandItem = {
  label: string;
  description: string;
  to: string;
  feature: FeatureKey;
  group: "Pages" | "Create" | "Workflow";
};

type TopbarMenu = "org" | "quick" | "messages" | "notifications" | "theme" | "profile" | null;

const modules: ModuleNavItem[] = [
  { key: "dashboard", label: "Dashboard", to: "/hrm/dashboard", icon: LayoutDashboard, features: ["dashboard"], paths: ["/hrm/dashboard"] },
  { key: "people", label: "People", to: "/hrm/employees", icon: Users, features: ["employees", "organization"], paths: ["/hrm/employees", "/hrm/lifecycle", "/hrm/departments", "/hrm/positions"] },
  { key: "attendance", label: "Attendance", to: "/hrm/attendance", icon: CalendarCheck, features: ["attendance"], paths: ["/hrm/attendance"] },
  { key: "leave", label: "Leave", to: "/hrm/leave", icon: ClipboardList, features: ["leave"], paths: ["/hrm/leave"] },
  { key: "payroll", label: "Payroll", to: "/hrm/payroll", icon: CreditCard, features: ["payroll"], paths: ["/hrm/payroll"] },
  { key: "recruitment", label: "Recruitment", to: "/hrm/jobs", icon: Briefcase, features: ["recruitment"], paths: ["/hrm/jobs", "/hrm/candidates", "/hrm/interviews", "/hrm/offers", "/hrm/recruitment-analytics"] },
  { key: "performance", label: "Performance", to: "/hrm/performance", icon: Star, features: ["performance", "surveys"], paths: ["/hrm/performance", "/hrm/surveys"] },
  { key: "learning", label: "Learning", to: "/hrm/training", icon: BookOpen, features: ["training", "wellness"], paths: ["/hrm/training", "/hrm/wellness"] },
  { key: "resources", label: "Resources", to: "/hrm/assets", icon: Package, features: ["assets"], paths: ["/hrm/assets"] },
  { key: "travel", label: "Travel", to: "/hrm/travel", icon: Plane, features: ["travel"], paths: ["/hrm/travel"] },
  { key: "expenses", label: "Expenses", to: "/hrm/expenses", icon: FileText, features: ["expenses"], paths: ["/hrm/expenses"] },
  { key: "reports", label: "Reports", to: "/hrm/reports", icon: BarChart2, features: ["reports"], paths: ["/hrm/reports"] },
  { key: "audit", label: "Audit", to: "/hrm/audit-logs", icon: FileCheck2, features: ["audit", "compliance"], paths: ["/hrm/audit-logs", "/hrm/compliance"] },
  { key: "settings", label: "Settings", to: "/hrm/settings", icon: Settings, features: ["settings"], paths: ["/hrm/settings"] },
];

const secondaryNav: Partial<Record<ModuleKey, SubNavItem[]>> = {
  people: [
    { label: "Employees", to: "/hrm/employees", feature: "employees" },
    { label: "Onboarding & Offboarding", to: "/hrm/lifecycle", feature: "employees" },
    { label: "Departments", to: "/hrm/departments", feature: "organization" },
    { label: "Positions", to: "/hrm/positions", feature: "organization" },
    { label: "Assets", to: "/hrm/assets", feature: "assets" },
  ],
  recruitment: [
    { label: "Jobs", to: "/hrm/jobs", feature: "recruitment" },
    { label: "Candidates", to: "/hrm/candidates", feature: "recruitment" },
    { label: "Interviews", to: "/hrm/interviews", feature: "recruitment" },
    { label: "Offers", to: "/hrm/offers", feature: "recruitment" },
    { label: "Analytics", to: "/hrm/recruitment-analytics", feature: "recruitment" },
  ],
  performance: [
    { label: "Goals & Reviews", to: "/hrm/performance", feature: "performance" },
    { label: "Surveys", to: "/hrm/surveys", feature: "surveys" },
  ],
  learning: [
    { label: "Training", to: "/hrm/training", feature: "training" },
    { label: "Wellness", to: "/hrm/wellness", feature: "wellness" },
  ],
  audit: [
    { label: "Audit Logs", to: "/hrm/audit-logs", feature: "audit" },
    { label: "Compliance", to: "/hrm/compliance", feature: "compliance" },
  ],
};

const titles: Record<string, string> = {
  dashboard: "Dashboard",
  employees: "People",
  lifecycle: "People",
  departments: "People",
  positions: "People",
  leave: "Leave",
  attendance: "Attendance",
  jobs: "Recruitment",
  candidates: "Recruitment",
  interviews: "Recruitment",
  offers: "Recruitment",
  "recruitment-analytics": "Recruitment",
  payroll: "Payroll",
  performance: "Performance",
  training: "Learning",
  surveys: "Performance",
  expenses: "Expenses",
  travel: "Travel",
  assets: "Resources",
  wellness: "Learning",
  compliance: "Audit",
  "audit-logs": "Audit",
  reports: "Reports",
  settings: "Settings",
};

const pinnedRoutes = [
  "/hrm/dashboard",
  "/hrm/employees",
  "/hrm/attendance",
  "/hrm/payroll",
  "/hrm/reports",
];

const recentStorageKey = "erp_hrm_recent_pages";

function moduleIsAllowed(role: string | undefined, module: ModuleNavItem) {
  return module.features.some((feature) => canAccessFeature(role, feature));
}

function getActiveModule(pathname: string) {
  return modules.find((module) => module.paths.some((path) => pathname.startsWith(path))) || modules[0];
}

function readRecents() {
  try {
    return JSON.parse(window.localStorage.getItem(recentStorageKey) || "[]") as string[];
  } catch {
    return [];
  }
}

export function HrmLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [topbarMenu, setTopbarMenu] = useState<TopbarMenu>(null);
  const [recentPages, setRecentPages] = useState<string[]>(() => readRecents());
  const location = useLocation();
  const navigate = useNavigate();
  const { employee, logout } = useAuth();
  const empName = employee?.employeeCode || "User";
  const activeModule = getActiveModule(location.pathname);
  const routeKey = location.pathname.split("/")[2] || "dashboard";
  const title = titles[routeKey] || activeModule.label;

  const visibleModules = useMemo(
    () => modules.filter((module) => moduleIsAllowed(employee?.role, module)),
    [employee?.role]
  );

  const visibleSecondaryNav = useMemo(
    () => (secondaryNav[activeModule.key] || []).filter((item) => canAccessFeature(employee?.role, item.feature)),
    [activeModule.key, employee?.role]
  );

  const commands = useMemo<CommandItem[]>(() => {
    const pageCommands: CommandItem[] = modules.flatMap((module) => {
      const items = secondaryNav[module.key];
      if (!items?.length) {
        return [{ label: module.label, description: "Open module", to: module.to, feature: module.features[0], group: "Pages" as const }];
      }
      return items.map((item) => ({
        label: item.label,
        description: module.label,
        to: item.to,
        feature: item.feature,
        group: "Pages" as const,
      }));
    });

    const actionCommands: CommandItem[] = [
      ...pageCommands,
      { label: "Create Employee", description: "Start a new employee profile", to: "/hrm/employees", feature: "employees", group: "Create" },
      { label: "Create Job Posting", description: "Open recruitment jobs", to: "/hrm/jobs", feature: "recruitment", group: "Create" },
      { label: "Submit Leave", description: "Open leave workflow", to: "/hrm/leave", feature: "leave", group: "Workflow" },
      { label: "Generate Payroll", description: "Open payroll processing", to: "/hrm/payroll", feature: "payroll", group: "Workflow" },
      { label: "Search Reports", description: "Open reports", to: "/hrm/reports", feature: "reports", group: "Workflow" },
    ];

    return actionCommands.filter((item) => canAccessFeature(employee?.role, item.feature));
  }, [employee?.role]);

  const filteredCommands = useMemo(() => {
    const query = commandQuery.trim().toLowerCase();
    if (!query) return commands;
    return commands.filter((command) =>
      [command.label, command.description, command.group].join(" ").toLowerCase().includes(query)
    );
  }, [commandQuery, commands]);

  const routeLabels = useMemo(() => {
    const labels = new Map<string, string>();
    commands.forEach((command) => labels.set(command.to, command.label));
    modules.forEach((module) => labels.set(module.to, module.label));
    return labels;
  }, [commands]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const next = [location.pathname, ...recentPages.filter((path) => path !== location.pathname)].slice(0, 6);
    setRecentPages(next);
    window.localStorage.setItem(recentStorageKey, JSON.stringify(next));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  function goTo(path: string) {
    navigate(path);
    setCommandOpen(false);
    setSidebarOpen(false);
    setTopbarMenu(null);
    setCommandQuery("");
  }

  function toggleTopbarMenu(menu: Exclude<TopbarMenu, null>) {
    setTopbarMenu((current) => (current === menu ? null : menu));
  }

  return (
    <div className={clsx("app-shell", sidebarCollapsed && "sidebar-collapsed")}>
      {sidebarOpen && <div className="mobile-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={clsx("sidebar", sidebarOpen && "mobile-open")}>
        <div className="brand">
          <span className="brand-mark">HR</span>
          <span className="brand-label">HRMS</span>
          <Button
            className="sidebar-collapse"
            variant="ghost"
            size="sm"
            iconOnly
            icon={sidebarCollapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
            onClick={() => setSidebarCollapsed((value) => !value)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          />
        </div>

        <nav className="primary-nav" aria-label="Primary modules">
          {visibleModules.map((module) => {
            const Icon = module.icon;
            return (
              <NavLink
                key={module.key}
                to={module.to}
                className={clsx("nav-item", activeModule.key === module.key && "active")}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} />
                <span className="nav-label">{module.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <Avatar name={empName} size="sm" />
            <div className="sidebar-user-copy">
              <strong>{empName}</strong>
              <span>{employee?.organizationName || "HRM"}</span>
            </div>
            <Button variant="ghost" size="sm" iconOnly icon={<LogOut size={15} />} onClick={logout} aria-label="Logout" />
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-meta">
            <div className="breadcrumb">
              <span>{activeModule.label}</span>
              <strong>{title}</strong>
            </div>
          </div>

          <div className="topbar-meta topbar-actions">
            <button className="topbar-search" type="button" onClick={() => setCommandOpen(true)} aria-label="Open command palette">
              <Search size={15} />
              <span>Search pages, employees, reports...</span>
              <kbd>Ctrl K</kbd>
            </button>
            <Button className="topbar-org" variant="secondary" icon={<Building2 size={16} />} onClick={() => toggleTopbarMenu("org")} aria-label="Organization">
              {employee?.organizationName || "Organization"}
            </Button>
            <Button className="topbar-quick" variant="primary" icon={<PlusCircle size={16} />} onClick={() => toggleTopbarMenu("quick")}>Quick Action</Button>
            <Button variant="ghost" iconOnly icon={<MessageSquare size={18} />} onClick={() => toggleTopbarMenu("messages")} aria-label="Messages" />
            <Button variant="ghost" iconOnly icon={<Bell size={18} />} onClick={() => toggleTopbarMenu("notifications")} aria-label="Notifications" />
            <Button variant="ghost" iconOnly icon={<Palette size={18} />} onClick={() => toggleTopbarMenu("theme")} aria-label="Theme settings" />
            <Button variant="ghost" iconOnly icon={<Settings size={18} />} onClick={() => goTo("/hrm/settings")} aria-label="Settings" />
            <button className="avatar-button" type="button" onClick={() => toggleTopbarMenu("profile")} aria-label="Profile menu">
              <Avatar name={empName} size="sm" />
            </button>
          </div>
          {topbarMenu && (
            <TopbarPopover
              menu={topbarMenu}
              employeeName={empName}
              organizationName={employee?.organizationName || "Organization"}
              onNavigate={goTo}
              onOpenCommand={() => {
                setCommandOpen(true);
                setTopbarMenu(null);
              }}
              onLogout={logout}
            />
          )}
        </header>

        <div className="content">
          {visibleSecondaryNav.length > 0 && (
            <nav className="secondary-nav" aria-label={`${activeModule.label} navigation`}>
              {visibleSecondaryNav.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => clsx("secondary-nav-item", isActive && "active")}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}

          <Outlet />
        </div>
      </main>

      <nav className="mobile-bottom-nav" aria-label="Mobile primary navigation">
        {visibleModules.map((module) => {
          const Icon = module.icon;
          return (
            <button key={module.key} type="button" className={clsx(activeModule.key === module.key && "active")} onClick={() => goTo(module.to)}>
              <Icon size={18} />
              <span>{module.label}</span>
            </button>
          );
        })}
      </nav>

      {commandOpen && (
        <div className="command-backdrop" role="presentation" onClick={() => setCommandOpen(false)}>
          <section className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette" onClick={(event) => event.stopPropagation()}>
            <div className="command-input">
              <Search size={18} />
              <input autoFocus value={commandQuery} onChange={(event) => setCommandQuery(event.target.value)} placeholder="Search pages, employees, departments, reports..." />
              <Button variant="ghost" size="sm" iconOnly icon={<X size={16} />} onClick={() => setCommandOpen(false)} aria-label="Close command palette" />
            </div>

            {!commandQuery && (
              <div className="command-quick-grid">
                <CommandGroup title="Pinned Pages" routes={pinnedRoutes.filter((path) => commands.some((command) => command.to === path))} labels={routeLabels} onSelect={goTo} />
                <CommandGroup title="Recent Pages" routes={recentPages.filter((path) => commands.some((command) => command.to === path))} labels={routeLabels} onSelect={goTo} />
              </div>
            )}

            <div className="command-results">
              {(["Pages", "Create", "Workflow"] as const).map((group) => {
                const items = filteredCommands.filter((command) => command.group === group);
                if (!items.length) return null;
                return (
                  <div className="command-group" key={group}>
                    <h3>{group}</h3>
                    {items.map((command) => (
                      <button key={`${command.group}-${command.to}-${command.label}`} type="button" className="command-item" onClick={() => goTo(command.to)}>
                        <span>{command.label}</span>
                        <small>{command.description}</small>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function CommandGroup({ title, routes, labels, onSelect }: { title: string; routes: string[]; labels: Map<string, string>; onSelect: (path: string) => void }) {
  if (!routes.length) return null;
  return (
    <div className="command-group compact">
      <h3>{title}</h3>
      {routes.map((route) => (
        <button key={`${title}-${route}`} type="button" className="command-item" onClick={() => onSelect(route)}>
          <span>{labels.get(route) || route.replace("/hrm/", "").replace(/-/g, " ")}</span>
          <small>Quick access</small>
        </button>
      ))}
    </div>
  );
}

function TopbarPopover({
  menu,
  employeeName,
  organizationName,
  onNavigate,
  onOpenCommand,
  onLogout,
}: {
  menu: Exclude<TopbarMenu, null>;
  employeeName: string;
  organizationName: string;
  onNavigate: (path: string) => void;
  onOpenCommand: () => void;
  onLogout: () => void;
}) {
  const content: Record<Exclude<TopbarMenu, null>, ReactNode> = {
    org: (
      <>
        <TopbarMenuHeader title="Organization" description={organizationName} />
        <button className="topbar-menu-item" type="button" onClick={() => onNavigate("/hrm/settings")}>Organization settings</button>
        <button className="topbar-menu-item" type="button" onClick={() => onOpenCommand()}>Search organizations</button>
      </>
    ),
    quick: (
      <>
        <TopbarMenuHeader title="Quick Actions" description="Start common HR workflows" />
        <button className="topbar-menu-item" type="button" onClick={() => onNavigate("/hrm/employees")}>Create employee</button>
        <button className="topbar-menu-item" type="button" onClick={() => onNavigate("/hrm/jobs")}>Create job posting</button>
        <button className="topbar-menu-item" type="button" onClick={() => onNavigate("/hrm/leave")}>Submit leave request</button>
        <button className="topbar-menu-item" type="button" onClick={() => onOpenCommand()}>Open command palette</button>
      </>
    ),
    messages: (
      <>
        <TopbarMenuHeader title="Messages" description="No unread HR messages" />
        <button className="topbar-menu-item" type="button" onClick={() => onNavigate("/hrm/employees")}>Open people directory</button>
      </>
    ),
    notifications: (
      <>
        <TopbarMenuHeader title="Notifications" description="Approval and workflow updates" />
        <button className="topbar-menu-item" type="button" onClick={() => onNavigate("/hrm/leave")}>Pending leave approvals</button>
        <button className="topbar-menu-item" type="button" onClick={() => onNavigate("/hrm/attendance")}>Attendance exceptions</button>
      </>
    ),
    theme: (
      <>
        <TopbarMenuHeader title="Theme" description="Light glass theme active" />
        <button className="topbar-menu-item active" type="button">Light glass</button>
        <button className="topbar-menu-item" type="button" onClick={() => onNavigate("/hrm/settings")}>Theme settings</button>
      </>
    ),
    profile: (
      <>
        <TopbarMenuHeader title={employeeName} description={organizationName} />
        <button className="topbar-menu-item" type="button" onClick={() => onNavigate("/hrm/settings")}>Profile settings</button>
        <button className="topbar-menu-item danger" type="button" onClick={onLogout}>Logout</button>
      </>
    ),
  };

  return <div className="topbar-popover">{content[menu]}</div>;
}

function TopbarMenuHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="topbar-menu-header">
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}
