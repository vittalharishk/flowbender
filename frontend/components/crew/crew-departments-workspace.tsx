"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCrewMembers,
  addCrewMember,
  updateCrewMember,
  useRemunerationAgreements,
  addRemunerationAgreement,
  updateRemunerationAgreement,
  recordPaymentAndUpdateAgreement,
  useCrewPaymentRecords,
  calcRemunerationSummary,
  formatINR,
} from "@/lib/crew-store";
import { useAppDataSlice } from "@/lib/app-data-store";
import { CREW_DEPARTMENTS, normalizeDeptKey, DEPT_BY_KEY } from "@/lib/crew-departments";
import type {
  CrewMember,
  RemunerationAgreement,
  RemunerationPaymentStatus,
  RemunerationPeriod,
} from "@/lib/types";

interface Props {
  projectId?: string;
}

const paymentStatusColor: Record<RemunerationPaymentStatus, string> = {
  pending: "bg-red-500/20 text-red-300 border-red-500/30",
  "partially-paid": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  paid: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "on-hold": "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

export function CrewDepartmentsWorkspace({ projectId }: Props) {
  const allCrew = useCrewMembers();
  const scopedCrew = projectId ? allCrew.filter(c => c.projectId === projectId) : allCrew;
  const agreements = useRemunerationAgreements(projectId);
  const projects = useAppDataSlice("projects") ?? [];

  const summary = useMemo(() => calcRemunerationSummary(agreements), [agreements]);

  const deptStats = useMemo(() =>
    CREW_DEPARTMENTS.map(dept => {
      const deptCrew = allCrew.filter(c => normalizeDeptKey(c.department) === dept.key);
      const deptAgs = agreements.filter(a => normalizeDeptKey(a.department) === dept.key);
      return {
        ...dept,
        count: deptCrew.length,
        totalPayable: deptAgs.reduce((s, a) => s + a.totalPayable, 0),
        paid: deptAgs.reduce((s, a) => s + a.advancePaid, 0),
      };
    }),
    [allCrew, agreements]
  );

  return (
    <Tabs defaultValue="dashboard" className="space-y-4">
      <TabsList className="flex-wrap h-auto gap-1">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="departments">Departments</TabsTrigger>
        <TabsTrigger value="crew">Crew</TabsTrigger>
        <TabsTrigger value="remuneration">Remuneration</TabsTrigger>
      </TabsList>

      {/* ── DASHBOARD ── */}
      <TabsContent value="dashboard" className="space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Total Crew</p>
              <p className="text-3xl font-bold text-blue-400">{allCrew.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Across {projects.length} projects</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Total Agreed</p>
              <p className="text-2xl font-bold text-emerald-400">{formatINR(summary.totalAgreed)}</p>
            </CardContent>
          </Card>
          <Card className="border-violet-500/20 bg-violet-500/5">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold text-violet-400">{formatINR(summary.totalPaid)}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p className="text-2xl font-bold text-amber-400">{formatINR(summary.totalPending)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Department cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {deptStats.map(dept => (
            <Card key={dept.key} className="border-border/50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">{dept.name}</p>
                  <Badge variant="outline" className="text-xs">{dept.count} crew</Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Payable</span><span className="text-foreground">{formatINR(dept.totalPayable)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid</span><span className="text-emerald-400">{formatINR(dept.paid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Outstanding</span>
                    <span className="text-amber-400">{formatINR(dept.totalPayable - dept.paid)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Project allocation table */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Project-wise Crew Allocation</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left pb-2 font-medium text-muted-foreground">Project</th>
                  <th className="text-right pb-2 font-medium text-muted-foreground">Crew</th>
                  <th className="text-right pb-2 font-medium text-muted-foreground">Payable</th>
                  <th className="text-right pb-2 font-medium text-muted-foreground">Paid</th>
                  <th className="text-right pb-2 font-medium text-muted-foreground">Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => {
                  const pc = allCrew.filter(c => c.projectId === p.id).length;
                  const pa = agreements.filter(a => a.projectId === p.id);
                  const payable = pa.reduce((s, a) => s + a.totalPayable, 0);
                  const paid = pa.reduce((s, a) => s + a.advancePaid, 0);
                  return (
                    <tr key={p.id} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="py-2 font-medium">{p.title}</td>
                      <td className="py-2 text-right">{pc}</td>
                      <td className="py-2 text-right">{formatINR(payable)}</td>
                      <td className="py-2 text-right text-emerald-400">{formatINR(paid)}</td>
                      <td className="py-2 text-right text-amber-400">{formatINR(payable - paid)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── DEPARTMENTS ── */}
      <TabsContent value="departments">
        <DepartmentsTab allCrew={allCrew} agreements={agreements} />
      </TabsContent>

      {/* ── CREW ── */}
      <TabsContent value="crew">
        <CrewTab crew={scopedCrew} projects={projects} projectId={projectId} />
      </TabsContent>

      {/* ── REMUNERATION ── */}
      <TabsContent value="remuneration">
        <RemunerationTab agreements={agreements} crew={allCrew} projects={projects} projectId={projectId} />
      </TabsContent>
    </Tabs>
  );
}

// ─── DEPARTMENTS TAB ────────────────────────────────────────────────────────

function DepartmentsTab({ allCrew, agreements }: { allCrew: CrewMember[]; agreements: RemunerationAgreement[] }) {
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {CREW_DEPARTMENTS.map(dept => {
          const deptCrew = allCrew.filter(c => normalizeDeptKey(c.department) === dept.key);
          const deptAgs = agreements.filter(a => normalizeDeptKey(a.department) === dept.key);
          const payable = deptAgs.reduce((s, a) => s + a.totalPayable, 0);
          const paid = deptAgs.reduce((s, a) => s + a.advancePaid, 0);
          return (
            <Card
              key={dept.key}
              className="border-border/50 cursor-pointer hover:border-amber-500/40 transition-colors"
              onClick={() => setSelectedDept(dept.key)}
            >
              <CardContent className="pt-4">
                <p className="font-medium mb-1">{dept.name}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  {dept.designations.slice(0, 3).join(", ")}{dept.designations.length > 3 ? "…" : ""}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <Badge variant="outline">{deptCrew.length} crew</Badge>
                  <span className="text-xs text-amber-400">{formatINR(payable - paid)} pending</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedDept && (
        <DeptDetailDialog
          deptKey={selectedDept}
          crew={allCrew.filter(c => normalizeDeptKey(c.department) === selectedDept)}
          agreements={agreements.filter(a => normalizeDeptKey(a.department) === selectedDept)}
          onClose={() => setSelectedDept(null)}
        />
      )}
    </div>
  );
}

function DeptDetailDialog({
  deptKey, crew, agreements, onClose,
}: {
  deptKey: string;
  crew: CrewMember[];
  agreements: RemunerationAgreement[];
  onClose: () => void;
}) {
  const dept = DEPT_BY_KEY[deptKey];
  const payable = agreements.reduce((s, a) => s + a.totalPayable, 0);
  const paid = agreements.reduce((s, a) => s + a.advancePaid, 0);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dept?.name ?? deptKey}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border px-3 py-2 text-center">
              <p className="text-2xl font-bold text-blue-400">{crew.length}</p>
              <p className="text-xs text-muted-foreground">Crew Members</p>
            </div>
            <div className="rounded-lg border px-3 py-2 text-center">
              <p className="text-lg font-bold text-emerald-400">{formatINR(paid)}</p>
              <p className="text-xs text-muted-foreground">Paid</p>
            </div>
            <div className="rounded-lg border px-3 py-2 text-center">
              <p className="text-lg font-bold text-amber-400">{formatINR(payable - paid)}</p>
              <p className="text-xs text-muted-foreground">Outstanding</p>
            </div>
          </div>
          <div className="space-y-2">
            {crew.map(c => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.role} · {c.projectTitle}</p>
                </div>
                <Badge variant="outline" className="text-xs">{c.availability}</Badge>
              </div>
            ))}
            {crew.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No crew in this department</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── CREW TAB ───────────────────────────────────────────────────────────────

function CrewTab({ crew, projects, projectId }: { crew: CrewMember[]; projects: any[]; projectId?: string }) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [editMember, setEditMember] = useState<CrewMember | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    return crew.filter(c => {
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.role.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === "all" || normalizeDeptKey(c.department) === deptFilter;
      return matchSearch && matchDept;
    });
  }, [crew, search, deptFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1 min-w-0">
          <Input
            placeholder="Search crew…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {CREW_DEPARTMENTS.map(d => (
                <SelectItem key={d.key} value={d.key}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>+ Add Crew</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Department</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Designation</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Project</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Day Rate</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const outstanding = (c.totalDays * c.dayRate) - c.totalPaid;
                return (
                  <tr key={c.id} className="border-b border-border/30 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge variant="outline" className="text-xs capitalize">{c.department}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{c.role}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">{c.projectTitle}</td>
                    <td className="px-4 py-3 text-right">{formatINR(c.dayRate)}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge
                        variant="outline"
                        className={`text-xs ${c.availability === "on-set" ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-500/20 text-slate-300"}`}
                      >
                        {c.availability}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" onClick={() => setEditMember(c)}>Edit</Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No crew members found</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {editMember && (
        <CrewProfileDialog
          member={editMember}
          projects={projects}
          onClose={() => setEditMember(null)}
        />
      )}
      {showAdd && (
        <CrewProfileDialog
          member={null}
          projects={projects}
          onClose={() => setShowAdd(false)}
          projectId={projectId}
        />
      )}
    </div>
  );
}

function CrewProfileDialog({
  member, projects, onClose, projectId,
}: {
  member: CrewMember | null;
  projects: any[];
  onClose: () => void;
  projectId?: string;
}) {
  const [form, setForm] = useState<Partial<CrewMember>>({
    name: member?.name ?? "",
    role: member?.role ?? "",
    department: member?.department ?? "production",
    projectId: member?.projectId ?? projectId ?? "p1",
    email: member?.email ?? "",
    phone: member?.phone ?? "",
    dayRate: member?.dayRate ?? 5000,
    availability: member?.availability ?? "available",
    notes: member?.notes ?? "",
    contractStatus: member?.contractStatus ?? "pending",
    paymentStatus: member?.paymentStatus ?? "pending",
    totalDays: member?.totalDays ?? 20,
    daysWorked: member?.daysWorked ?? 0,
    totalPaid: member?.totalPaid ?? 0,
    joinedDate: member?.joinedDate ?? new Date().toISOString().slice(0, 10),
    initials: member?.initials ?? "",
    projectTitle: member?.projectTitle ?? "",
  });

  const set = (k: keyof CrewMember, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    const proj = projects.find(p => p.id === form.projectId);
    const updated = {
      ...form,
      projectTitle: proj?.title ?? form.projectTitle,
      initials: form.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "",
    } as CrewMember;

    if (member) {
      updateCrewMember(member.id, updated);
    } else {
      addCrewMember(updated);
    }
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? "Edit Crew Member" : "Add Crew Member"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Full Name</Label>
            <Input value={form.name ?? ""} onChange={e => set("name", e.target.value)} />
          </div>
          <div>
            <Label>Designation / Role</Label>
            <Input value={form.role ?? ""} onChange={e => set("role", e.target.value)} />
          </div>
          <div>
            <Label>Department</Label>
            <Input value={form.department ?? ""} onChange={e => set("department", e.target.value as any)} placeholder="e.g. camera, direction" />
          </div>
          <div>
            <Label>Project</Label>
            <Select value={form.projectId} onValueChange={v => set("projectId", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Availability</Label>
            <Select value={form.availability} onValueChange={v => set("availability", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["available", "on-set", "on-leave", "unavailable"].map(s =>
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Email</Label>
            <Input value={form.email ?? ""} onChange={e => set("email", e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone ?? ""} onChange={e => set("phone", e.target.value)} />
          </div>
          <div>
            <Label>Day Rate (₹)</Label>
            <Input type="number" value={form.dayRate ?? ""} onChange={e => set("dayRate", Number(e.target.value))} />
          </div>
          <div>
            <Label>Total Days</Label>
            <Input type="number" value={form.totalDays ?? ""} onChange={e => set("totalDays", Number(e.target.value))} />
          </div>
          <div>
            <Label>Joining Date</Label>
            <Input type="date" value={form.joinedDate ?? ""} onChange={e => set("joinedDate", e.target.value)} />
          </div>
          <div>
            <Label>Contract Status</Label>
            <Select value={form.contractStatus} onValueChange={v => set("contractStatus", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["pending", "negotiating", "signed", "expired"].map(s =>
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes ?? ""} onChange={e => set("notes", e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.name}>
            {member ? "Save Changes" : "Add Crew Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── REMUNERATION TAB ───────────────────────────────────────────────────────

function RemunerationTab({
  agreements, crew, projects, projectId,
}: {
  agreements: RemunerationAgreement[];
  crew: CrewMember[];
  projects: any[];
  projectId?: string;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedAg, setSelectedAg] = useState<RemunerationAgreement | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showPayment, setShowPayment] = useState<RemunerationAgreement | null>(null);

  const filtered = useMemo(() => {
    return agreements.filter(ag => {
      const c = crew.find(m => m.id === ag.crewMemberId);
      const matchSearch = !search || c?.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || ag.status === statusFilter;
      const matchDept = deptFilter === "all" || normalizeDeptKey(ag.department) === deptFilter;
      return matchSearch && matchStatus && matchDept;
    });
  }, [agreements, crew, search, statusFilter, deptFilter]);

  const crewById = useMemo(() => Object.fromEntries(crew.map(c => [c.id, c])), [crew]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Search crew…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-40"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(["pending", "partially-paid", "paid", "on-hold"] as const).map(s =>
                <SelectItem key={s} value={s}>{s}</SelectItem>
              )}
            </SelectContent>
          </Select>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Depts" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {CREW_DEPARTMENTS.map(d => <SelectItem key={d.key} value={d.key}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>+ New Agreement</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Crew Member</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Dept</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Payable</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Paid</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Outstanding</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ag => {
                const c = crewById[ag.crewMemberId];
                const outstanding = ag.totalPayable - ag.advancePaid;
                return (
                  <tr key={ag.id} className="border-b border-border/30 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium">{c?.name ?? ag.crewMemberId}</p>
                      <p className="text-xs text-muted-foreground">{ag.designation}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground capitalize">{ag.department}</span>
                    </td>
                    <td className="px-4 py-3 text-right">{formatINR(ag.totalPayable)}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">{formatINR(ag.advancePaid)}</td>
                    <td className={`px-4 py-3 text-right ${outstanding > 0 ? "text-amber-400" : "text-muted-foreground"}`}>
                      {formatINR(outstanding)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className={`text-xs ${paymentStatusColor[ag.status]}`}>
                        {ag.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedAg(ag)}>View</Button>
                        {outstanding > 0 && (
                          <Button size="sm" variant="ghost" className="text-emerald-400" onClick={() => setShowPayment(ag)}>
                            Pay
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No agreements found</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {selectedAg && (
        <AgreementDetailDialog
          agreement={selectedAg}
          crewMember={crewById[selectedAg.crewMemberId]}
          onClose={() => setSelectedAg(null)}
          onPay={() => { setShowPayment(selectedAg); setSelectedAg(null); }}
        />
      )}
      {showPayment && (
        <PaymentDialog
          agreement={showPayment}
          crewMember={crewById[showPayment.crewMemberId]}
          onClose={() => setShowPayment(null)}
        />
      )}
      {showAdd && (
        <NewAgreementDialog
          crew={crew}
          projects={projects}
          projectId={projectId}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

function AgreementDetailDialog({
  agreement, crewMember, onClose, onPay,
}: {
  agreement: RemunerationAgreement;
  crewMember?: CrewMember;
  onClose: () => void;
  onPay: () => void;
}) {
  const paymentRecords = useCrewPaymentRecords(agreement.id);
  const outstanding = agreement.totalPayable - agreement.advancePaid;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Remuneration Agreement</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-muted-foreground text-xs">Crew Member</p><p className="font-medium">{crewMember?.name}</p></div>
            <div><p className="text-muted-foreground text-xs">Designation</p><p>{agreement.designation}</p></div>
            <div><p className="text-muted-foreground text-xs">Department</p><p className="capitalize">{agreement.department}</p></div>
            <div><p className="text-muted-foreground text-xs">Period</p><p className="capitalize">{agreement.period}</p></div>
            <div><p className="text-muted-foreground text-xs">Day Rate</p><p className="font-medium">{formatINR(agreement.agreedAmount)}</p></div>
            <div><p className="text-muted-foreground text-xs">Start Date</p><p>{agreement.workStartDate}</p></div>
            <div><p className="text-muted-foreground text-xs">Total Payable</p><p className="font-bold text-blue-400">{formatINR(agreement.totalPayable)}</p></div>
            <div><p className="text-muted-foreground text-xs">Paid</p><p className="font-bold text-emerald-400">{formatINR(agreement.advancePaid)}</p></div>
            <div className="col-span-2"><p className="text-muted-foreground text-xs">Outstanding</p><p className={`font-bold text-lg ${outstanding > 0 ? "text-amber-400" : "text-emerald-400"}`}>{formatINR(outstanding)}</p></div>
          </div>

          {paymentRecords.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Payment History</p>
              <div className="space-y-2">
                {paymentRecords.map(pr => (
                  <div key={pr.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs">
                    <div>
                      <p className="font-medium">{formatINR(pr.amount)}</p>
                      <p className="text-muted-foreground">{pr.paymentDate} · {pr.type} · {pr.paymentReference}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{pr.type}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {outstanding > 0 && <Button onClick={onPay} className="bg-emerald-600 hover:bg-emerald-700">Record Payment</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaymentDialog({
  agreement, crewMember, onClose,
}: {
  agreement: RemunerationAgreement;
  crewMember?: CrewMember;
  onClose: () => void;
}) {
  const outstanding = agreement.totalPayable - agreement.advancePaid;
  const [amount, setAmount] = useState(outstanding);
  const [type, setType] = useState<"advance" | "partial" | "full" | "final">("partial");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [ref, setRef] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleRecord = () => {
    if (amount <= 0) { setError("Amount must be greater than 0"); return; }
    if (amount > outstanding) { setError(`Amount cannot exceed outstanding ₹${outstanding.toLocaleString("en-IN")}`); return; }
    recordPaymentAndUpdateAgreement(agreement.id, {
      crewMemberId: agreement.crewMemberId,
      projectId: agreement.projectId,
      amount,
      paymentDate: date,
      paymentReference: ref,
      type,
      notes,
      recordedBy: "Production Manager",
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment — {crewMember?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border bg-amber-500/5 px-3 py-2 text-sm">
            Outstanding: <span className="font-bold text-amber-400">{formatINR(outstanding)}</span>
          </div>
          <div>
            <Label>Amount (₹)</Label>
            <Input type="number" value={amount} onChange={e => { setAmount(Number(e.target.value)); setError(""); }} />
          </div>
          <div>
            <Label>Payment Type</Label>
            <Select value={type} onValueChange={v => setType(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["advance", "partial", "full", "final"] as const).map(t =>
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Payment Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Payment Reference</Label>
            <Input value={ref} onChange={e => setRef(e.target.value)} placeholder="e.g. NEFT-123456" />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleRecord} className="bg-emerald-600 hover:bg-emerald-700">Record Payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewAgreementDialog({
  crew, projects, projectId, onClose,
}: {
  crew: CrewMember[];
  projects: any[];
  projectId?: string;
  onClose: () => void;
}) {
  const [crewId, setCrewId] = useState(crew[0]?.id ?? "");
  const [projId, setProjId] = useState(projectId ?? "p1");
  const [period, setPeriod] = useState<RemunerationPeriod>("daily");
  const [agreedAmount, setAgreedAmount] = useState(5000);
  const [totalPayable, setTotalPayable] = useState(100000);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const selectedCrew = crew.find(c => c.id === crewId);

  const handleSave = () => {
    addRemunerationAgreement({
      crewMemberId: crewId,
      projectId: projId,
      department: selectedCrew?.department ?? "production",
      designation: selectedCrew?.role ?? "Crew Member",
      period,
      agreedAmount,
      workStartDate: startDate,
      totalPayable,
      advancePaid: 0,
      notes,
      status: "pending",
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Remuneration Agreement</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Crew Member</Label>
            <Select value={crewId} onValueChange={setCrewId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {crew.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Project</Label>
            <Select value={projId} onValueChange={setProjId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Period</Label>
            <Select value={period} onValueChange={v => setPeriod(v as RemunerationPeriod)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["daily", "weekly", "monthly", "fixed", "per-project"] as const).map(p =>
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Agreed Amount (₹)</Label>
            <Input type="number" value={agreedAmount} onChange={e => setAgreedAmount(Number(e.target.value))} />
          </div>
          <div>
            <Label>Total Payable (₹)</Label>
            <Input type="number" value={totalPayable} onChange={e => setTotalPayable(Number(e.target.value))} />
          </div>
          <div>
            <Label>Work Start Date</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!crewId}>Create Agreement</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
