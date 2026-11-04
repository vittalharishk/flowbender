"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Shield, AlertTriangle, Clock, CheckCircle2, FileText,
  Plus, Search, ChevronLeft, ChevronRight, Eye, XCircle,
} from "lucide-react";
import { useInsurancePolicies, useInsuranceDashboard, createInsurancePolicy, fileClaim, updateClaim, POLICY_TYPE_LABELS, POLICY_STATUS_LABELS, CLAIM_STATUS_LABELS, type InsuranceDashboard } from "@/lib/insurance-store";
import { formatCurrency, formatCompactINR } from "@/lib/accounts-departments";
import { useAppDataSlice } from "@/lib/app-data-store";
import type { InsurancePolicy, InsurancePolicyType, InsurancePolicyStatus, InsuranceClaim, InsuranceClaimStatus } from "@/lib/types";

interface Props {
  projectId?: string;
}

function statusColor(s: InsurancePolicyStatus) {
  switch (s) {
    case "active": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    case "expired": return "bg-red-500/10 text-red-400 border-red-500/30";
    case "cancelled": return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    case "pending": return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    case "renewed": return "bg-blue-500/10 text-blue-400 border-blue-500/30";
  }
}

function claimStatusColor(s: InsuranceClaimStatus) {
  switch (s) {
    case "filed": return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    case "under-review": return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    case "approved": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    case "denied": return "bg-red-500/10 text-red-400 border-red-500/30";
    case "settled": return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
    case "withdrawn": return "bg-slate-500/10 text-slate-400 border-slate-500/30";
  }
}

// ── Dashboard Cards ──────────────────────────────────────────────────────────

function DashboardCards({ dashboard }: { dashboard: ReturnType<typeof useInsuranceDashboard> }) {
  const cards = [
    { label: "Total Policies", value: dashboard.totalPolicies.toString(), icon: Shield, color: "text-blue-400", isCurrency: false },
    { label: "Active", value: dashboard.activePolicies.toString(), icon: CheckCircle2, color: "text-emerald-400", isCurrency: false },
    { label: "Total Coverage", value: dashboard.totalCoverage, icon: Shield, color: "text-violet-400", isCurrency: true },
    { label: "Premiums Paid", value: dashboard.totalPremiumsPaid, icon: FileText, color: "text-amber-400", isCurrency: true },
    { label: "Claims Filed", value: dashboard.totalClaimed, icon: AlertTriangle, color: "text-orange-400", isCurrency: true },
    { label: "Claims Settled", value: dashboard.totalSettled, icon: CheckCircle2, color: "text-cyan-400", isCurrency: true },
    { label: "Open Claims", value: dashboard.openClaims.toString(), icon: Clock, color: "text-red-400", isCurrency: false },
    { label: "Expiring Soon", value: dashboard.expiringWithin30Days.length.toString(), icon: AlertTriangle, color: dashboard.expiringWithin30Days.length > 0 ? "text-amber-400" : "text-slate-400", isCurrency: false },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
      {cards.map((c) => (
        <Card key={c.label} className="bg-card/50 border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <c.icon className={`w-4 h-4 ${c.color}`} />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{c.label}</span>
            </div>
            <p className="text-lg font-semibold">
              {c.isCurrency ? formatCompactINR(c.value as number) : c.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Policy Register Table ────────────────────────────────────────────────────

const PAGE_SIZE = 15;

function PolicyRegister({ policies, onSelect }: { policies: InsurancePolicy[]; onSelect: (p: InsurancePolicy) => void }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const projects = useAppDataSlice("projects");
  const projMap = useMemo(() => new Map(projects.map((p) => [p.id, p.title])), [projects]);

  const filtered = useMemo(() => {
    let result = policies;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.policyNumber.toLowerCase().includes(q) ||
        p.provider.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (projMap.get(p.projectId) || "").toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") result = result.filter((p) => p.policyType === typeFilter);
    if (statusFilter !== "all") result = result.filter((p) => p.status === statusFilter);
    return result;
  }, [policies, search, typeFilter, statusFilter, projMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search policies..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-8 h-9" />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(POLICY_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(POLICY_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || typeFilter !== "all" || statusFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); setPage(0); }}>Clear</Button>
        )}
      </div>

      <div className="border border-border/50 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider">
              <th className="text-left p-2.5">Policy #</th>
              <th className="text-left p-2.5">Type</th>
              <th className="text-left p-2.5">Provider</th>
              <th className="text-left p-2.5">Project</th>
              <th className="text-right p-2.5">Coverage</th>
              <th className="text-right p-2.5">Premium</th>
              <th className="text-center p-2.5">Claims</th>
              <th className="text-left p-2.5">Expiry</th>
              <th className="text-center p-2.5">Status</th>
              <th className="text-center p-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-8 text-muted-foreground">No policies found</td></tr>
            ) : pageItems.map((p) => (
              <tr key={p.id} className="border-t border-border/30 hover:bg-muted/10 cursor-pointer" onClick={() => onSelect(p)}>
                <td className="p-2.5 font-mono text-xs">{p.policyNumber}</td>
                <td className="p-2.5">{POLICY_TYPE_LABELS[p.policyType]}</td>
                <td className="p-2.5 text-muted-foreground">{p.provider}</td>
                <td className="p-2.5">{projMap.get(p.projectId) || p.projectId}</td>
                <td className="p-2.5 text-right font-mono">{formatCompactINR(p.coverageAmount)}</td>
                <td className="p-2.5 text-right font-mono">{formatCompactINR(p.premiumAmount)}</td>
                <td className="p-2.5 text-center">
                  {p.claims.length > 0 ? (
                    <Badge variant="outline" className="text-xs">{p.claims.length}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="p-2.5 text-muted-foreground">{p.endDate ? new Date(p.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                <td className="p-2.5 text-center">
                  <Badge variant="outline" className={`text-xs ${statusColor(p.status)}`}>{POLICY_STATUS_LABELS[p.status]}</Badge>
                </td>
                <td className="p-2.5 text-center">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filtered.length} {filtered.length === 1 ? "policy" : "policies"}</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span>{page + 1} / {totalPages}</span>
            <Button variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Policy Detail Sheet ──────────────────────────────────────────────────────

function PolicyDetailSheet({ policy, open, onClose }: { policy: InsurancePolicy | null; open: boolean; onClose: () => void }) {
  const projects = useAppDataSlice("projects");
  const [claimDialog, setClaimDialog] = useState(false);

  if (!policy) return null;
  const project = projects.find((p) => p.id === policy.projectId);

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              {policy.policyNumber}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 mt-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={statusColor(policy.status)}>{POLICY_STATUS_LABELS[policy.status]}</Badge>
              <Badge variant="outline">{POLICY_TYPE_LABELS[policy.policyType]}</Badge>
            </div>

            <p className="text-sm text-muted-foreground">{policy.description}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Project</span>
                <p className="font-medium">{project?.title || policy.projectId}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Provider</span>
                <p className="font-medium">{policy.provider}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Provider Contact</span>
                <p className="font-medium">{policy.providerContact}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Premium Frequency</span>
                <p className="font-medium capitalize">{policy.premiumFrequency.replace("-", " ")}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Start Date</span>
                <p className="font-medium">{new Date(policy.startDate).toLocaleDateString("en-IN")}</p>
              </div>
              <div>
                <span className="text-muted-foreground">End Date</span>
                <p className="font-medium">{policy.endDate ? new Date(policy.endDate).toLocaleDateString("en-IN") : "—"}</p>
              </div>
              {policy.renewalDate && (
                <div>
                  <span className="text-muted-foreground">Renewal Date</span>
                  <p className="font-medium">{new Date(policy.renewalDate).toLocaleDateString("en-IN")}</p>
                </div>
              )}
            </div>

            <Card className="bg-muted/20 border-border/50">
              <CardHeader className="py-2 px-4"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Financial Summary</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Coverage Amount</span>
                    <p className="font-semibold text-blue-400">{formatCurrency(policy.coverageAmount)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Deductible</span>
                    <p className="font-semibold">{formatCurrency(policy.deductible)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Premium Amount</span>
                    <p className="font-semibold text-amber-400">{formatCurrency(policy.premiumAmount)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Premium Paid</span>
                    <p className="font-semibold text-emerald-400">{formatCurrency(policy.totalPremiumPaid)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {policy.insuredItems.length > 0 && (
              <div>
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Insured Items</h4>
                <div className="flex flex-wrap gap-1.5">
                  {policy.insuredItems.map((item, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{item}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Claims ({policy.claims.length})</h4>
                {policy.status === "active" && (
                  <Button variant="outline" size="sm" onClick={() => setClaimDialog(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> File Claim
                  </Button>
                )}
              </div>
              {policy.claims.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No claims filed</p>
              ) : (
                <div className="space-y-3">
                  {policy.claims.map((c) => (
                    <Card key={c.id} className="bg-card/30 border-border/30">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="font-mono text-xs text-muted-foreground">{c.claimNumber}</span>
                            <p className="text-sm font-medium mt-0.5">{c.description}</p>
                          </div>
                          <Badge variant="outline" className={`text-xs ${claimStatusColor(c.status)}`}>{CLAIM_STATUS_LABELS[c.status]}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mt-2">
                          <div>
                            <span>Incident</span>
                            <p className="text-foreground">{new Date(c.incidentDate).toLocaleDateString("en-IN")}</p>
                          </div>
                          <div>
                            <span>Claimed</span>
                            <p className="text-foreground font-mono">{formatCurrency(c.claimedAmount)}</p>
                          </div>
                          <div>
                            <span>Settled</span>
                            <p className={`font-mono ${c.settledAmount > 0 ? "text-emerald-400" : "text-foreground"}`}>{c.settledAmount > 0 ? formatCurrency(c.settledAmount) : "—"}</p>
                          </div>
                        </div>
                        {c.resolutionNotes && (
                          <p className="text-xs text-muted-foreground mt-2 italic">{c.resolutionNotes}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {policy.notes && (
              <div>
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Notes</h4>
                <p className="text-sm text-muted-foreground">{policy.notes}</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {claimDialog && (
        <FileClaimDialog policyId={policy.id} open={claimDialog} onClose={() => setClaimDialog(false)} />
      )}
    </>
  );
}

// ── File Claim Dialog ────────────────────────────────────────────────────────

function FileClaimDialog({ policyId, open, onClose }: { policyId: string; open: boolean; onClose: () => void }) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    const claimedAmount = parseFloat(amount);
    if (!desc.trim()) { setError("Description is required"); return; }
    if (!Number.isFinite(claimedAmount) || claimedAmount <= 0) { setError("Valid claimed amount is required"); return; }
    if (!incidentDate) { setError("Incident date is required"); return; }
    const id = `cl${Date.now()}`;
    const claim: InsuranceClaim = {
      id,
      claimNumber: `CLM-${Date.now().toString(36).toUpperCase()}`,
      claimDate: new Date().toISOString().split("T")[0],
      incidentDate,
      description: desc.trim(),
      claimedAmount,
      settledAmount: 0,
      status: "filed",
      adjusterName: "",
      adjusterContact: "",
      resolutionDate: "",
      resolutionNotes: "",
    };
    const result = fileClaim(policyId, claim);
    if (result === null) {
      setDesc(""); setAmount(""); setIncidentDate(""); setError("");
      onClose();
    } else {
      setError(result);
    }
  };

  const handleClose = () => { setDesc(""); setAmount(""); setIncidentDate(""); setError(""); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>File Insurance Claim</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">{error}</p>}
          <div>
            <Label>Incident Date</Label>
            <Input type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} />
          </div>
          <div>
            <Label>Claimed Amount (₹)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" placeholder="0" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Describe the incident and claim details..." rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!desc.trim() || !amount || !incidentDate}>File Claim</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Create Policy Dialog ─────────────────────────────────────────────────────

function CreatePolicyDialog({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId?: string }) {
  const projects = useAppDataSlice("projects");
  const emptyForm = {
    policyNumber: "", policyType: "production" as InsurancePolicyType, provider: "", providerContact: "",
    projectId: projectId || "", description: "", coverageAmount: "", deductible: "", premiumAmount: "",
    premiumFrequency: "one-time" as InsurancePolicy["premiumFrequency"],
    startDate: "", endDate: "", renewalDate: "", notes: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const handleCreate = () => {
    setError("");
    const coverage = parseFloat(form.coverageAmount);
    const deductible = parseFloat(form.deductible || "0");
    const premium = parseFloat(form.premiumAmount);

    if (!form.policyNumber.trim()) { setError("Policy number is required"); return; }
    if (!form.provider.trim()) { setError("Insurance provider is required"); return; }
    if (!form.projectId) { setError("Project is required"); return; }
    if (!Number.isFinite(coverage) || coverage < 0) { setError("Valid coverage amount is required"); return; }
    if (!Number.isFinite(premium) || premium < 0) { setError("Valid premium amount is required"); return; }
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      setError("End date must not precede start date"); return;
    }

    const policy: InsurancePolicy = {
      id: `ins${Date.now()}`,
      policyNumber: form.policyNumber.trim(),
      policyType: form.policyType,
      provider: form.provider.trim(),
      providerContact: form.providerContact,
      projectId: form.projectId,
      description: form.description,
      insuredItems: [],
      coverageAmount: coverage,
      deductible: Number.isFinite(deductible) && deductible >= 0 ? deductible : 0,
      premiumAmount: premium,
      premiumFrequency: form.premiumFrequency,
      totalPremiumPaid: 0,
      startDate: form.startDate,
      endDate: form.endDate,
      renewalDate: form.renewalDate,
      status: "pending",
      claims: [],
      notes: form.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = createInsurancePolicy(policy);
    if (result === null) {
      setForm(emptyForm); setError("");
      onClose();
    } else {
      setError(result);
    }
  };

  const set = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));
  const handleClose = () => { setForm(emptyForm); setError(""); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Insurance Policy</DialogTitle></DialogHeader>
        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Policy Number</Label>
            <Input value={form.policyNumber} onChange={(e) => set("policyNumber", e.target.value)} placeholder="PI-P1-2026-001" />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={form.policyType} onValueChange={(v) => set("policyType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(POLICY_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Provider</Label>
            <Input value={form.provider} onChange={(e) => set("provider", e.target.value)} placeholder="Insurer name" />
          </div>
          <div>
            <Label>Provider Contact</Label>
            <Input value={form.providerContact} onChange={(e) => set("providerContact", e.target.value)} placeholder="+91..." />
          </div>
          {!projectId && (
            <div className="col-span-2">
              <Label>Project</Label>
              <Select value={form.projectId} onValueChange={(v) => set("projectId", v)}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Coverage description..." rows={2} />
          </div>
          <div>
            <Label>Coverage Amount (₹)</Label>
            <Input type="number" value={form.coverageAmount} onChange={(e) => set("coverageAmount", e.target.value)} min="0" />
          </div>
          <div>
            <Label>Deductible (₹)</Label>
            <Input type="number" value={form.deductible} onChange={(e) => set("deductible", e.target.value)} min="0" />
          </div>
          <div>
            <Label>Premium Amount (₹)</Label>
            <Input type="number" value={form.premiumAmount} onChange={(e) => set("premiumAmount", e.target.value)} min="0" />
          </div>
          <div>
            <Label>Premium Frequency</Label>
            <Select value={form.premiumFrequency} onValueChange={(v) => set("premiumFrequency", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="one-time">One-time</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="semi-annual">Semi-annual</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Start Date</Label>
            <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </div>
          <div>
            <Label>End Date</Label>
            <Input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
          </div>
          <div>
            <Label>Renewal Date</Label>
            <Input type="date" value={form.renewalDate} onChange={(e) => set("renewalDate", e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!form.policyNumber || !form.provider || !form.projectId || !form.coverageAmount || !form.premiumAmount}>Create Policy</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Claims Overview Tab ──────────────────────────────────────────────────────

function ClaimsOverview({ policies }: { policies: InsurancePolicy[] }) {
  const projects = useAppDataSlice("projects");
  const projMap = useMemo(() => new Map(projects.map((p) => [p.id, p.title])), [projects]);
  const [statusFilter, setStatusFilter] = useState("all");

  const allClaims = useMemo(() => {
    const claims: (InsuranceClaim & { policyNumber: string; policyType: InsurancePolicyType; projectId: string })[] = [];
    for (const p of policies) {
      for (const c of p.claims) {
        claims.push({ ...c, policyNumber: p.policyNumber, policyType: p.policyType, projectId: p.projectId });
      }
    }
    if (statusFilter !== "all") return claims.filter((c) => c.status === statusFilter);
    return claims;
  }, [policies, statusFilter]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Claims</SelectItem>
            {Object.entries(CLAIM_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{allClaims.length} claim{allClaims.length !== 1 ? "s" : ""}</span>
      </div>

      {allClaims.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No claims found</p>
      ) : (
        <div className="space-y-3">
          {allClaims.map((c) => (
            <Card key={c.id} className="bg-card/30 border-border/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{c.claimNumber}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{c.policyNumber}</span>
                      <Badge variant="outline" className="text-xs">{POLICY_TYPE_LABELS[c.policyType]}</Badge>
                    </div>
                    <p className="text-sm font-medium">{c.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{projMap.get(c.projectId) || c.projectId}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${claimStatusColor(c.status)}`}>{CLAIM_STATUS_LABELS[c.status]}</Badge>
                </div>
                <div className="grid grid-cols-4 gap-3 text-xs mt-3">
                  <div>
                    <span className="text-muted-foreground">Incident Date</span>
                    <p>{new Date(c.incidentDate).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Filed</span>
                    <p>{new Date(c.claimDate).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Claimed</span>
                    <p className="font-mono">{formatCurrency(c.claimedAmount)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Settled</span>
                    <p className={`font-mono ${c.settledAmount > 0 ? "text-emerald-400" : ""}`}>{c.settledAmount > 0 ? formatCurrency(c.settledAmount) : "—"}</p>
                  </div>
                </div>
                {c.resolutionNotes && (
                  <p className="text-xs text-muted-foreground mt-2 border-t border-border/30 pt-2">{c.resolutionNotes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Coverage by Type Tab ─────────────────────────────────────────────────────

function CoverageByType({ dashboard }: { dashboard: ReturnType<typeof useInsuranceDashboard> }) {
  const entries = Object.entries(dashboard.byType).sort((a, b) => b[1].coverage - a[1].coverage);

  return (
    <div className="space-y-3">
      {entries.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No policies</p>
      ) : (
        <div className="border border-border/50 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider">
                <th className="text-left p-2.5">Policy Type</th>
                <th className="text-center p-2.5">Policies</th>
                <th className="text-right p-2.5">Total Coverage</th>
                <th className="text-right p-2.5">Premium Paid</th>
                <th className="text-right p-2.5">Coverage Ratio</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([type, data]) => (
                <tr key={type} className="border-t border-border/30">
                  <td className="p-2.5 font-medium">{POLICY_TYPE_LABELS[type as InsurancePolicyType] || type}</td>
                  <td className="p-2.5 text-center">{data.count}</td>
                  <td className="p-2.5 text-right font-mono">{formatCompactINR(data.coverage)}</td>
                  <td className="p-2.5 text-right font-mono">{formatCompactINR(data.premiumPaid)}</td>
                  <td className="p-2.5 text-right text-muted-foreground">
                    {data.premiumPaid > 0 ? `${Math.round(data.coverage / data.premiumPaid)}x` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function InsuranceWorkspace({ projectId }: Props) {
  const policies = useInsurancePolicies(projectId);
  const dashboard = useInsuranceDashboard(projectId);
  const [selectedPolicy, setSelectedPolicy] = useState<InsurancePolicy | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          Insurance Register
        </h3>
        <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Policy
        </Button>
      </div>

      <DashboardCards dashboard={dashboard} />

      {dashboard.expiringWithin60Days.length > 0 && (
        <Card className={`${dashboard.expiringWithin7Days.length > 0 ? "bg-red-500/5 border-red-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`w-4 h-4 ${dashboard.expiringWithin7Days.length > 0 ? "text-red-400" : "text-amber-400"}`} />
              <span className={`text-sm font-medium ${dashboard.expiringWithin7Days.length > 0 ? "text-red-400" : "text-amber-400"}`}>
                Policy Expiry Alerts
              </span>
            </div>
            <div className="space-y-1">
              {dashboard.expiringWithin60Days.map((p) => {
                const end = new Date(p.endDate); end.setHours(0,0,0,0);
                const today = new Date(); today.setHours(0,0,0,0);
                const daysLeft = Math.ceil((end.getTime() - today.getTime()) / 86400000);
                const urgency = daysLeft <= 7 ? "text-red-400" : daysLeft <= 30 ? "text-amber-400" : "text-muted-foreground";
                return (
                  <div key={p.id} className="text-sm flex items-center justify-between cursor-pointer hover:bg-muted/10 rounded p-1" onClick={() => setSelectedPolicy(p)}>
                    <span>{p.policyNumber} — {p.provider}</span>
                    <span className={urgency}>{daysLeft === 0 ? "Expires today" : `${daysLeft}d left`} ({new Date(p.endDate).toLocaleDateString("en-IN")})</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="policies">
        <TabsList>
          <TabsTrigger value="policies">All Policies ({policies.length})</TabsTrigger>
          <TabsTrigger value="claims">Claims ({policies.reduce((s, p) => s + p.claims.length, 0)})</TabsTrigger>
          <TabsTrigger value="coverage">Coverage by Type</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="mt-4">
          <PolicyRegister policies={policies} onSelect={setSelectedPolicy} />
        </TabsContent>

        <TabsContent value="claims" className="mt-4">
          <ClaimsOverview policies={policies} />
        </TabsContent>

        <TabsContent value="coverage" className="mt-4">
          <CoverageByType dashboard={dashboard} />
        </TabsContent>
      </Tabs>

      <PolicyDetailSheet policy={selectedPolicy} open={!!selectedPolicy} onClose={() => setSelectedPolicy(null)} />
      <CreatePolicyDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} projectId={projectId} />
    </div>
  );
}
