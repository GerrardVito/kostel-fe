import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  MapPin,
  UserPlus,
  Mail,
  Lock,
  Phone,
  ArrowLeft,
  Home,
  AlertCircle,
} from "lucide-react";
import { User as UserType } from "../types";
import {
  getStoredToken,
  getStoredUser,
  saveAuth,
  registerTenant,
} from "../services/auth";

interface PropertyInfo {
  property_id: number;
  property_name: string;
  address: string;
  image_urls?: string[];
  invite_code?: string;
}

export default function TenantInviteSignup() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [property, setProperty] = useState<PropertyInfo | null>(null);
  const [loadingProp, setLoadingProp] = useState(true);
  const [propError, setPropError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!code) {
        setPropError("No invite code provided.");
        setLoadingProp(false);
        return;
      }

      // Already logged in? Route per user role.
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();
      if (storedToken && storedUser) {
        if (storedUser.role === "owner") {
          navigate("/app", { replace: true });
          return;
        }
        // Tenant: check if this is their current property
        try {
          const res = await fetch(`/api/properties/code/${code}`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (res.ok) {
            const prop = await res.json();
            const memberRes = await fetch(`/api/properties/${prop.property_id}`, {
              headers: { Authorization: `Bearer ${storedToken}` },
            });
            if (memberRes.ok) {
              // If they're already a member, just go home
              navigate("/app", { replace: true });
              return;
            }
          }
        } catch {}
        // Different property — send them home where they'll see their existing tenancy
        navigate("/app", { replace: true });
        return;
      }

      // Logged out: fetch property info
      try {
        const res = await fetch(`/api/properties/code/${code}`);
        if (!res.ok) {
          setPropError("Invalid or expired invite code.");
          setLoadingProp(false);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setProperty({
          property_id: data.property_id,
          property_name: data.property_name,
          address: data.address,
          image_urls: data.image_urls,
          invite_code: data.invite_code,
        });
      } catch {
        if (!cancelled) setPropError("Failed to load property info.");
      } finally {
        if (!cancelled) setLoadingProp(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [code, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!code) return;
    setSubmitting(true);
    try {
      const { token, user } = await registerTenant({
        name,
        email,
        password,
        phone: phone || undefined,
        invite_code: code,
      });
      saveAuth(token, user);
      navigate("/app", { replace: true });
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProp) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (propError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="font-display font-bold text-lg text-slate-900">Invalid Invite</h2>
          <p className="text-xs text-slate-500 mt-1.5">{propError}</p>
          <button
            onClick={() => navigate("/", { replace: true })}
            className="mt-5 w-full py-3 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const heroImage =
    property?.image_urls && property.image_urls.length > 0
      ? property.image_urls[0]
      : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <LayoutGrid className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-primary">KOSTEL</h1>
          </div>
          <p className="text-slate-500 text-xs mt-2 font-medium tracking-wide">
            Tenant Registration
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <button
            onClick={() => navigate("/", { replace: true })}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          {/* Property preview card */}
          {property && (
            <div className="mb-5 rounded-xl border border-slate-200 overflow-hidden">
              {heroImage && (
                <img
                  src={heroImage}
                  alt={property.property_name}
                  className="w-full h-32 object-cover"
                />
              )}
              <div className="p-3.5 bg-slate-50">
                <h3 className="font-display font-bold text-slate-900 text-sm">
                  {property.property_name}
                </h3>
                {property.address && (
                  <div className="flex items-start gap-1.5 mt-1 text-xs text-slate-500">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>{property.address}</span>
                  </div>
                )}
                <p className="text-[10px] text-emerald-600 mt-2 font-semibold uppercase tracking-wider">
                  You're invited to join this property
                </p>
              </div>
            </div>
          )}

          <h2 className="font-display font-bold text-lg text-slate-900">
            Create Tenant Account
          </h2>
          <p className="text-slate-500 text-xs mb-4">
            Sign up to apply as a tenant
            {property ? ` at ${property.property_name}` : ""}.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  maxLength={25}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone (optional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+62 812 3456 7890"
                  maxLength={20}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Home className="w-4 h-4" />
                  Join Property
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate("/app", { replace: true })}
              className="text-xs text-slate-500 hover:text-primary transition-colors font-medium cursor-pointer"
            >
              Already have an account? <span className="underline">Log in</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
