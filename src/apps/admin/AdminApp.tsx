import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Property,
  Bill,
  Announcement,
  MaintenanceRequest,
  ActivityLog,
  OwnerProfile,
  User,
  TenantApplication,
  Tenant,
  PaymentConfirmation,
  Notification,
} from "../../types";
import { initialOwnerProfile } from "../../initialData";
import { clearAuth, getStoredToken, getStoredUser, getMe } from "../../services/auth";

// Components
import Header from "../../components/Header";
import AuthView from "../../components/AuthView";
import OwnerDashboardView from "../../components/OwnerDashboardView";
import OwnerPropertiesView from "../../components/OwnerPropertiesView";
import OwnerRoomTypesView from "../../components/OwnerRoomTypesView";
import OwnerPropertyDetailView from "../../components/OwnerPropertyDetailView";
import OwnerPropertyOverviewView from "../../components/OwnerPropertyOverviewView";
import OwnerSurveyView from "../../components/OwnerSurveyView";
import FinanceView from "../../components/FinanceView";
import OwnerAdminManager from "../../components/OwnerAdminManager";
import ResolveMaintenanceModal from "../../components/ResolveMaintenanceModal";
import TenantManagementHub from "./TenantManagementHub";
import Modal from "../../components/ui/Modal";

// Icons
import {
  Home,
  CreditCard,
  Wrench,
  User as UserIcon,
  RotateCcw,
  Shield,
  RefreshCw,
  ClipboardList,
  DollarSign,
  Users,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function AdminApp() {
  const navigate = useNavigate();

  // Auth state
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser);
  const [authLoading, setAuthLoading] = useState(true);

  // Active tab
  const [activeTab, setActiveTab] = useState<
    "home" | "billing" | "support" | "survey" | "finance" | "tenants" | "profile"
  >("home");

  // Data state
  const [properties, setProperties] = useState<Property[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile>(initialOwnerProfile);
  const [applications, setApplications] = useState<TenantApplication[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [paymentConfirmations, setPaymentConfirmations] = useState<PaymentConfirmation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [financeSummary, setFinanceSummary] = useState<{
    total_income: number;
    total_expense: number;
    net_profit: number;
  }>({ total_income: 0, total_expense: 0, net_profit: 0 });

  // Property drill-down state
  const [selectedPropertyOverview, setSelectedPropertyOverview] = useState<Property | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedPropertyDetail, setSelectedPropertyDetail] = useState<Property | null>(null);

  // Modal state
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolvingRequest, setResolvingRequest] = useState<MaintenanceRequest | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Payment confirmation modal state
  const [selectedConfirmation, setSelectedConfirmation] = useState<PaymentConfirmation | null>(null);
  const [confirmAmount, setConfirmAmount] = useState("");
  const [rejectReason, setRejectReason] = useState("");

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

  // Fetch all data
  const fetchAllData = async () => {
    if (!token) return;

    try {
      // Fetch properties
      const propRes = await fetch("/api/properties", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (propRes.ok) {
        const propData = await propRes.json();
        setProperties(propData);
      }

      // Fetch bills
      const billsRes = await fetch("/api/payments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (billsRes.ok) {
        const billsData = await billsRes.json();
        setBills(billsData);
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

      // Fetch dashboard stats
      const statsRes = await fetch("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setActivityLogs(Array.isArray(statsData.logs) ? statsData.logs : []);
      }

      // Fetch pending applications
      const appRes = await fetch("/api/applications/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (appRes.ok) {
        const appData = await appRes.json();
        setApplications(appData.data || appData || []);
      }

      // Fetch finance summary
      const summaryRes = await fetch("/api/finances/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setFinanceSummary(summaryData);
      }

      // Fetch tenants
      const tenantsRes = await fetch("/api/tenants", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (tenantsRes.ok) {
        const tenantsData = await tenantsRes.json();
        setTenants(tenantsData);
      }

      // Fetch payment confirmations
      const confirmationsRes = await fetch("/api/payment-confirmations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (confirmationsRes.ok) {
        const confirmationsData = await confirmationsRes.json();
        setPaymentConfirmations(confirmationsData);
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
      console.error("Error fetching admin data:", error);
    }
  };

  useEffect(() => {
    if (
      token &&
      (currentUser?.role === "owner" || currentUser?.role === "admin")
    ) {
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

  // Handle resolve maintenance
  const handleResolveMaintenance = async (
    requestId: string,
    status: string,
    actualCost?: number
  ) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/maintenance-requests/${requestId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, actual_cost: actualCost }),
      });
      if (res.ok) {
        triggerNotification("Maintenance request updated!");
        fetchAllData();
      }
    } catch (error) {
      console.error("Error resolving maintenance:", error);
    }
  };

  // Handle send reminders
  const handleSendReminders = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/payments/send-reminders", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        triggerNotification("Payment reminders sent!");
      }
    } catch (error) {
      console.error("Error sending reminders:", error);
    }
  };

  // Handle add property
  const handleAddProperty = async (property: {
    name: string;
    address: string;
    type: string;
  }) => {
    if (!token) return;
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(property),
      });
      if (res.ok) {
        triggerNotification("Property added successfully!");
        fetchAllData();
      }
    } catch (error) {
      console.error("Error adding property:", error);
    }
  };

  // Handle delete property
  const handleDeleteProperty = async (propertyId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        triggerNotification("Property deleted successfully!");
        fetchAllData();
      }
    } catch (error) {
      console.error("Error deleting property:", error);
    }
  };

  // Handle confirm payment
  const handleConfirmPayment = async (confirmationId: number, amount: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/payment-confirmations/${confirmationId}/confirm`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ confirmedAmount: amount }),
      });
      if (res.ok) {
        triggerNotification("Payment confirmed!");
        setSelectedConfirmation(null);
        setConfirmAmount("");
        fetchAllData();
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
    }
  };

  // Handle reject payment
  const handleRejectPayment = async (confirmationId: number, reason: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/payment-confirmations/${confirmationId}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rejectionReason: reason }),
      });
      if (res.ok) {
        triggerNotification("Payment rejected!");
        setSelectedConfirmation(null);
        setRejectReason("");
        fetchAllData();
      }
    } catch (error) {
      console.error("Error rejecting payment:", error);
    }
  };

  // Trigger notification
  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Show loading state
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
    return <AuthView onLoginSuccess={handleLoginSuccess} defaultStep="login-owner" />;
  }

  // Redirect non-admin users
  if (currentUser.role !== "owner" && currentUser.role !== "admin") {
    navigate("/app/tenants");
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
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        role="owner"
        notifications={notifications}
        unreadCount={notifications.filter((n) => !n.is_read).length}
      />

      {/* Main Content */}
      <main className="flex-grow flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
        {/* Dashboard Tab */}
        {activeTab === "home" && (
          <OwnerDashboardView
            properties={properties}
            bills={bills}
            maintenanceRequests={maintenanceRequests}
            activityLogs={activityLogs}
            applications={applications}
            paymentConfirmations={paymentConfirmations}
            token={token}
            financeSummary={financeSummary}
            onResolveMaintenance={handleResolveMaintenance}
            onSendReminders={handleSendReminders}
            onRefreshData={fetchAllData}
            onConfirmPayment={handleConfirmPayment}
            onRejectPayment={handleRejectPayment}
          />
        )}

        {/* Properties Tab */}
        {activeTab === "billing" && !selectedPropertyOverview && !selectedPropertyDetail && !selectedProperty && (
          <OwnerPropertiesView
            properties={properties}
            onAddProperty={handleAddProperty}
            onDeleteProperty={handleDeleteProperty}
            onViewDetails={(prop) => setSelectedPropertyOverview(prop)}
          />
        )}
        {activeTab === "billing" && selectedPropertyOverview && !selectedPropertyDetail && !selectedProperty && (
          <OwnerPropertyOverviewView
            property={selectedPropertyOverview}
            onBack={() => setSelectedPropertyOverview(null)}
            onViewFinances={() => {
              setSelectedPropertyDetail(selectedPropertyOverview);
              setSelectedPropertyOverview(null);
            }}
            onViewRooms={() => {
              setSelectedProperty(selectedPropertyOverview);
              setSelectedPropertyOverview(null);
            }}
          />
        )}
        {activeTab === "billing" && selectedPropertyDetail && (
          <OwnerPropertyDetailView
            property={selectedPropertyDetail}
            onBack={() => setSelectedPropertyDetail(null)}
            onNavigateToAdmin={() => setActiveTab("profile")}
          />
        )}
        {activeTab === "billing" && !selectedPropertyDetail && selectedProperty && (
          <OwnerRoomTypesView
            property={{ id: selectedProperty.id, name: selectedProperty.name }}
            onBack={() => setSelectedProperty(null)}
          />
        )}

        {/* Support Tab */}
        {activeTab === "support" && (
          <div className="space-y-6 animate-fade-in font-sans">
            <div>
              <h3 className="font-display text-2xl font-bold text-primary">
                Repair Dispatch Board
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Resolve and process maintenance requests reported by tenants in real-time.
              </p>
            </div>

            {maintenanceRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {maintenanceRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[10px] text-slate-400 font-bold">
                          {req.date}
                        </span>
                        <span
                          className={`font-mono text-[10px] uppercase font-bold px-2.5 py-0.5 rounded ${
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
                      <div>
                        <h4 className="font-sans font-bold text-slate-900 text-sm">
                          {req.title}
                        </h4>
                        <p className="font-sans text-xs text-slate-500 mt-1 leading-normal">
                          {req.description}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 flex gap-2">
                      {req.status !== "PROCESSING" && req.status !== "COMPLETED" && (
                        <button
                          onClick={() => handleResolveMaintenance(req.id, "PROCESSING")}
                          className="px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-xl flex-1 cursor-pointer transition-colors"
                        >
                          Fulfill/Process
                        </button>
                      )}
                      {req.status !== "COMPLETED" && (
                        <button
                          onClick={() => {
                            setResolvingRequest(req);
                            setShowResolveModal(true);
                          }}
                          className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-xl flex-1 cursor-pointer transition-colors text-center"
                        >
                          Resolve Issue
                        </button>
                      )}
                      {req.status === "COMPLETED" && (
                        <button
                          onClick={() => handleResolveMaintenance(req.id, "PENDING")}
                          className="px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl flex-1 cursor-pointer transition-colors"
                        >
                          Reopen Ticket
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl py-12 text-center text-slate-450">
                <p className="font-sans font-semibold text-sm">Perfect Score!</p>
                <p className="font-sans text-xs text-slate-500 mt-1">
                  There are no outstanding repair requests currently registered.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Survey Tab */}
        {activeTab === "survey" && (
          <OwnerSurveyView properties={properties} token={token} />
        )}

        {/* Finance Tab */}
        {activeTab === "finance" && (
          <FinanceView
            properties={properties}
            token={token}
            userId={currentUser?.id}
            financeSummary={financeSummary}
            onRefresh={fetchAllData}
          />
        )}

        {/* Tenants Tab */}
        {activeTab === "tenants" && <TenantManagementHub />}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6 animate-fade-in font-sans">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs max-w-xl mx-auto space-y-6 text-slate-705">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center font-display text-2xl font-bold text-primary shrink-0 border-2 border-primary/20">
                  {currentUser?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "U"}
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900">
                    {ownerProfile.name}
                  </h3>
                  <p className="text-xs text-slate-450">
                    {currentUser?.email || ""}
                  </p>
                  <span className="inline-block mt-2 font-mono text-[9px] uppercase font-bold px-2 py-0.5 bg-primary-container text-white rounded">
                    {currentUser?.role === "admin"
                      ? "DELEGATED ADMIN"
                      : "ADMIN ACCESS VALID"}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-4 text-xs">
                <h4 className="font-mono font-bold uppercase tracking-widest text-[9px] text-slate-400">
                  ADMIN CONTROL DETAILS
                </h4>
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold uppercase">
                      Properties Managed:
                    </span>
                    <span className="text-slate-800 font-bold">
                      {properties.length} Active Complex
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold uppercase">
                      Total Room Index:
                    </span>
                    <span className="text-slate-800 font-bold">
                      {properties.reduce((a, b) => a + b.roomCount, 0)} Units
                    </span>
                  </div>
                </div>
              </div>

              {/* Delegate Admin Access */}
              {currentUser?.role === "owner" && (
                <OwnerAdminManager
                  token={token}
                  properties={properties}
                  ownerId={currentUser.id}
                  onNotify={triggerNotification}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
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
          <span className="font-sans font-medium mt-1">Properties</span>
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
          onClick={() => setActiveTab("tenants")}
          className={`flex flex-col items-center justify-center rounded-xl px-4 py-1.5 transition-all text-xs outline-hidden cursor-pointer ${
            activeTab === "tenants"
              ? "bg-primary/5 text-primary scale-98"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="font-sans font-medium mt-1">Tenants</span>
        </button>

        <button
          onClick={() => setActiveTab("finance")}
          className={`flex flex-col items-center justify-center rounded-xl px-4 py-1.5 transition-all text-xs outline-hidden cursor-pointer ${
            activeTab === "finance"
              ? "bg-primary/5 text-primary scale-98"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span className="font-sans font-medium mt-1">Finance</span>
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

      {/* Resolve Maintenance Modal */}
      {showResolveModal && resolvingRequest && (
        <ResolveMaintenanceModal
          onClose={() => {
            setShowResolveModal(false);
            setResolvingRequest(null);
          }}
          onSubmit={(actualCost) => {
            handleResolveMaintenance(resolvingRequest.id, "COMPLETED", actualCost);
            setShowResolveModal(false);
            setResolvingRequest(null);
          }}
          title={resolvingRequest.title}
        />
      )}

      {/* Payment Confirmation Modal */}
      {selectedConfirmation && (
        <Modal
          onClose={() => {
            setSelectedConfirmation(null);
            setConfirmAmount("");
            setRejectReason("");
          }}
          title="Review Payment Confirmation"
          footer={
            <div className="flex gap-2">
              <button
                onClick={() =>
                  handleConfirmPayment(
                    selectedConfirmation.confirmation_id,
                    Number(confirmAmount)
                  )
                }
                className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-xl flex-1 cursor-pointer transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() =>
                  handleRejectPayment(
                    selectedConfirmation.confirmation_id,
                    rejectReason
                  )
                }
                className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-xl flex-1 cursor-pointer transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  setSelectedConfirmation(null);
                  setConfirmAmount("");
                  setRejectReason("");
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          }
        >
          <div className="space-y-3 mb-4">
            <p className="text-sm text-slate-600">
              <strong>Tenant:</strong>{" "}
              {selectedConfirmation.tenant?.user?.full_name || "Unknown"}
            </p>
            <p className="text-sm text-slate-600">
              <strong>Bill:</strong>{" "}
              {selectedConfirmation.bill?.bill_title || "N/A"}
            </p>
            <p className="text-sm text-slate-600">
              <strong>Amount Claimed:</strong> Rp{" "}
              {Number(selectedConfirmation.amount_claimed).toLocaleString()}
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-600">
                Confirmed Amount
              </label>
              <input
                type="number"
                value={confirmAmount}
                onChange={(e) => setConfirmAmount(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm"
                placeholder="Enter amount"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">
                Rejection Reason (if rejecting)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm"
                placeholder="Enter reason"
                rows={2}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
