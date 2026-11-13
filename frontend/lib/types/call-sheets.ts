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
