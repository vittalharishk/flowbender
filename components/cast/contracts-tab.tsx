"use client";

import { useState, useMemo } from "react";
import {
  FileText, Plus, ChevronDown, ChevronRight, CheckCircle2, Clock,
  AlertCircle, XCircle, Edit2, Trash2, FilePlus, CreditCard, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects } from "@/lib/project-store";
import { useCastMembers } from "@/lib/cast-store";
import { useCharacters } from "@/lib/character-store";
import {
  useCastContracts, useCastCandidates,
  createContract, updateContract, deleteContract,
  changeContractStage, addMilestone, updateMilestone, deleteMilestone,
  calcContractTotals, getContractByCastAndRole,
  contractStageLabels,
  type CreateContractInput, type MilestoneInput,
} from "@/lib/casting-store";
import type { CastContract, ContractStage, PaymentMilestone, CastMember } from "@/lib/types";

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtCr(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(0)} K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function today() { return new Date().toISOString().slice(0, 10); }

// ── Stage badge ───────────────────────────────────────────────────────────────

const stageColors: Record<ContractStage, string> = {
  "draft":        "bg-slate-500/10 text-slate-400 border-slate-500/20",
  "under-review": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "approved":     "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "signed":       "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "completed":    "bg-teal-500/10 text-teal-400 border-teal-500/20",
};

const stageOrder: ContractStage[] = ["draft", "under-review", "approved", "signed", "completed"];

function StageBadge({ stage }: { stage: ContractStage }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${stageColors[stage]}`}>
      {contractStageLabels[stage]}
    </span>
  );
}

// ── Milestone status ──────────────────────────────────────────────────────────

const msColors: Record<PaymentMilestone["status"], string> = {
  paid:     "bg-emerald-500/10 text-emerald-400",
  due:      "bg-amber-500/10 text-amber-400",
  upcoming: "bg-slate-500/10 text-slate-400",
  overdue:  "bg-red-500/10 text-red-400",
};

const msLabels: Record<PaymentMilestone["status"], string> = {
  paid: "Paid", due: "Due", upcoming: "Upcoming", overdue: "Overdue",
};

// ── Generate contract ref ─────────────────────────────────────────────────────

function genRef(existing: CastContract[]): string {
  const year = new Date().getFullYear();
  const nums = existing
    .map(c => c.contractRef)
    .filter(r => r?.startsWith(`FLW-${year}-`))
    .map(r => parseInt(r.split("-")[2], 10))
    .filter(n => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `FLW-${year}-${String(next).padStart(3, "0")}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// Create Contract Dialog
// ══════════════════════════════════════════════════════════════════════════════

interface CreateContractDialogProps {
  castMembers: CastMember[];
  contracts: CastContract[];
  preselectedCastId?: string;
  onClose: () => void;
}

type ContractForm = {
  castId: string;
  amount: string;
  advance: string;
  startDate: string;
  endDate: string;
  notes: string;
  documentName: string;
};

function CreateContractDialog({ castMembers, contracts, preselectedCastId, onClose }: CreateContractDialogProps) {
  const allCandidates = useCastCandidates();
  const allCharacters = useCharacters();

  // All cast members are selectable; duplicate check happens at submit
  const eligible = castMembers;

  const [form, setForm] = useState<ContractForm>({
    castId: preselectedCastId ?? eligible[0]?.id ?? "",
    amount: "",
    advance: "",
    startDate: today(),
    endDate: "",
    notes: "",
    documentName: "",
  });
  const [manualRoleId, setManualRoleId] = useState("");
  const [error, setError] = useState("");

  function set(k: keyof ContractForm, v: string) { setForm(f => ({ ...f, [k]: v })); }

  const selectedMember = castMembers.find(m => m.id === form.castId);
  const linkedCandidate = allCandidates.find(c => c.linkedCastId === form.castId && c.status === "selected");
  const character = linkedCandidate
    ? allCharacters.find(c => c.id === linkedCandidate.roleId)
    : allCharacters.find(c => c.id === manualRoleId);
  // Characters for the selected member's project (for manual role pick)
  const projectCharacters = useMemo(() =>
    selectedMember ? allCharacters.filter(c => c.projectId === selectedMember.projectId) : [],
    [selectedMember, allCharacters]);
  const needsRolePick = !!form.castId && !linkedCandidate;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.castId) { setError("Select a cast member."); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError("Enter a valid contract amount."); return; }
    if (!form.endDate) { setError("Enter contract end date."); return; }

    const candidate = allCandidates.find(c => c.linkedCastId === form.castId && c.status === "selected");
    const roleId = candidate?.roleId ?? manualRoleId;
    if (!roleId) { setError("Select a character/role for this contract."); return; }

    // Duplicate guard
    const existing = getContractByCastAndRole(form.castId, roleId);
    if (existing) { setError(`Contract ${existing.contractRef} already exists for this artist and role.`); return; }

    const member = castMembers.find(m => m.id === form.castId);
    const input: CreateContractInput = {
      castId: form.castId,
      roleId,
      projectId: candidate?.projectId ?? member?.projectId ?? "",
      contractRef: genRef(contracts),
      amount: parseFloat(form.amount),
      advance: parseFloat(form.advance) || 0,
      milestones: [],
      startDate: form.startDate,
      endDate: form.endDate,
      contractStage: "draft",
      documentName: form.documentName.trim() || null,
      notes: form.notes.trim(),
    };
    createContract(input);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-card border shadow-2xl overflow-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="border-b px-6 py-4 flex items-center gap-3">
          <FilePlus className="w-5 h-5 text-amber-500" />
          <h2 className="font-semibold">Create Contract</h2>
        </div>
        <form onSubmit={submit} className="px-6 py-4 space-y-4">
          {castMembers.length === 0 && (
            <div className="rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
              No cast members found. Add cast members first before creating contracts.
            </div>
          )}

          <div>
            <Label>Cast member *</Label>
            <Select value={form.castId} onValueChange={v => { set("castId", v); setManualRoleId(""); }}>
              <SelectTrigger><SelectValue placeholder="Select artist" /></SelectTrigger>
              <SelectContent>
                {eligible.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name} — {m.character} ({m.projectTitle})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMember && character && (
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedMember.name} · <span className="text-foreground">{character.name}</span> · {selectedMember.projectTitle}
              </p>
            )}
          </div>

          {needsRolePick && (
            <div>
              <Label>Character / Role *</Label>
              <Select value={manualRoleId} onValueChange={setManualRoleId}>
                <SelectTrigger><SelectValue placeholder="Select character" /></SelectTrigger>
                <SelectContent>
                  {projectCharacters.length > 0
                    ? projectCharacters.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
                    : <SelectItem value="_none" disabled>No characters for this project</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Total amount (₹) *</Label>
              <Input type="number" min="0" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="e.g. 200000000" />
              {form.amount && <p className="text-[11px] text-muted-foreground mt-0.5">{fmtCr(parseFloat(form.amount) || 0)}</p>}
            </div>
            <div>
              <Label>Advance (₹)</Label>
              <Input type="number" min="0" value={form.advance} onChange={e => set("advance", e.target.value)} placeholder="e.g. 50000000" />
              {form.advance && <p className="text-[11px] text-muted-foreground mt-0.5">{fmtCr(parseFloat(form.advance) || 0)}</p>}
            </div>
            <div>
              <Label>Start date *</Label>
              <Input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} />
            </div>
            <div>
              <Label>End date *</Label>
              <Input type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Document name (placeholder)</Label>
              <Input value={form.documentName} onChange={e => set("documentName", e.target.value)} placeholder="e.g. AlluArjun_Pushpa2_Contract.pdf" />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <textarea
                className="flex min-h-[68px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.notes} onChange={e => set("notes", e.target.value)}
                placeholder="Special clauses, billing agreements, OTT rights..."
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={castMembers.length === 0} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
              Create contract
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Add / Edit Milestone Dialog
// ══════════════════════════════════════════════════════════════════════════════

interface MilestoneFormProps {
  contractId: string;
  initial?: PaymentMilestone;
  onClose: () => void;
}

type MsForm = {
  label: string; amount: string; dueDate: string;
  status: PaymentMilestone["status"]; paymentDate: string;
  paymentRef: string; notes: string;
};

function MilestoneForm({ contractId, initial, onClose }: MilestoneFormProps) {
  const [form, setForm] = useState<MsForm>({
    label: initial?.label ?? "",
    amount: initial ? String(initial.amount) : "",
    dueDate: initial?.dueDate ?? today(),
    status: initial?.status ?? "upcoming",
    paymentDate: initial?.paymentDate ?? "",
    paymentRef: initial?.paymentRef ?? "",
    notes: initial?.notes ?? "",
  });
  const [error, setError] = useState("");
  function set(k: keyof MsForm, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.label.trim()) { setError("Milestone name is required."); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError("Enter a valid amount."); return; }
    const input: MilestoneInput = {
      label: form.label.trim(),
      amount: parseFloat(form.amount),
      dueDate: form.dueDate,
      status: form.status,
      paymentDate: form.paymentDate || undefined,
      paymentRef: form.paymentRef.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
    if (initial) {
      updateMilestone(contractId, initial.id, input);
    } else {
      addMilestone(contractId, input);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-card border shadow-2xl overflow-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="border-b px-5 py-3">
          <h3 className="font-semibold text-sm">{initial ? "Edit milestone" : "Add milestone"}</h3>
        </div>
        <form onSubmit={submit} className="px-5 py-4 space-y-3">
          <div>
            <Label>Milestone name *</Label>
            <Input autoFocus value={form.label} onChange={e => set("label", e.target.value)} placeholder="e.g. Signing Advance" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amount (₹) *</Label>
              <Input type="number" min="0" value={form.amount} onChange={e => set("amount", e.target.value)} />
              {form.amount && <p className="text-[11px] text-muted-foreground mt-0.5">{fmtCr(parseFloat(form.amount)||0)}</p>}
            </div>
            <div>
              <Label>Due date</Label>
              <Input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v as PaymentMilestone["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(msLabels) as PaymentMilestone["status"][]).map(s => (
                    <SelectItem key={s} value={s}>{msLabels[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment date</Label>
              <Input type="date" value={form.paymentDate} onChange={e => set("paymentDate", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Payment reference</Label>
              <Input value={form.paymentRef} onChange={e => set("paymentRef", e.target.value)} placeholder="NEFT/RTGS/Cheque ref" />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any remarks" />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="submit" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
              {initial ? "Save changes" : "Add milestone"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Contract Detail (expand-in-place)
// ══════════════════════════════════════════════════════════════════════════════

interface ContractDetailProps {
  contract: CastContract;
  artistName: string;
  characterName: string;
  projectTitle: string;
  onClose: () => void;
}

function ContractDetail({ contract, artistName, characterName, projectTitle, onClose }: ContractDetailProps) {
  const [msForm, setMsForm] = useState<{ open: boolean; initial?: PaymentMilestone } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ notes: contract.notes, documentName: contract.documentName ?? "" });

  const { totalPaid, outstanding, milestonesTotalScheduled } = calcContractTotals(contract);
  const balance = contract.amount - contract.advance;

  const nextStage = stageOrder[stageOrder.indexOf(contract.contractStage) + 1] as ContractStage | undefined;
  const prevStage = stageOrder[stageOrder.indexOf(contract.contractStage) - 1] as ContractStage | undefined;

  return (
    <div className="border-t bg-muted/10 px-5 pb-5 pt-4 space-y-5">
      {/* Header info */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Contract ref</p>
          <p className="font-bold text-lg text-amber-500">{contract.contractRef}</p>
        </div>
        <div className="flex items-center gap-2">
          <StageBadge stage={contract.contractStage} />
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" title="Delete contract" onClick={() => {
            if (window.confirm(`Delete contract ${contract.contractRef}? This cannot be undone.`)) {
              deleteContract(contract.id);
              onClose();
            }
          }}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
        <div><p className="text-[11px] text-muted-foreground mb-0.5">Artist</p><p className="font-medium">{artistName}</p></div>
        <div><p className="text-[11px] text-muted-foreground mb-0.5">Character</p><p className="font-medium">{characterName}</p></div>
        <div><p className="text-[11px] text-muted-foreground mb-0.5">Project</p><p className="font-medium">{projectTitle}</p></div>
        <div><p className="text-[11px] text-muted-foreground mb-0.5">Period</p><p className="font-medium">{contract.startDate} → {contract.endDate}</p></div>
      </div>

      {/* Financials */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total value",   value: fmtCr(contract.amount),   color: "text-foreground" },
          { label: "Advance",       value: fmtCr(contract.advance),  color: "text-amber-400" },
          { label: "Total paid",    value: fmtCr(totalPaid),         color: "text-emerald-400" },
          { label: "Outstanding",   value: fmtCr(outstanding),       color: outstanding > 0 ? "text-red-400" : "text-emerald-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg border bg-card px-3 py-2">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className={`text-base font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Stage workflow */}
      <div className="rounded-lg border bg-card px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground mb-2">Contract stage</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {stageOrder.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <button
                onClick={() => changeContractStage(contract.id, s)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium border transition-all ${
                  s === contract.contractStage
                    ? stageColors[s] + " ring-2 ring-offset-1 ring-offset-card ring-current"
                    : "border-border text-muted-foreground hover:border-foreground/30"
                }`}
              >
                {contractStageLabels[s]}
              </button>
              {i < stageOrder.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Document & notes */}
      <div className="rounded-lg border bg-card px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Document & notes</p>
          <button onClick={() => setEditOpen(v => !v)} className="text-xs text-amber-500 hover:underline">
            {editOpen ? "Cancel" : "Edit"}
          </button>
        </div>
        {editOpen ? (
          <div className="space-y-2">
            <div>
              <Label className="text-xs">Document name</Label>
              <Input value={editForm.documentName} onChange={e => setEditForm(f => ({ ...f, documentName: e.target.value }))} placeholder="Filename.pdf" />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700" onClick={() => {
              updateContract(contract.id, { notes: editForm.notes, documentName: editForm.documentName || null });
              setEditOpen(false);
            }}>Save</Button>
          </div>
        ) : (
          <div className="space-y-1 text-sm">
            {contract.documentName
              ? <div className="flex items-center gap-2 text-blue-400"><FileText className="w-3.5 h-3.5" />{contract.documentName}</div>
              : <p className="text-xs text-muted-foreground italic">No document attached</p>
            }
            {contract.notes && <p className="text-xs text-muted-foreground">{contract.notes}</p>}
          </div>
        )}
      </div>

      {/* Payment milestones */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Payment milestones</p>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setMsForm({ open: true })}>
            <Plus className="w-3.5 h-3.5" /> Add milestone
          </Button>
        </div>

        {/* Totals row */}
        {contract.milestones.length > 0 && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded bg-muted/60 px-3 py-1.5">
              <span className="text-muted-foreground">Scheduled </span>
              <span className="font-semibold">{fmtCr(milestonesTotalScheduled)}</span>
            </div>
            <div className="rounded bg-emerald-500/10 px-3 py-1.5">
              <span className="text-muted-foreground">Paid </span>
              <span className="font-semibold text-emerald-400">{fmtCr(totalPaid)}</span>
            </div>
            <div className="rounded bg-red-500/10 px-3 py-1.5">
              <span className="text-muted-foreground">Outstanding </span>
              <span className="font-semibold text-red-400">{fmtCr(outstanding)}</span>
            </div>
          </div>
        )}

        {contract.milestones.length === 0 && (
          <div className="rounded-lg border border-dashed bg-card p-6 text-center">
            <CreditCard className="mx-auto mb-2 h-6 w-6 opacity-30" />
            <p className="text-xs text-muted-foreground">No milestones added yet.</p>
          </div>
        )}

        {contract.milestones.map(ms => (
          <div key={ms.id} className={`rounded-lg border px-4 py-3 ${ms.status === "overdue" ? "border-red-500/30 bg-red-500/5" : ms.status === "paid" ? "border-emerald-500/20 bg-emerald-500/5" : "border-border bg-card"}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{ms.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${msColors[ms.status]}`}>{msLabels[ms.status]}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                  <span>Due: {ms.dueDate}</span>
                  {ms.paymentDate && <span className="text-emerald-400">Paid: {ms.paymentDate}</span>}
                  {ms.paymentRef && <span>Ref: {ms.paymentRef}</span>}
                  {ms.notes && <span className="italic">{ms.notes}</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-sm">{fmtCr(ms.amount)}</p>
                <div className="flex gap-1 mt-1 justify-end">
                  {ms.status !== "paid" && (
                    <button
                      className="rounded px-1.5 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      onClick={() => updateMilestone(contract.id, ms.id, { status: "paid", paymentDate: ms.paymentDate || today() })}
                    >
                      Mark paid
                    </button>
                  )}
                  <button className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => setMsForm({ open: true, initial: ms })}>
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-muted" onClick={() => {
                    if (window.confirm(`Delete milestone "${ms.label}"?`)) deleteMilestone(contract.id, ms.id);
                  }}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {msForm?.open && (
        <MilestoneForm
          contractId={contract.id}
          initial={msForm.initial}
          onClose={() => setMsForm(null)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Contract Row (listing item)
// ══════════════════════════════════════════════════════════════════════════════

interface ContractRowProps {
  contract: CastContract;
  artistName: string;
  characterName: string;
  projectTitle: string;
}

function ContractRow({ contract, artistName, characterName, projectTitle }: ContractRowProps) {
  const [open, setOpen] = useState(false);
  const { totalPaid, outstanding } = calcContractTotals(contract);

  return (
    <div className={`rounded-xl border bg-card overflow-hidden ${contract.contractStage === "signed" || contract.contractStage === "completed" ? "border-emerald-500/20" : ""}`}>
      {/* Row header */}
      <button onClick={() => setOpen(v => !v)} className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
          <FileText className="w-4 h-4 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{artistName}</span>
            <span className="text-xs text-muted-foreground">as {characterName}</span>
            <StageBadge stage={contract.contractStage} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{contract.contractRef} · {projectTitle}</p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0">
          <span className="text-sm font-semibold">{fmtCr(contract.amount)}</span>
          {totalPaid > 0 && <span className="text-xs text-emerald-400">{fmtCr(totalPaid)} paid</span>}
          {outstanding > 0 && <span className="text-xs text-red-400">{fmtCr(outstanding)} due</span>}
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      {open && (
        <ContractDetail
          contract={contract}
          artistName={artistName}
          characterName={characterName}
          projectTitle={projectTitle}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Contracts Tab
// ══════════════════════════════════════════════════════════════════════════════

interface ContractsTabProps {
  projectId?: string;
}

export function ContractsTab({ projectId }: ContractsTabProps) {
  const allProjects = useProjects();
  const castMembers = useCastMembers();
  const allCharacters = useCharacters();
  const allCandidates = useCastCandidates();
  const allContracts = useCastContracts();

  const [projectFilter, setProjectFilter] = useState(projectId ?? "all");
  const [stageFilter, setStageFilter] = useState<ContractStage | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);

  // Enrich contract with names
  function enrich(c: CastContract) {
    const member = castMembers.find(m => m.id === c.castId);
    const character = allCharacters.find(ch => ch.id === c.roleId);
    const project = allProjects.find(p => p.id === c.projectId);
    return {
      artistName: member?.name ?? "Unknown Artist",
      characterName: character?.name ?? member?.character ?? "Unknown Role",
      projectTitle: project?.title ?? member?.projectTitle ?? "Unknown Project",
    };
  }

  const filtered = useMemo(() => {
    let list = allContracts;
    if (projectId || projectFilter !== "all") list = list.filter(c => c.projectId === (projectId ?? projectFilter));
    if (stageFilter !== "all") list = list.filter(c => c.contractStage === stageFilter);
    return list;
  }, [allContracts, projectFilter, projectId, stageFilter]);

  // Dashboard stats
  const scope = projectId ? allContracts.filter(c => c.projectId === projectId) : allContracts;
  const totalValue = scope.reduce((s, c) => s + c.amount, 0);
  const totalPaidAll = scope.reduce((s, c) => s + calcContractTotals(c).totalPaid, 0);
  const outstanding = totalValue - totalPaidAll;
  const byStage = (s: ContractStage) => scope.filter(c => c.contractStage === s).length;

  return (
    <div className="space-y-5">
      {/* Dashboard stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Total contracts</p>
          <p className="text-2xl font-bold">{scope.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{byStage("draft")} draft · {byStage("under-review")} review · {byStage("signed")} signed</p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Total value</p>
          <p className="text-2xl font-bold">{fmtCr(totalValue)}</p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Total paid</p>
          <p className="text-2xl font-bold text-emerald-400">{fmtCr(totalPaidAll)}</p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className={`text-2xl font-bold ${outstanding > 0 ? "text-red-400" : "text-emerald-400"}`}>{fmtCr(outstanding)}</p>
        </div>
      </div>

      {/* Filters + create */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {!projectId && (
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-56 bg-muted/40"><SelectValue placeholder="All projects" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {allProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={stageFilter} onValueChange={v => setStageFilter(v as ContractStage | "all")}>
          <SelectTrigger className="w-full sm:w-44 bg-muted/40"><SelectValue placeholder="All stages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {(Object.keys(contractStageLabels) as ContractStage[]).map(s => (
              <SelectItem key={s} value={s}>{contractStageLabels[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="sm:ml-auto">
          <Button className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> New contract
          </Button>
        </div>
      </div>

      {/* Contract list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 opacity-30" />
          <p className="text-sm text-muted-foreground">
            {allContracts.length === 0
              ? "No contracts yet. Create one for a confirmed cast member."
              : "No contracts match the current filters."}
          </p>
          <Button variant="outline" className="mt-4 gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> Create first contract
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const { artistName, characterName, projectTitle } = enrich(c);
            return (
              <ContractRow
                key={c.id}
                contract={c}
                artistName={artistName}
                characterName={characterName}
                projectTitle={projectTitle}
              />
            );
          })}
        </div>
      )}

      {createOpen && (
        <CreateContractDialog
          castMembers={castMembers}
          contracts={allContracts}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </div>
  );
}
