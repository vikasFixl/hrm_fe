import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./auth-context";
import { FeatureKey, canAccessFeature } from "./role-access";

export function ProtectedRoute({ feature }: { feature?: FeatureKey }) {
  const { employee, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/hrm/login" replace state={{ from: location.pathname }} />;
  }

  if (feature && !canAccessFeature(employee?.role, feature)) {
    return <Navigate to="/hrm/dashboard" replace />;
  }

  return <Outlet />;
}
