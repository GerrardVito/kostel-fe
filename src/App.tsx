import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import GoogleCallback from "./components/GoogleCallback";
import TenantInviteSignup from "./components/TenantInviteSignup";
import TenantApp from "./apps/tenant/TenantApp";
import AdminApp from "./apps/admin/AdminApp";

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/invite/:code" element={<TenantInviteSignup />} />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />

      {/* Tenant app */}
      <Route path="/app/tenants/*" element={<TenantApp />} />

      {/* Admin/Owner app */}
      <Route path="/app/admins/*" element={<AdminApp />} />

      {/* Legacy redirect - redirect /app to /app/admins */}
      <Route path="/app/*" element={<Navigate to="/app/admins" replace />} />
    </Routes>
  );
}
