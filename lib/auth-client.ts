export interface AuthPermission {
  code: string;
  description: string;
}

export interface AuthRole {
  name: string;
  slug: string;
  permissions: AuthPermission[];
}

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  roles: AuthRole[];
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const TOKEN_KEY = "showrunners.access_token";
const AUTH_MODE = process.env.NEXT_PUBLIC_AUTH_MODE ?? "local";
export const isDemoMode = AUTH_MODE !== "api";
const LOCAL_TOKEN_PREFIX = "local-demo-token:";
const DEMO_ACCOUNTS_STORAGE_KEY = "flowbender.demo-accounts.v1";
const DEMO_VIEW_PERMISSIONS = [
  "cast.view", "crew.view", "scenes.view", "schedule.view", "production.view",
  "call_sheet.view", "finance.view", "post_production.view", "distribution.view", "reports.view", "settings.view",
];

export interface DemoAccount {
  email: string;
  password: string;
  label: string;
  role: "Producer" | "Production Manager";
  assignedProjectIds: string[];
  user: AuthUser;
}

function createDemoUser(id: number, email: string, full_name: string, role: string, permissions: string[]): AuthUser {
  return {
    id,
    email,
    full_name,
    is_active: true,
    created_at: new Date(0).toISOString(),
    roles: [{ name: role, slug: role === "Producer" ? "producer" : "production-manager", permissions: permissions.map((code) => ({ code, description: code })) }],
  };
}

const defaultDemoAccounts: DemoAccount[] = [
  {
    email: "producer@flowbender.demo",
    password: "demo",
    label: "Producer",
    role: "Producer",
    assignedProjectIds: [],
    user: { ...createDemoUser(1, "producer@flowbender.demo", "Aarav Producer", "Producer", []), roles: [{ name: "Producer", slug: "super-admin", permissions: [] }] },
  },
  {
    email: "manager1@flowbender.demo",
    password: "demo",
    label: "EP 1",
    role: "Production Manager",
    assignedProjectIds: ["p1", "p2", "p3"],
    user: createDemoUser(2, "manager1@flowbender.demo", "Nisha EP 1", "Production Manager", DEMO_VIEW_PERMISSIONS),
  },
  {
    email: "manager2@flowbender.demo",
    password: "demo",
    label: "EP 2",
    role: "Production Manager",
    assignedProjectIds: ["p4", "p5", "p6", "p7"],
    user: createDemoUser(3, "manager2@flowbender.demo", "Vikram EP 2", "Production Manager", DEMO_VIEW_PERMISSIONS),
  },
];

function cloneAccounts(accounts: DemoAccount[]) {
  return JSON.parse(JSON.stringify(accounts)) as DemoAccount[];
}

export function getDemoAccounts() {
  if (typeof window === "undefined") return defaultDemoAccounts;
  const raw = window.localStorage.getItem(DEMO_ACCOUNTS_STORAGE_KEY);
  if (!raw) return defaultDemoAccounts;
  try {
    const parsed = JSON.parse(raw) as DemoAccount[];
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultDemoAccounts;
    const upgraded = parsed.map((account) => {
      if (account.role === "Producer") return account;
      const role = account.user.roles[0];
      if (!role || role.permissions.some((permission) => permission.code === "settings.view")) return account;
      return {
        ...account,
        user: {
          ...account.user,
          roles: account.user.roles.map((item, index) => index === 0
            ? { ...item, permissions: [...item.permissions, { code: "settings.view", description: "settings.view" }] }
            : item),
        },
      };
    });
    if (JSON.stringify(upgraded) !== raw) {
      window.localStorage.setItem(DEMO_ACCOUNTS_STORAGE_KEY, JSON.stringify(upgraded));
    }
    return upgraded;
  } catch {
    return defaultDemoAccounts;
  }
}

export function saveDemoAccounts(accounts: DemoAccount[]) {
  window.localStorage.setItem(DEMO_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  window.dispatchEvent(new StorageEvent("storage", { key: DEMO_ACCOUNTS_STORAGE_KEY }));
}

export const demoUser: AuthUser = {
  ...defaultDemoAccounts[0].user,
};

export function getDemoAccountForUser(user: AuthUser | null): DemoAccount | undefined {
  return getDemoAccounts().find((account) => account.user.id === user?.id);
}

export function getDemoUserFromToken(): AuthUser {
  const id = Number(getAccessToken()?.replace(LOCAL_TOKEN_PREFIX, ""));
  return getDemoAccounts().find((account) => account.user.id === id)?.user ?? demoUser;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TOKEN_KEY) ?? window.localStorage.getItem(TOKEN_KEY);
}

export function clearAccessToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
}

function storeAccessToken(token: string, remember: boolean) {
  clearAccessToken();
  (remember ? window.localStorage : window.sessionStorage).setItem(TOKEN_KEY, token);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? `Request failed with status ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function login(email: string, password: string, remember = true): Promise<AuthUser> {
  if (AUTH_MODE !== "api") {
    const account = getDemoAccounts().find((item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password);
    if (!account) throw new Error("Use one of the demo accounts below. Password: demo");
    storeAccessToken(`${LOCAL_TOKEN_PREFIX}${account.user.id}`, remember);
    return account.user;
  }
  const token = await request<TokenResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  storeAccessToken(token.access_token, remember);
  return request<AuthUser>("/api/v1/auth/me");
}

export function getCurrentUser() {
  if (AUTH_MODE !== "api" && getAccessToken()?.startsWith(LOCAL_TOKEN_PREFIX)) {
    return Promise.resolve(getDemoUserFromToken());
  }
  return request<AuthUser>("/api/v1/auth/me");
}

export async function logout() {
  if (AUTH_MODE !== "api") {
    clearAccessToken();
    return;
  }
  try {
    await request<void>("/api/v1/auth/logout", { method: "POST" });
  } finally {
    clearAccessToken();
  }
}

export function hasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user) return false;
  return user.roles.some(
    (role) => role.slug === "super-admin" || role.permissions.some((item) => item.code === permission)
  );
}
