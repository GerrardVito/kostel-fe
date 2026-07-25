import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  ShieldCheck,
  UserPlus,
  X,
  Loader2,
  Mail,
  Phone,
  Trash2,
  AlertTriangle,
  Check,
  Info,
  Building2,
} from "lucide-react";
import { AdminMember, Property } from "../types";

interface OwnerAdminManagerProps {
  token: string;
  properties: Property[];
  ownerId: number;
  onNotify?: (msg: string) => void;
}

interface AddAdminFormData {
  name: string;
  email: string;
  phone: string;
  scope: "all" | "properties";
  property_ids: number[];
}

const initialForm: AddAdminFormData = {
  name: "",
  email: "",
  phone: "",
  scope: "all",
  property_ids: [],
};

export default function OwnerAdminManager({
  token,
  properties,
  ownerId,
  onNotify,
}: OwnerAdminManagerProps) {
  const [admins, setAdmins] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<AddAdminFormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<AdminMember | null>(null);
  const [revoking, setRevoking] = useState(false);

  const authHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admins", { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAdmins(Array.isArray(data) ? data : data.data ?? []);
      }
    } catch (e) {
      console.error("Failed to fetch admins:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [token]);

  const resetForm = () => {
    setForm(initialForm);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleOpenModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const handleToggleProperty = (id: number) => {
    setForm((f) => {
      const exists = f.property_ids.includes(id);
      return {
        ...f,
        property_ids: exists
          ? f.property_ids.filter((p) => p !== id)
          : [...f.property_ids, id],
      };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!form.name.trim() || !form.email.trim()) {
      setErrorMsg("Name and email are required.");
      return;
    }

    if (form.scope === "properties" && form.property_ids.length === 0) {
      setErrorMsg("Please select at least one property, or choose 'All Properties'.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || undefined,
          scope: form.scope,
          property_ids: form.scope === "all" ? [] : form.property_ids,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(
          data.invited
            ? `Invitation sent to ${form.email}. They will gain full owner access after signing up.`
            : `${form.name} is now an admin with full owner access.`
        );
        onNotify?.(`Admin added: ${form.name}`);
        fetchAdmins();
        setTimeout(() => {
          handleCloseModal();
        }, 1500);
      } else {
        const err = await res.json().catch(() => ({ message: "Failed to add admin" }));
        setErrorMsg(err.error || err.message || "Failed to add admin");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/admins/${revokeTarget.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        onNotify?.(`Access revoked for ${revokeTarget.name}`);
        setRevokeTarget(null);
        fetchAdmins();
      } else {
        const err = await res.json().catch(() => ({ message: "Failed to revoke admin" }));
        setErrorMsg(err.error || err.message || "Failed to revoke admin");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setRevoking(false);
    }
  };

  const activeAdmins = admins.filter((a) => a.status !== "revoked");

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??";

  const statusBadge = (status: AdminMember["status"]) => {
    const map: Record<AdminMember["status"], { label: string; cls: string }> = {
      active: { label: "Active", cls: "bg-emerald-100 text-emerald-800" },
      invited: { label: "Invited", cls: "bg-amber-100 text-amber-800" },
      revoked: { label: "Revoked", cls: "bg-slate-200 text-slate-600" },
    };
    const s = map[status] ?? map.active;
    return (
      <span className={`font-mono text-[9px] uppercase font-bold px-2 py-0.5 rounded ${s.cls}`}>
        {s.label}
      </span>
    );
  };

  return (
    <>
      {/* Admin Manager Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs max-w-xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 text-base">
                Delegate Admin Access
              </h3>
              <p className="text-xs text-slate-500">
                Admins get full owner access to manage properties, tenants, and finances.
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenModal}
            className="px-3.5 py-2 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Admin
          </button>
        </div>

        {/* Admin list */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-mono font-bold uppercase tracking-widest text-[9px] text-slate-400">
              Current Admins
            </h4>
            <button
              onClick={fetchAdmins}
              disabled={loading}
              className="text-[10px] text-slate-400 hover:text-primary font-semibold cursor-pointer disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {loading && admins.length === 0 ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            </div>
          ) : activeAdmins.length > 0 ? (
            <div className="space-y-2.5">
              {activeAdmins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                      {getInitials(admin.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{admin.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{admin.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {statusBadge(admin.status)}
                        <span className="font-mono text-[9px] text-slate-400">
                          {admin.scope === "all"
                            ? "All properties"
                            : `${admin.property_ids?.length ?? 0} propert${(admin.property_ids?.length ?? 0) === 1 ? "y" : "ies"}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setErrorMsg("");
                      setRevokeTarget(admin);
                    }}
                    disabled={admin.added_by?.id === ownerId && admin.id === ownerId}
                    title={
                      admin.added_by?.id === ownerId && admin.id === ownerId
                        ? "You cannot revoke your own owner access"
                        : "Revoke admin access"
                    }
                    className="p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              <Shield className="w-6 h-6 mx-auto mb-2 text-slate-300" />
              No admins yet. Add a delegate to share owner access.
            </div>
          )}

          {/* Permission notice */}
          <div className="mt-4 flex items-start gap-2.5 p-3 bg-primary/5 border border-primary/10 rounded-xl">
            <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Admins can perform every action you can: add/edit properties, manage tenants,
              resolve maintenance, view finances, and approve applications. You can revoke
              access at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Add Admin Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto relative border border-slate-200"
            >
              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Add New Admin
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Jane Doe"
                      maxLength={60}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="admin@example.com"
                        maxLength={120}
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      If they already have an account, we will upgrade it. Otherwise an invite is sent.
                    </p>
                  </div>

                  {/* Phone (optional) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                      Phone <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+62 812 3456 7890"
                        maxLength={30}
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm"
                      />
                    </div>
                  </div>

                  {/* Scope */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                      Access Scope
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, scope: "all", property_ids: [] })}
                        className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                          form.scope === "all"
                            ? "border-primary bg-primary/5"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-primary" />
                          <p className="text-xs font-bold text-slate-800">All Properties</p>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Full owner access to everything</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, scope: "properties" })}
                        className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                          form.scope === "properties"
                            ? "border-primary bg-primary/5"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-primary" />
                          <p className="text-xs font-bold text-slate-800">Specific Properties</p>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Choose which properties to share</p>
                      </button>
                    </div>
                  </div>

                  {/* Property selector */}
                  {form.scope === "properties" && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 tracking-wider">
                        Select Properties
                      </label>
                      {properties.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-1">
                          {properties.map((p) => {
                            const id = parseInt(p.id.replace("prop-", ""), 10);
                            const checked = form.property_ids.includes(id);
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleToggleProperty(id)}
                                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                  checked
                                    ? "border-primary bg-primary/5"
                                    : "border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                                    checked ? "bg-primary border-primary" : "border-slate-300"
                                  }`}
                                >
                                  {checked && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                                  <p className="text-[10px] text-slate-500 truncate">{p.address}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-700">
                          You have no properties yet. Switch to "All Properties" scope for now.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Warning */}
                  <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-800 leading-relaxed">
                      This person will have <strong>full owner access</strong>, including deleting
                      properties, managing tenants, and viewing all financial data. Revoke anytime
                      from the admin list.
                    </p>
                  </div>

                  {/* Error */}
                  {errorMsg && (
                    <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      <p className="text-xs font-semibold text-rose-700">{errorMsg}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                      {submitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="w-3.5 h-3.5" />
                      )}
                      Grant Admin Access
                    </button>
                  </div>
                </form>
              </div>

              {/* Success overlay */}
              {successMsg && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-3 z-10 p-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <p className="font-display text-lg font-bold text-slate-900 text-center">
                    Admin Added!
                  </p>
                  <p className="text-xs text-slate-500 text-center leading-relaxed">{successMsg}</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Revoke Confirmation Modal */}
      <AnimatePresence>
        {revokeTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Revoke Admin Access
                </h3>
                <button
                  onClick={() => setRevokeTarget(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <p className="text-sm text-slate-700">
                  Are you sure you want to revoke admin access for{" "}
                  <strong className="text-slate-900">{revokeTarget.name}</strong> (
                  {revokeTarget.email})?
                </p>
                <p className="text-[11px] text-slate-500">
                  They will immediately lose access to all owner features. This action can be
                  undone by re-adding them as an admin.
                </p>

                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <p className="text-xs font-semibold text-rose-700">{errorMsg}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setRevokeTarget(null);
                      setErrorMsg("");
                    }}
                    disabled={revoking}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold cursor-pointer hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRevoke}
                    disabled={revoking}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {revoking ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Revoke Access
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
