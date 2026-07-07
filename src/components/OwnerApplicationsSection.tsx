import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, CheckCircle, XCircle, Eye, Clock, ChevronRight, X, Loader2, Building2, AlertTriangle, Check, BedDouble } from "lucide-react";
import { TenantApplication } from "../types";

interface AvailableRoom {
  room_id: number;
  room_number: string;
  floor_number: number | null;
  room_type: { type_name: string; monthly_price: number };
}

interface Props {
  applications: TenantApplication[];
  token: string;
  onRefresh: () => void;
}

export default function OwnerApplicationsSection({ applications, token, onRefresh }: Props) {
  const [selectedApp, setSelectedApp] = useState<TenantApplication | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [successType, setSuccessType] = useState<"approve" | "reject" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(false);

  if (applications.length === 0) return null;

  const handleApprove = async (app: TenantApplication) => {
    setActionLoading(app.application_id);
    setErrorMsg("");
    
    try {
      const res = await fetch(`/api/applications/${app.application_id}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setSuccessType("approve");
        setTimeout(() => {
          setSuccessType(null);
          setSelectedApp(null);
          onRefresh();
        }, 1500);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to approve application");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignRoom = async (app: TenantApplication) => {
    if (!selectedRoomId) {
      setErrorMsg("Please select a room for the tenant");
      return;
    }
    setActionLoading(app.application_id);
    setErrorMsg("");
    
    try {
      const res = await fetch(`/api/applications/${app.application_id}/assign-room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomId: selectedRoomId }),
      });
      if (res.ok) {
        setSuccessType("approve");
        setTimeout(() => {
          setSuccessType(null);
          setSelectedApp(null);
          setSelectedRoomId(null);
          onRefresh();
        }, 1500);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to assign room");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (app: TenantApplication) => {
    setActionLoading(app.application_id);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/applications/${app.application_id}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: rejectNotes }),
      });
      if (res.ok) {
        setSuccessType("reject");
        setTimeout(() => {
          setSuccessType(null);
          setSelectedApp(null);
          setRejectNotes("");
          setShowRejectInput(false);
          onRefresh();
        }, 1500);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to reject application");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const fetchAvailableRooms = async (propertyId: number) => {
    setLoadingRooms(true);
    setAvailableRooms([]);
    setSelectedRoomId(null);
    try {
      const res = await fetch(`/api/properties/${propertyId}/available-rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const rooms: AvailableRoom[] = [];
        // API returns array of room types, each with availableRooms
        if (Array.isArray(data)) {
          data.forEach((rt: any) => {
            if (rt.availableRooms && Array.isArray(rt.availableRooms)) {
              rt.availableRooms.forEach((r: any) => {
                rooms.push({
                  room_id: r.id,
                  room_number: r.roomNumber,
                  floor_number: r.floorNumber,
                  room_type: { type_name: rt.name, monthly_price: rt.monthlyPrice },
                });
              });
            }
          });
        }
        setAvailableRooms(rooms);
      }
    } catch (e) {
      console.error("Failed to fetch available rooms:", e);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleSelectApp = (app: TenantApplication) => {
    setSelectedApp(app);
    setShowRejectInput(false);
    setRejectNotes("");
    setErrorMsg("");
    setSelectedRoomId(null);
    if (app.property_id) {
      fetchAvailableRooms(app.property_id);
    }
  };

  return (
    <>
      {/* Pending Apps Banner */}
      <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-100 rounded-xl">
              <Users className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 text-base">
                Pending Applications
              </h3>
              <p className="text-xs text-slate-500">
                {applications.length} applicant{applications.length > 1 ? "s" : ""} waiting for review
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-lg">
            {applications.length}
          </span>
        </div>

        <div className="space-y-2.5">
          {applications.map((app) => (
            <div
              key={app.application_id}
              onClick={() => handleSelectApp(app)}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/5 text-primary flex items-center justify-center font-bold text-xs font-mono">
                  {app.user?.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "??"}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{app.user?.full_name || "Unknown"}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {timeAgo(app.created_at)} · {app.occupation || "No occupation listed"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {app.property && (
                  <span className="text-[10px] text-slate-400 hidden sm:block">
                    {app.property.property_name}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative"
            >
              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-slate-900 text-lg">Application Review</h3>
                  <button
                    onClick={() => { setSelectedApp(null); setErrorMsg(""); }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tenant profile */}
                <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center font-bold text-lg text-primary shrink-0">
                    {selectedApp.user?.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "??"}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900">{selectedApp.user?.full_name}</h4>
                    <p className="text-xs text-slate-500">{selectedApp.user?.email}</p>
                    {selectedApp.phone && (
                      <p className="text-xs text-slate-500">{selectedApp.phone}</p>
                    )}
                  </div>
                </div>

                {/* Application details */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Occupation</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {selectedApp.occupation || "Not specified"}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Applied</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {timeAgo(selectedApp.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason for Staying</p>
                    <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                      {selectedApp.reason_for_staying || "No reason provided"}
                    </p>
                  </div>

                  {selectedApp.room_type && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preferred Room Type</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {selectedApp.room_type.type_name}
                      </p>
                    </div>
                  )}

                  {selectedApp.property && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Building2 className="w-3.5 h-3.5" />
                      {selectedApp.property.property_name}
                    </div>
                  )}
                </div>

                {/* Room Selection */}
                {!showRejectInput && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5" />
                      Assign Room
                    </label>
                    {loadingRooms ? (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        <span className="text-xs text-slate-500">Loading available rooms...</span>
                      </div>
                    ) : availableRooms.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {availableRooms.map((room) => (
                          <button
                            key={room.room_id}
                            onClick={() => {
                              console.log(`Room clicked: ${room.room_number} (ID: ${room.room_id})`);
                              setSelectedRoomId(room.room_id);
                            }}
                            className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                              selectedRoomId === room.room_id
                                ? "border-primary bg-primary/5"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <p className="text-xs font-bold text-slate-800">{room.room_number}</p>
                            <p className="text-[10px] text-slate-500">{room.room_type.type_name}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-xs text-amber-700 font-semibold">No available rooms in this property</p>
                        <p className="text-[10px] text-amber-600 mt-1">Please create rooms and room types in this property first before approving applications.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Reject notes input */}
                {showRejectInput && (
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                      Reason for rejection (optional)
                    </label>
                    <textarea
                      value={rejectNotes}
                      onChange={(e) => setRejectNotes(e.target.value)}
                      rows={2}
                      maxLength={200}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                      placeholder="Let the tenant know why..."
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  {!showRejectInput ? (
                    <>
                      {selectedApp.status === "pending" ? (
                        <>
                          <button
                            onClick={() => setShowRejectInput(true)}
                            disabled={actionLoading === selectedApp.application_id}
                            className="flex-1 py-3 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-bold cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                          <button
                            onClick={() => handleApprove(selectedApp)}
                            disabled={actionLoading === selectedApp.application_id}
                            className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                          >
                            {actionLoading === selectedApp.application_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <><CheckCircle className="w-4 h-4" /> Approve</>
                            )}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleAssignRoom(selectedApp)}
                          disabled={actionLoading === selectedApp.application_id || !selectedRoomId}
                          className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                          {actionLoading === selectedApp.application_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <><BedDouble className="w-4 h-4" /> Assign Room</>
                          )}
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setShowRejectInput(false);
                          setRejectNotes("");
                          setErrorMsg("");
                        }}
                        className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold cursor-pointer hover:bg-slate-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReject(selectedApp)}
                        disabled={actionLoading === selectedApp.application_id}
                        className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        {actionLoading === selectedApp.application_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <><XCircle className="w-4 h-4" /> Confirm Reject</>
                        )}
                      </button>
                    </>
                  )}
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <p className="text-xs font-semibold text-rose-700">{errorMsg}</p>
                  </div>
                )}
              </div>

              {/* Success overlay */}
              {successType && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-3 z-10">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <p className="font-display text-lg font-bold text-slate-900">
                    {successType === "approve" ? "Approved!" : "Rejected!"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {successType === "approve"
                      ? "Tenant has been approved and room assigned."
                      : "Application has been rejected."}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
