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
  status: "paid" | "due" | "upcoming";
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

// ── Production Schedule ──

export type ShootDayStatus = "planned" | "confirmed" | "in-progress" | "completed" | "cancelled";

export interface ShootDayScene {
  sceneNumber: string;
  heading: string;
  pages: number;
  intExt: string;
  characters: string[];
  timeOfDay?: string;
  location?: string;
  estimatedDuration?: string;
  synopsis?: string;
  status?: string;
}

export interface ShootDayCrewReq {
  department: string;
  role: string;
  name: string;
}

export interface ShootDayEquipment {
  id: string;
  name: string;
  category?: string;
  notes?: string;
  imageUrl?: string;
}

export interface ScheduleConflict {
  type: "cast-overlap" | "location-overlap" | "crew-unavailable" | "permit-expiry";
  message: string;
  severity: "warning" | "critical";
}

export interface ShootDay {
  id: string;
  projectId: string;
  projectTitle: string;
  date: string;
  shootDayNumber: number;
  totalShootDays: number;
  callTime: string;
  wrapTime: string;
  location: string;
  locationAddress?: string;
  scenes: ShootDayScene[];
  castRequired: string[];
  crewRequired: ShootDayCrewReq[];
  equipment: ShootDayEquipment[];
  status: ShootDayStatus;
  callSheetStatus: "published" | "draft" | "pending";
  totalPages: number;
  notes: string;
  conflicts: ScheduleConflict[];
}

// ── Script & Scenes ──

export type SceneStatus =
  | "not-scheduled"
  | "scheduled"
  | "shot"
  | "partially-shot"
  | "reshoot-required";

export type IntExt = "INT" | "EXT" | "INT/EXT";
export type TimeOfDay = "DAY" | "NIGHT" | "DAWN" | "DUSK" | "CONTINUOUS" | "MAGIC HOUR";

export interface SceneBreakdownItem {
  id: string;
  category: "prop" | "costume" | "vehicle" | "special" | "vfx";
  name: string;
  notes?: string;
}

export interface Scene {
  id: string;
  projectId: string;
  sceneNumber: string;
  heading: string;
  intExt: IntExt;
  location: string;
  timeOfDay: TimeOfDay;
  characters: string[];
  props: SceneBreakdownItem[];
  costumes: SceneBreakdownItem[];
  vehicles: SceneBreakdownItem[];
  specialRequirements: SceneBreakdownItem[];
  vfxRequired: boolean;
  vfxNotes: string;
  notes: string;
  estimatedDuration: string;
  pages: number;
  status: SceneStatus;
  shootDate?: string;
  shootDay?: number;
  synopsis: string;
}

export interface ScriptVersion {
  id: string;
  projectId: string;
  version: string;
  label: string;
  date: string;
  author: string;
  pageCount: number;
  sceneCount: number;
  notes: string;
  color: string;
  isCurrent: boolean;
}

export type ScriptType =
  | "Feature Film"
  | "OTT Series"
  | "OTT Episode"
  | "TV Series"
  | "TV Episode"
  | "Short Film"
  | "Music Video"
  | "Other";
export type ScriptStatus =
  | "Concept"
  | "First Draft"
  | "Second Draft"
  | "Revised Draft"
  | "Production Draft"
  | "Shooting Draft"
  | "Locked"
  | "Archived";
export type ScriptBlockType =
  | "scene_heading"
  | "action"
  | "character"
  | "parenthetical"
  | "dialogue"
  | "transition"
  | "shot"
  | "note";
export interface ScriptBlock {
  id: string;
  type: ScriptBlockType;
  text: string;
  sceneId?: string;
}
export interface ScriptScene {
  id: string;
  number: string;
  heading: string;
  intExt: IntExt;
  location: string;
  timeOfDay: TimeOfDay;
  scriptDay: string;
  pages: number;
  eighths: number;
  description: string;
  breakdown: SceneBreakdownItem[];
  status: SceneStatus;
  blockIds: string[];
}
export interface ScriptDraftVersion {
  id: string;
  number: number;
  name: string;
  revisionDate: string;
  createdBy: string;
  notes: string;
  status: ScriptStatus;
  blocks: ScriptBlock[];
  scenes: ScriptScene[];
  archived?: boolean;
}
export interface Script {
  id: string;
  projectId: string;
  title: string;
  type: ScriptType;
  language: string;
  genre: string;
  writer: string;
  storyBy: string;
  screenplayBy: string;
  dialoguesBy: string;
  scriptCoordinator: string;
  draftName: string;
  draftNumber: string;
  status: ScriptStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  archived: boolean;
  blocks: ScriptBlock[];
  scenes: ScriptScene[];
  versions: ScriptDraftVersion[];
  linkedSceneIds: string[];
}

export type CallSheetStatus = "Draft" | "Ready for Review" | "Published" | "Revised" | "Completed";

export type CallSheetWorkflow =
  | "Feature Film"
  | "OTT / Web Series"
  | "TV Series"
  | "TV Episode"
  | "Short Film"
  | "Music Video";

export interface CallSheetScene {
  number: string;
  description: string;
  setting: string;
  time: string;
  pages: number;
  characters: string;
  duration: string;
  status: string;
  sourceId?: string;
  location?: string;
  notes?: string;
}

export interface CallSheetCastAssignment {
  id: string;
  castId?: string;
  name: string;
  character: string;
  status: string;
  pickup: string;
  call: string;
  makeup: string;
  costume: string;
  onSet: string;
  wrap: string;
  transport: string;
  notes: string;
}

export interface CallSheetCrewAssignment {
  id: string;
  crewId?: string;
  name: string;
  designation: string;
  department: string;
  callTime: string;
  transport: string;
  phone: string;
  notes: string;
}

export interface CallSheetRow {
  id: string;
  [key: string]: string | number | undefined;
}

export interface CallSheet {
  id: string;
  project: string;
  workflow: CallSheetWorkflow;
  shootDay: number;
  date: string;
  location: string;
  director: string;
  ad: string;
  cast: number;
  crew: number;
  status: CallSheetStatus;
  updated: string;
  scenes: CallSheetScene[];
  notes: string;
  projectId?: string;
  projectImage?: string | null;
  locationImage?: string | null;
  shootDayId?: string;
  version?: number;
  callTime?: string;
  firstShot?: string;
  packUp?: string;
  producer?: string;
  executiveProducer?: string;
  productionManager?: string;
  dop?: string;
  language?: string;
  genre?: string;
  productionCompany?: string;
  weather?: { temperature: string; high: string; low: string; condition: string; sunrise: string; sunset: string; rainChance: string; notes: string };
  productionMessage?: { message: string; priority: "Normal" | "Important" | "Critical" };
  sceneIds?: string[];
  castAssignments?: CallSheetCastAssignment[];
  crewAssignments?: CallSheetCrewAssignment[];
  locationIds?: string[];
  locations?: CallSheetRow[];
  schedule?: CallSheetRow[];
  transport?: CallSheetRow[];
  catering?: CallSheetRow[];
  equipment?: CallSheetRow[];
  props?: CallSheetRow[];
  safety?: Record<string, string>;
  specialNotes?: Record<string, string>;
  revisions?: { version: number; date: string; changedBy: string; reason: string; status: CallSheetStatus }[];
}

export interface SeriesSeason {
  id: string;
  projectId: string;
  title: string;
  seasonNumber: number;
  episodeCount: number;
  status: ProductionStatus;
  logline: string;
  showrunner: string;
  deliveryWindow: string;
}

export type EpisodeStatus =
  | "concept"
  | "writing"
  | "locked"
  | "scheduled"
  | "shooting"
  | "editing"
  | "delivered";

export interface SeriesEpisode {
  id: string;
  projectId: string;
  seasonId: string;
  episodeNumber: number;
  title: string;
  status: EpisodeStatus;
  synopsis: string;
  scriptVersionId?: string;
  airDate?: string;
  duration?: number;
}

export interface CharacterProfile {
  id: string;
  projectId: string;
  name: string;
  description: string;
  ageBracket: string;
  arc: string;
  languages: string[];
  linkedCastIds: string[];
}

export interface ProjectLocation {
  id: string;
  projectId: string;
  name: string;
  city: string;
  type: string;
  status: "locked" | "scouting" | "permit-pending";
  address: string;
  notes: string;
  coverImage?: string | null;
  gallery?: string[];
}

export interface DprReport {
  id: string;
  projectId: string;
  shootDayId: string;
  date: string;
  plannedPages: number;
  shotPages: number;
  completedScenes: string[];
  delays: string[];
  incidents: string[];
  producerNote: string;
}

export type TaskPriority = "low" | "medium" | "high" | "critical";
export type ProductionTaskStatus = "open" | "in-progress" | "blocked" | "done";

export interface ProductionTask {
  id: string;
  projectId: string;
  department: string;
  title: string;
  owner: string;
  dueDate: string;
  status: ProductionTaskStatus;
  priority: TaskPriority;
}

export interface EquipmentItem {
  id: string;
  projectId?: string;
  name: string;
  category: string;
  vendorId?: string;
  quantity: number;
  status: "available" | "reserved" | "in-use" | "maintenance";
  notes?: string;
  imageUrl?: string;
}

export interface VendorRecord {
  id: string;
  name: string;
  category: string;
  contactName: string;
  phone: string;
  city: string;
  activeProjects: string[];
  paymentStatus: PaymentStatus;
}

export interface BudgetLineItem {
  id: string;
  projectId: string;
  category: string;
  allocated: number;
  committed: number;
  spent: number;
  notes: string;
}

export interface ExpenseItem {
  id: string;
  projectId: string;
  date: string;
  category: string;
  description: string;
  vendorId?: string;
  amount: number;
  status: "draft" | "approved" | "paid";
}

export interface PayrollEntry {
  id: string;
  projectId: string;
  payeeName: string;
  department: string;
  period: string;
  grossAmount: number;
  paidAmount: number;
  status: PaymentStatus;
  dueDate: string;
}

export type PostProductionStatus =
  | "not-started"
  | "in-progress"
  | "review"
  | "approved"
  | "completed";

export interface PostProductionItem {
  id: string;
  projectId: string;
  department: string;
  task: string;
  owner: string;
  status: PostProductionStatus;
  progress: number;
  dueDate: string;
}

export type VfxShotStatus = "briefed" | "in-progress" | "client-review" | "final";

export interface VfxShot {
  id: string;
  projectId: string;
  shotCode: string;
  sequence: string;
  description: string;
  vendorId?: string;
  status: VfxShotStatus;
  priority: "low" | "medium" | "high";
  dueDate: string;
}

export interface DeliverableItem {
  id: string;
  projectId: string;
  name: string;
  format: string;
  territory: string;
  status: "pending" | "in-progress" | "ready" | "delivered";
  dueDate: string;
}

export interface RightsDeal {
  id: string;
  projectId: string;
  territory: string;
  distributor: string;
  rightsType: "theatrical" | "satellite" | "digital" | "audio" | "dubbed" | "remake" | "broadcast" | "ancillary";
  status: "open" | "negotiating" | "signed" | "closed";
  minimumGuarantee: number;
  advanceReceived: number;
  deliveryStatus: "pending" | "partial" | "complete";
}

export interface MarketingItem {
  id: string;
  projectId: string;
  campaign: string;
  channel: string;
  owner: string;
  launchDate: string;
  status: "planning" | "live" | "completed";
  notes: string;
}

export type AttendanceStatus = "present" | "absent" | "partial" | "leave";

export interface AttendanceRecord {
  id: string;
  projectId: string;
  personId?: string;
  name: string;
  role: string;
  department: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  hoursWorked: number;
  notes?: string;
}

export interface CameraCard {
  id: string;
  projectId: string;
  cardId: string;
  capacity: number;
  available: number;
  format: "RAW" | "ProRes" | "DNxHR" | "H.264";
  shootDate: string;
  status: "active" | "archived" | "corrupted" | "verified";
  shootCount: number;
  backupStatus: "pending" | "in-progress" | "verified" | "failed";
  location: string;
  notes?: string;
}

export interface StorageDevice {
  id: string;
  projectId: string;
  deviceId: string;
  type: "HDD" | "SSD" | "NAS" | "LTO-Tape";
  capacity: number;
  used: number;
  status: "active" | "backup" | "archive" | "failed";
  location: string;
  content: string[];
  lastVerified: string;
  redundancy: boolean;
  temperature?: number;
}

export interface FootageMetadata {
  id: string;
  projectId: string;
  sceneId: string;
  takeNumber: number;
  duration: number;
  format: string;
  resolution: string;
  fps: number;
  codecs: string;
  storedOn: string[];
  status: "raw" | "proxies-ready" | "synced" | "archived";
  notes?: string;
  shootDate: string;
}

export interface SubtitleLanguage {
  id: string;
  projectId: string;
  language: string;
  languageCode: string;
  nativeName: string;
  totalLines: number;
  completedLines: number;
  inProgressLines: number;
  qcStatus: "pending" | "in-progress" | "complete" | "approved";
  translator: string;
  startDate: string;
  deliveryDate: string;
  notes?: string;
  fileSize?: string;
}

