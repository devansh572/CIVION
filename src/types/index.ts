// ─── User & Auth Types ───

export type UserRole = 'citizen' | 'authority' | 'field_worker' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  department_id?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

// ─── Department & Category ───

export interface Department {
  id: string;
  name: string;
  description: string;
  head_id?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  department_id?: string;
  created_at: string;
}

// ─── Issue Types ───

export type IssueStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type LocationImportance = 'rural' | 'residential' | 'commercial' | 'major_road' | 'landmark';

export interface Issue {
  id: string;
  reporter_id: string;
  title: string;
  description: string;
  category_id: string;
  latitude: number;
  longitude: number;
  address: string;
  image_url?: string;
  status: IssueStatus;
  severity: Severity;
  priority_score: number;
  priority_explanation: string;
  ai_summary?: string;
  assigned_to?: string;
  assigned_by?: string;
  department_id?: string;
  location_importance: LocationImportance;
  sla_deadline?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  // Joined fields
  reporter?: Profile;
  category?: Category;
  assignee?: Profile;
  department?: Department;
  vote_count?: number;
  has_voted?: boolean;
}

export interface IssueUpdate {
  id: string;
  issue_id: string;
  author_id: string;
  old_status?: IssueStatus;
  new_status?: IssueStatus;
  comment?: string;
  created_at: string;
  author?: Profile;
}

export interface IssueVote {
  id: string;
  issue_id: string;
  user_id: string;
  created_at: string;
}

export interface ResolutionEvidence {
  id: string;
  issue_id: string;
  worker_id: string;
  image_url: string;
  notes: string;
  created_at: string;
  worker?: Profile;
}

// ─── Notification Types ───

export type NotificationType = 'status_change' | 'assignment' | 'resolution' | 'vote' | 'sla_warning' | 'general';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  issue_id?: string;
  read: boolean;
  created_at: string;
}

// ─── AI Types ───

export interface AIClassification {
  category: string;
  confidence: number;
  severity: Severity;
  severity_reasoning: string;
  summary: string;
}

export interface DuplicateCandidate {
  issue: Issue;
  similarity_score: number;
  reasons: string[];
}

export interface PriorityBreakdown {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
  factors: {
    severity: { value: number; detail: string };
    votes: { value: number; detail: string };
    age: { value: number; detail: string };
    location: { value: number; detail: string };
    safety: { value: number; detail: string };
  };
}

// ─── Dashboard Stats ───

export interface DashboardStats {
  total_issues: number;
  open_issues: number;
  in_progress_issues: number;
  resolved_issues: number;
  overdue_sla: number;
  avg_resolution_hours: number;
  issues_by_category: { name: string; value: number; color: string }[];
  issues_trend: { date: string; count: number }[];
  status_distribution: { name: string; value: number; color: string }[];
  resolution_times: { category: string; hours: number }[];
}

// ─── Filter & Form Types ───

export interface IssueFilters {
  status?: IssueStatus;
  category_id?: string;
  severity?: Severity;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface ReportIssueForm {
  title: string;
  description: string;
  category_id: string;
  latitude: number;
  longitude: number;
  address: string;
  image_file?: File;
  severity: Severity;
  location_importance: LocationImportance;
}
