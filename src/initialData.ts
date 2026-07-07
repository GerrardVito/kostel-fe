import { Property, Bill, Announcement, MaintenanceRequest, TenantProfile, OwnerProfile, ActivityLog } from "./types";

export const initialProperties: Property[] = [
  {
    id: "prop-1",
    name: "Skyline Heights",
    address: "122 Central Business Dist, Jakarta",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDR9mXWQUEcyKy55tpRZPMGmEDWHyxZNSGai3y__ERmE6N8Y00ODOk15ZCsib1QSPq40rHbYoP4N_TsZCIi_2weAvOqWHG2nD_wu4o2F9R0ByGZfYcX6GJKwIFZxl-CpeC2NnebO1mfcaW9culejbw5B0iuWL6oW8lpcstHgY8sz10sk5SgJnLmu15jDpKPwtzGeGslLeWdRwlWjCgFM_wKqC33VsLrVywXdgPGq94CTqWdKwyulnnPQIsPSQhMWuifjbOH7RkX_M0",
    roomCount: 48,
    occupancy: 98
  },
  {
    id: "prop-2",
    name: "Emerald Suites",
    address: "45 Green Valley Road, BSD",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAXKeyTIhIk3E_ZZeXO0-oLnlufBkaOEDUuo_5cHbqLEu3vEgAzPjbdOplrVba2D-KiUfmbPK7DWWTs2kEC2HcM94AnVAiMKDzDHrGdjXJi376wVsjX8MNr_vt94wPe9nvxKjUSZOG5OOqOYaMOmGg4Sctc_4MbsZYsrz4RcCtUyUazimQrVHdZ-RV9e5TTVEsh77k_hlIvO4uUuv2JdDyY2EG8RFB_gx6l3y9saTMlMituUzQ32GUkFyo_niPgvziUdPLx5kmKKR8",
    roomCount: 32,
    occupancy: 85
  },
  {
    id: "prop-3",
    name: "The Landmark",
    address: "Jl. Sudirman No. 12, South Jakarta",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA_yaD-VzxY0uD0AlGKsuV5nKSXyYGdlDtNXq6e-c6lY6w7XtKiLfFmbK3WmGzvKu_rWNBcPeRmRN0NNHsH_33YmY-ezuYpO8a4DV1PUKXcCZFFBoPm0HaCm3sxOHJkmQVGIUthSsfI3oNJOo7BVr7BCMNyeB10uk62--mxCayAZmszsmViGz4rVq2bNScKJjxVyurpAaAk4L8kmFrJ4Wc73MDaMdHQy4FM0L3SFFWuDwMvXg1l1_RpJzfaR-J9yITnvEph1C_LoiM",
    roomCount: 62,
    occupancy: 100
  }
];

export const initialBills: Bill[] = [
  {
    id: "bill-1",
    type: "Monthly Rent",
    period: "October 2023",
    amount: 2100.00,
    dueDate: "2023-10-01",
    status: "UNPAID"
  },
  {
    id: "bill-2",
    type: "Electricity Bill",
    period: "September Usage",
    amount: 350.00,
    dueDate: "2023-10-01",
    status: "UNPAID"
  },
  {
    id: "bill-3",
    type: "Rent - Sept 2023",
    period: "September 2023",
    amount: 2100.00,
    dueDate: "2023-09-01",
    status: "PAID",
    paidDate: "2023-08-30"
  },
  {
    id: "bill-4",
    type: "Internet Fee",
    period: "September 2023",
    amount: 60.00,
    dueDate: "2023-09-15",
    status: "OVERDUE"
  },
  {
    id: "bill-5",
    type: "Maintenance Fee",
    period: "September 2023",
    amount: 120.00,
    dueDate: "2023-09-20",
    status: "PENDING"
  }
];

export const initialAnnouncements: Announcement[] = [
  {
    id: "ann-1",
    title: "Water Supply Maintenance",
    content: "Scheduled maintenance for the central water system will occur this Sunday from 2 PM to 4 PM. Please store sufficient water for your needs.",
    date: "2 hours ago",
    category: "maintenance",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD5p2wBqaDpQYVnmeCuqYq977Ji0lYYEvQJXmfbhKWeNy5vV1Xc7bxtHi04TnV0nloR3ZVPdpxRrIDrG55Aac5yN8-Ohup7hXgpQNevY4dFMu8IPOzQ6qm7WYxVDWCI2L3OhNg-ews8KhEfl4VSUBpDQomT--dtG8mQWwOycLJMEfGS4HVNiGreL7SJvXH0KcwUBQMlyXog6t1od8F9b4HH_vr4jJVfj3bP7B6OxBoungxdTrosiZRdd6aC9zV9IeWxBtCyg-p0qGw"
  },
  {
    id: "ann-2",
    title: "New Package Delivery System",
    content: "The smart lockers in the lobby are now active. Check your email or SMS notification for your unique access PIN when a parcel arrives.",
    date: "Yesterday",
    category: "general",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBrf8eO3XT7JYDf7vEtll86gHo1MV5NiBkSy2pMh2m53H5qVgpeFU7gWEEts5g-dSerx8KO34gSads36TaUlENzo4xqO36TdweXtoBjt-TQhJ5NAFrvsZITS5Jslf3LszwK9v8vHX6tyWqCRwvKbsj55ZmxllJYHGqJZbRdhHrA-Niw5aSia1V1K5meCUK5_lGaDwT4R-Ba0z565kryCZwfWvl9oeleTq2MWF-KDP0SRpSe5K9SU-qnbplx0ut7AbC0TB5ruAri3tI"
  }
];

export const initialMaintenanceRequests: MaintenanceRequest[] = [
  {
    id: "maint-1",
    title: "Room A-204: Water Leakage",
    description: "Water drip detected around the bathroom ceiling joints. Moisture spreading fast.",
    status: "PENDING",
    date: "2 hours ago",
    room: "A-204",
    propertyName: "Skyline Heights",
    urgent: true,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUh2nRysCaCsZuKP89GIEsyGOZ0_kWM2YT9QwabSHLkG8IdCj58fzcBOpzLaAK-2gV6LM7AmTGXk5J6oFbKkjmiMdCM1QsisuupTjh3ZEjgMileeZubMpj7gHjJg1J0SIFW0o0ZwK12DjDCwOW5ORj29tzQpAGH2lvj6dy0RvxbmKpRYj7I_pRq87Nb7Zq_GOOWwA1yVA9WBmsaM7IWZzG3zCisivVjUbl4oVYMKVM2QbQk7k0YJYGEH8E3LyqchGF9NxgkLG85es"
  }
];

export const initialTenantProfile: TenantProfile = {
  name: "",
  avatar: "",
  roomNumber: "",
  propertyName: "",
  tower: "",
  floor: "",
  leaseStatus: "NO ACTIVE LEASE",
  outstandingBalance: 0
};

export const initialOwnerProfile: OwnerProfile = {
  name: "Jeffrey Ward",
  avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCCn9j3lIYnokhc6mFLg3FK2xmrxQStkqYPgyOBfyINIGk8hkjPdNRlJSDGuUzjG-2mFZTaegG7BpndQP_AAztOoPZHHaXw2Pyvtf_DySK2NgElOQ2C3AmhGTlyg-uOEJRMDVgDIFnpzah_lmoexoWZtRKVxgUZ6hO9Mc5oP6iht60SO6m1HygaIOJepM54iLx25sdMmuxTs2V06ZI9qhgxn-VyDr4TMsNt-Zl1cYaMs3jbWrYiLviL8ufnltCzayKkRCVPJNOVUx0",
  role: "Lead Administrator"
};

export const initialActivityLogs: ActivityLog[] = [
  {
    id: "log-1",
    tenantName: "John Doe",
    room: "A-101",
    action: "Checked in / Joined",
    date: "Oct 12, 2023",
    status: "Active"
  },
  {
    id: "log-2",
    tenantName: "Sarah Adams",
    room: "C-305",
    action: "Missed payment reminder issued",
    date: "Oct 10, 2023",
    status: "Unpaid"
  },
  {
    id: "log-3",
    tenantName: "Rian Kusuma",
    room: "B-211",
    action: "Paid September Utilities Bill",
    date: "Oct 08, 2023",
    status: "Paid",
    amount: 145.00
  },
  {
    id: "log-4",
    tenantName: "Alex Johnston",
    room: "A-402",
    action: "Lease Renewed Successfully",
    date: "Oct 05, 2023",
    status: "Active"
  }
];
