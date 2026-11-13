"use client";

import Link from "next/link";
import { Film, FileSignature, DollarSign, Clock } from "lucide-react";
import { cn, formatINR } from "@/lib/utils";
import type { CrewMember } from "@/lib/types";
import {
  crewDepartmentLabels,
  crewDepartmentColors,
  availabilityLabels,
  availabilityColors,
} from "@/lib/crew-store";
import { Avatar } from "@/components/images/image-upload";
import { StatusBadge } from "@/components/app/status-badge";

function fmtShort(v: number) {
  return formatINR(v);
}

interface Props {
  member: CrewMember;
  projectScope?: boolean;
}

export function CrewCard({ member, projectScope }: Props) {
  const href = projectScope
    ? `/dashboard/projects/${member.projectId}/crew/${member.id}`
    : `/dashboard/crew/${member.id}`;

  const totalOwed = member.dayRate * member.totalDays;
  const paidPct = totalOwed > 0 ? Math.round((member.totalPaid / totalOwed) * 100) : 0;
  const daysPct = member.totalDays > 0 ? Math.round((member.daysWorked / member.totalDays) * 100) : 0;

  return (
    <Link href={href} className="group block">
      <div className="rounded-xl border bg-card p-4 hover:border-amber-500/40 transition-all hover:shadow-lg hover:shadow-amber-500/5 h-full">
        <div className="flex items-start gap-3 mb-3">
          <Avatar src={member.profileImage} initials={member.initials} alt={member.name} className="shrink-0 ring-2 ring-blue-500/10 group-hover:ring-amber-500/30 transition-all" />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm group-hover:text-amber-400 transition-colors truncate">
              {member.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate">{member.role}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", crewDepartmentColors[member.department])}>
            {crewDepartmentLabels[member.department]}
          </span>
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", availabilityColors[member.availability])}>
            {availabilityLabels[member.availability]}
          </span>
        </div>

        {!projectScope && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <Film className="w-3 h-3" />
            <span className="truncate">{member.projectTitle}</span>
          </div>
        )}

        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1">
            <FileSignature className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            <StatusBadge status={member.contractStatus} className="px-1.5 py-0 text-xs" />
          </span>
          <span className="text-muted-foreground tabular-nums">
            {fmtShort(member.dayRate)}/day
          </span>
        </div>

        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Days: {member.daysWorked}/{member.totalDays}</span>
              <span className="text-muted-foreground">{daysPct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{ width: `${daysPct}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Paid: {fmtShort(member.totalPaid)}</span>
              <span className="text-muted-foreground">{paidPct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${paidPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
