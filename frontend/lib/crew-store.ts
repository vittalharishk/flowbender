"use client";
import { useAppDataSlice, updateAppDataSlice } from "@/lib/app-data-store";
import type {
  CrewMember,
  CrewAssignment,
  RemunerationAgreement,
  CrewPaymentRecord,
  RemunerationPaymentStatus,
} from "@/lib/types";

// ─── Crew Members ──────────────────────────────────────────────────────────

export function useCrewMembers(projectId?: string): CrewMember[] {
  const crew = useAppDataSlice("crewMembers") ?? [];
  return projectId ? crew.filter(c => c.projectId === projectId) : crew;
}

export function addCrewMember(member: Omit<CrewMember, "id">): CrewMember {
  const newMember = { ...member, id: `cm-${Date.now()}` } as CrewMember;
  updateAppDataSlice("crewMembers", crew => [...crew, newMember]);
  return newMember;
}

export function updateCrewMember(id: string, updates: Partial<CrewMember>) {
  updateAppDataSlice("crewMembers", crew =>
    crew.map(c => c.id === id ? { ...c, ...updates } : c)
  );
}

// ─── Crew Assignments ──────────────────────────────────────────────────────

export function useCrewAssignments(projectId?: string): CrewAssignment[] {
  const assignments = useAppDataSlice("crewAssignments") ?? [];
  return projectId ? assignments.filter(a => a.projectId === projectId) : assignments;
}

export function addCrewAssignment(assignment: Omit<CrewAssignment, "id">) {
  const newA: CrewAssignment = { ...assignment, id: `ca-${Date.now()}` };
  updateAppDataSlice("crewAssignments", list => [...list, newA]);
}

export function updateCrewAssignment(id: string, updates: Partial<CrewAssignment>) {
  updateAppDataSlice("crewAssignments", list =>
    list.map(a => a.id === id ? { ...a, ...updates } : a)
  );
}

// ─── Remuneration Agreements ───────────────────────────────────────────────

export function useRemunerationAgreements(projectId?: string): RemunerationAgreement[] {
  const items = useAppDataSlice("remunerationAgreements") ?? [];
  return projectId ? items.filter(r => r.projectId === projectId) : items;
}

export function addRemunerationAgreement(
  agreement: Omit<RemunerationAgreement, "id" | "createdAt">
): RemunerationAgreement {
  const newA: RemunerationAgreement = {
    ...agreement,
    id: `rem-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  updateAppDataSlice("remunerationAgreements", list => [...list, newA]);
  return newA;
}

export function updateRemunerationAgreement(id: string, updates: Partial<RemunerationAgreement>) {
  updateAppDataSlice("remunerationAgreements", list =>
    list.map(r => r.id === id ? { ...r, ...updates } : r)
  );
}

// ─── Payment Records ───────────────────────────────────────────────────────

export function useCrewPaymentRecords(agreementId?: string): CrewPaymentRecord[] {
  const records = useAppDataSlice("crewPaymentRecords") ?? [];
  return agreementId ? records.filter(p => p.agreementId === agreementId) : records;
}

export function recordPaymentAndUpdateAgreement(
  agreementId: string,
  payment: Omit<CrewPaymentRecord, "id" | "createdAt" | "agreementId">
) {
  const now = new Date().toISOString();
  const newPayment: CrewPaymentRecord = {
    ...payment,
    agreementId,
    id: `pay-${Date.now()}`,
    createdAt: now,
  };
  updateAppDataSlice("crewPaymentRecords", records => [...records, newPayment]);

  // Update agreement advancePaid + status
  updateAppDataSlice("remunerationAgreements", agreements =>
    agreements.map(ag => {
      if (ag.id !== agreementId) return ag;
      const newPaid = ag.advancePaid + payment.amount;
      const newStatus: RemunerationPaymentStatus =
        newPaid >= ag.totalPayable ? "paid" :
        newPaid > 0 ? "partially-paid" : "pending";
      return { ...ag, advancePaid: newPaid, status: newStatus };
    })
  );
}

// ─── Calculations ──────────────────────────────────────────────────────────

export function calcRemunerationSummary(agreements: RemunerationAgreement[]) {
  return {
    totalAgreed: agreements.reduce((s, a) => s + a.totalPayable, 0),
    totalPaid: agreements.reduce((s, a) => s + a.advancePaid, 0),
    totalPending: agreements.reduce((s, a) => s + (a.totalPayable - a.advancePaid), 0),
    byStatus: agreements.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}

export function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

// ─── Compatibility aliases (used by existing crew UI components) ────────────

export const useCrewByProject = useCrewMembers;

export function useCrewMember(id: string): CrewMember | undefined {
  const all = useAppDataSlice("crewMembers") ?? [];
  return all.find(c => c.id === id);
}
export const createCrew = addCrewMember;
export const updateCrew = updateCrewMember;

export const crewDepartmentLabels: Record<string, string> = {
  camera: "Camera", direction: "Direction", editing: "Editing",
  sound: "Sound", art: "Art", vfx: "VFX", "production-design": "Production Design",
  costume: "Costume", makeup: "Makeup", action: "Action", location: "Locations",
  transport: "Transport", accounts: "Accounts", publicity: "Publicity",
  lighting: "Lighting", di: "DI", dubbing: "Dubbing", production: "Production",
};

export const crewDepartmentColors: Record<string, string> = {
  camera: "bg-blue-500/20 text-blue-300", direction: "bg-violet-500/20 text-violet-300",
  editing: "bg-cyan-500/20 text-cyan-300", sound: "bg-green-500/20 text-green-300",
  art: "bg-orange-500/20 text-orange-300", vfx: "bg-pink-500/20 text-pink-300",
  "production-design": "bg-amber-500/20 text-amber-300",
};

export const availabilityLabels: Record<string, string> = {
  available: "Available", "on-set": "On Set", "on-leave": "On Leave", unavailable: "Unavailable",
};

export const availabilityColors: Record<string, string> = {
  available: "bg-emerald-500/20 text-emerald-300",
  "on-set": "bg-blue-500/20 text-blue-300",
  "on-leave": "bg-amber-500/20 text-amber-300",
  unavailable: "bg-red-500/20 text-red-300",
};
