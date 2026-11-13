import {
  getAppDataSlice,
  updateAppData,
  updateAppDataSlice,
  type AppDataState,
  useAppDataSelector,
  useAppDataSlice,
} from "./app-data-store";
import type { CallSheet, CallSheetScene, CallSheetStatus, CallSheetWorkflow } from "./types";

const seedCallSheets: CallSheet[] = [
  {
    id: "CS-2026-001",
    project: "Project Phoenix",
    workflow: "Feature Film",
    shootDay: 38,
    date: "2026-09-18",
    location: "Ramoji Film City · Stage 4",
    director: "Rajkumar Menon",
    ad: "Leena Sharma",
    cast: 8,
    crew: 42,
    status: "Published",
    updated: "Today, 09:42",
    notes: "Golden hour exterior first. Keep the unit compact between setups.",
    scenes: [
      {
        number: "42",
        description: "EXT. CHARMINAR STREET",
        setting: "EXT",
        time: "DAY",
        pages: 2.375,
        characters: "Arjun, Meera",
        duration: "2h 30m",
        status: "Scheduled",
      },
      {
        number: "43",
        description: "INT. OLD DELHI KITCHEN",
        setting: "INT",
        time: "DAY",
        pages: 3,
        characters: "Arjun, Tariq",
        duration: "3h",
        status: "Scheduled",
      },
    ],
  },
  {
    id: "CS-2026-002",
    project: "Project Phoenix",
    workflow: "Feature Film",
    shootDay: 39,
    date: "2026-09-19",
    location: "Ramoji Film City · Backlot",
    director: "Rajkumar Menon",
    ad: "Leena Sharma",
    cast: 6,
    crew: 39,
    status: "Revised",
    updated: "Yesterday, 18:10",
    notes: "Location changed after permit review.",
    scenes: [
      {
        number: "44",
        description: "EXT. MARKET LANE",
        setting: "EXT",
        time: "DAY",
        pages: 4,
        characters: "Meera, Ensemble",
        duration: "4h",
        status: "Scheduled",
      },
    ],
  },
  {
    id: "CS-2026-003",
    project: "Project Horizon",
    workflow: "OTT / Web Series",
    shootDay: 12,
    date: "2026-09-22",
    location: "Floor 2 · Spacecraft Set",
    director: "Anvita Dutt",
    ad: "Sanjay Rao",
    cast: 5,
    crew: 36,
    status: "Draft",
    updated: "2 hours ago",
    notes: "Episode 04 — The Return. Confirm VFX playback before cast call.",
    scenes: [
      {
        number: "S01E04-18",
        description: "INT. OBSERVATION DECK",
        setting: "INT",
        time: "NIGHT",
        pages: 3.5,
        characters: "Maya, Kabir",
        duration: "3h 30m",
        status: "Draft",
      },
    ],
  },
  {
    id: "CS-2026-004",
    project: "Daily Star",
    workflow: "TV Episode",
    shootDay: 128,
    date: "2026-09-25",
    location: "Studio 7 · Hyderabad",
    director: "Madhav Rao",
    ad: "Priya Thomas",
    cast: 12,
    crew: 28,
    status: "Completed",
    updated: "25 Aug 2026",
    notes: "Episode 128 closed.",
    scenes: [
      {
        number: "128-06",
        description: "INT. FAMILY HALL",
        setting: "INT",
        time: "DAY",
        pages: 5,
        characters: "Full Cast",
        duration: "5h",
        status: "Completed",
      },
    ],
  },
];

export const callSheetWorkflowOptions: CallSheetWorkflow[] = [
  "Feature Film",
  "OTT / Web Series",
  "TV Series",
  "TV Episode",
  "Short Film",
  "Music Video",
];


function cloneScenes(scenes: CallSheetScene[]) {
  return scenes.map((scene) => ({ ...scene }));
}

function nextCallSheetId(sheets: CallSheet[]) {
  const currentYear = new Date().getFullYear();
  const nextSequence = sheets.reduce((highest, sheet) => {
    const match = sheet.id.match(/^CS-\d{4}-(\d+)$/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0) + 1;

  return `CS-${currentYear}-${String(nextSequence).padStart(3, "0")}`;
}

export interface CreateCallSheetInput {
  project: string;
  workflow: CallSheetWorkflow;
  shootDay: number;
  date: string;
  location: string;
  director: string;
  ad: string;
  cast: number;
  crew: number;
  notes: string;
  scenes: CallSheetScene[];
  status?: CallSheetStatus;
  updated?: string;
  projectId?: string;
  shootDayId?: string;
  callTime?: string;
  firstShot?: string;
  packUp?: string;
  sceneIds?: string[];
  castAssignments?: CallSheet["castAssignments"];
  crewAssignments?: CallSheet["crewAssignments"];
  locationIds?: string[];
  locations?: CallSheet["locations"];
  schedule?: CallSheet["schedule"];
  transport?: CallSheet["transport"];
  catering?: CallSheet["catering"];
  equipment?: CallSheet["equipment"];
  projectImage?: string | null;
  locationImage?: string | null;
}

export function getCallSheets(): CallSheet[] {
  return getAppDataSlice("callSheets");
}

export function getCallSheetById(id: string): CallSheet | undefined {
  return getCallSheets().find((sheet) => sheet.id === id);
}

function syncCallSheetStatus(data: AppDataState, dayIds: Array<string | undefined>): AppDataState {
  const affected = new Set(dayIds.filter(Boolean));
  const shootDays = data.shootDays.map((day) => {
    if (!affected.has(day.id)) return day;
    const sheets = data.callSheets.filter((sheet) => sheet.shootDayId === day.id);
    const callSheetStatus = sheets.some((sheet) => ["Published", "Revised", "Completed"].includes(sheet.status))
      ? "published" as const : sheets.length ? "draft" as const : "pending" as const;
    return { ...day, callSheetStatus };
  });
  return {
    ...data, shootDays,
    scheduleEntries: data.scheduleEntries.map((entry) => {
      const day = shootDays.find((item) => affected.has(item.id) && entry.id === `se-${item.id}`);
      return day ? { ...entry, callSheetStatus: day.callSheetStatus } : entry;
    }),
  };
}

export function createCallSheet(input: CreateCallSheetInput): CallSheet {
  const sheet: CallSheet = {
    id: nextCallSheetId(getCallSheets()),
    project: input.project,
    workflow: input.workflow,
    shootDay: input.shootDay,
    date: input.date,
    location: input.location,
    director: input.director,
    ad: input.ad,
    cast: input.cast,
    crew: input.crew,
    status: input.status ?? "Draft",
    updated: input.updated ?? new Date().toISOString(),
    notes: input.notes,
    scenes: cloneScenes(input.scenes),
    projectId: input.projectId,
    shootDayId: input.shootDayId,
    version: 1,
    callTime: input.callTime,
    firstShot: input.firstShot,
    packUp: input.packUp,
    sceneIds: input.sceneIds ?? [],
    castAssignments: input.castAssignments ?? [],
    crewAssignments: input.crewAssignments ?? [],
    locationIds: input.locationIds ?? [],
    locations: input.locations ?? [],
    schedule: input.schedule ?? [],
    transport: input.transport ?? [],
    catering: input.catering ?? [],
    equipment: input.equipment ?? [],
    projectImage: input.projectImage ?? null,
    locationImage: input.locationImage ?? null,
    revisions: [],
  };

  updateAppData((current) => syncCallSheetStatus({ ...current, callSheets: [sheet, ...current.callSheets] }, [sheet.shootDayId]));
  return sheet;
}

export function updateCallSheet(
  id: string,
  updates: Partial<Omit<CallSheet, "id">>
): CallSheet | undefined {
  let updatedSheet: CallSheet | undefined;

  updateAppData((current) => {
    const previous = current.callSheets.find((sheet) => sheet.id === id);
    const callSheets = current.callSheets.map((sheet) => {
      if (sheet.id !== id) {
        return sheet;
      }

      updatedSheet = {
        ...sheet,
        ...updates,
        updated: updates.updated ?? new Date().toISOString(),
        scenes: updates.scenes ? cloneScenes(updates.scenes) : cloneScenes(sheet.scenes),
      };

      return updatedSheet;
    });
    return syncCallSheetStatus({ ...current, callSheets }, [previous?.shootDayId, updatedSheet?.shootDayId]);
  });

  return updatedSheet;
}

export function duplicateCallSheet(id: string): CallSheet | undefined {
  const source = getCallSheetById(id);

  if (!source) {
    return undefined;
  }

  const duplicate: CallSheet = {
    ...source, id: nextCallSheetId(getCallSheets()), status: "Draft",
    version: 1, revisions: [], updated: new Date().toISOString(),
  };
  updateAppData((current) => syncCallSheetStatus({ ...current, callSheets: [duplicate, ...current.callSheets] }, [duplicate.shootDayId]));
  return duplicate;
}

export function deleteCallSheet(id: string) {
  updateAppData((current) => {
    const source = current.callSheets.find((sheet) => sheet.id === id);
    return syncCallSheetStatus({ ...current, callSheets: current.callSheets.filter((sheet) => sheet.id !== id) }, [source?.shootDayId]);
  });
}

export function createCallSheetRevision(id: string, reason = "Production update"): CallSheet | undefined {
  const source = getCallSheetById(id);
  if (!source) return undefined;
  const version = (source.version ?? 1) + 1;
  const revision = {
    version,
    date: new Date().toISOString(),
    changedBy: "Production Manager",
    reason,
    status: "Revised" as CallSheetStatus,
  };
  return updateCallSheet(id, {
    version,
    status: "Revised",
    revisions: [...(source.revisions ?? []), revision],
  });
}

export function useCallSheets() {
  return useAppDataSlice("callSheets");
}

export function useCallSheet(id: string) {
  return useAppDataSelector((data) => data.callSheets.find((sheet) => sheet.id === id));
}
