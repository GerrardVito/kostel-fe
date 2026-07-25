import { useState, useEffect } from "react";
import { Property } from "../types";
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  X,
  Building2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";

interface SurveyFeedbackItem {
  id: number;
  propertyId: string;
  propertyName: string;
  roomTypeId: number | null;
  roomTypeName: string | null;
  roomId: number | null;
  roomNumber: string | null;
  surveyorName: string;
  comment: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

interface RoomOption {
  id: number;
  roomNumber: string;
  roomTypeName: string;
}

interface OwnerSurveyViewProps {
  properties: Property[];
  token: string | null;
}

export default function OwnerSurveyView({
  properties,
  token,
}: OwnerSurveyViewProps) {
  const [feedbacks, setFeedbacks] = useState<SurveyFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [surveyorName, setSurveyorName] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedProperties, setExpandedProperties] = useState<Set<string>>(
    new Set()
  );
  const [roomOptions, setRoomOptions] = useState<RoomOption[]>([]);

  const authHeaders: Record<string, string> = {};
  if (token) authHeaders["Authorization"] = `Bearer ${token}`;

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch("/api/survey-feedbacks", { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
      }
    } catch (e) {
      console.error("Failed to fetch survey feedbacks:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchRooms = async (propertyId: string) => {
    if (!propertyId) {
      setRoomOptions([]);
      return;
    }
    try {
      const res = await fetch(`/api/properties/${propertyId}/room-types`, {
        headers: authHeaders,
      });
      if (res.ok) {
        const types = await res.json();
        const rooms: RoomOption[] = [];
        for (const rt of types) {
          for (const r of rt.rooms || []) {
            rooms.push({
              id: r.id,
              roomNumber: r.roomNumber,
              roomTypeName: rt.name || rt.typeName || "",
            });
          }
        }
        setRoomOptions(rooms);
      }
    } catch (e) {
      console.error("Failed to fetch rooms:", e);
      setRoomOptions([]);
    }
  };

  const handleNewFeedback = () => {
    setEditingId(null);
    setSelectedPropertyId("");
    setSelectedRoomId(null);
    setSurveyorName("");
    setComment("");
    setShowForm(true);
  };

  const handleEdit = (fb: SurveyFeedbackItem) => {
    setEditingId(fb.id);
    setSelectedPropertyId(fb.propertyId);
    setSelectedRoomId(fb.roomId);
    setSurveyorName(fb.surveyorName || "");
    setComment(fb.comment);
    setShowForm(true);
    fetchRooms(fb.propertyId);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setSelectedPropertyId("");
    setSelectedRoomId(null);
    setSurveyorName("");
    setComment("");
    setRoomOptions([]);
  };

  const handleSubmit = async () => {
    if (!selectedPropertyId || !comment.trim()) return;
    setSaving(true);
    try {
      const url = editingId
        ? `/api/survey-feedbacks/${editingId}`
        : "/api/survey-feedbacks";
      const method = editingId ? "PUT" : "POST";
      const body = editingId
        ? { room_id: selectedRoomId, surveyor_name: surveyorName.trim(), comment: comment.trim() }
        : { property_id: selectedPropertyId, room_id: selectedRoomId, surveyor_name: surveyorName.trim(), comment: comment.trim() };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => null);
      console.log("Survey feedback response:", res.status, data);

      if (res.ok) {
        handleCancel();
        fetchFeedbacks();
      } else {
        alert(data?.error || data?.message || `Request failed (${res.status})`);
      }
    } catch (e) {
      console.error("Failed to save feedback:", e);
      alert("Network error. Is the server running?");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this feedback?")) return;
    try {
      const res = await fetch(`/api/survey-feedbacks/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (res.ok) fetchFeedbacks();
    } catch (e) {
      console.error("Failed to delete feedback:", e);
    }
  };

  const toggleProperty = (propId: string) => {
    setExpandedProperties((prev) => {
      const next = new Set(prev);
      if (next.has(propId)) next.delete(propId);
      else next.add(propId);
      return next;
    });
  };

  const grouped = feedbacks.reduce<Record<string, SurveyFeedbackItem[]>>(
    (acc, fb) => {
      if (!acc[fb.propertyId]) acc[fb.propertyId] = [];
      acc[fb.propertyId].push(fb);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            Survey Feedback
          </h2>
          <p className="font-sans text-sm text-slate-500 mt-1">
            Manage property feedback and notes
          </p>
        </div>
        <button
          onClick={handleNewFeedback}
          className="bg-primary text-white px-4 py-2.5 rounded-xl font-sans text-sm font-semibold flex items-center gap-2 hover:bg-primary-container transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Feedback
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-sans font-bold text-slate-900 text-lg">
            {editingId ? "Edit Feedback" : "New Feedback"}
          </h3>

          <div>
            <label className="font-sans text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">
              Property *
            </label>
            <select
              value={selectedPropertyId}
              onChange={(e) => {
                setSelectedPropertyId(e.target.value);
                setSelectedRoomId(null);
                fetchRooms(e.target.value);
              }}
              disabled={!!editingId}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-sans text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select a property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-sans text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">
              Surveyor Name
            </label>
            <input
              type="text"
              value={surveyorName}
              onChange={(e) => setSurveyorName(e.target.value)}
              placeholder="Name of the person conducting the survey"
              maxLength={25}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-sans text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="font-sans text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">
              Room (optional)
            </label>
            <select
              value={selectedRoomId ?? ""}
              onChange={(e) =>
                setSelectedRoomId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-sans text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">All rooms</option>
              {roomOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.roomNumber} ({r.roomTypeName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-sans text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">
              Comment *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Write your feedback..."
              maxLength={200}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-sans text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              className="px-4 py-2.5 rounded-xl font-sans text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedPropertyId || !comment.trim() || saving}
              className="px-6 py-2.5 rounded-xl font-sans text-sm font-semibold text-white bg-primary hover:bg-primary-container transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Submit"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-400 font-sans text-sm">
          Loading...
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl py-16 text-center">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-sans text-sm text-slate-400">
            No feedback yet. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((prop) => {
            const propFeedbacks = grouped[prop.id] || [];
            if (propFeedbacks.length === 0) return null;
            const isExpanded = expandedProperties.has(prop.id);

            return (
              <div
                key={prop.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => toggleProperty(prop.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <span className="font-sans font-bold text-slate-900 capitalize">
                        {prop.name}
                      </span>
                      <span className="font-mono text-xs text-slate-400 ml-2">
                        {propFeedbacks.length} feedback
                        {propFeedbacks.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 py-3 space-y-3">
                    {propFeedbacks.map((fb) => (
                      <div
                        key={fb.id}
                        className="flex items-start justify-between gap-4 p-4 bg-slate-50 rounded-xl"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {fb.roomNumber ? (
                              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                                {fb.roomNumber}
                              </span>
                            ) : (
                              <span className="font-mono text-xs text-slate-400 bg-slate-200 px-2 py-0.5 rounded">
                                All Rooms
                              </span>
                            )}
                            {fb.roomTypeName && (
                              <span className="font-sans text-xs text-slate-400">
                                {fb.roomTypeName}
                              </span>
                            )}
                            {fb.surveyorName && (
                              <span className="font-sans text-xs text-primary bg-primary/5 px-2 py-0.5 rounded">
                                {fb.surveyorName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-start gap-2 mt-2">
                            <MessageSquare className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                            <p className="font-sans text-sm text-slate-700 leading-relaxed">
                              {fb.comment}
                            </p>
                          </div>
                          <p className="font-mono text-[10px] text-slate-400 mt-2">
                            {fb.updatedAt
                              ? new Date(fb.updatedAt).toLocaleDateString()
                              : ""}
                          </p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEdit(fb)}
                            className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-white transition-all cursor-pointer"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(fb.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
