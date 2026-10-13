export type CivicCategory = 
  | "Pothole" 
  | "Water leakage" 
  | "Streetlight" 
  | "Waste" 
  | "Drainage" 
  | "Road safety" 
  | "Accessibility";

export interface AuthorityAccount {
  email: string;
  password: string;
  name: string;
  title: string;
  department: string;
  departmentCode: "ROADS_SAFETY" | "WATER_DRAINAGE" | "ELECTRICAL_STREETLIGHT" | "ALL";
  allowedCategories: CivicCategory[];
  avatar: string;
}

// Stored Authority Credentials categorized by Department per user specification:
// 1. kaushkipriya2006@gmail.com: Category Pothole & Road safety
// 2. civion00@gmail.com: Category Water leakage & Drainage
// 3. petalspines3@gmail.com: Category Streetlight
export const STORED_AUTHORITY_ACCOUNTS: AuthorityAccount[] = [
  {
    email: "kaushkipriya2006@gmail.com",
    password: "kaushiki@2006",
    name: "Kaushiki Priya",
    title: "Director of Roads & Road Safety Infrastructure",
    department: "BBMP Roads & Public Safety Directorate",
    departmentCode: "ROADS_SAFETY",
    // User requested: Only get the report of category pothole and road safety
    allowedCategories: ["Pothole", "Road safety"],
    avatar: "KP",
  },
  {
    email: "civion00@gmail.com",
    password: "civion2026",
    name: "Civion Water Command",
    title: "Superintendent of Water Supply & Drainage",
    department: "BWSSB Water Supply & Stormwater Drainage Directorate",
    departmentCode: "WATER_DRAINAGE",
    // User requested: Category water leakage and drainage
    allowedCategories: ["Water leakage", "Drainage"],
    avatar: "CC",
  },
  {
    email: "petalspines3@gmail.com",
    password: "PETALS2006",
    name: "Petals Pines Electrical",
    title: "Chief Inspector of Electrical Grid & Streetlights",
    department: "BESCOM Electrical & Streetlight Infrastructure Division",
    departmentCode: "ELECTRICAL_STREETLIGHT",
    // User requested: Category streetlight
    allowedCategories: ["Streetlight"],
    avatar: "PP",
  },
];

export function findAuthorityAccount(email: string): AuthorityAccount | undefined {
  const normalized = email.trim().toLowerCase();
  return STORED_AUTHORITY_ACCOUNTS.find((acc) => {
    const accNorm = acc.email.toLowerCase();
    if (accNorm === normalized) return true;
    if (
      accNorm === "kaushkipriya2006@gmail.com" &&
      (normalized === "kaushikipriya2006@gmail.com" || normalized === "kaushiki.priya2006@gmail.com")
    ) {
      return true;
    }
    return false;
  });
}

export function verifyAuthorityCredentials(
  email: string,
  password: string
): { valid: boolean; account?: AuthorityAccount; error?: string } {
  const account = findAuthorityAccount(email);
  if (!account) {
    return { valid: false, error: "Authority account not found." };
  }
  const cleanPass = password.trim();
  const isMatch =
    account.password === cleanPass ||
    (account.email.toLowerCase() === "petalspines3@gmail.com" &&
      account.password.toUpperCase() === cleanPass.toUpperCase());
  if (!isMatch) {
    return { valid: false, error: "Incorrect authority password. Access denied." };
  }
  return { valid: true, account };
}
