import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { BedDouble, DollarSign, Maximize, ArrowLeft, Check, Loader2, Hash, Building2 } from "lucide-react";
import ImageCarousel from "./ImageCarousel";

interface AvailableRoom {
  id: number;
  roomNumber: string;
  floorNumber: number | null;
}

interface RoomTypeGroup {
  id: number;
  name: string;
  monthlyPrice: number;
  depositPrice: number;
  roomSize: string;
  image: string;
  images: string[];
  availableRooms: AvailableRoom[];
}

interface Props {
  propertyId: string;
  propertyName: string;
  onSelected: (roomId: number, roomNumber: string, roomTypeName: string, depositPrice: number, monthlyPrice: number) => void;
  onBack: () => void;
}

export default function RoomSelectionView({ propertyId, propertyName, onSelected, onBack }: Props) {
  const [types, setTypes] = useState<RoomTypeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<RoomTypeGroup | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<AvailableRoom | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId) {
      setError("No property selected. Please go back and try again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/properties/${propertyId}/available-rooms`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load rooms (HTTP ${r.status})`);
        return r.json();
      })
      .then((data) => { setTypes(data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [propertyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6 text-center">
            <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">Unable to Load Rooms</h2>
              <p className="text-xs text-slate-500 mt-2">{error}</p>
            </div>
            <button onClick={onBack} className="px-6 py-3 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl cursor-pointer transition-all">
              Go Back
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl cursor-pointer transition-all">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">
                {selectedType ? "Choose a Room" : "Choose a Room Type"}
              </h2>
              <p className="text-xs text-slate-500">{propertyName}</p>
            </div>
          </div>

          {!selectedType ? (
            <div className="space-y-3">
              {types.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">No available rooms</div>
              ) : types.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {t.image ? (
                        <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display font-bold text-slate-900 text-sm">{t.name}</h4>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700">
                          <DollarSign className="w-3 h-3" />
                          {t.monthlyPrice.toLocaleString()}/mo
                        </span>
                        {t.roomSize && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                            <Maximize className="w-3 h-3" />
                            {t.roomSize}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                          <BedDouble className="w-3 h-3" />
                          {t.availableRooms.length} available
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Room Type Images Carousel */}
              {selectedType.images && selectedType.images.length > 0 && (
                <ImageCarousel
                  images={selectedType.images}
                  alt={selectedType.name}
                  aspectRatio="video"
                  showThumbnails={selectedType.images.length > 1}
                />
              )}

              {/* Room Type Info */}
              <div className="p-3 bg-slate-50 rounded-xl">
                <h4 className="font-display font-bold text-slate-900">{selectedType.name}</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700">
                    <DollarSign className="w-3 h-3" />
                    {selectedType.monthlyPrice.toLocaleString()}/mo
                  </span>
                  {selectedType.roomSize && (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      <Maximize className="w-3 h-3" />
                      {selectedType.roomSize}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select a Room</p>
              {selectedType.availableRooms.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">No rooms available in this type</div>
              ) : selectedType.availableRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full p-4 rounded-xl border-2 transition-all cursor-pointer text-left flex items-center justify-between ${
                    selectedRoom?.id === room.id
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 bg-slate-50 hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      selectedRoom?.id === room.id ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-500"
                    }`}>
                      <Hash className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-sm block">{room.roomNumber}</span>
                      {room.floorNumber && (
                        <span className="font-mono text-[10px] text-slate-400">Floor {room.floorNumber}</span>
                      )}
                    </div>
                  </div>
                  {selectedRoom?.id === room.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setSelectedType(null)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-50 transition-all"
                >
                  Back to Types
                </button>
                <button
                  onClick={() => selectedRoom && onSelected(selectedRoom.id, selectedRoom.roomNumber, selectedType.name, selectedType.depositPrice, selectedType.monthlyPrice)}
                  disabled={!selectedRoom}
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
