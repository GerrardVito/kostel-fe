export interface Property {
  id: string;
  name: string;
  address: string;
  image: string;
  roomCount: number;
  occupancy: number;
  inviteCode?: string;
  category?: 'owned' | 'delegated';
}

export interface Bill {
  id: string;
  type: string; // e.g. "Monthly Rent", "Electricity Bill", "Internet Fee", "Maintenance Fee"
  period: string; // e.g. "October 2023"
  amount: number;
  dueDate: string;
  status: "UNPAID" | "PAID" | "OVERDUE" | "PENDING" | "LATE" | "FAILED" | "PARTIAL";
  paidDate?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  category: "maintenance" | "general" | "social";
  image: string;
}

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED";
  date: string; // e.g. "2023-10-01" or relative like "2 hours ago"
  room: string;
  propertyName: string;
  urgent: boolean;
  image?: string;
  images?: string[];
}

export interface TenantProfile {
  name: string;
  avatar: string;
  roomNumber: string;
  propertyName: string;
  tower: string;
  floor: string;
  leaseStatus: string;
  outstandingBalance: number;
}

export interface OwnerProfile {
  name: string;
  avatar: string;
  role: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: "tenant" | "owner" | "admin";
  hasProperty?: boolean;
  hasPendingApplication?: boolean;
  hasApprovedApplication?: boolean;
  applicationId?: number | null;
  profile?: {
    profile_image?: string;
    phone?: string;
  };
}

export interface AdminMember {
  id: number;
  name: string;
  email: string;
  phone?: string;
  profile_image?: string;
  status: "active" | "invited" | "revoked";
  scope: "all" | "properties";
  property_ids?: number[];
  created_at: string;
  added_by: {
    id: number;
    name: string;
  };
}

export interface TenantApplication {
  application_id: number;
  user_id: number;
  property_id: number;
  room_type_id?: number | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  occupation?: string | null;
  reason_for_staying?: string | null;
  phone?: string | null;
  notes?: string | null;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  property?: {
    id: string;
    property_id: number;
    property_name: string;
    address: string;
    image_urls: string[];
  };
  room_type?: {
    type_name: string;
    monthly_price: number;
  } | null;
  user?: {
    user_id: number;
    full_name: string;
    email: string;
    phone?: string;
    profile_image?: string;
    identity_image?: string;
  };
}

export interface RoomChecklistItem {
  item_id: number;
  room_type_id: number;
  item_name: string;
  category: string;
  is_required: boolean;
  sort_order: number;
  response?: ChecklistResponse | null;
}

export interface ChecklistResponse {
  response_id: number;
  session_id: number;
  item_id: number;
  is_working: boolean | null;
  notes: string | null;
  image_url: string | null;
  checked_at: string;
}

export interface ChecklistSession {
  session_id: number;
  assignment_id: number;
  type: "checkin" | "checkout";
  status: "pending" | "completed";
  created_at: string;
  completed_at: string | null;
  items: RoomChecklistItem[];
  assignment: {
    assignment_id: number;
    room: {
      room_id: number;
      room_number: string;
      room_type: {
        type_name: string;
      };
    };
  };
}

export interface InspectionFinding {
  finding_id: number;
  inspection_item_id: number | null;
  item_name: string;
  status: string;
  notes: string | null;
  image_url: string | null;
  priority: string | null;
}

export interface ActivityLog {
  id: string;
  tenantName: string;
  room: string;
  action: string;
  date: string;
  amount?: number;
  status: "Active" | "Unpaid" | "Pending" | "Paid";
}

// New types for Tenant system
export interface Tenant {
  tenant_id: number;
  user_id: number;
  identity_image?: string | null;
  signature_image?: string | null;
  nik?: string | null;
  passport_number?: string | null;
  date_of_birth?: string | null;
  purpose_of_stay?: string | null;
  occupation?: string | null;
  current_assignment_id?: number | null;
  current_property_id?: number | null;
  current_room_id?: number | null;
  contract_status?: string | null;
  contract_start?: string | null;
  contract_end?: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    user_id: number;
    full_name: string;
    email: string;
    phone?: string;
    profile_image?: string;
  };
  current_assignment?: TenantRoomAssignment | null;
  current_property?: {
    property_id: number;
    property_name: string;
  } | null;
  current_room?: {
    room_id: number;
    room_number: string;
  } | null;
  payment_confirmations?: PaymentConfirmation[];
}

export interface PaymentConfirmation {
  confirmation_id: number;
  tenant_id: number;
  bill_id: number;
  amount_claimed: number;
  payment_proof?: string | null;
  notes?: string | null;
  status: "pending" | "confirmed" | "partial" | "rejected";
  confirmed_amount?: number | null;
  confirmed_by?: number | null;
  confirmed_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  bill?: Bill;
  tenant?: Tenant;
  confirmer?: {
    user_id: number;
    full_name: string;
  } | null;
}

export interface Notification {
  notification_id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  related_id?: number | null;
  related_type?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface TenantRoomAssignment {
  assignment_id: number;
  tenant_user_id: number;
  room_id: number;
  checkin_date: string;
  checkout_date?: string | null;
  contract_start?: string | null;
  contract_end?: string | null;
  monthly_price_snapshot?: number | null;
  deposit_snapshot?: number | null;
  status: string;
  created_at: string;
}
