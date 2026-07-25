import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AuthenticatedApp from "./AuthenticatedApp";
import GoogleCallback from "./components/GoogleCallback";
import TenantInviteSignup from "./components/TenantInviteSignup";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/invite/:code" element={<TenantInviteSignup />} />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />
      <Route path="/app/*" element={<AuthenticatedApp />} />
    </Routes>
  );
}
