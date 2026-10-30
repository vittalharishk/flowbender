"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Mail, Phone, Building2, CalendarDays, Film,
  FileSignature, IndianRupee, Clock, Pencil, StickyNote, Briefcase,
} from "lucide-react";
import { cn, formatINR } from "@/lib/utils";
import { useAppDataSlice } from "@/lib/app-data-store";
import { Button } from "@/components/ui/button";
import type { CrewMember } from "@/lib/types";
import {
  crewDepartmentLabels, crewDepartmentColors,
  availabilityLabels, availabilityColors,
} from "@/lib/crew-store";
import { EditCrewDialog } from "./edit-crew-dialog";
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

interface Props {
  member: CrewMember;
  backHref: string;
  backLabel: string;
  onUpdate?: () => void;
}

export function CrewProfile({ member, backHref, backLabel, onUpdate }: Props) {
  const [showEdit, setShowEdit] = useState(false);
  const liveScheduleEntries = useAppDataSlice("scheduleEntries");
  const today = new Date().toLocaleDateString("en-CA");

  const totalOwed = member.dayRate * member.totalDays;
  const paidPct = totalOwed > 0 ? Math.round((member.totalPaid / totalOwed) * 100) : 0;
  const remaining = totalOwed - member.totalPaid;
  const daysPct = member.totalDays > 0 ? Math.round((member.daysWorked / member.totalDays) * 100) : 0;

  const upcomingShoots = liveScheduleEntries
    .filter((s) => s.projectId === member.projectId && s.date >= today && s.status !== "completed" && s.status !== "postponed")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const cc = contractConfig[member.contractStatus];
  const pc = paymentConfig[member.paymentStatus];

  return (
    <div className="space-y-6">
      <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> {backLabel}
      </Link>
      <p className="text-xs text-muted-foreground">Seeded assignments, contacts, rates and contracts are demo planning data, not confirmed film or employment records.</p>

      {/* Hero */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-blue-500/20 to-cyan-600/10" />
        <div className="px-5 sm:px-6 pb-5 -mt-10">
          <div className="flex flex-col sm:flex-row gap-4">
            <Avatar src={member.profileImage} initials={member.initials} alt={`${member.name} profile image`} className="h-20 w-20 shrink-0 ring-4 ring-card shadow-lg" />
            <div className="flex-1 min-w-0 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">{member.name}</h1>
                  <p className="text-muted-foreground">{member.role}</p>
                </div>
                <Button variant="outline" size="sm" className="self-start gap-1.5" onClick={() => setShowEdit(true)}>
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full border", crewDepartmentColors[member.department])}>
                  {crewDepartmentLabels[member.department]}
                </span>
                <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", availabilityColors[member.availability])}>
                  {availabilityLabels[member.availability]}
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
        <div className="lg:col-span-2 space-y-6">
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

          {/* Work Progress */}
          <Section title="Work Progress">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <MiniStat label="Total Days" value={String(member.totalDays)} />
              <MiniStat label="Days Worked" value={String(member.daysWorked)} color="text-amber-400" />
              <MiniStat label="Days Remaining" value={String(member.totalDays - member.daysWorked)} />
              <MiniStat label="Completion" value={`${daysPct}%`} color={daysPct >= 90 ? "text-emerald-400" : "text-amber-400"} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Days Progress</span>
                <span>{daysPct}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, daysPct))}%` }}
                />
              </div>
            </div>
          </Section>

          {/* Payment Summary */}
          <Section title="Payment Summary">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <MiniStat label="Day Rate" value={fmt(member.dayRate)} />
              <MiniStat label="Total Owed" value={fmt(totalOwed)} />
              <MiniStat label="Paid" value={fmt(member.totalPaid)} color="text-emerald-400" />
              <MiniStat label="Remaining" value={fmt(remaining)} color={remaining > 0 ? "text-amber-400" : "text-emerald-400"} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Payment Progress</span>
                <span>{paidPct}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, paidPct))}%` }}
                />
              </div>
            </div>
          </Section>

          {/* Upcoming Shoots */}
          <Section title="Upcoming Project Shoot Days">
            <p className="text-xs text-muted-foreground mb-3">Project schedule only; this does not confirm this crew member&apos;s individual call.</p>
            {upcomingShoots.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming shoot days for this project. <Link href={`/dashboard/projects/${member.projectId}/schedule`} className="text-primary underline">Plan a shoot</Link></p>
            ) : (
              <div className="space-y-2">
                {upcomingShoots.map((entry) => {
                  const isToday = entry.date === today;
                  return (
                    <Link href={`/dashboard/projects/${member.projectId}/schedule`} key={entry.id} className={cn("flex items-center gap-3 p-3 rounded-lg", isToday ? "bg-amber-500/10 border border-amber-500/20" : "bg-muted/30")}>
                      <div className={cn(
                        "w-11 h-11 rounded-lg flex flex-col items-center justify-center shrink-0 text-xs",
                        isToday ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white" : "bg-muted"
                      )}>
                        <span className="font-bold leading-none">{new Date(entry.date).getDate()}</span>
                        <span className="text-[9px] uppercase opacity-80">{new Date(entry.date).toLocaleDateString("en", { month: "short" })}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {isToday && <span className="text-[10px] text-amber-400 font-medium uppercase">Today</span>}
                          <span className="text-xs text-muted-foreground">Day {entry.shootDayNumber}</span>
                        </div>
                        <p className="text-sm font-medium truncate">{entry.location}</p>
                        <p className="text-xs text-muted-foreground">{entry.scenes.join(", ")} &middot; Call: {entry.callTime}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Section>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <Section title="Contact">
            <div className="space-y-3">
              <InfoRow icon={Mail} label="Email" value={member.email} />
              <InfoRow icon={Phone} label="Phone" value={member.phone || "Not provided"} />
              {member.agency && <InfoRow icon={Building2} label="Agency / Guild" value={member.agency} />}
              <InfoRow icon={Briefcase} label="Department" value={crewDepartmentLabels[member.department]} />
              <InfoRow icon={CalendarDays} label="Joined" value={fmtDate(member.joinedDate)} />
            </div>
          </Section>

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

      <EditCrewDialog member={member} open={showEdit} onOpenChange={setShowEdit} onSaved={() => { setShowEdit(false); onUpdate?.(); }} />
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
