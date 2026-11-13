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
