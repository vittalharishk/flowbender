"use client";

import { Film, User, Clapperboard, CalendarDays } from "lucide-react";
import Link from "next/link";
import { cn, formatINR } from "@/lib/utils";
import type { Project } from "@/lib/types";
import { ProductionBadge } from "@/components/app/production-badge";
import { ProjectPoster } from "@/components/projects/project-poster";

function formatCurrency(value: number) {
  return formatINR(value);
}

function PosterPlaceholder({ title, gradient }: { title: string; gradient: string }) {
  const initials = title
    .split(" ")
    .filter((w) => w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <div
      className={cn(
        "w-full h-full rounded-lg bg-gradient-to-br flex items-center justify-center",
        gradient
      )}
    >
      <div className="text-center">
        <Film className="w-6 h-6 text-white/60 mx-auto mb-1" />
        <span className="text-white/80 text-xs font-bold tracking-wider">{initials}</span>
      </div>
    </div>
  );
}

interface ActiveProductionsProps {
  projects: Project[];
}

export function ActiveProductions({ projects }: ActiveProductionsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Active Productions</h3>
        <Link href="/dashboard/projects" className="text-sm text-primary hover:underline">View all projects</Link>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {projects.map((project) => {
          const budgetPct = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
          const budgetColor =
            budgetPct >= 90 ? "from-red-500 to-red-600" :
            budgetPct >= 70 ? "from-amber-500 to-orange-600" :
            "from-emerald-500 to-teal-600";

          return (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="rounded-xl border bg-card overflow-hidden hover:shadow-lg hover:border-border/80 transition-all duration-200 group"
            >
              <div className="flex gap-4 p-4">
                {/* Poster */}
                <div className="w-[72px] h-[100px] shrink-0 rounded-lg overflow-hidden shadow-md">
                  <ProjectPoster
                    title={project.title}
                    gradient={project.posterColor}
                    image={project.posterImage}
                    className="h-full w-full"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-semibold truncate group-hover:text-primary transition-colors">
                        {project.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{project.genre}</p>
                    </div>
                    <ProductionBadge status={project.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3 h-3" /> {project.director}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clapperboard className="w-3 h-3" /> {project.producer}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom stats bar */}
              <div className="border-t bg-muted/30 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  {/* Shoot progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">
                        Shoot: {project.completedShootDays}/{project.totalShootDays} days
                      </span>
                      <span className="font-medium">{project.shootProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, project.shootProgress))}%` }}
                      />
                    </div>
                  </div>

                  <div className="h-8 w-px bg-border shrink-0" />

                  {/* Budget */}
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="text-sm font-semibold">
                      {formatCurrency(project.spent)}{" "}
                      <span className="text-muted-foreground font-normal">/ {formatCurrency(project.budget)}</span>
                    </p>
                  </div>
                </div>

                {project.nextShootDate && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                    <CalendarDays className="w-3 h-3" />
                    <span>
                      Next shoot:{" "}
                      {new Date(project.nextShootDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      {projects.length === 0 && <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No active productions. Open Projects to create one or update its status.</p>}
    </div>
  );
}
