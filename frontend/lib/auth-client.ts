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
export const DEMO_ACCOUNTS_STORAGE_KEY = "flowbender.demo-accounts.v1";
const DEMO_VIEW_PERMISSIONS = [
  "cast.view", "crew.view", "scenes.view", "schedule.view", "production.view",
  "call_sheet.view", "finance.view", "post_production.view", "distribution.view", "reports.view", "settings.view",
];

export interface CompanyProfile {
  companyName: string;
  companyType: string;
  country: string;
  city?: string;
  website?: string;
  createdAt: string;
}

export interface DemoAccount {
  email: string;
  password: string;
  label: string;
  role: "Producer" | "Production Manager";
  assignedProjectIds: string[];
  user: AuthUser;
  // undefined = legacy/demo account (no onboarding); null = signup pending company setup
  companyProfile?: CompanyProfile | null;
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
  // Persist user accounts to the database (localStorage stays as a cache).
  void fetch("/api/demo-data?slice=accounts", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accounts }),
  }).catch((error) => console.error("Unable to save user accounts to the database.", error));
}

// On startup, pull the account list from the database so users created on any
// device/browser are available everywhere. If the database has none yet, push
// this browser's copy (or the defaults) up once.
if (typeof window !== "undefined") {
  void fetch("/api/demo-data?slice=accounts", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) return;
      const payload = (await response.json()) as { accounts?: DemoAccount[] | null };
      if (Array.isArray(payload.accounts) && payload.accounts.length > 0) {
        window.localStorage.setItem(DEMO_ACCOUNTS_STORAGE_KEY, JSON.stringify(payload.accounts));
        window.dispatchEvent(new StorageEvent("storage", { key: DEMO_ACCOUNTS_STORAGE_KEY }));
      } else {
        saveDemoAccounts(getDemoAccounts());
      }
    })
    .catch(() => undefined);
}

export function registerAccount(fullName: string, email: string, password: string): DemoAccount {
  const accounts = getDemoAccounts();
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) throw new Error("Enter a valid email address.");
  if (password.length < 4) throw new Error("Password must be at least 4 characters.");
  if (accounts.some((a) => a.email.toLowerCase() === clean)) throw new Error("An account with this email already exists. Sign in instead.");
  const nextId = accounts.reduce((m, a) => Math.max(m, a.user.id), 0) + 1;
  const account: DemoAccount = {
    email: clean,
    password,
    label: fullName.trim() || clean,
    role: "Producer",
    assignedProjectIds: [],
    companyProfile: null,
    user: {
      id: nextId,
      email: clean,
      full_name: fullName.trim() || clean,
      is_active: true,
      created_at: new Date().toISOString(),
      roles: [{ name: "Producer", slug: "super-admin", permissions: [] }],
    },
  };
  saveDemoAccounts([...accounts, account]);
  return account;
}

export function saveCompanyProfile(userId: number, profile: Omit<CompanyProfile, "createdAt">) {
  const accounts = getDemoAccounts().map((a) =>
    a.user.id === userId ? { ...a, companyProfile: { ...profile, createdAt: new Date().toISOString() } } : a
  );
  saveDemoAccounts(accounts);
}

export function accountNeedsOnboarding(user: AuthUser | null): boolean {
  if (!user) return false;
  const account = getDemoAccounts().find((a) => a.user.id === user.id);
  return account?.companyProfile === null;
}

export const demoUser: AuthUser = {
  ...defaultDemoAccounts[0].user,
};

// Give the signed-in user access to a project they just created, so accounts
// only ever see their own projects (legacy demo producer keeps full access).
export function assignProjectToCurrentUser(projectId: string) {
  const user = getDemoUserFromToken();
  if (!user || !Number.isFinite(user.id)) return;
  const accounts = getDemoAccounts().map((a) =>
    a.user.id === user.id && !a.assignedProjectIds.includes(projectId)
      ? { ...a, assignedProjectIds: [...a.assignedProjectIds, projectId] }
      : a
  );
  saveDemoAccounts(accounts);
}

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

const REFRESH_KEY = "showrunners.refresh_token";

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

function storeRefreshToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REFRESH_KEY, token);
}

function clearRefreshToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(REFRESH_KEY);
}

let _refreshPromise: Promise<boolean> | null = null;

async function tryRefreshTokens(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    storeAccessToken(data.access_token, true);
    storeRefreshToken(data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (response.status === 401 && AUTH_MODE === "api" && token) {
    if (!_refreshPromise) _refreshPromise = tryRefreshTokens();
    const refreshed = await _refreshPromise;
    _refreshPromise = null;
    if (refreshed) {
      const retryHeaders = new Headers(init.headers);
      retryHeaders.set("Content-Type", "application/json");
      const newToken = getAccessToken();
      if (newToken) retryHeaders.set("Authorization", `Bearer ${newToken}`);
      response = await fetch(`${API_URL}${path}`, { ...init, headers: retryHeaders });
    }
  }

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
  const tokenRes = await request<{ access_token: string; refresh_token: string }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  storeAccessToken(tokenRes.access_token, remember);
  storeRefreshToken(tokenRes.refresh_token);
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
    clearRefreshToken();
  }
}

export function hasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user) return false;
  return user.roles.some(
    (role) => role.slug === "super-admin" || role.permissions.some((item) => item.code === permission)
  );
}

// ── Per-account data ownership ─────────────────────────────────────────────
// Signed-up accounts (companyProfile set) own their data privately. Records that
// are not tied to a project carry `ownerAccount` (the creator's email) so they
// show only in that account; unowned project-less records are the shared demo.
export function getCurrentOwnerTag(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const account = getDemoAccountForUser(getDemoUserFromToken());
  return account && account.companyProfile !== undefined ? account.user.email.toLowerCase() : undefined;
}

export function stampOwner<T>(previous: T[] | undefined, next: T[]): T[] {
  const owner = getCurrentOwnerTag();
  if (!owner || !Array.isArray(next)) return next;
  const known = new Set((previous ?? []).map((r) => (r as { id?: unknown })?.id));
  return next.map((record) => {
    if (!record || typeof record !== "object") return record;
    const r = record as Record<string, unknown>;
    if (r.ownerAccount || known.has(r.id)) return record;
    return { ...r, ownerAccount: owner } as T;
  });
}

export function isOwnedRecordVisible(record: unknown, owner: string | undefined): boolean {
  const tag = (record as { ownerAccount?: unknown } | null)?.ownerAccount;
  return owner ? tag === owner : !tag;
}
