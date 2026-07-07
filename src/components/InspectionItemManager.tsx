import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, Check, X, Wrench } from "lucide-react";
import { getStoredToken } from "../services/auth";

interface InspectionItem {
  inspection_item_id: number;
  item_name: string;
  category: string;
  sort_order: number;
}

interface Props {
  roomTypeId?: number;
  roomId?: number;
  title?: string;
}

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "furniture", label: "Furniture" },
  { value: "appliance", label: "Appliance" },
  { value: "structure", label: "Structure" },
];

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-slate-100 text-slate-700 border-slate-200",
  electrical: "bg-amber-100 text-amber-700 border-amber-200",
  plumbing: "bg-blue-100 text-blue-700 border-blue-200",
  furniture: "bg-teal-100 text-teal-700 border-teal-200",
  appliance: "bg-purple-100 text-purple-700 border-purple-200",
  structure: "bg-rose-100 text-rose-700 border-rose-200",
};

export default function InspectionItemManager({ roomTypeId, roomId, title }: Props) {
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");

  const authHeaders = (): Record<string, string> => {
    const token = getStoredToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const isRoomType = !!roomTypeId;
  const basePath = isRoomType
    ? `/api/inspection-items/room-type/${roomTypeId}`
    : `/api/inspection-items/room/${roomId}`;

  const fetchItems = async () => {
    try {
      const res = await fetch(basePath, { headers: authHeaders() });
      if (res.ok) setItems(await res.json());
    } catch (e) {
      console.error("Failed to fetch inspection items:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [roomTypeId, roomId]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(basePath, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ item_name: newName.trim(), category: newCategory }),
      });
      if (res.ok) {
        setNewName("");
        setNewCategory("general");
        setShowAdd(false);
        fetchItems();
      }
    } catch (e) {
      console.error("Failed to add:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/inspection-items/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ item_name: editName.trim(), category: editCategory }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchItems();
      }
    } catch (e) {
      console.error("Failed to update:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/inspection-items/${id}`, { method: "DELETE", headers: authHeaders() });
      if (res.ok) fetchItems();
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  const handleMove = async (idx: number, dir: "up" | "down") => {
    if (dir === "up" && idx === 0) return;
    if (dir === "down" && idx === items.length - 1) return;
    const current = items[idx];
    const other = items[dir === "up" ? idx - 1 : idx + 1];
    try {
      const headers = authHeaders();
      await fetch("/api/inspection-items/reorder", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          orders: [
            { id: current.inspection_item_id, sort_order: other.sort_order },
            { id: other.inspection_item_id, sort_order: current.sort_order },
          ],
        }),
      });
      fetchItems();
    } catch (e) {
      console.error("Failed to reorder:", e);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-display font-bold text-xs text-slate-900 flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-primary" />
          {title || (isRoomType ? "Inspection Items" : "Room-Specific Items")}
        </h4>
        <button type="button" onClick={() => setShowAdd(true)} className="px-2.5 py-1 bg-primary hover:bg-primary/90 text-white text-[9px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors">
          <Plus className="w-2.5 h-2.5" /> Add
        </button>
      </div>

      {items.length === 0 && !showAdd && (
        <p className="text-[10px] text-slate-400 text-center py-3">No items yet</p>
      )}

      <div className="space-y-1">
        {items.map((item, idx) => (
          <motion.div
            key={item.inspection_item_id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg group"
          >
            <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100">
              <button type="button" onClick={() => handleMove(idx, "up")} disabled={idx === 0} className="p-0 text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-20 disabled:cursor-default leading-none"><svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></button>
              <button type="button" onClick={() => handleMove(idx, "down")} disabled={idx === items.length - 1} className="p-0 text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-20 disabled:cursor-default leading-none"><svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
            </div>

            {editingId === item.inspection_item_id ? (
              <div className="flex-1 flex items-center gap-1.5">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] focus:outline-none" maxLength={25} autoFocus />
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="px-1 py-0.5 bg-white border border-slate-300 rounded text-[10px]">{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
                <button type="button" onClick={() => handleUpdate(item.inspection_item_id)} disabled={saving} className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"><Check className="w-3 h-3" /></button>
                <button type="button" onClick={() => setEditingId(null)} className="p-0.5 text-slate-400 hover:bg-slate-200 rounded cursor-pointer"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <>
                <span className="flex-1 text-[10px] font-semibold text-slate-800 truncate">{item.item_name}</span>
                <span className={`font-mono text-[8px] font-bold px-1 py-0.5 rounded border ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.general}`}>
                  {CATEGORIES.find((c) => c.value === item.category)?.label || item.category}
                </span>
                <button type="button" onClick={() => { setEditingId(item.inspection_item_id); setEditName(item.item_name); setEditCategory(item.category); }} className="p-0.5 text-slate-400 hover:text-primary opacity-0 group-hover:opacity-100 cursor-pointer"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                <button type="button" onClick={() => handleDelete(item.inspection_item_id)} className="p-0.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 cursor-pointer"><Trash2 className="w-3 h-3" /></button>
              </>
            )}
          </motion.div>
        ))}
      </div>

      {showAdd && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-2 bg-primary/5 border border-primary/20 rounded-lg space-y-1.5">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Item name" maxLength={25} className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-primary/30" autoFocus />
          <div className="flex items-center gap-1.5">
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="flex-1 px-1.5 py-1 bg-white border border-slate-200 rounded text-[10px]">{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
            <button type="button" onClick={() => { setShowAdd(false); setNewName(""); }} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-bold rounded cursor-pointer">Cancel</button>
            <button type="button" onClick={handleAdd} disabled={saving || !newName.trim()} className="px-2 py-1 bg-primary hover:bg-primary/90 text-white text-[9px] font-bold rounded cursor-pointer disabled:opacity-50">Add</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
