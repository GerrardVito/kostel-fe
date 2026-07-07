import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, Wrench } from "lucide-react";

interface RoomFacility {
  facility_id: number;
  facility_name: string;
}

interface Props {
  roomTypeId: number;
}

export default function RoomFacilityManager({ roomTypeId }: Props) {
  const [facilities, setFacilities] = useState<RoomFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchFacilities = async () => {
    try {
      const res = await fetch(`/api/room-facilities/room-type/${roomTypeId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setFacilities(data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch facilities:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [roomTypeId]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/room-facilities/room-type/${roomTypeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facility_name: newName.trim() }),
      });
      if (res.ok) {
        setNewName("");
        setShowAddForm(false);
        fetchFacilities();
      }
    } catch (e) {
      console.error("Failed to add facility:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/room-facilities/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchFacilities();
      }
    } catch (e) {
      console.error("Failed to delete facility:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" />
          Room Facilities
        </h4>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Item
            </button>
      </div>

      {facilities.length === 0 && !showAddForm && (
        <p className="text-xs text-slate-400 text-center py-4">
          No facilities yet. Add room facilities like AC, TV, Bed, etc.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {facilities.map((facility) => (
          <motion.div
            key={facility.facility_id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl group"
          >
            <span className="text-xs font-semibold text-slate-800">
              {facility.facility_name}
            </span>
            <button
              type="button"
              onClick={() => handleDelete(facility.facility_id)}
              className="p-0.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              title="Remove facility"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
      </div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-2"
        >
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Facility name (e.g. AC, Smart TV, Water Heater)"
            maxLength={25}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setNewName(""); }}
              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving || !newName.trim()}
              className="flex-1 py-1.5 bg-primary hover:bg-primary/90 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Item"}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
