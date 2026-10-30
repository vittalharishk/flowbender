"use client";

import Link from "next/link";
import { Film, FileSignature } from "lucide-react";
import { cn, formatINR } from "@/lib/utils";
import type { CrewMember } from "@/lib/types";
import {
  crewDepartmentLabels,
  crewDepartmentColors,
  availabilityLabels,
  availabilityColors,
} from "@/lib/crew-store";

const contractColors: Record<string, string> = {
  signed: "text-emerald-400",
  negotiating: "text-amber-400",
  pending: "text-muted-foreground",
  expired: "text-red-400",
};

function fmtShort(v: number) {
  return formatINR(v);
}

interface Props {
  member: CrewMember;
  projectScope?: boolean;
}

export function CrewListRow({ member, projectScope }: Props) {
  const href = projectScope
    ? `/dashboard/projects/${member.projectId}/crew/${member.id}`
    : `/dashboard/crew/${member.id}`;

  return (
    <Link href={href} className="group block">
      <div className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-600/20 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-blue-400">{member.initials}</span>
        </div>

        <div className="min-w-0 flex-1 sm:w-44 sm:flex-none">
          <p className="text-sm font-medium group-hover:text-amber-400 transition-colors truncate">{member.name}</p>
          <p className="text-xs text-muted-foreground truncate">{member.role}</p>
        </div>

        <div className="w-32 shrink-0 hidden sm:block">
          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", crewDepartmentColors[member.department])}>
            {crewDepartmentLabels[member.department]}
          </span>
        </div>

        {!projectScope && (
          <div className="w-36 shrink-0 hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Film className="w-3 h-3 shrink-0" />
            <span className="truncate">{member.projectTitle}</span>
          </div>
        )}

        <div className="w-24 shrink-0 hidden md:block">
          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", availabilityColors[member.availability])}>
            {availabilityLabels[member.availability]}
          </span>
        </div>

        <div className="w-24 shrink-0 hidden md:flex items-center gap-1 text-xs">
          <FileSignature className="w-3 h-3 text-muted-foreground" />
          <span className={contractColors[member.contractStatus]}>
            {member.contractStatus.charAt(0).toUpperCase() + member.contractStatus.slice(1)}
          </span>
        </div>

        <div className="ml-auto text-right shrink-0">
          <p className="text-sm font-semibold">{fmtShort(member.dayRate)}/day</p>
          <p className="text-[11px] text-muted-foreground">
            {member.daysWorked}/{member.totalDays} days
          </p>
        </div>
      </div>
    </Link>
  );
}
