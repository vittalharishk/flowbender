import type { CastMember, CastCategory } from "./types";
import {
  getAppDataSlice,
  updateAppDataSlice,
  useAppDataSelector,
  useAppDataSlice,
} from "./app-data-store";

function nextCastId(members: CastMember[]) {
  return members.reduce((highest, member) => {
    const match = member.id.match(/^c(\d+)$/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0) + 1;
}

export function getCastMembers(): CastMember[] {
  return getAppDataSlice("castMembers");
}

export function getCastByProject(projectId: string): CastMember[] {
  return getCastMembers().filter((member) => member.projectId === projectId);
}

export function getCastById(id: string): CastMember | undefined {
  return getCastMembers().find((member) => member.id === id);
}

export interface CreateCastInput {
  name: string;
  character: string;
  characterDescription: string;
  category: CastCategory;
  projectId: string;
  projectTitle: string;
  email: string;
  phone: string;
  agency?: string;
  languages: string[];
  totalFee: number;
  notes: string;
  profileImage?: string | null;
}

export function createCast(input: CreateCastInput): CastMember {
  const id = `c${nextCastId(getCastMembers())}`;
  const nameParts = input.name.trim().split(/\s+/);
  const member: CastMember = {
    id,
    name: input.name,
    character: input.character,
    characterDescription: input.characterDescription,
    category: input.category,
    projectId: input.projectId,
    projectTitle: input.projectTitle,
    initials: nameParts.length > 1
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : input.name.slice(0, 2).toUpperCase(),
    email: input.email,
    phone: input.phone,
    agency: input.agency,
    languages: input.languages,
    contractStatus: "pending",
    paymentStatus: "pending",
    totalFee: input.totalFee,
    paidAmount: 0,
    paymentMilestones: [],
    scenes: [],
    notes: input.notes,
    joinedDate: new Date().toISOString().slice(0, 10),
    profileImage: input.profileImage ?? null,
  };
  updateAppDataSlice("castMembers", (current) => [member, ...current]);
  return member;
}

export function updateCast(id: string, updates: Partial<Omit<CastMember, "id">>): CastMember | undefined {
  let updatedMember: CastMember | undefined;
  updateAppDataSlice("castMembers", (current) =>
    current.map((member) => {
      if (member.id !== id) return member;
      updatedMember = { ...member, ...updates };
      return updatedMember;
    })
  );
  return updatedMember;
}

export function useCastMembers() {
  return useAppDataSlice("castMembers");
}

export function useCastByProject(projectId: string) {
  return useAppDataSelector((data) =>
    data.castMembers.filter((member) => member.projectId === projectId)
  );
}

export function useCastMember(id: string) {
  return useAppDataSelector((data) =>
    data.castMembers.find((member) => member.id === id)
  );
}

export const castCategoryLabels: Record<CastCategory, string> = {
  lead: "Lead",
  supporting: "Supporting",
  "character-artist": "Character Artist",
  guest: "Guest",
  "child-artist": "Child Artist",
  "special-appearance": "Special Appearance",
};

export const castCategoryColors: Record<CastCategory, string> = {
  lead: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  supporting: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "character-artist": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  guest: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "child-artist": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "special-appearance": "bg-orange-500/10 text-orange-400 border-orange-500/20",
};
