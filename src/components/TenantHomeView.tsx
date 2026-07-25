import { useState, useEffect } from "react";
import { TenantProfile, Bill, Announcement, MaintenanceRequest } from "../types";
import { Building2, CreditCard, Wrench, Megaphone, History, Clock, FileText, ChevronRight, CheckCircle2, AlertTriangle, Plus, LogOut, DollarSign, ShieldCheck, MessageSquare, ArrowRightLeft } from "lucide-react";
import DepositAppealModal from "./DepositAppealModal";
import RoomChangeRequestModal from "./RoomChangeRequestModal";

interface DepositDeduction {
  id: number;
  amount: number;
  reason: string;
  date: string;
  status: string;
  appeal_status: string | null;
  appeal_id: number | null;
}

interface DepositInfo {
  deposit_amount: number;
  deductions_total: number;
  remaining: number;
  deductions: DepositDeduction[];
}

interface RoomChangeReq {
  request_id: number;
  reason: string | null;
  status: string;
  created_at: string;
  rejection_reason: string | null;
  assignment: {
    room: { room_number: string; room_type: { type_name: string } };
  };
  requested_room: { room_number: string; room_type: { type_name: string } } | null;
  reviewer: { full_name: string } | null;
}

interface TenantHomeViewProps {
  tenantProfile: TenantProfile;
  bills: Bill[];
  announcements: Announcement[];
  maintenanceRequests: MaintenanceRequest[];
  token: string;
  onPayBill: (id: string) => void;
  onPayAllBills: () => void;
  onOpenMaintenanceModal: () => void;
  onOpenHistoryTab: () => void;
  onCheckout?: () => void;
}

export default function TenantHomeView({
  tenantProfile,
  bills,
  announcements,
  maintenanceRequests,
  token,
  onPayBill,
  onPayAllBills,
  onOpenMaintenanceModal,
  onOpenHistoryTab,
  onCheckout
}: TenantHomeViewProps) {
  const [depositInfo, setDepositInfo] = useState<DepositInfo | null>(null);
  const [appealDeduction, setAppealDeduction] = useState<DepositDeduction | null>(null);
  const [showRoomChangeModal, setShowRoomChangeModal] = useState(false);
  const [roomChangeRequests, setRoomChangeRequests] = useState<RoomChangeReq[]>([]);
  const [tenantAssignmentData, setTenantAssignmentData] = useState<{
    assignmentId: number;
    propertyId: string;
    roomType: string;
    monthlyPrice: number;
  } | null>(null);
  
  // Extract summary
  const unpaidBills = bills.filter(b => b.status === "UNPAID" || b.status === "OVERDUE");
  const outstandingAmount = unpaidBills.reduce((acc, b) => acc + b.amount, 0);
  const nextBill = unpaidBills[0] || null;

  useEffect(() => {
    const fetchDeposit = async () => {
      try {
        const res = await fetch("/api/tenants/me/deposit", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setDepositInfo(data);
        }
      } catch (e) {
        console.error("Failed to fetch deposit info:", e);
      }
    };
    fetchDeposit();
    fetchAssignmentData();
  }, [token]);

  const fetchAssignmentData = async () => {
    try {
      const res = await fetch("/api/tenants/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.assignment_id) {
          setTenantAssignmentData({
            assignmentId: data.assignment_id,
            propertyId: data.propertyId || "",
            roomType: data.roomType || "",
            monthlyPrice: Number(data.monthlyPrice || 0),
          });
        }
      }
    } catch (e) {
      console.error("Failed to fetch assignment data:", e);
    }
  };

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch("/api/room-change/requests/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setRoomChangeRequests(data);
        }
      } catch (e) {
        console.error("Failed to fetch room change requests:", e);
      }
    };
    fetchRequests();
  }, [token]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Greeting & Context */}
      <section className="flex flex-col gap-1">
        <span className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-500">
          Welcome back,
        </span>
        <h2 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
          {tenantProfile.name}
        </h2>
      </section>

      {/* Bento Layout for Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Room Status Card */}
        <div className="bg-primary-container p-6 rounded-2xl text-white relative overflow-hidden shadow-md group">
          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-on-primary-container opacity-90" />
                <span className="font-mono text-xs uppercase tracking-wider text-on-primary-container/90 font-medium">
                  Current Residence
                </span>
              </div>
              <h3 className="font-display text-4xl font-bold text-white mb-1.5">
                {tenantProfile.roomNumber}
              </h3>
              <p className="font-sans text-sm text-slate-300 capitalize">
                {tenantProfile.propertyName}
              </p>
              <p className="font-sans text-xs text-slate-400 mt-0.5">
                {tenantProfile.floor}
              </p>
            </div>
            
            <div>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-500/30 inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {tenantProfile.leaseStatus}
              </span>
            </div>
          </div>
          {/* Decorative gradients */}
          <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-white/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
          <div className="absolute right-0 top-0 w-28 h-28 bg-emerald-400/10 rounded-full blur-2xl"></div>
        </div>

        {/* Next Bill Summary */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between gap-5 relative">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs text-slate-500 uppercase tracking-widest font-medium">
                NEXT BILL
              </span>
              <h4 className="font-mono text-3xl font-bold text-primary tracking-tight">
                Rp {outstandingAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
            </div>
            
            <div className="text-right">
              {unpaidBills.length > 0 ? (
                <>
                  <span className="font-mono text-[10px] text-rose-500 font-bold tracking-wider block bg-rose-50 px-2 py-1 rounded-sm">
                    DUE SOON
                  </span>
                  <span className="font-mono text-xs text-slate-500 block mt-1">
                    {nextBill ? nextBill.dueDate : "Oct 01, 2023"}
                  </span>
                </>
              ) : (
                <span className="font-mono text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full">
                  ALL PAID
                </span>
              )}
            </div>
          </div>

          <div>
            <button
              onClick={onPayAllBills}
              disabled={unpaidBills.length === 0}
              className={`w-full py-3.5 px-4 font-sans font-semibold rounded-xl flex items-center justify-center gap-2.5 transition-all text-sm shadow-xs active:scale-[0.98] ${
                unpaidBills.length > 0
                  ? "bg-primary text-white hover:bg-primary-container cursor-pointer"
                  : "bg-slate-150 text-slate-400 cursor-not-allowed"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              {unpaidBills.length > 0 ? "Pay Bills Now" : "Nothing Outstanding"}
            </button>
          </div>
        </div>

        {/* Deposit Card */}
        {depositInfo && depositInfo.deposit_amount > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between gap-4 relative">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-xs text-amber-600 uppercase tracking-widest font-medium">
                  DEPOSIT HELD
                </span>
                <h4 className="font-mono text-3xl font-bold text-amber-700 tracking-tight">
                  Rp {depositInfo.remaining.toLocaleString()}
                </h4>
              </div>
              <div className="p-2 bg-amber-100 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            {depositInfo.deductions_total > 0 && (
              <div className="text-xs text-amber-600 bg-amber-100 px-3 py-1.5 rounded-lg">
                Rp {depositInfo.deductions_total.toLocaleString()} deducted
              </div>
            )}
            <p className="text-[10px] text-amber-600">Refundable at checkout</p>
          </div>
        )}
      </div>

      {/* Deposit Deductions */}
      {depositInfo && depositInfo.deductions.length > 0 && (
        <section>
          <h3 className="font-display text-xl font-bold text-slate-900 mb-4 tracking-tight">
            Deposit Deductions
          </h3>
          <div className="space-y-3">
            {depositInfo.deductions.map((d) => (
              <div key={d.id} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{d.reason}</p>
                  <p className="text-xs text-slate-500">{d.date}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <p className="text-sm font-mono font-bold text-rose-600">-Rp {d.amount.toLocaleString()}</p>
                  {d.status === "deducted" && !d.appeal_status && (
                    <button
                      onClick={() => setAppealDeduction(d)}
                      className="px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 cursor-pointer"
                    >
                      Appeal
                    </button>
                  )}
                  {d.appeal_status === "pending" && (
                    <span className="px-2 py-1 text-[10px] font-bold text-amber-600 bg-amber-50 rounded">Under Review</span>
                  )}
                  {d.appeal_status === "approved" && (
                    <span className="px-2 py-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded">Approved</span>
                  )}
                  {d.appeal_status === "rejected" && (
                    <span className="px-2 py-1 text-[10px] font-bold text-red-600 bg-red-50 rounded">Rejected</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Appeal Modal */}
      {appealDeduction && (
        <DepositAppealModal
          deduction={appealDeduction}
          token={token}
          onClose={() => setAppealDeduction(null)}
          onSubmitted={() => {
            setAppealDeduction(null);
            // Refresh deposit info
            fetch("/api/tenants/me/deposit", { headers: { Authorization: `Bearer ${token}` } })
              .then(r => r.json())
              .then(data => setDepositInfo(data))
              .catch(() => {});
          }}
        />
      )}

      {/* Quick Actions */}
      <section>
        <h3 className="font-display text-xl font-bold text-slate-900 mb-4 tracking-tight">
          Quick Actions
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <button
            onClick={onOpenMaintenanceModal}
            className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col items-center gap-3 hover:bg-slate-50 hover:border-slate-350 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 group-hover:scale-105 transition-transform duration-200">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="font-sans text-xs font-semibold text-slate-800">
              Request Repair
            </span>
          </button>

          <button
            onClick={onOpenHistoryTab}
            className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col items-center gap-3 hover:bg-slate-50 hover:border-slate-350 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:scale-105 transition-transform duration-200">
              <Clock className="w-5 h-5" />
            </div>
            <span className="font-sans text-xs font-semibold text-slate-800">
              Billing & History
            </span>
          </button>

          <button
            onClick={onOpenHistoryTab}
            className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col items-center gap-3 hover:bg-slate-50 hover:border-slate-350 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform duration-200">
              <History className="w-5 h-5" />
            </div>
            <span className="font-sans text-xs font-semibold text-slate-800">
              Ledger Statements
            </span>
          </button>

          {onCheckout && (
            <button
              onClick={onCheckout}
              className="bg-white border border-rose-200 p-4 rounded-2xl flex flex-col items-center gap-3 hover:bg-rose-50 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:scale-105 transition-transform duration-200">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="font-sans text-xs font-semibold text-rose-700">
                Quick Checkout
              </span>
            </button>
          )}

          <button
            onClick={() => setShowRoomChangeModal(true)}
            className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col items-center gap-3 hover:bg-slate-50 hover:border-slate-350 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 group-hover:scale-105 transition-transform duration-200">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <span className="font-sans text-xs font-semibold text-slate-800">
              Change Room
            </span>
          </button>
        </div>
      </section>

      {/* Maintenance Requests List inside the dashboard if any exists */}
      {maintenanceRequests.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display text-xl font-bold text-slate-900 tracking-tight">
              My Maintenance Issues
            </h3>
            <button
              onClick={onOpenMaintenanceModal}
              className="text-primary hover:text-primary-container font-sans text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              Add New <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            {maintenanceRequests.map(request => (
              <div
                key={request.id}
                className={`flex gap-4 p-4 bg-white border rounded-xl shadow-2xs items-center justify-between ${
                  request.status === "PENDING"
                    ? "border-amber-200 border-l-4 border-l-amber-500"
                    : request.status === "PROCESSING"
                    ? "border-blue-200 border-l-4 border-l-blue-500"
                    : "border-emerald-200 border-l-4 border-l-emerald-500"
                }`}
              >
                <div className="flex gap-3 items-center">
                  {request.image ? (
                    <img
                      referrerPolicy="no-referrer"
                      src={request.image || undefined}
                      alt={request.title}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                      <Wrench className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-sans font-bold text-slate-900 line-clamp-1">{request.title}</h4>
                    <p className="font-sans text-xs text-slate-500 max-w-sm line-clamp-1">
                      {request.description}
                    </p>
                    <span className="font-mono text-[10px] text-slate-400 mt-1 block">{request.date}</span>
                  </div>
                </div>

                <div>
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-1 rounded ${
                      request.status === "PENDING"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : request.status === "PROCESSING"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {request.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Room Change Requests */}
      {roomChangeRequests.length > 0 && (
        <section>
          <h3 className="font-display text-xl font-bold text-slate-900 mb-4 tracking-tight">
            Room Change Requests
          </h3>
          <div className="space-y-3">
            {roomChangeRequests.map((req) => (
              <div
                key={req.request_id}
                className={`p-4 bg-white border rounded-xl shadow-2xs ${
                  req.status === "pending"
                    ? "border-amber-200"
                    : req.status === "approved" || req.status === "completed"
                    ? "border-emerald-200"
                    : "border-red-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-700">
                    {req.assignment.room.room_number} →{" "}
                    {req.requested_room
                      ? `${req.requested_room.room_number} (${req.requested_room.room_type.type_name})`
                      : "Any available room"}
                  </p>
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                      req.status === "pending"
                        ? "bg-amber-50 text-amber-700"
                        : req.status === "approved" || req.status === "completed"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
                {req.reason && (
                  <p className="text-[11px] text-slate-500 mb-1">{req.reason}</p>
                )}
                {req.rejection_reason && (
                  <p className="text-[11px] text-red-500">
                    Rejected: {req.rejection_reason}
                  </p>
                )}
                <p className="text-[10px] text-slate-400 font-mono mt-1">
                  {new Date(req.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Announcements */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display text-xl font-bold text-slate-900 tracking-tight">
            Recent Announcements
          </h3>
          <span className="text-slate-400 font-sans text-xs">Informational</span>
        </div>
        <div className="space-y-4">
          {announcements.map((ann, i) => (
            <div
              key={ann.id}
              className={`flex gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow duration-300 ${
                i === 0 ? "border-l-4 border-l-amber-500" : "border-l-4 border-l-primary"
              }`}
            >
              <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shadow-2xs">
                <img
                  referrerPolicy="no-referrer"
                  src={ann.image || undefined}
                  alt={ann.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <h4 className="font-sans font-bold text-slate-900 leading-tight">
                  {ann.title}
                </h4>
                <p className="font-sans text-xs text-slate-500 leading-relaxed">
                  {ann.content}
                </p>
                <div className="flex items-center gap-1 mt-1 text-slate-400 text-[10px] font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{ann.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Room Change Request Modal */}
      {showRoomChangeModal && tenantAssignmentData && (
        <RoomChangeRequestModal
          propertyId={tenantAssignmentData.propertyId}
          assignmentId={tenantAssignmentData.assignmentId}
          currentRoomNumber={tenantProfile.roomNumber}
          currentRoomType={tenantAssignmentData.roomType}
          currentMonthlyPrice={tenantAssignmentData.monthlyPrice}
          token={token}
          onClose={() => setShowRoomChangeModal(false)}
          onSubmitted={() => {
            setShowRoomChangeModal(false);
            fetch("/api/room-change/requests/me", {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then((r) => r.json())
              .then((data) => setRoomChangeRequests(data))
              .catch(() => {});
          }}
        />
      )}
    </div>
  );
}
