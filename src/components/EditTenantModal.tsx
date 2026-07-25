import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UserPen,
  X,
  Loader2,
  Mail,
  Phone,
  Briefcase,
  MessageSquare,
  Calendar,
  Check,
  AlertTriangle,
  CreditCard,
  FileText,
} from "lucide-react";
import ImageUploader from "./ImageUploader";
import { getStoredToken } from "../services/auth";

interface TenantData {
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  nik: string;
  passport_number: string;
  date_of_birth: string | null;
  purpose_of_stay: string;
  occupation: string;
  identity_image: string | null;
  signature_image: string | null;
}

interface Props {
  tenant: TenantData;
  onClose: () => void;
  onUpdated: (updated: Partial<TenantData>) => void;
}

export default function EditTenantModal({ tenant, onClose, onUpdated }: Props) {
  const [name, setName] = useState(tenant.full_name || "");
  const [email, setEmail] = useState(tenant.email || "");
  const [phone, setPhone] = useState(tenant.phone || "");
  const [nik, setNik] = useState(tenant.nik || "");
  const [passportNumber, setPassportNumber] = useState(tenant.passport_number || "");
  const [dateOfBirth, setDateOfBirth] = useState(tenant.date_of_birth || "");
  const [purposeOfStay, setPurposeOfStay] = useState(tenant.purpose_of_stay || "");
  const [idCardUrl, setIdCardUrl] = useState(tenant.identity_image || "");
  const [signatureUrl, setSignatureUrl] = useState(tenant.signature_image || "");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Tenant name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {};
      if (name.trim() !== tenant.full_name) body.name = name.trim();
      if (email.trim() !== tenant.email) body.email = email.trim().toLowerCase();
      if (phone.trim() !== (tenant.phone || "")) body.phone = phone.trim();
      if (nik.trim() !== (tenant.nik || "")) body.nik = nik.trim();
      if (passportNumber.trim() !== (tenant.passport_number || "")) body.passport_number = passportNumber.trim();
      if (dateOfBirth !== (tenant.date_of_birth || "")) body.date_of_birth = dateOfBirth || null;
      if (purposeOfStay.trim() !== (tenant.purpose_of_stay || "")) body.purpose_of_stay = purposeOfStay.trim();
      if (idCardUrl !== (tenant.identity_image || "")) body.identity_image = idCardUrl || null;
      if (signatureUrl !== (tenant.signature_image || "")) body.signature_image = signatureUrl || null;

      const res = await fetch(`/api/tenants/${tenant.user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getStoredToken()}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onUpdated({
            full_name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            nik: nik.trim(),
            passport_number: passportNumber.trim(),
            date_of_birth: dateOfBirth || null,
            purpose_of_stay: purposeOfStay.trim(),
            identity_image: idCardUrl || null,
            signature_image: signatureUrl || null,
          });
          onClose();
        }, 1200);
      } else {
        const err = await res.json().catch(() => ({ error: "Failed to update tenant" }));
        setErrorMsg(err.error || err.message || "Failed to update tenant");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative border border-slate-200"
      >
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
              <UserPen className="w-5 h-5 text-primary" />
              Edit Tenant
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                maxLength={80}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tenant@example.com"
                  maxLength={120}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+62 812 3456 7890"
                  maxLength={30}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm"
                />
              </div>
            </div>

            {/* NIK */}
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                NIK (Nomor Induk Kependudukan)
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  placeholder="e.g. 3201234567890001"
                  maxLength={20}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm font-mono"
                />
              </div>
            </div>

            {/* Passport Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                Passport Number
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  placeholder="e.g. A12345678"
                  maxLength={50}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm font-mono"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm"
                />
              </div>
            </div>

            {/* Purpose of Stay */}
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                Purpose of Stay
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <textarea
                  value={purposeOfStay}
                  onChange={(e) => setPurposeOfStay(e.target.value)}
                  placeholder="e.g. Relocating for work, studying at nearby university..."
                  maxLength={300}
                  rows={2}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm resize-none"
                />
              </div>
            </div>

            {/* ID Card Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                ID Card (KTP/Passport)
              </label>
              <ImageUploader
                initialUrl={idCardUrl}
                onUpload={(url) => setIdCardUrl(url)}
              />
            </div>

            {/* Signature Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                Signature Image
              </label>
              <ImageUploader
                initialUrl={signatureUrl}
                onUpload={(url) => setSignatureUrl(url)}
              />
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
                onClick={onClose}
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
                  <Check className="w-3.5 h-3.5" />
                )}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Success overlay */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-3 z-10 p-6"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="font-display text-lg font-bold text-slate-900 text-center">
                Tenant Updated!
              </p>
              <p className="text-xs text-slate-500 text-center leading-relaxed">
                Changes to <span className="font-bold">{tenant.full_name}</span> have been saved.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
