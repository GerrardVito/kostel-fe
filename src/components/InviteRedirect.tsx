import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";

export default function InviteRedirect() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      localStorage.setItem("kostel_invite_code", code.toUpperCase());
    }
    navigate("/app", { replace: true });
  }, [code, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-xs font-semibold text-slate-500">Redirecting...</p>
      </div>
    </div>
  );
}
