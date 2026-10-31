"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock, AlertCircle, CircleDashed, XCircle, ChevronDown, ChevronRight, Film } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects } from "@/lib/project-store";
import { useCharacters } from "@/lib/character-store";
import { useCastCandidates, useCastDecisionLog, candidateStatusColors, candidateStatusLabels } from "@/lib/casting-store";
import { useCastMembers } from "@/lib/cast-store";
import type { CastCandidateStatus, CastDecisionLogEntry } from "@/lib/types";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(0)}L`;
  return `₹${(n / 1000).toFixed(0)}K`;
}

function StatusDot({ status }: { status: CastCandidateStatus | "uncast" }) {
  if (status === "uncast") return <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/40" />;
  if (status === "selected") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (status === "rejected") return <XCircle className="w-4 h-4 text-red-400" />;
  if (status === "on-hold") return <Clock className="w-4 h-4 text-orange-400" />;
  if (status === "negotiation") return <AlertCircle className="w-4 h-4 text-amber-400" />;
  if (status === "shortlisted") return <AlertCircle className="w-4 h-4 text-violet-400" />;
  if (status === "under-discussion") return <Clock className="w-4 h-4 text-blue-400" />;
  return <CircleDashed className="w-4 h-4 text-muted-foreground" />;
}

// ── Casting progress bar ──────────────────────────────────────────────────────

function ProgressBar({ cast, total }: { cast: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((cast / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{cast}/{total}</span>
    </div>
  );
}

// ── Row for a single character / role ─────────────────────────────────────────

interface RoleRowProps {
  roleId: string;
  roleName: string;
  roleArc: string;
  category: string;
  selectedArtist?: string;
  selectedFee?: number;
  linkedCastId?: string | null;
  contractStatus?: string;
  bestStatus: CastCandidateStatus | "uncast";
  candidateCount: number;
  history: Array<{ from: CastCandidateStatus | null; to: CastCandidateStatus; name: string; date: string; note: string }>;
}

function RoleRow({
  roleName, roleArc, category, selectedArtist, selectedFee,
  linkedCastId, contractStatus, bestStatus, candidateCount, history,
}: RoleRowProps) {
  const [showHistory, setShowHistory] = useState(false);
  const isSelected = bestStatus === "selected";
  const isPending = !isSelected && bestStatus !== "uncast";

  return (
    <div className={`rounded-lg border transition-colors ${isSelected ? "border-emerald-500/20 bg-emerald-500/5" : isPending ? "border-amber-500/20" : "border-border"}`}>
      <div className="grid grid-cols-[1fr_auto] gap-2 px-4 py-3 sm:grid-cols-[minmax(180px,1.5fr)_minmax(140px,1fr)_minmax(80px,0.6fr)_minmax(90px,0.7fr)_auto]">
        {/* Role */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusDot status={bestStatus} />
            <span className="font-medium text-sm truncate">{roleName}</span>
            <span className="hidden sm:inline text-[10px] rounded-full px-1.5 py-0.5 bg-muted text-muted-foreground">{category}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground truncate pl-6">{roleArc}</p>
        </div>

        {/* Artist */}
        <div className="min-w-0 flex items-center">
          {selectedArtist ? (
            <div>
              <p className="text-sm font-medium truncate">{selectedArtist}</p>
              {contractStatus && (
                <p className="text-[11px] text-muted-foreground capitalize">{contractStatus}</p>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">
              {bestStatus === "uncast" ? "No candidates" : candidateStatusLabels[bestStatus as CastCandidateStatus]}
            </span>
          )}
        </div>

        {/* Fee */}
        <div className="hidden sm:flex items-center">
          {selectedFee ? (
            <span className="text-sm font-medium">{fmt(selectedFee)}</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>

        {/* Contract */}
        <div className="hidden sm:flex items-center">
          {linkedCastId ? (
            <span className={`text-[11px] rounded-full px-2 py-0.5 font-medium ${
              contractStatus === "signed" ? "bg-emerald-500/10 text-emerald-400" :
              contractStatus === "negotiating" ? "bg-amber-500/10 text-amber-400" :
              "bg-muted text-muted-foreground"
            }`}>
              {contractStatus ?? "pending"}
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground">—</span>
          )}
        </div>

        {/* History toggle */}
        <button
          onClick={() => setShowHistory(v => !v)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          title="View decision history"
        >
          History
          {showHistory ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="border-t px-4 pb-3 pt-2">
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground py-1">No decision history recorded.</p>
          ) : (
            <ol className="space-y-1.5">
              {history.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="shrink-0 mt-0.5 text-[10px] text-muted-foreground">{new Date(h.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <span className="font-medium shrink-0">{h.name}</span>
                  <span className="text-muted-foreground">
                    {h.from ? (
                      <><span className={`rounded px-1 ${candidateStatusColors[h.from]}`}>{candidateStatusLabels[h.from]}</span> → </>
                    ) : "Initial → "}
                    <span className={`rounded px-1 ${candidateStatusColors[h.to]}`}>{candidateStatusLabels[h.to]}</span>
                  </span>
                  {h.note && <span className="text-muted-foreground italic truncate max-w-[240px]">{h.note}</span>}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

// ── Project card ──────────────────────────────────────────────────────────────

interface ProjectCardProps {
  projectId: string;
  projectTitle: string;
  posterColor: string;
  roles: ReturnType<typeof useCharacters>;
  allCandidates: ReturnType<typeof useCastCandidates>;
  castMembers: ReturnType<typeof useCastMembers>;
  decisionLog: CastDecisionLogEntry[];
}

function ProjectCard({ projectId, projectTitle, posterColor, roles, allCandidates, castMembers, decisionLog }: ProjectCardProps) {
  const [open, setOpen] = useState(true);

  const projectRoles = roles.filter(r => r.projectId === projectId);
  const projectCandidates = allCandidates.filter(c => c.projectId === projectId);
  const castCount = projectRoles.filter(r => {
    const sel = projectCandidates.find(c => c.roleId === r.id && c.status === "selected");
    return !!sel;
  }).length;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Project header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="h-9 w-9 rounded-lg shrink-0 flex items-center justify-center" style={{ background: posterColor }}>
          <Film className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-semibold text-sm truncate">{projectTitle}</p>
          <ProgressBar cast={castCount} total={projectRoles.length} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{castCount}/{projectRoles.length} cast</span>
          {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t">
          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-[1fr_auto] gap-2 px-4 py-1.5 text-[11px] font-medium text-muted-foreground sm:grid-cols-[minmax(180px,1.5fr)_minmax(140px,1fr)_minmax(80px,0.6fr)_minmax(90px,0.7fr)_auto]">
            <span>Role</span>
            <span>Artist</span>
            <span>Fee</span>
            <span>Contract</span>
            <span />
          </div>
          <div className="px-3 pb-3 space-y-2">
            {projectRoles.map(role => {
              const candidates = projectCandidates.filter(c => c.roleId === role.id);
              const selected = candidates.find(c => c.status === "selected");
              const bestCand = selected ?? candidates.find(c => c.status === "negotiation") ?? candidates.find(c => c.status === "shortlisted") ?? candidates[0];
              const castMember = selected?.linkedCastId ? castMembers.find(m => m.id === selected.linkedCastId) : undefined;

              // Build history for this role from the decision log
              const roleLog = decisionLog
                .filter(e => e.roleId === role.id)
                .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
              const history = roleLog.map(e => {
                const cand = candidates.find(c => c.id === e.candidateId);
                return {
                  from: e.fromStatus,
                  to: e.toStatus,
                  name: cand?.name ?? e.candidateId,
                  date: e.createdAt,
                  note: e.note,
                };
              });

              return (
                <RoleRow
                  key={role.id}
                  roleId={role.id}
                  roleName={role.name}
                  roleArc={role.arc || role.description}
                  category={role.arc ? candidates[0]?.category ?? "—" : "—"}
                  selectedArtist={selected?.name}
                  selectedFee={selected ? (castMember?.totalFee ?? selected.proposedFee) : undefined}
                  linkedCastId={selected?.linkedCastId}
                  contractStatus={castMember?.contractStatus}
                  bestStatus={bestCand ? bestCand.status : "uncast"}
                  candidateCount={candidates.length}
                  history={history}
                />
              );
            })}
            {projectRoles.length === 0 && (
              <p className="text-xs text-muted-foreground py-3 text-center">No character profiles for this project.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────

interface CastingDashboardTabProps {
  projectId?: string;
}

export function CastingDashboardTab({ projectId }: CastingDashboardTabProps) {
  const allProjects = useProjects();
  const allCharacters = useCharacters();
  const allCandidates = useCastCandidates();
  const castMembers = useCastMembers();

  const [projectFilter, setProjectFilter] = useState(projectId ?? "all");

  const rawLog = useCastDecisionLog();

  const filteredProjects = useMemo(() => {
    if (projectId || projectFilter !== "all") {
      const pid = projectId ?? projectFilter;
      return allProjects.filter(p => p.id === pid);
    }
    return allProjects;
  }, [allProjects, projectFilter, projectId]);

  // Summary stats across visible projects
  const visibleProjectIds = new Set(filteredProjects.map(p => p.id));
  const visibleRoles = allCharacters.filter(c => visibleProjectIds.has(c.projectId));
  const totalRoles = visibleRoles.length;
  const castRoles = visibleRoles.filter(r => allCandidates.some(c => c.roleId === r.id && c.status === "selected")).length;
  const pendingRoles = visibleRoles.filter(r => {
    const hasSel = allCandidates.some(c => c.roleId === r.id && c.status === "selected");
    const hasCand = allCandidates.some(c => c.roleId === r.id);
    return !hasSel && hasCand;
  }).length;
  const uncastRoles = totalRoles - castRoles - pendingRoles;

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Total roles</p>
          <p className="text-2xl font-bold">{totalRoles}</p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Cast confirmed</p>
          <p className="text-2xl font-bold text-emerald-400">{castRoles}</p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Decisions pending</p>
          <p className="text-2xl font-bold text-amber-400">{pendingRoles}</p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">No candidates</p>
          <p className="text-2xl font-bold text-muted-foreground">{uncastRoles}</p>
        </div>
      </div>

      {/* Project filter */}
      {!projectId && (
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full sm:w-56 bg-muted/40">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {allProjects.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Project cards */}
      <div className="space-y-4">
        {filteredProjects.map(project => (
          <ProjectCard
            key={project.id}
            projectId={project.id}
            projectTitle={project.title}
            posterColor={project.posterColor}
            roles={allCharacters}
            allCandidates={allCandidates}
            castMembers={castMembers}
            decisionLog={rawLog}
          />
        ))}
        {filteredProjects.length === 0 && (
          <div className="rounded-xl border bg-card p-12 text-center">
            <Film className="mx-auto mb-3 h-8 w-8 opacity-30" />
            <p className="text-sm text-muted-foreground">No projects found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
