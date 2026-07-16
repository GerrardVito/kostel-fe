import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  BedDouble,
  DollarSign,
  Maximize,
  Users,
  Trash2,
  Hash,
  Layers,
  FileText,
  Settings,
  Check,
  Wrench,
} from "lucide-react";
import ImageUploader from "./ImageUploader";
import MultiImageUploader from "./MultiImageUploader";
import ChecklistItemManager from "./ChecklistItemManager";
import InspectionItemManager from "./InspectionItemManager";
import RoomFacilityManager from "./RoomFacilityManager";
import RoomFacilityStatusPopup from "./RoomFacilityStatusPopup";
import TenantRoomDetailView from "./TenantRoomDetailView";
import ImageCarousel from "./ImageCarousel";
import { getStoredToken } from "../services/auth";

interface RoomData {
  id: number;
  roomNumber: string;
  floorNumber: number | null;
  status: string;
  tenantName?: string;
}

interface RoomTypeData {
  id: number;
  name: string;
  description: string;
  monthlyPrice: number;
  depositPrice: number;
  roomSize: string;
  maxOccupancy: number;
  totalRooms: number;
  image: string;
  images: string[];
  contractTemplate: string;
  sortOrder: number;
  roomCount: number;
  rooms: RoomData[];
}

interface PropertyInfo {
  id: string;
  name: string;
}

interface OwnerRoomTypesViewProps {
  property: PropertyInfo;
  onBack: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700 border-emerald-200",
  occupied: "bg-slate-100 text-slate-600 border-slate-200",
  maintenance: "bg-amber-100 text-amber-700 border-amber-200",
};

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  occupied: "Occupied",
  maintenance: "Maintenance",
};

export default function OwnerRoomTypesView({ property, onBack }: OwnerRoomTypesViewProps) {
  const authHeaders = (): Record<string, string> => {
    const token = getStoredToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const [uploadingContract, setUploadingContract] = useState<number | null>(null);
  const [view, setView] = useState<"room-types" | "rooms" | "room-detail">("room-types");
  const [roomTypes, setRoomTypes] = useState<RoomTypeData[]>([]);
  const [selectedType, setSelectedType] = useState<RoomTypeData | null>(null);
  const [loading, setLoading] = useState(true);

  // Add room type modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addDeposit, setAddDeposit] = useState("");
  const [addSize, setAddSize] = useState("");
  const [addMaxOcc, setAddMaxOcc] = useState("2");
  const [addDesc, setAddDesc] = useState("");
  const [addImages, setAddImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Bulk generate rooms
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCount, setBulkCount] = useState("10");
  const [bulkPrefix, setBulkPrefix] = useState("");
  const [bulkStartNum, setBulkStartNum] = useState("1");
  const [bulkFloor, setBulkFloor] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  // Room type settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsData, setSettingsData] = useState<RoomTypeData | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDeposit, setEditDeposit] = useState("");
  const [editSize, setEditSize] = useState("");
  const [editMaxOcc, setEditMaxOcc] = useState("2");
  const [editDesc, setEditDesc] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  // Room profits
  const [roomProfits, setRoomProfits] = useState<Record<number, { total_income: number; total_expense: number; profit: number }>>({});

  // Facility status popup
  const [facilityPopupRoom, setFacilityPopupRoom] = useState<RoomData | null>(null);

  // Add single room modal
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [addRoomNumber, setAddRoomNumber] = useState("");
  const [addRoomFloor, setAddRoomFloor] = useState("");
  const [addRoomSaving, setAddRoomSaving] = useState(false);

  // Delete single room
  const [showDeleteRoomModal, setShowDeleteRoomModal] = useState(false);
  const [deleteRoomTarget, setDeleteRoomTarget] = useState<RoomData | null>(null);

  // Tenant room detail modal
  const [selectedRoomDetail, setSelectedRoomDetail] = useState<RoomData | null>(null);

  const fetchRoomTypes = async () => {
    try {
      const res = await fetch(`/api/properties/${property.id}/room-types`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRoomTypes(data);
      }
    } catch (e) {
      console.error("Failed to fetch room types:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomTypes();
  }, [property.id]);

  useEffect(() => {
    if (selectedType) {
      const updated = roomTypes.find((rt) => rt.id === selectedType.id);
      if (updated) {
        setSelectedType(updated);
      }
    }
  }, [roomTypes]);

  const fetchRoomProfits = async () => {
    try {
      const res = await fetch(`/api/rooms/profit/property/${property.id}`, { headers: authHeaders() });
      if (res.ok) {
        const data: { room_id: number; total_income: number; total_expense: number; profit: number }[] = await res.json();
        const map: Record<number, { total_income: number; total_expense: number; profit: number }> = {};
        data.forEach((r) => { map[r.room_id] = { total_income: r.total_income, total_expense: r.total_expense, profit: r.profit }; });
        setRoomProfits(map);
      }
    } catch (e) {
      console.error("Failed to fetch room profits:", e);
    }
  };

  useEffect(() => {
    if (selectedType) {
      fetchRoomProfits();
    }
  }, [selectedType]);

  const handleAddRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addPrice) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/properties/${property.id}/room-types`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name: addName,
          monthlyPrice: parseFloat(addPrice),
          depositPrice: parseFloat(addDeposit) || 0,
          roomSize: addSize,
          maxOccupancy: parseInt(addMaxOcc) || 1,
          description: addDesc,
          image: addImages[0] || "",
          image_urls: addImages,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setAddName("");
        setAddPrice("");
        setAddDeposit("");
        setAddSize("");
        setAddMaxOcc("2");
        setAddDesc("");
        setAddImages([]);
        fetchRoomTypes();
      }
    } catch (e) {
      console.error("Failed to create room type:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadContract = async (roomTypeId: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploadingContract(roomTypeId);
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch(`/api/room-types/${roomTypeId}/contract`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getStoredToken()}` },
          body: formData,
        });
        if (res.ok) {
          fetchRoomTypes();
        }
      } catch (e) {
        console.error("Failed to upload contract:", e);
      } finally {
        setUploadingContract(null);
      }
    };
    input.click();
  };

  const handleDeleteRoomType = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/room-types/${deleteTarget}`, { method: "DELETE", headers: authHeaders() });
      if (res.ok) {
        setShowDeleteModal(false);
        setDeleteTarget(null);
        fetchRoomTypes();
        if (selectedType?.id === deleteTarget) {
          setView("room-types");
          setSelectedType(null);
        }
      }
    } catch (e) {
      console.error("Failed to delete room type:", e);
    }
  };

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkCount || !selectedType) return;
    setBulkSaving(true);
    try {
      const res = await fetch(`/api/properties/${property.id}/rooms/bulk-generate`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          roomTypeId: selectedType.id,
          count: parseInt(bulkCount),
          prefix: bulkPrefix,
          startingNumber: parseInt(bulkStartNum) || 1,
          floorNumber: bulkFloor ? parseInt(bulkFloor) : null,
        }),
      });
      if (res.ok) {
        setShowBulkModal(false);
        setBulkCount("10");
        setBulkPrefix("");
        setBulkStartNum("1");
        setBulkFloor("");
        fetchRoomTypes();
      }
    } catch (e) {
      console.error("Failed to generate rooms:", e);
    } finally {
      setBulkSaving(false);
    }
  };

  const handleOpenRoomDetail = (room: RoomData) => {
    setSelectedRoomDetail(room);
    setView("room-detail");
  };

  const handleOpenSettings = (rt: RoomTypeData) => {
    setSettingsData(rt);
    setEditName(rt.name);
    setEditPrice(rt.monthlyPrice.toString());
    setEditDeposit(rt.depositPrice.toString());
    setEditSize(rt.roomSize || "");
    setEditMaxOcc(rt.maxOccupancy.toString());
    setEditDesc(rt.description || "");
    setEditImages(rt.images && rt.images.length > 0 ? rt.images : (rt.image ? [rt.image] : []));
    setShowSettingsModal(true);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsData || !editName || !editPrice) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/room-types/${settingsData.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          type_name: editName,
          monthly_price: parseFloat(editPrice),
          deposit_price: parseFloat(editDeposit) || 0,
          room_size: editSize,
          max_occupancy: parseInt(editMaxOcc) || 1,
          description: editDesc,
          image_urls: editImages,
        }),
      });
      if (res.ok) {
        setShowSettingsModal(false);
        setSettingsData(null);
        fetchRoomTypes();
      }
    } catch (e) {
      console.error("Failed to update room type:", e);
    } finally {
      setEditSaving(false);
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addRoomNumber || !selectedType) return;
    setAddRoomSaving(true);
    try {
      const res = await fetch(`/api/properties/${property.id}/rooms`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          roomNumber: addRoomNumber,
          monthlyPrice: selectedType.monthlyPrice,
          status: "available",
          roomType: selectedType.name,
        }),
      });
      if (res.ok) {
        setShowAddRoomModal(false);
        setAddRoomNumber("");
        setAddRoomFloor("");
        fetchRoomTypes();
      }
    } catch (e) {
      console.error("Failed to add room:", e);
    } finally {
      setAddRoomSaving(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!deleteRoomTarget) return;
    try {
      const res = await fetch(`/api/rooms/${deleteRoomTarget.id}`, { method: "DELETE", headers: authHeaders() });
      if (res.ok) {
        setShowDeleteRoomModal(false);
        setDeleteRoomTarget(null);
        fetchRoomTypes();
      }
    } catch (e) {
      console.error("Failed to delete room:", e);
    }
  };

  const handleSelectRoomType = (rt: RoomTypeData) => {
    setSelectedType(rt);
    setView("rooms");
  };

  const handleMoveUp = async (rt: RoomTypeData, index: number) => {
    if (index === 0) return;
    const prev = roomTypes[index - 1];
    const orders = [
      { id: rt.id, sort_order: prev.sortOrder },
      { id: prev.id, sort_order: rt.sortOrder },
    ];
    try {
      await fetch("/api/room-types/reorder", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ orders }),
      });
      fetchRoomTypes();
    } catch (e) {
      console.error("Failed to reorder:", e);
    }
  };

  const handleMoveDown = async (rt: RoomTypeData, index: number) => {
    if (index === roomTypes.length - 1) return;
    const next = roomTypes[index + 1];
    const orders = [
      { id: rt.id, sort_order: next.sortOrder },
      { id: next.id, sort_order: rt.sortOrder },
    ];
    try {
      await fetch("/api/room-types/reorder", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ orders }),
      });
      fetchRoomTypes();
    } catch (e) {
      console.error("Failed to reorder:", e);
    }
  };

  const roomTypeInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
        <button onClick={onBack} className="hover:text-primary transition-colors cursor-pointer">
          Properties
        </button>
        <span>/</span>
        <span className="text-slate-700 font-semibold">{property.name}</span>
        {selectedType && (
          <>
            <span>/</span>
            <button
              onClick={() => { setView("room-types"); setSelectedType(null); setSelectedRoomDetail(null); }}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              {selectedType.name}
            </button>
          </>
        )}
        {selectedRoomDetail && view === "room-detail" && (
          <>
            <span>/</span>
            <span className="text-slate-700 font-semibold">{selectedRoomDetail.roomNumber}</span>
          </>
        )}
      </div>

      {view === "room-types" ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-2xl font-bold text-slate-900">Room Types</h3>
              <p className="text-xs text-slate-500 mt-1">
                {roomTypes.length} type{roomTypes.length !== 1 ? "s" : ""} · {property.name}
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Type
            </button>
          </div>

          {/* Room Types Grid */}
          {roomTypes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roomTypes.map((rt, idx) => (
                <div
                  key={rt.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group"
                  onClick={() => handleSelectRoomType(rt)}
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {rt.image ? (
                        <img
                          src={rt.image}
                          alt={rt.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-primary">
                          {roomTypeInitials(rt.name)}
                        </span>
                      )}
                    </div>
                    <div                     className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-display font-bold text-slate-900 text-sm leading-tight">
                          {rt.name}
                        </h4>
                        <div className="flex items-center gap-1">
                          <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMoveUp(rt, idx); }}
                              disabled={idx === 0}
                              className="p-0.5 text-slate-300 hover:text-slate-700 cursor-pointer disabled:opacity-20 disabled:cursor-default"
                              title="Move up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMoveDown(rt, idx); }}
                              disabled={idx === roomTypes.length - 1}
                              className="p-0.5 text-slate-300 hover:text-slate-700 cursor-pointer disabled:opacity-20 disabled:cursor-default"
                              title="Move down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSettings(rt);
                            }}
                            className="p-1.5 text-slate-300 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                            title="Room type settings"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                          {rt.contractTemplate ? (
                            <span className="font-mono text-[9px] text-emerald-600 font-bold px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                              Contract
                            </span>
                          ) : null}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUploadContract(rt.id);
                            }}
                            disabled={uploadingContract === rt.id}
                            className="p-1.5 text-slate-300 hover:text-primary opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0 disabled:opacity-30"
                            title="Upload contract PDF"
                          >
                            {uploadingContract === rt.id ? (
                              <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin block" />
                            ) : (
                              <FileText className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(rt.id);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {rt.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{rt.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                          <DollarSign className="w-3 h-3" />
                          {rt.monthlyPrice.toLocaleString()}
                        </span>
                        {rt.roomSize && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            <Maximize className="w-3 h-3" />
                            {rt.roomSize}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200">
                          <BedDouble className="w-3 h-3" />
                          {rt.roomCount} rooms
                        </span>
                        {rt.maxOccupancy > 1 && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                            <Users className="w-3 h-3" />
                            Up to {rt.maxOccupancy}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl py-16 text-center">
              <BedDouble className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-sans font-semibold text-sm text-slate-500">No room types yet</p>
              <p className="text-xs text-slate-400 mt-1">Add a room type to start managing rooms</p>
            </div>
          )}
        </>
      ) : view === "rooms" ? (
        /* Level 3: Rooms Grid */
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setView("room-types"); setSelectedType(null); }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500" />
              </button>
              <div>
                <h3 className="font-display text-2xl font-bold text-slate-900">
                  {selectedType?.name || "Rooms"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedType?.rooms.filter((r) => r.status === "occupied").length || 0} occupied ·{" "}
                  {selectedType?.rooms.filter((r) => r.status === "available").length || 0} available ·{" "}
                  {selectedType?.rooms.filter((r) => r.status === "maintenance").length || 0} maintenance
                </p>
                {Object.keys(roomProfits).length > 0 && (
                  <p className="text-[10px] mt-1 font-mono">
                    <span className="text-emerald-600 font-bold">
                      Income: Rp {Object.values(roomProfits).reduce((s, r) => s + r.total_income, 0).toLocaleString()}
                    </span>
                    {" · "}
                    <span className="text-red-500">
                      Expense: Rp {Object.values(roomProfits).reduce((s, r) => s + r.total_expense, 0).toLocaleString()}
                    </span>
                    {" · "}
                    <span className={Object.values(roomProfits).reduce((s, r) => s + r.profit, 0) >= 0 ? "text-emerald-700 font-bold" : "text-red-600 font-bold"}>
                      Profit: Rp {Object.values(roomProfits).reduce((s, r) => s + r.profit, 0).toLocaleString()}
                    </span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddRoomModal(true)}
                className="px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Room
              </button>
              <button
                onClick={() => setShowBulkModal(true)}
                className="px-3 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                Bulk
              </button>
            </div>
          </div>

          {/* Room Type Images Carousel */}
          {selectedType && selectedType.images && selectedType.images.length > 0 && (
            <div className="mb-4">
              <ImageCarousel
                images={selectedType.images}
                alt={selectedType.name}
                aspectRatio="video"
                showThumbnails={selectedType.images.length > 1}
              />
            </div>
          )}

          {selectedType && selectedType.rooms.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {selectedType.rooms.map((room) => (
                <div
                  key={room.id}
                  className={`relative p-3 rounded-xl border-2 text-center transition-all group ${
                    STATUS_COLORS[room.status] || "bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                >
                  <button
                    onClick={() => handleOpenRoomDetail(room)}
                    className="w-full"
                  >
                    <Hash className="w-4 h-4 mx-auto mb-1" />
                    <span className="font-mono text-xs font-bold block leading-tight">
                      {room.roomNumber}
                    </span>
                    {room.tenantName && room.status === "occupied" && (
                      <span className="font-sans text-[9px] text-slate-500 mt-0.5 block leading-tight">
                        {room.tenantName}
                      </span>
                    )}
                    <span className="font-mono text-[9px] font-bold mt-1 block">
                      {STATUS_LABELS[room.status] || room.status}
                    </span>
                    {roomProfits[room.id] && (
                      <span className={`font-mono text-[8px] font-bold mt-1 block ${
                        roomProfits[room.id].profit >= 0 ? "text-emerald-600" : "text-red-500"
                      }`}>
                        Rp {roomProfits[room.id].profit.toLocaleString()}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFacilityPopupRoom(room);
                    }}
                    className="absolute top-1 left-1 p-1 bg-white/80 rounded-md text-slate-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Facility status"
                  >
                    <Wrench className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteRoomTarget(room);
                      setShowDeleteRoomModal(true);
                    }}
                    className="absolute top-1 right-1 p-1 bg-white/80 rounded-md text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Remove room"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl py-16 text-center">
              <Hash className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-sans font-semibold text-sm text-slate-500">No rooms in this type</p>
              <p className="text-xs text-slate-400 mt-1">Use the API to generate rooms for this room type</p>
            </div>
          )}
        </>
      ) : (
        /* Level 4: Room Detail View */
        selectedRoomDetail && selectedType && (
          <TenantRoomDetailView
            room={selectedRoomDetail}
            propertyId={property.id}
            propertyName={property.name}
            onBack={() => {
              setView("rooms");
              setSelectedRoomDetail(null);
            }}
            onStatusChanged={() => {
              fetchRoomTypes();
              setView("rooms");
              setSelectedRoomDetail(null);
            }}
          />
        )
      )}

      {/* Add Room Type Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-bold text-lg text-slate-900 mb-4">Add Room Type</h3>
            <form onSubmit={handleAddRoomType} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Studio, Deluxe, Suite"
                  maxLength={25}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Monthly Price</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={addPrice}
                    onChange={(e) => setAddPrice(e.target.value)}
                    placeholder="Rp"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Deposit</label>
                  <input
                    type="number"
                    min={0}
                    value={addDeposit}
                    onChange={(e) => setAddDeposit(e.target.value)}
                    placeholder="Rp"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Room Size</label>
                  <input
                    type="text"
                    value={addSize}
                    onChange={(e) => setAddSize(e.target.value)}
                    placeholder="e.g. 30m²"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Max Occupants</label>
                  <input
                    type="number"
                    min={1}
                    value={addMaxOcc}
                    onChange={(e) => setAddMaxOcc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea
                  value={addDesc}
                  onChange={(e) => setAddDesc(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                  maxLength={200}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Images</label>
                <MultiImageUploader
                  initialUrls={addImages}
                  onUpload={(urls) => setAddImages(urls)}
                  maxImages={10}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Generate Rooms Modal */}
      {showBulkModal && selectedType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowBulkModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Generate Rooms
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Adding rooms to <span className="font-semibold text-slate-700">{selectedType.name}</span>
            </p>
            <form onSubmit={handleBulkGenerate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Number of Rooms</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={bulkCount}
                  onChange={(e) => setBulkCount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Prefix</label>
                  <input
                    type="text"
                    value={bulkPrefix}
                    onChange={(e) => setBulkPrefix(e.target.value)}
                    placeholder="e.g. A-"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Starting Number</label>
                  <input
                    type="number"
                    min={1}
                    value={bulkStartNum}
                    onChange={(e) => setBulkStartNum(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Floor Number (optional)</label>
                <input
                  type="number"
                  value={bulkFloor}
                  onChange={(e) => setBulkFloor(e.target.value)}
                  placeholder="e.g. 3"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkSaving}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {bulkSaving ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    `Generate ${bulkCount || 0} Rooms`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
          />
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-sm">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900">Delete Room Type</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This will permanently delete this room type and all its rooms. This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteRoomType}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Room Type Settings Modal */}
      {showSettingsModal && settingsData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { setShowSettingsModal(false); setSettingsData(null); }}
          />
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-lg text-slate-900">Room Type Settings</h3>
            </div>
            <form onSubmit={handleSaveSettings} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={25}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Monthly Price</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Deposit</label>
                  <input
                    type="number"
                    min={0}
                    value={editDeposit}
                    onChange={(e) => setEditDeposit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Room Size</label>
                  <input
                    type="text"
                    value={editSize}
                    onChange={(e) => setEditSize(e.target.value)}
                    placeholder="e.g. 30m²"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Max Occupants</label>
                  <input
                    type="number"
                    min={1}
                    value={editMaxOcc}
                    onChange={(e) => setEditMaxOcc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                  maxLength={200}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Images</label>
                <MultiImageUploader
                  initialUrls={editImages}
                  onUpload={(urls) => setEditImages(urls)}
                  maxImages={10}
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                {settingsData && (
                  <RoomFacilityManager roomTypeId={settingsData.id} />
                )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                {settingsData && (
                  <ChecklistItemManager roomTypeId={settingsData.id} />
                )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                {settingsData && (
                  <InspectionItemManager roomTypeId={settingsData.id} title="Inspection Items" />
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowSettingsModal(false); setSettingsData(null); }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {editSaving ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Single Room Modal */}
      {showAddRoomModal && selectedType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAddRoomModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-lg text-slate-900">Add Room</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Adding to <span className="font-semibold text-slate-700">{selectedType.name}</span>
            </p>
            <form onSubmit={handleAddRoom} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Room Number</label>
                <input
                  type="text"
                  required
                  value={addRoomNumber}
                  onChange={(e) => setAddRoomNumber(e.target.value)}
                  placeholder="e.g. Room 301, A-102"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Floor (optional)</label>
                <input
                  type="number"
                  value={addRoomFloor}
                  onChange={(e) => setAddRoomFloor(e.target.value)}
                  placeholder="e.g. 3"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addRoomSaving}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {addRoomSaving ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Add Room"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Room Confirmation Modal */}
      {showDeleteRoomModal && deleteRoomTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { setShowDeleteRoomModal(false); setDeleteRoomTarget(null); }}
          />
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-sm">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900">Remove Room</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Delete <span className="font-semibold">{deleteRoomTarget.roomNumber}</span>? This cannot be undone.
              </p>
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => { setShowDeleteRoomModal(false); setDeleteRoomTarget(null); }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteRoom}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Facility Status Popup */}
      {facilityPopupRoom && (
        <RoomFacilityStatusPopup
          roomId={facilityPopupRoom.id}
          roomNumber={facilityPopupRoom.roomNumber}
          onClose={() => setFacilityPopupRoom(null)}
        />
      )}
    </div>
  );
}
