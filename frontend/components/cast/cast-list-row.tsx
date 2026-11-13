"use client";

import Link from "next/link";
import { Film, FileSignature, IndianRupee } from "lucide-react";
import { cn, formatINR } from "@/lib/utils";
import type { CastMember } from "@/lib/types";
import { castCategoryLabels, castCategoryColors } from "@/lib/cast-store";
import { StatusBadge } from "@/components/app/status-badge";

function fmtShort(v: number) {
  return formatINR(v);
}

interface Props {
  member: CastMember;
  projectScope?: boolean;
}

export function CastListRow({ member, projectScope }: Props) {
  const href = projectScope
    ? `/dashboard/projects/${member.projectId}/cast/${member.id}`
    : `/dashboard/cast/${member.id}`;

  return (
    <Link href={href} className="group block">
      <div className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-amber-400">{member.initials}</span>
        </div>

        {/* Name + Character */}
        <div className="min-w-0 flex-1 sm:w-48 sm:flex-none">
          <p className="text-sm font-medium group-hover:text-amber-400 transition-colors truncate">{member.name}</p>
          <p className="text-xs text-muted-foreground truncate">as {member.character}</p>
        </div>

        {/* Category */}
        <div className="hidden w-32 shrink-0 sm:block">
          <span className={cn(
            "rounded-full border px-2 py-0.5 text-xs font-medium",
            castCategoryColors[member.category]
          )}>
            {castCategoryLabels[member.category]}
          </span>
        </div>

        {/* Project (global only) */}
        {!projectScope && (
          <div className="w-36 shrink-0 hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Film className="w-3 h-3 shrink-0" />
            <span className="truncate">{member.projectTitle}</span>
          </div>
        )}

        {/* Contract */}
        <div className="hidden w-28 shrink-0 items-center gap-1 text-xs md:flex">
          <FileSignature className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
          <StatusBadge status={member.contractStatus} className="px-1.5 py-0 text-xs" />
        </div>

        {/* Payment */}
        <div className="hidden w-24 shrink-0 items-center gap-1 text-xs md:flex">
          <IndianRupee className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
          <StatusBadge status={member.paymentStatus} className="px-1.5 py-0 text-xs" />
        </div>

        {/* Fee */}
        <div className="ml-auto shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums">{fmtShort(member.totalFee)}</p>
          <p className="text-xs text-muted-foreground">
            {member.totalFee > 0 ? Math.round((member.paidAmount / member.totalFee) * 100) : 0}% paid
          </p>
        </div>
      </div>
    </Link>
  );
}
