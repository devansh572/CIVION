"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { findAuthorityAccount, verifyAuthorityCredentials } from "./authority-credentials";
import { findWorkerAccount, verifyWorkerCredentials } from "./worker-credentials";
import { runAiDeduplicationPipeline } from "./ai-dedup-agent";
import { evaluateCivicPriority, PriorityBreakdown } from "./ai-priority-engine";

export { evaluateCivicPriority };
export type { PriorityBreakdown };

export type Role = "resident" | "authority" | "field_worker";

export type IssueStatus = 
  | "Submitted"
  | "Triaged"
  | "Crew Dispatched"
  | "En Route"
  | "Work in Progress"
  | "Resolved & Verified"
  | "Resolved (Pending Verification)";

export type Severity = "critical" | "high" | "medium" | "low";

export interface PhotoWatermark {
  lat: number;
  lng: number;
  timestamp: string;
  workerName: string;
  department?: string;
  accuracyMeters?: number;
}

export interface CitizenNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  issueId?: string;
  issueCode?: string;
  type: "status_update" | "cluster_merge" | "karma_awarded" | "verification_requested";
  read?: boolean;
}

export interface FieldNote {
  id: string;
  author: string;
  role: string;
  text: string;
  timestamp: string;
}

export interface CivicComment {
  id: string;
  author: string;
  role: string;
  avatar?: string;
  text: string;
  timestamp: string;
}

export interface CitizenReportRecord {
  id: string;
  residentName: string;
  residentContact?: string;
  rawText: string;
  reportedAt: string;
  coordinates?: [number, number];
  distanceMeters?: number;
  similarityScore?: number;
  photoUrl?: string;
}

export interface CivicIssue {
  id: string;
  code: string;
  title: string;
  description: string;
  category: "Pothole" | "Water leakage" | "Streetlight" | "Waste" | "Drainage" | "Road safety" | "Accessibility";
  location: string;
  coordinates: [number, number]; // [lat, lng]
  ward: string;
  status: IssueStatus;
  severity: Severity;
  priorityScore: number;
  priorityBreakdown?: PriorityBreakdown;
  reportedBy: string;
  reportedAt: string;
  upvotes: number;
  hasUpvoted?: boolean;
  isMasterIssue?: boolean;
  reportCount?: number;
  combinedReports?: CitizenReportRecord[];
  assignedWorker?: string;
  assignedWorkerRole?: string;
  slaDeadlineHours: number;
  slaDeadlineTime?: string;
  isOnSite?: boolean;
  onSiteTimestamp?: string;
  beforePhoto?: string;
  afterPhoto?: string;
  watermarkData?: PhotoWatermark;
  fieldNotes: FieldNote[];
  comments: CivicComment[];
  backupRequested?: boolean;
  backupReason?: string;
  residentVerification?: {
    verified: boolean;
    feedback?: string;
    verifiedAt?: string;
    isActuallyResolved?: boolean;
    qualityOfWork?: number; // 1 to 5
    starRating?: number; // 1 to 5 stars
  };
}

export interface CivionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  avatar: string;
  district: string;
  civicKarma?: number;
  trustTier?: "Bronze Citizen" | "Silver Advocate" | "Gold Inspector" | "Platinum Sentinel";
  allowedCategories?: ("Pothole" | "Water leakage" | "Streetlight" | "Waste" | "Drainage" | "Road safety" | "Accessibility")[];
  departmentCode?: "ROADS_SAFETY" | "WATER_DRAINAGE" | "ELECTRICAL_STREETLIGHT" | "ALL";
}

export const DEMO_USERS: Record<Role, CivionUser> = {
  resident: {
    id: "usr-res-1",
    name: "Ramesh Kumar",
    email: "ramesh.citizen@civion.demo",
    role: "resident",
    title: "Verified Resident · Ward 112",
    avatar: "RK",
    district: "North District · Indiranagar",
    civicKarma: 240,
    trustTier: "Gold Inspector",
  },
  authority: {
    id: "usr-auth-1",
    name: "Suresh Gowda",
    email: "suresh.bbmp@civion.demo",
    role: "authority",
    title: "Zonal Operations Superintendent",
    avatar: "SG",
    district: "North District Command Center",
  },
  field_worker: {
    id: "usr-wrk-1",
    name: "Raju K",
    email: "raju.worker@civion.demo",
    role: "field_worker",
    title: "Senior Rapid Response Inspector",
    avatar: "RK",
    district: "North Field Unit 4",
  },
};

export const INITIAL_ISSUES: CivicIssue[] = [
  {
    id: "iss-1048",
    code: "CIV-1048",
    title: "Deep hazardous pothole near Indiranagar Metro",
    description: "Large crater under metro pillar 42 right on 100 Feet Road causing vehicle rim damage and severe traffic slowdown.",
    category: "Pothole",
    location: "100 Feet Road, Indiranagar Metro",
    coordinates: [12.9784, 77.6408],
    ward: "Ward 112 - Indiranagar",
    status: "Submitted",
    severity: "critical",
    priorityScore: 92,
    reportedBy: "Anita Das & 3 others",
    reportedAt: "Today, 08:30 AM",
    upvotes: 14,
    hasUpvoted: false,
    isMasterIssue: true,
    reportCount: 4,
    combinedReports: [
      {
        id: "rep-1048-1",
        residentName: "Anita Das",
        residentContact: "+91 98765 43101",
        rawText: "Large crater under metro pillar 42 right on 100 Feet Road causing vehicle rim damage and severe traffic slowdown.",
        reportedAt: "Today, 08:30 AM",
        coordinates: [12.9784, 77.6408],
        distanceMeters: 0,
        similarityScore: 1.0,
        photoUrl: "/images/issues/pothole.jpg"
      },
      {
        id: "rep-1048-2",
        residentName: "Aarav Sharma",
        residentContact: "+91 98765 43210",
        rawText: "Deep pothole right in front of the gate of Green Park Society, two-wheelers are skidding.",
        reportedAt: "Today, 08:45 AM",
        coordinates: [12.9785, 77.6409],
        distanceMeters: 14,
        similarityScore: 0.94
      },
      {
        id: "rep-1048-3",
        residentName: "Priya Verma",
        residentContact: "+91 98765 43211",
        rawText: "Huge crater on the road outside Green park society main entrance, dangerous for bikes.",
        reportedAt: "Today, 09:05 AM",
        coordinates: [12.9783, 77.6407],
        distanceMeters: 18,
        similarityScore: 0.91
      },
      {
        id: "rep-1048-4",
        residentName: "Praveen M",
        residentContact: "+91 98765 43219",
        rawText: "Almost crashed my scooter here last night during the rain. It is dangerously deep!",
        reportedAt: "Today, 09:10 AM",
        coordinates: [12.9782, 77.6406],
        distanceMeters: 26,
        similarityScore: 0.88
      }
    ],
    assignedWorker: "Deeshu Kumar",
    assignedWorkerRole: "Senior Road Operations Specialist",
    slaDeadlineHours: 24,
    slaDeadlineTime: "Within 18 hours",
    beforePhoto: "/images/issues/pothole.jpg",
    fieldNotes: [
      {
        id: "fn-1",
        author: "Civion AI Engine",
        role: "Automated Triage",
        text: "Priority 92 assigned based on high traffic density and hazard to two-wheelers.",
        timestamp: "08:32 AM",
      }
    ],
    comments: [
      {
        id: "c-101",
        author: "Praveen M",
        role: "Resident",
        avatar: "PM",
        text: "Almost crashed my scooter here last night during the rain. It is dangerously deep!",
        timestamp: "09:10 AM"
      },
      {
        id: "c-102",
        author: "Civion Dispatch Bot",
        role: "System",
        avatar: "CB",
        text: "Signal escalated to North Zone Road Maintenance Division due to 10+ affected citizen votes.",
        timestamp: "09:45 AM"
      }
    ]
  },
  {
    id: "iss-1038",
    code: "CIV-1038",
    title: "Open stormwater drain cover missing",
    description: "Concrete slab collapsed into stormwater canal, opening a 4-foot deep hazard on the pedestrian walkway near the bus shelter.",
    category: "Drainage",
    location: "8th Cross, Jeevan Bima Nagar",
    coordinates: [12.9654, 77.6582],
    ward: "Ward 114 - Jeevan Bima Nagar",
    status: "Submitted",
    severity: "critical",
    priorityScore: 88,
    reportedBy: "Rohan Verma & 1 other",
    reportedAt: "Yesterday, 06:15 PM",
    upvotes: 9,
    hasUpvoted: false,
    isMasterIssue: true,
    reportCount: 2,
    combinedReports: [
      {
        id: "rep-1038-1",
        residentName: "Rohan Verma",
        residentContact: "+91 98765 43102",
        rawText: "Concrete slab collapsed into stormwater canal, opening a 4-foot deep hazard on the pedestrian walkway near the bus shelter.",
        reportedAt: "Yesterday, 06:15 PM",
        coordinates: [12.9654, 77.6582],
        distanceMeters: 0,
        similarityScore: 1.0,
        photoUrl: "/images/issues/drain-cover.jpg"
      },
      {
        id: "rep-1038-2",
        residentName: "Dr. K. Swaminathan",
        residentContact: "+91 98765 43222",
        rawText: "Storm drain blocked and overflowed onto walkway. Kids walk past here every day after school. Placed temporary wooden branches around it.",
        reportedAt: "Yesterday, 07:00 PM",
        coordinates: [12.9655, 77.6583],
        distanceMeters: 15,
        similarityScore: 0.89
      }
    ],
    assignedWorker: "Like Please Worker",
    assignedWorkerRole: "Municipal Water & Drainage Inspector",
    slaDeadlineHours: 12,
    slaDeadlineTime: "Urgent · 4 hours left",
    beforePhoto: "/images/issues/drain-cover.jpg",
    fieldNotes: [],
    comments: [
      {
        id: "c-103",
        author: "Dr. K. Swaminathan",
        role: "Resident",
        avatar: "KS",
        text: "Kids walk past here every day after school. Placed temporary wooden branches around it for visibility.",
        timestamp: "Yesterday, 07:00 PM"
      }
    ]
  },
  {
    id: "iss-1047",
    code: "CIV-1047",
    title: "Streetlight out on residential lane with exposed wire",
    description: "Entire residential stretch pitch dark. Heavy storm loosened bracket; live wiring visible near tree branches.",
    category: "Streetlight",
    location: "12th Main, Indiranagar",
    coordinates: [12.9732, 77.6391],
    ward: "Ward 112 - Indiranagar",
    status: "Work in Progress",
    severity: "high",
    priorityScore: 74,
    reportedBy: "Karthik Iyer",
    reportedAt: "Sep 6, 2026",
    upvotes: 6,
    hasUpvoted: true,
    isMasterIssue: true,
    reportCount: 1,
    combinedReports: [
      {
        id: "rep-1047-1",
        residentName: "Karthik Iyer",
        residentContact: "+91 98765 43103",
        rawText: "Entire residential stretch pitch dark. Heavy storm loosened bracket; live wiring visible near tree branches.",
        reportedAt: "Sep 6, 2026",
        coordinates: [12.9732, 77.6391],
        distanceMeters: 0,
        similarityScore: 1.0,
        photoUrl: "/images/issues/streetlight-wire.jpg"
      }
    ],
    assignedWorker: "Anish Sharma",
    assignedWorkerRole: "Field Electrical Specialist",
    slaDeadlineHours: 36,
    slaDeadlineTime: "14 hours remaining",
    isOnSite: true,
    onSiteTimestamp: "Today, 10:45 AM",
    beforePhoto: "/images/issues/streetlight-wire.jpg",
    fieldNotes: [
      {
        id: "fn-2",
        author: "Anish Sharma",
        role: "Field Worker",
        text: "Arrived on-site. Power isolated at main feeder box. Replacing sodium ballast with high-efficiency 90W LED fixture.",
        timestamp: "10:52 AM",
      }
    ],
    comments: [
      {
        id: "c-104",
        author: "Karthik Iyer",
        role: "Resident",
        avatar: "KI",
        text: "Saw the BESCOM/BBMP bucket truck arrive just now. Thank you for the quick turnaround!",
        timestamp: "10:55 AM"
      }
    ]
  },
  {
    id: "iss-1041",
    code: "CIV-1041",
    title: "Overflowing community waste bin scattering on road",
    description: "Commercial food disposal mixed with plastics overflowing onto carriage way. Stray animals causing hazard for commuters.",
    category: "Waste",
    location: "3rd Cross, Domlur Layout",
    coordinates: [12.9610, 77.6385],
    ward: "Ward 113 - Domlur",
    status: "Crew Dispatched",
    severity: "medium",
    priorityScore: 65,
    reportedBy: "Priya Sharma",
    reportedAt: "Sep 6, 2026",
    upvotes: 11,
    hasUpvoted: false,
    assignedWorker: "Raju K",
    assignedWorkerRole: "Senior Rapid Response Inspector",
    slaDeadlineHours: 24,
    slaDeadlineTime: "8 hours remaining",
    beforePhoto: "/images/issues/overflowing-waste.jpg",
    fieldNotes: [
      {
        id: "fn-3",
        author: "Suresh Gowda",
        role: "Authority",
        text: "Routed to Raju K. Mechanical compactor truck scheduled for 13:00 pickup.",
        timestamp: "09:15 AM",
      }
    ],
    comments: [
      {
        id: "c-106",
        author: "Priya Sharma",
        role: "Resident",
        avatar: "PS",
        text: "Bin cleared by morning crew! Much cleaner now, thanks.",
        timestamp: "Sep 7, 2026"
      }
    ]
  },
  {
    id: "iss-1031",
    code: "CIV-1031",
    title: "High pressure potable water leakage at park entrance",
    description: "Underground pipeline ruptured during fiber cable trenching. Clean water bubbling up flooding park entrance gate.",
    category: "Water leakage",
    location: "CMH Road Park Gate, Indiranagar",
    coordinates: [12.9799, 77.6433],
    ward: "Ward 112 - Indiranagar",
    status: "Resolved (Pending Verification)",
    severity: "high",
    priorityScore: 81,
    reportedBy: "Vikram Rao",
    reportedAt: "Sep 5, 2026",
    upvotes: 18,
    hasUpvoted: true,
    assignedWorker: "Raju K",
    assignedWorkerRole: "Senior Rapid Response Inspector",
    slaDeadlineHours: 24,
    slaDeadlineTime: "Completed within SLA",
    isOnSite: true,
    beforePhoto: "/images/issues/water-leakage.jpg",
    afterPhoto: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800",
    fieldNotes: [
      {
        id: "fn-4",
        author: "Raju K",
        role: "Field Worker",
        text: "Excavated pipe fracture. Fitted heavy-duty 4-inch ductile iron clamp sleeve and re-pressurized line. Flow stabilized.",
        timestamp: "Yesterday, 04:30 PM",
      }
    ],
    comments: [
      {
        id: "c-105",
        author: "Vikram Rao",
        role: "Resident",
        avatar: "VR",
        text: "Water flow has completely stopped leaking into the park. Inspecting the asphalt patch today.",
        timestamp: "Today, 07:30 AM"
      }
    ]
  },
  {
    id: "iss-1042",
    code: "CIV-1042",
    title: "Broken tactile sidewalk tile repaired",
    description: "Pedestrian wheelchair ramp edge was shattered, obstructing visually impaired and elderly residents.",
    category: "Accessibility",
    location: "5th Main, Jeevan Bima Nagar",
    coordinates: [12.9642, 77.6541],
    ward: "Ward 114 - Jeevan Bima Nagar",
    status: "Resolved & Verified",
    severity: "medium",
    priorityScore: 55,
    reportedBy: "Meera Nair",
    reportedAt: "Sep 3, 2026",
    upvotes: 8,
    hasUpvoted: false,
    assignedWorker: "Asha Kulkarni",
    assignedWorkerRole: "Field Worker",
    slaDeadlineHours: 48,
    slaDeadlineTime: "Closed",
    beforePhoto: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    afterPhoto: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800",
    residentVerification: {
      verified: true,
      feedback: "Checked the walkway this morning. The curb ramp is level and safe for my grandmother's wheelchair now. Thank you!",
      verifiedAt: "Sep 5, 2026 · 11:34 AM",
    },
    fieldNotes: [
      {
        id: "fn-5",
        author: "Asha Kulkarni",
        role: "Field Worker",
        text: "Replaced 6 tactile yellow warning pavers with rapid curing concrete base.",
        timestamp: "Sep 4, 2026",
      }
    ],
    comments: []
  },
  {
    id: "iss-1028",
    code: "CIV-1028",
    title: "Crosswalk paint faded at school zone intersection",
    description: "Pedestrian zebra stripes completely worn away before monsoon. School children crossing during peak morning traffic.",
    category: "Road safety",
    location: "12th Main Junction, Indiranagar",
    coordinates: [12.9711, 77.6415],
    ward: "Ward 112 - Indiranagar",
    status: "Resolved & Verified",
    severity: "medium",
    priorityScore: 51,
    reportedBy: "Anita Das",
    reportedAt: "Aug 27, 2026",
    upvotes: 12,
    hasUpvoted: false,
    assignedWorker: "Asha Kulkarni",
    assignedWorkerRole: "Field Worker",
    slaDeadlineHours: 72,
    slaDeadlineTime: "Closed",
    afterPhoto: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800",
    residentVerification: {
      verified: true,
      feedback: "The zebra crossing is clearly visible and retro-reflective at night.",
      verifiedAt: "Sep 4, 2026 · 09:12 AM",
    },
    fieldNotes: [
      {
        id: "fn-6",
        author: "Asha Kulkarni",
        role: "Field Worker",
        text: "High-grade thermoplastic retro-reflective paint applied along with school zone signage.",
        timestamp: "Aug 30, 2026",
      }
    ],
    comments: []
  },
  {
    id: "iss-1049",
    code: "CIV-1049",
    title: "Damaged crash barrier & missing speed bump near National Public School",
    description: "Vehicles speeding through school intersection after safety guardrail was bent during truck collision. Urgent installation required.",
    category: "Road safety",
    location: "13th Main School Cross, HAL 2nd Stage",
    coordinates: [12.9680, 77.6470],
    ward: "Ward 112 - Indiranagar",
    status: "Work in Progress",
    severity: "critical",
    priorityScore: 91,
    reportedBy: "Sandeep Rao & 5 parents",
    reportedAt: "Today, 07:45 AM",
    upvotes: 19,
    hasUpvoted: false,
    isMasterIssue: true,
    reportCount: 3,
    combinedReports: [],
    assignedWorker: "Deeshu Kumar",
    assignedWorkerRole: "Senior Road Operations Specialist",
    slaDeadlineHours: 24,
    slaDeadlineTime: "Within 14 hours",
    beforePhoto: "/images/issues/pothole.jpg",
    fieldNotes: [
      {
        id: "fn-1049-1",
        author: "Deeshu Kumar",
        role: "Field Worker",
        text: "Safety cones placed around barrier gap. Sourcing 3m galvanized guardrail beam from regional store.",
        timestamp: "09:30 AM"
      }
    ],
    comments: []
  },
  {
    id: "iss-1051",
    code: "CIV-1051",
    title: "High-pressure distribution main pipeline burst flooding 80ft road",
    description: "Main potable water conduit ruptured near junction. Potable water flooding carriageway and threatening basement parking of adjacent shops.",
    category: "Water leakage",
    location: "80 Feet Road Junction, Indiranagar",
    coordinates: [12.9750, 77.6440],
    ward: "Ward 112 - Indiranagar",
    status: "Work in Progress",
    severity: "critical",
    priorityScore: 95,
    reportedBy: "Kavita Reddy & 8 others",
    reportedAt: "Today, 06:30 AM",
    upvotes: 27,
    hasUpvoted: false,
    isMasterIssue: true,
    reportCount: 4,
    combinedReports: [],
    assignedWorker: "Like Please Worker",
    assignedWorkerRole: "Municipal Water & Drainage Inspector",
    slaDeadlineHours: 12,
    slaDeadlineTime: "Urgent · 3 hours left",
    beforePhoto: "/images/issues/water-leakage.jpg",
    fieldNotes: [
      {
        id: "fn-1051-1",
        author: "Like Please Worker",
        role: "Field Worker",
        text: "Sluice valve #4 isolated to stem incoming flood water. Dewatering pump deployed on site.",
        timestamp: "08:15 AM"
      }
    ],
    comments: []
  },
  {
    id: "iss-1053",
    code: "CIV-1053",
    title: "Flickering high-mast solar streetlight pole with broken junction box",
    description: "High-mast lighting fixture at busy traffic rotary shorting out repeatedly. Weather cover fell off during thunderstorm.",
    category: "Streetlight",
    location: "Double Road Signal Junction, Indiranagar",
    coordinates: [12.9695, 77.6350],
    ward: "Ward 113 - Domlur",
    status: "Crew Dispatched",
    severity: "high",
    priorityScore: 86,
    reportedBy: "Manish Joshi & 3 others",
    reportedAt: "Yesterday, 09:20 PM",
    upvotes: 11,
    hasUpvoted: false,
    isMasterIssue: true,
    reportCount: 2,
    combinedReports: [],
    assignedWorker: "Anish Sharma",
    assignedWorkerRole: "Field Electrical Specialist",
    slaDeadlineHours: 24,
    slaDeadlineTime: "Within 12 hours",
    beforePhoto: "/images/issues/streetlight-wire.jpg",
    fieldNotes: [
      {
        id: "fn-1053-1",
        author: "Anish Sharma",
        role: "Field Worker",
        text: "Scheduled cherry picker truck deployment for fixture inspection and waterproof junction replacement.",
        timestamp: "Today, 08:00 AM"
      }
    ],
    comments: []
  },
  {
    id: "iss-1054",
    code: "CIV-1054",
    title: "Row of 8 dark street lamps on arterial link road causing blind spot",
    description: "Entire 250-meter stretch dark for 3 consecutive nights. Two-wheeler skids and safety concerns for night commuters.",
    category: "Streetlight",
    location: "Link Road, 4th Block Near Petrol Bunk",
    coordinates: [12.9715, 77.6495],
    ward: "Ward 112 - Indiranagar",
    status: "Submitted",
    severity: "critical",
    priorityScore: 89,
    reportedBy: "Rohit Nair & 12 residents",
    reportedAt: "Today, 05:45 AM",
    upvotes: 16,
    hasUpvoted: false,
    isMasterIssue: true,
    reportCount: 3,
    combinedReports: [],
    assignedWorker: "Anish Sharma",
    assignedWorkerRole: "Field Electrical Specialist",
    slaDeadlineHours: 24,
    slaDeadlineTime: "Within 20 hours",
    beforePhoto: "/images/issues/streetlight-wire.jpg",
    fieldNotes: [],
    comments: []
  }
];

export const ROLE_PERMISSIONS: Record<Role, Role[]> = {
  resident: ["resident"],
  field_worker: ["field_worker"],
  authority: ["authority", "field_worker"], // Authority has supervisor access to both Authority & Field Worker!
};

export const ROLE_ACCESS_LABELS: Record<Role, string> = {
  resident: "Resident Only",
  field_worker: "Field Operations Only",
  authority: "Authority & Field Operations (Supervisor Access)",
};

interface CivionState {
  currentRole: Role;
  isAuthenticated: boolean;
  isGuest: boolean;
  currentUser: CivionUser | null;
  activeView: "role_selection" | "auth_modal" | "workspace";
  theme: "dark" | "light";
  issues: CivicIssue[];
  selectedIssueId: string | null;
  notificationMessage: string | null;

  // Actions
  setRole: (role: Role) => void;
  openAuthModal: (role?: Role) => void;
  closeAuthModal: () => void;
  login: (roleOrEmail?: Role | string, emailOrPassword?: string, password?: string) => boolean | void;
  register: (roleOrName: Role | string, nameOrEmail: string, email?: string) => void;
  logout: () => void;
  exploreAsGuest: () => void;
  clearGuest: () => void;
  switchRole: (role: Role) => boolean;
  toggleTheme: () => void;
  selectIssue: (id: string | null) => void;
  dismissNotification: () => void;

  // Domain Actions
  createSignal: (signal: {
    title: string;
    description: string;
    category: CivicIssue["category"];
    location: string;
    coordinates?: [number, number];
    isUrgent: boolean;
    photoUrl?: string;
  }) => CivicIssue;

  createWorkOrder: (order: {
    title: string;
    category: CivicIssue["category"];
    location: string;
    coordinates?: [number, number];
    ward: string;
    severity: Severity;
    assignedWorker: string;
    slaDeadlineHours: number;
    description: string;
  }) => CivicIssue;

  addComment: (issueId: string, text: string) => void;
  
  upvoteIssue: (id: string) => void;
  
  dispatchCrew: (id: string, workerName: string, targetSlaHours: number, note?: string) => void;
  
  workerSetEnRoute: (id: string) => void;
  workerMarkOnSite: (id: string) => void;
  workerAddNote: (id: string, text: string) => void;
  workerUploadEvidence: (id: string, photoUrl: string, note?: string) => void;
  workerRequestBackup: (id: string, reason: string) => void;
  workerCompleteJob: (id: string, notes?: string, afterPhotoUrl?: string) => void;
  workerCompleteJobWithWatermark: (id: string, notes: string, afterPhotoUrl: string, watermark: PhotoWatermark) => void;
  
  residentVerify: (
    id: string, 
    verified: boolean, 
    feedback?: string,
    extra?: {
      isActuallyResolved?: boolean;
      qualityOfWork?: number;
      starRating?: number;
    }
  ) => void;
  awardKarma: (points: number, reason: string) => void;

  citizenNotifications: CitizenNotification[];
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
}

export const useCivionStore = create<CivionState>()(
  persist(
    (set, get) => ({
      currentRole: "authority",
      isAuthenticated: false,
      isGuest: false,
      currentUser: null,
      activeView: "role_selection",
      theme: "dark",
      issues: INITIAL_ISSUES,
      selectedIssueId: null,
      notificationMessage: null,
      citizenNotifications: [
        {
          id: "notif-1",
          title: "Field Crew En Route",
          message: "Rapid Crew 4 has been dispatched and is en route to Indiranagar Metro (#CIV-1048).",
          timestamp: "10m ago",
          issueCode: "CIV-1048",
          type: "status_update",
          read: false
        },
        {
          id: "notif-2",
          title: "AI Duplication Alert Unified",
          message: "2 citizen signals near CMH Road were auto-deduplicated into 1 Master Ticket with escalated priority.",
          timestamp: "35m ago",
          issueCode: "CIV-1049",
          type: "cluster_merge",
          read: false
        },
        {
          id: "notif-3",
          title: "+50 Karma Awarded!",
          message: "Your accurate pothole report was validated and scheduled for rapid repair.",
          timestamp: "2h ago",
          type: "karma_awarded",
          read: true
        }
      ],

      markNotificationRead: (id) => {
        set((state) => ({
          citizenNotifications: state.citizenNotifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      clearAllNotifications: () => {
        set({ citizenNotifications: [] });
      },

      awardKarma: (points, reason) => {
        set((state) => {
          if (!state.currentUser) return {};
          const newKarma = (state.currentUser.civicKarma || 100) + points;
          let newTier = state.currentUser.trustTier || "Bronze Citizen";
          if (newKarma >= 300) newTier = "Platinum Sentinel";
          else if (newKarma >= 200) newTier = "Gold Inspector";
          else if (newKarma >= 100) newTier = "Silver Advocate";

          const notif: CitizenNotification = {
            id: `notif-${Date.now()}`,
            title: `+${points} Civic Karma!`,
            message: `${reason} Total Karma: ${newKarma} [${newTier}]`,
            timestamp: "Just now",
            type: "karma_awarded",
            read: false
          };

          return {
            currentUser: {
              ...state.currentUser,
              civicKarma: newKarma,
              trustTier: newTier
            },
            citizenNotifications: [notif, ...state.citizenNotifications],
            notificationMessage: `+${points} Civic Karma Earned: ${reason}`
          };
        });
      },

      setRole: (role) => {
        set({ currentRole: role });
      },

      openAuthModal: (role) => {
        const targetRole = role || get().currentRole;
        set({
          currentRole: targetRole,
          activeView: "auth_modal",
        });
      },

      closeAuthModal: () => {
        const { isGuest, isAuthenticated } = get();
        set({ activeView: (isAuthenticated || isGuest) ? "workspace" : "role_selection" });
      },

      exploreAsGuest: () => {
        set({
          isGuest: true,
          isAuthenticated: false,
          currentUser: null,
          currentRole: "resident",
          activeView: "workspace",
          notificationMessage: "Exploring Public City Promise Ledger in Transparency Mode",
        });
      },

      clearGuest: () => {
        set({ isGuest: false });
      },

      login: (roleOrEmail, maybeEmailOrPassword, maybePassword) => {
        let role: Role = "resident";
        let email = "";
        let password = "";

        if (roleOrEmail === "resident" || roleOrEmail === "authority" || roleOrEmail === "field_worker") {
          role = roleOrEmail as Role;
          email = maybeEmailOrPassword || "";
          password = maybePassword || "";
        } else if (typeof roleOrEmail === "string") {
          email = roleOrEmail;
          password = maybeEmailOrPassword || "";
        }

        const cleanEmail = email.trim();
        const authorityAccount = findAuthorityAccount(cleanEmail);

        // Authority Account Validation
        if (authorityAccount) {
          const check = verifyAuthorityCredentials(cleanEmail, password);
          if (!check.valid) {
            set({
              notificationMessage: check.error || "Access Denied: Incorrect password for authority account.",
            });
            return false;
          }

          const user: CivionUser = {
            id: `auth-${authorityAccount.email.replace(/[@.]/g, "-")}`,
            name: authorityAccount.name,
            email: authorityAccount.email,
            role: "authority",
            title: authorityAccount.title,
            avatar: authorityAccount.avatar,
            district: authorityAccount.department,
            allowedCategories: authorityAccount.allowedCategories,
            departmentCode: authorityAccount.departmentCode,
          };

          set({
            currentRole: "authority",
            currentUser: user,
            isAuthenticated: true,
            isGuest: false,
            activeView: "workspace",
            notificationMessage: `Authority Session Granted: ${user.name} (${authorityAccount.title})`,
          });
          return true;
        }

        // Field Worker Account Validation (deeshukumar975@gmail.com, likeplease8989@gmail.com, anishsharma3672@gmail.com)
        const workerAccount = findWorkerAccount(cleanEmail);
        if (workerAccount) {
          const check = verifyWorkerCredentials(cleanEmail, password);
          if (!check.valid) {
            set({
              notificationMessage: check.error || "Access Denied: Incorrect password for field worker account.",
            });
            return false;
          }

          const user: CivionUser = {
            id: `wrk-${workerAccount.email.replace(/[@.]/g, "-")}`,
            name: workerAccount.name,
            email: workerAccount.email,
            role: "field_worker",
            title: workerAccount.title,
            avatar: workerAccount.avatar,
            district: workerAccount.department,
            allowedCategories: workerAccount.allowedCategories,
          };

          set({
            currentRole: "field_worker",
            currentUser: user,
            isAuthenticated: true,
            isGuest: false,
            activeView: "workspace",
            notificationMessage: `Field Worker Session Granted: Welcome, ${user.name} (${workerAccount.title})`,
          });
          return true;
        }

        // Standard role resolution
        if (cleanEmail.includes("authority") || cleanEmail.includes("admin") || cleanEmail.includes("bbmp")) {
          role = "authority";
        } else if (cleanEmail.includes("worker") || cleanEmail.includes("field")) {
          role = "field_worker";
        }

        const extractedName = cleanEmail.includes("@")
          ? cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
          : "User";
        const initials = extractedName.slice(0, 2).toUpperCase() || "U";

        const user: CivionUser = {
          id: `usr-${Date.now()}`,
          name: extractedName,
          email: cleanEmail || `${role}@civion.app`,
          role: role,
          title: role === "resident" 
            ? "Verified District Resident" 
            : role === "field_worker" 
              ? "Municipal Response Officer" 
              : "Municipal Operations Supervisor",
          avatar: initials,
          district: "North District",
        };

        set({
          currentRole: role,
          currentUser: user,
          isAuthenticated: true,
          isGuest: false,
          activeView: "workspace",
          notificationMessage: `Authenticated as ${user.name} [${user.role.toUpperCase()}]. Access level: ${ROLE_ACCESS_LABELS[role]}`,
        });
        return true;
      },

      register: (roleOrName, nameOrEmail, maybeEmail) => {
        let role: Role = "resident";
        let name = "";
        let email = "";

        if (roleOrName === "resident" || roleOrName === "authority" || roleOrName === "field_worker") {
          role = roleOrName as Role;
          name = nameOrEmail;
          email = maybeEmail || "";
        } else {
          name = roleOrName;
          email = nameOrEmail;
          if (email.includes("authority") || email.includes("admin") || email.includes("bbmp")) {
            role = "authority";
          } else if (email.includes("worker") || email.includes("field")) {
            role = "field_worker";
          }
        }

        const cleanName = name.trim() || "Citizen";
        const cleanEmail = email.trim() || `${cleanName.toLowerCase().replace(/\s+/g, ".")}@civion.app`;
        const initials = cleanName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "U";

        const newUser: CivionUser = {
          id: `usr-${Date.now()}`,
          name: cleanName,
          email: cleanEmail,
          role: role,
          title: role === "resident" 
            ? "Verified District Resident" 
            : role === "field_worker" 
              ? "Municipal Response Officer" 
              : "Municipal Operations Supervisor",
          avatar: initials,
          district: "North District",
        };

        set({
          currentRole: role,
          currentUser: newUser,
          isAuthenticated: true,
          isGuest: false,
          activeView: "workspace",
          notificationMessage: `Account created! Welcome, ${newUser.name}. Access level: ${ROLE_ACCESS_LABELS[role]}`,
        });
      },

      logout: () => {
        set({
          isAuthenticated: false,
          isGuest: false,
          currentUser: null,
          activeView: "role_selection",
          notificationMessage: "Signed out successfully",
        });
      },

      switchRole: (targetRole) => {
        const state = get();
        const user = state.currentUser;
        
        // If exploring as guest, attempting to switch to authority or worker prompts auth modal
        if (state.isGuest) {
          if (targetRole !== "resident") {
            set({
              activeView: "auth_modal",
              currentRole: targetRole,
              notificationMessage: `Sign in required to access ${targetRole.replace("_", " ").toUpperCase()} workspace.`,
            });
            return false;
          }
          return true;
        }

        if (!user) {
          set({ currentRole: targetRole });
          return true;
        }

        const allowedRoles = ROLE_PERMISSIONS[user.role] || [user.role];
        
        if (!allowedRoles.includes(targetRole)) {
          set({
            notificationMessage: `Access Denied: As ${user.name} (${user.role.replace("_", " ")}), you are only permitted to access ${ROLE_ACCESS_LABELS[user.role]}. Please sign out to log in as ${targetRole.replace("_", " ")}.`,
          });
          return false;
        }

        set({
          currentRole: targetRole,
          notificationMessage: user.role === "authority" && targetRole === "field_worker"
            ? `Authority Supervisor Mode: Viewing Field Worker dashboard as ${user.name}`
            : `Viewing ${targetRole.replace("_", " ")} workspace`,
        });
        return true;
      },

      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        set({ theme: next });
        if (typeof document !== "undefined") {
          if (next === "light") {
            document.documentElement.classList.add("light");
            document.body.classList.add("light-theme");
          } else {
            document.documentElement.classList.remove("light");
            document.body.classList.remove("light-theme");
          }
        }
      },

      selectIssue: (id) => set({ selectedIssueId: id }),

      dismissNotification: () => set({ notificationMessage: null }),

      createSignal: (signal) => {
        const coords = signal.coordinates || [12.9784, 77.6408];
        const residentName = get().currentUser?.name || "Verified Resident";

        // Execute AI Deduplication & Aggregation Pipeline
        const decision = runAiDeduplicationPipeline(
          {
            text: `${signal.title}. ${signal.description}`,
            category: signal.category,
            latitude: coords[0],
            longitude: coords[1],
            photoUrl: signal.photoUrl,
            residentName,
            isUrgent: signal.isUrgent
          },
          get().issues
        );

        let updatedUser = get().currentUser;
        let notifs = get().citizenNotifications || [];
        if (updatedUser) {
          const newKarma = (updatedUser.civicKarma || 100) + 50;
          let newTier = updatedUser.trustTier || "Bronze Citizen";
          if (newKarma >= 300) newTier = "Platinum Sentinel";
          else if (newKarma >= 200) newTier = "Gold Inspector";
          else if (newKarma >= 100) newTier = "Silver Advocate";
          updatedUser = {
            ...updatedUser,
            civicKarma: newKarma,
            trustTier: newTier,
          };
          notifs = [
            {
              id: `notif-rep-${Date.now()}`,
              title: "+50 Civic Karma Awarded!",
              message: `Report filed and logged with verified GPS coordinates. Total Karma: ${newKarma} [${newTier}]`,
              timestamp: "Just now",
              type: "karma_awarded",
              read: false,
            },
            ...notifs,
          ];
        }

        if (decision.action === "merged") {
          // 4a. Merge into existing Master Issue
          const updatedIssues = get().issues.map((iss) =>
            iss.id === decision.targetMasterIssue.id ? decision.targetMasterIssue : iss
          );

          set({
            issues: updatedIssues,
            currentUser: updatedUser,
            citizenNotifications: notifs,
            notificationMessage: decision.message,
          });

          return decision.targetMasterIssue;
        } else {
          // 4b. Create New Master Issue
          const newIssue: CivicIssue = {
            ...decision.targetMasterIssue,
            title: signal.title || decision.targetMasterIssue.title,
            description: signal.description || decision.targetMasterIssue.description,
            location: signal.location || decision.targetMasterIssue.location,
            category: signal.category,
            coordinates: coords,
            beforePhoto: signal.photoUrl || "/images/issues/pothole.jpg",
            isMasterIssue: true,
            reportCount: 1,
            combinedReports: decision.targetMasterIssue.combinedReports || [
              {
                id: `rep-${Date.now()}`,
                residentName,
                residentContact: "+91 98765 43100",
                rawText: signal.description,
                reportedAt: "Just now",
                coordinates: coords,
                distanceMeters: 0,
                similarityScore: 1.0,
                photoUrl: signal.photoUrl
              }
            ]
          };

          set((state) => ({
            issues: [newIssue, ...state.issues],
            currentUser: updatedUser,
            citizenNotifications: notifs,
            notificationMessage: decision.message,
          }));

          return newIssue;
        }
      },

      createWorkOrder: (order) => {
        const nextIdNumber = 2000 + get().issues.length;
        const code = `WO-${nextIdNumber}`;

        const newOrder: CivicIssue = {
          id: `iss-${nextIdNumber}`,
          code,
          title: order.title,
          description: order.description,
          category: order.category,
          location: order.location,
          coordinates: order.coordinates || [12.9732, 77.6391],
          ward: order.ward,
          status: "Crew Dispatched",
          severity: order.severity,
          priorityScore: order.severity === "critical" ? 95 : order.severity === "high" ? 80 : 60,
          reportedBy: get().currentUser?.name || "Municipal Command Center",
          reportedAt: "Today (Official Work Order)",
          upvotes: 0,
          hasUpvoted: false,
          assignedWorker: order.assignedWorker,
          assignedWorkerRole: "Dispatched Crew",
          slaDeadlineHours: order.slaDeadlineHours,
          slaDeadlineTime: `Target SLA: ${order.slaDeadlineHours} hours`,
          beforePhoto: "/images/issues/pothole.jpg",
          fieldNotes: [
            {
              id: `fn-${Date.now()}`,
              author: get().currentUser?.name || "Suresh Gowda",
              role: "Authority",
              text: `Official municipal work order ${code} commissioned and assigned to ${order.assignedWorker}.`,
              timestamp: "Just now",
            }
          ],
          comments: []
        };

        set((state) => ({
          issues: [newOrder, ...state.issues],
          notificationMessage: `Municipal Work Order ${code} commissioned and dispatched!`,
        }));

        return newOrder;
      },

      addComment: (issueId, text) => {
        set((state) => {
          const user = state.currentUser;
          const author = user?.name || (state.isGuest ? "Resident (Guest)" : "Community Member");
          const role = user?.role ? user.role.toUpperCase() : "CITIZEN";
          const avatar = user?.avatar || (state.isGuest ? "G" : "CM");

          return {
            issues: state.issues.map((iss) => {
              if (iss.id === issueId) {
                return {
                  ...iss,
                  comments: [
                    ...(iss.comments || []),
                    {
                      id: `c-${Date.now()}`,
                      author,
                      role,
                      avatar,
                      text,
                      timestamp: "Just now",
                    }
                  ]
                };
              }
              return iss;
            }),
            notificationMessage: "Comment logged to public promise ledger.",
          };
        });
      },

      upvoteIssue: (id) => {
        set((state) => ({
          issues: state.issues.map((item) => {
            if (item.id === id) {
              const isUpvoted = !!item.hasUpvoted;
              return {
                ...item,
                upvotes: isUpvoted ? item.upvotes - 1 : item.upvotes + 1,
                hasUpvoted: !isUpvoted,
                priorityScore: isUpvoted ? item.priorityScore - 2 : item.priorityScore + 2,
              };
            }
            return item;
          }),
        }));
      },

      dispatchCrew: (id, workerName, targetSlaHours, note) => {
        set((state) => ({
          issues: state.issues.map((item) => {
            if (item.id === id) {
              const notes = [...item.fieldNotes];
              if (note) {
                notes.push({
                  id: `fn-${Date.now()}`,
                  author: state.currentUser?.name || "Operations Superintendent",
                  role: "Authority",
                  text: note,
                  timestamp: "Just now",
                });
              }
              return {
                ...item,
                status: "Crew Dispatched",
                assignedWorker: workerName,
                assignedWorkerRole: "Rapid Response Crew",
                slaDeadlineHours: targetSlaHours,
                slaDeadlineTime: `${targetSlaHours} hours target`,
                fieldNotes: notes,
              };
            }
            return item;
          }),
          notificationMessage: `Dispatched crew to ${workerName} with ${targetSlaHours}h SLA target`,
        }));
      },

      workerSetEnRoute: (id) => {
        set((state) => {
          const target = state.issues.find((i) => i.id === id);
          const notes = target ? [...target.fieldNotes] : [];
          notes.push({
            id: `fn-${Date.now()}`,
            author: state.currentUser?.name || "Raju K",
            role: "Field Worker",
            text: "Crew is en route to site with rapid repair squad and materials.",
            timestamp: "Just now",
          });

          const notif: CitizenNotification = {
            id: `notif-route-${Date.now()}`,
            title: `Crew En Route: #${target?.code || "Work Order"}`,
            message: `Field specialist ${state.currentUser?.name || "Raju K"} is currently en route to the location.`,
            timestamp: "Just now",
            issueId: id,
            issueCode: target?.code,
            type: "status_update",
            read: false,
          };

          return {
            issues: state.issues.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: "En Route" as IssueStatus,
                    fieldNotes: notes,
                  }
                : item
            ),
            citizenNotifications: [notif, ...state.citizenNotifications],
            notificationMessage: `Status updated: Crew en route to #${target?.code}`,
          };
        });
      },

      workerMarkOnSite: (id) => {
        set((state) => ({
          issues: state.issues.map((item) => {
            if (item.id === id) {
              return {
                ...item,
                status: "Work in Progress",
                isOnSite: true,
                onSiteTimestamp: "Just now",
                fieldNotes: [
                  ...item.fieldNotes,
                  {
                    id: `fn-${Date.now()}`,
                    author: state.currentUser?.name || "Raju K",
                    role: "Field Worker",
                    text: "Field worker confirmed on-site via GPS check-in. Safety perimeter established.",
                    timestamp: "Just now",
                  }
                ]
              };
            }
            return item;
          }),
          notificationMessage: "Marked On-Site: Work has officially commenced.",
        }));
      },

      workerAddNote: (id, text) => {
        set((state) => ({
          issues: state.issues.map((item) => {
            if (item.id === id) {
              return {
                ...item,
                fieldNotes: [
                  ...item.fieldNotes,
                  {
                    id: `fn-${Date.now()}`,
                    author: state.currentUser?.name || "Raju K",
                    role: "Field Worker",
                    text,
                    timestamp: "Just now",
                  }
                ]
              };
            }
            return item;
          }),
          notificationMessage: "Field note recorded to public ledger.",
        }));
      },

      workerUploadEvidence: (id, photoUrl, note) => {
        set((state) => ({
          issues: state.issues.map((item) => {
            if (item.id === id) {
              const notes = [...item.fieldNotes];
              if (note) {
                notes.push({
                  id: `fn-${Date.now()}`,
                  author: state.currentUser?.name || "Raju K",
                  role: "Field Worker",
                  text: `Evidence uploaded: ${note}`,
                  timestamp: "Just now",
                });
              }
              return {
                ...item,
                afterPhoto: photoUrl,
                fieldNotes: notes,
              };
            }
            return item;
          }),
          notificationMessage: "Resolution photo evidence uploaded.",
        }));
      },

      workerRequestBackup: (id, reason) => {
        set((state) => ({
          issues: state.issues.map((item) => {
            if (item.id === id) {
              return {
                ...item,
                backupRequested: true,
                backupReason: reason,
                fieldNotes: [
                  ...item.fieldNotes,
                  {
                    id: `fn-${Date.now()}`,
                    author: state.currentUser?.name || "Raju K",
                    role: "Field Worker",
                    text: `⚠️ BACKUP REQUESTED: ${reason}`,
                    timestamp: "Just now",
                  }
                ]
              };
            }
            return item;
          }),
          notificationMessage: "Backup & material request dispatched to Central Depot.",
        }));
      },

      workerCompleteJob: (id, notes, afterPhotoUrl) => {
        set((state) => {
          const target = state.issues.find((i) => i.id === id);
          const fNotes = target ? [...target.fieldNotes] : [];
          fNotes.push({
            id: `fn-${Date.now()}`,
            author: state.currentUser?.name || "Raju K",
            role: "Field Worker",
            text: `Work completed: ${notes || "Physical repairs finished and tested. Submitted for citizen sign-off."}`,
            timestamp: "Just now",
          });

          const notif: CitizenNotification = {
            id: `notif-verify-${Date.now()}`,
            title: `Verify Municipal Fix: #${target?.code}`,
            message: `Field crew completed repairs. Please review the before/after photos and confirm resolution!`,
            timestamp: "Just now",
            issueId: id,
            issueCode: target?.code,
            type: "verification_requested",
            read: false,
          };

          return {
            issues: state.issues.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: "Resolved (Pending Verification)" as IssueStatus,
                    afterPhoto: afterPhotoUrl || item.afterPhoto || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800",
                    fieldNotes: fNotes,
                  }
                : item
            ),
            citizenNotifications: [notif, ...state.citizenNotifications],
            notificationMessage: "Job marked resolved. Resident confirmation loop initiated.",
          };
        });
      },

      workerCompleteJobWithWatermark: (id, notes, afterPhotoUrl, watermark) => {
        set((state) => {
          const target = state.issues.find((i) => i.id === id);
          const fNotes = target ? [...target.fieldNotes] : [];
          fNotes.push({
            id: `fn-${Date.now()}`,
            author: state.currentUser?.name || watermark.workerName,
            role: "Field Worker",
            text: `Repairs completed with GPS photo verification [${watermark.lat.toFixed(4)}°N, ${watermark.lng.toFixed(4)}°E at ${watermark.timestamp}]: ${notes || "Physical repairs finished."}`,
            timestamp: "Just now",
          });

          const notif: CitizenNotification = {
            id: `notif-verify-${Date.now()}`,
            title: `Resolution Verification: #${target?.code}`,
            message: `Field crew completed repairs with GPS photo proof. Please review before/after photos and verify!`,
            timestamp: "Just now",
            issueId: id,
            issueCode: target?.code,
            type: "verification_requested",
            read: false,
          };

          return {
            issues: state.issues.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: "Resolved (Pending Verification)" as IssueStatus,
                    afterPhoto: afterPhotoUrl,
                    watermarkData: watermark,
                    fieldNotes: fNotes,
                  }
                : item
            ),
            citizenNotifications: [notif, ...state.citizenNotifications],
            notificationMessage: `Repairs logged with GPS watermark proof. Sent to citizen verification loop.`,
          };
        });
      },

      residentVerify: (id, verified, feedback, extra) => {
        set((state) => {
          const target = state.issues.find((i) => i.id === id);
          const isActuallyResolved = extra?.isActuallyResolved ?? verified;
          const qualityOfWork = extra?.qualityOfWork ?? (isActuallyResolved ? 5 : 2);
          const starRating = extra?.starRating ?? (isActuallyResolved ? 5 : 2);

          const notes = target ? [...target.fieldNotes] : [];
          notes.push({
            id: `fn-${Date.now()}`,
            author: state.currentUser?.name || "Citizen Resident",
            role: "Resident",
            text: isActuallyResolved
              ? `Citizen Verified [Quality: ${qualityOfWork}/5, Rating: ${starRating}/5★, Actually Resolved: Yes]: ${feedback || "Resident confirmed satisfactory resolution."}`
              : `Citizen Flagged Incomplete [Quality: ${qualityOfWork}/5, Rating: ${starRating}/5★, Actually Resolved: No]: ${feedback || "Issue remains unresolved or persists."}`,
            timestamp: "Just now",
          });

          let updatedUser = state.currentUser;
          let notifs = [...state.citizenNotifications];

          if (isActuallyResolved && updatedUser) {
            const newKarma = (updatedUser.civicKarma || 100) + 25;
            let newTier = updatedUser.trustTier || "Bronze Citizen";
            if (newKarma >= 300) newTier = "Platinum Sentinel";
            else if (newKarma >= 200) newTier = "Gold Inspector";
            else if (newKarma >= 100) newTier = "Silver Advocate";

            updatedUser = {
              ...updatedUser,
              civicKarma: newKarma,
              trustTier: newTier,
            };

            notifs = [
              {
                id: `notif-k-${Date.now()}`,
                title: "+25 Civic Karma Awarded!",
                message: `You verified the municipal fix for #${target?.code} with ${starRating}★ rating and ${qualityOfWork}/5 quality. Total Karma: ${newKarma} [${newTier}]`,
                timestamp: "Just now",
                issueId: id,
                issueCode: target?.code,
                type: "karma_awarded",
                read: false,
              },
              ...notifs,
            ];
          } else if (!isActuallyResolved) {
            notifs = [
              {
                id: `notif-dispute-${Date.now()}`,
                title: `Work Order Reopened: #${target?.code}`,
                message: `You reported the issue was not actually resolved (Quality: ${qualityOfWork}/5, Rating: ${starRating}★). Priority escalated for field crew inspection.`,
                timestamp: "Just now",
                issueId: id,
                issueCode: target?.code,
                type: "status_update",
                read: false,
              },
              ...notifs,
            ];
          }

          return {
            currentUser: updatedUser,
            citizenNotifications: notifs,
            issues: state.issues.map((item) => {
              if (item.id === id) {
                return {
                  ...item,
                  status: isActuallyResolved ? ("Resolved & Verified" as IssueStatus) : ("Work in Progress" as IssueStatus),
                  priorityScore: isActuallyResolved ? Math.max(10, item.priorityScore - 30) : Math.min(100, item.priorityScore + 10),
                  residentVerification: {
                    verified: isActuallyResolved,
                    feedback,
                    verifiedAt: "Just now",
                    isActuallyResolved,
                    qualityOfWork,
                    starRating,
                  },
                  fieldNotes: notes,
                };
              }
              return item;
            }),
            notificationMessage: isActuallyResolved
              ? `Thank you! Feedback recorded with ${starRating}★ rating and ${qualityOfWork}/5 quality score. +25 Civic Karma earned!`
              : "Feedback logged. The ticket has been reopened for the field crew with escalated priority.",
          };
        });
      },
    }),
    {
      name: "civion-storage-v6",
      partialize: (state) => ({
        currentRole: state.currentRole,
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
        currentUser: state.currentUser,
        activeView: state.activeView,
        theme: state.theme,
        issues: state.issues,
      }),
    }
  )
);
