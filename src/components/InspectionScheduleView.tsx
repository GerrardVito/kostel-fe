import { useState } from "react";
import { motion } from "motion/react";
import { Calendar, Plus, Loader2, ArrowLeft } from "lucide-react";

interface Props {
  token: string;
  onCreated: () => void;
  onBack: () => void;
}

export default function InspectionScheduleView({ token, onCreated, onBack }: Props) {
  const [propertyId, setPropertyId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("periodic");
  const [scheduledDate, setScheduledDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !title || !scheduledDate) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          property_id: parseInt(propertyId),
          room_id: roomId ? parseInt(roomId) : undefined,
          title,
          inspection_type: type,
          scheduled_date: scheduledDate,
        }),
      });
      if (res.ok) {
        onCreated();
      } else {
        const d = await res.json();
        setError(d.message || "Failed to create");
      }
    } catch {
      setError("Failed to create inspection");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl cursor-pointer">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">Schedule Inspection</h2>
              <p className="text-xs text-slate-500">Create a new room inspection</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Property ID</label>
              <input type="number" required value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Room ID (optional)</label>
              <input type="number" value={roomId} onChange={(e) => setRoomId(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Monthly Room 101 Inspection" maxLength={25} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none">
                <option value="periodic">Periodic</option>
                <option value="pre-move-in">Pre-Move-In</option>
                <option value="pre-move-out">Pre-Move-Out</option>
                <option value="complaint">Complaint</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Scheduled Date</label>
              <input type="datetime-local" required value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              Schedule Inspection
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
