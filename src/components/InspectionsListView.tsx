import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ClipboardCheck, Plus, Calendar, Loader2, Eye } from "lucide-react";
import InspectionSessionView from "./InspectionSessionView";

interface InspectionSummary {
  inspection_id: number;
  title: string;
  inspection_type: string;
  status: string;
  scheduled_date: string;
  completed_date: string | null;
  property: { property_name: string };
  room: { room_number: string } | null;
  inspector: { full_name: string } | null;
  _count: { findings: number };
}

interface Props {
  token: string;
  onScheduleNew: () => void;
}

export default function InspectionsListView({ token, onScheduleNew }: Props) {
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);

  const fetchInspections = async () => {
    try {
      const res = await fetch("/api/inspections", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setInspections(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch inspections:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, [token]);

  if (activeId) {
    return (
      <InspectionSessionView
        inspectionId={activeId}
        token={token}
        onCompleted={() => {
          setActiveId(null);
          fetchInspections();
        }}
      />
    );
  }

  const STATUS_COLORS: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-2xl font-bold text-slate-900">Inspections</h3>
          <p className="text-xs text-slate-500 mt-1">{inspections.length} total</p>
        </div>
        <button
          onClick={onScheduleNew}
          className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Schedule
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : inspections.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl py-16 text-center">
          <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-sm text-slate-500">No inspections yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {inspections.map((ins) => (
            <motion.div
              key={ins.inspection_id}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-800">{ins.title}</span>
                  <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded ${STATUS_COLORS[ins.status] || "bg-slate-100 text-slate-600"}`}>
                    {ins.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                  <span>{ins.property?.property_name}</span>
                  {ins.room && <span>Room {ins.room.room_number}</span>}
                  <span>{ins._count?.findings || 0} findings</span>
                  <span>{new Date(ins.scheduled_date).toLocaleDateString()}</span>
                </div>
              </div>
              {ins.status !== "completed" && (
                <button
                  onClick={() => setActiveId(ins.inspection_id)}
                  className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Eye className="w-3 h-3" /> Open
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
