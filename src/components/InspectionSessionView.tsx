import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Check, X, Loader2, AlertTriangle, Camera, FileText } from "lucide-react";
import type { InspectionFinding } from "../types";

interface InspectionItem {
  inspection_item_id: number;
  item_name: string;
  category: string;
}

interface Finding {
  finding_id: number;
  inspection_item_id: number | null;
  item_name: string;
  status: string;
  notes: string | null;
  image_url: string | null;
  priority: string | null;
  item: InspectionItem | null;
}

interface InspectionData {
  inspection_id: number;
  title: string;
  inspection_type: string;
  status: string;
  scheduled_date: string;
  completed_date: string | null;
  notes: string | null;
  findings: Finding[];
  property: { property_name: string };
  room: { room_number: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  good: "bg-emerald-100 text-emerald-700 border-emerald-200",
  needs_repair: "bg-amber-100 text-amber-700 border-amber-200",
  needs_cleaning: "bg-blue-100 text-blue-700 border-blue-200",
  damaged: "bg-rose-100 text-rose-700 border-rose-200",
  missing: "bg-slate-100 text-slate-700 border-slate-200",
  pending: "bg-slate-50 text-slate-400 border-slate-200",
};

const STATUS_LABELS: Record<string, string> = {
  good: "Good",
  needs_repair: "Needs Repair",
  needs_cleaning: "Needs Cleaning",
  damaged: "Damaged",
  missing: "Missing",
  pending: "Pending",
};

interface Props {
  inspectionId: number;
  token: string;
  onCompleted: () => void;
}

export default function InspectionSessionView({ inspectionId, token, onCompleted }: Props) {
  const [inspection, setInspection] = useState<InspectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const loadInspection = useCallback(async () => {
    try {
      const res = await fetch(`/api/inspections/${inspectionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setInspection(await res.json());
      } else {
        setError("Failed to load inspection");
      }
    } catch {
      setError("Failed to load inspection");
    } finally {
      setLoading(false);
    }
  }, [inspectionId, token]);

  useEffect(() => {
    if (!inspectionId) return;
    loadInspection();
  }, [inspectionId, loadInspection]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inspections/${inspectionId}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setInspection(await res.json());
      }
    } catch {
      setError("Failed to start inspection");
    } finally {
      setLoading(false);
    }
  };

  const handleSetFinding = async (findingId: number, status: string) => {
    setSavingId(findingId);
    try {
      const res = await fetch(`/api/inspections/${inspectionId}/findings/${findingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setInspection(await res.json());
      }
    } catch {
      //
    } finally {
      setSavingId(null);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inspections/${inspectionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        onCompleted();
      }
    } catch {
      setError("Failed to complete");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !inspection) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (error && !inspection) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-rose-600 text-sm">{error}</div>;
  }

  if (!inspection) return null;

  const isPending = inspection.status === "scheduled";
  const isInProgress = inspection.status === "in_progress";
  const isCompleted = inspection.status === "completed";

  if (isPending) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs max-w-md w-full text-center space-y-4">
          <h2 className="font-display text-xl font-bold text-slate-900">{inspection.title}</h2>
          <p className="text-xs text-slate-500">{inspection.property?.property_name}{inspection.room ? ` · Room ${inspection.room.room_number}` : ""}</p>
          <p className="text-xs text-slate-400">Status: Scheduled</p>
          <button onClick={handleStart} className="px-6 py-3 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl cursor-pointer">Start Inspection</button>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto"><Check className="w-8 h-8 text-emerald-600" /></div>
          <h2 className="font-display text-xl font-bold text-slate-900">Inspection Complete</h2>
          <button onClick={onCompleted} className="px-6 py-3 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl cursor-pointer">Continue</button>
        </div>
      </div>
    );
  }

  const checked = inspection.findings.filter((f) => f.status !== "pending").length;
  const total = inspection.findings.length;

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <h2 className="font-display text-lg font-bold text-slate-900">{inspection.title}</h2>
          <p className="text-xs text-slate-500">{inspection.property?.property_name}{inspection.room ? ` · Room ${inspection.room.room_number}` : ""}</p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500 font-semibold">Progress</span>
              <span className="font-bold text-slate-700">{checked}/{total}</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${total > 0 ? (checked / total) * 100 : 0}%` }} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {inspection.findings.map((finding) => {
            const isSaving = savingId === finding.finding_id;
            const currentStatus = finding.status;

            return (
              <motion.div
                key={finding.finding_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-semibold text-slate-800">{finding.item_name}</span>
                  {currentStatus !== "pending" && (
                    <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border ${STATUS_COLORS[currentStatus] || ""}`}>
                      {STATUS_LABELS[currentStatus] || currentStatus}
                    </span>
                  )}
                </div>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary mx-auto" />
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {["good", "needs_repair", "needs_cleaning", "damaged", "missing"].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSetFinding(finding.finding_id, s)}
                        className={`px-2 py-1 text-[9px] font-bold rounded-lg border cursor-pointer transition-colors ${
                          currentStatus === s ? STATUS_COLORS[s] : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {STATUS_LABELS[s] || s}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {total > 0 && (
          <button
            onClick={handleComplete}
            className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" /> Complete Inspection
          </button>
        )}
      </div>
    </div>
  );
}
