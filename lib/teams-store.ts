"use client";

import { useMemo } from "react";
import { useModuleSlice, updateModuleSlice, seedModuleSlice } from "./module-store";

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface TeamMember {
  id: string;
  departmentId: string;
  employeeId?: string;
  name: string;
  designation?: string;
  email?: string;
  phone?: string;
  reportingManagerId?: string;
  joiningDate?: string;
  availability: "available" | "assigned" | "on-leave" | "unavailable";
  status: "active" | "inactive";
  responsibilities?: string;
}

export interface TeamProjectAssignment {
  id: string;
  memberId: string;
  projectId: string;
  roleInProject?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

const SEED_DEPARTMENTS: Department[] = [
  { id: "dept-direction", name: "Direction", code: "DIR", isActive: true },
  { id: "dept-production", name: "Production", code: "PROD", isActive: true },
  { id: "dept-camera", name: "Camera", code: "CAM", isActive: true },
  { id: "dept-art", name: "Art", code: "ART", isActive: true },
  { id: "dept-costumes", name: "Costumes", code: "COST", isActive: true },
  { id: "dept-makeup", name: "Makeup", code: "MKP", isActive: true },
  { id: "dept-sound", name: "Sound", code: "SND", isActive: true },
  { id: "dept-editing", name: "Editing", code: "EDIT", isActive: true },
  { id: "dept-vfx", name: "VFX", code: "VFX", isActive: true },
  { id: "dept-publicity", name: "Publicity", code: "PUB", isActive: true },
  { id: "dept-accounts", name: "Accounts", code: "ACC", isActive: true },
  { id: "dept-locations", name: "Locations", code: "LOC", isActive: true },
];

const SEED_MEMBERS: TeamMember[] = [
  { id: "tm-1", departmentId: "dept-direction", name: "S.S. Rajamouli", designation: "Director", availability: "assigned", status: "active" },
  { id: "tm-2", departmentId: "dept-production", name: "D.V.V. Danayya", designation: "Producer", email: "danayya@dvv.com", availability: "assigned", status: "active" },
  { id: "tm-3", departmentId: "dept-camera", name: "K.K. Senthil Kumar", designation: "DOP", availability: "assigned", status: "active" },
  { id: "tm-4", departmentId: "dept-editing", name: "Ravi Shankar", designation: "Editor", availability: "assigned", status: "active" },
  { id: "tm-5", departmentId: "dept-vfx", name: "V. Srinivas Mohan", designation: "VFX Supervisor", availability: "assigned", status: "active" },
  { id: "tm-6", departmentId: "dept-accounts", name: "Priya Sharma", designation: "Chief Accountant", email: "priya@flowbender.com", availability: "available", status: "active" },
];

const SEED_ASSIGNMENTS: TeamProjectAssignment[] = [
  { id: "tpa-1", memberId: "tm-1", projectId: "p1", roleInProject: "Director", isActive: true },
  { id: "tpa-2", memberId: "tm-2", projectId: "p1", roleInProject: "Producer", isActive: true },
  { id: "tpa-3", memberId: "tm-3", projectId: "p1", roleInProject: "DOP", isActive: true },
  { id: "tpa-4", memberId: "tm-4", projectId: "p1", roleInProject: "Editor", isActive: true },
  { id: "tpa-5", memberId: "tm-1", projectId: "p2", roleInProject: "Creative Consultant", isActive: true },
];

export function initTeamsSeedData() {
  seedModuleSlice("departments", SEED_DEPARTMENTS);
  seedModuleSlice("teamMembers", SEED_MEMBERS);
  seedModuleSlice("teamProjectAssignments", SEED_ASSIGNMENTS);
}

export function useDepartments(): Department[] {
  return useModuleSlice<Department>("departments");
}

export function useTeamMembers(departmentId?: string): TeamMember[] {
  const all = useModuleSlice<TeamMember>("teamMembers");
  return useMemo(() => !departmentId ? all : all.filter((m) => m.departmentId === departmentId), [all, departmentId]);
}

export function useTeamProjectAssignments(projectId?: string): TeamProjectAssignment[] {
  const all = useModuleSlice<TeamProjectAssignment>("teamProjectAssignments");
  return useMemo(() => !projectId ? all : all.filter((a) => a.projectId === projectId), [all, projectId]);
}

export function useTeamDashboard() {
  const departments = useDepartments();
  const members = useTeamMembers();
  const assignments = useModuleSlice<TeamProjectAssignment>("teamProjectAssignments");

  return useMemo(() => {
    const deptCounts = departments.map((d) => ({
      department: d.name,
      code: d.code,
      headcount: members.filter((m) => m.departmentId === d.id && m.status === "active").length,
      available: members.filter((m) => m.departmentId === d.id && m.availability === "available").length,
    }));
    const totalMembers = members.filter((m) => m.status === "active").length;
    const availableMembers = members.filter((m) => m.availability === "available").length;
    const activeAssignments = assignments.filter((a) => a.isActive).length;
    return { departments: deptCounts, totalMembers, availableMembers, activeAssignments };
  }, [departments, members, assignments]);
}

export function createDepartment(input: Omit<Department, "id">): Department {
  const item: Department = { id: `dept-${crypto.randomUUID().slice(0, 8)}`, ...input };
  updateModuleSlice<Department>("departments", (items) => [...items, item]);
  return item;
}

export function createTeamMember(input: Omit<TeamMember, "id">): TeamMember {
  const item: TeamMember = { id: `tm-${crypto.randomUUID().slice(0, 8)}`, ...input };
  updateModuleSlice<TeamMember>("teamMembers", (items) => [...items, item]);
  return item;
}

export function createTeamProjectAssignment(input: Omit<TeamProjectAssignment, "id">): TeamProjectAssignment {
  const item: TeamProjectAssignment = { id: `tpa-${crypto.randomUUID().slice(0, 8)}`, ...input };
  updateModuleSlice<TeamProjectAssignment>("teamProjectAssignments", (items) => [...items, item]);
  return item;
}
