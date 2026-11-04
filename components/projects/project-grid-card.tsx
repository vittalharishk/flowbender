"use client";

import Link from "next/link";
import { CalendarDays, User, Clapperboard, Globe, FileText } from "lucide-react";
import type { Project } from "@/lib/types";
import { useScripts } from "@/lib/script-store";
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

interface ProjectGridCardProps {
  project: Project;
}

export function ProjectGridCard({ project }: ProjectGridCardProps) {
  const budgetPct = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
  const scripts = useScripts();
  const mainScript = scripts.find((s) => s.projectId === project.id && s.isMain && !s.archived);

  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="group rounded-xl border bg-card overflow-hidden hover:shadow-lg hover:border-amber-500/30 transition-all duration-200"
    >
      {/* Poster header */}
      <div className="relative h-32 overflow-hidden">
        <ProjectPoster title={project.title} image={project.thumbnailImage || project.posterImage} gradient={project.posterColor} className="absolute inset-0 h-full w-full rounded-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-bold text-lg leading-tight truncate group-hover:text-amber-300 transition-colors">
            {project.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-white/70 text-xs">{projectTypeLabels[project.type] ?? project.type}</span>
            <span className="text-white/40">|</span>
            <span className="text-white/70 text-xs">{project.genre}</span>
          </div>
        </div>
        <div className="absolute top-3 right-3">
          <ProductionBadge status={project.status} />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Meta */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 truncate">
            <User className="w-3 h-3 shrink-0" /> {project.director}
          </span>
          <span className="flex items-center gap-1.5 truncate">
            <Clapperboard className="w-3 h-3 shrink-0" /> {project.producer}
          </span>
          <span className="flex items-center gap-1.5">
            <Globe className="w-3 h-3 shrink-0" /> {project.language}
          </span>
          <span className="flex items-center gap-1.5" suppressHydrationWarning>
            <CalendarDays className="w-3 h-3 shrink-0" /> {formatDate(project.startDate)}
          </span>
        </div>

        {/* Main script */}
        {mainScript && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
            <FileText className="w-3 h-3 shrink-0" />
            <span className="truncate">{mainScript.draftName} v{mainScript.draftNumber} · {mainScript.status}</span>
          </div>
        )}

        {/* Shoot progress */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">
              Shoot: {project.completedShootDays}/{project.totalShootDays} days
            </span>
            <span className="font-medium">{project.shootProgress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
              style={{ width: `${project.shootProgress}%` }}
            />
          </div>
        </div>

        {/* Budget */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <p className="text-[11px] text-muted-foreground">Budget</p>
            <p className="text-sm font-semibold">{formatCurrency(project.budget)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">Spent</p>
            <p className="text-sm font-semibold">{formatCurrency(project.spent)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">Used</p>
            <p className={`text-sm font-semibold ${budgetPct >= 90 ? "text-red-400" : budgetPct >= 70 ? "text-amber-400" : "text-emerald-400"}`}>
              {budgetPct}%
            </p>
          </div>
        </div>

        {/* Next shoot */}
        {project.nextShootDate && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3" />
            Next shoot: {formatDate(project.nextShootDate)}
          </div>
        )}
      </div>
    </Link>
  );
}
