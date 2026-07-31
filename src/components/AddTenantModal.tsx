import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UserPlus,
  Loader2,
  Mail,
  Phone,
  Briefcase,
  MessageSquare,
  Lock,
  Calendar,
  Check,
  AlertTriangle,
  CreditCard,
  Pen,
} from "lucide-react";
import ImageUploader from "./ImageUploader";
import Modal from "./ui/Modal";

interface Props {
  token: string;
  roomId: number;
  roomNumber: string;
  propertyId: string;
  propertyName: string;
  onClose: () => void;
  onCreated: (tenant: {
    assignment_id: number;
    user_id: number;
    full_name: string;
    email: string;
    phone: string;
    occupation: string;
    purpose_of_stay: string;
    checkin_date: string;
    status: string;
  }) => void;
}

export default function AddTenantModal({
  token,
  roomId,
  roomNumber,
  propertyId,
  propertyName,
  onClose,
  onCreated,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [occupation, setOccupation] = useState("");
  const [reasonForStaying, setReasonForStaying] = useState("");
  const [password, setPassword] = useState("");
  const [checkinDate, setCheckinDate] = useState(new Date().toISOString().split("T")[0]);
  const [idCardUrl, setIdCardUrl] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");

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
    if (!email.trim()) {
      setErrorMsg("Email address is required.");
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        roomId,
      };
      if (phone.trim()) body.phone = phone.trim();
      if (occupation.trim()) body.occupation = occupation.trim();
      if (reasonForStaying.trim()) body.reasonForStaying = reasonForStaying.trim();
      if (password.trim()) body.password = password.trim();
      if (checkinDate) body.checkinDate = checkinDate;
      if (idCardUrl) body.idCardUrl = idCardUrl;
      if (signatureUrl) body.signatureUrl = signatureUrl;

      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const result = await res.json().catch(() => ({}));
        setSuccess(true);
        setTimeout(() => {
          onCreated({
            assignment_id: result.assignment_id ?? 0,
            user_id: result.user_id ?? 0,
            full_name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            occupation: occupation.trim(),
            purpose_of_stay: reasonForStaying.trim(),
            checkin_date: checkinDate || new Date().toISOString().split("T")[0],
            status: "active",
          });
        }, 1500);
      } else {
        const err = await res.json().catch(() => ({ error: "Failed to create tenant" }));
        setErrorMsg(err.error || "Failed to create tenant");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      size="lg"
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          Manually Add Tenant
        </span>
      }
      footer={
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-tenant-form"
            disabled={submitting}
            className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UserPlus className="w-3.5 h-3.5" />
            )}
            Create Tenant
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Room info badge */}
        <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/10 rounded-xl">
          <CreditCard className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-slate-700">
            Assigning tenant to <span className="font-bold text-primary">{roomNumber}</span> at{" "}
            <span className="font-bold">{propertyName}</span>
          </p>
        </div>

        <form id="add-tenant-form" onSubmit={handleSubmit} className="space-y-4">
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
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tenant@example.com"
                  maxLength={120}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                If this email already has an account, they'll be linked directly to this room.
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                Phone <span className="text-slate-400 font-normal">(optional)</span>
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

            {/* Occupation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                Occupation <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  maxLength={100}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm"
                />
              </div>
            </div>

            {/* Reason for Staying */}
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                Reason for Staying <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <textarea
                  value={reasonForStaying}
                  onChange={(e) => setReasonForStaying(e.target.value)}
                  placeholder="e.g. Relocating for work, studying at nearby university..."
                  maxLength={300}
                  rows={2}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm resize-none"
                />
              </div>
            </div>

            {/* Check-in Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                Check-in Date <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={checkinDate}
                  onChange={(e) => setCheckinDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                Password <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to auto-generate"
                  maxLength={60}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-hidden text-sm"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                If left blank, the system will generate a password or send an invite link.
              </p>
            </div>

            {/* ID Card Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                ID Card (KTP/Passport) <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <ImageUploader
                initialUrl={idCardUrl}
                onUpload={(url) => setIdCardUrl(url)}
              />
            </div>

            {/* Signature Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
                Signature Image <span className="text-slate-400 font-normal">(optional)</span>
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
        </form>
      </div>

      {/* Success overlay (covers the modal panel) */}
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
              Tenant Created!
            </p>
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              {name} has been assigned to <span className="font-bold">{roomNumber}</span> at{" "}
              <span className="font-bold">{propertyName}</span>.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
