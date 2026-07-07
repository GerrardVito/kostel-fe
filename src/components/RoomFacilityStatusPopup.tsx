import { useState, useEffect } from "react";
import { X, CheckCircle, AlertTriangle, Wrench, RefreshCw } from "lucide-react";

interface FacilityStatus {
  facility_id: number;
  facility_name: string;
  status: string;
  notes: string | null;
  status_id: number | null;
}

interface Props {
  roomId: number;
  roomNumber: string;
  onClose: () => void;
}

const STATUS_OPTIONS = [
  { value: "working", label: "Working", icon: CheckCircle, color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  { value: "broken", label: "Broken", icon: AlertTriangle, color: "bg-red-100 text-red-700 border-red-300" },
  { value: "maintenance", label: "Maintenance", icon: RefreshCw, color: "bg-amber-100 text-amber-700 border-amber-300" },
];

export default function RoomFacilityStatusPopup({ roomId, roomNumber, onClose }: Props) {
  const [facilities, setFacilities] = useState<FacilityStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  const fetchFacilities = async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/facilities`);
      if (res.ok) setFacilities(await res.json());
    } catch (e) {
      console.error("Failed to fetch facility statuses:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [roomId]);

  const updateStatus = async (facilityId: number, status: string, notes?: string) => {
    setSavingId(facilityId);
    try {
      await fetch(`/api/rooms/${roomId}/facilities/${facilityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      fetchFacilities();
    } catch (e) {
      console.error("Failed to update facility status:", e);
    } finally {
      setSavingId(null);
    }
  };

  const cycleStatus = (current: string): string => {
    const order = ["working", "broken", "maintenance"];
    const idx = order.indexOf(current);
    return order[(idx + 1) % order.length];
  };

  const StatusIcon = (status: string) => {
    const option = STATUS_OPTIONS.find((o) => o.value === status);
    if (!option) return null;
    const Icon = option.icon;
    return <Icon className="w-3.5 h-3.5" />;
  };

  const getStatusColor = (status: string) => {
    const option = STATUS_OPTIONS.find((o) => o.value === status);
    return option ? option.color : "bg-slate-100 text-slate-600 border-slate-200";
  };

  const getStatusLabel = (status: string) => {
    const option = STATUS_OPTIONS.find((o) => o.value === status);
    return option ? option.label : status;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900">Room {roomNumber}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Facility status</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : facilities.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl py-10 text-center">
            <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No facilities defined for this room type</p>
            <p className="text-[10px] text-slate-300 mt-1">Add facilities in Room Type Settings first</p>
          </div>
        ) : (
          <div className="space-y-2">
            {facilities.map((facility) => (
              <div
                key={facility.facility_id}
                className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-slate-800 block truncate">
                    {facility.facility_name}
                  </span>
                  {facility.notes && (
                    <span className="text-[9px] text-slate-400 mt-0.5 block truncate">
                      {facility.notes}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="text"
                    placeholder="Notes..."
                    defaultValue={facility.notes || ""}
                    maxLength={200}
                    onBlur={(e) => {
                      if (e.target.value !== (facility.notes || "")) {
                        updateStatus(facility.facility_id, facility.status, e.target.value || undefined);
                      }
                    }}
                    className="w-20 px-1.5 py-1 bg-white border border-slate-200 rounded text-[9px] focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  <button
                    onClick={() => {
                      const nextStatus = cycleStatus(facility.status);
                      updateStatus(facility.facility_id, nextStatus, facility.notes || undefined);
                    }}
                    disabled={savingId === facility.facility_id}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-bold cursor-pointer transition-all disabled:opacity-50 ${getStatusColor(facility.status)}`}
                  >
                    {savingId === facility.facility_id ? (
                      <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      StatusIcon(facility.status)
                    )}
                    {getStatusLabel(facility.status)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
