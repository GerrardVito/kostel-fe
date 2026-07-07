import { useState } from "react";
import { motion } from "motion/react";
import { Building2, MapPin, Send, Loader2, ArrowLeft, Briefcase, MessageSquare, Phone } from "lucide-react";

interface RoomTypeOption {
  id: number;
  type_name: string;
  monthly_price: number;
  room_size: string;
}

interface Props {
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  propertyImage: string;
  roomTypes: RoomTypeOption[];
  selectedRoomType?: RoomTypeOption | null;
  token: string;
  userPhone: string;
  onSubmit: (applicationId: number) => void;
  onBack: () => void;
}

export default function TenantApplicationForm({
  propertyId,
  propertyName,
  propertyAddress,
  propertyImage,
  roomTypes,
  selectedRoomType,
  token,
  userPhone,
  onSubmit,
  onBack,
}: Props) {
  const [occupation, setOccupation] = useState("");
  const [reason, setReason] = useState("");
  const [phone, setPhone] = useState(userPhone);
  const [preferredRoomType, setPreferredRoomType] = useState(selectedRoomType?.id.toString() || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!occupation.trim() || !reason.trim()) {
      setError("Please fill in occupation and reason for staying");
      return;
    }
    setSubmitting(true);
    setError("");

    const body: Record<string, unknown> = {
      property_id: parseInt(propertyId.replace("prop-", "")),
      occupation: occupation.trim(),
      reason_for_staying: reason.trim(),
      phone: phone.trim(),
    };
    if (preferredRoomType) {
      body.room_type_id = parseInt(preferredRoomType);
    }

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || "Failed to submit application");
      }
      const data = await res.json();
      onSubmit(data.application_id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">Apply to Join</h2>
              <p className="text-xs text-slate-500 mt-0.5">Fill in your details for the owner</p>
            </div>
          </div>

          {/* Property preview */}
          <div className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <img
              src={propertyImage}
              alt={propertyName}
              className="w-16 h-16 rounded-lg object-cover shrink-0"
            />
            <div>
              <h3 className="font-sans font-bold text-slate-900 text-sm">{propertyName}</h3>
              <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
                <MapPin className="w-3 h-3" />
                {propertyAddress}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mb-1.5">
                <Briefcase className="w-3.5 h-3.5" /> Occupation *
              </label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Software Engineer, Student, etc."
                maxLength={25}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Why do you want to stay here? *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tell the owner a bit about yourself and why you'd like to stay at this property..."
                rows={3}
                maxLength={200}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mb-1.5">
                <Phone className="w-3.5 h-3.5" /> Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+628123456789"
                maxLength={20}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {roomTypes.length > 0 && (
              <div>
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mb-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Preferred Room Type (optional)
                </label>
                <select
                  value={preferredRoomType}
                  onChange={(e) => setPreferredRoomType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="">No preference</option>
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.type_name} - Rp {rt.monthly_price.toLocaleString()}/mo ({rt.room_size})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-600 text-center">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <><Send className="w-4 h-4" /> Submit Application</>
            )}
          </button>

          <p className="text-[10px] text-slate-400 text-center">
            The owner will review your application and assign you a room if approved.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
