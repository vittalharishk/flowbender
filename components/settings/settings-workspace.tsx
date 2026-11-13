"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  Download,
  Key,
  Lock,
  Plus,
  RefreshCcw,
  Save,
  Settings,
  Shield,
  ShieldCheck,
  Upload,
  UserCheck,
  UserMinus,
  Users,
  FileText,
  Database,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { useConfirm } from "@/components/app/confirm-dialog";
import { useAuth } from "@/components/auth-provider";
import { useProjects } from "@/lib/project-store";
import { exportAppData, importAppData, resetAppData, useAppDataCounts, emitAppDataChange } from "@/lib/app-data-store";
import { getDemoAccounts, saveDemoAccounts, type DemoAccount } from "@/lib/auth-client";
import "@/lib/persistence-bootstrap";
import {
  useOrgSettings,
  updateOrgSettings,
  useManagedUsers,
  addManagedUser,
  updateManagedUser,
  useProjectAccess,
  setProjectAccess,
  useAuditLog,
  addAuditEntry,
  type ManagedUser,
  type ProjectAccess,
  type AuditEntry,
} from "@/lib/settings-store";

const ROLES = [
  { value: "owner", label: "Business Owner" },
  { value: "admin", label: "Administrator" },
  { value: "manager", label: "Executive Producer" },
  { value: "accountant", label: "Accountant" },
  { value: "staff", label: "Staff" },
  { value: "viewer", label: "Viewer" },
] as const;

const ACCESS_LEVELS = [
  { value: "full", label: "Full Access" },
  { value: "edit", label: "Edit" },
  { value: "view", label: "View Only" },
  { value: "none", label: "No Access" },
] as const;

function roleLabel(role: string) {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

// ── General Tab ──────────────────────────────────────────────────────────

function GeneralTab() {
  const settings = useOrgSettings();
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm(settings); }, [settings]);

  function save() {
    updateOrgSettings(form);
    addAuditEntry({ userId: "current", action: "update_settings", tableName: "settings" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><div className="text-base font-semibold leading-none tracking-tight">Organization</div></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Production house</Label>
              <Input className="mt-2" value={form.productionHouse} onChange={(e) => setForm({ ...form, productionHouse: e.target.value })} />
            </div>
            <div>
              <Label>Default currency</Label>
              <Select value={form.defaultCurrency} onValueChange={(v) => setForm({ ...form, defaultCurrency: v })}>
                <SelectTrigger className="mt-2" aria-label="Default currency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR · Indian Rupee</SelectItem>
                  <SelectItem value="USD">USD · US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR · Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><div className="text-base font-semibold leading-none tracking-tight">Notifications</div></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div>
              <p className="text-sm font-medium">Deadline alerts</p>
              <p className="text-xs text-muted-foreground mt-1">Notify the production office about upcoming deadlines.</p>
            </div>
            <Switch checked={form.deadlineAlerts} onCheckedChange={(v) => setForm({ ...form, deadlineAlerts: v })} aria-label="Deadline alerts" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div>
              <p className="text-sm font-medium">Daily call sheet reminders</p>
              <p className="text-xs text-muted-foreground mt-1">Send reminders before unit call time.</p>
            </div>
            <Switch checked={form.callSheetReminders} onCheckedChange={(v) => setForm({ ...form, callSheetReminders: v })} aria-label="Daily call sheet reminders" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div>
              <p className="text-sm font-medium">Weekly finance summary</p>
              <p className="text-xs text-muted-foreground mt-1">Include budget and payment changes in the weekly report.</p>
            </div>
            <Switch checked={form.weeklyFinanceSummary} onCheckedChange={(v) => setForm({ ...form, weeklyFinanceSummary: v })} aria-label="Weekly finance summary" />
          </div>
        </CardContent>
      </Card>

      <Button variant="primary" onClick={save} className="gap-2">
        {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? "Preferences saved" : "Save preferences"}
      </Button>
    </div>
  );
}

// ── Users Tab ────────────────────────────────────────────────────────────

function UsersTab() {
  const managedUsers = useManagedUsers();
  const demoAccounts = useMemo(() => getDemoAccounts(), []);
  const confirm = useConfirm();
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", role: "staff" as ManagedUser["role"] });
  const { user: currentUser } = useAuth();
  const isProducer = currentUser?.roles.some((r) => r.slug === "super-admin") ?? false;

  const allUsers: ManagedUser[] = useMemo(() => {
    const fromDemo: ManagedUser[] = demoAccounts.map((a) => ({
      id: `demo-${a.user.id}`,
      email: a.email,
      firstName: a.user.full_name.split(" ")[0],
      lastName: a.user.full_name.split(" ").slice(1).join(" "),
      role: a.role === "Producer" ? "owner" as const : "manager" as const,
      isActive: true,
      createdAt: new Date(0).toISOString(),
    }));
    const managedIds = new Set(managedUsers.map((u) => u.email));
    const merged = [...fromDemo.filter((u) => !managedIds.has(u.email)), ...managedUsers];
    return merged;
  }, [managedUsers, demoAccounts]);

  function handleAdd() {
    if (!form.email.trim() || !form.firstName.trim()) return;
    const newUser: ManagedUser = {
      id: `user-${Date.now()}`,
      email: form.email.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      role: form.role,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    addManagedUser(newUser);
    addAuditEntry({ userId: "current", action: "create_user", tableName: "users", recordId: newUser.id, details: newUser.email });
    setForm({ firstName: "", lastName: "", email: "", role: "staff" });
    setShowAdd(false);
  }

  function handleEdit() {
    if (!editUser) return;
    updateManagedUser(editUser.id, {
      firstName: form.firstName,
      lastName: form.lastName,
      role: form.role,
    });
    addAuditEntry({ userId: "current", action: "update_user", tableName: "users", recordId: editUser.id });
    setEditUser(null);
  }

  async function handleDeactivate(user: ManagedUser) {
    if (!(await confirm({ title: `Deactivate ${user.firstName}?`, description: "They will lose access to all projects.", confirmLabel: "Deactivate" }))) return;
    updateManagedUser(user.id, { isActive: false });
    addAuditEntry({ userId: "current", action: "deactivate_user", tableName: "users", recordId: user.id });
  }

  async function handleReactivate(user: ManagedUser) {
    updateManagedUser(user.id, { isActive: true });
    addAuditEntry({ userId: "current", action: "reactivate_user", tableName: "users", recordId: user.id });
  }

  const columns: DataTableColumn<ManagedUser>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.firstName} {r.lastName}</span>, sortValue: (r) => r.firstName },
    { key: "email", header: "Email", cell: (r) => <span className="text-muted-foreground">{r.email}</span>, sortValue: (r) => r.email },
    { key: "role", header: "Role", cell: (r) => <Badge variant="outline">{roleLabel(r.role)}</Badge>, sortValue: (r) => r.role },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.isActive ? "active" : "inactive"} />, sortValue: (r) => r.isActive ? "active" : "inactive" },
    { key: "lastLogin", header: "Last Login", cell: (r) => r.lastLoginAt ? new Date(r.lastLoginAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—" },
    ...(isProducer ? [{
      key: "actions",
      header: "Actions" as React.ReactNode,
      cell: (r: ManagedUser) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => { setEditUser(r); setForm({ firstName: r.firstName, lastName: r.lastName, email: r.email, role: r.role }); }}>Edit</Button>
          {r.isActive
            ? <Button size="sm" variant="ghost" className="text-red-400" onClick={() => handleDeactivate(r)}><UserMinus className="w-3 h-3" /></Button>
            : <Button size="sm" variant="ghost" className="text-emerald-400" onClick={() => handleReactivate(r)}><UserCheck className="w-3 h-3" /></Button>
          }
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total users" value={String(allUsers.length)} icon={Users} />
        <StatCard label="Active" value={String(allUsers.filter((u) => u.isActive).length)} icon={UserCheck} />
        <StatCard label="Admins" value={String(allUsers.filter((u) => u.role === "owner" || u.role === "admin").length)} icon={ShieldCheck} />
        <StatCard label="Viewers" value={String(allUsers.filter((u) => u.role === "viewer").length)} icon={Users} />
      </div>

      {isProducer && <Button onClick={() => setShowAdd(true)} className="gap-2"><Plus className="w-4 h-4" /> Add User</Button>}

      {allUsers.length > 0 ? (
        <DataTable columns={columns} rows={allUsers} rowKey={(r) => r.id} />
      ) : (
        <EmptyState icon={Users} title="No users" description="Add team members to manage access." />
      )}

      {/* Add User Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First name</Label><Input className="mt-1" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
              <div><Label>Last name</Label><Input className="mt-1" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
            </div>
            <div><Label>Email</Label><Input className="mt-1" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as ManagedUser["role"] })}>
                <SelectTrigger className="mt-1" aria-label="User role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First name</Label><Input className="mt-1" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
              <div><Label>Last name</Label><Input className="mt-1" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
            </div>
            <div><Label>Email</Label><Input className="mt-1" type="email" value={form.email} disabled /></div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as ManagedUser["role"] })}>
                <SelectTrigger className="mt-1" aria-label="Edit user role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Roles & Access Tab ───────────────────────────────────────────────────

function RolesAccessTab() {
  const managedUsers = useManagedUsers();
  const demoAccounts = useMemo(() => getDemoAccounts(), []);
  const projectAccessList = useProjectAccess();
  const projects = useProjects();

  const allUsers = useMemo(() => {
    const fromDemo = demoAccounts.map((a) => ({
      id: `demo-${a.user.id}`,
      name: a.user.full_name,
      role: a.role === "Producer" ? "owner" : "manager",
      assignedProjectIds: a.assignedProjectIds,
    }));
    const fromManaged = managedUsers.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`.trim(),
      role: u.role,
      assignedProjectIds: [] as string[],
    }));
    const ids = new Set(fromManaged.map((u) => u.id));
    return [...fromDemo.filter((u) => !ids.has(u.id)), ...fromManaged];
  }, [managedUsers, demoAccounts]);

  const nonAdminUsers = allUsers.filter((u) => u.role !== "owner" && u.role !== "admin");

  function getAccess(userId: string, projectId: string): string {
    const found = projectAccessList.find((a) => a.userId === userId && a.projectId === projectId);
    if (found) return found.accessLevel;
    const demoAccount = demoAccounts.find((a) => `demo-${a.user.id}` === userId);
    if (demoAccount) return demoAccount.assignedProjectIds.includes(projectId) ? "full" : "none";
    return "none";
  }

  function handleAccessChange(userId: string, projectId: string, level: string) {
    setProjectAccess(userId, projectId, level as ProjectAccess["accessLevel"]);
    const demoAccount = demoAccounts.find((a) => `demo-${a.user.id}` === userId);
    if (demoAccount) {
      const accounts = getDemoAccounts().map((a) => {
        if (`demo-${a.user.id}` !== userId) return a;
        const ids = level === "none"
          ? a.assignedProjectIds.filter((id) => id !== projectId)
          : a.assignedProjectIds.includes(projectId) ? a.assignedProjectIds : [...a.assignedProjectIds, projectId];
        return { ...a, assignedProjectIds: ids };
      });
      saveDemoAccounts(accounts);
      emitAppDataChange();
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="text-base font-semibold leading-none tracking-tight">Project Access Matrix</div>
          <p className="text-sm text-muted-foreground">Business Owners and Administrators have full access to all projects. Configure access for other roles below.</p>
        </CardHeader>
        <CardContent>
          {nonAdminUsers.length === 0 ? (
            <EmptyState icon={Shield} title="No non-admin users" description="Add team members with Manager, Staff, or Viewer roles to configure project access." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium text-muted-foreground">User</th>
                    {projects.map((p) => (
                      <th key={p.id} className="text-center p-2 font-medium text-muted-foreground min-w-[120px]">{p.title}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {nonAdminUsers.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="p-2">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{roleLabel(user.role)}</p>
                      </td>
                      {projects.map((p) => (
                        <td key={p.id} className="p-2 text-center">
                          <Select value={getAccess(user.id, p.id)} onValueChange={(v) => handleAccessChange(user.id, p.id, v)}>
                            <SelectTrigger className="h-8 text-xs w-[100px] mx-auto" aria-label="Access level"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ACCESS_LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><div className="text-base font-semibold leading-none tracking-tight">Role Definitions</div></CardHeader>
        <CardContent className="space-y-3">
          {ROLES.map((r) => (
            <div key={r.value} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{r.label}</p>
                <p className="text-xs text-muted-foreground">{
                  r.value === "owner" ? "Full access to all projects and settings. Can manage all users." :
                  r.value === "admin" ? "Full access to all projects. Can manage non-owner users." :
                  r.value === "manager" ? "Access to assigned projects only. Can manage staff within assigned projects." :
                  r.value === "accountant" ? "Access to finance modules of assigned projects." :
                  r.value === "staff" ? "Access to assigned project modules based on permissions." :
                  "Read-only access to assigned projects."
                }</p>
              </div>
              <Badge variant="outline">{r.value}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Security Tab ─────────────────────────────────────────────────────────

function SecurityTab() {
  const settings = useOrgSettings();
  const [form, setForm] = useState({
    passwordMinLength: settings.passwordMinLength,
    requireUppercase: settings.requireUppercase,
    requireDigit: settings.requireDigit,
    sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
  });
  const [saved, setSaved] = useState(false);

  function save() {
    updateOrgSettings(form);
    addAuditEntry({ userId: "current", action: "update_security_settings", tableName: "settings" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><div className="text-base font-semibold leading-none tracking-tight">Password Policy</div></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Minimum password length</Label>
            <Input className="mt-2 w-32" type="number" min={6} max={32} value={form.passwordMinLength} onChange={(e) => setForm({ ...form, passwordMinLength: Number(e.target.value) })} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div>
              <p className="text-sm font-medium">Require uppercase letter</p>
              <p className="text-xs text-muted-foreground mt-1">At least one uppercase character in passwords.</p>
            </div>
            <Switch checked={form.requireUppercase} onCheckedChange={(v) => setForm({ ...form, requireUppercase: v })} aria-label="Require uppercase letter" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div>
              <p className="text-sm font-medium">Require digit</p>
              <p className="text-xs text-muted-foreground mt-1">At least one numeric digit in passwords.</p>
            </div>
            <Switch checked={form.requireDigit} onCheckedChange={(v) => setForm({ ...form, requireDigit: v })} aria-label="Require digit" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><div className="text-base font-semibold leading-none tracking-tight">Session Management</div></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Session timeout (minutes)</Label>
            <Input className="mt-2 w-40" type="number" min={15} max={1440} value={form.sessionTimeoutMinutes} onChange={(e) => setForm({ ...form, sessionTimeoutMinutes: Number(e.target.value) })} />
            <p className="text-xs text-muted-foreground mt-1">Inactive sessions will be logged out after this period.</p>
          </div>
        </CardContent>
      </Card>

      <Button variant="primary" onClick={save} className="gap-2">
        {saved ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
        {saved ? "Security settings saved" : "Save security settings"}
      </Button>
    </div>
  );
}

// ── Audit Log Tab ────────────────────────────────────────────────────────

function AuditLogTab() {
  const entries = useAuditLog();

  const columns: DataTableColumn<AuditEntry>[] = [
    { key: "time", header: "Time", cell: (r) => new Date(r.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }), sortValue: (r) => r.timestamp },
    { key: "action", header: "Action", cell: (r) => <Badge variant="outline" className="font-mono text-xs">{r.action}</Badge>, sortValue: (r) => r.action },
    { key: "user", header: "User", cell: (r) => r.userEmail ?? r.userId, sortValue: (r) => r.userEmail ?? r.userId },
    { key: "table", header: "Table", cell: (r) => r.tableName ?? "—", sortValue: (r) => r.tableName ?? "" },
    { key: "record", header: "Record ID", cell: (r) => r.recordId ? <span className="font-mono text-xs text-muted-foreground">{r.recordId.slice(0, 12)}</span> : "—" },
    { key: "details", header: "Details", cell: (r) => r.details ?? "—" },
  ];

  return (
    <div className="space-y-6">
      {entries.length > 0 ? (
        <DataTable columns={columns} rows={entries} rowKey={(r) => r.id} pageSize={25} />
      ) : (
        <EmptyState icon={FileText} title="No audit entries" description="Actions performed in the workspace will appear here." />
      )}
    </div>
  );
}

// ── Data Management Tab ──────────────────────────────────────────────────

function DataTab() {
  const confirm = useConfirm();
  const counts = useAppDataCounts();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dataMessage, setDataMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const countCards = [
    { label: "Projects", value: counts.projects },
    { label: "Cast", value: counts.castMembers },
    { label: "Crew", value: counts.crewMembers },
    { label: "Scenes", value: counts.scenes },
    { label: "Script versions", value: counts.scriptVersions },
    { label: "Schedule rows", value: counts.scheduleEntries },
    { label: "Total records", value: counts.totalRecords },
  ];

  function handleExport() {
    try {
      const blob = new Blob([exportAppData()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `flowbender-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setDataMessage({ tone: "success", text: "Data exported successfully." });
    } catch {
      setDataMessage({ tone: "error", text: "Export failed." });
    }
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      importAppData(await file.text());
      setDataMessage({ tone: "success", text: `Imported data from ${file.name}.` });
    } catch {
      setDataMessage({ tone: "error", text: "Import failed. Select a valid export file." });
    } finally {
      event.target.value = "";
    }
  }

  async function handleReset() {
    if (!(await confirm({ title: "Reset local production data?", description: "All local data will be reset to the seeded defaults.", confirmLabel: "Reset" }))) return;
    resetAppData();
    setDataMessage({ tone: "success", text: "Local data reset to seeded defaults." });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold leading-none tracking-tight">Data Management</div>
              <p className="text-sm text-muted-foreground mt-1">The demo is bundled in the app. Edits are saved locally in this browser.</p>
            </div>
            <Database className="w-5 h-5 text-amber-500" />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {countCards.map((c) => (
              <div key={c.label} className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-2xl font-semibold mt-2">{c.value}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2" onClick={handleExport}><Download className="w-4 h-4" /> Export JSON</Button>
            <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4" /> Import JSON</Button>
            <Button variant="outline" className="gap-2" onClick={handleReset}><RefreshCcw className="w-4 h-4" /> Restore defaults</Button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} aria-label="Import JSON file" />
          </div>
          {dataMessage && (
            <div className={`rounded-lg border px-4 py-3 text-sm ${dataMessage.tone === "success" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-red-500/20 bg-red-500/10 text-red-400"}`}>
              {dataMessage.text}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/30 p-4 text-sm">
            <div>
              <p className="font-medium">Last local update</p>
              <p className="text-muted-foreground mt-1">{new Date(counts.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
            </div>
            <Badge variant="outline">{counts.totalRecords} records</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Settings Workspace ──────────────────────────────────────────────

export function SettingsWorkspace() {
  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <PageHeader
        title="Settings"
        description="Manage workspace configuration, users, roles, security, and data."
        icon={Settings}
        as="h1"
      />

      <Tabs defaultValue="general">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="general" className="gap-1.5"><Building2 className="w-3.5 h-3.5" /> General</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Users</TabsTrigger>
          <TabsTrigger value="access" className="gap-1.5"><Shield className="w-3.5 h-3.5" /> Roles & Access</TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5"><Lock className="w-3.5 h-3.5" /> Security</TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5"><Clock className="w-3.5 h-3.5" /> Audit Log</TabsTrigger>
          <TabsTrigger value="data" className="gap-1.5"><Database className="w-3.5 h-3.5" /> Data</TabsTrigger>
        </TabsList>

        <TabsContent value="general"><GeneralTab /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="access"><RolesAccessTab /></TabsContent>
        <TabsContent value="security"><SecurityTab /></TabsContent>
        <TabsContent value="audit"><AuditLogTab /></TabsContent>
        <TabsContent value="data"><DataTab /></TabsContent>
      </Tabs>
    </div>
  );
}
