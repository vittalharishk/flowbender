"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Database,
  Download,
  FileText,
  IndianRupee,
  Megaphone,
  PackageCheck,
  Plus,
  RefreshCcw,
  Save,
  Settings,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react";
import "@/lib/persistence-bootstrap";
import { exportAppData, importAppData, resetAppData, useAppDataCounts } from "@/lib/app-data-store";
import { useProjects } from "@/lib/project-store";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/components/auth-provider";
import { emitAppDataChange } from "@/lib/app-data-store";
import { getDemoAccounts, saveDemoAccounts, type DemoAccount } from "@/lib/auth-client";

type Workspace = "distribution" | "reports" | "settings";

function Header({ workspace, projectTitle }: { workspace: Workspace; projectTitle?: string }) {
  const metadata: Record<Workspace, { title: string; description: string; icon: typeof Megaphone }> = {
    distribution: {
      title: "Distribution & Rights",
      description: "Coordinate territories, rights, deliverables, and platform conversations.",
      icon: Megaphone,
    },
    reports: {
      title: "Reports",
      description: "Presentation-ready production, finance, people, and delivery intelligence.",
      icon: BarChart3,
    },
    settings: {
      title: "Settings",
      description: "Configure workspace preferences, notifications, and production defaults.",
      icon: Settings,
    },
  };
  const { title, description, icon: Icon } = metadata[workspace];
  return <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"><div className="flex gap-3"><div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-amber-500" /></div><div><div className="flex items-center gap-2 flex-wrap"><h2 className="text-2xl font-bold">{title}</h2>{projectTitle && <Badge variant="outline" className="text-xs">{projectTitle}</Badge>}</div><p className="text-sm text-muted-foreground mt-1">{description}</p></div></div><Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white"><Plus className="w-4 h-4" /> Add record</Button></div>;
}

function Metric({ label, value, icon: Icon, tone = "text-foreground" }: { label: string; value: string; icon: typeof Megaphone; tone?: string }) {
  return <Card><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{label}</span><Icon className="w-4 h-4 text-muted-foreground" /></div><p className={`text-xl font-semibold mt-2 ${tone}`}>{value}</p></CardContent></Card>;
}

function Progress({ value, className = "" }: { value: number; className?: string }) {
  return <div className={`rounded-full bg-secondary overflow-hidden ${className}`}><div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}

export function DistributionWorkspace({ projectTitle }: { projectTitle?: string }) {
  const [selectedTerritory, setSelectedTerritory] = useState("Nizam");
  const [dealSaved, setDealSaved] = useState(false);
  const deals = [
    { territory: "Nizam", distributor: "Saffron Films", status: "Negotiating", advance: 18500000, balance: 42000000, progress: 68 },
    { territory: "Ceded", distributor: "South Arc Pictures", status: "Agreement sent", advance: 9200000, balance: 23800000, progress: 44 },
    { territory: "Andhra", distributor: "Coastal Releasing", status: "Preparing", advance: 0, balance: 28500000, progress: 18 },
    { territory: "ROI", distributor: "Northstar Distribution", status: "Signed", advance: 31200000, balance: 64000000, progress: 100 },
    { territory: "Overseas", distributor: "Global Film Market", status: "In discussion", advance: 6800000, balance: 17800000, progress: 32 },
  ];
  const deal = deals.find((item) => item.territory === selectedTerritory) || deals[0];
  return <div className="space-y-6 max-w-[1400px] mx-auto"><Header workspace="distribution" projectTitle={projectTitle} /><div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Metric label="Gross rights value" value="₹20.4 Cr" icon={CircleDollarSign} tone="text-emerald-400" /><Metric label="Advance received" value="₹6.57 Cr" icon={IndianRupee} tone="text-cyan-400" /><Metric label="Open territories" value="4 / 5" icon={Megaphone} tone="text-amber-400" /><Metric label="Deliverables ready" value="68%" icon={PackageCheck} /></div><div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">Territory rights</CardTitle></CardHeader><CardContent className="p-0"><div className="divide-y">{deals.map((item) => <button key={item.territory} type="button" onClick={() => setSelectedTerritory(item.territory)} className={`w-full flex flex-wrap items-center gap-3 px-6 py-4 text-left hover:bg-muted/40 ${item.territory === selectedTerritory ? "bg-amber-500/5" : ""}`}><div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-xs font-bold text-amber-500">{item.territory.slice(0, 2)}</div><div className="flex-1 min-w-[150px]"><p className="text-sm font-medium">{item.territory}</p><p className="text-xs text-muted-foreground mt-1">{item.distributor}</p></div><span className="text-sm font-semibold">{formatINR(item.advance)}</span><Badge variant="outline" className={item.status === "Signed" ? "border-emerald-500/20 text-emerald-400" : "border-amber-500/20 text-amber-400"}>{item.status}</Badge><ChevronRight className="w-4 h-4 text-muted-foreground" /></button>)}</div></CardContent></Card><Card><CardHeader><CardTitle className="text-base">Selected deal</CardTitle></CardHeader><CardContent className="space-y-4"><div><p className="text-xs text-muted-foreground">Territory</p><p className="font-semibold mt-1">{deal.territory}</p></div><div><p className="text-xs text-muted-foreground">Distributor</p><p className="font-medium mt-1">{deal.distributor}</p></div><div><div className="flex justify-between text-xs mb-2"><span className="text-muted-foreground">Agreement progress</span><span>{deal.progress}%</span></div><Progress value={deal.progress} className="h-2" /></div><div className="grid grid-cols-2 gap-3"><div><p className="text-xs text-muted-foreground">Advance</p><p className="font-semibold mt-1">{formatINR(deal.advance)}</p></div><div><p className="text-xs text-muted-foreground">Balance</p><p className="font-semibold mt-1">{formatINR(deal.balance)}</p></div></div><Button className="w-full" variant="outline" onClick={() => setDealSaved(true)}>{dealSaved ? <><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" /> Deal saved</> : "Save deal update"}</Button></CardContent></Card></div><Card><CardHeader><CardTitle className="text-base">Release deliverables</CardTitle></CardHeader><CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">{["Theatrical master", "Trailer and press kit", "Subtitles and DCP package"].map((item, index) => <div key={item} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"><CheckCircle2 className={`w-4 h-4 ${index < 2 ? "text-emerald-400" : "text-amber-400"}`} /><span className="text-sm flex-1">{item}</span><span className="text-xs text-muted-foreground">{index < 2 ? "Ready" : "Pending"}</span></div>)}</CardContent></Card></div>;
}

export function ReportsWorkspace() {
  const projects = useProjects();
  const [project, setProject] = useState("all");
  return <div className="space-y-6 max-w-[1400px] mx-auto"><Header workspace="reports" /><div className="flex flex-col sm:flex-row gap-3"><Select value={project} onValueChange={setProject}><SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All projects</SelectItem>{projects.map((item) => <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}</SelectContent></Select><Button variant="outline" className="gap-2"><FileText className="w-4 h-4" /> Export report</Button></div><div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Metric label="Active projects" value={String(projects.filter((item) => !["completed", "on-hold"].includes(item.status)).length)} icon={FileText} /><Metric label="Portfolio budget" value={formatINR(projects.reduce((total, item) => total + item.budget, 0))} icon={IndianRupee} /><Metric label="Production spend" value={formatINR(projects.reduce((total, item) => total + item.spent, 0))} icon={CircleDollarSign} tone="text-amber-400" /><Metric label="Upcoming deadlines" value="12" icon={BarChart3} tone="text-cyan-400" /></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card><CardHeader><CardTitle className="text-base">Executive reports</CardTitle></CardHeader><CardContent className="space-y-3">{["Project overview", "Budget vs actual", "Production progress", "Cast and crew costs", "Post-production progress", "Distribution sales"].map((report) => <button key={report} type="button" className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/30 text-left hover:bg-muted/60"><BarChart3 className="w-4 h-4 text-amber-500" /><span className="text-sm flex-1">{report}</span><ChevronRight className="w-4 h-4 text-muted-foreground" /></button>)}</CardContent></Card><Card><CardHeader><CardTitle className="text-base">Portfolio status</CardTitle></CardHeader><CardContent className="space-y-4">{projects.slice(0, 5).map((item) => { const progress = item.budget ? Math.round(item.spent / item.budget * 100) : 0; return <div key={item.id}><div className="flex justify-between text-sm mb-2"><span>{item.title}</span><span className="text-muted-foreground">{progress}% spend</span></div><Progress value={progress} className="h-2" /></div>; })}</CardContent></Card></div><Card><CardHeader><CardTitle className="text-base">Report filters</CardTitle></CardHeader><CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4"><div><Label>Date range</Label><Input className="mt-2" type="date" defaultValue="2026-09-04" /></div><div><Label>Department</Label><Select defaultValue="all"><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All departments</SelectItem><SelectItem value="production">Production</SelectItem><SelectItem value="finance">Finance</SelectItem><SelectItem value="post">Post Production</SelectItem></SelectContent></Select></div><div><Label>Status</Label><Select defaultValue="all"><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="open">Open items</SelectItem><SelectItem value="complete">Completed</SelectItem></SelectContent></Select></div></CardContent></Card></div>;
}

export function SettingsWorkspace() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [dataMessage, setDataMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const counts = useAppDataCounts();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountEmail, setNewAccountEmail] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const projects = useProjects();
  const isProducer = user?.roles.some((role) => role.slug === "super-admin") ?? false;

  useEffect(() => {
    setAccounts(getDemoAccounts());
  }, []);

  const countCards = [
    { label: "Projects", value: counts.projects },
    { label: "Cast", value: counts.castMembers },
    { label: "Crew", value: counts.crewMembers },
    { label: "Scenes", value: counts.scenes },
    { label: "Script versions", value: counts.scriptVersions },
    { label: "Schedule rows", value: counts.scheduleEntries },
    { label: "Shoot days", value: counts.shootDays },
    { label: "Call sheets", value: counts.callSheets },
    { label: "Notifications", value: counts.notifications },
    { label: "Extra records", value: counts.extraRecords },
    { label: "Total records", value: counts.totalRecords },
  ];

  function handleExport() {
    try {
      const blob = new Blob([exportAppData()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `showrunner-data-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setDataMessage({ tone: "success", text: "Data exported successfully." });
    } catch (error) {
      console.error("Failed to export Showrunner data.", error);
      setDataMessage({ tone: "error", text: "Export failed. Check browser storage permissions and try again." });
    }
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      importAppData(await file.text());
      setDataMessage({ tone: "success", text: `Imported data from ${file.name}.` });
    } catch (error) {
      console.error("Failed to import Showrunner data.", error);
      setDataMessage({ tone: "error", text: "Import failed. Select a valid Showrunner export file." });
    } finally {
      event.target.value = "";
    }
  }

  function handleReset() {
    if (!window.confirm("Reset all local production data back to the seeded defaults?")) {
      return;
    }

    resetAppData();
    setDataMessage({ tone: "success", text: "Local data reset to seeded defaults." });
  }

  function saveAccounts(next: DemoAccount[]) {
    setAccounts(next);
    saveDemoAccounts(next);
    emitAppDataChange();
  }

  function addAccount(event: React.FormEvent) {
    event.preventDefault();
    const email = newAccountEmail.trim().toLowerCase();
    if (!newAccountName.trim() || !email) {
      setAccountMessage("Name and email are required.");
      return;
    }
    if (accounts.some((account) => account.email.toLowerCase() === email)) {
      setAccountMessage("An account with this email already exists.");
      return;
    }
    const id = Math.max(...accounts.map((account) => account.user.id), 0) + 1;
    const template = accounts.find((account) => account.role === "Production Manager") ?? accounts[0];
    const account: DemoAccount = {
      email,
      password: "demo",
      label: newAccountName.trim(),
      role: "Production Manager",
      assignedProjectIds: [],
      user: { ...template.user, id, email, full_name: newAccountName.trim() },
    };
    saveAccounts([...accounts, account]);
    setNewAccountName("");
    setNewAccountEmail("");
    setAccountMessage(`${account.label} added. Demo password: demo`);
  }

  const accountManager = isProducer ? <Card><CardHeader><CardTitle className="text-base">Demo account access</CardTitle><p className="text-sm text-muted-foreground">Add production managers and choose which projects each manager can access.</p></CardHeader><CardContent className="space-y-5"><form onSubmit={addAccount} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><Input value={newAccountName} onChange={(event) => setNewAccountName(event.target.value)} placeholder="Manager name" aria-label="Manager name" /><Input type="email" value={newAccountEmail} onChange={(event) => setNewAccountEmail(event.target.value)} placeholder="Email address" aria-label="Manager email" /><Button type="submit"><Plus className="mr-2 h-4 w-4" />Add manager</Button></form>{accountMessage && <p className="text-sm text-emerald-400">{accountMessage}</p>}<div className="space-y-3">{accounts.filter((account) => account.role !== "Producer").map((account) => <div key={account.user.id} className="rounded-lg border bg-muted/20 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium">{account.label}</p><p className="text-xs text-muted-foreground">{account.email} · {account.assignedProjectIds.length} projects</p></div><Button type="button" size="sm" variant="outline" onClick={() => saveAccounts(accounts.filter((item) => item.user.id !== account.user.id))}>Remove account</Button></div><div className="mt-3 flex flex-wrap gap-2">{projects.map((project) => { const assigned = account.assignedProjectIds.includes(project.id); return <Button key={project.id} type="button" size="sm" variant={assigned ? "default" : "outline"} onClick={() => saveAccounts(accounts.map((item) => item.user.id === account.user.id ? { ...item, assignedProjectIds: assigned ? item.assignedProjectIds.filter((id) => id !== project.id) : [...item.assignedProjectIds, project.id] } : item))}>{assigned ? "✓ " : "+ "}{project.title}</Button>; })}</div></div>)}</div></CardContent></Card> : null;

  return <div className="space-y-6 max-w-[1000px] mx-auto"><Header workspace="settings" />{accountManager}<div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">Workspace preferences</CardTitle></CardHeader><CardContent className="space-y-5"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><Label>Production house</Label><Input className="mt-2" defaultValue="Hyderabad Lantern Studios" /></div><div><Label>Default currency</Label><Select defaultValue="inr"><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="inr">INR · Indian Rupee</SelectItem><SelectItem value="usd">USD · US Dollar</SelectItem></SelectContent></Select></div></div><div className="space-y-3"><div className="flex items-center justify-between p-3 rounded-lg bg-muted/30"><div><p className="text-sm font-medium">Deadline alerts</p><p className="text-xs text-muted-foreground mt-1">Notify the production office about upcoming deadlines.</p></div><Switch defaultChecked /></div><div className="flex items-center justify-between p-3 rounded-lg bg-muted/30"><div><p className="text-sm font-medium">Daily call sheet reminders</p><p className="text-xs text-muted-foreground mt-1">Send reminders before unit call time.</p></div><Switch defaultChecked /></div><div className="flex items-center justify-between p-3 rounded-lg bg-muted/30"><div><p className="text-sm font-medium">Weekly finance summary</p><p className="text-xs text-muted-foreground mt-1">Include budget and payment changes in the weekly report.</p></div><Switch /></div></div><Button onClick={() => setSaved(true)} className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white">{saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />} {saved ? "Preferences saved" : "Save preferences"}</Button></CardContent></Card><Card><CardHeader><CardTitle className="text-base">Workspace access</CardTitle></CardHeader><CardContent className="space-y-3">{["Executive Producer", "Production Office", "Finance", "Post Supervisor"].map((role) => <div key={role} className="flex items-center gap-3 text-sm"><div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center"><Users className="w-4 h-4 text-amber-500" /></div><span className="flex-1">{role}</span><ShieldCheck className="w-4 h-4 text-emerald-400" /></div>)}</CardContent></Card></div><Card><CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle className="text-base">Data management</CardTitle><p className="text-sm text-muted-foreground mt-1">The complete demo is bundled in the app, so every new browser starts with the same data. Edits are saved locally in that browser.</p></div><Database className="w-5 h-5 text-amber-500" /></div></CardHeader><CardContent className="space-y-5"><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{countCards.map((card) => <div key={card.label} className="rounded-lg border bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{card.label}</p><p className="text-2xl font-semibold mt-2">{card.value}</p></div>)}</div><div className="flex flex-wrap gap-3"><Button variant="outline" className="gap-2" onClick={handleExport}><Download className="w-4 h-4" /> Export JSON backup</Button><Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4" /> Import JSON backup</Button><Button variant="outline" className="gap-2" onClick={handleReset}><RefreshCcw className="w-4 h-4" /> Restore demo data</Button><input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} /></div>{dataMessage && <div className={`rounded-lg border px-4 py-3 text-sm ${dataMessage.tone === "success" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-red-500/20 bg-red-500/10 text-red-400"}`}>{dataMessage.text}</div>}<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/30 p-4 text-sm"><div><p className="font-medium">Last local update</p><p className="text-muted-foreground mt-1">{new Date(counts.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p></div><Badge variant="outline">{counts.totalRecords} records in this browser</Badge></div></CardContent></Card><Card><CardHeader><CardTitle className="text-base">System notes</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">The public demo is available from any browser or location. The bundled seed data is shared by the app; browser changes are private to that browser unless you export and import the JSON backup. This is demo storage, not a shared production database.</CardContent></Card></div>;
}
