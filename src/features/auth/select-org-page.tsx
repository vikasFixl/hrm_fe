import { Navigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { useAuth } from "./auth-context";

export function SelectOrgPage() {
  const { pendingAuth, selectOrg } = useAuth();

  if (!pendingAuth || pendingAuth.type !== "MULTI_ORG") {
    return <Navigate to="/hrm/login" replace />;
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Building2 size={34} />
        <h1>Select organization</h1>
        <p>Your account has HRM access in multiple organizations.</p>
        <div className="form-grid">
          {pendingAuth.organizations.map((org) => (
            <Card key={org.organizationId}>
              <div className="section-head">
                <div>
                  <strong>{org.organizationName}</strong>
                  <div className="muted">{org.employeeCode} · {org.role}</div>
                </div>
                <Button onClick={() => selectOrg(org.organizationId)}>Open</Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
