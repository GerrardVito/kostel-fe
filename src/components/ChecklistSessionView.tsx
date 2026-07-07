import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Check, X, Loader2, ArrowLeft, Camera, FileText, AlertTriangle } from "lucide-react";
import type { ChecklistSession, ChecklistResponse } from "../types";

interface Props {
  userId: number;
  token: string;
  assignmentId: number;
  sessionType: "checkin" | "checkout";
  propertyName: string;
  roomNumber: string;
  onCompleted: () => void;
  onBack?: () => void;
}

export default function ChecklistSessionView({
  userId,
  token,
  assignmentId,
  sessionType,
  propertyName,
  roomNumber,
  onCompleted,
  onBack,
}: Props) {
  const [session, setSession] = useState<ChecklistSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingItem, setSavingItem] = useState<number | null>(null);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");

  const startSession = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const endpoint = sessionType === "checkin" ? "checkin" : "checkout";
      const res = await fetch(
        `/api/checklist-sessions/assignment/${assignmentId}/${endpoint}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to start session");
      }
    } catch {
      setError("Failed to start checklist session");
    } finally {
      setLoading(false);
    }
  }, [assignmentId, sessionType, token]);

  useEffect(() => {
    startSession();
  }, [startSession]);

  const fetchSession = async (sessionId: number) => {
    try {
      const res = await fetch(`/api/checklist-sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSession(await res.json());
      }
    } catch {
      // silent
    }
  };

  const handleToggleItem = async (itemId: number, isWorking: boolean) => {
    if (!session) return;
    setSavingItem(itemId);
    setError("");
    try {
      const res = await fetch(
        `/api/checklist-sessions/${session.session_id}/items/${itemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ is_working: isWorking }),
        }
      );
      if (res.ok) {
        fetchSession(session.session_id);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to update");
      }
    } catch {
      setError("Failed to update item");
    } finally {
      setSavingItem(null);
    }
  };

  const handleComplete = async () => {
    if (!session) return;
    setCompleting(true);
    setError("");
    try {
      const res = await fetch(
        `/api/checklist-sessions/${session.session_id}/complete`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        onCompleted();
      } else {
        const data = await res.json();
        setError(data.message || "Failed to complete session");
      }
    } catch {
      setError("Failed to complete checklist");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center text-rose-600 text-sm">{error}</div>
      </div>
    );
  }

  if (!session) return null;

  const checkedCount = session.items.filter(
    (i) => i.response?.is_working != null
  ).length;
  const totalRequired = session.items.filter((i) => i.is_required).length;
  const checkedRequired = session.items.filter(
    (i) => i.is_required && i.response?.is_working != null
  ).length;
  const allRequiredChecked = checkedRequired >= totalRequired;
  const progress = totalRequired > 0 ? (checkedRequired / totalRequired) * 100 : 0;

  const title = sessionType === "checkin" ? "Check-In Checklist" : "Check-Out Checklist";
  const completeLabel = sessionType === "checkin" ? "Complete Check-In" : "Complete Check-Out";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl cursor-pointer transition-all">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
            )}
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">{title}</h2>
              <p className="text-xs text-slate-500">
                {propertyName} · Room {roomNumber}
              </p>
            </div>
          </div>

          {session.status === "completed" ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900">
                {sessionType === "checkin" ? "Check-In Complete!" : "Check-Out Complete!"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                All checklist items have been verified.
              </p>
              <button
                onClick={onCompleted}
                className="mt-6 px-6 py-3 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Continue
              </button>
            </div>
          ) : (
            <>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">
                    Progress
                  </span>
                  <span className="font-bold text-slate-700">
                    {checkedRequired}/{totalRequired} required items
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {session.items.map((item) => {
                  const isChecked = item.response?.is_working != null;
                  const isWorking = item.response?.is_working === true;
                  const isSaving = savingItem === item.item_id;

                  return (
                    <motion.div
                      key={item.item_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-xl border transition-all ${
                        isChecked
                          ? isWorking
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-rose-50 border-rose-200"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800">
                              {item.item_name}
                            </span>
                            {item.is_required && (
                              <span className="font-mono text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                Required
                              </span>
                            )}
                          </div>
                          {item.response?.notes && (
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {item.response.notes}
                            </p>
                          )}
                        </div>

                        {isSaving ? (
                          <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
                        ) : isChecked ? (
                          <div className="flex items-center gap-1">
                            {isWorking ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg">
                                <Check className="w-3 h-3" /> Working
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded-lg">
                                <X className="w-3 h-3" /> Not Working
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleToggleItem(item.item_id, true)}
                              className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg cursor-pointer transition-colors"
                              title="Working"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleItem(item.item_id, false)}
                              className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg cursor-pointer transition-colors"
                              title="Not Working"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <button
                onClick={handleComplete}
                disabled={!allRequiredChecked || completing}
                className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {completing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {completeLabel}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
