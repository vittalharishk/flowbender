"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Globe,
  Film,
  FileSignature,
  IndianRupee,
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertCircle,
  Pencil,
  Layers,
  MapPin,
  StickyNote,
  User,
} from "lucide-react";
import { cn, formatINR } from "@/lib/utils";
import { useAppDataSlice } from "@/lib/app-data-store";
import { Button } from "@/components/ui/button";
import type { CastMember, PaymentMilestone, CastScene } from "@/lib/types";
import { castCategoryLabels, castCategoryColors } from "@/lib/cast-store";
import { useScenesByProject } from "@/lib/scene-store";
import { EditCastDialog } from "./edit-cast-dialog";
import { Avatar } from "@/components/images/image-upload";

const contractConfig: Record<string, { label: string; color: string; bg: string }> = {
  signed: { label: "Signed", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  negotiating: { label: "Negotiating", color: "text-amber-400", bg: "bg-amber-500/10" },
  pending: { label: "Pending", color: "text-muted-foreground", bg: "bg-muted" },
  expired: { label: "Expired", color: "text-red-400", bg: "bg-red-500/10" },
};

const paymentConfig: Record<string, { label: string; color: string; bg: string }> = {
  paid: { label: "Fully Paid", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  partial: { label: "Partially Paid", color: "text-amber-400", bg: "bg-amber-500/10" },
  pending: { label: "Payment Pending", color: "text-muted-foreground", bg: "bg-muted" },
  overdue: { label: "Overdue", color: "text-red-400", bg: "bg-red-500/10" },
};

function fmt(v: number) {
  return formatINR(v);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface CastProfileProps {
  member: CastMember;
  backHref: string;
  backLabel: string;
  onUpdate?: () => void;
}

export function CastProfile({ member, backHref, backLabel, onUpdate }: CastProfileProps) {
  const [showEdit, setShowEdit] = useState(false);
  const liveScheduleEntries = useAppDataSlice("scheduleEntries");
  const projectScenes = useScenesByProject(member.projectId);
  const assignedScenes: CastScene[] = projectScenes
    .filter((scene) => scene.characters.some((character) => character.trim().toLowerCase() === member.character.trim().toLowerCase()))
    .map((scene) => ({
      id: scene.id, sceneNumber: scene.sceneNumber, title: scene.heading,
      status: scene.status === "shot" ? "completed" : scene.status === "scheduled" ? "scheduled" : "pending",
      shootDate: scene.shootDate,
    }));
  const today = new Date().toLocaleDateString("en-CA");

  const payPct = member.totalFee > 0 ? Math.round((member.paidAmount / member.totalFee) * 100) : 0;
  const scenesCompleted = assignedScenes.filter((s) => s.status === "completed").length;
  const scenesScheduled = assignedScenes.filter((s) => s.status === "scheduled").length;

  const upcomingShoots = liveScheduleEntries
    .filter((s) => {
      if (s.projectId !== member.projectId) return false;
      if (s.date < today || s.status === "completed" || s.status === "postponed") return false;
      return assignedScenes.some((ms) => s.scenes.some((ss) => ss.replace(/^sc(?:ene)?\.?\s*/i, "").trim() === ms.sceneNumber.replace(/^sc(?:ene)?\.?\s*/i, "").trim()));
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const cc = contractConfig[member.contractStatus];
  const pc = paymentConfig[member.paymentStatus];

  return (
    <div className="space-y-6">
      <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </Link>
      <p className="text-xs text-muted-foreground">Seeded assignments, contacts, fees and payment milestones are demo planning data, not confirmed film or contract records.</p>

      {/* Hero */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-amber-500/20 to-orange-600/10" />
        <div className="px-5 sm:px-6 pb-5 -mt-10">
          <div className="flex flex-col sm:flex-row gap-4">
            <Avatar src={member.profileImage} initials={member.initials} alt={`${member.name} reference image`} className="h-20 w-20 shrink-0 ring-4 ring-card shadow-lg" />
            <div className="flex-1 min-w-0 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">{member.name}</h1>
                  <p className="text-muted-foreground">
                    as <span className="text-foreground font-medium">{member.character}</span>
                  </p>
                </div>
                <Button variant="outline" size="sm" className="self-start gap-1.5" onClick={() => setShowEdit(true)}>
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">Reference image only — not a contract or casting confirmation.</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full border", castCategoryColors[member.category])}>
                  {castCategoryLabels[member.category]}
                </span>
                <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", cc.bg, cc.color)}>
                  <FileSignature className="w-3 h-3 inline mr-1" />{cc.label}
                </span>
                <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", pc.bg, pc.color)}>
                  <IndianRupee className="w-3 h-3 inline mr-1" />{pc.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Character Info */}
          <Section title="Character Information">
            <p className="text-sm text-muted-foreground leading-relaxed">{member.characterDescription || "No description provided."}</p>
          </Section>

          {/* Project Assignment */}
          <Section title="Project Assignment">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-600/10 flex items-center justify-center">
                <Film className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <Link href={`/dashboard/projects/${member.projectId}`} className="text-sm font-medium hover:text-amber-400 transition-colors">
                  {member.projectTitle}
                </Link>
                <p className="text-xs text-muted-foreground">Joined {fmtDate(member.joinedDate)}</p>
              </div>
            </div>
          </Section>

          {/* Contract & Payment Summary */}
          <Section title="Contract Summary">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <MiniStat label="Total Fee" value={fmt(member.totalFee)} />
              <MiniStat label="Paid" value={fmt(member.paidAmount)} color="text-emerald-400" />
              <MiniStat label="Remaining" value={fmt(member.totalFee - member.paidAmount)} color={member.totalFee - member.paidAmount > 0 ? "text-amber-400" : "text-emerald-400"} />
              <MiniStat label="Paid %" value={`${payPct}%`} color={payPct === 100 ? "text-emerald-400" : "text-amber-400"} />
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden mb-1">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, payPct))}%` }}
              />
            </div>
          </Section>

          {/* Payment Milestones */}
          {member.paymentMilestones.length > 0 && (
            <Section title="Payment Milestones">
              <div className="space-y-2">
                {member.paymentMilestones.map((pm) => (
                  <MilestoneRow key={pm.id} milestone={pm} />
                ))}
              </div>
            </Section>
          )}

          {/* Scenes Assigned */}
          <Section title="Scenes Assigned">
            <div className="flex gap-4 mb-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {scenesCompleted} Completed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                {scenesScheduled} Scheduled
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                {assignedScenes.length - scenesCompleted - scenesScheduled} Pending
              </span>
            </div>
            {assignedScenes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No scenes assigned yet. <Link href={`/dashboard/projects/${member.projectId}/scenes`} className="text-primary underline">Add this character to a scene</Link></p>
            ) : (
              <div className="space-y-2">
                {assignedScenes.map((sc) => (
                  <Link key={sc.id} href={`/dashboard/projects/${member.projectId}/scenes/${sc.id}`} className="block hover:bg-muted/50 rounded-lg"><SceneRow scene={sc} /></Link>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Personal Info */}
          <Section title="Contact">
            <div className="space-y-3">
              <InfoRow icon={Mail} label="Email" value={member.email} />
              <InfoRow icon={Phone} label="Phone" value={member.phone || "Not provided"} />
              {member.agency && <InfoRow icon={Building2} label="Agency" value={member.agency} />}
              <InfoRow icon={Globe} label="Languages" value={member.languages.join(", ") || "Not specified"} />
              <InfoRow icon={CalendarDays} label="Joined" value={fmtDate(member.joinedDate)} />
            </div>
          </Section>

          {/* Upcoming Shoots */}
          <Section title="Upcoming Shoot Days">
            {upcomingShoots.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming shoots. <Link href={`/dashboard/projects/${member.projectId}/schedule`} className="text-primary underline">View project schedule</Link></p>
            ) : (
              <div className="space-y-2">
                {upcomingShoots.map((entry) => {
                  const isToday = entry.date === today;
                  return (
                    <Link href={`/dashboard/projects/${member.projectId}/schedule`} key={entry.id} className={cn("block p-2.5 rounded-lg text-xs", isToday ? "bg-amber-500/10 border border-amber-500/20" : "bg-muted/40")}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{fmtDate(entry.date)}</span>
                        {isToday && <span className="text-[10px] text-amber-400 font-medium uppercase">Today</span>}
                      </div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" /> {entry.location}
                      </p>
                      <p className="text-muted-foreground mt-0.5">
                        {entry.scenes.join(", ")} &middot; Call: {entry.callTime}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Notes */}
          {member.notes && (
            <Section title="Notes">
              <div className="flex gap-2">
                <StickyNote className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">{member.notes}</p>
              </div>
            </Section>
          )}
        </div>
      </div>

      <EditCastDialog
        member={member}
        open={showEdit}
        onOpenChange={setShowEdit}
        onSaved={() => {
          setShowEdit(false);
          onUpdate?.();
        }}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3 text-center">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={cn("text-lg font-bold mt-0.5", color)}>{value}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        {label === "Email" && value ? <a href={`mailto:${value}`} className="text-sm break-all hover:underline">{value}</a> : label === "Phone" && value !== "Not provided" ? <a href={`tel:${value}`} className="text-sm break-all hover:underline">{value}</a> : <p className="text-sm break-all">{value || "Not provided"}</p>}
      </div>
    </div>
  );
}

function MilestoneRow({ milestone }: { milestone: PaymentMilestone }) {
  const statusMap: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
    paid: { icon: CheckCircle2, color: "text-emerald-400", label: "Paid" },
    due: { icon: AlertCircle, color: "text-amber-400", label: "Due" },
    upcoming: { icon: Clock, color: "text-muted-foreground", label: "Upcoming" },
  };
  const cfg = statusMap[milestone.status];
  const Icon = cfg.icon;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
      <Icon className={cn("w-4 h-4 shrink-0", cfg.color)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{milestone.label}</p>
        <p className="text-xs text-muted-foreground">Due {fmtDate(milestone.dueDate)}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold">{fmt(milestone.amount)}</p>
        <p className={cn("text-[11px] font-medium", cfg.color)}>{cfg.label}</p>
      </div>
    </div>
  );
}

function SceneRow({ scene }: { scene: CastScene }) {
  const statusColors: Record<string, string> = {
    completed: "bg-emerald-500",
    scheduled: "bg-amber-500",
    pending: "bg-muted-foreground",
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
      <span className={cn("w-2 h-2 rounded-full shrink-0", statusColors[scene.status])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{scene.sceneNumber}</p>
        <p className="text-xs text-muted-foreground truncate">{scene.title}</p>
      </div>
      <div className="text-right shrink-0 text-xs">
        {scene.shootDate ? (
          <span className="text-muted-foreground">{fmtDate(scene.shootDate)}</span>
        ) : (
          <span className="text-muted-foreground">TBD</span>
        )}
      </div>
    </div>
  );
}
