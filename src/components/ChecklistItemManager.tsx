import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, GripVertical, Check, X, AlertCircle, PowerOff, Droplets, Lightbulb, DoorOpen, Wrench } from "lucide-react";
import { getStoredToken } from "../services/auth";

const CATEGORIES = [
  { value: "general", label: "General", icon: Wrench },
  { value: "electrical", label: "Electrical", icon: PowerOff },
  { value: "plumbing", label: "Plumbing", icon: Droplets },
  { value: "furniture", label: "Furniture", icon: Lightbulb },
  { value: "appliance", label: "Appliance", icon: AlertCircle },
  { value: "structure", label: "Structure", icon: DoorOpen },
];

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-slate-100 text-slate-700 border-slate-200",
  electrical: "bg-amber-100 text-amber-700 border-amber-200",
  plumbing: "bg-blue-100 text-blue-700 border-blue-200",
  furniture: "bg-teal-100 text-teal-700 border-teal-200",
  appliance: "bg-purple-100 text-purple-700 border-purple-200",
  structure: "bg-rose-100 text-rose-700 border-rose-200",
};

interface ChecklistItem {
  item_id: number;
  item_name: string;
  category: string;
  is_required: boolean;
  sort_order: number;
}

interface Props {
  roomTypeId: number;
}

export default function ChecklistItemManager({ roomTypeId }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newRequired, setNewRequired] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editRequired, setEditRequired] = useState(true);

  const authHeaders = (): Record<string, string> => {
    const token = getStoredToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const fetchItems = async () => {
    try {
      const res = await fetch(`/api/checklist-items/room-type/${roomTypeId}`, { headers: authHeaders() });
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch checklist items:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [roomTypeId]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/checklist-items/room-type/${roomTypeId}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          item_name: newName.trim(),
          category: newCategory,
          is_required: newRequired,
        }),
      });
      if (res.ok) {
        setNewName("");
        setNewCategory("general");
        setNewRequired(true);
        setShowAddForm(false);
        fetchItems();
      }
    } catch (e) {
      console.error("Failed to add item:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/checklist-items/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          item_name: editName.trim(),
          category: editCategory,
          is_required: editRequired,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchItems();
      }
    } catch (e) {
      console.error("Failed to update item:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/checklist-items/${id}`, { method: "DELETE", headers: authHeaders() });
      if (res.ok) {
        fetchItems();
      }
    } catch (e) {
      console.error("Failed to delete item:", e);
    }
  };

  const handleMoveUp = async (idx: number) => {
    if (idx === 0) return;
    const current = items[idx];
    const prev = items[idx - 1];
    try {
      const headers = authHeaders();
      await fetch("/api/checklist-items/reorder", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          orders: [
            { id: current.item_id, sort_order: prev.sort_order },
            { id: prev.item_id, sort_order: current.sort_order },
          ],
        }),
      });
      fetchItems();
    } catch (e) {
      console.error("Failed to reorder:", e);
    }
  };

  const handleMoveDown = async (idx: number) => {
    if (idx === items.length - 1) return;
    const current = items[idx];
    const next = items[idx + 1];
    try {
      const headers = authHeaders();
      await fetch("/api/checklist-items/reorder", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          orders: [
            { id: current.item_id, sort_order: next.sort_order },
            { id: next.item_id, sort_order: current.sort_order },
          ],
        }),
      });
      fetchItems();
    } catch (e) {
      console.error("Failed to reorder:", e);
    }
  };

  const startEdit = (item: ChecklistItem) => {
    setEditingId(item.item_id);
    setEditName(item.item_name);
    setEditCategory(item.category);
    setEditRequired(item.is_required);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const CategoryIcon = (cat: string) => {
    const found = CATEGORIES.find((c) => c.value === cat);
    return found ? <found.icon className="w-3 h-3" /> : null;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
          <Check className="w-4 h-4 text-primary" />
          Checklist Items
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

      {items.length === 0 && !showAddForm && (
        <p className="text-xs text-slate-400 text-center py-4">
          No checklist items yet. Add items that need to be verified during check-in/check-out.
        </p>
      )}

      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <motion.div
            key={item.item_id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl group"
          >
            <div className="flex flex-col gap-0.5 opacity-30 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => handleMoveUp(idx)}
                disabled={idx === 0}
                className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-20 disabled:cursor-default leading-none"
              >
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
              </button>
              <button
                type="button"
                onClick={() => handleMoveDown(idx)}
                disabled={idx === items.length - 1}
                className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-20 disabled:cursor-default leading-none"
              >
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
            </div>

            {editingId === item.item_id ? (
              <div className="flex-1 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 min-w-[120px] px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  maxLength={25}
                  autoFocus
                />
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editRequired}
                    onChange={(e) => setEditRequired(e.target.checked)}
                    className="w-3 h-3"
                  />
                  Required
                </label>
                <button
                  type="button"
                  onClick={() => handleUpdate(item.item_id)}
                  disabled={saving}
                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="p-1 text-slate-400 hover:bg-slate-200 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {item.item_name}
                  </span>
                  <span className={`inline-flex items-center gap-1 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.general}`}>
                    {CategoryIcon(item.category)}
                    {CATEGORIES.find((c) => c.value === item.category)?.label || item.category}
                  </span>
                  {item.is_required && (
                    <span className="font-mono text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      Required
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="p-1 text-slate-400 hover:text-primary rounded cursor-pointer"
                    title="Edit"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.item_id)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
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
            placeholder="Item name (e.g. AC Remote)"
            maxLength={25}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={newRequired}
                onChange={(e) => setNewRequired(e.target.checked)}
                className="w-3 h-3"
              />
              Required
            </label>
          </div>
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
