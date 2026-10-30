"use client";

import { usePathname, useRouter } from "next/navigation";
import { FolderKanban } from "lucide-react";
import { useProjects, useSelectedProjectId, setSelectedProjectId } from "@/lib/project-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ProjectSelectorProps {
  currentProjectId?: string;
  onProjectChange?: (projectId: string) => void;
  className?: string;
  syncUrl?: boolean;
}

const typeLabels: Record<string, string> = {
  "feature-film": "Feature Film",
  series: "Series / OTT",
  "short-film": "Short Film",
  "music-video": "Music Video",
  documentary: "Doc / Investigative",
  commercial: "Commercial",
};

export function ProjectSelector({
  currentProjectId,
  onProjectChange,
  className,
  syncUrl = true,
}: ProjectSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const projects = useProjects();
  const centralSelectedId = useSelectedProjectId();

  const activeId = currentProjectId || centralSelectedId || "p1";
  const currentProject = projects.find((p) => p.id === activeId);

  function handleSelect(nextId: string) {
    setSelectedProjectId(nextId);
    if (onProjectChange) {
      onProjectChange(nextId);
    }
    if (syncUrl && pathname) {
      // If we are on a project-specific URL like /dashboard/projects/[id]/module
      const projectRouteMatch = pathname.match(/^\/dashboard\/projects\/([^/]+)(\/.*)?$/);
      if (projectRouteMatch) {
        const moduleSuffix = projectRouteMatch[2] || "";
        router.push(`/dashboard/projects/${nextId}${moduleSuffix}`);
      }
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className || ""}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <FolderKanban className="h-4 w-4 text-primary" />
        <span>Project:</span>
      </div>
      <Select value={activeId} onValueChange={handleSelect}>
        <SelectTrigger className="w-[280px] sm:w-[320px] bg-background font-semibold shadow-sm border-border/80 focus:ring-primary">
          <SelectValue placeholder="Select flowbender project" />
        </SelectTrigger>
        <SelectContent className="max-h-[360px]">
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id} className="cursor-pointer py-2">
              <div className="flex items-center justify-between gap-3 w-full">
                <span className="font-semibold text-foreground">{project.title}</span>
                <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-normal">
                  {typeLabels[project.type] || project.type}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentProject && (
        <Badge variant="outline" className="hidden sm:inline-flex capitalize text-xs font-medium border-primary/20 bg-primary/5 text-primary">
          {typeLabels[currentProject.type] || currentProject.type} · {currentProject.status}
        </Badge>
      )}
    </div>
  );
}
