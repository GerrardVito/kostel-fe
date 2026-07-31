import { useState, useEffect, useCallback } from "react";
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
  LogIn,
  Chrome,
} from "lucide-react";
import { User as UserType } from "../types";
import {
  getStoredToken,
  getStoredUser,
  saveAuth,
  registerTenant,
  login,
  joinProperty,
  openGoogleLogin,
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

  // Mode: signup or login
  const [mode, setMode] = useState<"signup" | "login">("signup");

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

      // Already logged in? Try to join property, then redirect.
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();
      if (storedToken && storedUser) {
        try {
          const { token: newToken, user: newUser } = await joinProperty(code, storedToken);
          saveAuth(newToken, newUser);
          navigate(newUser.role === "owner" ? "/app/admins" : "/app/tenants", { replace: true });
        } catch {
          // Already a member or error — just go to app
          navigate(storedUser.role === "owner" ? "/app/admins" : "/app/tenants", { replace: true });
        }
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

  // Listen for Google OAuth callback
  useEffect(() => {
    const handler = async (e: MessageEvent) => {
      if (e.data?.type === "google-auth" && e.data.token && e.data.user) {
        const { token: oauthToken, user: oauthUser } = e.data;
        saveAuth(oauthToken, oauthUser);
        // Now join the property with the invite code
        if (code) {
          try {
            const { token: newToken, user: newUser } = await joinProperty(code, oauthToken);
            saveAuth(newToken, newUser);
            navigate(newUser.role === "owner" ? "/app/admins" : "/app/tenants", { replace: true });
          } catch {
            navigate(oauthUser.role === "owner" ? "/app/admins" : "/app/tenants", { replace: true });
          }
        } else {
          navigate(oauthUser.role === "owner" ? "/app/admins" : "/app/tenants", { replace: true });
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [code, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
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
      navigate("/app/tenants", { replace: true });
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!code) return;
    setSubmitting(true);
    try {
      const { token, user } = await login(email, password);
      saveAuth(token, user);
      // Now join the property with the invite code
      try {
        const { token: newToken, user: newUser } = await joinProperty(code, token);
        saveAuth(newToken, newUser);
        navigate(newUser.role === "owner" ? "/app/admins" : "/app/tenants", { replace: true });
      } catch (joinErr: any) {
        // If already a member, just go to the app
        navigate(user.role === "owner" ? "/app/admins" : "/app/tenants", { replace: true });
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    // Store invite code in sessionStorage so the callback can use it
    if (code) {
      sessionStorage.setItem("kostel_pending_invite", code);
    }
    openGoogleLogin();
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
            {mode === "signup" ? "Tenant Registration" : "Tenant Login"}
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

          {/* Mode Toggle */}
          <div className="flex mb-5 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => { setMode("signup"); setError(""); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                mode === "signup"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 inline mr-1.5" />
              Sign Up
            </button>
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                mode === "login"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LogIn className="w-3.5 h-3.5 inline mr-1.5" />
              Log In
            </button>
          </div>

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 mb-4"
          >
            <Chrome className="w-4 h-4" />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] text-slate-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Signup Form */}
          {mode === "signup" && (
            <>
              <h2 className="font-display font-bold text-lg text-slate-900">
                Create Tenant Account
              </h2>
              <p className="text-slate-500 text-xs mb-4">
                Sign up to apply as a tenant
                {property ? ` at ${property.property_name}` : ""}.
              </p>

              <form onSubmit={handleSignup} className="space-y-3.5">
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
                      Create Account & Join
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Login Form */}
          {mode === "login" && (
            <>
              <h2 className="font-display font-bold text-lg text-slate-900">
                Welcome Back
              </h2>
              <p className="text-slate-500 text-xs mb-4">
                Log in to join
                {property ? ` ${property.property_name}` : ""} as a tenant.
              </p>

              <form onSubmit={handleLogin} className="space-y-3.5">
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
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
                      <LogIn className="w-4 h-4" />
                      Log In & Join Property
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}