"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  CircleDashed,
  XCircle,
  Edit2,
  Trash2,
  History,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects } from "@/lib/project-store";
import { useCharacters } from "@/lib/character-store";
import { useCastCandidates, useCastDecisionLog, candidateStatusLabels, candidateStatusColors, changeCandidateStatus, createCandidate, updateCandidate, deleteCandidate, selectCandidate, replaceSelectedArtist } from "@/lib/casting-store";
import type { CastCandidate, CastCandidateStatus, CastDecisionLogEntry, CharacterProfile } from "@/lib/types";
import { castCategoryLabels } from "@/lib/cast-store";

// ── Fee formatter ─────────────────────────────────────────────────────────────

function fmtFee(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 1)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(0)} K`;
  return `₹${n}`;
}

// ── Status icon helper ────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: CastCandidateStatus }) {
  const icons: Record<CastCandidateStatus, React.ReactNode> = {
    "proposed": <CircleDashed className="w-3.5 h-3.5" />,
    "under-discussion": <Clock className="w-3.5 h-3.5" />,
    "shortlisted": <AlertCircle className="w-3.5 h-3.5" />,
    "negotiation": <AlertCircle className="w-3.5 h-3.5" />,
    "on-hold": <Clock className="w-3.5 h-3.5" />,
    "rejected": <XCircle className="w-3.5 h-3.5" />,
    "selected": <CheckCircle2 className="w-3.5 h-3.5" />,
  };
  return <>{icons[status]}</>;
}

// ── Candidate status badge ────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CastCandidateStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${candidateStatusColors[status]}`}>
      <StatusIcon status={status} />
      {candidateStatusLabels[status]}
    </span>
  );
}

// ── History panel (inline slide-down) ────────────────────────────────────────

interface HistoryPanelProps {
  entries: CastDecisionLogEntry[];
  candidates: CastCandidate[];
}

function HistoryPanel({ entries, candidates }: HistoryPanelProps) {
  const nameOf = (id: string) => candidates.find(c => c.id === id)?.name ?? id;
  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground py-2 text-center">No decision history yet.</p>;
  }
  return (
    <ol className="space-y-1.5 py-1">
      {[...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(e => (
        <li key={e.id} className="flex items-start gap-2 text-xs">
          <span className="shrink-0 text-[10px] text-muted-foreground mt-0.5">
            {new Date(e.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="font-medium shrink-0">{nameOf(e.candidateId)}</span>
          <span className="text-muted-foreground">
            {e.fromStatus
              ? <><span className={`rounded px-1 ${candidateStatusColors[e.fromStatus]}`}>{candidateStatusLabels[e.fromStatus]}</span> → </>
              : "→ "}
            <span className={`rounded px-1 ${candidateStatusColors[e.toStatus]}`}>{candidateStatusLabels[e.toStatus]}</span>
          </span>
          {e.note && <span className="text-muted-foreground italic truncate max-w-[200px]">{e.note}</span>}
        </li>
      ))}
    </ol>
  );
}

// ── Replace-artist confirm dialog ─────────────────────────────────────────────

interface ReplaceConfirmProps {
  oldName: string;
  newName: string;
  roleName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ReplaceConfirm({ oldName, newName, roleName, onConfirm, onCancel }: ReplaceConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-xl bg-card border shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm">Replace selected artist?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-medium text-foreground">{oldName}</span> is currently selected for <span className="font-medium text-foreground">{roleName}</span>.
              Selecting <span className="font-medium text-foreground">{newName}</span> will move {oldName} to <span className="text-amber-400 font-medium">On Hold</span>. Their cast member record is preserved.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700" onClick={onConfirm}>
            Confirm replacement
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Candidate card ────────────────────────────────────────────────────────────

interface CandidateCardProps {
  candidate: CastCandidate;
  allCandidatesForRole: CastCandidate[];
  decisionLog: CastDecisionLogEntry[];
  onStatusChange: (id: string, status: CastCandidateStatus) => void;
  onEdit: (candidate: CastCandidate) => void;
  onDelete: (id: string) => void;
}

function CandidateCard({ candidate, allCandidatesForRole, decisionLog, onStatusChange, onEdit, onDelete }: CandidateCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const statuses: CastCandidateStatus[] = ["proposed", "under-discussion", "shortlisted", "negotiation", "on-hold", "rejected", "selected"];
  const candidateLog = decisionLog.filter(e => e.candidateId === candidate.id);

  return (
    <div className={`rounded-lg border bg-card transition-all ${candidate.status === "selected" ? "border-emerald-500/30 bg-emerald-500/5" : candidate.status === "rejected" ? "border-red-500/20 opacity-70" : "border-border"}`}>
      {/* Row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
          {candidate.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        {/* Name + agency */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{candidate.name}</p>
          <p className="text-xs text-muted-foreground truncate">{candidate.agency || "Independent"} · {castCategoryLabels[candidate.category]}</p>
        </div>
        {/* Fee */}
        <div className="hidden text-right sm:block">
          <p className="text-xs text-muted-foreground">Proposed fee</p>
          <p className="text-sm font-medium">{fmtFee(candidate.proposedFee)}</p>
        </div>
        {/* Linked cast badge */}
        {candidate.linkedCastId && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-400 rounded-full px-1.5 py-0.5 bg-emerald-500/10" title={`Linked: ${candidate.linkedCastId}`}>
            <Link2 className="w-3 h-3" /> cast member
          </span>
        )}
        {/* Status badge */}
        <StatusBadge status={candidate.status} />
        {/* History */}
        <button
          onClick={() => setShowHistory(v => !v)}
          className="ml-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Decision history"
        >
          <History className="w-4 h-4" />
        </button>
        {/* Expand */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Toggle details"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="border-t px-4 pb-3 pt-2 bg-muted/20">
          <p className="text-[11px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">Decision history</p>
          <HistoryPanel entries={candidateLog} candidates={allCandidatesForRole} />
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 text-xs">
            <div>
              <p className="text-muted-foreground mb-0.5">Languages</p>
              <p>{candidate.languages.join(", ") || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Availability</p>
              <p>{candidate.availabilityNote || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Email</p>
              <p className="truncate">{candidate.email || "—"}</p>
            </div>
          </div>
          {candidate.notes && (
            <div className="rounded-md bg-muted/50 px-3 py-2 text-xs">
              <span className="text-muted-foreground font-medium">Notes: </span>{candidate.notes}
            </div>
          )}
          {candidate.negotiationNotes && (
            <div className="rounded-md bg-amber-500/5 border border-amber-500/20 px-3 py-2 text-xs">
              <span className="text-amber-500 font-medium">Negotiation: </span>{candidate.negotiationNotes}
            </div>
          )}
          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <p className="text-xs text-muted-foreground mr-1">Move to:</p>
            {statuses.filter((s) => s !== candidate.status).map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange(candidate.id, s)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium border transition-colors hover:opacity-80 ${candidateStatusColors[s]}`}
              >
                {candidateStatusLabels[s]}
              </button>
            ))}
            <div className="ml-auto flex gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7" title="Edit" onClick={() => onEdit(candidate)}>
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="Delete" onClick={() => {
                if (window.confirm(`Remove ${candidate.name} from consideration? The record will be permanently deleted.`)) {
                  onDelete(candidate.id);
                }
              }}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Role group (one CharacterProfile + its candidates) ────────────────────────

interface RoleGroupProps {
  role: CharacterProfile;
  candidates: CastCandidate[];
  allCandidatesForRole: CastCandidate[];
  decisionLog: CastDecisionLogEntry[];
  onStatusChange: (id: string, status: CastCandidateStatus) => void;
  onEdit: (candidate: CastCandidate) => void;
  onDelete: (id: string) => void;
  onAddCandidate: (roleId: string) => void;
}

function RoleGroup({ role, candidates, allCandidatesForRole, decisionLog, onStatusChange, onEdit, onDelete, onAddCandidate }: RoleGroupProps) {
  const [open, setOpen] = useState(true);
  const [showRoleHistory, setShowRoleHistory] = useState(false);
  const [replaceConfirm, setReplaceConfirm] = useState<{ oldName: string; newCandidateId: string } | null>(null);
  const selected = candidates.filter((c) => c.status === "selected");
  const active = candidates.filter((c) => c.status !== "rejected");

  // Intercept status changes to "selected" and handle the replace flow
  function handleStatusChange(candidateId: string, status: CastCandidateStatus) {
    if (status === "selected") {
      const alreadySelected = allCandidatesForRole.find(c => c.status === "selected" && c.id !== candidateId);
      if (alreadySelected && !role.multiArtist) {
        setReplaceConfirm({ oldName: alreadySelected.name, newCandidateId: candidateId });
        return;
      }
      // No conflict — call selectCandidate
      const result = selectCandidate(candidateId);
      if (!result.success && result.error) {
        window.alert(result.error);
      }
      return;
    }
    onStatusChange(candidateId, status);
  }

  const roleLog = decisionLog.filter(e => e.roleId === role.id);

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Role header */}
        <div className="flex w-full items-center gap-3 px-5 py-4">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex flex-1 items-center gap-3 text-left hover:opacity-80 transition-opacity min-w-0"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <User className="w-4 h-4 text-amber-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm">{role.name}</p>
              <p className="text-xs text-muted-foreground truncate">{role.ageBracket} · {role.description}</p>
            </div>
          </button>
          {/* Summary pills */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {selected.length > 0 && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                {selected.length} selected
              </span>
            )}
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {active.length} active
            </span>
            {candidates.length > active.length && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {candidates.length - active.length} rejected
              </span>
            )}
          </div>
          {/* Role history toggle */}
          <button
            onClick={() => setShowRoleHistory(v => !v)}
            className="shrink-0 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Role decision history"
          >
            <History className="w-4 h-4" />
          </button>
          <button onClick={() => setOpen(v => !v)} className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted transition-colors">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Role history panel */}
        {showRoleHistory && (
          <div className="border-t px-5 pb-3 pt-2 bg-muted/20">
            <p className="text-[11px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">All decisions for this role</p>
            <HistoryPanel entries={roleLog} candidates={allCandidatesForRole} />
          </div>
        )}

        {open && (
          <div className="border-t px-4 pb-4 pt-3 space-y-2">
            {candidates.length === 0 && (
              <p className="text-xs text-muted-foreground py-3 text-center">No candidates yet for this role.</p>
            )}
            {candidates.map((c) => (
              <CandidateCard
                key={c.id}
                candidate={c}
                allCandidatesForRole={allCandidatesForRole}
                decisionLog={decisionLog}
                onStatusChange={handleStatusChange}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            <Button
              size="sm"
              variant="outline"
              className="mt-1 w-full text-xs"
              onClick={() => onAddCandidate(role.id)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add candidate for {role.name}
            </Button>
          </div>
        )}
      </div>

      {/* Replace confirm dialog */}
      {replaceConfirm && (
        <ReplaceConfirm
          oldName={replaceConfirm.oldName}
          newName={allCandidatesForRole.find(c => c.id === replaceConfirm.newCandidateId)?.name ?? ""}
          roleName={role.name}
          onConfirm={() => {
            const result = replaceSelectedArtist(replaceConfirm.newCandidateId, { reason: "Artist replaced via Roles & Probable" });
            if (!result.success && result.error) window.alert(result.error);
            setReplaceConfirm(null);
          }}
          onCancel={() => setReplaceConfirm(null)}
        />
      )}
    </>
  );
}

// ── Add / Edit candidate dialog ───────────────────────────────────────────────

interface CandidateFormProps {
  roleId: string;
  projectId: string;
  initial?: CastCandidate | null;
  onClose: () => void;
}

type FormState = {
  name: string;
  agency: string;
  email: string;
  phone: string;
  languages: string;
  proposedFee: string;
  availabilityNote: string;
  notes: string;
  negotiationNotes: string;
  category: string;
  status: CastCandidateStatus;
};

function CandidateForm({ roleId, projectId, initial, onClose }: CandidateFormProps) {
  const [form, setForm] = useState<FormState>({
    name: initial?.name ?? "",
    agency: initial?.agency ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    languages: initial?.languages.join(", ") ?? "",
    proposedFee: initial ? String(initial.proposedFee) : "",
    availabilityNote: initial?.availabilityNote ?? "",
    notes: initial?.notes ?? "",
    negotiationNotes: initial?.negotiationNotes ?? "",
    category: initial?.category ?? "supporting",
    status: initial?.status ?? "proposed",
  });
  const [error, setError] = useState("");

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required."); return; }
    const payload = {
      roleId,
      projectId,
      name: form.name.trim(),
      agency: form.agency.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      languages: form.languages.split(",").map((l) => l.trim()).filter(Boolean),
      proposedFee: parseFloat(form.proposedFee) || 0,
      availabilityNote: form.availabilityNote.trim(),
      notes: form.notes.trim(),
      negotiationNotes: form.negotiationNotes.trim(),
      category: form.category as CastCandidate["category"],
      status: form.status,
      linkedCastId: initial?.linkedCastId ?? null,
      isDemo: false,
    };
    if (initial) {
      // If status changed, route through changeCandidateStatus so the decision log is written.
      // Then update the remaining fields (without status to avoid double-write).
      const { status: newStatus, ...rest } = payload;
      if (newStatus !== initial.status) {
        changeCandidateStatus(initial.id, newStatus, `Status updated via edit form`);
      }
      updateCandidate(initial.id, rest);
    } else {
      createCandidate(payload);
    }
    onClose();
  }

  const statuses: CastCandidateStatus[] = ["proposed", "under-discussion", "shortlisted", "negotiation", "on-hold", "rejected", "selected"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-card border shadow-2xl overflow-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">{initial ? "Edit Candidate" : "Add Candidate"}</h2>
        </div>
        <form onSubmit={submit} className="px-6 py-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Name *</Label>
              <Input autoFocus value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Artist name" />
            </div>
            <div>
              <Label>Agency</Label>
              <Input value={form.agency} onChange={(e) => set("agency", e.target.value)} placeholder="Agency or Independent" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(castCategoryLabels) as CastCandidate["category"][]).map((k) => (
                    <SelectItem key={k} value={k}>{castCategoryLabels[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="artist@agency.com" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98400 XXXXX" />
            </div>
            <div>
              <Label>Languages (comma separated)</Label>
              <Input value={form.languages} onChange={(e) => set("languages", e.target.value)} placeholder="Telugu, Hindi" />
            </div>
            <div>
              <Label>Proposed fee (₹)</Label>
              <Input type="number" min="0" value={form.proposedFee} onChange={(e) => set("proposedFee", e.target.value)} placeholder="2500000" />
            </div>
            <div className="sm:col-span-2">
              <Label>Availability note</Label>
              <Input value={form.availabilityNote} onChange={(e) => set("availabilityNote", e.target.value)} placeholder="Available from Nov 2026" />
            </div>
            <div className="sm:col-span-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as CastCandidateStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>{candidateStatusLabels[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Audition / Meeting notes</Label>
              <textarea
                className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Observation from audition or meeting..."
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Negotiation notes</Label>
              <textarea
                className="flex min-h-[56px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.negotiationNotes}
                onChange={(e) => set("negotiationNotes", e.target.value)}
                placeholder="Fee counter, contract clause, etc."
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="submit" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
              {initial ? "Save changes" : "Add candidate"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────

interface RolesProbableTabProps {
  projectId?: string; // if set, show only this project's roles
}

export function RolesProbableTab({ projectId }: RolesProbableTabProps) {
  const projects = useProjects();
  const allCharacters = useCharacters();
  const allCandidates = useCastCandidates();
  const decisionLog = useCastDecisionLog();

  const [projectFilter, setProjectFilter] = useState(projectId ?? "all");
  const [statusFilter, setStatusFilter] = useState<CastCandidateStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [candidateForm, setCandidateForm] = useState<{ open: boolean; roleId: string; initial?: CastCandidate } | null>(null);

  const roles = useMemo(() => {
    let chars = allCharacters;
    if (projectFilter !== "all") chars = chars.filter((c) => c.projectId === projectFilter);
    if (query) {
      const q = query.toLowerCase();
      chars = chars.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        allCandidates.some((cnd) => cnd.roleId === c.id && cnd.name.toLowerCase().includes(q))
      );
    }
    return chars;
  }, [allCharacters, allCandidates, projectFilter, query]);

  const candidatesForRole = (roleId: string) => {
    let cands = allCandidates.filter((c) => c.roleId === roleId);
    if (statusFilter !== "all") cands = cands.filter((c) => c.status === statusFilter);
    return cands;
  };

  // Summary stats
  const totalRoles = allCharacters.filter((c) => projectFilter === "all" || c.projectId === projectFilter).length;
  const rolesWithSelected = [...new Set(allCandidates.filter((c) => c.status === "selected" && (projectFilter === "all" || c.projectId === projectFilter)).map((c) => c.roleId))].length;
  const totalCandidates = allCandidates.filter((c) => projectFilter === "all" || c.projectId === projectFilter).length;

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Total roles</p>
          <p className="text-2xl font-bold">{totalRoles}</p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Roles cast</p>
          <p className="text-2xl font-bold text-emerald-400">{rolesWithSelected}</p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Candidates</p>
          <p className="text-2xl font-bold">{totalCandidates}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {!projectId && (
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-56 bg-muted/40">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="bg-muted/40 pl-9"
            placeholder="Search roles or candidates..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as CastCandidateStatus | "all")}>
          <SelectTrigger className="w-full sm:w-48 bg-muted/40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(candidateStatusLabels) as CastCandidateStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{candidateStatusLabels[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Role groups */}
      {roles.length === 0 && (
        <div className="rounded-xl border bg-card p-12 text-center">
          <User className="mx-auto mb-3 h-8 w-8 opacity-30" />
          <p className="text-sm text-muted-foreground">No roles found. Add character profiles to a project first.</p>
        </div>
      )}
      <div className="space-y-3">
        {roles.map((role) => (
          <RoleGroup
            key={role.id}
            role={role}
            candidates={candidatesForRole(role.id)}
            allCandidatesForRole={allCandidates.filter(c => c.roleId === role.id)}
            decisionLog={decisionLog.filter(e => e.roleId === role.id)}
            onStatusChange={(id, status) => changeCandidateStatus(id, status)}
            onEdit={(c) => setCandidateForm({ open: true, roleId: role.id, initial: c })}
            onDelete={deleteCandidate}
            onAddCandidate={(roleId) => setCandidateForm({ open: true, roleId })}
          />
        ))}
      </div>

      {/* Candidate form dialog */}
      {candidateForm?.open && (
        <CandidateForm
          roleId={candidateForm.roleId}
          projectId={allCharacters.find((c) => c.id === candidateForm.roleId)?.projectId ?? (projectFilter === "all" ? "" : projectFilter)}
          initial={candidateForm.initial}
          onClose={() => setCandidateForm(null)}
        />
      )}
    </div>
  );
}
