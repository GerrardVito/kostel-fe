import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

export default function GoogleCallback() {
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get("token");
    const userRaw = params.get("user");

    if (token && userRaw) {
      try {
        const user = JSON.parse(decodeURIComponent(userRaw));
        window.opener?.postMessage(
          { type: "google-auth", token, user },
          window.location.origin
        );
      } catch (e) {
        console.error("Failed to parse Google auth callback:", e);
      }
    }

    // Close the popup after a short delay to ensure the message is sent
    setTimeout(() => window.close(), 200);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-xs font-semibold text-slate-500">
          Completing sign in...
        </p>
      </div>
    </div>
  );
}
