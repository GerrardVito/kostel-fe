import { useState } from "react";
import { motion } from "motion/react";
import { Building2, MapPin, Check, ArrowRight, Loader2 } from "lucide-react";

interface PropertyInfo {
  id: string;
  name: string;
  address: string;
  image: string;
  description: string;
}

interface RoomTypeOption {
  id: number;
  type_name: string;
  monthly_price: number;
  room_size: string;
}

interface Props {
  onApply: (propertyId: string, propertyName: string, propertyAddress: string, propertyImage: string, roomTypes: RoomTypeOption[]) => void;
  userId: number;
  token: string;
}

export default function PropertyCodeView({ onApply, userId, token }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [property, setProperty] = useState<PropertyInfo | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomTypeOption[]>([]);
  const [error, setError] = useState("");

  const handleLookup = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    setProperty(null);
    setRoomTypes([]);
    try {
      const res = await fetch(`/api/properties/code/${code.trim().toUpperCase()}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Property not found");
        return;
      }
      const data = await res.json();
      setProperty(data);
      // Fetch room types for the property
      const rtRes = await fetch(`/api/properties/${data.id}/room-types`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (rtRes.ok) {
        const rtData = await rtRes.json();
        const types = Array.isArray(rtData) ? rtData : rtData.data || [];
        setRoomTypes(types.map((rt: any) => ({
          id: rt.id || rt.room_type_id,
          type_name: rt.name || rt.type_name,
          monthly_price: rt.monthlyPrice || rt.monthly_price,
          room_size: rt.roomSize || rt.room_size,
        })));
      }
    } catch {
      setError("Failed to look up property code");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!property) return;
    onApply(property.id, property.name, property.address, property.image, roomTypes);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-display text-xl font-bold text-slate-900">Join a Property</h2>
            <p className="text-xs text-slate-500 mt-1">Enter the invite code provided by your property owner</p>
          </div>

          {!property ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                  placeholder="Enter invite code (e.g. SKYLINE)"
                  maxLength={25}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-900 uppercase tracking-widest outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  onClick={handleLookup}
                  disabled={loading || !code.trim()}
                  className="px-5 py-3 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
              {error && <p className="text-xs font-semibold text-rose-600 text-center">{error}</p>}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <img
                  src={property.image}
                  alt={property.name}
                  className="w-full h-40 object-cover"
                />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900">{property.name}</h3>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5" />
                  {property.address}
                </div>
                {property.description && (
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{property.description}</p>
                )}
                {roomTypes.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Available Room Types</p>
                    <div className="space-y-1.5">
                      {roomTypes.map((rt) => (
                        <div key={rt.id} className="flex justify-between items-center text-xs">
                          <span className="text-slate-700 font-medium">{rt.type_name}</span>
                          <span className="text-slate-400 font-mono">Rp {rt.monthly_price.toLocaleString()}/mo</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setProperty(null)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-50 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {applying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <><Check className="w-4 h-4" /> Apply to Join</>
                  )}
                </button>
              </div>
              {error && <p className="text-xs font-semibold text-rose-600 text-center">{error}</p>}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
