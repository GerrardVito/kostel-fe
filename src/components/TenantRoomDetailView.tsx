import { useState, useEffect } from "react";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  BedDouble,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Wrench,
  UserPlus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowRightLeft,
  Hash,
  CreditCard,
  Briefcase,
  Pen,
  ShieldAlert,
} from "lucide-react";
import DepositCutModal from "./DepositCutModal";

interface TenantData {
  assignment_id: number;
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  nik: string;
  passport_number: string;
  date_of_birth: string | null;
  purpose_of_stay: string;
  occupation: string;
  checkin_date: string;
  checkout_date: string | null;
  status: string;
  signature_image: string | null;
  signed_at: string | null;
}

interface RoomData {
  id: number;
  roomNumber: string;
  floorNumber: number | null;
  status: string;
  tenantName?: string;
  assignment_id?: number;
}

interface Transaction {
  id: string;
  date: string;
  type: string;
  description: string;
  amount: number;
  category: "income" | "expense" | "deposit";
}

interface FinanceData {
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  totalDeposit: number;
  profit: number;
}

interface Deduction {
  id: number;
  amount: number;
  reason: string;
  date: string;
  status: string;
  appeal_status: string | null;
}

interface TenantRoomDetailViewProps {
  room: RoomData;
  propertyId: string;
  propertyName: string;
  token: string;
  onBack: () => void;
  onStatusChanged: () => void;
}

const STATUS_OPTIONS = [
  { value: "available", label: "Available", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle },
  { value: "occupied", label: "Occupied", color: "bg-slate-100 text-slate-600 border-slate-200", icon: User },
  { value: "maintenance", label: "Maintenance", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Wrench },
];

export default function TenantRoomDetailView({ room, propertyId, propertyName, onBack, onStatusChanged }: TenantRoomDetailViewProps) {
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [finances, setFinances] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(room.status);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tenantRes, financesRes] = await Promise.all([
          fetch(`/api/rooms/${room.id}/tenant`),
          fetch(`/api/rooms/${room.id}/finances`),
        ]);
        if (tenantRes.ok) {
          const tenantData = await tenantRes.json();
          setTenant(tenantData);
        }
        if (financesRes.ok) {
          const financesData = await financesRes.json();
          setFinances(financesData);
        }
      } catch (e) {
        console.error("Failed to fetch room data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [room.id]);

  const handleStatusChange = async () => {
    setChangingStatus(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${room.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      });
      if (res.ok) {
        onStatusChanged();
        onBack();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update status");
      }
    } catch (e) {
      setError("Failed to update room status");
    } finally {
      setChangingStatus(false);
      setShowConfirm(false);
    }
  };

  const needsConfirmation = selectedStatus !== room.status;
  const isCheckingOut = room.status === "occupied" && selectedStatus === "available";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
        <button onClick={onBack} className="hover:text-primary transition-colors cursor-pointer">
          {propertyName}
        </button>
        <span>/</span>
        <span className="text-slate-700 font-semibold">{room.roomNumber}</span>
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Rooms
      </button>

      {/* Room Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <BedDouble className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">{room.roomNumber}</h2>
            <div className="flex items-center gap-3 mt-1">
              {room.floorNumber && (
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  Floor {room.floorNumber}
                </span>
              )}
              <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-full ${
                room.status === "occupied"
                  ? "bg-slate-100 text-slate-600"
                  : room.status === "available"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}>
                {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase tracking-wider font-bold">Income</span>
          </div>
          <p className="font-display text-xl font-bold text-emerald-600">
            Rp {(finances?.totalIncome || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <TrendingDown className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase tracking-wider font-bold">Expense</span>
          </div>
          <p className="font-display text-xl font-bold text-red-500">
            Rp {(finances?.totalExpense || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase tracking-wider font-bold">Deposit Held</span>
          </div>
          <p className="font-display text-xl font-bold text-amber-700">
            Rp {(finances?.totalDeposit || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-amber-600 mt-1">Refundable</p>
        </div>
        <div className={`rounded-2xl border p-4 shadow-sm ${
          (finances?.profit || 0) >= 0
            ? "bg-emerald-50 border-emerald-200"
            : "bg-red-50 border-red-200"
        }`}>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase tracking-wider font-bold">Profit</span>
          </div>
          <p className={`font-display text-xl font-bold ${
            (finances?.profit || 0) >= 0 ? "text-emerald-700" : "text-red-600"
          }`}>
            Rp {(finances?.profit || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Excludes deposits</p>
        </div>
      </div>

      {/* Tenant Information */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Tenant Information
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : tenant && tenant.status === "active" ? (
          <div className="space-y-4">
            {/* Personal Information */}
            <div className="space-y-3">
              <h4 className="font-mono text-[10px] uppercase tracking-wider font-bold text-slate-400">Personal Details</h4>
              
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-0.5">Name</p>
                  <p className="text-sm font-semibold text-slate-900">{tenant.full_name}</p>
                </div>
              </div>

              {tenant.nik && (
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <CreditCard className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-0.5">NIK (Nomor Induk Kependudukan)</p>
                    <p className="text-sm font-mono text-slate-900">{tenant.nik}</p>
                  </div>
                </div>
              )}

              {tenant.passport_number && (
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <CreditCard className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-0.5">Passport Number</p>
                    <p className="text-sm font-mono text-slate-900">{tenant.passport_number}</p>
                  </div>
                </div>
              )}

              {tenant.date_of_birth && (
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-0.5">Date of Birth</p>
                    <p className="text-sm text-slate-900">{new Date(tenant.date_of_birth).toLocaleDateString()}</p>
                  </div>
                </div>
              )}

              {tenant.purpose_of_stay && (
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <Briefcase className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-0.5">Purpose of Stay</p>
                    <p className="text-sm text-slate-900">{tenant.purpose_of_stay}</p>
                  </div>
                </div>
              )}

              {tenant.occupation && (
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <Briefcase className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-0.5">Occupation</p>
                    <p className="text-sm text-slate-900">{tenant.occupation}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-3">
              <h4 className="font-mono text-[10px] uppercase tracking-wider font-bold text-slate-400">Contact Information</h4>
              
              {tenant.email && (
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-0.5">Email</p>
                    <p className="text-sm text-slate-900">{tenant.email}</p>
                  </div>
                </div>
              )}

              {tenant.phone && (
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-0.5">Phone</p>
                    <p className="text-sm text-slate-900">{tenant.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Lease Information */}
            <div className="space-y-3">
              <h4 className="font-mono text-[10px] uppercase tracking-wider font-bold text-slate-400">Lease Information</h4>
              
              {tenant.checkin_date && (
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-0.5">Check-in Date</p>
                    <p className="text-sm text-slate-900">{new Date(tenant.checkin_date).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tenant Signature */}
            <div className="space-y-3">
              <h4 className="font-mono text-[10px] uppercase tracking-wider font-bold text-slate-400">Tenant Signature</h4>
              
              {tenant.signature_image ? (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Pen className="w-4 h-4 text-slate-400" />
                    <p className="text-xs text-slate-500">
                      Signed on {tenant.signed_at ? new Date(tenant.signed_at).toLocaleDateString() : "Unknown date"}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <img 
                      src={tenant.signature_image} 
                      alt="Tenant Signature" 
                      className="max-h-24 object-contain mx-auto"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <p className="text-xs text-amber-700">No signature on file</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-xl">
            <UserPlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No tenant assigned</p>
            <p className="text-xs text-slate-400 mt-1">This room is currently empty</p>
          </div>
        )}
      </div>

      {/* Transaction History */}
      {finances && finances.transactions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            Transaction History
          </h3>
          <div className="space-y-2">
            {finances.transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    t.category === "income" ? "bg-emerald-100" : t.category === "deposit" ? "bg-amber-100" : "bg-red-100"
                  }`}>
                    {t.category === "income" ? (
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    ) : t.category === "deposit" ? (
                      <DollarSign className="w-4 h-4 text-amber-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 capitalize">{t.type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-slate-500">{t.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-mono font-bold ${
                    t.category === "income" ? "text-emerald-600" : t.category === "deposit" ? "text-amber-600" : "text-red-500"
                  }`}>
                    {t.category === "income" ? "+" : t.category === "deposit" ? "" : "-"} Rp {t.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">{t.date}</p>
                  {t.category === "deposit" && (
                    <span className="text-[9px] font-mono text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">REFUNDABLE</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Change Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-primary" />
          Change Room Status
        </h3>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {STATUS_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedStatus === opt.value;
            const isCurrent = room.status === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => { setSelectedStatus(opt.value); setShowConfirm(false); }}
                className={`relative p-4 rounded-xl border-2 text-center transition-all cursor-pointer ${
                  isSelected
                    ? `${opt.color} border-current shadow-sm`
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <Icon className="w-5 h-5 mx-auto mb-1.5" />
                <span className="font-mono text-xs font-bold block">{opt.label}</span>
                {isCurrent && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Checkout Warning */}
        {isCheckingOut && tenant && tenant.status === "active" && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-800">Checkout Tenant</p>
              <p className="text-xs text-amber-700 mt-0.5">
                This will end the tenancy for <span className="font-semibold">{tenant.full_name}</span> and mark the room as available.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        {needsConfirmation ? (
          showConfirm ? (
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                disabled={changingStatus}
                className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-xl cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {changingStatus ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {isCheckingOut ? "Confirm Checkout" : "Confirm Change"}
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2"
            >
              <ArrowRightLeft className="w-4 h-4" />
              {isCheckingOut ? "Checkout Tenant" : "Update Status"}
            </button>
          )
        ) : (
          <button
            disabled
            className="w-full py-3 bg-slate-100 text-slate-400 font-bold text-sm rounded-xl cursor-not-allowed"
          >
            No Changes
          </button>
        )}
      </div>
    </div>
  );
}
