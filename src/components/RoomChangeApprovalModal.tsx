import { useState, useEffect } from "react";
import { X, CheckCircle, Loader2, AlertTriangle, Calendar } from "lucide-react";

interface AvailableRoom {
  room_id: number;
  room_number: string;
  floor_number: number | null;
  room_type: { type_name: string; monthly_price: number };
}

interface RoomChangeRequest {
  request_id: number;
  reason: string | null;
  status: string;
  created_at: string;
  move_date: string | null;
  assignment: {
    assignment_id: number;
    room: { room_number: string; room_type: { type_name: string; monthly_price: number } };
  };
  requested_room: { room_number: string; room_type: { type_name: string } } | null;
  tenant: { full_name: string; email: string; phone: string };
}

interface Props {
  request: RoomChangeRequest;
  propertyId: string;
  token: string;
  onClose: () => void;
  onApproved: () => void;
}

export default function RoomChangeApprovalModal({
  request,
  propertyId,
  token,
  onClose,
  onApproved,
}: Props) {
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [moveDate, setMoveDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch(`/api/properties/${propertyId}/available-rooms`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAvailableRooms(data);
        }
      } catch (e) {
        console.error("Failed to fetch available rooms:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [propertyId, token]);

  const handleApprove = async () => {
    if (!selectedRoomId) {
      setError("Please select a room");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/room-change/requests/${request.request_id}/approve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            newRoomId: selectedRoomId,
            moveDate: moveDate || undefined,
          }),
        }
      );

      if (res.ok) {
        onApproved();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to approve request");
      }
    } catch (e) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentRoomType = request.assignment.room.room_type.type_name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Approve Room Change
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <p className="font-bold text-slate-700 mb-2">Request Details</p>
            <div className="space-y-1 text-slate-600">
              <p>
                <span className="text-slate-400">Tenant:</span>{" "}
                {request.tenant.full_name}
              </p>
              <p>
                <span className="text-slate-400">Current Room:</span>{" "}
                {request.assignment.room.room_number} ({currentRoomType})
              </p>
              {request.requested_room && (
                <p>
                  <span className="text-slate-400">Requested Room:</span>{" "}
                  {request.requested_room.room_number} (
                  {request.requested_room.room_type.type_name})
                </p>
              )}
              {request.reason && (
                <p>
                  <span className="text-slate-400">Reason:</span> {request.reason}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Assign New Room *
            </label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {availableRooms.map((r) => (
                  <button
                    key={r.room_id}
                    type="button"
                    onClick={() =>
                      setSelectedRoomId(
                        selectedRoomId === r.room_id ? null : r.room_id
                      )
                    }
                    className={`p-2 rounded-lg border text-center cursor-pointer transition-colors ${
                      selectedRoomId === r.room_id
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 hover:border-primary/40"
                    }`}
                  >
                    <p className="text-xs font-mono font-bold">{r.room_number}</p>
                    <p className="text-[10px] text-slate-400">
                      {r.room_type.type_name}
                    </p>
                    {r.floor_number && (
                      <p className="text-[10px] text-slate-300">
                        Fl {r.floor_number}
                      </p>
                    )}
                  </button>
                ))}
                {availableRooms.length === 0 && (
                  <p className="col-span-3 text-xs text-slate-400 py-4 text-center">
                    No available rooms
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Move Date (optional)
            </label>
            <input
              type="date"
              value={moveDate}
              onChange={(e) => setMoveDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Leave empty for immediate transfer
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleApprove}
            disabled={!selectedRoomId || submitting}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5" />
            )}
            Approve & Assign Room
          </button>
        </div>
      </div>
    </div>
  );
}
