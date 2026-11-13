"use client";

import Link from "next/link";
import { Mail, Film, FileSignature, IndianRupee } from "lucide-react";
import { cn, formatINR } from "@/lib/utils";
import type { CastMember } from "@/lib/types";
import { castCategoryLabels, castCategoryColors } from "@/lib/cast-store";
import { Avatar } from "@/components/images/image-upload";
import { StatusBadge } from "@/components/app/status-badge";

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
            <p className="font-semibold text-sm group-hover:text-amber-400 transition-colors truncate">
              {member.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">as {member.character}</p>
          </div>
          <span className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
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
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1">
            <FileSignature className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            <StatusBadge status={member.contractStatus} className="px-1.5 py-0 text-xs" />
          </span>
          <span className="flex items-center gap-1">
            <IndianRupee className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            <StatusBadge status={member.paymentStatus} className="px-1.5 py-0 text-xs" />
          </span>
        </div>

        {/* Fee bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
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
        <div className="mt-3 flex items-center gap-3 border-t pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 truncate">
            <Mail className="h-3 w-3 shrink-0" aria-hidden="true" /> {member.email}
          </span>
        </div>
      </div>
    </Link>
  );
}
