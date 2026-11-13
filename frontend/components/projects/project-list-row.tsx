"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import type { Project } from "@/lib/types";
import { ProductionBadge } from "@/components/app/production-badge";
import { ProjectPoster } from "./project-poster";
import { projectTypeLabels } from "@/lib/mock-data";
import { formatINR } from "@/lib/utils";

function formatCurrency(value: number) {
  return formatINR(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface ProjectListRowProps {
  project: Project;
}

export function ProjectListRow({ project }: ProjectListRowProps) {
  const budgetPct = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;

  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="group flex items-center gap-4 px-4 py-3 rounded-xl border bg-card hover:shadow-md hover:border-amber-500/30 transition-all duration-200"
    >
      {/* Poster */}
      <ProjectPoster title={project.title} image={project.thumbnailImage || project.posterImage} gradient={project.posterColor} className="w-14 h-20 shrink-0" />

      {/* Info */}
      <div className="flex-1 min-w-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_120px_140px_100px_100px_24px] gap-x-4 gap-y-1 items-center">
        {/* Title + meta */}
        <div className="min-w-0">
          <h4 className="font-semibold truncate group-hover:text-amber-400 transition-colors">{project.title}</h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
            <span>{projectTypeLabels[project.type] ?? project.type}</span>
            <span className="text-muted-foreground/40">|</span>
            <span>{project.genre}</span>
            <span className="text-muted-foreground/40">|</span>
            <span>{project.language}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Dir: {project.director} &middot; Prod: {project.producer}
          </div>
        </div>

        {/* Status */}
        <div className="hidden sm:block">
          <ProductionBadge status={project.status} />
        </div>

        {/* Shoot progress */}
        <div className="hidden sm:block">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                style={{ width: `${project.shootProgress}%` }}
              />
            </div>
            <span className="text-xs font-medium w-8 text-right">{project.shootProgress}%</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {project.completedShootDays}/{project.totalShootDays} days
          </p>
        </div>

        {/* Budget */}
        <div className="hidden sm:block text-right">
          <p className="text-sm font-semibold">{formatCurrency(project.budget)}</p>
          <p className="text-[11px] text-muted-foreground">{formatCurrency(project.spent)} spent</p>
        </div>

        {/* Release */}
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground" suppressHydrationWarning>
          <CalendarDays className="w-3 h-3" />
          {formatDate(project.endDate)}
        </div>

        {/* Arrow */}
        <div className="hidden sm:flex justify-end">
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-400 transition-colors" />
        </div>
      </div>
    </Link>
  );
}
