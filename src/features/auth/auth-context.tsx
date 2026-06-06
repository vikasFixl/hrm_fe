import { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/hrm-api";
import { HrmEmployeeSession, LoginResponse } from "../../api/types";
import { getErrorMessage } from "../../api/http";
import { useToast } from "../../components/ui/toast";

type PendingAuth =
  | { type: "MFA"; mfaToken: string }
  | { type: "MULTI_ORG"; tempToken: string; organizations: HrmEmployeeSession[] }
  | null;

type AuthContextValue = {
  employee: HrmEmployeeSession | null;
  pendingAuth: PendingAuth;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyMfa: (token: string) => Promise<void>;
  selectOrg: (organizationId: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const storageKey = "erp_hrm_employee";

function readStoredEmployee() {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as HrmEmployeeSession;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<HrmEmployeeSession | null>(() => readStoredEmployee());
  const [pendingAuth, setPendingAuth] = useState<PendingAuth>(null);
  const navigate = useNavigate();
  const { notify } = useToast();

  const completeLogin = useCallback(
    (session: HrmEmployeeSession) => {
      setEmployee(session);
      window.localStorage.setItem(storageKey, JSON.stringify(session));
      setPendingAuth(null);
      navigate("/hrm/dashboard", { replace: true });
    },
    [navigate]
  );

  const handleLoginResponse = useCallback(
    (response: LoginResponse) => {
      if (response.loginType === "DIRECT") {
        completeLogin(response.employee);
        return;
      }
      if (response.loginType === "MFA_REQUIRED") {
        setPendingAuth({ type: "MFA", mfaToken: response.mfaToken });
        navigate("/hrm/login", { replace: true });
        return;
      }
      if (response.loginType === "MULTI_ORG") {
        setPendingAuth({
          type: "MULTI_ORG",
          tempToken: response.tempToken,
          organizations: response.organizations
        });
        navigate("/hrm/select-org", { replace: true });
        return;
      }
      navigate(response.redirectTo || "/hrm/onboarding/start", { replace: true });
    },
    [completeLogin, navigate]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        handleLoginResponse(await authApi.login({ email, password }));
      } catch (error) {
        notify(getErrorMessage(error), "error");
      }
    },
    [handleLoginResponse, notify]
  );

  const verifyMfa = useCallback(
    async (token: string) => {
      if (!pendingAuth || pendingAuth.type !== "MFA") return;
      try {
        handleLoginResponse(await authApi.verifyMfa({ mfaToken: pendingAuth.mfaToken, token }));
      } catch (error) {
        notify(getErrorMessage(error), "error");
      }
    },
    [handleLoginResponse, notify, pendingAuth]
  );

  const selectOrg = useCallback(
    async (organizationId: string) => {
      if (!pendingAuth || pendingAuth.type !== "MULTI_ORG") return;
      try {
        handleLoginResponse(await authApi.selectOrg({ tempToken: pendingAuth.tempToken, organizationId }));
      } catch (error) {
        notify(getErrorMessage(error), "error");
      }
    },
    [handleLoginResponse, notify, pendingAuth]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Logout should still clear the local shell if the backend session is already gone.
    }
    setEmployee(null);
    setPendingAuth(null);
    window.localStorage.removeItem(storageKey);
    navigate("/hrm/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const handleForceLogout = () => {
      logout();
    };
    window.addEventListener("auth-logout", handleForceLogout);
    return () => window.removeEventListener("auth-logout", handleForceLogout);
  }, [logout]);

  const value = useMemo(
    () => ({
      employee,
      pendingAuth,
      isAuthenticated: Boolean(employee),
      login,
      verifyMfa,
      selectOrg,
      logout
    }),
    [employee, login, logout, pendingAuth, selectOrg, verifyMfa]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
