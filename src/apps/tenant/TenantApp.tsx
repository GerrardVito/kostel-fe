import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bill,
  Announcement,
  MaintenanceRequest,
  TenantProfile,
  User,
  Tenant,
  Notification,
} from "../../types";
import { initialTenantProfile } from "../../initialData";
import { clearAuth, getStoredToken, getStoredUser, getMe } from "../../services/auth";

// Components
import Header from "../../components/Header";
import AuthView from "../../components/AuthView";
import TenantHomeView from "../../components/TenantHomeView";
import TenantBillingView from "../../components/TenantBillingView";
import NoHomeTenantView from "../../components/NoHomeTenantView";
import RoomSelectionView from "../../components/RoomSelectionView";
import ContractSigningView from "../../components/ContractSigningView";
import TermsAndConditionsView from "../../components/TermsAndConditionsView";
import TenantApplicationForm from "../../components/TenantApplicationForm";
import TenantApplicationStatus from "../../components/TenantApplicationStatus";
import ChecklistSessionView from "../../components/ChecklistSessionView";
import PaymentView from "../../components/PaymentView";
import MaintenanceFormModal from "../../components/MaintenanceFormModal";

// Icons
import { Home, CreditCard, Wrench, User as UserIcon, Shield, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function TenantApp() {
  const navigate = useNavigate();

  // Auth state
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser);
  const [authLoading, setAuthLoading] = useState(true);

  // Active tab
  const [activeTab, setActiveTab] = useState<"home" | "billing" | "support" | "profile">("home");

  // Data state
  const [bills, setBills] = useState<Bill[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [tenantProfile, setTenantProfile] = useState<TenantProfile>(initialTenantProfile);
  const [tenantData, setTenantData] = useState<Tenant | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Onboarding state
  const [onboardingStep, setOnboardingStep] = useState<string | null>(null);
  const [onboardingPropertyId, setOnboardingPropertyId] = useState("");
  const [onboardingPropertyName, setOnboardingPropertyName] = useState("");
  const [onboardingPropertyAddress, setOnboardingPropertyAddress] = useState("");
  const [onboardingPropertyImage, setOnboardingPropertyImage] = useState("");
  const [onboardingRoomTypes, setOnboardingRoomTypes] = useState<any[]>([]);
  const [onboardingSelectedRoomType, setOnboardingSelectedRoomType] = useState<any>(null);
  const [onboardingApplicationId, setOnboardingApplicationId] = useState<number | null>(null);
  const [onboardingAssignmentId, setOnboardingAssignmentId] = useState<number | null>(null);
  const [onboardingRoomId, setOnboardingRoomId] = useState(0);
  const [onboardingRoomNumber, setOnboardingRoomNumber] = useState("");
  const [onboardingRoomTypeName, setOnboardingRoomTypeName] = useState("");
  const [onboardingMonthlyPrice, setOnboardingMonthlyPrice] = useState(0);
  const [onboardingDepositPrice, setOnboardingDepositPrice] = useState(0);
  const [onboardingProratedAmount, setOnboardingProratedAmount] = useState<number | null>(null);
  const [onboardingTermsAgreed, setOnboardingTermsAgreed] = useState(false);
  const [justCheckedOut, setJustCheckedOut] = useState(false);

  // Modal state
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Validate stored token on mount
  useEffect(() => {
    const validateToken = async () => {
      const savedToken = getStoredToken();
      if (savedToken) {
        try {
          const user = await getMe(savedToken);
          setCurrentUser(user);
          setToken(savedToken);
        } catch {
          clearAuth();
          setToken(null);
          setCurrentUser(null);
        }
      }
      setAuthLoading(false);
    };
    validateToken();
  }, []);

  // Fetch tenant data
  const fetchAllData = async () => {
    if (!token) return;

    try {
      // Fetch bills
      const billsRes = await fetch("/api/payments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (billsRes.ok) {
        const billsData = await billsRes.json();
        setBills(billsData);

        // Compute outstanding balance
        const remainingUnpaid = billsData.filter(
          (b: Bill) => b.status === "UNPAID" || b.status === "OVERDUE" || b.status === "LATE" || b.status === "FAILED"
        );
        const outstandingSum = remainingUnpaid.reduce(
          (tot: number, b: Bill) => tot + b.amount,
          0
        );
        setTenantProfile((p) => ({
          ...p,
          outstandingBalance: outstandingSum,
        }));
      }

      // Fetch announcements
      const annRes = await fetch("/api/announcements", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (annRes.ok) {
        const annData = await annRes.json();
        setAnnouncements(annData);
      }

      // Fetch maintenance requests
      const maintRes = await fetch("/api/maintenance-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (maintRes.ok) {
        const maintData = await maintRes.json();
        const statusMap: Record<string, MaintenanceRequest["status"]> = {
          scheduled: "PENDING",
          in_progress: "PROCESSING",
          completed: "COMPLETED",
          cancelled: "COMPLETED",
        };
        const mapped: MaintenanceRequest[] = (
          Array.isArray(maintData) ? maintData : []
        ).map((r: any) => ({
          id: String(r.maintenance_id ?? r.id ?? ""),
          title: r.maintenance_title ?? r.title ?? "",
          description: r.description ?? "",
          status: statusMap[r.status] ?? "PENDING",
          date: r.created_at
            ? new Date(r.created_at).toLocaleDateString()
            : r.date ?? "",
          room: r.room?.room_number ?? r.room ?? "",
          propertyName: r.property?.property_name ?? r.propertyName ?? "",
          urgent: r.urgent ?? false,
          image: r.image_urls?.[0] ?? r.image ?? undefined,
          images: r.image_urls ?? r.images ?? undefined,
        }));
        setMaintenanceRequests(mapped);
      }

      // Fetch tenant profile
      const tenantRes = await fetch("/api/tenants/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (tenantRes.ok) {
        const tenantData = await tenantRes.json();
        setTenantData(tenantData);

        if (tenantData.roomNumber) {
          setTenantProfile((p) => ({
            ...p,
            roomNumber: tenantData.roomNumber,
            propertyName: tenantData.propertyName,
            floor: tenantData.floor || "",
          }));
        }
      }

      // Fetch notifications
      const notifRes = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData);
      }
    } catch (error) {
      console.error("Error fetching tenant data:", error);
    }
  };

  useEffect(() => {
    if (token && currentUser?.role === "tenant") {
      fetchAllData();
    }
  }, [token, currentUser]);

  // Handle login success
  const handleLoginSuccess = (newToken: string, user: User) => {
    setToken(newToken);
    setCurrentUser(user);
  };

  // Handle logout
  const handleLogout = () => {
    clearAuth();
    setToken(null);
    setCurrentUser(null);
    navigate("/");
  };

  // Handle pay bill
  const handlePayBill = async (billId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/payments/${billId}/pay`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        triggerNotification("Payment successful!");
        fetchAllData();
      }
    } catch (error) {
      console.error("Error paying bill:", error);
    }
  };

  // Handle pay all bills
  const handlePayAllBills = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/payments/pay-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        triggerNotification("All bills paid successfully!");
        fetchAllData();
      }
    } catch (error) {
      console.error("Error paying all bills:", error);
    }
  };

  // Handle create maintenance request
  const handleCreateMaintenance = async (title: string, description: string, urgent: boolean) => {
    if (!token) return;
    try {
      const res = await fetch("/api/maintenance-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, urgent }),
      });
      if (res.ok) {
        triggerNotification("Maintenance request submitted!");
        setShowMaintModal(false);
        fetchAllData();
      }
    } catch (error) {
      console.error("Error creating maintenance request:", error);
    }
  };

  // Handle tenant checkout
  const handleTenantCheckout = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/tenants/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        triggerNotification("Checkout successful!");
        setJustCheckedOut(true);
        fetchAllData();
      }
    } catch (error) {
      console.error("Error during checkout:", error);
    }
  };

  // Trigger notification
  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRoomTypeSelected = (roomType: any) => {
    setOnboardingSelectedRoomType(roomType);
    setOnboardingMonthlyPrice(roomType.monthly_price);
    setOnboardingDepositPrice(roomType.deposit_price || 0);
    setOnboardingStep("application");
  };

  const handleApplicationSubmitted = (applicationId: number) => {
    setOnboardingApplicationId(applicationId);
    setOnboardingStep("application-status");
  };

  const handleApplicationApproved = async (application: any) => {
    setOnboardingApplicationId(application.application_id);
    if (application.property) {
      setOnboardingPropertyId(`prop-${application.property.property_id}`);
      setOnboardingPropertyName(application.property.property_name || "");
      setOnboardingPropertyAddress(application.property.address || "");
    }

    // Check if admin already assigned a room (assignment exists)
    try {
      const res = await fetch("/api/tenants/me", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.assignment_id) {
          setOnboardingAssignmentId(data.assignment_id);
          setOnboardingRoomId(data.room_id || 0);
          setOnboardingRoomNumber(data.roomNumber || "");
          setOnboardingPropertyName(data.propertyName || "");
          setOnboardingMonthlyPrice(data.monthlyPrice || 0);
          setOnboardingDepositPrice(data.depositPrice || 0);
          setOnboardingStep(onboardingTermsAgreed ? "contract" : "terms");
          return;
        }
      }
    } catch {
      // ignore
    }

    // No assignment yet - wait for admin to assign room
    setOnboardingStep("application-status");
  };

  const handlePaymentComplete = (assignmentId: number) => {
    setOnboardingAssignmentId(assignmentId);
    setOnboardingStep("terms");
  };

  const handleOnboardingComplete = async () => {
    const assignmentId = onboardingAssignmentId;
    if (assignmentId) {
      setOnboardingStep("checklist");
      return;
    }
    if (onboardingRoomId && currentUser?.id) {
      try {
        const res = await fetch(
          `/api/checklist-sessions/by-user-room/${currentUser.id}/${onboardingRoomId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setOnboardingAssignmentId(data.assignment_id);
          setOnboardingStep("checklist");
          return;
        }
      } catch {
        // ignore
      }
    }
    setOnboardingStep(null);
    triggerNotification("Welcome! Your contract is now active.");
    fetchAllData();
  };

  const handleChecklistComplete = () => {
    setOnboardingStep(null);
    triggerNotification("Check-in complete! Welcome to your new room.");
    fetchAllData();
  };

  // Show onboarding if tenant has no property and not already in onboarding
  useEffect(() => {
    if (!onboardingStep && token && currentUser?.role === "tenant" && currentUser?.hasProperty === false && !currentUser?.hasPendingApplication && !currentUser?.hasApprovedApplication) {
      setOnboardingStep("nohome");
    }
  }, [token, currentUser, onboardingStep]);

  // Show onboarding if tenant has pending application
  useEffect(() => {
    if (!onboardingStep && token && currentUser?.role === "tenant" && currentUser?.hasPendingApplication && currentUser.applicationId && !currentUser.hasProperty) {
      setOnboardingApplicationId(currentUser.applicationId);
      setOnboardingStep("application-status");
    }
  }, [token, currentUser, onboardingStep]);

  // Show onboarding if tenant has approved application
  useEffect(() => {
    if (!onboardingStep && token && currentUser?.role === "tenant" && currentUser?.hasApprovedApplication && currentUser.applicationId && !currentUser.hasProperty) {
      setOnboardingApplicationId(currentUser.applicationId);
      setOnboardingStep("application-status");
    }
  }, [token, currentUser, onboardingStep]);
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-xs font-semibold text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth view if not logged in
  if (!token || !currentUser) {
    return <AuthView onLoginSuccess={handleLoginSuccess} defaultStep="login-tenant" />;
  }

  // Redirect non-tenant users
  if (currentUser.role !== "tenant") {
    navigate("/app/admins");
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -45, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 pointer-events-none"
          >
            <div className="bg-slate-900/95 backdrop-blur-md text-white px-4.5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-white/15">
              <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <p className="font-sans text-xs font-semibold leading-snug">
                {notification}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <Header currentUser={currentUser} onLogout={handleLogout} role="tenant" />

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
        {/* Onboarding Steps */}
        {onboardingStep === "nohome" && (
          <NoHomeTenantView
            token={token}
            userId={currentUser.id}
            hasPendingApplication={currentUser.hasPendingApplication || false}
            hasApprovedApplication={currentUser.hasApprovedApplication || false}
            applicationId={currentUser.applicationId || null}
            justCheckedOut={justCheckedOut}
            onApply={(propertyId, propertyName, propertyAddress, propertyImage, availableRoomTypes) => {
              setOnboardingPropertyId(propertyId);
              setOnboardingPropertyName(propertyName);
              setOnboardingPropertyAddress(propertyAddress);
              setOnboardingPropertyImage(propertyImage);
              setOnboardingRoomTypes(availableRoomTypes);
              setOnboardingStep("room-type-selection");
            }}
            onApproved={(app) => {
              setOnboardingApplicationId(app.application_id);
              setOnboardingStep("application-status");
            }}
          />
        )}

        {onboardingStep === "room-type-selection" && (
          <div className="space-y-6 animate-fade-in font-sans">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900">Select Room Type</h2>
              <p className="text-sm text-slate-500 mt-1">Choose your preferred room type at {onboardingPropertyName}</p>
            </div>
            {onboardingRoomTypes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {onboardingRoomTypes.map((rt) => (
                  <button
                    key={rt.id}
                    onClick={() => {
                      setOnboardingSelectedRoomType(rt);
                      setOnboardingMonthlyPrice(rt.monthly_price);
                      setOnboardingDepositPrice(rt.deposit_price || 0);
                      setOnboardingStep("application");
                    }}
                    className="p-5 bg-white border-2 border-slate-200 rounded-2xl hover:border-primary transition-all cursor-pointer text-left"
                  >
                    <h3 className="font-display font-bold text-slate-900">{rt.type_name}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="font-mono text-sm font-bold text-primary">Rp {rt.monthly_price.toLocaleString()}/mo</span>
                      {rt.room_size && (
                        <span className="text-xs text-slate-500">{rt.room_size}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl py-12 text-center text-slate-450">
                <p className="font-sans font-semibold text-sm">No room types available</p>
                <p className="font-sans text-xs text-slate-500 mt-1">This property might not have room types configured yet.</p>
              </div>
            )}
            <button
              onClick={() => setOnboardingStep("nohome")}
              className="text-sm text-slate-500 hover:text-primary cursor-pointer"
            >
              Back to property lookup
            </button>
          </div>
        )}

        {onboardingStep === "application" && (
          <TenantApplicationForm
            propertyId={onboardingPropertyId}
            propertyName={onboardingPropertyName}
            propertyAddress={onboardingPropertyAddress}
            propertyImage={onboardingPropertyImage}
            roomTypes={onboardingRoomTypes}
            selectedRoomType={onboardingSelectedRoomType}
            token={token}
            userPhone={currentUser.profile?.phone || ""}
            onSubmit={handleApplicationSubmitted}
            onBack={() => setOnboardingStep("room-type-selection")}
          />
        )}

        {onboardingStep === "application-status" && onboardingApplicationId && (
          <TenantApplicationStatus
            token={token}
            applicationId={onboardingApplicationId}
            onApproved={handleApplicationApproved}
            onRoomAssigned={() => {
              fetch("/api/tenants/me", { headers: { Authorization: `Bearer ${token}` } })
                .then((res) => res.ok ? res.json() : null)
                .then((data) => {
                  if (data && data.assignment_id) {
                    setOnboardingAssignmentId(data.assignment_id);
                    setOnboardingRoomId(data.room_id || 0);
                    setOnboardingRoomNumber(data.roomNumber || "");
                    setOnboardingPropertyId(data.propertyId || "");
                    setOnboardingPropertyName(data.propertyName || "");
                    setOnboardingMonthlyPrice(data.monthlyPrice || 0);
                    setOnboardingDepositPrice(data.depositPrice || 0);
                    setOnboardingStep("payment");
                  }
                });
            }}
          />
        )}

        {onboardingStep === "payment" && onboardingAssignmentId && (
          <PaymentView
            assignmentId={onboardingAssignmentId}
            propertyName={onboardingPropertyName}
            roomNumber={onboardingRoomNumber}
            roomTypeName={onboardingRoomTypeName || "Standard"}
            monthlyPrice={onboardingMonthlyPrice}
            depositPrice={onboardingDepositPrice}
            proratedAmount={onboardingProratedAmount || onboardingMonthlyPrice}
            token={token}
            onPaymentComplete={(assignmentId) => {
              setOnboardingAssignmentId(assignmentId);
              setOnboardingStep("terms");
            }}
            onBack={() => setOnboardingStep("application-status")}
          />
        )}

        {onboardingStep === "terms" && (
          <TermsAndConditionsView
            propertyId={onboardingPropertyId}
            propertyName={onboardingPropertyName}
            token={token}
            onAgreed={() => {
              setOnboardingTermsAgreed(true);
              setOnboardingStep("contract");
            }}
            onBack={() => setOnboardingStep("payment")}
          />
        )}

        {onboardingStep === "contract" && (
          <ContractSigningView
            propertyId={onboardingPropertyId}
            propertyName={onboardingPropertyName}
            roomId={onboardingRoomId}
            roomNumber={onboardingRoomNumber}
            userId={currentUser.id}
            token={token}
            assignmentId={onboardingAssignmentId}
            onCompleted={handleOnboardingComplete}
            onBack={() => setOnboardingStep("terms")}
          />
        )}

        {onboardingStep === "checklist" && onboardingAssignmentId && (
          <ChecklistSessionView
            userId={currentUser.id}
            token={token}
            assignmentId={onboardingAssignmentId}
            sessionType="checkin"
            propertyName={onboardingPropertyName}
            roomNumber={onboardingRoomNumber}
            onCompleted={handleChecklistComplete}
            onBack={() => setOnboardingStep("contract")}
          />
        )}

        {/* Main Tenant Tabs */}
        {!onboardingStep && (
          <>
            {activeTab === "home" && (
              <TenantHomeView
                tenantProfile={tenantProfile}
                bills={bills}
                announcements={announcements}
                maintenanceRequests={maintenanceRequests}
                token={token}
                onPayBill={handlePayBill}
                onPayAllBills={handlePayAllBills}
                onOpenMaintenanceModal={() => setShowMaintModal(true)}
                onOpenHistoryTab={() => setActiveTab("billing")}
                onCheckout={handleTenantCheckout}
              />
            )}

            {activeTab === "billing" && (
              <TenantBillingView
                bills={bills}
                onPayBill={handlePayBill}
                onPayAllBills={handlePayAllBills}
              />
            )}

            {activeTab === "support" && (
              <div className="space-y-6 animate-fade-in font-sans">
                <div>
                  <h3 className="font-display text-2xl font-bold text-slate-900">
                    Maintenance requests
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Submit dispatch complaints and track live engineering statuses.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs text-center max-w-md mx-auto py-10">
                  <Wrench className="w-12 h-12 text-teal-600 mx-auto mb-4 animate-bounce-slow" />
                  <h4 className="font-sans font-bold text-slate-900 text-sm">
                    Need a repair expert?
                  </h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Submit a plumbing, electric, AC unit, or structural repair issue.
                  </p>
                  <button
                    onClick={() => setShowMaintModal(true)}
                    className="mt-6 px-6 py-3 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all"
                  >
                    File Repair Request
                  </button>
                </div>

                {/* Maintenance Requests List */}
                <div className="space-y-4">
                  <h4 className="font-display font-medium text-slate-755 text-sm uppercase tracking-wider">
                    Your Submitted Tickets
                  </h4>
                  {maintenanceRequests.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {maintenanceRequests.map((req) => (
                        <div
                          key={req.id}
                          className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span
                                className={`font-mono text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                                  req.status === "PENDING"
                                    ? "bg-amber-100 text-amber-800"
                                    : req.status === "PROCESSING"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {req.status}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-slate-400">
                              {req.date}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-sans font-bold text-slate-900 text-sm">
                              {req.title}
                            </h4>
                            <p className="font-sans text-xs text-slate-500 mt-1">
                              {req.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-slate-450 p-6 border border-dashed border-slate-200 rounded-2xl text-xs">
                      No active logs. Everything looks good!
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-6 animate-fade-in font-sans">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs max-w-xl mx-auto space-y-6 text-slate-705">
                  <div className="flex gap-4 items-center">
                    <img
                      src={tenantProfile.avatar}
                      alt={tenantProfile.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 shadow-2xs"
                    />
                    <div>
                      <h3 className="font-display font-bold text-lg text-slate-900">
                        {tenantProfile.name}
                      </h3>
                      <p className="text-xs text-slate-450">
                        {currentUser?.email || ""}
                      </p>
                      <span className="inline-block mt-2 font-mono text-[9px] uppercase font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                        {tenantProfile.leaseStatus}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-3.5 text-xs">
                    <h4 className="font-mono font-bold uppercase tracking-widest text-[9px] text-slate-400">
                      LEASE CREDENTIALS
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-150">
                        <span className="text-slate-450 block font-semibold text-[10px]">
                          CORRIDOR LOCATION
                        </span>
                        <span className="text-slate-800 font-bold font-sans text-sm mt-0.5 block">
                          {tenantProfile.propertyName}
                        </span>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-150">
                        <span className="text-slate-450 block font-semibold text-[10px]">
                          ROOM APARTMENT
                        </span>
                        <span className="text-slate-800 font-bold font-sans text-sm mt-0.5 block">
                          {tenantProfile.roomNumber}
                        </span>
                      </div>
                    </div>

                    {/* Tenant-specific data */}
                    {tenantData && (
                      <div className="space-y-3">
                        <h4 className="font-mono font-bold uppercase tracking-widest text-[9px] text-slate-400">
                          TENANT INFORMATION
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {tenantData.occupation && (
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-150">
                              <span className="text-slate-450 block font-semibold text-[10px]">
                                OCCUPATION
                              </span>
                              <span className="text-slate-800 font-bold font-sans text-sm mt-0.5 block">
                                {tenantData.occupation}
                              </span>
                            </div>
                          )}
                          {tenantData.contract_status && (
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-150">
                              <span className="text-slate-450 block font-semibold text-[10px]">
                                CONTRACT STATUS
                              </span>
                              <span className="text-slate-800 font-bold font-sans text-sm mt-0.5 block">
                                {tenantData.contract_status}
                              </span>
                            </div>
                          )}
                          {tenantData.contract_start && (
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-150">
                              <span className="text-slate-450 block font-semibold text-[10px]">
                                CONTRACT START
                              </span>
                              <span className="text-slate-800 font-bold font-sans text-sm mt-0.5 block">
                                {new Date(tenantData.contract_start).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {tenantData.contract_end && (
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-150">
                              <span className="text-slate-450 block font-semibold text-[10px]">
                                CONTRACT END
                              </span>
                              <span className="text-slate-800 font-bold font-sans text-sm mt-0.5 block">
                                {new Date(tenantData.contract_end).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Switch to Admin button - only show if user has owner role */}
                  {(currentUser?.role as string) === "owner" && (
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <button
                        onClick={() => navigate("/app/admins")}
                        className="w-full py-3.5 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        Switch to Admin Panel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      {!onboardingStep && (
        <nav className="fixed bottom-0 w-full flex justify-around items-center bg-white border-t border-slate-200 px-2 pb-6 pt-2 z-40 shadow-md">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center justify-center rounded-xl px-4 py-1.5 transition-all text-xs outline-hidden cursor-pointer ${
              activeTab === "home"
                ? "bg-primary/5 text-primary scale-98"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="font-sans font-medium mt-1">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("billing")}
            className={`flex flex-col items-center justify-center rounded-xl px-4 py-1.5 transition-all text-xs outline-hidden cursor-pointer ${
              activeTab === "billing"
                ? "bg-primary/5 text-primary scale-98"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="font-sans font-medium mt-1">Billing</span>
          </button>

          <button
            onClick={() => setActiveTab("support")}
            className={`flex flex-col items-center justify-center rounded-xl px-4 py-1.5 transition-all text-xs outline-hidden cursor-pointer ${
              activeTab === "support"
                ? "bg-primary/5 text-primary scale-98"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Wrench className="w-5 h-5" />
            <span className="font-sans font-medium mt-1">Support</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center justify-center rounded-xl px-4 py-1.5 transition-all text-xs outline-hidden cursor-pointer ${
              activeTab === "profile"
                ? "bg-primary/5 text-primary scale-98"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="font-sans font-medium mt-1">Profile</span>
          </button>
        </nav>
      )}

      {/* Maintenance Modal */}
      {showMaintModal && (
        <MaintenanceFormModal
          onClose={() => setShowMaintModal(false)}
          onSubmit={handleCreateMaintenance}
        />
      )}
    </div>
  );
}
