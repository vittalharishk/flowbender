import { useMemo, useSyncExternalStore } from "react";
import { createFlowBenderSeedData } from "./flowbender-demo-seed";
import { getAccessToken, getDemoAccountForUser, getDemoUserFromToken } from "./auth-client";
import type {
  AttendanceRecord,
  CateringAdjustment,
  BudgetLineItem,
  CallSheet,
  CameraCard,
  CastMember,
  CharacterProfile,
  CrewMember,
  DeliverableItem,
  DprReport,
  DPRReport,
  PreProdChecklistItem,
  EquipmentItem,
  ExpenseItem,
  FootageMetadata,
  MarketingItem,
  Notification,
  PayrollEntry,
  PostProductionItem,
  Project,
  ProjectLocation,
  ProductionTask,
  RightsDeal,
  ScheduleEntry,
  Scene,
  ScriptVersion,
  Script,
  SeriesEpisode,
  SeriesSeason,
  ShootDay,
  StorageDevice,
  SubtitleLanguage,
  VendorRecord,
  VfxShot,
  CastCandidate,
  CastDecisionLogEntry,
  ArtistAvailability,
  CastContract,
  PostProdMilestone,
  CalendarEvent,
  CrewAssignment,
  RemunerationAgreement,
  CrewPaymentRecord,
  Vendor,
  RentalRecord,
  RentalPayment,
  ProductionExpense,
  ExpensePayment,
  OfficeRental,
  OfficeRentPayment,
  MaintenanceRecord,
  FilmLocation,
  LocationScouting,
  LocationAgreement,
  LocationPayment,
  Hotel,
  HotelBooking,
  HotelPayment,
  Trip,
  TravelPayment,
  PropItem,
  PropTransaction,
  ProductionSet,
  SetTask,
  AISetExtensionTask,
  AISetExtensionVersion,
  ProductionVehicle,
  VehicleAllocation,
  Caravan,
  CaravanAllocation,
  DriverProfile,
  DriverAssignment,
  StuntPlan,
  StuntSafetyChecklist,
  StuntEquipment,
  StuntEquipmentTransaction,
  ProjectBudget,
  DepartmentBudget,
  BudgetRevision,
  PurchaseOrder,
  InsurancePolicy,
  EquipmentAllocation,
  EquipmentMaintenance,
  VfxVersion,
  VfxReview,
  MediaAsset,
  MediaVersion,
  DistributionAgreement,
  DistributionRelease,
  DistributionRevenue,
  DistributionSettlement,
} from "./types";

export const APP_DATA_LOCAL_STORAGE_KEY = "flow-bender.demo-data.v7";

const APP_DATA_VERSION = 23;

function shiftDemoDatesTo2027(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(shiftDemoDatesTo2027);
    return;
  }
  if (!value || typeof value !== "object") return;
  Object.entries(value).forEach(([key, entry]) => {
    if (typeof entry === "string" && /date|at|updated|created|due|shoot|air|delivery|release/i.test(key)) {
      const normalized = entry.replace(/\b20\d{2}\b/g, "2027");
      (value as Record<string, unknown>)[key] = normalized;
    } else {
      shiftDemoDatesTo2027(entry);
    }
  });
}

const collectionKeys = [
  "scripts",
  "projects",
  "castMembers",
  "crewMembers",
  "scenes",
  "scriptVersions",
  "scheduleEntries",
  "shootDays",
  "callSheets",
  "seriesSeasons",
  "seriesEpisodes",
  "characters",
  "locations",
  "dprReports",
  "productionTasks",
  "equipmentInventory",
  "vendors",
  "budgetLineItems",
  "expenseItems",
  "payrollEntries",
  "postProductionItems",
  "vfxShots",
  "deliverables",
  "rightsDeals",
  "distributionAgreements",
  "distributionReleases",
  "distributionRevenue",
  "distributionSettlements",
  "marketingItems",
  "notifications",
  "attendanceRecords",
  "cameraCards",
  "storageDevices",
  "footageMetadata",
  "subtitleLanguages",
  "castCandidates",
  "castDecisionLog",
  "artistAvailability",
  "castContracts",
  "cateringAdjustments",
  "preProdChecklist",
  "richDprReports",
  "postProdMilestones",
  "calendarEvents",
  "crewAssignments",
  "remunerationAgreements",
  "crewPaymentRecords",
  "rentalVendors",
  "rentalRecords",
  "rentalPayments",
  "productionExpenses",
  "expensePayments",
  "officeRentals",
  "officeRentPayments",
  "maintenanceRecords",
  "filmLocations",
  "locationScouting",
  "locationAgreements",
  "locationPayments",
  "hotels",
  "hotelBookings",
  "hotelPayments",
  "trips",
  "travelPayments",
  "propItems",
  "propTransactions",
  "productionSets",
  "setTasks",
  "aiSetExtensionTasks",
  "aiSetExtensionVersions",
  "productionVehicles",
  "vehicleAllocations",
  "caravans",
  "caravanAllocations",
  "driverProfiles",
  "driverAssignments",
  "stuntPlans",
  "stuntSafetyChecklists",
  "stuntEquipment",
  "stuntEquipmentTransactions",
  "projectBudgets",
  "departmentBudgets",
  "budgetRevisions",
  "purchaseOrders",
  "reconciliationExceptions",
  "insurancePolicies",
  "equipmentAllocations",
  "equipmentMaintenance",
  "vfxVersions",
  "vfxReviews",
  "mediaAssets",
  "mediaVersions",
] as const;

export type AppDataCollectionKey = (typeof collectionKeys)[number];

export type AppDataCollections = {
  scripts: Script[];
  projects: Project[];
  castMembers: CastMember[];
  crewMembers: CrewMember[];
  scenes: Scene[];
  scriptVersions: ScriptVersion[];
  scheduleEntries: ScheduleEntry[];
  shootDays: ShootDay[];
  callSheets: CallSheet[];
  seriesSeasons: SeriesSeason[];
  seriesEpisodes: SeriesEpisode[];
  characters: CharacterProfile[];
  locations: ProjectLocation[];
  dprReports: DprReport[];
  productionTasks: ProductionTask[];
  equipmentInventory: EquipmentItem[];
  vendors: VendorRecord[];
  budgetLineItems: BudgetLineItem[];
  expenseItems: ExpenseItem[];
  payrollEntries: PayrollEntry[];
  postProductionItems: PostProductionItem[];
  vfxShots: VfxShot[];
  deliverables: DeliverableItem[];
  rightsDeals: RightsDeal[];
  distributionAgreements: DistributionAgreement[];
  distributionReleases: DistributionRelease[];
  distributionRevenue: DistributionRevenue[];
  distributionSettlements: DistributionSettlement[];
  marketingItems: MarketingItem[];
  notifications: Notification[];
  attendanceRecords: AttendanceRecord[];
  cameraCards: CameraCard[];
  storageDevices: StorageDevice[];
  footageMetadata: FootageMetadata[];
  subtitleLanguages: SubtitleLanguage[];
  castCandidates: CastCandidate[];
  castDecisionLog: CastDecisionLogEntry[];
  artistAvailability: ArtistAvailability[];
  castContracts: CastContract[];
  cateringAdjustments: CateringAdjustment[];
  preProdChecklist: PreProdChecklistItem[];
  richDprReports: DPRReport[];
  postProdMilestones: PostProdMilestone[];
  calendarEvents: CalendarEvent[];
  crewAssignments: CrewAssignment[];
  remunerationAgreements: RemunerationAgreement[];
  crewPaymentRecords: CrewPaymentRecord[];
  rentalVendors: Vendor[];
  rentalRecords: RentalRecord[];
  rentalPayments: RentalPayment[];
  productionExpenses: ProductionExpense[];
  expensePayments: ExpensePayment[];
  officeRentals: OfficeRental[];
  officeRentPayments: OfficeRentPayment[];
  maintenanceRecords: MaintenanceRecord[];
  filmLocations: FilmLocation[];
  locationScouting: LocationScouting[];
  locationAgreements: LocationAgreement[];
  locationPayments: LocationPayment[];
  hotels: Hotel[];
  hotelBookings: HotelBooking[];
  hotelPayments: HotelPayment[];
  trips: Trip[];
  travelPayments: TravelPayment[];
  propItems: PropItem[];
  propTransactions: PropTransaction[];
  productionSets: ProductionSet[];
  setTasks: SetTask[];
  aiSetExtensionTasks: AISetExtensionTask[];
  aiSetExtensionVersions: AISetExtensionVersion[];
  productionVehicles: ProductionVehicle[];
  vehicleAllocations: VehicleAllocation[];
  caravans: Caravan[];
  caravanAllocations: CaravanAllocation[];
  driverProfiles: DriverProfile[];
  driverAssignments: DriverAssignment[];
  stuntPlans: StuntPlan[];
  stuntSafetyChecklists: StuntSafetyChecklist[];
  stuntEquipment: StuntEquipment[];
  stuntEquipmentTransactions: StuntEquipmentTransaction[];
  projectBudgets: ProjectBudget[];
  departmentBudgets: DepartmentBudget[];
  budgetRevisions: BudgetRevision[];
  purchaseOrders: PurchaseOrder[];
  reconciliationExceptions: any[];
  insurancePolicies: InsurancePolicy[];
  equipmentAllocations: EquipmentAllocation[];
  equipmentMaintenance: EquipmentMaintenance[];
  vfxVersions: VfxVersion[];
  vfxReviews: VfxReview[];
  mediaAssets: MediaAsset[];
  mediaVersions: MediaVersion[];
};


export interface AppDataState extends AppDataCollections {
  version: number;
  updatedAt: string;
}

interface NormalizeResult {
  data: AppDataState;
  repaired: boolean;
  unresolvedKeys: Set<AppDataCollectionKey>;
}

interface AppDataExportPayload {
  app: "flow-bender";
  version: number;
  exportedAt: string;
  data: AppDataState;
}

const listeners = new Set<() => void>();
const seedRegistry: Partial<AppDataCollections> = createFlowBenderSeedData();

let unresolvedSeedKeys = new Set<AppDataCollectionKey>(collectionKeys);
let stateCache: AppDataState | null = null;
let storageListenerAttached = false;
let sharedHydrationStarted = false;
let sharedHydrationDone = false;
let pendingPersistState: AppDataState | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let visibleStateSource: AppDataState | null = null;
let visibleStateToken: string | null = null;
let visibleStateCache: AppDataState | null = null;

function canUseLocalStorage() {
  return typeof window !== "undefined";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function emptyCollections(): AppDataCollections {
  return {
    scripts: [],
    projects: [],
    castMembers: [],
    crewMembers: [],
    scenes: [],
    scriptVersions: [],
    scheduleEntries: [],
    shootDays: [],
    callSheets: [],
    seriesSeasons: [],
    seriesEpisodes: [],
    characters: [],
    locations: [],
    dprReports: [],
    productionTasks: [],
    equipmentInventory: [],
    vendors: [],
    budgetLineItems: [],
    expenseItems: [],
    payrollEntries: [],
    postProductionItems: [],
    vfxShots: [],
    deliverables: [],
    rightsDeals: [],
    distributionAgreements: [],
    distributionReleases: [],
    distributionRevenue: [],
    distributionSettlements: [],
    marketingItems: [],
    notifications: [],
    attendanceRecords: [],
    cameraCards: [],
    storageDevices: [],
    footageMetadata: [],
    subtitleLanguages: [],
    castCandidates: [],
    castDecisionLog: [],
    artistAvailability: [],
    castContracts: [],
    cateringAdjustments: [],
    preProdChecklist: [],
    richDprReports: [],
    postProdMilestones: [],
    calendarEvents: [],
    crewAssignments: [],
    remunerationAgreements: [],
    crewPaymentRecords: [],
    rentalVendors: [],
    rentalRecords: [],
    rentalPayments: [],
    productionExpenses: [],
    expensePayments: [],
    officeRentals: [],
    officeRentPayments: [],
    maintenanceRecords: [],
    filmLocations: [],
    locationScouting: [],
    locationAgreements: [],
    locationPayments: [],
    hotels: [],
    hotelBookings: [],
    hotelPayments: [],
    trips: [],
    travelPayments: [],
    propItems: [],
    propTransactions: [],
    productionSets: [],
    setTasks: [],
    aiSetExtensionTasks: [],
    aiSetExtensionVersions: [],
    productionVehicles: [],
    vehicleAllocations: [],
    caravans: [],
    caravanAllocations: [],
    driverProfiles: [],
    driverAssignments: [],
    stuntPlans: [],
    stuntSafetyChecklists: [],
    stuntEquipment: [],
    stuntEquipmentTransactions: [],
    projectBudgets: [],
    departmentBudgets: [],
    budgetRevisions: [],
    purchaseOrders: [],
    reconciliationExceptions: [],
    insurancePolicies: [],
    equipmentAllocations: [],
    equipmentMaintenance: [],
    vfxVersions: [],
    vfxReviews: [],
    mediaAssets: [],
    mediaVersions: [],
  };
}

function hasSeedForKey(key: AppDataCollectionKey) {
  return Object.prototype.hasOwnProperty.call(seedRegistry, key);
}

function createSeededSlice<K extends AppDataCollectionKey>(key: K): AppDataCollections[K] {
  const seed = seedRegistry[key];
  return seed ? cloneValue(seed) : ([] as unknown as AppDataCollections[K]);
}

function setCollection<K extends AppDataCollectionKey>(
  collections: AppDataCollections,
  key: K,
  value: AppDataCollections[K],
) {
  collections[key] = value;
}

function normalizeInput(value: unknown): NormalizeResult {
  const source = isRecord(value) && isRecord(value.data) ? value.data : value;
  const sourceRecord = isRecord(source) ? source : {};
  if (typeof sourceRecord.version === "number" && sourceRecord.version > APP_DATA_VERSION) {
    throw new Error("This data was saved by a newer version of flowbender. Update the app before opening it.");
  }
  const collections = emptyCollections();
  const unresolvedKeys = new Set<AppDataCollectionKey>();
  let repaired = !isRecord(source);
  const isLegacyVersion = typeof sourceRecord.version === "number" && sourceRecord.version < 5;

  for (const key of collectionKeys) {
    const slice = isLegacyVersion ? undefined : sourceRecord[key];

    if (Array.isArray(slice)) {
      const ids = new Set<string>();
      for (const item of slice) {
        if (!isRecord(item) || typeof item.id !== "string" || !item.id || ids.has(item.id)) {
          throw new Error(`Invalid ${key} data: every record must have a unique, non-empty ID.`);
        }
        ids.add(item.id);
      }
      const normalizedSlice = cloneValue(slice) as AppDataCollections[typeof key];
      if (key === "projects") {
        (normalizedSlice as Project[]).forEach((item) => {
          item.posterImage ??= null;
          item.thumbnailImage ??= null;
          item.bannerImage ??= null;
        });
      } else if (key === "castMembers") {
        (normalizedSlice as CastMember[]).forEach((item) => {
          item.profileImage ??= item.avatarUrl ?? null;
        });
      } else if (key === "crewMembers") {
        (normalizedSlice as CrewMember[]).forEach((item) => { item.profileImage ??= null; });
      } else if (key === "locations") {
        (normalizedSlice as ProjectLocation[]).forEach((item) => { item.coverImage ??= null; item.gallery ??= []; });
      } else if (key === "callSheets") {
        (normalizedSlice as CallSheet[]).forEach((item) => { item.projectImage ??= null; item.locationImage ??= null; });
      }
      setCollection(collections, key, normalizedSlice);
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(sourceRecord, key)) {
      throw new Error(`Invalid ${key} data: expected a collection.`);
    }
    const seed = createSeededSlice(key);
    const projectIds = new Set(collections.projects.map((project) => project.id));
    const sourceProjects = Array.isArray(sourceRecord.projects) ? sourceRecord.projects : seedRegistry.projects ?? [];
    sourceProjects.forEach((project) => {
      if (isRecord(project) && typeof project.id === "string") projectIds.add(project.id);
    });
    setCollection(collections, key, seed.filter((record) =>
      !("projectId" in record) || !record.projectId || projectIds.has(record.projectId)
    ) as AppDataCollections[typeof key]);
    repaired = true;

    if (!hasSeedForKey(key)) {
      unresolvedKeys.add(key);
    }
  }

  // Add the new, independently identified demo bundle only once. Explicit empty
  // collections are intentional; don't resurrect deleted records or their links.
  const canAddLinkedDemo = ["scenes", "shootDays", "scheduleEntries", "callSheets", "castMembers", "crewMembers", "locations", "vendors"]
    .every((key) => Array.isArray(sourceRecord[key]) && (sourceRecord[key] as unknown[]).length > 0);
  if (typeof sourceRecord.version === "number" && sourceRecord.version < 4 && canAddLinkedDemo) {
    const eligibleProjects = new Set(collections.projects.filter((project) =>
      seedRegistry.projects?.some((seed) => seed.id === project.id && seed.title === project.title && seed.director === project.director)
    ).map((project) => project.id));
    for (const key of collectionKeys) {
      if (key === "projects" || key === "notifications" || key === "seriesSeasons" || key === "seriesEpisodes") continue;
      const original = sourceRecord[key];
      if (!Array.isArray(original) || original.length === 0) continue;
      const slice = collections[key] as Array<{ id: string; projectId?: string }>;
      const existingIds = new Set(slice.map((record) => record.id));
      const additions = (seedRegistry[key] as Array<{ id: string; projectId?: string }> | undefined)?.filter((record) =>
        record.projectId && eligibleProjects.has(record.projectId) && !existingIds.has(record.id)
      ) ?? [];
      if (additions.length) {
        slice.push(...cloneValue(additions));
        repaired = true;
      }
    }
  }

  // Enrich existing demo workspaces with the complete project coverage and
  // rolling three-month demo schedule. Existing user edits win; only missing
  // records and missing media are filled from the seed.
  if (typeof sourceRecord.version === "number" && sourceRecord.version < 14) {
    const demoProjectIds = new Set((seedRegistry.projects ?? []).map((project) => project.id));
    const mediaKeys: AppDataCollectionKey[] = ["projects", "castMembers", "crewMembers"];

    mediaKeys.forEach((key) => {
      const target = collections[key] as unknown as Array<Record<string, unknown>>;
      const seededById = new Map(
        ((seedRegistry[key] as Array<Record<string, unknown>> | undefined) ?? []).map((record) => [record.id, record]),
      );
      target.forEach((record) => {
        const seeded = seededById.get(record.id);
        if (!seeded) return;
        const mediaField = key === "projects" ? "posterImage" : "profileImage";
        const isLegacyCrewPortrait =
          key === "crewMembers" &&
          typeof record[mediaField] === "string" &&
          /unsplash\.com|wikimedia\.org/.test(record[mediaField] as string);
        if ((!record[mediaField] || isLegacyCrewPortrait) && seeded[mediaField]) {
          record[mediaField] = seeded[mediaField];
          if (key === "projects") {
            record.thumbnailImage ??= seeded.thumbnailImage;
            record.bannerImage ??= seeded.bannerImage;
            record.releaseDate ??= seeded.releaseDate;
           }

          repaired = true;
        }
        if ((key === "castMembers" || key === "crewMembers") && !record.projectTitle && seeded.projectTitle) {
          record.projectTitle = seeded.projectTitle;
          repaired = true;
        }
      });
    });
    const seededProjects = new Map(
      ((seedRegistry.projects as Array<Record<string, unknown>> | undefined) ?? []).map((record) => [record.id, record]),
    );
    (collections.projects as unknown as Array<Record<string, unknown>>).forEach((record) => {
      const seeded = seededProjects.get(record.id);
      if (seeded && !record.releaseDate && seeded.releaseDate) {
        record.releaseDate = seeded.releaseDate;
        repaired = true;
      }
      if (seeded && typeof seeded.startDate === "string" && typeof seeded.endDate === "string") {
        record.startDate = seeded.startDate;
        record.endDate = seeded.endDate;
        record.releaseDate = seeded.releaseDate;
        repaired = true;
      }
    });

    for (const key of collectionKeys) {
      if (key === "projects" || key === "notifications" || key === "seriesSeasons" || key === "seriesEpisodes") continue;
      const target = collections[key] as Array<{ id: string; projectId?: string }>;
      const existingIds = new Set(target.map((record) => record.id));
      const additions = ((seedRegistry[key] as Array<{ id: string; projectId?: string }> | undefined) ?? []).filter(
        (record) => record.projectId && demoProjectIds.has(record.projectId) && !existingIds.has(record.id),
      );
      if (additions.length) {
        target.push(...cloneValue(additions));
        repaired = true;
      }
    }

    shiftDemoDatesTo2027(collections);
    repaired = true;

    // Remove stale remote portraits from seeded crew records. Crew has no
    // verified portrait registry, so a remote actor image is worse than the
    // deterministic role artwork supplied by the seed. Data URLs are retained
    // because they represent an image uploaded by the user.
    if (typeof sourceRecord.version === "number" && sourceRecord.version < 9) {
      const seededCrew = new Map(
        ((seedRegistry.crewMembers as Array<Record<string, unknown>> | undefined) ?? []).map((record) => [record.id, record]),
      );
      (collections.crewMembers as unknown as Array<Record<string, unknown>>).forEach((record) => {
        const seeded = seededCrew.get(record.id);
        const profileImage = record.profileImage;
        if (
          seeded &&
          typeof profileImage === "string" &&
          /^https?:\/\//i.test(profileImage) &&
          typeof seeded.profileImage === "string"
        ) {
          record.profileImage = seeded.profileImage;
          repaired = true;
        }
      });
    }
  }

  const version = typeof sourceRecord.version === "number" ? sourceRecord.version : APP_DATA_VERSION;
  const updatedAt =
    typeof sourceRecord.updatedAt === "string" ? sourceRecord.updatedAt : new Date().toISOString();

  if (version !== APP_DATA_VERSION) {
    repaired = true;
  }

  return {
    data: {
      version: APP_DATA_VERSION,
      updatedAt,
      ...collections,
    },
    repaired,
    unresolvedKeys,
  };
}

function attachStorageListener() {
  if (!canUseLocalStorage() || storageListenerAttached) {
    return;
  }

  window.addEventListener("storage", (event) => {
    if (event.key !== APP_DATA_LOCAL_STORAGE_KEY) {
      return;
    }

    try {
      const normalized = normalizeInput(event.newValue ? JSON.parse(event.newValue) : {});
      stateCache = normalized.data;
      unresolvedSeedKeys = normalized.unresolvedKeys;
      emitChange();
    } catch (error) {
      console.error("Unable to read data changed in another tab; the current view was preserved.", error);
      window.dispatchEvent(new CustomEvent("flowbender:persistence-error", {
        detail: "Another tab saved unreadable data. Your current view was preserved; reload only after exporting a backup.",
      }));
    }
  });

  storageListenerAttached = true;
}

// Saves go to data/flowbender-demo-data.json via /api/demo-data (no database yet).
// Writes are held until the shared copy has loaded so seed data never overwrites the file.
function persistState(state: AppDataState) {
  if (typeof window === "undefined") return;
  pendingPersistState = state;
  if (!sharedHydrationDone) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(flushPersistState, 300);
}

function flushPersistState() {
  persistTimer = null;
  const state = pendingPersistState;
  if (!state) return;
  pendingPersistState = null;

  void fetch("/api/demo-data", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: state }),
  })
    .then((response) => {
      if (!response.ok) throw new Error(`Saving shared demo data failed (${response.status}).`);
    })
    .catch((error) => {
      console.error("Unable to save flowbender data to the JSON file.", error);
      window.dispatchEvent(new CustomEvent("flowbender:persistence-error", {
        detail: "Your last change could not be saved to the server. Export a backup before reloading.",
      }));
    });
}

function hydrateSharedState(localState: AppDataState, hadLocalState: boolean) {
  if (sharedHydrationStarted) return;
  sharedHydrationStarted = true;

  void fetch("/api/demo-data", { cache: "no-store" })
    .then(async (response) => {
      if (response.status === 404) {
        // No JSON file yet: create it from the current (seeded or edited) state.
        sharedHydrationDone = true;
        persistState(pendingPersistState ?? localState);
        return;
      }
      if (!response.ok) throw new Error(`Shared demo data request failed (${response.status}).`);
      const payload = await response.json() as { data?: unknown };
      sharedHydrationDone = true;
      if (!payload.data) {
        if (pendingPersistState) persistState(pendingPersistState);
        return;
      }
      // The JSON file is the source of truth; edits made before it loaded are dropped.
      pendingPersistState = null;
      commitState(normalizeInput(payload.data).data, false);
    })
    .catch((error) => {
      console.error("Unable to load shared flowbender demo data; using this browser's local copy.", error);
    });
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function commitState(value: unknown, persist = true): AppDataState {
  const normalized = normalizeInput(value);
  const nextState: AppDataState = {
    ...normalized.data,
    updatedAt: new Date().toISOString(),
  };

  if (persist) {
    persistState(nextState);
  }

  stateCache = nextState;
  unresolvedSeedKeys = normalized.unresolvedKeys;
  emitChange();

  return cloneValue(nextState);
}

function loadState(): AppDataState {
  if (!canUseLocalStorage()) {
    return normalizeInput({}).data;
  }

  // User requested to disable browser storage for demos, always load fresh
  const state = commitState({}, false);
  hydrateSharedState(state, false);
  return state;
}

function getStateSnapshot(): AppDataState {
  if (!stateCache) {
    stateCache = loadState();
  }

  return stateCache;
}

function getServerSnapshot(): AppDataState {
  return serverSnapshot;
}

const serverSnapshot = normalizeInput({}).data;

export function registerAppDataSeed<K extends AppDataCollectionKey>(key: K, seed: AppDataCollections[K]) {
  seedRegistry[key] = cloneValue(seed);

  if (stateCache && unresolvedSeedKeys.has(key)) {
    const nextState = {
      ...stateCache,
      [key]: createSeededSlice(key),
    };
    persistState(nextState);
    stateCache = nextState;
    unresolvedSeedKeys.delete(key);
    emitChange();
  }
}

export function subscribeAppData(listener: () => void) {
  attachStorageListener();
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getAppData(): AppDataState {
  return cloneValue(getStateSnapshot());
}

function getVisibleAppData(data: AppDataState): AppDataState {
  if (typeof window === "undefined") return data;
  const token = getAccessToken();
  if (visibleStateSource === data && visibleStateToken === token && visibleStateCache) return visibleStateCache;
  const account = getDemoAccountForUser(getDemoUserFromToken());
  if (!account || account.role === "Producer") {
    visibleStateSource = data;
    visibleStateToken = token;
    visibleStateCache = data;
    return data;
  }
  const allowed = new Set(account.assignedProjectIds);
  const visible = { ...data };
  collectionKeys.forEach((key) => {
    const records = data[key] as Array<{ projectId?: string }>;
    (visible[key] as Array<{ projectId?: string }>) = records.filter((record) => !record.projectId || allowed.has(record.projectId));
  });
  visible.projects = data.projects.filter((project) => allowed.has(project.id));
  visibleStateSource = data;
  visibleStateToken = token;
  visibleStateCache = visible;
  return visible;
}

export function emitAppDataChange() {
  emitChange();
}

export function getAppDataSlice<K extends AppDataCollectionKey>(key: K): AppDataCollections[K] {
  return cloneValue(getStateSnapshot()[key]);
}

export function updateAppData(updater: (current: AppDataState) => AppDataState): AppDataState {
  return commitState(updater(getAppData()), true);
}

export function updateAppDataSlice<K extends AppDataCollectionKey>(
  key: K,
  updater: (current: AppDataCollections[K]) => AppDataCollections[K]
): AppDataCollections[K] {
  const nextState = updateAppData((current) => ({
    ...current,
    [key]: updater(current[key]),
  }));

  return cloneValue(nextState[key]);
}

export function resetAppData(): AppDataState {
  return commitState({}, true);
}

export function exportAppData(): string {
  const payload: AppDataExportPayload = {
    app: "flow-bender",
    version: APP_DATA_VERSION,
    exportedAt: new Date().toISOString(),
    data: getAppData(),
  };

  return JSON.stringify(payload, null, 2);
}

export function importAppData(serialized: string): AppDataState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error("Invalid flowbender data file.");
  }
  if (!isRecord(parsed) || (parsed.app !== undefined && parsed.app !== "flow-bender")) {
    throw new Error("This is not a flowbender data export.");
  }
  const source = isRecord(parsed.data) ? parsed.data : parsed;
  if (!Array.isArray(source.projects) || !collectionKeys.some((key) => Array.isArray(source[key]))) {
    throw new Error("This file does not contain flowbender project data.");
  }
  return commitState(parsed, true);
}

export function useAppDataSelector<T>(selector: (data: AppDataState) => T): T {
  const data = useSyncExternalStore(
    subscribeAppData,
    () => getVisibleAppData(getStateSnapshot()),
    getServerSnapshot
  );

  return useMemo(() => selector(data), [data, selector]);
}

export function useAppDataSlice<K extends AppDataCollectionKey>(key: K): AppDataCollections[K] {
  return useAppDataSelector((data) => data[key]);
}

export function useAppDataCounts() {
  const data = useAppDataSelector((state) => state);

  return useMemo(
    () => ({
      projects: data.projects.length,
      scripts: data.scripts.length,
      castMembers: data.castMembers.length,
      crewMembers: data.crewMembers.length,
      scenes: data.scenes.length,
      scriptVersions: data.scriptVersions.length,
      scheduleEntries: data.scheduleEntries.length,
      shootDays: data.shootDays.length,
      callSheets: data.callSheets.length,
      notifications: data.notifications.length,
      extraRecords:
        data.seriesSeasons.length +
        data.seriesEpisodes.length +
        data.characters.length +
        data.locations.length +
        data.dprReports.length +
        data.productionTasks.length +
        data.equipmentInventory.length +
        data.vendors.length +
        data.budgetLineItems.length +
        data.expenseItems.length +
        data.payrollEntries.length +
        data.postProductionItems.length +
        data.vfxShots.length +
        data.deliverables.length +
        data.rightsDeals.length +
        data.marketingItems.length +
        data.attendanceRecords.length +
        data.cameraCards.length +
        data.storageDevices.length +
        data.footageMetadata.length +
        data.subtitleLanguages.length,
      totalRecords:
        data.projects.length +
        data.scripts.length +
        data.castMembers.length +
        data.crewMembers.length +
        data.scenes.length +
        data.scriptVersions.length +
        data.scheduleEntries.length +
        data.shootDays.length +
        data.callSheets.length +
        data.seriesSeasons.length +
        data.seriesEpisodes.length +
        data.characters.length +
        data.locations.length +
        data.dprReports.length +
        data.productionTasks.length +
        data.equipmentInventory.length +
        data.vendors.length +
        data.budgetLineItems.length +
        data.expenseItems.length +
        data.payrollEntries.length +
        data.postProductionItems.length +
        data.vfxShots.length +
        data.deliverables.length +
        data.rightsDeals.length +
        data.marketingItems.length +
        data.notifications.length +
        data.attendanceRecords.length +
        data.cameraCards.length +
        data.storageDevices.length +
        data.footageMetadata.length +
        data.subtitleLanguages.length,
      updatedAt: data.updatedAt,
    }),
    [data],
  );
}
