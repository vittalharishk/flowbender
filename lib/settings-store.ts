"use client";

import { useModuleSlice, updateModuleSlice, getModuleSlice } from "./module-store";

export interface OrgSettings {
  id: string;
  productionHouse: string;
  defaultCurrency: string;
  fiscalYearStart: number;
  deadlineAlerts: boolean;
  callSheetReminders: boolean;
  weeklyFinanceSummary: boolean;
  passwordMinLength: number;
  requireUppercase: boolean;
  requireDigit: boolean;
  sessionTimeoutMinutes: number;
}

export interface ManagedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "owner" | "admin" | "manager" | "accountant" | "staff" | "viewer";
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface ProjectAccess {
  id: string;
  userId: string;
  projectId: string;
  accessLevel: "full" | "edit" | "view" | "none";
  modulePermissions?: Record<string, boolean>;
}

export interface AuditEntry {
  id: string;
  userId: string;
  userEmail?: string;
  action: string;
  tableName?: string;
  recordId?: string;
  timestamp: string;
  details?: string;
}

const SETTINGS_KEY = "settings";
const MANAGED_USERS_KEY = "managed-users";
const PROJECT_ACCESS_KEY = "project-access";
const AUDIT_LOG_KEY = "audit-log";

const defaultSettings: OrgSettings = {
  id: "org-settings",
  productionHouse: "Hyderabad Lantern Studios",
  defaultCurrency: "INR",
  fiscalYearStart: 4,
  deadlineAlerts: true,
  callSheetReminders: true,
  weeklyFinanceSummary: false,
  passwordMinLength: 8,
  requireUppercase: true,
  requireDigit: true,
  sessionTimeoutMinutes: 480,
};

export function useOrgSettings(): OrgSettings {
  const items = useModuleSlice<OrgSettings>(SETTINGS_KEY);
  return items[0] ?? defaultSettings;
}

export function updateOrgSettings(updates: Partial<OrgSettings>) {
  updateModuleSlice<OrgSettings>(SETTINGS_KEY, (items) => {
    const current = items[0] ?? defaultSettings;
    return [{ ...current, ...updates }];
  });
}

export function useManagedUsers(): ManagedUser[] {
  return useModuleSlice<ManagedUser>(MANAGED_USERS_KEY);
}

export function getManagedUsers(): ManagedUser[] {
  return getModuleSlice<ManagedUser>(MANAGED_USERS_KEY);
}

export function addManagedUser(user: ManagedUser) {
  updateModuleSlice<ManagedUser>(MANAGED_USERS_KEY, (items) => [...items, user]);
}

export function updateManagedUser(id: string, updates: Partial<ManagedUser>) {
  updateModuleSlice<ManagedUser>(MANAGED_USERS_KEY, (items) =>
    items.map((u) => (u.id === id ? { ...u, ...updates } : u))
  );
}

export function useProjectAccess(): ProjectAccess[] {
  return useModuleSlice<ProjectAccess>(PROJECT_ACCESS_KEY);
}

export function setProjectAccess(userId: string, projectId: string, accessLevel: ProjectAccess["accessLevel"], modulePermissions?: Record<string, boolean>) {
  updateModuleSlice<ProjectAccess>(PROJECT_ACCESS_KEY, (items) => {
    const existing = items.findIndex((a) => a.userId === userId && a.projectId === projectId);
    const entry: ProjectAccess = {
      id: existing >= 0 ? items[existing].id : `pa-${Date.now()}`,
      userId,
      projectId,
      accessLevel,
      modulePermissions,
    };
    if (existing >= 0) {
      return items.map((a, i) => (i === existing ? entry : a));
    }
    return [...items, entry];
  });
}

export function useAuditLog(): AuditEntry[] {
  return useModuleSlice<AuditEntry>(AUDIT_LOG_KEY);
}

export function addAuditEntry(entry: Omit<AuditEntry, "id" | "timestamp">) {
  updateModuleSlice<AuditEntry>(AUDIT_LOG_KEY, (items) => [
    { ...entry, id: `audit-${Date.now()}`, timestamp: new Date().toISOString() },
    ...items,
  ].slice(0, 500));
}
