import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2,
  User,
  ChevronRight,
  ArrowLeft,
  Mail,
  Lock,
  Phone,
  UserPlus,
  Shield,
  LayoutGrid,
} from "lucide-react";
import { User as UserType } from "../types";

type AuthStep = "role-select" | "register" | "login";

interface AuthViewProps {
  onLoginSuccess: (token: string, user: UserType, role: "tenant" | "owner") => void;
}

export default function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [step, setStep] = useState<AuthStep>("role-select");
  const [selectedRole, setSelectedRole] = useState<"tenant" | "owner" | null>(null);

  // Register form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSelectRole = (role: "tenant" | "owner") => {
    setSelectedRole(role);
    setStep("register");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const { register } = await import("../services/auth");
      await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone || undefined,
        role: selectedRole!,
      });
      setSuccessMsg("Account created successfully! Please log in.");
      setLoginEmail(regEmail);
      setLoginPassword("");
      setStep("login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const { login, saveAuth } = await import("../services/auth");
      const { token, user } = await login(loginEmail, loginPassword);
      saveAuth(token, user);
      onLoginSuccess(token, user, user.role as "tenant" | "owner");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setError("");
    setSuccessMsg("");
    if (step === "register") setStep("role-select");
    if (step === "login") {
      setLoginPassword("");
      setStep("register");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <LayoutGrid className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-primary">KOSTEL</h1>
          </div>
          <p className="text-slate-500 text-xs mt-2 font-medium tracking-wide">
            Property Management System
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === "role-select" && (
            <motion.div
              key="role-select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <p className="text-center text-slate-600 text-sm font-medium mb-6">
                Choose your role to get started
              </p>

              <button
                onClick={() => handleSelectRole("tenant")}
                className="w-full p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-primary/40 hover:bg-primary/5 transition-all group cursor-pointer text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                    <User className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-lg text-slate-900">Resident Tenant</h3>
                    <p className="text-slate-500 text-xs mt-1">
                      View bills, submit maintenance requests, and manage your rental profile
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                </div>
              </button>

              <button
                onClick={() => handleSelectRole("owner")}
                className="w-full p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-primary/40 hover:bg-primary/5 transition-all group cursor-pointer text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-lg text-slate-900">Property Owner / Admin</h3>
                    <p className="text-slate-500 text-xs mt-1">
                      Manage properties, track payments, and oversee maintenance operations
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                </div>
              </button>
            </motion.div>
          )}

          {step === "register" && selectedRole && (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={goBack}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-500" />
                  </button>
                  <div>
                    <h2 className="font-display font-bold text-lg text-slate-900">Create Account</h2>
                    <p className="text-slate-500 text-xs">
                      Registering as{" "}
                      <span className="font-semibold text-primary capitalize">{selectedRole}</span>
                    </p>
                  </div>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
                    <div className="relative">
                      <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
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
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
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
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
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
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
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
                  {successMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium">
                      {successMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Create Account
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    onClick={() => { setStep("login"); setLoginEmail(regEmail); setError(""); setSuccessMsg(""); }}
                    className="text-xs text-slate-500 hover:text-primary transition-colors font-medium cursor-pointer"
                  >
                    Already have an account? <span className="underline">Log in</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={goBack}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-500" />
                  </button>
                  <div>
                    <h2 className="font-display font-bold text-lg text-slate-900">Welcome Back</h2>
                    <p className="text-slate-500 text-xs">Sign in to your account</p>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
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
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
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
                    disabled={loading}
                    className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Sign In
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400 text-center mb-3 font-medium">Demo Accounts</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setLoginEmail("owner@kostel.app");
                        setLoginPassword("password123");
                      }}
                      className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      Owner Demo
                    </button>
                    <button
                      onClick={() => {
                        setLoginEmail("tenant@kostel.app");
                        setLoginPassword("password123");
                      }}
                      className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      Tenant Demo
                    </button>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <button
                    onClick={() => { setStep("register"); setError(""); setSuccessMsg(""); }}
                    className="text-xs text-slate-500 hover:text-primary transition-colors font-medium cursor-pointer"
                  >
                    Need an account? <span className="underline">Register</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
