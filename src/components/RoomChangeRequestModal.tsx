import { useState, useEffect } from "react";
import { ArrowRightLeft, Loader2, AlertTriangle } from "lucide-react";
import Modal from "./ui/Modal";

interface RoomTypeOption {
  id: number;
  type_name: string;
  monthly_price: number;
  room_size: string;
}

interface AvailableRoom {
  room_id: number;
  room_number: string;
  floor_number: number | null;
  room_type: { type_name: string; monthly_price: number; room_size: string };
}

interface Props {
  propertyId: string;
  assignmentId: number;
  currentRoomNumber: string;
  currentRoomType: string;
  currentMonthlyPrice: number;
  token: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function RoomChangeRequestModal({
  propertyId,
  assignmentId,
  currentRoomNumber,
  currentRoomType,
  currentMonthlyPrice,
  token,
  onClose,
  onSubmitted,
}: Props) {
  const [roomTypes, setRoomTypes] = useState<RoomTypeOption[]>([]);
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
  const [selectedRoomType, setSelectedRoomType] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/properties/${propertyId}/room-types`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setRoomTypes(
            data.map((rt: any) => ({
              id: rt.room_type_id || rt.id,
              type_name: rt.type_name || rt.name,
              monthly_price: Number(rt.monthly_price || rt.monthlyPrice || 0),
              room_size: rt.room_size || rt.roomSize || "",
            }))
          );
        }
      } catch (e) {
        console.error("Failed to fetch room types:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [propertyId, token]);

  useEffect(() => {
    if (!selectedRoomType) {
      setAvailableRooms([]);
      setSelectedRoomId(null);
      return;
    }

    const fetchRooms = async () => {
      try {
        const res = await fetch(`/api/properties/${propertyId}/available-rooms`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const filtered = data.filter(
            (r: any) =>
              (r.room_type?.type_name || r.roomType) === selectedRoomType
          );
          setAvailableRooms(filtered);
          setSelectedRoomId(null);
        }
      } catch (e) {
        console.error("Failed to fetch available rooms:", e);
      }
    };
    fetchRooms();
  }, [propertyId, selectedRoomType, token]);

  const handleSubmit = async () => {
    if (!selectedRoomType) {
      setError("Please select a room type");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/room-change/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignmentId,
          requestedRoomId: selectedRoomId || undefined,
          reason: reason || undefined,
        }),
      });

      if (res.ok) {
        onSubmitted();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to submit request");
      }
    } catch (e) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const otherRoomTypes = roomTypes.filter(
    (rt) => rt.type_name !== currentRoomType
  );

  return (
    <Modal
      size="lg"
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-primary" />
          Request Room Change
        </span>
      }
      footer={
        loading ? undefined : (
          <button
            onClick={handleSubmit}
            disabled={!selectedRoomType || submitting}
            className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ArrowRightLeft className="w-3.5 h-3.5" />
            )}
            Submit Request
          </button>
        )
      }
    >
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs text-slate-600">
        <p className="font-bold mb-1">Current Room</p>
        <p>
          Room {currentRoomNumber} — {currentRoomType} — Rp{" "}
          {currentMonthlyPrice.toLocaleString()}/month
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select New Room Type *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {otherRoomTypes.map((rt) => (
                <button
                  key={rt.id}
                  type="button"
                  onClick={() => setSelectedRoomType(rt.type_name)}
                  className={`p-3 rounded-xl border-2 text-left cursor-pointer transition-colors ${
                    selectedRoomType === rt.type_name
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 hover:border-primary/40"
                  }`}
                >
                  <p className="text-xs font-bold text-slate-800">
                    {rt.type_name}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Rp {rt.monthly_price.toLocaleString()}/month
                  </p>
                  {rt.room_size && (
                    <p className="text-[10px] text-slate-400">{rt.room_size}</p>
                  )}
                </button>
              ))}
              {otherRoomTypes.length === 0 && (
                <p className="col-span-2 text-xs text-slate-400 py-4 text-center">
                  No other room types available
                </p>
              )}
            </div>
          </div>

          {selectedRoomType && availableRooms.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Specific Room (optional)
              </label>
              <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {availableRooms.map((r) => (
                  <button
                    key={r.room_id}
                    type="button"
                    onClick={() =>
                      setSelectedRoomId(
                        selectedRoomId === r.room_id ? null : r.room_id
                      )
                    }
                    className={`p-2 rounded-lg border text-center text-xs font-mono cursor-pointer transition-colors ${
                      selectedRoomId === r.room_id
                        ? "border-primary bg-primary/5 font-bold"
                        : "border-slate-200 hover:border-primary/40"
                    }`}
                  >
                    {r.room_number}
                    {r.floor_number && (
                      <span className="text-[10px] text-slate-400 block">
                        Floor {r.floor_number}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do you want to change rooms?"
              rows={3}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-primary focus:outline-none resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
