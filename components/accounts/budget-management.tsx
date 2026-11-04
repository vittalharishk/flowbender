"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText, Plus, CheckCircle2, XCircle, RotateCcw, AlertTriangle,
  ArrowUpRight, ArrowDownRight, History, GitCompare, Clock, Send,
  TrendingUp, TrendingDown, Edit3, ArrowRight, AlertCircle, Shield, Lock,
} from "lucide-react";
import {
  useProjectBudgets, useDepartmentBudgets, useBudgetRevisions,
  useAccountsDashboard, useBudgetAlerts,
  submitBudgetForApproval, approveBudget, rejectBudget, returnBudget, resubmitReturnedBudget,
  updateDraftBudget, updateDepartmentAllocation,
  createBudgetRevision, approveBudgetRevision,
} from "@/lib/accounts-store";
import type { BudgetAlert } from "@/lib/accounts-store";
import { useAppDataSlice } from "@/lib/app-data-store";
import {
  formatCurrency, formatCompactINR, BUDGET_STATUS_COLORS, APPROVAL_STATUS_COLORS,
  getDepartmentDisplay, ACCOUNTS_DEPARTMENTS,
} from "@/lib/accounts-departments";
import type { ProjectBudget, DepartmentBudget, BudgetRevision as BudgetRevisionType, ApprovalRecord } from "@/lib/types";

interface Props {
  projectId?: string;
}

function statusLabel(s: string) {
  return s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

// ─── Budget Alerts Banner ───────────────────────────────────────────────────

function AlertsBanner({ alerts }: { alerts: BudgetAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="space-y-2">
      {alerts.map((a) => (
        <div
          key={a.id}
          className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${
            a.type === "critical" ? "bg-red-500/10 border-red-500/30 text-red-300" :
            a.type === "warning" ? "bg-amber-500/10 border-amber-500/30 text-amber-300" :
            "bg-blue-500/10 border-blue-500/30 text-blue-300"
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{a.message}</span>
          {a.metric === "utilization" && (
            <Badge variant="outline" className="ml-auto text-[10px]">{a.value.toFixed(1)}%</Badge>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Project Budgets Sub-Tab ────────────────────────────────────────────────

function ProjectBudgetsSubTab({ projectId }: Props) {
  const dashboard = useAccountsDashboard(projectId);
  const projectBudgets = useProjectBudgets(projectId);
  const projects = useAppDataSlice("projects");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [approvalDialog, setApprovalDialog] = useState<{ id: string; action: "approve" | "reject" | "return" } | null>(null);
  const [approverName, setApproverName] = useState("");
  const [approvalComments, setApprovalComments] = useState("");

  function handleSaveDraft() {
    if (!editingId) return;
    const amt = parseFloat(editAmount);
    if (!isNaN(amt) && amt > 0) {
      updateDraftBudget(editingId, { approvedAmount: amt, notes: editNotes });
    }
    setEditingId(null);
  }

  function handleApprovalAction() {
    if (!approvalDialog || !approverName.trim()) return;
    const { id, action } = approvalDialog;
    if (action === "approve") approveBudget(id, approverName, approvalComments);
    else if (action === "reject") rejectBudget(id, approverName, approvalComments);
    else returnBudget(id, approverName, approvalComments);
    setApprovalDialog(null);
    setApproverName("");
    setApprovalComments("");
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {projectBudgets.map((pb) => {
          const project = projects.find((p) => p.id === pb.projectId);
          const projData = dashboard.byProject.find((p) => p.projectId === pb.projectId);
          const isEditing = editingId === pb.id;

          return (
            <Card key={pb.id} className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{project?.title ?? pb.projectId}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge className={`text-[10px] ${BUDGET_STATUS_COLORS[pb.budgetStatus] ?? ""}`}>
                      {statusLabel(pb.budgetStatus)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {isEditing ? (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Budget Amount</Label>
                      <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Notes</Label>
                      <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="text-sm h-16" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs" onClick={handleSaveDraft}>Save</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Original</span>
                      <span>{formatCompactINR(pb.originalApprovedAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Approved</span>
                      <span className="font-medium">{formatCompactINR(pb.approvedAmount)}</span>
                    </div>
                    {pb.approvedAmount !== pb.originalApprovedAmount && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Change</span>
                        <span className={pb.approvedAmount > pb.originalApprovedAmount ? "text-amber-400" : "text-emerald-400"}>
                          {pb.approvedAmount > pb.originalApprovedAmount ? "+" : ""}{formatCompactINR(pb.approvedAmount - pb.originalApprovedAmount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Committed</span>
                      <span className="text-amber-400">{formatCompactINR(projData?.committed ?? 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Available</span>
                      <span className={projData && projData.available >= 0 ? "text-emerald-400" : "text-red-400"}>
                        {formatCompactINR(projData?.available ?? 0)}
                      </span>
                    </div>
                    <div className="w-full bg-muted/30 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full ${(projData?.utilization ?? 0) > 100 ? "bg-red-500" : (projData?.utilization ?? 0) > 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min(projData?.utilization ?? 0, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{(projData?.utilization ?? 0).toFixed(1)}% utilized</span>
                      <span>{pb.currency}</span>
                    </div>
                    <div className="flex items-center gap-1 pt-1">
                      <Badge className={`text-[10px] ${APPROVAL_STATUS_COLORS[pb.approvalStatus] ?? ""}`}>
                        {statusLabel(pb.approvalStatus)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {pb.budgetStatus === "draft" && (
                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => {
                          setEditingId(pb.id);
                          setEditAmount(String(pb.approvedAmount));
                          setEditNotes(pb.notes);
                        }}>
                          <Edit3 className="w-3 h-3 mr-1" />Edit
                        </Button>
                      )}
                      {pb.approvalStatus === "draft" && (
                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => submitBudgetForApproval(pb.id)}>
                          <Send className="w-3 h-3 mr-1" />Submit
                        </Button>
                      )}
                      {pb.approvalStatus === "returned" && (
                        <Button size="sm" variant="outline" className="h-6 text-[10px] text-blue-400" onClick={() => resubmitReturnedBudget(pb.id)}>
                          <RotateCcw className="w-3 h-3 mr-1" />Resubmit as Draft
                        </Button>
                      )}
                      {["submitted", "dept-approved", "finance-approved"].includes(pb.approvalStatus) && (
                        <>
                          <Button size="sm" variant="outline" className="h-6 text-[10px] text-emerald-400" onClick={() => setApprovalDialog({ id: pb.id, action: "approve" })}>
                            <CheckCircle2 className="w-3 h-3 mr-1" />Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-6 text-[10px] text-red-400" onClick={() => setApprovalDialog({ id: pb.id, action: "reject" })}>
                            <XCircle className="w-3 h-3 mr-1" />Reject
                          </Button>
                          <Button size="sm" variant="outline" className="h-6 text-[10px] text-orange-400" onClick={() => setApprovalDialog({ id: pb.id, action: "return" })}>
                            <RotateCcw className="w-3 h-3 mr-1" />Return
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!approvalDialog} onOpenChange={(open) => !open && setApprovalDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalDialog?.action === "approve" ? "Approve Budget" :
               approvalDialog?.action === "reject" ? "Reject Budget" : "Return Budget"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Approver Name</Label>
              <Input value={approverName} onChange={(e) => setApproverName(e.target.value)} placeholder="Enter your name" />
            </div>
            <div>
              <Label>Comments</Label>
              <Textarea value={approvalComments} onChange={(e) => setApprovalComments(e.target.value)} placeholder="Add comments..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialog(null)}>Cancel</Button>
            <Button onClick={handleApprovalAction} disabled={!approverName.trim()}>
              {approvalDialog?.action === "approve" ? "Approve" :
               approvalDialog?.action === "reject" ? "Reject" : "Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Department Allocations Sub-Tab ─────────────────────────────────────────

function DepartmentAllocationsSubTab({ projectId }: Props) {
  const departmentBudgets = useDepartmentBudgets(projectId);
  const projects = useAppDataSlice("projects");
  const dashboard = useAccountsDashboard(projectId);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAlloc, setEditAlloc] = useState("");
  const [editRevised, setEditRevised] = useState("");

  const filtered = useMemo(() => {
    return selectedProject === "all" ? departmentBudgets : departmentBudgets.filter((b) => b.projectId === selectedProject);
  }, [departmentBudgets, selectedProject]);

  const totalAllocated = useMemo(() => filtered.reduce((s, b) => s + b.allocatedBudget, 0), [filtered]);
  const totalRevised = useMemo(() => filtered.reduce((s, b) => s + b.revisedBudget, 0), [filtered]);

  function handleSaveAllocation() {
    if (!editingId) return;
    const alloc = parseFloat(editAlloc);
    const revised = parseFloat(editRevised);
    if (!isNaN(alloc) && alloc >= 0) {
      updateDepartmentAllocation(editingId, { allocatedBudget: alloc, revisedBudget: isNaN(revised) ? alloc : revised });
    }
    setEditingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!projectId && (
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="text-sm text-muted-foreground">
            {filtered.length} allocations | Total: {formatCompactINR(totalAllocated)}
            {totalRevised !== totalAllocated && <> | Revised: {formatCompactINR(totalRevised)}</>}
          </div>
        </div>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  {!projectId && <th className="text-left p-3 text-muted-foreground font-medium">Project</th>}
                  <th className="text-left p-3 text-muted-foreground font-medium">Department</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Allocated</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Revised</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Committed</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Variance</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((db) => {
                  const deptFin = dashboard.byDepartment.find((d) => d.departmentKey === db.departmentKey);
                  const variance = db.allocatedBudget - (deptFin?.committed ?? 0);
                  const isEditing = editingId === db.id;

                  if (isEditing) {
                    return (
                      <tr key={db.id} className="border-b border-border/30 bg-muted/20">
                        {!projectId && <td className="p-3">{projects.find((p) => p.id === db.projectId)?.title}</td>}
                        <td className="p-3 font-medium">{db.departmentDisplayName}</td>
                        <td className="p-3"><Input type="number" value={editAlloc} onChange={(e) => setEditAlloc(e.target.value)} className="h-7 w-32 text-sm text-right" /></td>
                        <td className="p-3"><Input type="number" value={editRevised} onChange={(e) => setEditRevised(e.target.value)} className="h-7 w-32 text-sm text-right" /></td>
                        <td className="p-3 text-right text-amber-400">{formatCompactINR(deptFin?.committed ?? 0)}</td>
                        <td className="p-3" />
                        <td className="p-3" />
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button size="sm" className="h-6 text-[10px]" onClick={handleSaveAllocation}>Save</Button>
                            <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setEditingId(null)}>Cancel</Button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={db.id} className="border-b border-border/30 hover:bg-muted/30">
                      {!projectId && <td className="p-3">{projects.find((p) => p.id === db.projectId)?.title}</td>}
                      <td className="p-3 font-medium">{db.departmentDisplayName}</td>
                      <td className="p-3 text-right">{formatCompactINR(db.allocatedBudget)}</td>
                      <td className="p-3 text-right">{formatCompactINR(db.revisedBudget)}</td>
                      <td className="p-3 text-right text-amber-400">{formatCompactINR(deptFin?.committed ?? 0)}</td>
                      <td className={`p-3 text-right ${variance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {variance >= 0 ? "+" : ""}{formatCompactINR(variance)}
                      </td>
                      <td className="p-3">
                        <Badge className={`text-[10px] ${APPROVAL_STATUS_COLORS[db.approvalStatus] ?? ""}`}>
                          {statusLabel(db.approvalStatus)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {db.approvalStatus === "draft" ? (
                          <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => {
                            setEditingId(db.id);
                            setEditAlloc(String(db.allocatedBudget));
                            setEditRevised(String(db.revisedBudget));
                          }}>
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        ) : (
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Revision History Sub-Tab ───────────────────────────────────────────────

function RevisionHistorySubTab({ projectId }: Props) {
  const revisions = useBudgetRevisions(projectId);
  const projects = useAppDataSlice("projects");
  const [newRevDialog, setNewRevDialog] = useState(false);
  const [revProjectId, setRevProjectId] = useState("");
  const [revAmount, setRevAmount] = useState("");
  const [revReason, setRevReason] = useState("");
  const [revRequester, setRevRequester] = useState("");
  const projectBudgets = useProjectBudgets(projectId);

  const sorted = useMemo(() =>
    [...revisions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [revisions],
  );

  function handleCreateRevision() {
    const pb = projectBudgets.find((b) => b.projectId === (projectId || revProjectId));
    if (!pb) return;
    const amt = parseFloat(revAmount);
    if (isNaN(amt) || amt <= 0) return;
    const now = new Date().toISOString();
    const existingCount = revisions.filter((r) => r.projectBudgetId === pb.id).length;

    const revision: BudgetRevisionType = {
      id: `brev-${pb.projectId}-${existingCount + 1}`,
      projectBudgetId: pb.id,
      projectId: pb.projectId,
      revisionNumber: existingCount + 1,
      previousAmount: pb.approvedAmount,
      revisedAmount: amt,
      changeAmount: amt - pb.approvedAmount,
      changePercentage: pb.approvedAmount > 0 ? ((amt - pb.approvedAmount) / pb.approvedAmount) * 100 : 0,
      reason: revReason,
      requestedBy: revRequester,
      status: "draft",
      approvalHistory: [],
      departmentChanges: [],
      notes: "",
      createdAt: now,
      updatedAt: now,
    };
    const accepted = createBudgetRevision(revision);
    if (!accepted) {
      alert("Revision rejected — check that all fields are valid and no duplicate exists.");
      return;
    }
    setNewRevDialog(false);
    setRevAmount("");
    setRevReason("");
    setRevRequester("");
    setRevProjectId("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{sorted.length} revision(s)</h3>
        <Button size="sm" variant="outline" onClick={() => setNewRevDialog(true)}>
          <Plus className="w-4 h-4 mr-1" />New Revision
        </Button>
      </div>

      <div className="space-y-3">
        {sorted.map((rev) => {
          const proj = projects.find((p) => p.id === rev.projectId);
          const isIncrease = rev.changeAmount > 0;
          return (
            <Card key={rev.id} className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{proj?.title ?? rev.projectId}</span>
                      <Badge variant="outline" className="text-[10px]">Rev #{rev.revisionNumber}</Badge>
                      <Badge className={`text-[10px] ${
                        rev.status === "approved" ? "bg-emerald-500/20 text-emerald-300" :
                        rev.status === "rejected" ? "bg-red-500/20 text-red-300" :
                        rev.status === "submitted" ? "bg-blue-500/20 text-blue-300" :
                        "bg-slate-500/20 text-slate-300"
                      }`}>
                        {statusLabel(rev.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{rev.reason}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${isIncrease ? "text-amber-400" : "text-emerald-400"}`}>
                      {isIncrease ? "+" : ""}{formatCompactINR(rev.changeAmount)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      ({rev.changePercentage >= 0 ? "+" : ""}{rev.changePercentage.toFixed(1)}%)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>From: {formatCompactINR(rev.previousAmount)}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>To: {formatCompactINR(rev.revisedAmount)}</span>
                  <span className="ml-auto">By: {rev.requestedBy}</span>
                  <span>{rev.createdAt.split("T")[0]}</span>
                </div>
                {rev.departmentChanges.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Department Changes</p>
                    {rev.departmentChanges.map((dc) => (
                      <div key={dc.departmentKey} className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">{getDepartmentDisplay(dc.departmentKey)}:</span>
                        <span>{formatCompactINR(dc.previousAmount)}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className={dc.revisedAmount > dc.previousAmount ? "text-amber-400" : "text-emerald-400"}>
                          {formatCompactINR(dc.revisedAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {rev.approvalHistory.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Approval Trail</p>
                    {rev.approvalHistory.map((ah, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {ah.decision === "approved" ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> :
                         ah.decision === "rejected" ? <XCircle className="w-3 h-3 text-red-400" /> :
                         <RotateCcw className="w-3 h-3 text-orange-400" />}
                        <span className="capitalize">{ah.level.replace("-", " ")}</span>
                        <span className="text-muted-foreground">— {ah.approverName}</span>
                        <span className="text-muted-foreground ml-auto">{ah.decisionDate.split("T")[0]}</span>
                      </div>
                    ))}
                  </div>
                )}
                {rev.status === "submitted" && (
                  <div className="mt-2 pt-2 border-t border-border/30 flex gap-2">
                    <Button size="sm" variant="outline" className="h-6 text-[10px] text-emerald-400"
                      onClick={() => approveBudgetRevision(rev.id, "Producer", "Revision approved")}>
                      <CheckCircle2 className="w-3 h-3 mr-1" />Approve Revision
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {sorted.length === 0 && (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-8 text-center text-muted-foreground">
              <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No budget revisions yet.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={newRevDialog} onOpenChange={setNewRevDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Budget Revision</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {!projectId && (
              <div>
                <Label>Project</Label>
                <Select value={revProjectId} onValueChange={setRevProjectId}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    {projectBudgets.map((pb) => {
                      const proj = projects.find((p) => p.id === pb.projectId);
                      return <SelectItem key={pb.projectId} value={pb.projectId}>{proj?.title ?? pb.projectId}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Revised Budget Amount</Label>
              <Input type="number" value={revAmount} onChange={(e) => setRevAmount(e.target.value)} placeholder="Enter new total amount" />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea value={revReason} onChange={(e) => setRevReason(e.target.value)} placeholder="Explain the reason for this revision..." />
            </div>
            <div>
              <Label>Requested By</Label>
              <Input value={revRequester} onChange={(e) => setRevRequester(e.target.value)} placeholder="Name of requestor" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewRevDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateRevision} disabled={!revAmount || !revReason || !revRequester || (!projectId && !revProjectId)}>
              Create Revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Approval Queue Sub-Tab ─────────────────────────────────────────────────

function ApprovalQueueSubTab({ projectId }: Props) {
  const dashboard = useAccountsDashboard(projectId);
  const revisions = useBudgetRevisions(projectId);
  const projects = useAppDataSlice("projects");

  const pendingRevisions = useMemo(() =>
    revisions.filter((r) => r.status === "submitted" || r.status === "draft"),
    [revisions],
  );

  const allPending = [
    ...dashboard.pendingApprovals.map((a) => ({ ...a, source: "budget" as const })),
    ...pendingRevisions.map((r) => ({
      id: r.id,
      type: "Budget Revision",
      requestor: r.requestedBy,
      amount: r.changeAmount,
      level: r.status === "submitted" ? "Producer" : "Pending Submission",
      submittedDate: r.createdAt,
      source: "revision" as const,
    })),
  ];

  if (allPending.length === 0) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No pending approvals at this time.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{allPending.length}</p>
            <p className="text-xs text-muted-foreground">Total Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{dashboard.pendingApprovals.length}</p>
            <p className="text-xs text-muted-foreground">Budget Approvals</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-cyan-400">{pendingRevisions.length}</p>
            <p className="text-xs text-muted-foreground">Revision Approvals</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Approval Queue</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-3 text-muted-foreground font-medium">Type</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Requestor</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Pending At</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {allPending.map((item) => (
                  <tr key={item.id} className="border-b border-border/30 hover:bg-muted/30">
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                    </td>
                    <td className="p-3">{item.requestor}</td>
                    <td className="p-3 text-right">{formatCompactINR(item.amount)}</td>
                    <td className="p-3">
                      <Badge className={`text-[10px] ${
                        item.level.includes("Producer") ? "bg-violet-500/20 text-violet-300" :
                        item.level.includes("Finance") ? "bg-teal-500/20 text-teal-300" :
                        "bg-blue-500/20 text-blue-300"
                      }`}>
                        {item.level}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{item.submittedDate.split("T")[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Budget Comparison Sub-Tab ──────────────────────────────────────────────

function BudgetComparisonSubTab({ projectId }: Props) {
  const projectBudgets = useProjectBudgets(projectId);
  const revisions = useBudgetRevisions(projectId);
  const dashboard = useAccountsDashboard(projectId);
  const projects = useAppDataSlice("projects");

  return (
    <div className="space-y-4">
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Original vs Current Budget Comparison</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-3 text-muted-foreground font-medium">Project</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Original</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Current</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Change</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Change %</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Committed</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Available</th>
                  <th className="text-center p-3 text-muted-foreground font-medium">Revisions</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {projectBudgets.map((pb) => {
                  const proj = projects.find((p) => p.id === pb.projectId);
                  const projData = dashboard.byProject.find((pf) => pf.projectId === pb.projectId);
                  const revCount = revisions.filter((r) => r.projectBudgetId === pb.id).length;
                  const change = pb.approvedAmount - pb.originalApprovedAmount;
                  const changePct = pb.originalApprovedAmount > 0 ? (change / pb.originalApprovedAmount) * 100 : 0;

                  return (
                    <tr key={pb.id} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="p-3 font-medium">{proj?.title ?? pb.projectId}</td>
                      <td className="p-3 text-right">{formatCompactINR(pb.originalApprovedAmount)}</td>
                      <td className="p-3 text-right font-medium">{formatCompactINR(pb.approvedAmount)}</td>
                      <td className={`p-3 text-right ${change > 0 ? "text-amber-400" : change < 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
                        {change !== 0 ? `${change > 0 ? "+" : ""}${formatCompactINR(change)}` : "—"}
                      </td>
                      <td className={`p-3 text-right ${change > 0 ? "text-amber-400" : change < 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
                        {change !== 0 ? (
                          <span className="flex items-center justify-end gap-1">
                            {change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {Math.abs(changePct).toFixed(1)}%
                          </span>
                        ) : "—"}
                      </td>
                      <td className="p-3 text-right text-amber-400">{formatCompactINR(projData?.committed ?? 0)}</td>
                      <td className={`p-3 text-right ${(projData?.available ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {formatCompactINR(projData?.available ?? 0)}
                      </td>
                      <td className="p-3 text-center">
                        {revCount > 0 ? (
                          <Badge variant="outline" className="text-[10px]">{revCount}</Badge>
                        ) : "—"}
                      </td>
                      <td className="p-3">
                        <Badge className={`text-[10px] ${BUDGET_STATUS_COLORS[pb.budgetStatus] ?? ""}`}>
                          {statusLabel(pb.budgetStatus)}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {projectBudgets.length > 1 && (
                <tfoot>
                  <tr className="border-t border-border/50 font-medium">
                    <td className="p-3">Total</td>
                    <td className="p-3 text-right">{formatCompactINR(projectBudgets.reduce((s, b) => s + b.originalApprovedAmount, 0))}</td>
                    <td className="p-3 text-right">{formatCompactINR(projectBudgets.reduce((s, b) => s + b.approvedAmount, 0))}</td>
                    <td className="p-3 text-right text-amber-400">
                      {formatCompactINR(projectBudgets.reduce((s, b) => s + (b.approvedAmount - b.originalApprovedAmount), 0))}
                    </td>
                    <td className="p-3" />
                    <td className="p-3 text-right text-amber-400">{formatCompactINR(dashboard.summary.totalCommitted)}</td>
                    <td className="p-3 text-right text-emerald-400">{formatCompactINR(dashboard.summary.availableBudget)}</td>
                    <td className="p-3 text-center">
                      <Badge variant="outline" className="text-[10px]">{revisions.length}</Badge>
                    </td>
                    <td className="p-3" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Revision Impact Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Original Budget</p>
              <p className="text-lg font-bold">{formatCompactINR(projectBudgets.reduce((s, b) => s + b.originalApprovedAmount, 0))}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Current Budget</p>
              <p className="text-lg font-bold">{formatCompactINR(projectBudgets.reduce((s, b) => s + b.approvedAmount, 0))}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Net Revision Impact</p>
              <p className={`text-lg font-bold ${projectBudgets.reduce((s, b) => s + (b.approvedAmount - b.originalApprovedAmount), 0) >= 0 ? "text-amber-400" : "text-emerald-400"}`}>
                {formatCompactINR(projectBudgets.reduce((s, b) => s + (b.approvedAmount - b.originalApprovedAmount), 0))}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Revisions</p>
              <p className="text-lg font-bold text-blue-400">
                {revisions.filter((r) => r.status === "submitted" || r.status === "draft").length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function BudgetManagement({ projectId }: Props) {
  const alerts = useBudgetAlerts(projectId);

  return (
    <div className="space-y-4">
      <AlertsBanner alerts={alerts} />

      <Tabs defaultValue="project-budgets">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="project-budgets" className="text-xs">
            <FileText className="w-3 h-3 mr-1" />Project Budgets
          </TabsTrigger>
          <TabsTrigger value="dept-allocations" className="text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />Dept Allocations
          </TabsTrigger>
          <TabsTrigger value="revision-history" className="text-xs">
            <History className="w-3 h-3 mr-1" />Revision History
          </TabsTrigger>
          <TabsTrigger value="approval-queue" className="text-xs">
            <Shield className="w-3 h-3 mr-1" />Approval Queue
          </TabsTrigger>
          <TabsTrigger value="comparison" className="text-xs">
            <GitCompare className="w-3 h-3 mr-1" />Budget Comparison
          </TabsTrigger>
        </TabsList>

        <TabsContent value="project-budgets">
          <ProjectBudgetsSubTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="dept-allocations">
          <DepartmentAllocationsSubTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="revision-history">
          <RevisionHistorySubTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="approval-queue">
          <ApprovalQueueSubTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="comparison">
          <BudgetComparisonSubTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
