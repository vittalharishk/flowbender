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
export type ShotType =
  | "wide"
  | "medium"
  | "medium-close"
  | "close-up"
  | "extreme-close"
  | "over-shoulder"
  | "pov"
  | "insert"
  | "establishing"
  | "aerial"
  | "two-shot"
  | "group";

export type ShotMovement =
  | "static"
  | "pan"
  | "tilt"
  | "dolly"
  | "track"
  | "steadicam"
  | "handheld"
  | "crane"
  | "drone"
  | "zoom"
  | "whip-pan"
  | "arc";

export type ShotStatus = "planned" | "storyboarded" | "approved" | "shot" | "pickup";

export interface Shot {
  id: string;
  sceneId: string;
  shotNumber: string;
  type: ShotType;
  movement: ShotMovement;
  lens: string;
  angle: string;
  description: string;
  duration: string;
  characters: string[];
  equipment: string[];
  vfx: boolean;
  vfxNotes: string;
  status: ShotStatus;
  notes: string;
  imageUrl?: string;
}

export type ReferenceCategory = "audio" | "video" | "image" | "character" | "location" | "prop";

export interface ScriptReference {
  id: string;
  category: ReferenceCategory;
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  linkedSceneIds: string[];
  linkedCharacters: string[];
  tags: string[];
  createdAt: string;
  notes: string;
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
  isMain?: boolean;
  blocks: ScriptBlock[];
  scenes: ScriptScene[];
  versions: ScriptDraftVersion[];
  linkedSceneIds: string[];
  shots: Shot[];
  references: ScriptReference[];
}

export type CallSheetStatus = "Draft" | "Ready for Review" | "Approved" | "Published" | "Revised" | "Completed";

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
  multiArtist?: boolean; // explicit opt-in: role may have more than one selected artist
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
  | "in-review"
  | "approved"
  | "completed"
  | "on-hold"
  | "delayed";

export interface PostProductionItem {
  id: string;
  projectId: string;
  department: string;
  task: string;
  owner: string;
  status: PostProductionStatus;
  progress: number;
  dueDate: string;
  // Extended fields
  description?: string;
  linkedSceneId?: string;
  linkedShotId?: string;
  startDate?: string;
  priority?: "low" | "medium" | "high" | "critical";
  notes?: string;
  approvalHistory?: { action: string; by: string; at: string; notes: string }[];
  completionPercentage?: number;
}

export type PostProdMilestoneStatus = "pending" | "in-progress" | "completed" | "delayed";

export interface PostProdMilestone {
  id: string;
  projectId: string;
  title: string;
  targetDate: string;
  actualDate?: string;
  status: PostProdMilestoneStatus;
  notes: string;
  completedBy?: string;
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

export type VfxVersionStatus = "submitted" | "in-review" | "approved" | "rejected" | "superseded";

export interface VfxVersion {
  id: string;
  shotId: string;
  versionNumber: number;
  submittedAt: string;
  submittedBy?: string;
  assetReference?: string;
  notes?: string;
  status: VfxVersionStatus;
  reviewStatus?: "pending" | "approved" | "rejected" | "revision-required";
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  revisionReason?: string;
}

export interface VfxReview {
  id: string;
  shotId: string;
  versionId: string;
  reviewerId?: string;
  reviewerRole?: string;
  decision: "approved" | "rejected" | "revision-required";
  comments?: string;
  createdAt: string;
}

export type EquipmentAllocationStatus = "pending" | "active" | "returned" | "partial-return";

export interface EquipmentAllocation {
  id: string;
  equipmentId: string;
  projectId: string;
  shootDayId?: string;
  departmentId?: string;
  locationId?: string;
  crewMemberId?: string;
  quantity: number;
  startDate: string;
  endDate?: string;
  status: EquipmentAllocationStatus;
  returnedQuantity: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type EquipmentMaintenanceType = "preventive" | "repair" | "inspection" | "calibration";
export type EquipmentMaintenanceStatus = "scheduled" | "in-progress" | "completed" | "cancelled";

export interface EquipmentMaintenance {
  id: string;
  equipmentId: string;
  projectId?: string;
  maintenanceType: EquipmentMaintenanceType;
  description: string;
  vendorId?: string;
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate: string;
  completedDate?: string;
  status: EquipmentMaintenanceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MediaAssetType = "video" | "audio" | "image" | "document" | "other";
export type MediaAssetStatus = "draft" | "registered" | "in-review" | "approved" | "rejected" | "archived";

export interface MediaAsset {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  mediaType: MediaAssetType;
  fileReference?: string;
  shootDayId?: string;
  sceneId?: string;
  locationId?: string;
  castId?: string;
  recordedDate?: string;
  uploadedAt: string;
  status: MediaAssetStatus;
  currentVersion: number;
  tags: string[];
  notes?: string;
  createdBy?: string;
  updatedAt: string;
}

export type MediaVersionStatus = "active" | "superseded" | "rejected";

export interface MediaVersion {
  id: string;
  assetId: string;
  versionNumber: number;
  fileReference?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
  status: MediaVersionStatus;
  reviewStatus?: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
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

// ── Distribution A13 Types ──────────────────────────────────────────────────

export type AgreementStatus = "draft" | "negotiating" | "pending-approval" | "active" | "expired" | "terminated" | "cancelled";
export type DistributionChannel = "theatrical" | "satellite" | "digital-ott" | "television" | "audio" | "dubbed" | "remake" | "broadcast" | "ancillary" | "other";
export type ReleaseStatus = "planned" | "confirmed" | "released" | "postponed" | "cancelled";
export type RevenueType = "advance" | "minimum-guarantee" | "royalty" | "commission" | "settlement" | "other";
export type CollectionStatus = "pending" | "partial" | "collected" | "overdue" | "disputed" | "written-off";

export interface DistributionAgreement {
  id: string;
  projectId: string;
  rightsDealId?: string;
  distributorName: string;
  distributorContact?: string;
  channel: DistributionChannel;
  territories: string[];
  agreementValue: number;
  advancePaid: number;
  paymentTerms?: string;
  startDate: string;
  endDate: string;
  status: AgreementStatus;
  documentReference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DistributionRelease {
  id: string;
  projectId: string;
  agreementId?: string;
  title: string;
  channel: DistributionChannel;
  territory: string;
  plannedDate: string;
  actualDate?: string;
  windowStart?: string;
  windowEnd?: string;
  status: ReleaseStatus;
  notes?: string;
  createdAt: string;
}

export interface DistributionRevenue {
  id: string;
  projectId: string;
  agreementId?: string;
  rightsDealId?: string;
  revenueType: RevenueType;
  amount: number;
  currency?: string;
  territory?: string;
  channel?: DistributionChannel;
  receivedDate?: string;
  dueDate?: string;
  status: CollectionStatus;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface DistributionSettlement {
  id: string;
  projectId: string;
  agreementId: string;
  grossRevenue: number;
  distributorCommission: number;
  deductions: number;
  netPayable: number;
  settledAmount: number;
  settlementDate?: string;
  status: "pending" | "partial" | "settled" | "disputed";
  notes?: string;
  createdAt: string;
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

export type AttendanceStatus =
  | "present"
  | "absent"
  | "partial"   // kept for backward compat (legacy = half-day)
  | "half-day"
  | "leave"
  | "on-leave"  // alias
  | "not-required"
  | "unconfirmed";

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

export interface CateringAdjustment {
  id: string;
  projectId: string;
  date: string;
  delta: number;       // positive or negative integer
  reason: string;
  adjustedBy: string;
  createdAt: string;
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


// ── Cast: roles (CharacterProfile), probable candidates, decisions, availability, contracts ──

export type CastCandidateStatus =
  | "proposed"
  | "under-discussion"
  | "shortlisted"
  | "negotiation"
  | "on-hold"
  | "rejected"
  | "selected";

export interface CastCandidate {
  id: string;
  roleId: string; // CharacterProfile.id
  projectId: string;
  name: string;
  category: CastCategory;
  agency: string;
  email: string;
  phone: string;
  languages: string[];
  proposedFee: number;
  availabilityNote: string;
  status: CastCandidateStatus;
  notes: string; // audition / meeting notes
  negotiationNotes: string;
  linkedCastId: string | null; // CastMember.id once selected
  isDemo: boolean; // fictional sample artist with demo contact details
  createdAt: string;
  updatedAt: string;
}

export interface CastDecisionLogEntry {
  id: string;
  candidateId: string;
  roleId: string;
  projectId: string;
  fromStatus: CastCandidateStatus | null;
  toStatus: CastCandidateStatus;
  note: string;
  createdAt: string;
  createdBy: string;
}

export type ArtistAvailabilityState = "available" | "unavailable" | "tentative" | "confirmed";

export interface ArtistAvailability {
  id: string;
  castId: string; // CastMember.id
  date: string; // YYYY-MM-DD
  state: ArtistAvailabilityState;
  note: string;
  endDate?: string;
  reason?: string;
}

// ─── Pre-Production Checklist ───────────────────────────────────────────────
export type ChecklistStatus = "pending" | "in-progress" | "done" | "blocked";

export interface PreProdChecklistItem {
  id: string;
  projectId: string;
  category: string;
  title: string;
  owner: string;
  dueDate: string;
  status: ChecklistStatus;
  notes: string;
}

// ─── Daily Production Report (rich) ─────────────────────────────────────────
export type DPRStatus = "draft" | "submitted" | "approved";

export interface DPRScene {
  sceneNumber: string;
  heading: string;
  pagesPlanned: number;
  pagesCompleted: number;
  status: "completed" | "partial" | "not-started" | "moved";
  notes: string;
}

export interface DPRReport {
  id: string;
  projectId: string;
  shootDayId: string;
  date: string;
  shootDayNumber: number;
  location: string;
  director: string;
  adName: string;
  callTime: string;
  actualCallTime: string;
  wrapTime: string;
  actualWrapTime: string;
  castPresent: number;
  crewPresent: number;
  cateringCount: number;
  scenesPlanned: number;
  scenesCompleted: number;
  pagesPlanned: number;
  pagesCompleted: number;
  scenes: DPRScene[];
  issues: string;
  tomorrowLocation: string;
  tomorrowScenes: string;
  status: DPRStatus;
  submittedBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ContractStage = "draft" | "under-review" | "approved" | "signed" | "completed";

export interface CastContract {
  id: string;
  castId: string; // CastMember.id (confirmed casting record)
  roleId: string;
  projectId: string;
  contractRef: string; // e.g. "FLW-2027-001"
  amount: number;
  advance: number;
  milestones: PaymentMilestone[];
  startDate: string;
  endDate: string;
  contractStage: ContractStage;
  documentName: string | null; // placeholder until document upload exists
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Purchase Orders (A5) ─────────────────────────────────────────────────

export type POStatus =
  | "draft"
  | "submitted"
  | "dept-approved"
  | "finance-approved"
  | "producer-approved"
  | "rejected"
  | "returned"
  | "partially-fulfilled"
  | "fulfilled"
  | "cancelled";

export interface POLineItem {
  id: string;
  itemName: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  taxPercent: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
  fulfilledQty: number;
}

export interface POApprovalRecord {
  level: string;
  approverName: string;
  decision: "approved" | "rejected" | "returned";
  comments: string;
  decisionDate: string;
  previousStatus: POStatus;
  newStatus: POStatus;
}

export interface POAmendment {
  id: string;
  reason: string;
  originalAmount: number;
  revisedAmount: number;
  difference: number;
  requestedBy: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  approvalHistory: POApprovalRecord[];
  createdAt: string;
}

export interface POFulfilment {
  id: string;
  lineItemId: string;
  quantity: number;
  deliveryDate: string;
  receivedBy: string;
  deliveryReference: string;
  notes: string;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  title: string;
  vendorId: string;
  projectId: string;
  department: string;
  poDate: string;
  expectedDeliveryDate: string;
  currency: CurrencyCode;
  exchangeRate: number;
  paymentTerms: string;
  deliveryAddress: string;
  billingAddress: string;
  contactPerson: string;
  notes: string;
  termsAndConditions: string;
  lineItems: POLineItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  inrTotal: number;
  status: POStatus;
  approvalHistory: POApprovalRecord[];
  amendments: POAmendment[];
  fulfilments: POFulfilment[];
  linkedSourceType?: string;
  linkedSourceId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Event Calendar ────────────────────────────────────────────────────────

export type CalendarEventType =
  | "shoot"
  | "cast-meeting"
  | "crew-meeting"
  | "audition"
  | "rehearsal"
  | "table-read"
  | "location-scouting"
  | "pre-prod-deadline"
  | "post-prod-deadline"
  | "dubbing"
  | "delivery"
  | "other";

export type CalendarEventStatus =
  | "scheduled"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "postponed";

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  date: string;
  endDate?: string;
  time?: string;
  endTime?: string;
  projectId?: string;
  projectTitle?: string;
  location?: string;
  department?: string;
  description?: string;
  participants?: string[];
  notes?: string;
  status: CalendarEventStatus;
  linkedShootDayId?: string;
  linkedCallSheetId?: string;
  linkedTaskId?: string;
  linkedPostProdId?: string;
  linkedDprId?: string;
  createdBy?: string;
  createdAt: string;
}

// ─── Crew Departments (Production Crew Module) ─────────────────────────────

export type CrewDeptKey =
  | "writing-direction"
  | "daily-production"
  | "camera-lights"
  | "locations"
  | "art-props"
  | "costume-makeup"
  | "vehicles"
  | "action-stunts"
  | "production-office";

export interface CrewDeptInfo {
  key: CrewDeptKey;
  name: string;
  designations: string[];
}

export interface CrewAssignment {
  id: string;
  crewMemberId: string;
  projectId: string;
  department: string;
  designation: string;
  startDate: string;
  endDate?: string;
  status: "active" | "completed" | "on-hold";
  notes?: string;
}

export type RemunerationPeriod = "daily" | "weekly" | "monthly" | "fixed" | "per-project";
export type RemunerationPaymentStatus = "pending" | "partially-paid" | "paid" | "on-hold";

export interface RemunerationAgreement {
  id: string;
  crewMemberId: string;
  projectId: string;
  department: string;
  designation: string;
  period: RemunerationPeriod;
  agreedAmount: number;
  workStartDate: string;
  workEndDate?: string;
  totalPayable: number;
  advancePaid: number;
  notes?: string;
  status: RemunerationPaymentStatus;
  createdAt: string;
}

export interface CrewPaymentRecord {
  id: string;
  agreementId: string;
  crewMemberId: string;
  projectId: string;
  amount: number;
  paymentDate: string;
  paymentReference?: string;
  type: "advance" | "partial" | "full" | "final";
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

// ─── Vendor Management (Rentals Module) ──────────────────────────────────────

export type VendorCategory =
  | "camera-equipment" | "lighting-equipment" | "generator-electrical"
  | "art-set-suppliers" | "props-suppliers" | "costume-suppliers"
  | "makeup-prosthetics" | "location-services" | "hotel-accommodation"
  | "travel-transport" | "vehicle-caravan" | "catering"
  | "general-rental" | "other";

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstin?: string;
  category: VendorCategory;
  services: string;
  paymentTerms: string;
  bankDetails?: string;
  notes?: string;
  status: "active" | "inactive";
  createdAt: string;
}

// ─── Rental Management ────────────────────────────────────────────────────────

export type RentalCategory =
  | "camera-equipment" | "lenses-accessories" | "lighting-equipment"
  | "generators-electrical" | "grip-equipment" | "art-set-equipment"
  | "props-furniture" | "costumes" | "makeup-prosthetics-equipment"
  | "location-equipment" | "production-office-equipment" | "other";

export type RentalStatus =
  | "requested" | "approved" | "booked" | "issued"
  | "partially-returned" | "returned" | "overdue" | "cancelled";

export type RentalRatePeriod = "daily" | "weekly" | "monthly" | "fixed";

export interface RentalRecord {
  id: string;
  projectId: string;
  vendorId: string;
  category: RentalCategory;
  itemName: string;
  description?: string;
  quantity: number;
  ratePeriod: RentalRatePeriod;
  rateAmount: number;
  rentalStartDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  rentalDays: number;
  subtotal: number;
  deposit: number;
  additionalCharges: number;
  lateFees: number;
  totalRentalCost: number;
  depositForfeited: boolean;
  totalPaid: number;
  status: RentalStatus;
  invoicePlaceholder?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentalPayment {
  id: string;
  rentalId: string;
  projectId: string;
  vendorId: string;
  amount: number;
  isDeposit: boolean;
  paymentDate: string;
  paymentReference?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

// ─── Phase 3: Expenses and Production Office ─────────────────────────────────

export type ExpenseCategoryA =
  | "office-rent" | "office-maintenance" | "electricity" | "internet-telephone"
  | "office-supplies" | "printing-stationery" | "furniture-equipment"
  | "cleaning-housekeeping" | "repairs" | "office-misc";

export type ExpenseCategoryB =
  | "daily-production" | "catering-food" | "local-transportation" | "fuel"
  | "parking-tolls" | "location-expenses" | "accommodation" | "travel"
  | "art-props" | "costume-makeup" | "camera-lighting"
  | "production-staff" | "permissions-licenses" | "emergency" | "production-misc";

export type ExpenseCategory = ExpenseCategoryA | ExpenseCategoryB;

export type ExpenseSection = "production-office" | "production";

export type ExpensePaymentStatus =
  | "draft" | "pending-approval" | "approved" | "partially-paid" | "paid"
  | "rejected" | "cancelled";

export type ExpensePaymentMethod =
  | "cash" | "bank-transfer" | "cheque" | "upi" | "card" | "other";

export interface ProductionExpense {
  id: string;
  projectId: string;
  section: ExpenseSection;
  category: ExpenseCategory;
  subcategory?: string;
  department: string;
  title: string;
  description?: string;
  vendorPayee?: string;
  expenseDate: string;
  dueDate?: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
  taxAmount: number;
  discount: number;
  finalAmount: number;
  totalPaid: number;
  paymentStatus: ExpensePaymentStatus;
  paymentMethod?: ExpensePaymentMethod;
  paymentReference?: string;
  invoiceNumber?: string;
  attachmentPlaceholder?: string;
  createdBy: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpensePayment {
  id: string;
  expenseId: string;
  projectId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: ExpensePaymentMethod;
  referenceNumber?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export type OfficeRentPaymentStatus = "upcoming" | "paid" | "overdue" | "partial";

export interface OfficeRental {
  id: string;
  projectId?: string;
  propertyName: string;
  address: string;
  landlordPayee: string;
  landlordPhone?: string;
  monthlyRent: number;
  securityDeposit: number;
  depositPaid: boolean;
  leaseStartDate: string;
  leaseEndDate: string;
  paymentDueDay: number;
  renewalDate?: string;
  agreementNotes?: string;
  status: "active" | "expired" | "terminated";
  createdAt: string;
}

export interface OfficeRentPayment {
  id: string;
  officeRentalId: string;
  projectId?: string;
  month: string;
  amount: number;
  paymentDate: string;
  paymentMethod: ExpensePaymentMethod;
  referenceNumber?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export type MaintenanceCategory =
  | "electrical" | "plumbing" | "air-conditioning" | "furniture"
  | "office-equipment" | "networking-internet" | "cleaning" | "repairs" | "other";

export type MaintenanceStatus =
  | "reported" | "assigned" | "in-progress" | "completed" | "on-hold" | "cancelled";

export type MaintenancePriority = "low" | "medium" | "high" | "urgent";

export interface MaintenanceRecord {
  id: string;
  projectId?: string;
  officeRentalId?: string;
  category: MaintenanceCategory;
  title: string;
  description?: string;
  reportedDate: string;
  assignedTo?: string;
  priority: MaintenancePriority;
  expectedCompletion?: string;
  actualCompletion?: string;
  estimatedCost: number;
  actualCost: number;
  linkedExpenseId?: string;
  status: MaintenanceStatus;
  invoiceReference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Phase 4: Locations, Boarding & Travel ───────────────────────────────────

export type LocationCategory =
  | "film-set" | "studio" | "outdoor" | "indoor" | "residential"
  | "commercial" | "road-public" | "hotel-resort" | "village-rural" | "other";

export type PermissionStatus =
  | "not-requested" | "requested" | "under-review" | "approved" | "rejected" | "expired";

export interface FilmLocation {
  id: string;
  name: string;
  category: LocationCategory;
  address: string;
  city: string;
  state: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  locationOwner?: string;
  locationManager?: string;
  permissionStatus: PermissionStatus;
  ratePerDay: number;
  deposit: number;
  accessTimings?: string;
  parking?: string;
  facilities?: string;
  restrictions?: string;
  notes?: string;
  imagePlaceholder?: string;
  status: "available" | "booked" | "unavailable";
  createdAt: string;
}

export type ScoutingStatus =
  | "planned" | "scheduled" | "visited" | "under-review" | "shortlisted" | "approved" | "rejected";

export interface LocationScouting {
  id: string;
  projectId: string;
  locationId?: string;
  locationName: string;
  scoutingDate: string;
  scoutingTeam: string[];
  assignedManager: string;
  requirements?: string;
  observations?: string;
  estimatedCost: number;
  suitabilityRating: number;
  status: ScoutingStatus;
  decision?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type LocationAgreementStatus =
  | "pending" | "active" | "completed" | "cancelled" | "disputed";

export interface LocationAgreement {
  id: string;
  projectId: string;
  locationId: string;
  usageStartDate: string;
  usageEndDate: string;
  agreedAmount: number;
  deposit: number;
  depositPaid: boolean;
  totalPaid: number;
  agreementReference?: string;
  permissionStatus: PermissionStatus;
  status: LocationAgreementStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationPayment {
  id: string;
  agreementId: string;
  projectId: string;
  locationId: string;
  amount: number;
  isDeposit: boolean;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

// ─── Boarding / Hotel ─────────────────────────────────────────────────────────

export type HotelAccommodationType =
  | "hotel" | "resort" | "guest-house" | "serviced-apartment"
  | "production-accommodation" | "other";

export interface Hotel {
  id: string;
  name: string;
  accommodationType: HotelAccommodationType;
  address: string;
  city: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  facilities?: string;
  notes?: string;
  vendorId?: string;
  createdAt: string;
}

export type RoomBookingStatus =
  | "requested" | "confirmed" | "checked-in" | "checked-out" | "cancelled" | "no-show";

export type GuestType = "cast" | "crew" | "production" | "other";

export interface HotelBooking {
  id: string;
  projectId: string;
  hotelId: string;
  guestName: string;
  guestType: GuestType;
  castMemberId?: string;
  crewMemberId?: string;
  roomNumber?: string;
  roomType: string;
  occupants: number;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  ratePerNight: number;
  additionalCharges: number;
  discount: number;
  totalAmount: number;
  deposit: number;
  depositPaid: boolean;
  totalPaid: number;
  status: RoomBookingStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HotelPayment {
  id: string;
  bookingId: string;
  projectId: string;
  hotelId: string;
  amount: number;
  isDeposit: boolean;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

// ─── Travel / Trips ──────────────────────────────────────────────────────────

export type TravelCategory =
  | "flight" | "train" | "bus" | "car" | "taxi"
  | "production-vehicle" | "rental-vehicle" | "other";

export type TripStatus =
  | "planned" | "requested" | "booked" | "confirmed" | "in-transit" | "completed" | "cancelled";

export interface TripPassenger {
  name: string;
  guestType: GuestType;
  castMemberId?: string;
  crewMemberId?: string;
  seatDetails?: string;
}

export interface Trip {
  id: string;
  projectId: string;
  title: string;
  category: TravelCategory;
  vendorProvider?: string;
  bookingReference?: string;
  origin: string;
  destination: string;
  departureDateTime: string;
  arrivalDateTime?: string;
  passengers: TripPassenger[];
  vehicleDetails?: string;
  driverName?: string;
  ticketCost: number;
  additionalCharges: number;
  totalCost: number;
  totalPaid: number;
  status: TripStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TravelPayment {
  id: string;
  tripId: string;
  projectId: string;
  amount: number;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

// ─── Phase 5: Art, Props, Sets & AI Set Extensions ────────────────────────────

export type PropCategory =
  | "furniture" | "decor" | "weapons-armory" | "vehicles-miniatures"
  | "electronic-gadgets" | "books-documents" | "clothing-accessories"
  | "food-consumables" | "tools-equipment" | "art-craft-supplies"
  | "period-props" | "action-props" | "signage-graphics" | "other";

export type PropCondition = "excellent" | "good" | "fair" | "damaged" | "lost" | "under-repair";
export type PropOwnership = "purchased" | "rented" | "borrowed" | "production-made";

export interface PropItem {
  id: string;
  name: string;
  category: PropCategory;
  description?: string;
  imagePlaceholder?: string;
  quantityTotal: number;
  quantityAvailable: number;
  condition: PropCondition;
  ownership: PropOwnership;
  vendorId?: string;
  rentalRecordId?: string;
  purchaseCost: number;
  rentalCostPerDay?: number;
  projectId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PropTransactionType = "checkout" | "checkin" | "damage-report" | "lost-report" | "return";
export type PropTransactionStatus = "active" | "returned" | "damaged" | "lost";

export interface PropTransaction {
  id: string;
  propItemId: string;
  projectId: string;
  sceneId?: string;
  quantity: number;
  transactionType: PropTransactionType;
  checkedOutBy: string;
  checkoutDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  conditionOnReturn?: PropCondition;
  status: PropTransactionStatus;
  notes?: string;
  createdAt: string;
}

export type SetStatus =
  | "planned" | "design" | "approved" | "construction"
  | "ready-for-shoot" | "completed" | "dismantled";

export type SetCategory =
  | "interior" | "exterior" | "underwater" | "period" | "contemporary"
  | "sci-fi-futuristic" | "action-stunt" | "miniature" | "green-screen" | "other";

export interface ProductionSet {
  id: string;
  name: string;
  category: SetCategory;
  projectId: string;
  locationId?: string;
  artDirector: string;
  crewMemberId?: string;
  description?: string;
  constructionStartDate?: string;
  constructionEndDate?: string;
  shootStartDate?: string;
  dismantleDate?: string;
  estimatedBudget: number;
  actualCost: number;
  linkedExpenseIds: string[];
  status: SetStatus;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SetTask {
  id: string;
  setId: string;
  projectId: string;
  title: string;
  assignedTo: string;
  dueDate?: string;
  completedDate?: string;
  status: "pending" | "in-progress" | "completed" | "blocked";
  notes?: string;
  createdAt: string;
}

export type AISetExtensionStatus =
  | "planned" | "reference-collection" | "concept" | "in-review"
  | "revision" | "approved" | "delivered";

export interface AISetExtensionTask {
  id: string;
  projectId: string;
  vfxShotId?: string;
  sceneId?: string;
  locationId?: string;
  title: string;
  description?: string;
  promptInstructions?: string;
  referencePlaceholders: string[];
  assignedArtist: string;
  crewMemberId?: string;
  status: AISetExtensionStatus;
  reviewNotes?: string;
  deliveryPlaceholder?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AISetExtensionVersion {
  id: string;
  taskId: string;
  versionNumber: number;
  status: AISetExtensionStatus;
  notes?: string;
  reviewedBy?: string;
  createdAt: string;
}

// ─── Phase 6: Vehicles, Caravans, Drivers, Action & Stunts ───────────────────

// ── Vehicles ──────────────────────────────────────────────────────────────────

export type VehicleCategory =
  | "car" | "suv" | "van" | "bus" | "truck" | "cargo"
  | "special-purpose" | "other";

export type VehicleOwnership = "owned" | "rented";
export type VehicleStatus = "available" | "allocated" | "maintenance" | "unavailable";

export interface ProductionVehicle {
  id: string;
  registrationNumber: string;
  name: string;
  category: VehicleCategory;
  ownership: VehicleOwnership;
  vendorId?: string;
  rentalRecordId?: string;
  seatingCapacity: number;
  status: VehicleStatus;
  currentLocation?: string;
  projectId?: string;
  insuranceExpiry?: string;
  permitExpiry?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AllocationStatus = "scheduled" | "active" | "completed" | "cancelled";

export interface VehicleAllocation {
  id: string;
  vehicleId: string;
  projectId: string;
  shootDayId?: string;
  tripId?: string;
  driverCrewId?: string;
  startDate: string;
  endDate: string;
  pickupLocation?: string;
  dropLocation?: string;
  passengerCrewIds: string[];
  passengerCastIds: string[];
  passengerCount: number;
  status: AllocationStatus;
  notes?: string;
  createdAt: string;
}

// ── Caravans ──────────────────────────────────────────────────────────────────

export type CaravanCategory =
  | "artist" | "director" | "vanity-van" | "production" | "support" | "other";

export type CaravanStatus = "available" | "allocated" | "maintenance" | "returned";

export interface Caravan {
  id: string;
  identificationNumber: string;
  name: string;
  category: CaravanCategory;
  capacity: number;
  ownership: VehicleOwnership;
  vendorId?: string;
  rentalRecordId?: string;
  projectId?: string;
  rentalStartDate?: string;
  rentalEndDate?: string;
  rentalAgreementRef?: string;
  depositPaid: number;
  rentalCostPerDay: number;
  totalRentalCost: number;
  status: CaravanStatus;
  parkingLocation?: string;
  maintenanceStatus?: string;
  returnCondition?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaravanAllocation {
  id: string;
  caravanId: string;
  projectId: string;
  shootDayId?: string;
  assignedTo: string;
  crewMemberId?: string;
  castMemberId?: string;
  startDate: string;
  endDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: AllocationStatus;
  notes?: string;
  createdAt: string;
}

// ── Driver Profiles ────────────────────────────────────────────────────────────

export interface DriverProfile {
  id: string;
  crewMemberId: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseType: string;
  vehicleIds: string[];
  available: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriverAssignment {
  id: string;
  driverProfileId: string;
  vehicleId: string;
  projectId: string;
  shootDayId?: string;
  tripId?: string;
  dutyStart: string;
  dutyEnd: string;
  status: AllocationStatus;
  notes?: string;
  createdAt: string;
}

// ── Stunts ─────────────────────────────────────────────────────────────────────

export type StuntStatus =
  | "planned" | "risk-assessment" | "rehearsal" | "safety-review"
  | "approved" | "scheduled" | "completed" | "blocked" | "cancelled";

export type RiskLevel = "low" | "medium" | "high" | "extreme";

export interface StuntPlan {
  id: string;
  projectId: string;
  sceneId?: string;
  shootDayId?: string;
  locationId?: string;
  title: string;
  description: string;
  actionDirector: string;
  actionDirectorCrewId?: string;
  assignedStuntCrewIds: string[];
  riskLevel: RiskLevel;
  vehicleIds: string[];
  equipmentIds: string[];
  plannedDate?: string;
  rehearsalDate?: string;
  completedDate?: string;
  status: StuntStatus;
  safetySignedOff: boolean;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StuntSafetyChecklist {
  id: string;
  stuntPlanId: string;
  riskAssessmentDone: boolean;
  safetyBriefingDone: boolean;
  rehearsalDone: boolean;
  ppeRequired: string[];
  medicalContactRef?: string;
  locationPermissionRef?: string;
  safetyOfficerSignOff: boolean;
  safetyOfficerName?: string;
  incidentPlaceholder?: string;
  approvalNotes?: string;
  updatedAt: string;
}

// ── Stunt Equipment ────────────────────────────────────────────────────────────

export type StuntEquipmentCategory =
  | "crash-mat" | "wire-rig" | "air-bag" | "protective-gear"
  | "fire-safety" | "stunt-vehicle-mod" | "underwater-gear"
  | "rigging" | "pyrotechnics" | "other";

export interface StuntEquipment {
  id: string;
  name: string;
  category: StuntEquipmentCategory;
  description?: string;
  quantityTotal: number;
  quantityAvailable: number;
  condition: "excellent" | "good" | "fair" | "damaged" | "under-repair";
  ownership: "owned" | "rented" | "borrowed";
  vendorId?: string;
  rentalRecordId?: string;
  purchaseCost: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StuntEquipmentTransaction {
  id: string;
  equipmentId: string;
  stuntPlanId?: string;
  projectId: string;
  quantity: number;
  type: "checkout" | "checkin" | "damage-report";
  checkedOutBy: string;
  checkoutDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  conditionOnReturn?: "excellent" | "good" | "fair" | "damaged";
  status: "active" | "returned" | "damaged";
  notes?: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════
// Phase A2 — Budgets & Accounts
// ═══════════════════════════════════════════════════════════

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP";

export type BudgetStatus = "draft" | "approved" | "revised" | "frozen";

export type ApprovalStatus =
  | "draft"
  | "submitted"
  | "dept-approved"
  | "finance-approved"
  | "producer-approved"
  | "rejected"
  | "returned";

export type ApprovalLevel = "department-head" | "finance" | "producer";

export interface ApprovalRecord {
  level: ApprovalLevel;
  approverName: string;
  decision: "approved" | "rejected" | "returned";
  comments: string;
  decisionDate: string;
}

export interface ProjectBudget {
  id: string;
  projectId: string;
  currency: CurrencyCode;
  baseCurrency: CurrencyCode;
  originalApprovedAmount: number;
  approvedAmount: number;
  exchangeRate: number;
  exchangeRateDate: string;
  budgetStatus: BudgetStatus;
  approvalStatus: ApprovalStatus;
  approvalHistory: ApprovalRecord[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentBudget {
  id: string;
  projectBudgetId: string;
  projectId: string;
  departmentKey: string;
  departmentDisplayName: string;
  allocatedBudget: number;
  revisedBudget: number;
  currency: CurrencyCode;
  approvalStatus: ApprovalStatus;
  approvalHistory: ApprovalRecord[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ── A7: Insurance Register ──────────────────────────────────────────────────

export type InsurancePolicyType =
  | "production"
  | "equipment"
  | "vehicle"
  | "location"
  | "liability"
  | "cast-talent"
  | "weather"
  | "errors-omissions";

export type InsurancePolicyStatus = "active" | "expired" | "cancelled" | "pending" | "renewed";

export type InsuranceClaimStatus = "filed" | "under-review" | "approved" | "denied" | "settled" | "withdrawn";

export interface InsuranceClaim {
  id: string;
  claimNumber: string;
  claimDate: string;
  incidentDate: string;
  description: string;
  claimedAmount: number;
  settledAmount: number;
  status: InsuranceClaimStatus;
  adjusterName: string;
  adjusterContact: string;
  resolutionDate: string;
  resolutionNotes: string;
}

export interface InsurancePolicy {
  id: string;
  policyNumber: string;
  policyType: InsurancePolicyType;
  provider: string;
  providerContact: string;
  projectId: string;
  description: string;
  insuredItems: string[];
  coverageAmount: number;
  deductible: number;
  premiumAmount: number;
  premiumFrequency: "annual" | "semi-annual" | "quarterly" | "monthly" | "one-time";
  totalPremiumPaid: number;
  startDate: string;
  endDate: string;
  renewalDate: string;
  status: InsurancePolicyStatus;
  claims: InsuranceClaim[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type RevisionStatus = "draft" | "submitted" | "approved" | "rejected";

export interface BudgetRevision {
  id: string;
  projectBudgetId: string;
  projectId: string;
  revisionNumber: number;
  previousAmount: number;
  revisedAmount: number;
  changeAmount: number;
  changePercentage: number;
  reason: string;
  requestedBy: string;
  status: RevisionStatus;
  approvalHistory: ApprovalRecord[];
  departmentChanges: {
    departmentKey: string;
    previousAmount: number;
    revisedAmount: number;
  }[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}