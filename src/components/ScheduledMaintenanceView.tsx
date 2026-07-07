import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Calendar, RefreshCw, Wrench, Clock, CheckCircle } from "lucide-react";

interface MaintRecord {
  maintenance_id: number;
  maintenance_title: string;
  maintenance_type: string | null;
  status: string;
  scheduled_date: string | null;
  completed_date: string | null;
  vendor_name: string | null;
  vendor_phone: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  recurrence_interval: number | null;
  recurrence_unit: string | null;
  next_due_date: string | null;
  property: { property_name: string };
  room: { room_number: string } | null;
}

export default function ScheduledMaintenanceView() {
  const [upcoming, setUpcoming] = useState<MaintRecord[]>([]);
  const [recurring, setRecurring] = useState<MaintRecord[]>([]);
  const [tab, setTab] = useState<"upcoming" | "recurring">("upcoming");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [upRes, recRes] = await Promise.all([
        fetch("/api/maintenance-requests/upcoming/list?days=30"),
        fetch("/api/maintenance-requests/recurring/list"),
      ]);
      if (upRes.ok) setUpcoming(await upRes.json());
      if (recRes.ok) setRecurring(await recRes.json());
    } catch (e) {
      console.error("Failed to fetch maintenance:", e);
    } finally {
      setLoading(false);
    }
  };

  const STATUS_COLORS: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-slate-100 text-slate-500",
  };

  const renderItem = (m: MaintRecord) => (
    <motion.div
      key={m.maintenance_id}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-sm text-slate-800">{m.maintenance_title}</h4>
          <p className="text-[10px] text-slate-500">{m.property?.property_name}{m.room ? ` · Room ${m.room.room_number}` : ""}</p>
        </div>
        <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${STATUS_COLORS[m.status] || "bg-slate-100 text-slate-600"}`}>
          {m.status}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
        {m.scheduled_date && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(m.scheduled_date).toLocaleDateString()}
          </span>
        )}
        {m.next_due_date && (
          <span className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            Next: {new Date(m.next_due_date).toLocaleDateString()}
          </span>
        )}
        {m.vendor_name && <span className="flex items-center gap-1"><Wrench className="w-3 h-3" />{m.vendor_name}</span>}
        {m.vendor_phone && <span>{m.vendor_phone}</span>}
        {m.estimated_cost != null && <span>Est: Rp {m.estimated_cost.toLocaleString()}</span>}
        {m.recurrence_interval && m.recurrence_unit && (
          <span className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            Every {m.recurrence_interval} {m.recurrence_unit}{m.recurrence_interval > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-2xl font-bold text-slate-900">Scheduled Maintenance</h3>
          <p className="text-xs text-slate-500 mt-1">Upcoming & recurring tasks</p>
        </div>
        <button onClick={fetchData} className="p-2 text-slate-400 hover:text-primary rounded-lg hover:bg-slate-100 cursor-pointer">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-3">
        {(["upcoming", "recurring"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
              tab === t ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t === "upcoming" ? "Upcoming (30d)" : "Recurring"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {(tab === "upcoming" ? upcoming : recurring).length > 0
            ? (tab === "upcoming" ? upcoming : recurring).map(renderItem)
            : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl py-12 text-center text-slate-400 text-xs">
                No {tab} maintenance tasks
              </div>
            )}
        </div>
      )}
    </div>
  );
}
