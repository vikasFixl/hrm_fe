import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth-context";
import { ProtectedRoute } from "./protected-route";
import { ToastProvider } from "../../components/ui/toast";

function renderProtected(initialPath = "/hrm/dashboard") {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/hrm/login" element={<div>Login screen</div>} />
              <Route element={<ProtectedRoute />}>
                <Route path="/hrm/dashboard" element={<div>Dashboard screen</div>} />
              </Route>
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("ProtectedRoute", () => {
  it("redirects unauthenticated users to login", () => {
    window.localStorage.clear();
    renderProtected();
    expect(screen.getByText("Login screen")).toBeInTheDocument();
  });
});
