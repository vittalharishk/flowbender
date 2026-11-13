export type ProductionStatus =
  | "development"
  | "pre-production"
  | "production"
  | "post-production"
  | "completed"
  | "on-hold";

export type ProjectType = "feature-film" | "series" | "short-film" | "music-video" | "documentary" | "commercial";

export interface Project {
  id: string;
  title: string;
  type: ProjectType;
  status: ProductionStatus;
  genre: string;
  language: string;
  director: string;
  producer: string;
  productionHouse: string;
  startDate: string;
  endDate: string;
  releaseDate?: string | null;
  budget: number;
  spent: number;
  posterColor: string;
  posterImage?: string | null;
  thumbnailImage?: string | null;
  bannerImage?: string | null;
  logline: string;
  description: string;
  shootProgress: number;
  totalShootDays: number;
  completedShootDays: number;
  nextShootDate: string | null;
  createdAt: string;
}

export type CastCategory =
  | "lead"
  | "supporting"
  | "character-artist"
  | "guest"
  | "child-artist"
  | "special-appearance";

export type ContractStatus = "signed" | "negotiating" | "pending" | "expired";
export type PaymentStatus = "paid" | "partial" | "pending" | "overdue";

export interface PaymentMilestone {
  id: string;
  label: string;
  amount: number;
  dueDate: string;
  status: "paid" | "due" | "upcoming" | "overdue";
  paymentDate?: string;
  paymentRef?: string;
  notes?: string;
}

export interface CastScene {
  id: string;
  sceneNumber: string;
  title: string;
  status: "completed" | "scheduled" | "pending";
  shootDate?: string;
}

export interface CastMember {
  id: string;
  name: string;
  character: string;
  characterDescription: string;
  category: CastCategory;
  projectId: string;
  projectTitle: string;
  avatarUrl?: string;
  profileImage?: string | null;
  initials: string;
  email: string;
  phone: string;
  agency?: string;
  languages: string[];
  contractStatus: ContractStatus;
  paymentStatus: PaymentStatus;
  totalFee: number;
  paidAmount: number;
  paymentMilestones: PaymentMilestone[];
  scenes: CastScene[];
  notes: string;
  joinedDate: string;
}

export type CrewDepartment =
  | "direction"
  | "production"
  | "camera"
  | "art"
  | "costume"
  | "makeup"
  | "sound"
  | "lighting"
  | "vfx"
  | "editing"
  | "di"
  | "dubbing"
  | "production-design"
  | "transport"
  | "accounts"
  | "publicity";

export type CrewAvailability = "available" | "on-set" | "on-leave" | "unavailable";

export interface CrewMember {
  id: string;
  name: string;
  initials: string;
  profileImage?: string | null;
  department: CrewDepartment;
  role: string;
  projectId: string;
  projectTitle: string;
  email: string;
  phone: string;
  agency?: string;
  contractStatus: ContractStatus;
  paymentStatus: PaymentStatus;
  dayRate: number;
  totalDays: number;
  daysWorked: number;
  totalPaid: number;
  availability: CrewAvailability;
  notes: string;
  joinedDate: string;
}

export interface ScheduleEntry {
  id: string;
  projectId: string;
  projectTitle: string;
  date: string;
  callTime: string;
  location: string;
  scenes: string[];
  shootDayNumber: number;
  totalShootDays: number;
  callSheetStatus: "published" | "draft" | "pending";
  status: "scheduled" | "shooting" | "completed" | "postponed";
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: "info" | "warning" | "success" | "urgent";
}

export interface DashboardStats {
  activeProjects: number;
  totalBudget: number;
  totalSpent: number;
  upcomingShootDays: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export interface TimelineMilestone {
  id: string;
  projectId: string;
  projectTitle: string;
  title: string;
  date: string;
  type: "start" | "wrap" | "delivery" | "review" | "milestone";
  completed: boolean;
}

export interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  color: string;
}

export interface ActivityItem {
  id: string;
  type: "call-sheet" | "scene-completed" | "expense" | "schedule" | "cast" | "review";
  title: string;
  description: string;
  project: string;
  timestamp: string;
  user: string;
}

export interface ProductionAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  project: string;
  timestamp: string;
  actionLabel?: string;
}

export interface MonthlyBudgetData {
  month: string;
  planned: number;
  actual: number;
}
