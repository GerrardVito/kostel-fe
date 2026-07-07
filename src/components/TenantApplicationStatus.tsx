import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "motion/react";
import { Clock, CheckCircle2, XCircle, Building2, MapPin, RefreshCw, ArrowRight, Home, Loader2 } from "lucide-react";
import { TenantApplication } from "../types";

interface Props {
  token: string;
  applicationId: number;
  onApproved: (application: TenantApplication) => void;
  onRoomAssigned?: () => void;
}

export default function TenantApplicationStatus({ token, applicationId, onApproved, onRoomAssigned }: Props) {
  const [application, setApplication] = useState<TenantApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const applicationRef = useRef(application);
  const onRoomAssignedRef = useRef(onRoomAssigned);

  // Keep refs updated
  useEffect(() => {
    applicationRef.current = application;
  }, [application]);

  useEffect(() => {
    onRoomAssignedRef.current = onRoomAssigned;
  }, [onRoomAssigned]);

  const fetchApplication = useCallback(async () => {
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
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token, applicationId, onApproved]);

  // Check if room has been assigned for approved applications
  const checkRoomAssignment = useCallback(async () => {
    // Always check, regardless of application status (use ref to get latest)
    if (applicationRef.current?.status !== "approved") return;
    
    try {
      const res = await fetch("/api/tenants/me", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.assignment_id && onRoomAssignedRef.current) {
          onRoomAssignedRef.current();
        }
      }
    } catch {
      // silent
    }
  }, [token]);

  useEffect(() => {
    fetchApplication();
    const interval = setInterval(() => {
      fetchApplication();
      // Always check room assignment (the function itself checks if approved)
      checkRoomAssignment();
    }, 5000); // Check every 5 seconds for faster response
    return () => clearInterval(interval);
  }, [fetchApplication, checkRoomAssignment]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs text-center max-w-md">
          <XCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h3 className="font-display font-bold text-slate-900">Application Not Found</h3>
          <p className="text-xs text-slate-500 mt-1">Please try submitting a new application.</p>
        </div>
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
          {/* Status icon */}
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
          </div>

          {/* Property info */}
          {application.property && (
            <div className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-200">
                {application.property.image_urls?.[0] && (
                  <img
                    src={application.property.image_urls[0]}
                    alt={application.property.property_name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div>
                <h3 className="font-sans font-bold text-slate-900 text-sm">
                  {application.property.property_name}
                </h3>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
                  <MapPin className="w-3 h-3" />
                  {application.property.address}
                </div>
              </div>
            </div>
          )}

          {/* Status message */}
          <div className="text-center space-y-2">
            {application.status === "pending" && (
              <>
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Application Under Review
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your application has been submitted. The property owner will review it shortly.
                </p>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 mt-3">
                  <div className="flex items-center justify-center gap-2 text-xs text-blue-700 font-semibold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Checking for updates...
                  </div>
                  <p className="text-[10px] text-blue-600 mt-1">
                    This page will automatically update when your application is reviewed.
                  </p>
                </div>
              </>
            )}
            {application.status === "approved" && (
              <>
                <h2 className="font-display text-xl font-bold text-emerald-700">
                  Application Approved!
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Congratulations! The owner has approved your application.
                </p>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 mt-3">
                  <div className="flex items-center justify-center gap-2 text-xs text-amber-700 font-semibold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Waiting for room assignment...
                  </div>
                  <p className="text-[10px] text-amber-600 mt-1">
                    The owner will assign you a room shortly. This page will auto-advance.
                  </p>
                </div>
              </>
            )}
            {application.status === "rejected" && (
              <>
                <h2 className="font-display text-xl font-bold text-rose-700">
                  Application Not Accepted
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Unfortunately, the owner was unable to accept your application at this time.
                </p>
                {application.notes && (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 mt-2">
                    <p className="text-xs text-rose-700">
                      <span className="font-bold">Reason: </span>
                      {application.notes}
                    </p>
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  You can try applying to another property with a different invite code.
                </p>
              </>
            )}
          </div>

          {/* Action buttons */}
          {application.status === "pending" && (
            <button
              onClick={fetchApplication}
              className="w-full py-3 bg-primary/5 text-primary border border-primary/20 text-xs font-bold rounded-xl cursor-pointer hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
