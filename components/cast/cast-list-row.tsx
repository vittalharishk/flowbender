"use client";

import Link from "next/link";
import { Film, FileSignature, IndianRupee } from "lucide-react";
import { cn, formatINR } from "@/lib/utils";
import type { CastMember } from "@/lib/types";
import { castCategoryLabels, castCategoryColors } from "@/lib/cast-store";

const contractColors: Record<string, string> = {
  signed: "text-emerald-400",
  negotiating: "text-amber-400",
  pending: "text-muted-foreground",
  expired: "text-red-400",
};

const paymentColors: Record<string, string> = {
  paid: "text-emerald-400",
  partial: "text-amber-400",
  pending: "text-muted-foreground",
  overdue: "text-red-400",
};

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
        <div className="w-32 shrink-0 hidden sm:block">
          <span className={cn(
            "text-[10px] font-medium px-2 py-0.5 rounded-full border",
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
        <div className="w-24 shrink-0 hidden md:flex items-center gap-1 text-xs">
          <FileSignature className="w-3 h-3 text-muted-foreground" />
          <span className={contractColors[member.contractStatus]}>
            {member.contractStatus.charAt(0).toUpperCase() + member.contractStatus.slice(1)}
          </span>
        </div>

        {/* Payment */}
        <div className="w-20 shrink-0 hidden md:flex items-center gap-1 text-xs">
          <IndianRupee className="w-3 h-3 text-muted-foreground" />
          <span className={paymentColors[member.paymentStatus]}>
            {member.paymentStatus.charAt(0).toUpperCase() + member.paymentStatus.slice(1)}
          </span>
        </div>

        {/* Fee */}
        <div className="ml-auto text-right shrink-0">
          <p className="text-sm font-semibold">{fmtShort(member.totalFee)}</p>
          <p className="text-[11px] text-muted-foreground">
            {member.totalFee > 0 ? Math.round((member.paidAmount / member.totalFee) * 100) : 0}% paid
          </p>
        </div>
      </div>
    </Link>
  );
}
