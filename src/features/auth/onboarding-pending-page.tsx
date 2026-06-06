import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";

export function OnboardingPendingPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <ClipboardList size={34} />
        <h1>Onboarding pending</h1>
        <p>Your HRM profile exists, but onboarding has not been started in the backend yet.</p>
        <Link className="btn btn-primary" to="/hrm/login">Back to login</Link>
      </section>
    </main>
  );
}
