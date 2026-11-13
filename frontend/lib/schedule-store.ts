import type { ScheduleConflict, ScheduleEntry, ShootDay, ShootDayCrewReq, ShootDayEquipment, ShootDayScene, ShootDayStatus } from "./types";
import {
  getAppDataSlice,
  updateAppData,
  type AppDataState,
  useAppDataSelector,
  useAppDataSlice,
} from "./app-data-store";

export const shootDayStatusLabels: Record<ShootDayStatus, string> = {
  planned: "Planned",
  confirmed: "Confirmed",
  "in-progress": "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const shootDayStatusColors: Record<ShootDayStatus, string> = {
  planned: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  confirmed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "in-progress": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

export const shootDayStatusDot: Record<ShootDayStatus, string> = {
  planned: "bg-zinc-400",
  confirmed: "bg-emerald-400",
  "in-progress": "bg-amber-400",
  completed: "bg-blue-400",
  cancelled: "bg-red-400",
};

function eq(name: string, notes?: string): ShootDayEquipment {
  return { id: `eq-${Math.random().toString(36).slice(2, 8)}`, name, notes };
}

function scheduleEntryId(dayId: string) {
  return `se-${dayId}`;
}

function formatScheduleSceneNumber(sceneNumber: string) {
  if (sceneNumber.startsWith("Sc.") || sceneNumber.startsWith("Ep")) {
    return sceneNumber;
  }

  return `Sc. ${sceneNumber}`;
}

function scheduleStatusFromShootDay(day: ShootDay): ScheduleEntry["status"] {
  switch (day.status) {
    case "completed":
      return "completed";
    case "cancelled":
      return "postponed";
    case "in-progress":
      return "shooting";
    default:
      return "scheduled";
  }
}

function toScheduleEntry(day: ShootDay): ScheduleEntry {
  return {
    id: scheduleEntryId(day.id),
    projectId: day.projectId,
    projectTitle: day.projectTitle,
    date: day.date,
    callTime: day.callTime,
    location: day.location,
    scenes: day.scenes.map((scene) => formatScheduleSceneNumber(scene.sceneNumber)),
    shootDayNumber: day.shootDayNumber,
    totalShootDays: day.totalShootDays,
    callSheetStatus: day.callSheetStatus,
    status: scheduleStatusFromShootDay(day),
  };
}

function upsertScheduleEntry(entries: ScheduleEntry[], day: ShootDay) {
  const nextEntry = toScheduleEntry(day);
  const existingIndex = entries.findIndex((entry) => entry.id === nextEntry.id);

  if (existingIndex === -1) {
    return [...entries, nextEntry].sort((a, b) => a.date.localeCompare(b.date));
  }

  return entries.map((entry, index) => (index === existingIndex ? nextEntry : entry));
}

function reconcileProjectSchedule(current: AppDataState, shootDays: ShootDay[], projectIds: string[]) {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return current.projects.map((project) => {
      if (!projectIds.includes(project.id)) return project;
      const days = shootDays.filter((day) => day.projectId === project.id && day.shootDayNumber > 0);
      const previousCompleted = current.shootDays.filter((day) => day.projectId === project.id && day.shootDayNumber > 0 && day.status === "completed").length;
      const completedDelta = days.filter((day) => day.status === "completed").length - previousCompleted;
      const totalShootDays = Math.max(project.totalShootDays, days.length, ...days.map((day) => day.shootDayNumber));
      const completedShootDays = Math.max(0, Math.min(totalShootDays, project.completedShootDays + completedDelta));
      return {
        ...project, totalShootDays, completedShootDays,
        shootProgress: totalShootDays ? Math.round(completedShootDays / totalShootDays * 100) : 0,
        nextShootDate: days.filter((day) => day.date >= today && day.status !== "completed" && day.status !== "cancelled")
          .map((day) => day.date).sort()[0] ?? null,
      };
    });
  }

const seedShootDays: ShootDay[] = [
  // ===== Antariksha (p1) — completed days =====
  {
    id: "sd-1", projectId: "p1", projectTitle: "Antariksha",
    date: "2026-06-16", shootDayNumber: 2, totalShootDays: 65,
    callTime: "06:00", wrapTime: "18:30",
    location: "Floor 1 — Mission Control", locationAddress: "Mumbai Film City, Goregaon, Mumbai",
    scenes: [
      { sceneNumber: "1", heading: "EARTH — DEEP SPACE ARRAY — CONTROL ROOM", pages: 2.5, intExt: "INT", characters: ["Dr. Vikram Sahay", "Technician #1", "Technician #2"] },
    ],
    castRequired: ["Rajkummar Rao"],
    crewRequired: [
      { department: "Camera", role: "DP", name: "Ravi Varman" },
      { department: "Direction", role: "1st AD", name: "Leena Sharma" },
      { department: "Sound", role: "Sound Mixer", name: "Resul Pookutty" },
      { department: "Lighting", role: "Gaffer", name: "Deepak Bhatia" },
    ],
    equipment: [eq("ARRI Alexa 35 (A-cam)"), eq("ARRI Alexa 35 (B-cam)"), eq("SkyPanel S60 x6"), eq("Practical LED screens x4")],
    status: "completed", callSheetStatus: "published", totalPages: 2.5, notes: "Wrapped 15 min ahead of schedule.",
    conflicts: [],
  },
  {
    id: "sd-2", projectId: "p1", projectTitle: "Antariksha",
    date: "2026-06-18", shootDayNumber: 4, totalShootDays: 65,
    callTime: "08:00", wrapTime: "17:00",
    location: "Practical Location — Bandra House", locationAddress: "742 Carter Road, Bandra West, Mumbai",
    scenes: [
      { sceneNumber: "2", heading: "ARIA'S HOUSE — LIVING ROOM", pages: 1.5, intExt: "INT", characters: ["Commander Aria Singh"] },
    ],
    castRequired: ["Deepika Padukone"],
    crewRequired: [
      { department: "Camera", role: "DP", name: "Ravi Varman" },
      { department: "Direction", role: "1st AD", name: "Leena Sharma" },
      { department: "Costume", role: "Costume Designer", name: "Sheetal Sharma" },
    ],
    equipment: [eq("ARRI Alexa 35 (A-cam)"), eq("Practical lighting kit"), eq("Dolly (Fisher 10)")],
    status: "completed", callSheetStatus: "published", totalPages: 1.5, notes: "Quiet, intimate scene. Minimal crew on set.",
    conflicts: [],
  },

  // ===== Today — Day 34 =====
  {
    id: "sd-34", projectId: "p1", projectTitle: "Antariksha",
    date: "2026-09-04", shootDayNumber: 34, totalShootDays: 65,
    callTime: "06:00", wrapTime: "19:00",
    location: "Floor 4 — Spacecraft Interior", locationAddress: "Mumbai Film City, Goregaon, Mumbai",
    scenes: [
      { sceneNumber: "42", heading: "SPACECRAFT — BRIDGE", pages: 5, intExt: "INT", characters: ["Commander Aria Singh", "Dr. Vikram Sahay", "Captain Yuki Tanaka"] },
      { sceneNumber: "43", heading: "SPACECRAFT — BRIDGE", pages: 2.5, intExt: "INT", characters: ["Commander Aria Singh", "Dr. Vikram Sahay", "Captain Yuki Tanaka"] },
    ],
    castRequired: ["Deepika Padukone", "Rajkummar Rao", "Vikrant Massey"],
    crewRequired: [
      { department: "Camera", role: "DP", name: "Ravi Varman" },
      { department: "Camera", role: "1st AC", name: "Anil Mehta" },
      { department: "Direction", role: "1st AD", name: "Leena Sharma" },
      { department: "Sound", role: "Sound Mixer", name: "Resul Pookutty" },
      { department: "Lighting", role: "Gaffer", name: "Deepak Bhatia" },
      { department: "VFX", role: "VFX Supervisor", name: "Keitan Yadav" },
      { department: "Makeup", role: "Head Makeup", name: "Preeti Sagar" },
      { department: "Production Design", role: "Production Designer", name: "Shruti Gupte" },
    ],
    equipment: [
      eq("ARRI Alexa 35 (A-cam)"), eq("ARRI Alexa 35 (B-cam)"),
      eq("Camera gimbal rig — ship movement"), eq("SkyPanel S60 x8"),
      eq("Emergency red lighting practicals"), eq("LED wall — starfield viewport"),
    ],
    status: "in-progress", callSheetStatus: "published", totalPages: 7.5,
    notes: "Pivotal first contact sequence. High tension — keep energy building. Two-camera setup throughout.",
    conflicts: [],
  },

  // ===== Upcoming days =====
  {
    id: "sd-35", projectId: "p1", projectTitle: "Antariksha",
    date: "2026-09-05", shootDayNumber: 35, totalShootDays: 65,
    callTime: "07:00", wrapTime: "19:30",
    location: "Backlot — Ladakh Exterior", locationAddress: "Mumbai Film City Backlot, Goregaon",
    scenes: [
      { sceneNumber: "15", heading: "MOJAVE LAUNCH FACILITY — EXTERIOR", pages: 1.5, intExt: "EXT", characters: ["Commander Aria Singh"] },
      { sceneNumber: "16", heading: "LAUNCH FACILITY — HANGAR", pages: 2, intExt: "INT", characters: ["Commander Aria Singh", "Captain Yuki Tanaka"] },
      { sceneNumber: "17", heading: "LAUNCH FACILITY — COMMS ROOM", pages: 3, intExt: "INT", characters: ["Commander Aria Singh", "Professor Edmund Hale"] },
    ],
    castRequired: ["Deepika Padukone", "Vikrant Massey", "Naseeruddin Shah"],
    crewRequired: [
      { department: "Camera", role: "DP", name: "Ravi Varman" },
      { department: "Camera", role: "1st AC", name: "Anil Mehta" },
      { department: "Direction", role: "1st AD", name: "Leena Sharma" },
      { department: "VFX", role: "VFX Supervisor", name: "Keitan Yadav" },
      { department: "Transport", role: "Transport Captain", name: "Rajesh Yadav" },
    ],
    equipment: [
      eq("ARRI Alexa 35 (A-cam)"), eq("Dust FX fan rigs x2"),
      eq("Black SUV convoy (3)"), eq("Military Humvee"),
      eq("Helicopter (aerial pass)"), eq("Video call satellite link"),
    ],
    status: "confirmed", callSheetStatus: "published", totalPages: 6.5,
    notes: "Ladakh exteriors first — golden hour for establishing. Naseeruddin shoots remotely from Delhi studio.",
    conflicts: [
      { type: "cast-overlap", message: "Naseeruddin Shah remote from Delhi — confirm satellite link 48hrs before", severity: "warning" },
    ],
  },
  {
    id: "sd-36", projectId: "p1", projectTitle: "Antariksha",
    date: "2026-09-06", shootDayNumber: 36, totalShootDays: 65,
    callTime: "05:30", wrapTime: "17:00",
    location: "Floor 2 — Lab Set", locationAddress: "Mumbai Film City, Goregaon, Mumbai",
    scenes: [
      { sceneNumber: "28", heading: "SPACECRAFT — SCIENCE LAB", pages: 3, intExt: "INT", characters: ["Dr. Vikram Sahay", "Dr. Nandini Reddy"] },
    ],
    castRequired: ["Rajkummar Rao", "Taapsee Pannu"],
    crewRequired: [
      { department: "Camera", role: "DP", name: "Ravi Varman" },
      { department: "Direction", role: "1st AD", name: "Leena Sharma" },
      { department: "VFX", role: "VFX Supervisor", name: "Keitan Yadav" },
      { department: "Lighting", role: "Gaffer", name: "Deepak Bhatia" },
    ],
    equipment: [
      eq("ARRI Alexa 35 (A-cam)"), eq("Zero-G wire rig"),
      eq("Holographic display practical"), eq("Lab props set"),
    ],
    status: "confirmed", callSheetStatus: "draft", totalPages: 3,
    notes: "Wire rig for floating objects. Stunt coordinator sign-off required before shoot.",
    conflicts: [],
  },
  {
    id: "sd-37", projectId: "p1", projectTitle: "Antariksha",
    date: "2026-09-08", shootDayNumber: 37, totalShootDays: 65,
    callTime: "08:00", wrapTime: "21:00",
    location: "South Mumbai — Exterior Street", locationAddress: "3rd & Marine Drive, Mumbai",
    scenes: [
      { sceneNumber: "51", heading: "DOWNTOWN STREET — ARIA'S PAST", pages: 1.5, intExt: "EXT", characters: ["Commander Aria Singh"] },
      { sceneNumber: "52", heading: "SOUTH MUMBAI — PRESS CONFERENCE EXTERIOR", pages: 3, intExt: "EXT", characters: ["Commander Aria Singh", "Brigadier Vikram Rathore", "Guest Reporter Tanaka"] },
    ],
    castRequired: ["Deepika Padukone", "Manoj Bajpayee", "Rajesh Sharma", "Aryan Khanna"],
    crewRequired: [
      { department: "Camera", role: "DP", name: "Ravi Varman" },
      { department: "Camera", role: "1st AC", name: "Anil Mehta" },
      { department: "Direction", role: "1st AD", name: "Leena Sharma" },
      { department: "Lighting", role: "Gaffer", name: "Deepak Bhatia" },
      { department: "Transport", role: "Transport Captain", name: "Rajesh Yadav" },
      { department: "Publicity", role: "Unit Publicist", name: "Omar Qureshi" },
    ],
    equipment: [
      eq("ARRI Alexa 35 (A-cam)"), eq("ARRI Alexa 35 (B-cam)"),
      eq("Wet-down truck"), eq("Period vehicles (3)"),
      eq("News vans (4)"), eq("Press podium + microphones"),
      eq("Crowd control barriers"),
    ],
    status: "planned", callSheetStatus: "pending", totalPages: 4.5,
    notes: "Sc. 51 golden hour first, then press conference. Aryan Khanna (minor) — parent on set, 8hr max. 100 extras needed.",
    conflicts: [
      { type: "permit-expiry", message: "South Mumbai exterior permit expires Sept 14 — no schedule extensions possible", severity: "warning" },
      { type: "cast-overlap", message: "Aryan Khanna (child artist) — max 8hr day per labour regulations", severity: "critical" },
    ],
  },
  {
    id: "sd-38", projectId: "p1", projectTitle: "Antariksha",
    date: "2026-09-09", shootDayNumber: 38, totalShootDays: 65,
    callTime: "06:30", wrapTime: "19:00",
    location: "Floor 4 — Spacecraft Interior", locationAddress: "Mumbai Film City, Goregaon, Mumbai",
    scenes: [
      { sceneNumber: "44", heading: "SPACECRAFT — CREW QUARTERS", pages: 4, intExt: "INT", characters: ["Commander Aria Singh", "Captain Yuki Tanaka", "Dr. Vikram Sahay"] },
      { sceneNumber: "45", heading: "SPACECRAFT — SCIENCE LAB", pages: 4.5, intExt: "INT", characters: ["Dr. Vikram Sahay", "Commander Aria Singh"] },
    ],
    castRequired: ["Deepika Padukone", "Rajkummar Rao", "Vikrant Massey"],
    crewRequired: [
      { department: "Camera", role: "DP", name: "Ravi Varman" },
      { department: "Camera", role: "1st AC", name: "Anil Mehta" },
      { department: "Direction", role: "1st AD", name: "Leena Sharma" },
      { department: "Sound", role: "Sound Mixer", name: "Resul Pookutty" },
      { department: "Lighting", role: "Gaffer", name: "Deepak Bhatia" },
      { department: "VFX", role: "VFX Supervisor", name: "Keitan Yadav" },
    ],
    equipment: [
      eq("ARRI Alexa 35 (A-cam)"), eq("ARRI Alexa 35 (B-cam)"),
      eq("Handheld rig"), eq("Holographic display practical"),
      eq("Dramatic lighting shift rig"),
    ],
    status: "planned", callSheetStatus: "pending", totalPages: 8.5,
    notes: "Heavy dialogue day — 8.5 pages. Vikram's confession scene is the dramatic turning point. Two-camera handheld for Sc. 44.",
    conflicts: [
      { type: "crew-unavailable", message: "Heavy 8.5-page day — risk of overtime beyond 12 hours", severity: "warning" },
    ],
  },
  {
    id: "sd-39", projectId: "p1", projectTitle: "Antariksha",
    date: "2026-09-11", shootDayNumber: 39, totalShootDays: 65,
    callTime: "17:00", wrapTime: "05:00",
    location: "Bhiwandi Warehouse District — Night Exterior", locationAddress: "1800 Industrial Area, Bhiwandi, Maharashtra",
    scenes: [
      { sceneNumber: "60", heading: "WAREHOUSE DISTRICT — ROOFTOP", pages: 3.5, intExt: "EXT", characters: ["Commander Aria Singh"] },
      { sceneNumber: "61", heading: "WAREHOUSE DISTRICT — INTERIOR", pages: 1.5, intExt: "INT", characters: ["Dr. Nandini Reddy"] },
    ],
    castRequired: ["Deepika Padukone", "Taapsee Pannu"],
    crewRequired: [
      { department: "Camera", role: "DP", name: "Ravi Varman" },
      { department: "Camera", role: "1st AC", name: "Anil Mehta" },
      { department: "Direction", role: "1st AD", name: "Leena Sharma" },
      { department: "VFX", role: "VFX Supervisor", name: "Keitan Yadav" },
      { department: "Lighting", role: "Gaffer", name: "Deepak Bhatia" },
      { department: "Art", role: "Art Director", name: "Subrata Chakraborty" },
    ],
    equipment: [
      eq("ARRI Alexa 35 (A-cam)"), eq("Condor lift (high angle)"),
      eq("Rain towers x3"), eq("Rooftop safety rigging"),
      eq("HMI 18K x2 (moonlight)"), eq("Transmission device (hero prop)"),
    ],
    status: "planned", callSheetStatus: "pending", totalPages: 5,
    notes: "NIGHT SHOOT. Climactic scene. Rain towers, rooftop — full safety briefing before call. Condor lift for high angles.",
    conflicts: [
      { type: "location-overlap", message: "Bhiwandi night shoot permit is single-use — no overruns", severity: "critical" },
    ],
  },
  {
    id: "sd-40", projectId: "p1", projectTitle: "Antariksha",
    date: "2026-09-12", shootDayNumber: 40, totalShootDays: 65,
    callTime: "06:00", wrapTime: "18:00",
    location: "Floor 1 — Mission Control", locationAddress: "Mumbai Film City, Goregaon, Mumbai",
    scenes: [
      { sceneNumber: "3", heading: "EARTH — DEEP SPACE ARRAY — MISSION CONTROL", pages: 4, intExt: "INT", characters: ["Commander Aria Singh", "Dr. Vikram Sahay", "Brigadier Vikram Rathore"] },
      { sceneNumber: "4", heading: "MISSION CONTROL — BRIEFING ROOM", pages: 3, intExt: "INT", characters: ["Commander Aria Singh", "Dr. Vikram Sahay", "Brigadier Vikram Rathore", "Captain Yuki Tanaka"] },
    ],
    castRequired: ["Deepika Padukone", "Rajkummar Rao", "Manoj Bajpayee", "Vikrant Massey"],
    crewRequired: [
      { department: "Camera", role: "DP", name: "Ravi Varman" },
      { department: "Camera", role: "1st AC", name: "Anil Mehta" },
      { department: "Direction", role: "1st AD", name: "Leena Sharma" },
      { department: "Sound", role: "Sound Mixer", name: "Resul Pookutty" },
      { department: "Lighting", role: "Gaffer", name: "Deepak Bhatia" },
      { department: "VFX", role: "VFX Supervisor", name: "Keitan Yadav" },
      { department: "Production Design", role: "Production Designer", name: "Shruti Gupte" },
    ],
    equipment: [
      eq("ARRI Alexa 35 (A-cam)"), eq("ARRI Alexa 35 (B-cam)"),
      eq("LED wall — star map"), eq("LED wall — mission briefing"),
      eq("SkyPanel S60 x8"), eq("Practical alarm lights"),
    ],
    status: "planned", callSheetStatus: "pending", totalPages: 7,
    notes: "Key exposition day. 12 extras as Mission Control staff. Full LED wall content must be finalized 48hrs before.",
    conflicts: [],
  },

  // ===== Raat Ki Kahani (p2) — pre-production =====
  {
    id: "sd-nc1", projectId: "p2", projectTitle: "Raat Ki Kahani",
    date: "2026-09-10", shootDayNumber: 0, totalShootDays: 120,
    callTime: "09:00", wrapTime: "17:00",
    location: "Production Office — Table Read", locationAddress: "Phantom Films, 500 Andheri West, Mumbai",
    scenes: [
      { sceneNumber: "Full", heading: "EP. 1 — FULL TABLE READ", pages: 55, intExt: "INT", characters: ["Full Cast"] },
    ],
    castRequired: ["Ayushmann Khurrana", "Radhika Apte", "Pankaj Tripathi"],
    crewRequired: [
      { department: "Direction", role: "Director", name: "Anvita Dutt" },
      { department: "Direction", role: "1st AD", name: "Indrani Chaudhary" },
      { department: "Production", role: "Line Producer", name: "TBD" },
    ],
    equipment: [eq("Conference room setup"), eq("Recording equipment"), eq("Script copies x20")],
    status: "confirmed", callSheetStatus: "draft", totalPages: 55,
    notes: "Episode 1 table read. All principal cast expected. Video recording for reference.",
    conflicts: [
      { type: "cast-overlap", message: "Ayushmann Khurrana contract not yet signed — pending final negotiations", severity: "critical" },
    ],
  },
  {
    id: "sd-nc2", projectId: "p2", projectTitle: "Raat Ki Kahani",
    date: "2026-10-15", shootDayNumber: 1, totalShootDays: 120,
    callTime: "06:00", wrapTime: "18:00",
    location: "Coastal Location TBD",
    scenes: [
      { sceneNumber: "1", heading: "COASTAL CLIFF — CRIME SCENE", pages: 2.5, intExt: "EXT", characters: ["Inspector Arjun Cole"] },
    ],
    castRequired: ["Ayushmann Khurrana"],
    crewRequired: [
      { department: "Camera", role: "DP", name: "Darius Khanna" },
      { department: "Direction", role: "1st AD", name: "Indrani Chaudhary" },
    ],
    equipment: [eq("Camera package TBD"), eq("Drone unit"), eq("Fog machine x2")],
    status: "planned", callSheetStatus: "pending", totalPages: 2.5,
    notes: "First day of principal photography. Location scouting in October will finalize the coastal site.",
    conflicts: [
      { type: "crew-unavailable", message: "Darius Khanna contract still in negotiation", severity: "warning" },
      { type: "location-overlap", message: "Location not yet confirmed — scouting scheduled Oct 1-3", severity: "critical" },
    ],
  },
];


function nextShootDayId(days: ShootDay[]) {
  return (
    days.reduce((highest, day) => {
      const match = day.id.match(/^sd(?:-new)?-(\d+)$/) ?? day.id.match(/^sd(\d+)$/);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0) + 1
  );
}

export function getShootDays(): ShootDay[] {
  return getAppDataSlice("shootDays");
}

export function getShootDaysByProject(projectId: string): ShootDay[] {
  return getShootDays().filter((d) => d.projectId === projectId);
}

export function getShootDayById(id: string): ShootDay | undefined {
  return getShootDays().find((d) => d.id === id);
}

export function getShootDaysByDateRange(start: string, end: string): ShootDay[] {
  return getShootDays().filter((d) => d.date >= start && d.date <= end);
}

export function updateShootDay(id: string, updates: Partial<Omit<ShootDay, "id">>): ShootDay | undefined {
  let updatedDay: ShootDay | undefined;

  updateAppData((current) => {
    const previousDay = current.shootDays.find((day) => day.id === id);
    const shootDays = current.shootDays.map((day) => {
      if (day.id !== id) {
        return day;
      }

      const scenes = updates.scenes ?? day.scenes;
      updatedDay = { ...day, ...updates, scenes, totalPages: scenes.reduce((total, scene) => total + scene.pages, 0) };
      return updatedDay;
    });
    const nextDay = updatedDay;

    return {
      ...current,
      shootDays,
      projects: reconcileProjectSchedule(current, shootDays, [previousDay?.projectId ?? "", nextDay?.projectId ?? ""]),
      scenes: nextDay ? current.scenes.map((scene) => {
        const scheduled = nextDay.scenes.find((item) => item.sceneNumber === scene.sceneNumber);
        if (scene.projectId !== nextDay.projectId || !scheduled) return scene;
        return {
          ...scene, shootDate: nextDay.date, shootDay: nextDay.shootDayNumber,
          status: nextDay.status === "completed" ? "shot" as const
            : nextDay.status === "cancelled" ? "not-scheduled" as const : scene.status === "shot" ? scene.status : "scheduled" as const,
        };
      }) : current.scenes,
      callSheets: nextDay ? current.callSheets.map((sheet) => {
        if (sheet.shootDayId !== nextDay.id || sheet.status !== "Draft") return sheet;
        return {
          ...sheet, projectId: nextDay.projectId, project: nextDay.projectTitle,
          date: nextDay.date, shootDay: nextDay.shootDayNumber, location: nextDay.location,
          callTime: nextDay.callTime, packUp: nextDay.wrapTime,
          scenes: nextDay.scenes.map((scene) => ({
            number: scene.sceneNumber, description: scene.heading, setting: scene.intExt,
            time: scene.timeOfDay ?? "DAY", pages: scene.pages, characters: scene.characters.join(", "),
            duration: scene.estimatedDuration ?? "", status: scene.status ?? "scheduled", location: scene.location ?? nextDay.location,
            sourceId: current.scenes.find((item) => item.projectId === nextDay.projectId && item.sceneNumber === scene.sceneNumber)?.id,
          })),
          sceneIds: current.scenes.filter((scene) => scene.projectId === nextDay.projectId && nextDay.scenes.some((item) => item.sceneNumber === scene.sceneNumber)).map((scene) => scene.id),
          updated: new Date().toISOString(),
        };
      }) : current.callSheets,
      scheduleEntries: updatedDay
        ? upsertScheduleEntry(current.scheduleEntries, updatedDay)
        : current.scheduleEntries,
    };
  });

  return updatedDay;
}

export interface CreateShootDayInput {
  projectId: string;
  projectTitle: string;
  date: string;
  shootDayNumber: number;
  totalShootDays: number;
  callTime: string;
  wrapTime: string;
  location: string;
  locationAddress?: string;
  notes: string;
}

export function createShootDay(input: CreateShootDayInput): ShootDay {
  const days = getShootDays();
  const id = `sd-new-${nextShootDayId(days)}`;
  const day: ShootDay = {
    id,
    projectId: input.projectId,
    projectTitle: input.projectTitle,
    date: input.date,
    shootDayNumber: input.shootDayNumber,
    totalShootDays: input.totalShootDays,
    callTime: input.callTime,
    wrapTime: input.wrapTime,
    location: input.location,
    locationAddress: input.locationAddress,
    scenes: [],
    castRequired: [],
    crewRequired: [],
    equipment: [],
    status: "planned",
    callSheetStatus: "pending",
    totalPages: 0,
    notes: input.notes,
    conflicts: [],
  };
  updateAppData((current) => {
    const shootDays = [...current.shootDays, day].sort((a, b) => a.date.localeCompare(b.date));
    return {
      ...current, shootDays,
      projects: reconcileProjectSchedule(current, shootDays, [day.projectId]),
      scheduleEntries: upsertScheduleEntry(current.scheduleEntries, day),
    };
  });
  return day;
}

export function useShootDays() {
  return useAppDataSlice("shootDays");
}

export function useShootDaysByProject(projectId: string) {
  return useAppDataSelector((data) =>
    data.shootDays.filter((day) => day.projectId === projectId)
  );
}

export function useShootDay(id: string) {
  return useAppDataSelector((data) => data.shootDays.find((day) => day.id === id));
}
