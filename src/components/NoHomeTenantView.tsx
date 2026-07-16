import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Building2, MapPin, Home, ArrowRight, Loader2, Check, RefreshCw, Clock, CheckCircle2, XCircle } from "lucide-react";
import type { TenantApplication } from "../types";

interface RoomTypeOption {
  id: number;
  type_name: string;
  monthly_price: number;
  room_size: string;
}

interface Props {
  token: string;
  userId: number;
  hasPendingApplication: boolean;
  hasApprovedApplication: boolean;
  applicationId: number | null;
  justCheckedOut?: boolean;
  onApply: (propertyId: string, propertyName: string, propertyAddress: string, propertyImage: string, roomTypes: RoomTypeOption[]) => void;
  onApproved: (application: TenantApplication) => void;
}

export default function NoHomeTenantView({ token, userId, hasPendingApplication, hasApprovedApplication, applicationId, justCheckedOut, onApply, onApproved }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [property, setProperty] = useState<{ id: string; name: string; address: string; image: string; description: string } | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomTypeOption[]>([]);
  const [error, setError] = useState("");

  const [application, setApplication] = useState<TenantApplication | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [skipStatus, setSkipStatus] = useState(false);

  // If user already has a pending/approved application, show status directly
  const showStatus = (hasPendingApplication || hasApprovedApplication) && !skipStatus;

  const fetchStatus = async () => {
    if (!applicationId) return;
    setStatusLoading(true);
    setFetchError(false);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const app = data.data || data;
        setApplication(app);
        if (app.status === "approved") {
          onApproved(app);
        }
      } else {
        setFetchError(true);
      }
    } catch {
      setFetchError(true);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (showStatus && applicationId && !application && !fetchError) {
      fetchStatus();
    }
  }, [showStatus, applicationId]);

  const handleLookup = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    setProperty(null);
    setRoomTypes([]);
    try {
      const res = await fetch(`/api/properties/code/${code.trim().toUpperCase()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Property not found");
        return;
      }
      const data = await res.json();
      setProperty(data);
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
      setError("Server not reachable. Make sure the API server is running.");
    } finally {
      setLoading(false);
    }
  };

  if (showStatus && applicationId) {
    if (!application && !fetchError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs text-center space-y-4">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-xs text-slate-500">Checking application status...</p>
            </div>
          </motion.div>
        </div>
      );
    }

    if (fetchError && !application) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto">
                <XCircle className="w-6 h-6 text-rose-600" />
              </div>
              <p className="text-xs text-slate-500">Could not load application status. Try again or look up a property code.</p>
              <div className="flex gap-2">
                <button onClick={fetchStatus} disabled={statusLoading} className="flex-1 py-2.5 bg-primary/5 text-primary border border-primary/20 text-xs font-bold rounded-xl cursor-pointer hover:bg-primary/10 transition-all">
                  Retry
                </button>
                <button onClick={() => setSkipStatus(true)} className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                  Enter Code
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    if (!application) return null;

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
            <div className="text-center">
              {application.status === "pending" && (
                <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-amber-600" />
                </div>
              )}
              {application.status === "approved" && (
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
              )}
              {application.status === "rejected" && (
                <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-rose-600" />
                </div>
              )}
              <h2 className="font-display text-xl font-bold text-slate-900">
                {application.status === "pending" && "Application Under Review"}
                {application.status === "approved" && "Application Approved!"}
                {application.status === "rejected" && "Application Not Accepted"}
              </h2>
            </div>

            {application.property && (
              <div className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-200">
                  {application.property.image_urls?.[0] && (
                    <img src={application.property.image_urls[0]} alt={application.property.property_name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{application.property.property_name}</h3>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
                    <MapPin className="w-3 h-3" />{application.property.address}
                  </div>
                </div>
              </div>
            )}

            {application.status === "pending" && (
              <div className="text-center text-xs text-slate-500">
                <p>Your application has been submitted. The owner will review it shortly.</p>
                <div className="flex items-center justify-center gap-2 mt-3 text-amber-600 font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Checking for updates...
                </div>
                <button onClick={fetchStatus} disabled={statusLoading} className="mt-3 w-full py-2.5 bg-primary/5 text-primary border border-primary/20 text-xs font-bold rounded-xl cursor-pointer hover:bg-primary/10 transition-all">
                  Refresh Status
                </button>
              </div>
            )}

            {application.status === "approved" && (
              <div className="text-center space-y-3">
                <p className="text-xs text-slate-500">The owner has approved your application. You can now select your room.</p>
                <button onClick={() => onApproved(application)} className="w-full py-3 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl cursor-pointer transition-all">
                  Continue to Room Selection
                </button>
              </div>
            )}

            {application.status === "rejected" && (
              <div className="text-center space-y-3">
                <p className="text-xs text-slate-500">Unfortunately, the owner was unable to accept your application.</p>
                {application.notes && (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                    <p className="text-xs text-rose-700"><span className="font-bold">Reason: </span>{application.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Always show option to enter a new code */}
            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => setSkipStatus(true)}
                className="w-full py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-50 transition-all"
              >
                Enter Different Property Code
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
          {/* Checkout Success Banner */}
          {justCheckedOut && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-bold text-emerald-800">Checkout Successful!</p>
              </div>
              <p className="text-xs text-emerald-600">
                Your tenancy has been ended. Enter a new property code to apply again.
              </p>
            </div>
          )}

          {/* No Room Message */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Home className="w-7 h-7 text-slate-400" />
            </div>
            <h2 className="font-display text-xl font-bold text-slate-900">No Registered Room</h2>
            <p className="text-xs text-slate-500 mt-1">
              You currently don't have registered rooms. Enter an invite code to join a property.
            </p>
          </div>

          {/* Invite Code */}
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
                <img src={property.image} alt={property.name} className="w-full h-40 object-cover" />
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
                <button onClick={() => setProperty(null)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-50 transition-all">
                  Back
                </button>
                <button onClick={() => onApply(property.id, property.name, property.address, property.image, roomTypes)} className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> Apply to Join
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
