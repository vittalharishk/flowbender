"use client";

import Link from "next/link";
import { Mail, Film, FileSignature, IndianRupee } from "lucide-react";
import { cn, formatINR } from "@/lib/utils";
import type { CastMember } from "@/lib/types";
import { castCategoryLabels, castCategoryColors } from "@/lib/cast-store";
import { Avatar } from "@/components/images/image-upload";

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

function fmtShort(value: number) {
  return formatINR(value);
}

interface CastCardProps {
  member: CastMember;
  projectScope?: boolean;
}

export function CastCard({ member, projectScope }: CastCardProps) {
  const href = projectScope
    ? `/dashboard/projects/${member.projectId}/cast/${member.id}`
    : `/dashboard/cast/${member.id}`;

  return (
    <Link href={href} className="group block">
      <div className="rounded-xl border bg-card p-4 hover:border-amber-500/40 transition-all hover:shadow-lg hover:shadow-amber-500/5 h-full">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar src={member.profileImage} initials={member.initials} alt={member.name} className="shrink-0 ring-2 ring-amber-500/10 group-hover:ring-amber-500/30 transition-all" />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm group-hover:text-amber-400 transition-colors truncate">
              {member.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate">as {member.character}</p>
          </div>
          <span className={cn(
            "text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0",
            castCategoryColors[member.category]
          )}>
            {castCategoryLabels[member.category]}
          </span>
        </div>

        {/* Project (only in global view) */}
        {!projectScope && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <Film className="w-3 h-3" />
            <span className="truncate">{member.projectTitle}</span>
          </div>
        )}

        {/* Status row */}
        <div className="flex items-center gap-4 text-xs mb-3">
          <span className="flex items-center gap-1">
            <FileSignature className="w-3 h-3 text-muted-foreground" />
            <span className={contractColors[member.contractStatus]}>
              {member.contractStatus.charAt(0).toUpperCase() + member.contractStatus.slice(1)}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <IndianRupee className="w-3 h-3 text-muted-foreground" />
            <span className={paymentColors[member.paymentStatus]}>
              {member.paymentStatus.charAt(0).toUpperCase() + member.paymentStatus.slice(1)}
            </span>
          </span>
        </div>

        {/* Fee bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Fee: {fmtShort(member.totalFee)}</span>
            <span className="text-muted-foreground">
              {member.totalFee > 0 ? Math.round((member.paidAmount / member.totalFee) * 100) : 0}% paid
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${member.totalFee > 0 ? Math.min((member.paidAmount / member.totalFee) * 100, 100) : 0}%` }}
            />
          </div>
        </div>

        {/* Contact hint */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 truncate">
            <Mail className="w-3 h-3 shrink-0" /> {member.email}
          </span>
        </div>
      </div>
    </Link>
  );
}
