import { useState, useEffect, useRef } from "react";
import { Property, Bill, Announcement, MaintenanceRequest, ActivityLog, TenantProfile, OwnerProfile, User as AppUser, TenantApplication } from "./types";
import {
  initialTenantProfile,
  initialOwnerProfile,
} from "./initialData";

// Components
import Header from "./components/Header";
import AuthView from "./components/AuthView";
import GoogleCallback from "./components/GoogleCallback";
import TenantHomeView from "./components/TenantHomeView";
import TenantBillingView from "./components/TenantBillingView";
import OwnerPropertiesView from "./components/OwnerPropertiesView";
import OwnerDashboardView from "./components/OwnerDashboardView";
import OwnerRoomTypesView from "./components/OwnerRoomTypesView";
import OwnerPropertyDetailView from "./components/OwnerPropertyDetailView";
import OwnerPropertyOverviewView from "./components/OwnerPropertyOverviewView";
import MaintenanceFormModal from "./components/MaintenanceFormModal";
import ResolveMaintenanceModal from "./components/ResolveMaintenanceModal";
import NoHomeTenantView from "./components/NoHomeTenantView";
import RoomSelectionView from "./components/RoomSelectionView";
import ContractSigningView from "./components/ContractSigningView";
import TermsAndConditionsView from "./components/TermsAndConditionsView";
import TenantApplicationForm from "./components/TenantApplicationForm";
import TenantApplicationStatus from "./components/TenantApplicationStatus";
import ChecklistSessionView from "./components/ChecklistSessionView";
import PaymentView from "./components/PaymentView";
import OwnerSurveyView from "./components/OwnerSurveyView";
import FinanceView from "./components/FinanceView";
import OwnerAdminManager from "./components/OwnerAdminManager";

// Icons & Transition utilities
import { Home, CreditCard, Wrench, User, RotateCcw, Building2, Bell, Shield, Calendar, MapPin, Check, Plus, AlertTriangle, Play, RefreshCw, ClipboardList, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clearAuth, getStoredToken, getStoredUser, getMe } from "./services/auth";

export default function AuthenticatedApp() {

  // Auth state
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(getStoredUser);
  const [authLoading, setAuthLoading] = useState(true);

  // Role — manual override or derived from user.
  // "admin" delegates share the owner experience in the UI.
  const [manualRole, setManualRole] = useState<"tenant" | "owner" | null>(null);
  const role = (manualRole || (currentUser?.role === "tenant" ? "tenant" : "owner")) as "tenant" | "owner";

  // Active Bottom Navigation Tab for Tenant ("home" | "billing" | "support" | "profile")
  const [tenantTab, setTenantTab] = useState<"home" | "billing" | "support" | "profile">("home");

  // Active Bottom Navigation Tab for Owner ("home" | "billing" | "support" | "survey" | "profile")
  const [ownerTab, setOwnerTab] = useState<"home" | "billing" | "support" | "survey" | "finance" | "profile">("home");

  // Drill-down: selected property for property overview
  const [selectedPropertyOverview, setSelectedPropertyOverview] = useState<Property | null>(null);

  // Drill-down: selected property for room types view
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Drill-down: selected property for detail/finances view
  const [selectedPropertyDetail, setSelectedPropertyDetail] = useState<Property | null>(null);

  // Main synchronized collections fetched from REST API
  const [properties, setProperties] = useState<Property[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [tenantProfile, setTenantProfile] = useState<TenantProfile>(initialTenantProfile);
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile>(initialOwnerProfile);

  // Applications state (owner view)
  const [applications, setApplications] = useState<TenantApplication[]>([]);

  // Finance summary from shared API endpoint
  const [financeSummary, setFinanceSummary] = useState<{
    total_income: number;
    total_expense: number;
    net_profit: number;
  }>({ total_income: 0, total_expense: 0, net_profit: 0 });

  // Modal displays
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolvingRequest, setResolvingRequest] = useState<MaintenanceRequest | null>(null);
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

  // Fetch all collections from REST API
  const fetchAllData = async () => {
    try {
      // 1. Properties
      const propHeaders: Record<string, string> = {};
      if (token) propHeaders["Authorization"] = `Bearer ${token}`;
      const propRes = await fetch('/api/properties', { headers: propHeaders });
      if (propRes.ok) {
        const propData = await propRes.json();
        setProperties(propData);
      }

      // 2. Bills / Payments
      const billsHeaders: Record<string, string> = {};
      if (token) billsHeaders["Authorization"] = `Bearer ${token}`;
      const billsRes = await fetch('/api/payments', { headers: billsHeaders });
      if (billsRes.ok) {
        const billsData = await billsRes.json();
        setBills(billsData);
        
        // Dynamically compute outstanding balance for the profile
        const remainingUnpaid = billsData.filter((b: Bill) => b.status === "UNPAID" || b.status === "OVERDUE");
        const outstandingSum = remainingUnpaid.reduce((tot: number, b: Bill) => tot + b.amount, 0);
        setTenantProfile(p => ({
          ...p,
          outstandingBalance: outstandingSum
        }));
      }

      // 3. Announcements
      const annHeaders: Record<string, string> = {};
      if (token) annHeaders["Authorization"] = `Bearer ${token}`;
      const annRes = await fetch('/api/announcements', { headers: annHeaders });
      if (annRes.ok) {
        const annData = await annRes.json();
        setAnnouncements(annData);
      }

      // 4. Maintenance Requests
      const maintHeaders: Record<string, string> = {};
      if (token) maintHeaders["Authorization"] = `Bearer ${token}`;
      const maintRes = await fetch('/api/maintenance-requests', { headers: maintHeaders });
      if (maintRes.ok) {
        const maintData = await maintRes.json();
        const statusMap: Record<string, MaintenanceRequest["status"]> = {
          "scheduled": "PENDING",
          "in_progress": "PROCESSING",
          "completed": "COMPLETED",
          "cancelled": "COMPLETED",
        };
        const mapped: MaintenanceRequest[] = (Array.isArray(maintData) ? maintData : []).map((r: any) => ({
          id: String(r.maintenance_id ?? r.id ?? ""),
          title: r.maintenance_title ?? r.title ?? "",
          description: r.description ?? "",
          status: statusMap[r.status] ?? "PENDING",
          date: r.created_at ? new Date(r.created_at).toLocaleDateString() : r.date ?? "",
          room: r.room?.room_number ?? r.room ?? "",
          propertyName: r.property?.property_name ?? r.propertyName ?? "",
          urgent: r.urgent ?? false,
          image: r.image_urls?.[0] ?? r.image ?? undefined,
          images: r.image_urls ?? r.images ?? undefined,
        }));
        setMaintenanceRequests(mapped);
      }

      // 5. Dashboard Stats & Logs
      const statsHeaders: Record<string, string> = {};
      if (token) statsHeaders["Authorization"] = `Bearer ${token}`;
      const statsRes = await fetch('/api/dashboard/stats', { headers: statsHeaders });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setActivityLogs(Array.isArray(statsData.logs) ? statsData.logs : []);
      }

      // 6. Pending applications (for owner / admin)
      if ((currentUser?.role === "owner" || currentUser?.role === "admin") && token) {
        const appRes = await fetch('/api/applications/pending', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (appRes.ok) {
          const appData = await appRes.json();
          setApplications(appData.data || appData || []);
        }

        // 7. Finance summary (shared endpoint for dashboard + finance page)
        try {
          const summaryRes = await fetch('/api/finances/summary', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (summaryRes.ok) {
            const summaryData = await summaryRes.json();
            setFinanceSummary({
              total_income: summaryData.total_income ?? 0,
              total_expense: summaryData.total_expense ?? 0,
              net_profit: summaryData.net_profit ?? 0,
            });
          }
        } catch {}
      }
    } catch (e) {
      console.error("Failed to fetch full-stack server state:", e);
    }
  };

  // Load all data when authenticated
  const hasFetchedAllData = useRef(false);
  useEffect(() => {
    if (token && currentUser && !hasFetchedAllData.current) {
      hasFetchedAllData.current = true;
      fetchAllData();
    }
  }, [token, currentUser?.hasProperty]);

  // NOTE: The old auto-submit invite flow has been removed.
  // Tenants now sign up directly at /invite/:code via TenantInviteSignup,
  // which calls POST /api/auth/register-tenant and creates an approved application.

  // Sync profiles with currentUser (name, avatar)
  useEffect(() => {
    if (currentUser) {
      setTenantProfile(p => ({
        ...p,
        name: currentUser.name,
        avatar: currentUser.profile?.profile_image ?? p.avatar,
        leaseStatus: currentUser.hasProperty ? "ACTIVE LEASE" : "NO ACTIVE LEASE",
      }));
      setOwnerProfile(p => ({
        ...p,
        name: currentUser.name,
        avatar: currentUser.profile?.profile_image || p.avatar,
      }));
    }
  }, [currentUser]);

  // Fetch tenant room/property data separately
  const hasFetchedTenantData = useRef(false);
  useEffect(() => {
    if (currentUser?.role === "tenant" && token && currentUser.hasProperty && !hasFetchedTenantData.current) {
      hasFetchedTenantData.current = true;
      fetch("/api/tenants/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.roomNumber) {
            setTenantProfile((p) => ({
              ...p,
              roomNumber: data.roomNumber,
              propertyName: data.propertyName || "",
              tower: data.tower || "",
              floor: data.floor || "",
              leaseStatus: "ACTIVE LEASE",
            }));
          }
        })
        .catch(() => {});
    }
    // Reset ref when user loses property (checkout)
    if (!currentUser?.hasProperty) {
      hasFetchedTenantData.current = false;
    }
  }, [currentUser?.hasProperty, token]);

  // Utility to show beautiful automated toast
  const triggerNotification = (text: string) => {
    setNotification(text);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Reset Demo to seed defaults
  const handleResetDemoAndSync = async () => {
    try {
      const res = await fetch('/api/dashboard/seed-reset', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        triggerNotification("Demonstration database reset successfully to base configurations!");
        fetchAllData();
      }
    } catch (e) {
      console.error("Failed to reset database:", e);
    }
  };

  // 1. Pay an individual bill
  const handlePayBill = async (id: string) => {
    try {
      const res = await fetch(`/api/payments/${id}/pay`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        triggerNotification(`Successfully processed payment: ${data.bill?.bill_type || 'Bill'}`);
        fetchAllData();
      }
    } catch (e) {
      console.error("Failed to pay bill:", e);
    }
  };

  // 2. Pay all bills bulk trigger
  const handlePayAllBills = async () => {
    try {
      const res = await fetch('/api/payments/pay-all', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        triggerNotification("Cleared fully optimized arrears sum from active ledger!");
        fetchAllData();
      }
    } catch (e) {
      console.error("Failed to pay all bills:", e);
    }
  };

  // 3. Resolve, advance or reject maintenance states inside Owner views
  const handleResolveMaintenance = async (id: string, newStatus: "PENDING" | "PROCESSING" | "COMPLETED", actualCost?: number) => {
    try {
      const statusMap: Record<string, string> = {
        "PENDING": "scheduled",
        "PROCESSING": "in_progress",
        "COMPLETED": "completed",
      };
      const res = await fetch(`/api/maintenance-requests/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: statusMap[newStatus] || newStatus.toLowerCase(), actual_cost: actualCost })
      });
      if (res.ok) {
        triggerNotification(`Dispatched ticket status changed to: ${newStatus}`);
        fetchAllData();
      }
    } catch (e) {
      console.error("Failed to update ticket:", e);
    }
  };

  // 4. Submit fresh maintenance ticket as tenant
  const handleCreateMaintenance = async (title: string, description: string, urgent: boolean) => {
    try {
      // Get tenant's property_id from their assignment
      const tenantRes = await fetch('/api/tenants/me', { headers: { Authorization: `Bearer ${token}` } });
      const tenantData = tenantRes.ok ? await tenantRes.json() : null;
      const propertyId = tenantData?.propertyId ? parseInt(tenantData.propertyId.replace('prop-', '')) : null;

      const res = await fetch('/api/maintenance-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          maintenance_title: title,
          description,
          property_id: propertyId,
          status: 'scheduled',
        })
      });
      if (res.ok) {
        if (urgent) {
          triggerNotification("URGENT ticket logged! Building superintendents are being notified immediately.");
        } else {
          triggerNotification("Problem ticket created. Admin will view and process repairs.");
        }
        setShowMaintModal(false);
        fetchAllData();
      }
    } catch (e) {
      console.error("Failed to create maintenance ticket:", e);
    }
  };

  // 5. Add properties into the dashboard
  const handleAddProperty = async (newProperty: Omit<Property, "id">) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers,
        body: JSON.stringify(newProperty)
      });
      if (res.ok) {
        triggerNotification(`Added property asset: ${newProperty.name} successfully.`);
        fetchAllData();
      }
    } catch (e) {
      console.error("Failed to add property asset:", e);
    }
  };

  // 6. Delete property
  const handleDeleteProperty = async (id: string) => {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`/api/properties/${id}`, { method: "DELETE", headers });
    if (res.ok) {
      triggerNotification("Property deleted successfully");
      setSelectedProperty(null);
      fetchAllData();
    }
  };

  // 7. Bulk send payment reminders matching owner specs
  const handleSendReminders = () => {
    triggerNotification("Broadcasting billing notification reminders to all default late-ledger accounts!");
  };

  // Auth gate
  const handleLoginSuccess = (newToken: string, user: AppUser) => {
    // Clear stale onboarding state from any previous session
    setOnboardingStep(null);
    hasDeterminedStep.current = false;
    setJustCheckedOut(false);
    localStorage.removeItem("kostel_onboarding_step");
    localStorage.removeItem("kostel_invite_code");

    setToken(newToken);
    setCurrentUser(user);
    setManualRole(null);
    triggerNotification(`Signed in as ${user.name}`);
  };

  const handleLogout = () => {
    clearAuth();
    setToken(null);
    setCurrentUser(null);
    setManualRole(null);
    setOnboardingStep(null);
    hasDeterminedStep.current = false;
    hasFetchedTenantData.current = false;
    hasFetchedAllData.current = false;
    triggerNotification("Signed out");
  };

  // Onboarding state for new tenants
  const hasDeterminedStep = useRef(false);
  const [onboardingStep, setOnboardingStep] = useState<"nohome" | "room-type-selection" | "application" | "application-status" | "room" | "payment" | "terms" | "contract" | "checklist" | null>(() => {
    const saved = localStorage.getItem("kostel_onboarding_step");
    return saved ? (saved as any) : null;
  });
  const [onboardingPropertyId, setOnboardingPropertyId] = useState(() => localStorage.getItem("kostel_onboarding_propertyId") || "");
  const [onboardingPropertyName, setOnboardingPropertyName] = useState(() => localStorage.getItem("kostel_onboarding_propertyName") || "");
  const [onboardingPropertyAddress, setOnboardingPropertyAddress] = useState(() => localStorage.getItem("kostel_onboarding_propertyAddress") || "");
  const [onboardingPropertyImage, setOnboardingPropertyImage] = useState(() => localStorage.getItem("kostel_onboarding_propertyImage") || "");
  const [onboardingRoomTypes, setOnboardingRoomTypes] = useState<Array<{id: number; type_name: string; monthly_price: number; room_size: string}>>(() => {
    const saved = localStorage.getItem("kostel_onboarding_roomTypes");
    return saved ? JSON.parse(saved) : [];
  });
  const [onboardingSelectedRoomType, setOnboardingSelectedRoomType] = useState<{id: number; type_name: string; monthly_price: number; room_size: string} | null>(() => {
    const saved = localStorage.getItem("kostel_onboarding_selectedRoomType");
    return saved ? JSON.parse(saved) : null;
  });
  const [onboardingApplicationId, setOnboardingApplicationId] = useState<number | null>(() => {
    const saved = localStorage.getItem("kostel_onboarding_applicationId");
    return saved ? parseInt(saved) : null;
  });
  const [onboardingRoomId, setOnboardingRoomId] = useState<number | null>(() => {
    const saved = localStorage.getItem("kostel_onboarding_roomId");
    return saved ? parseInt(saved) : null;
  });
  const [onboardingRoomNumber, setOnboardingRoomNumber] = useState(() => localStorage.getItem("kostel_onboarding_roomNumber") || "");
  const [onboardingRoomTypeName, setOnboardingRoomTypeName] = useState(() => localStorage.getItem("kostel_onboarding_roomTypeName") || "");
  const [onboardingDepositPrice, setOnboardingDepositPrice] = useState(() => {
    const saved = localStorage.getItem("kostel_onboarding_depositPrice");
    return saved ? parseFloat(saved) : 0;
  });
  const [onboardingMonthlyPrice, setOnboardingMonthlyPrice] = useState(() => {
    const saved = localStorage.getItem("kostel_onboarding_monthlyPrice");
    return saved ? parseFloat(saved) : 0;
  });
  const [onboardingProratedAmount, setOnboardingProratedAmount] = useState(() => {
    const saved = localStorage.getItem("kostel_onboarding_proratedAmount");
    return saved ? parseFloat(saved) : 0;
  });
  const [onboardingAssignmentId, setOnboardingAssignmentId] = useState<number | null>(() => {
    const saved = localStorage.getItem("kostel_onboarding_assignmentId");
    return saved ? parseInt(saved) : null;
  });
  const [onboardingTermsAgreed, setOnboardingTermsAgreed] = useState(() => {
    return localStorage.getItem("kostel_onboarding_termsAgreed") === "true";
  });

  // Persist onboarding state to localStorage
  useEffect(() => {
    if (onboardingStep) {
      localStorage.setItem("kostel_onboarding_step", onboardingStep);
      localStorage.setItem("kostel_onboarding_propertyId", onboardingPropertyId);
      localStorage.setItem("kostel_onboarding_propertyName", onboardingPropertyName);
      localStorage.setItem("kostel_onboarding_propertyAddress", onboardingPropertyAddress);
      localStorage.setItem("kostel_onboarding_propertyImage", onboardingPropertyImage);
      localStorage.setItem("kostel_onboarding_roomTypes", JSON.stringify(onboardingRoomTypes));
      localStorage.setItem("kostel_onboarding_selectedRoomType", JSON.stringify(onboardingSelectedRoomType));
      localStorage.setItem("kostel_onboarding_applicationId", String(onboardingApplicationId || ""));
      localStorage.setItem("kostel_onboarding_roomId", String(onboardingRoomId || ""));
      localStorage.setItem("kostel_onboarding_roomNumber", onboardingRoomNumber);
      localStorage.setItem("kostel_onboarding_roomTypeName", onboardingRoomTypeName);
      localStorage.setItem("kostel_onboarding_depositPrice", String(onboardingDepositPrice));
      localStorage.setItem("kostel_onboarding_monthlyPrice", String(onboardingMonthlyPrice));
      localStorage.setItem("kostel_onboarding_proratedAmount", String(onboardingProratedAmount));
      localStorage.setItem("kostel_onboarding_assignmentId", String(onboardingAssignmentId || ""));
      localStorage.setItem("kostel_onboarding_termsAgreed", String(onboardingTermsAgreed));
    } else {
      localStorage.removeItem("kostel_onboarding_step");
      localStorage.removeItem("kostel_onboarding_propertyId");
      localStorage.removeItem("kostel_onboarding_propertyName");
      localStorage.removeItem("kostel_onboarding_propertyAddress");
      localStorage.removeItem("kostel_onboarding_propertyImage");
      localStorage.removeItem("kostel_onboarding_roomTypes");
      localStorage.removeItem("kostel_onboarding_selectedRoomType");
      localStorage.removeItem("kostel_onboarding_applicationId");
      localStorage.removeItem("kostel_onboarding_roomId");
      localStorage.removeItem("kostel_onboarding_roomNumber");
      localStorage.removeItem("kostel_onboarding_roomTypeName");
      localStorage.removeItem("kostel_onboarding_depositPrice");
      localStorage.removeItem("kostel_onboarding_monthlyPrice");
      localStorage.removeItem("kostel_onboarding_proratedAmount");
      localStorage.removeItem("kostel_onboarding_assignmentId");
      localStorage.removeItem("kostel_onboarding_termsAgreed");
    }
  }, [onboardingStep, onboardingPropertyId, onboardingPropertyName, onboardingPropertyAddress, onboardingPropertyImage, onboardingRoomTypes, onboardingSelectedRoomType, onboardingApplicationId, onboardingRoomId, onboardingRoomNumber, onboardingRoomTypeName, onboardingDepositPrice, onboardingMonthlyPrice, onboardingProratedAmount, onboardingAssignmentId, onboardingTermsAgreed]);

  // Determine onboarding step on mount and after login
  useEffect(() => {
    if (token && currentUser && currentUser.role === "tenant" && !hasDeterminedStep.current) {
      hasDeterminedStep.current = true;
      
      // If just checked out, go directly to nohome
      if (justCheckedOut) {
        setOnboardingStep("nohome");
        return;
      }
      
      // Always check server state to determine correct step
      const determineStep = async () => {
        try {
          // First check if user still has property on server
          const userRes = await getMe(token);
          const serverHasProperty = userRes.hasProperty || false;
          
          // Update local state if different from server
          if (currentUser.hasProperty !== serverHasProperty) {
            setCurrentUser((prev) => prev ? { ...prev, hasProperty: serverHasProperty } : prev);
          }

          if (!serverHasProperty) {
            // Check if tenant has an active assignment
            const tenantRes = await fetch("/api/tenants/me", { headers: { Authorization: `Bearer ${token}` } });
            const tenantData = tenantRes.ok ? await tenantRes.json() : null;

            if (tenantData && tenantData.assignment_id) {
              // Tenant has an assignment - check contract status
              setOnboardingAssignmentId(tenantData.assignment_id);
              setOnboardingRoomNumber(tenantData.roomNumber || "");
              setOnboardingPropertyId(tenantData.propertyId || "");
              setOnboardingPropertyName(tenantData.propertyName || "");

              const contractRes = await fetch(`/api/contracts/by-assignment/${tenantData.assignment_id}`, { headers: { Authorization: `Bearer ${token}` } });
              const contractData = contractRes.ok ? await contractRes.json() : null;

              if (contractData && contractData.status === "signed") {
                // Contract signed - check if checklist is completed
                const checklistRes = await fetch(`/api/checklist-sessions/assignment/${tenantData.assignment_id}/checkin/status`, { headers: { Authorization: `Bearer ${token}` } });
                const checklistData = checklistRes.ok ? await checklistRes.json() : null;

                if (checklistData && checklistData.completed) {
                  // Everything done - exit onboarding
                  setOnboardingStep(null);
                  setCurrentUser((prev) => (prev ? { ...prev, hasProperty: true } : prev));
                  localStorage.removeItem("kostel_onboarding_step");
                } else {
                  // Checklist not completed
                  setOnboardingStep("checklist");
                }
              } else {
                // Contract not signed - check if terms agreed
                setOnboardingStep(onboardingTermsAgreed ? "contract" : "terms");
              }
            } else if (currentUser.hasApprovedApplication) {
              // Approved but no room assigned yet
              setOnboardingApplicationId(currentUser.applicationId || null);
              setOnboardingStep("application-status");
            } else if (currentUser.hasPendingApplication) {
              // Pending application
              setOnboardingApplicationId(currentUser.applicationId || null);
              setOnboardingStep("application-status");
            } else {
              // No application yet
              setOnboardingStep("nohome");
            }
          } else {
            // User has property - no onboarding needed
            setOnboardingStep(null);
          }
        } catch (e) {
          console.error("Failed to determine onboarding step:", e);
          // On error, clear onboarding state and let the safety effect decide.
          // This prevents bouncing the user back to "contract" from a stale
          // localStorage value when the server lookup failed.
          setOnboardingStep(null);
        }
      };

      determineStep();
    } else if (!currentUser) {
      setOnboardingStep(null);
    }
  }, [token, currentUser?.hasProperty, currentUser?.role, currentUser?.hasApprovedApplication, currentUser?.hasPendingApplication]);

  const handleApply = (
    propertyId: string,
    propertyName: string,
    propertyAddress: string,
    propertyImage: string,
    roomTypes: Array<{id: number; type_name: string; monthly_price: number; room_size: string}>,
  ) => {
    setOnboardingPropertyId(propertyId);
    setOnboardingPropertyName(propertyName);
    setOnboardingPropertyAddress(propertyAddress);
    setOnboardingPropertyImage(propertyImage);
    setOnboardingRoomTypes(roomTypes);
    setOnboardingStep("room-type-selection");
  };

  const handleRoomTypeSelected = (roomType: {id: number; type_name: string; monthly_price: number; room_size: string}) => {
    setOnboardingSelectedRoomType(roomType);
    setOnboardingStep("application");
  };

  const handleApplicationSubmitted = async (applicationId: number) => {
    setOnboardingApplicationId(applicationId);
    setOnboardingStep("application-status");
    // Re-fetch user to update hasPendingApplication status
    try {
      const user = await getMe(token!);
      setCurrentUser(user);
    } catch {
      // ignore
    }
  };

  const handleApplicationApproved = async (application: TenantApplication) => {
    setOnboardingApplicationId(application.application_id);
    setCurrentUser((prev) =>
      prev ? { ...prev, hasApprovedApplication: true, applicationId: application.application_id } : prev
    );
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
          // Room already assigned - skip to terms/contract
          setOnboardingAssignmentId(data.assignment_id);
          setOnboardingRoomNumber(data.roomNumber || "");
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
    // After contract signing, transition to check-in checklist
    const assignmentId = onboardingAssignmentId;
    if (assignmentId) {
      // Mark contract step as completed so a reload doesn't bounce back to it.
      localStorage.setItem("kostel_onboarding_step", "checklist");
      localStorage.setItem("kostel_onboarding_assignmentId", String(assignmentId));
      setOnboardingStep("checklist");
      return;
    }
    // Fallback (no payment flow): try to find assignment by user+room
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
      } catch (e) {
        console.error("Failed to lookup assignment:", e);
      }
    }
    setOnboardingStep(null);
    setCurrentUser((prev) => (prev ? { ...prev, hasProperty: true } : prev));
    triggerNotification("Welcome! Your contract is now active.");
    fetchAllData();
  };

  const handleChecklistComplete = () => {
    setOnboardingStep(null);
    setCurrentUser((prev) => (prev ? { ...prev, hasProperty: true } : prev));
    triggerNotification("Check-in complete! Welcome to your new room.");
    fetchAllData();
  };

  const [justCheckedOut, setJustCheckedOut] = useState(false);

  const handleTenantCheckout = async () => {
    if (!window.confirm("Quick Checkout: This will end your tenancy immediately. Continue?")) return;
    try {
      const res = await fetch("/api/tenants/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        triggerNotification("Checkout complete! Your tenancy has been ended.");
        // Force clear all tenant state
        setCurrentUser((prev) => prev ? { 
          ...prev, 
          hasProperty: false, 
          hasPendingApplication: false, 
          hasApprovedApplication: false,
          applicationId: null 
        } : prev);
        setTenantProfile((p) => ({ ...p, roomNumber: "N/A", propertyName: "N/A", leaseStatus: "NO ACTIVE LEASE" }));
        // Force reset onboarding
        hasDeterminedStep.current = false;
        setJustCheckedOut(true);
        setOnboardingStep("nohome");
        setOnboardingAssignmentId(null);
        setOnboardingRoomId(null);
        setOnboardingRoomNumber("");
        // Refresh user data from server
        try {
          const userRes = await getMe(token!);
          setCurrentUser(userRes);
        } catch {}
        fetchAllData();
      } else {
        const err = await res.json();
        triggerNotification(`Checkout failed: ${err.error || "Unknown error"}`);
      }
    } catch {
      triggerNotification("Checkout failed: Network error");
    }
  };

  // Safety: If tenant has no property and no onboarding step, force to nohome
  useEffect(() => {
    if (currentUser?.role === "tenant" && !currentUser.hasProperty && !onboardingStep) {
      setOnboardingStep("nohome");
    }
    // Owners and admins should never have an onboarding step — clear stale localStorage
    if ((currentUser?.role === "owner" || currentUser?.role === "admin") && onboardingStep) {
      setOnboardingStep(null);
    }
  }, [currentUser?.role, currentUser?.hasProperty, onboardingStep]);

  if (!token || !currentUser) {
    if (authLoading && token) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-xs font-semibold text-slate-500">Loading...</p>
          </div>
        </div>
      );
    }
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      
      {/* Toast Alert Toast Container */}
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
              <p className="font-sans text-xs font-semibold leading-snug">{notification}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Application Header */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        role={role}
      />

      {/* Main viewport canvas */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">

        {onboardingStep === "nohome" && (
          <NoHomeTenantView
            token={token}
            userId={currentUser.id}
            hasPendingApplication={currentUser.hasPendingApplication || false}
            hasApprovedApplication={currentUser.hasApprovedApplication || false}
            applicationId={currentUser.applicationId || null}
            justCheckedOut={justCheckedOut}
            onApply={handleApply}
            onApproved={(app) => {
              handleApplicationApproved(app);
              setOnboardingPropertyId(app.property ? `prop-${app.property.property_id}` : "");
              setOnboardingPropertyName(app.property?.property_name || "");
              setOnboardingPropertyAddress(app.property?.address || "");
            }}
          />
        )}
        {onboardingStep === "room-type-selection" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900">Select Room Type</h2>
              <p className="text-sm text-slate-500 mt-1">Choose your preferred room type at {onboardingPropertyName}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {onboardingRoomTypes.map((rt) => (
                <button
                  key={rt.id}
                  onClick={() => handleRoomTypeSelected(rt)}
                  className="p-5 bg-white border-2 border-slate-200 rounded-2xl hover:border-primary transition-all cursor-pointer text-left"
                >
                  <h3 className="font-display font-bold text-slate-900">{rt.type_name}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="font-mono text-sm font-bold text-primary">Rp {rt.monthly_price.toLocaleString()}/mo</span>
                    {rt.room_size && <span className="text-xs text-slate-500">{rt.room_size}</span>}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setOnboardingStep("nohome")}
              className="text-sm text-slate-500 hover:text-primary cursor-pointer"
            >
              ΓåÉ Back
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
              // Room has been assigned - fetch details and go to payment
              fetch("/api/tenants/me", { headers: { Authorization: `Bearer ${token}` } })
                .then((res) => res.ok ? res.json() : null)
                .then((data) => {
                  if (data && data.assignment_id) {
                    setOnboardingAssignmentId(data.assignment_id);
                    setOnboardingRoomId(data.room_id || 0);
                    setOnboardingRoomNumber(data.roomNumber || "");
                    setOnboardingPropertyId(data.propertyId || "");
                    setOnboardingPropertyName(data.propertyName || "");
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

        {!onboardingStep ? (
          role === "tenant" && !currentUser.hasProperty ? (
            // Tenant with no property - should be in onboarding
            <NoHomeTenantView
              token={token}
              userId={currentUser.id}
              hasPendingApplication={currentUser.hasPendingApplication || false}
              hasApprovedApplication={currentUser.hasApprovedApplication || false}
              applicationId={currentUser.applicationId || null}
              justCheckedOut={justCheckedOut}
              onApply={handleApply}
              onApproved={(app) => {
                handleApplicationApproved(app);
                setOnboardingPropertyId(app.property ? `prop-${app.property.property_id}` : "");
                setOnboardingPropertyName(app.property?.property_name || "");
                setOnboardingPropertyAddress(app.property?.address || "");
              }}
            />
          ) : role === "tenant" ? (
          <div>
            {/* 1. Tenant Experience rendering */}
            {tenantTab === "home" && (
              <TenantHomeView
                tenantProfile={tenantProfile}
                bills={bills}
                announcements={announcements}
                maintenanceRequests={maintenanceRequests}
                token={token}
                onPayBill={handlePayBill}
                onPayAllBills={handlePayAllBills}
                onOpenMaintenanceModal={() => setShowMaintModal(true)}
                onOpenHistoryTab={() => setTenantTab("billing")}
                onCheckout={handleTenantCheckout}
              />
            )}

            {tenantTab === "billing" && (
              <TenantBillingView
                bills={bills}
                onPayBill={handlePayBill}
                onPayAllBills={handlePayAllBills}
              />
            )}

            {tenantTab === "support" && (
              <div className="space-y-6 animate-fade-in font-sans">
                {/* Detailed Support Portal for Tenant */}
                <div>
                  <h3 className="font-display text-2xl font-bold text-slate-900">Maintenance requests</h3>
                  <p className="text-xs text-slate-500 mt-1">Submit dispatch complaints and track live engineering statuses.</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs text-center max-w-md mx-auto py-10">
                  <Wrench className="w-12 h-12 text-teal-600 mx-auto mb-4 animate-bounce-slow" />
                  <h4 className="font-sans font-bold text-slate-900 text-sm">Need a repair expert?</h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Submit a plumbing, electric, AC unit, or structural repair issue. Our average landlord dispatch resolution window is less than 6 hours.
                  </p>
                  <button
                    onClick={() => setShowMaintModal(true)}
                    className="mt-6 px-6 py-3 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all"
                  >
                    File Repair Request
                  </button>
                </div>

                {/* Submissions queue lists */}
                <div className="space-y-4">
                  <h4 className="font-display font-medium text-slate-755 text-sm uppercase tracking-wider">Your Submitted Tickets</h4>
                  
                  {maintenanceRequests.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {maintenanceRequests.map(req => (
                        <div key={req.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className={`font-mono text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                                req.status === "PENDING"
                                  ? "bg-amber-100 text-amber-800"
                                  : req.status === "PROCESSING"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}>
                                {req.status}
                              </span>
                              {req.urgent && (
                                <span className="ml-2 font-mono text-[9px] uppercase font-bold bg-rose-100 text-rose-850 px-2 py-0.5 rounded">
                                  CRITICAL
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-slate-400">{req.date}</span>
                          </div>

                          <div>
                            <h4 className="font-sans font-bold text-slate-900 text-sm">{req.title}</h4>
                            <p className="font-sans text-xs text-slate-500 mt-1">{req.description}</p>
                          </div>

                          <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-100 font-mono">
                            Address: {req.propertyName} ┬╖ {typeof req.room === "object" && req.room !== null ? (req.room as any).room_number : req.room}
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

            {tenantTab === "profile" && (
              <div className="space-y-6 animate-fade-in font-sans">
                {/* Apartment Active Lease Profile details */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs max-w-xl mx-auto space-y-6 text-slate-705">
                  <div className="flex gap-4 items-center">
                    <img
                      src={tenantProfile.avatar}
                      alt={tenantProfile.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 shadow-2xs"
                    />
                    <div>
                      <h3 className="font-display font-bold text-lg text-slate-900">{tenantProfile.name}</h3>
                      <p className="text-xs text-slate-450">{currentUser?.email || ""}</p>
                      <span className="inline-block mt-2 font-mono text-[9px] uppercase font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                        {tenantProfile.leaseStatus}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-3.5 text-xs">
                    <h4 className="font-mono font-bold uppercase tracking-widest text-[9px] text-slate-400">LEASE CREDENTIALS</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-150">
                        <span className="text-slate-450 block font-semibold text-[10px]">CORRIDOR LOCATION</span>
                        <span className="text-slate-800 font-bold font-sans text-sm mt-0.5 block">{tenantProfile.propertyName}</span>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-150">
                        <span className="text-slate-450 block font-semibold text-[10px]">ROOM APARTMENT</span>
                        <span className="text-slate-800 font-bold font-sans text-sm mt-0.5 block">{tenantProfile.roomNumber}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
                      <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="block font-bold text-slate-800">Security Key Active</span>
                        <span className="block text-slate-500 mt-1 leading-normal">
                          Your physical smart key card can access Lobby lockers and Skyline Tower elevator gates until your lease contract matures.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <button
                      onClick={() => { setManualRole("owner"); triggerNotification("Switched to Owner view"); }}
                      className="w-full py-3.5 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      Switch to Owner Profile
                    </button>
                    <button
                      onClick={handleResetDemoAndSync}
                      className="w-full py-3.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-900 border border-orange-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all uppercase"
                    >
                      <RotateCcw className="w-4 h-4" /> Reset Demo Seed Database
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* 2. Owner Experience rendering */}
            {ownerTab === "home" && (
              <OwnerDashboardView
                properties={properties}
                bills={bills}
                maintenanceRequests={maintenanceRequests}
                activityLogs={activityLogs}
                applications={applications}
                token={token}
                financeSummary={financeSummary}
                onResolveMaintenance={handleResolveMaintenance}
                onSendReminders={handleSendReminders}
                onRefreshData={fetchAllData}
              />
            )}

            {ownerTab === "billing" && !selectedPropertyOverview && !selectedPropertyDetail && !selectedProperty && (
              <OwnerPropertiesView
                properties={properties}
                onAddProperty={handleAddProperty}
                onDeleteProperty={handleDeleteProperty}
                onViewDetails={(prop) => setSelectedPropertyOverview(prop)}
              />
            )}
            {ownerTab === "billing" && selectedPropertyOverview && !selectedPropertyDetail && !selectedProperty && (
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
            {ownerTab === "billing" && selectedPropertyDetail && (
              <OwnerPropertyDetailView
                property={selectedPropertyDetail}
                onBack={() => setSelectedPropertyDetail(null)}
                onNavigateToAdmin={() => setOwnerTab("profile")}
              />
            )}
            {ownerTab === "billing" && !selectedPropertyDetail && selectedProperty && (
              <OwnerRoomTypesView
                property={{ id: selectedProperty.id, name: selectedProperty.name }}
                onBack={() => setSelectedProperty(null)}
              />
            )}

            {ownerTab === "support" && (
              <div className="space-y-6 animate-fade-in font-sans">
                {/* Advanced Task Board for Owner Support */}
                <div>
                  <h3 className="font-display text-2xl font-bold text-primary">Repair Dispatch Board</h3>
                  <p className="text-xs text-slate-500 mt-1">Resolve and process maintenance requests reported by tenants in real-time.</p>
                </div>

                {maintenanceRequests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {maintenanceRequests.map(req => (
                      <div key={req.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="font-mono text-[10px] text-slate-400 font-bold">{req.date}</span>
                            <span className={`font-mono text-[10px] uppercase font-bold px-2.5 py-0.5 rounded ${
                              req.status === "PENDING"
                                ? "bg-amber-100 text-amber-800"
                                : req.status === "PROCESSING"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}>
                              {req.status}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-sans font-bold text-slate-900 text-sm">{req.title}</h4>
                            <p className="font-sans text-xs text-slate-500 mt-1 leading-normal">{req.description}</p>
                          </div>

                          <div className="flex gap-4 font-mono text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
                            <span>Room: {typeof req.room === "object" && req.room !== null ? (req.room as any).room_number : req.room}</span>
                            <span>Property: {req.propertyName}</span>
                          </div>
                        </div>

                        {/* Direct action panel link toggles */}
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
                              onClick={() => { setResolvingRequest(req); setShowResolveModal(true); }}
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
                    <p className="font-sans text-xs text-slate-500 mt-1">There are no outstanding repair requests currently registered.</p>
                  </div>
                )}
              </div>
            )}

            {ownerTab === "survey" && (
              <OwnerSurveyView properties={properties} token={token} />
            )}

            {ownerTab === "finance" && (
              <FinanceView properties={properties} token={token} userId={currentUser?.id} financeSummary={financeSummary} onRefresh={fetchAllData} />
            )}

            {ownerTab === "profile" && (
              <div className="space-y-6 animate-fade-in font-sans">
                {/* Admin configuration summary */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs max-w-xl mx-auto space-y-6 text-slate-705">
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center font-display text-2xl font-bold text-primary shrink-0 border-2 border-primary/20">
                      {currentUser?.name.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2) || "U"}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-slate-900">{ownerProfile.name}</h3>
                      <p className="text-xs text-slate-450">{currentUser?.email || ""}</p>
                      <span className="inline-block mt-2 font-mono text-[9px] uppercase font-bold px-2 py-0.5 bg-primary-container text-white rounded">
                        {currentUser?.role === "admin" ? "DELEGATED ADMIN" : "ADMIN ACCESS VALID"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-4 text-xs">
                    <h4 className="font-mono font-bold uppercase tracking-widest text-[9px] text-slate-400">ADMIN CONTROL DETAILS</h4>

                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold uppercase">Properties Managed:</span>
                        <span className="text-slate-800 font-bold">{properties.length} Active Complex</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold uppercase">Total Room Index:</span>
                        <span className="text-slate-800 font-bold">{properties.reduce((a,b)=>a+b.roomCount, 0)} Units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold uppercase">System State:</span>
                        <span className="text-emerald-600 font-bold">Online & Synchronized</span>
                      </div>
                    </div>
                  </div>

                  {/* Delegate Admin Access — only the primary owner can add/remove admins */}
                  {currentUser?.role === "owner" && (
                    <OwnerAdminManager
                      token={token}
                      properties={properties}
                      ownerId={currentUser.id}
                      onNotify={triggerNotification}
                    />
                  )}

                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <button
                      onClick={() => { setManualRole("tenant"); triggerNotification("Switched to Tenant view"); }}
                      className="w-full py-3.5 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      Switch to Tenant Profile
                    </button>
                    {currentUser?.role === "owner" && (
                      <button
                        onClick={handleResetDemoAndSync}
                        className="w-full py-3.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-900 border border-orange-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors uppercase"
                      >
                        <RotateCcw className="w-4 h-4" /> Reset Demo Seed Database
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )) : null}
      </main>

      {/* Persistent Bottom Tab Board Navigation */}
      {!onboardingStep && (
      <nav className="fixed bottom-0 w-full flex justify-around items-center bg-white border-t border-slate-200 px-2 pb-6 pt-2 z-40 shadow-md">
        
        {/* Tab 1: Home */}
        <button
          onClick={() => {
            if (role === "tenant") setTenantTab("home");
            else setOwnerTab("home");
          }}
          className={`flex flex-col items-center justify-center rounded-xl px-4 py-1.5 transition-all text-xs outline-hidden cursor-pointer ${
            role === "tenant"
              ? tenantTab === "home"
                ? "bg-primary/5 text-primary scale-98"
                : "text-slate-500 hover:text-slate-900"
              : ownerTab === "home"
              ? "bg-primary/5 text-primary scale-98"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="font-sans font-medium mt-1">Dashboard</span>
        </button>

        {/* Tab 2: Billing / Properties portal */}
        <button
          onClick={() => {
            if (role === "tenant") setTenantTab("billing");
            else setOwnerTab("billing");
          }}
          className={`flex flex-col items-center justify-center rounded-xl px-4 py-1.5 transition-all text-xs outline-hidden cursor-pointer ${
            role === "tenant"
              ? tenantTab === "billing"
                ? "bg-primary/5 text-primary scale-98"
                : "text-slate-500 hover:text-slate-900"
              : ownerTab === "billing"
              ? "bg-primary/5 text-primary scale-98"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="font-sans font-medium mt-1">
            {role === "tenant" ? "Billing" : "Properties"}
          </span>
        </button>

        {/* Tab 3: Maintenance support queue */}
        <button
          onClick={() => {
            if (role === "tenant") setTenantTab("support");
            else setOwnerTab("support");
          }}
          className={`flex flex-col items-center justify-center rounded-xl px-4 py-1.5 transition-all text-xs outline-hidden cursor-pointer ${
            role === "tenant"
              ? tenantTab === "support"
                ? "bg-primary/5 text-primary scale-98"
                : "text-slate-500 hover:text-slate-900"
              : ownerTab === "support"
              ? "bg-primary/5 text-primary scale-98"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Wrench className="w-5 h-5" />
          <span className="font-sans font-medium mt-1">Cabinet</span>
        </button>

        {/* Tab 4: Survey feedback (owner only) */}
        {role === "owner" && (
          <button
            onClick={() => setOwnerTab("survey")}
            className={`flex flex-col items-center justify-center rounded-xl px-4 py-1.5 transition-all text-xs outline-hidden cursor-pointer ${
              ownerTab === "survey"
                ? "bg-primary/5 text-primary scale-98"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="font-sans font-medium mt-1">Survey</span>
          </button>
        )}

        {/* Tab 5: Finance management (owner only) */}
        {role === "owner" && (
          <button
            onClick={() => setOwnerTab("finance")}
            className={`flex flex-col items-center justify-center rounded-xl px-4 py-1.5 transition-all text-xs outline-hidden cursor-pointer ${
              ownerTab === "finance"
                ? "bg-primary/5 text-primary scale-98"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span className="font-sans font-medium mt-1">Finance</span>
          </button>
        )}

        {/* Tab 6: Tenant/Owner profile details */}
        <button
          onClick={() => {
            if (role === "tenant") setTenantTab("profile");
            else setOwnerTab("profile");
          }}
          className={`flex flex-col items-center justify-center rounded-xl px-4 py-1.5 transition-all text-xs outline-hidden cursor-pointer ${
            role === "tenant"
              ? tenantTab === "profile"
                ? "bg-primary/5 text-primary scale-98"
                : "text-slate-500 hover:text-slate-900"
              : ownerTab === "profile"
              ? "bg-primary/5 text-primary scale-98"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <User className="w-5 h-5" />
          <span className="font-sans font-medium mt-1">Profile</span>
        </button>
      </nav>
      )}

      {/* Tenant Maintenance input Form Dialogue Modal */}
      {showMaintModal && (
        <MaintenanceFormModal
          onClose={() => setShowMaintModal(false)}
          onSubmit={handleCreateMaintenance}
        />
      )}

      {/* Owner Resolve Maintenance Modal */}
      {showResolveModal && resolvingRequest && (
        <ResolveMaintenanceModal
          onClose={() => { setShowResolveModal(false); setResolvingRequest(null); }}
          onSubmit={(actualCost) => {
            handleResolveMaintenance(resolvingRequest.id, "COMPLETED", actualCost);
            setShowResolveModal(false);
            setResolvingRequest(null);
          }}
          title={resolvingRequest.title}
        />
      )}
    </div>
  );
}
