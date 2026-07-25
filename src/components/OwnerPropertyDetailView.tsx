import { useState, useEffect } from "react";
import { Property } from "../types";
import { getStoredToken } from "../services/auth";
import {
  ArrowLeft,
  Building2,
  MapPin,
  BedDouble,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wifi,
  Coffee,
  Car,
  Shield,
  Landmark,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  LucideIcon,
  ShieldCheck,
  Download,
} from "lucide-react";
import ImageCarousel from "./ImageCarousel";

interface OwnerPropertyDetailViewProps {
  property: Property;
  onBack: () => void;
  onNavigateToAdmin?: () => void;
}

interface PropertyDetail {
  property_id: number;
  property_name: string;
  property_type: string;
  description: string;
  address: string;
  city: string;
  province: string;
  image_urls: string[];
  invite_code: string;
  facilities: { facility_id: number; facility_name: string }[];
  nearby_places: { nearby_place_id: number; place_name: string; place_type: string; distance_km: number }[];
}

interface RoomProfit {
  room_id: number;
  room_number: string;
  status: string;
  total_income: number;
  total_expense: number;
  total_deposit?: number;
  profit: number;
}

interface BillSummary {
  bill_type: string;
  total: number;
  count: number;
  paid: number;
  unpaid: number;
}

const FACILITY_ICONS: Record<string, LucideIcon> = {
  wifi: Wifi,
  parking: Car,
  security: Shield,
  cafe: Coffee,
  default: CheckCircle,
};

export default function OwnerPropertyDetailView({ property, onBack, onNavigateToAdmin }: OwnerPropertyDetailViewProps) {
  const [detail, setDetail] = useState<PropertyDetail | null>(null);
  const [roomProfits, setRoomProfits] = useState<RoomProfit[]>([]);
  const [bills, setBills] = useState<BillSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const parsedId = property.id.replace("prop-", "");

  const handleExportRoomPnl = () => {
    const headers = ["Room", "Status", "Income", "Expense", "Deposit Held", "Profit"];
    const rows = roomProfits.map((r) => [
      r.room_number,
      r.status,
      r.total_income,
      r.total_expense,
      r.total_deposit ?? 0,
      r.profit,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `property_pnl_${(property.name || "").replace(/\s+/g, "_") || parsedId}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [detailRes, profitRes, billsRes] = await Promise.all([
          fetch(`/api/properties/${property.id}`, { headers: { Authorization: `Bearer ${getStoredToken()}` } }),
          fetch(`/api/rooms/profit/property/${parsedId}`, { headers: { Authorization: `Bearer ${getStoredToken()}` } }),
          fetch(`/api/bills`, { headers: { Authorization: `Bearer ${getStoredToken()}` } }),
        ]);

        if (detailRes.ok) {
          setDetail(await detailRes.json());
        }
        if (profitRes.ok) {
          setRoomProfits(await profitRes.json());
        }
        if (billsRes.ok) {
          const allBills: any[] = await billsRes.json();
          // Filter bills for this property by checking assignment -> room -> property
          const propBills = allBills.filter(
            (b) => b.assignment?.room?.room_type?.property_id === parseInt(parsedId)
          );
          const summary: Record<string, BillSummary> = {};
          propBills.forEach((b) => {
            const type = b.bill_type || "other";
            if (!summary[type]) {
              summary[type] = { bill_type: type, total: 0, count: 0, paid: 0, unpaid: 0 };
            }
            summary[type].total += Number(b.total_amount || b.amount || 0);
            summary[type].count += 1;
            if (b.status === "paid") summary[type].paid += Number(b.total_amount || b.amount || 0);
            else summary[type].unpaid += Number(b.total_amount || b.amount || 0);
          });
          setBills(Object.values(summary));
        }
      } catch (e) {
        console.error("Failed to fetch property details:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [property.id, parsedId]);

  const totalIncome = roomProfits.reduce((s, r) => s + r.total_income, 0);
  const totalExpense = roomProfits.reduce((s, r) => s + r.total_expense, 0);
  const totalProfit = roomProfits.reduce((s, r) => s + r.profit, 0);
  const occupiedRooms = roomProfits.filter((r) => r.status === "occupied").length;
  const totalRoomsForStats = roomProfits.length || property.roomCount;

  const getFacilityIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("wifi")) return Wifi;
    if (lower.includes("parkir") || lower.includes("parking") || lower.includes("car")) return Car;
    if (lower.includes("security") || lower.includes("keamanan")) return Shield;
    if (lower.includes("cafe") || lower.includes("coffee") || lower.includes("makan")) return Coffee;
    return CheckCircle;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-20">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Properties
      </button>

      {/* Hero Section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="relative">
          <ImageCarousel
            images={detail?.image_urls?.length ? detail.image_urls : [property.image]}
            alt={property.name}
            aspectRatio="video"
            showThumbnails={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          {onNavigateToAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="absolute top-4 right-4 px-3 py-2 bg-white/90 hover:bg-white text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-lg backdrop-blur-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin
            </button>
          )}
          <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
            <h2 className="font-display text-3xl font-bold text-white mb-1">
              {detail?.property_name || property.name}
            </h2>
            <p className="text-sm text-white/80 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {detail?.address || property.address}
              {detail?.city && `, ${detail.city}`}
              {detail?.province && `, ${detail.province}`}
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      {detail?.description && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-600 leading-relaxed">{detail.description}</p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Building2 className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase tracking-wider font-bold">Total Rooms</span>
          </div>
          <p className="font-display text-2xl font-bold text-slate-900">{totalRoomsForStats}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Users className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase tracking-wider font-bold">Occupied</span>
          </div>
          <p className="font-display text-2xl font-bold text-emerald-600">
            {occupiedRooms}
            <span className="text-sm text-slate-400 font-mono ml-1">
              ({totalRoomsForStats > 0 ? Math.round((occupiedRooms / totalRoomsForStats) * 100) : 0}%)
            </span>
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase tracking-wider font-bold">Total Income</span>
          </div>
          <p className="font-display text-2xl font-bold text-emerald-600">
            Rp {totalIncome.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <TrendingDown className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase tracking-wider font-bold">Total Expense</span>
          </div>
          <p className="font-display text-2xl font-bold text-red-500">
            Rp {totalExpense.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Profit Summary */}
      <div className={`rounded-2xl border p-5 shadow-sm ${
        totalProfit >= 0
          ? "bg-emerald-50 border-emerald-200"
          : "bg-red-50 border-red-200"
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">
              Net Profit
            </p>
            <p className={`font-display text-3xl font-bold ${
              totalProfit >= 0 ? "text-emerald-700" : "text-red-600"
            }`}>
              Rp {totalProfit.toLocaleString()}
            </p>
          </div>
          <div className={`p-3 rounded-full ${
            totalProfit >= 0 ? "bg-emerald-100" : "bg-red-100"
          }`}>
            {totalProfit >= 0 ? (
              <TrendingUp className={`w-6 h-6 ${totalProfit >= 0 ? "text-emerald-600" : "text-red-500"}`} />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-500" />
            )}
          </div>
        </div>
      </div>

      {/* Two column: Facilities + Nearby Places */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Facilities */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Facilities
          </h3>
          {detail?.facilities && detail.facilities.length > 0 ? (
            <div className="space-y-2">
              {detail.facilities.map((fac) => {
                const Icon = getFacilityIcon(fac.facility_name);
                return (
                  <div key={fac.facility_id} className="flex items-center gap-3 text-sm text-slate-600">
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                    <span>{fac.facility_name}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No facilities listed</p>
          )}
        </div>

        {/* Nearby Places */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Nearby Places
          </h3>
          {detail?.nearby_places && detail.nearby_places.length > 0 ? (
            <div className="space-y-2">
              {detail.nearby_places.map((place) => (
                <div key={place.nearby_place_id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-slate-600">{place.place_name}</span>
                  </div>
                  <span className="font-mono text-xs text-slate-400">
                    {Number(place.distance_km).toFixed(1)} km
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No nearby places listed</p>
          )}
        </div>
      </div>

      {/* Bill Summary */}
      {bills.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            Bill Summary
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="pb-2 font-semibold">Type</th>
                  <th className="pb-2 font-semibold text-right">Count</th>
                  <th className="pb-2 font-semibold text-right">Total</th>
                  <th className="pb-2 font-semibold text-right">Paid</th>
                  <th className="pb-2 font-semibold text-right">Unpaid</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b.bill_type} className="border-b border-slate-50">
                    <td className="py-2.5 font-medium text-slate-700 capitalize">
                      {b.bill_type.replace(/_/g, " ")}
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-500">{b.count}</td>
                    <td className="py-2.5 text-right font-mono font-semibold text-slate-700">
                      Rp {b.total.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right font-mono text-emerald-600 font-semibold">
                      Rp {b.paid.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right font-mono text-red-500 font-semibold">
                      Rp {b.unpaid.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Room P&L Breakdown */}
      {roomProfits.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-primary" />
            Room P&amp;L Breakdown
            <button
              onClick={handleExportRoomPnl}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              <Download className="w-3 h-3" />
              Export CSV
            </button>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="pb-2 font-semibold">Room</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold text-right">Income</th>
                  <th className="pb-2 font-semibold text-right">Expense</th>
                  <th className="pb-2 font-semibold text-right">Deposit Held</th>
                  <th className="pb-2 font-semibold text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                {roomProfits.map((r) => (
                  <tr key={r.room_id} className="border-b border-slate-50">
                    <td className="py-2.5 font-mono font-medium text-slate-700">{r.room_number}</td>
                    <td className="py-2.5">
                      <span className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        r.status === "occupied"
                          ? "bg-emerald-100 text-emerald-700"
                          : r.status === "available"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-700">
                      Rp {r.total_income.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right font-mono text-red-500">
                      Rp {r.total_expense.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right font-mono text-amber-600">
                      Rp {(r.total_deposit ?? 0).toLocaleString()}
                    </td>
                    <td className={`py-2.5 text-right font-mono font-semibold ${
                      r.profit >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}>
                      Rp {r.profit.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
