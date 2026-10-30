import type { CrewMember, CrewDepartment, CrewAvailability } from "./types";
import {
  getAppDataSlice,
  updateAppDataSlice,
  useAppDataSelector,
  useAppDataSlice,
} from "./app-data-store";

export const crewDepartmentLabels: Record<CrewDepartment, string> = {
  direction: "Direction", production: "Production", camera: "Camera", art: "Art",
  costume: "Costume", makeup: "Makeup", sound: "Sound", lighting: "Lighting",
  vfx: "VFX", editing: "Editing", di: "DI", dubbing: "Dubbing",
  "production-design": "Production Design", transport: "Transport",
  accounts: "Accounts", publicity: "Publicity",
};

export const crewDepartmentColors: Record<CrewDepartment, string> = {
  direction: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  production: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  camera: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  art: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  costume: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  makeup: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
  sound: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  lighting: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  vfx: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  editing: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  di: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  dubbing: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "production-design": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  transport: "bg-stone-500/10 text-stone-400 border-stone-500/20",
  accounts: "bg-lime-500/10 text-lime-400 border-lime-500/20",
  publicity: "bg-red-500/10 text-red-400 border-red-500/20",
};

export const availabilityLabels: Record<CrewAvailability, string> = {
  available: "Available", "on-set": "On Set", "on-leave": "On Leave", unavailable: "Unavailable",
};

export const availabilityColors: Record<CrewAvailability, string> = {
  available: "text-emerald-400 bg-emerald-500/10",
  "on-set": "text-amber-400 bg-amber-500/10",
  "on-leave": "text-blue-400 bg-blue-500/10",
  unavailable: "text-red-400 bg-red-500/10",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function nextCrewId(members: CrewMember[]) {
  return members.reduce((highest, member) => {
    const match = member.id.match(/^cr(\d+)$/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0) + 1;
}

export function getCrewMembers(): CrewMember[] { return getAppDataSlice("crewMembers"); }
export function getCrewByProject(projectId: string): CrewMember[] {
  return getCrewMembers().filter((member) => member.projectId === projectId);
}
export function getCrewById(id: string): CrewMember | undefined {
  return getCrewMembers().find((member) => member.id === id);
}

export interface CreateCrewInput {
  name: string; department: CrewDepartment; role: string; projectId: string;
  projectTitle: string; email: string; phone: string; agency?: string;
  dayRate: number; totalDays: number; notes: string;
  profileImage?: string | null;
}

export function createCrew(input: CreateCrewInput): CrewMember {
  const member: CrewMember = {
    id: `cr${nextCrewId(getCrewMembers())}`, name: input.name, initials: initials(input.name),
    department: input.department, role: input.role, projectId: input.projectId,
    projectTitle: input.projectTitle, email: input.email, phone: input.phone,
    agency: input.agency, contractStatus: "pending", paymentStatus: "pending",
    dayRate: input.dayRate, totalDays: input.totalDays, daysWorked: 0, totalPaid: 0,
    availability: "available", notes: input.notes, joinedDate: new Date().toISOString().slice(0, 10),
    profileImage: input.profileImage ?? null,
  };
  updateAppDataSlice("crewMembers", (current) => [member, ...current]);
  return member;
}

export function updateCrew(id: string, updates: Partial<Omit<CrewMember, "id">>): CrewMember | undefined {
  let updatedMember: CrewMember | undefined;
  updateAppDataSlice("crewMembers", (current) => current.map((member) => {
    if (member.id !== id) return member;
    updatedMember = { ...member, ...updates };
    return updatedMember;
  }));
  return updatedMember;
}

export function useCrewMembers() { return useAppDataSlice("crewMembers"); }
export function useCrewByProject(projectId: string) {
  return useAppDataSelector((data) => data.crewMembers.filter((member) => member.projectId === projectId));
}
export function useCrewMember(id: string) {
  return useAppDataSelector((data) => data.crewMembers.find((member) => member.id === id));
}
