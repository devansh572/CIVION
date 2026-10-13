export type CivicCategory = 
  | "Pothole" 
  | "Water leakage" 
  | "Streetlight" 
  | "Waste" 
  | "Drainage" 
  | "Road safety" 
  | "Accessibility";

export interface WorkerAccount {
  email: string;
  password: string;
  name: string;
  title: string;
  department: string;
  departmentCode: "ROADS_SAFETY" | "WATER_DRAINAGE" | "ELECTRICAL_STREETLIGHT" | "ALL";
  allowedCategories: CivicCategory[];
  avatar: string;
  phone?: string;
  role: "field_worker";
}

// Stored Field Worker Credentials saved in the database for the worker portal
// 1. deeshukumar975@gmail.com: Pothole & Road safety
// 2. likeplease8989@gmail.com: Water leakage & Drainage
// 3. anishsharma3672@gmail.com: Streetlight
export const STORED_WORKER_ACCOUNTS: WorkerAccount[] = [
  {
    email: "deeshukumar975@gmail.com",
    password: "deeshu",
    name: "Deeshu Kumar",
    title: "Senior Field Operations Specialist",
    department: "BBMP Road Infrastructure & Civil Rapid Response",
    departmentCode: "ROADS_SAFETY",
    allowedCategories: ["Pothole", "Road safety"],
    avatar: "DK",
    phone: "+91-9876543233",
    role: "field_worker"
  },
  {
    email: "likeplease8989@gmail.com",
    password: "likeplz",
    name: "Like Please Worker",
    title: "Municipal Field Response Inspector",
    department: "BWSSB Water Supply & Stormwater Drainage Response",
    departmentCode: "WATER_DRAINAGE",
    allowedCategories: ["Water leakage", "Drainage"],
    avatar: "LP",
    phone: "+91-9876543234",
    role: "field_worker"
  },
  {
    email: "anishsharma3672@gmail.com",
    password: "anish",
    name: "Anish Sharma",
    title: "Field Electrical & Streetlight Specialist",
    department: "BESCOM Electrical & Streetlight Maintenance Unit",
    departmentCode: "ELECTRICAL_STREETLIGHT",
    allowedCategories: ["Streetlight"],
    avatar: "AS",
    phone: "+91-9876543235",
    role: "field_worker"
  }
];

export function getWorkerAllowedCategories(email?: string | null): CivicCategory[] {
  if (!email) return ["Pothole", "Road safety"];
  const account = findWorkerAccount(email);
  return account ? account.allowedCategories : ["Pothole", "Road safety"];
}

export function findWorkerAccount(email: string): WorkerAccount | undefined {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();
  return STORED_WORKER_ACCOUNTS.find((acc) => acc.email.toLowerCase() === normalized);
}

export function verifyWorkerCredentials(
  email: string,
  password: string
): { valid: boolean; account?: WorkerAccount; error?: string } {
  const account = findWorkerAccount(email);
  if (!account) {
    return { valid: false, error: "Field worker account not found in database." };
  }
  const cleanPass = password.trim();
  if (account.password !== cleanPass) {
    return { valid: false, error: "Incorrect password for field worker account. Access denied." };
  }
  return { valid: true, account };
}
