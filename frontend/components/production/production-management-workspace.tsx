"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clapperboard,
  FileText,
  Film,
  Layers,
} from "lucide-react";
import { useProjects } from "@/lib/project-store";
import { useShootDays } from "@/lib/schedule-store";
import { useCrewMembers } from "@/lib/crew-store";
import { useDPRReports } from "@/lib/dpr-store";
import type { Project } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectPoster } from "@/components/projects/project-poster";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { SearchInput } from "@/components/app/search-input";
import { DigitalClapperboardModal } from "./digital-clapperboard-modal";

type StatusTab = "all" | "production" | "pre-production" | "post-production";

const statusTabs: { value: StatusTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "production", label: "Production" },
  { value: "pre-production", label: "Pre-Production" },
  { value: "post-production", label: "Post-Production" },
];

interface ProductionWorkspaceProps {
  scopedProjectId?: string;
}

export function ProductionManagementWorkspace({ scopedProjectId }: ProductionWorkspaceProps) {
  const allProjects = useProjects();
  const allShootDays = useShootDays();
  const crewMembers = useCrewMembers();
  const dprReports = useDPRReports();

  const [clapperOpen, setClapperOpen] = useState(false);
  const [selectedClapperProject, setSelectedClapperProject] = useState<{
    id: string;
    title: string;
    director?: string;
  } | null>(null);

  const [searchFilter, setSearchFilter] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>("all");

  const displayedProjects = useMemo(
    () =>
      allProjects.filter((p) => {
        if (scopedProjectId && p.id !== scopedProjectId) return false;
        if (selectedProjectFilter !== "all" && p.id !== selectedProjectFilter) return false;
        if (statusTab !== "all" && p.status !== statusTab) return false;
        if (searchFilter.trim()) {
          const q = searchFilter.toLowerCase();
          return (
            p.title.toLowerCase().includes(q) ||
            (p.director && p.director.toLowerCase().includes(q)) ||
            (p.productionHouse && p.productionHouse.toLowerCase().includes(q))
          );
        }
        return true;
      }),
    [allProjects, scopedProjectId, selectedProjectFilter, statusTab, searchFilter]
  );

  const scopedProjects = scopedProjectId ? allProjects.filter((p) => p.id === scopedProjectId) : allProjects;
  const totalShootDays = scopedProjects.reduce((acc, p) => acc + (p.totalShootDays || 0), 0);
  const combinedBudget = scopedProjects.reduce((acc, p) => acc + (p.budget || 0), 0);
  const scopedCrew = scopedProjectId
    ? crewMembers.filter((c) => c.projectId === scopedProjectId).length
    : crewMembers.length;

  const recentReports = useMemo(
    () =>
      [...dprReports]
        .filter((r) => !scopedProjectId || r.projectId === scopedProjectId)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    [dprReports, scopedProjectId]
  );

  const handleOpenClapper = (project: Project) => {
    setSelectedClapperProject({ id: project.id, title: project.title, director: project.director });
    setClapperOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Projects" value={scopedProjects.length} icon={Film} hint="In this view" />
        <StatCard label="Planned Shoot Days" value={totalShootDays} icon={Calendar} hint="Across projects" />
        <StatCard label="Combined Budget" value={formatINR(combinedBudget)} hint="Planned budget" />
        <StatCard label="Crew Members" value={scopedCrew} hint="On record" />
      </div>

      {/* Productions */}
      <section className="space-y-4" aria-labelledby="active-productions-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="active-productions-heading" className="flex items-center gap-2 text-lg font-semibold">
              <Layers className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Productions
            </h2>
            <p className="text-xs text-muted-foreground">
              Shoot progress, continuity and call sheets by project
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!scopedProjectId && (
              <div className="space-y-1">
                <label htmlFor="production-project-filter" className="sr-only">
                  Filter by project
                </label>
                <Select value={selectedProjectFilter} onValueChange={setSelectedProjectFilter}>
                  <SelectTrigger id="production-project-filter" className="h-9 w-[180px]">
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All projects</SelectItem>
                    {allProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <SearchInput
              label="Search productions"
              placeholder="Search productions..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              wrapperClassName="w-40 sm:w-56"
            />
            <div className="flex overflow-hidden rounded-lg border" role="group" aria-label="Filter by status">
              {statusTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusTab(tab.value)}
                  aria-pressed={statusTab === tab.value}
                  className={`px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 ${
                    statusTab === tab.value
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {displayedProjects.length === 0 ? (
          <EmptyState
            icon={Film}
            title="No productions match your filters"
            description="Try a different search term or status filter."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearchFilter("");
                  setStatusTab("all");
                  setSelectedProjectFilter("all");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {displayedProjects.map((project) => {
              const projectShootDays = allShootDays.filter((d) => d.projectId === project.id);
              const totalDays = project.totalShootDays || projectShootDays.length;
              const completedDays =
                project.completedShootDays || projectShootDays.filter((d) => d.status === "completed").length;
              const progressPercent = totalDays > 0 ? Math.min(100, Math.round((completedDays / totalDays) * 100)) : 0;

              return (
                <Card key={project.id} className="flex flex-col overflow-hidden">
                  <div className="flex gap-3 p-4">
                    <ProjectPoster
                      title={project.title}
                      gradient={project.posterColor}
                      image={project.posterImage}
                      className="h-24 w-16 shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate text-sm font-semibold">
                          <Link
                            href={`/dashboard/projects/${project.id}`}
                            className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                          >
                            {project.title}
                          </Link>
                        </h3>
                        <StatusBadge status={project.status} className="shrink-0 text-xs" />
                      </div>
                      {project.director && (
                        <p className="truncate text-xs text-muted-foreground">Director: {project.director}</p>
                      )}
                      {project.productionHouse && (
                        <p className="truncate text-xs text-muted-foreground">{project.productionHouse}</p>
                      )}
                      {project.budget > 0 && (
                        <p className="text-xs font-medium text-foreground">{formatINR(project.budget)}</p>
                      )}
                    </div>
                  </div>

                  <CardContent className="space-y-3 px-4 pb-4 pt-0">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Principal photography</span>
                        <span className="font-semibold tabular-nums">
                          {totalDays > 0 ? `Day ${completedDays} / ${totalDays} (${progressPercent}%)` : "Not scheduled"}
                        </span>
                      </div>
                      <Progress
                        value={progressPercent}
                        className="h-2"
                        aria-label={`${project.title} shoot progress: ${progressPercent} percent`}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => handleOpenClapper(project)}
                      >
                        <Clapperboard className="h-3.5 w-3.5" aria-hidden="true" />
                        Slate
                      </Button>
                      <Button size="sm" variant="outline" asChild className="h-8 text-xs">
                        <Link href={`/dashboard/projects/${project.id}/call-sheets`}>Call Sheets</Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild className="h-8 text-xs">
                        <Link href={`/dashboard/projects/${project.id}/production`}>DPR</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent DPR submissions */}
      <section className="space-y-3" aria-labelledby="recent-dpr-heading">
        <h2 id="recent-dpr-heading" className="flex items-center gap-2 text-lg font-semibold">
          <FileText className="h-4 w-4 text-amber-500" aria-hidden="true" />
          Recent DPR submissions
        </h2>
        <Card>
          <CardContent className="p-4">
            {recentReports.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No daily production reports yet"
                description="Reports submitted from a project's DPR tab appear here."
                className="py-6"
              />
            ) : (
              <ul className="divide-y">
                {recentReports.map((report) => {
                  const projectTitle =
                    allProjects.find((p) => p.id === report.projectId)?.title ?? report.projectId;
                  return (
                    <li key={report.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          Day {report.shootDayNumber} · {projectTitle}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {report.date}
                          {report.location ? ` · ${report.location}` : ""}
                          {report.submittedBy ? ` · ${report.submittedBy}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {report.scenesCompleted}/{report.scenesPlanned} scenes
                        </span>
                        <StatusBadge status={report.status} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <DigitalClapperboardModal
        open={clapperOpen}
        onOpenChange={setClapperOpen}
        defaultProjectId={selectedClapperProject?.id}
        defaultProjectTitle={selectedClapperProject?.title}
        defaultDirector={selectedClapperProject?.director}
      />
    </div>
  );
}
