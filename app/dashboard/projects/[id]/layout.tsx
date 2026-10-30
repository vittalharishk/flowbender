"use client";

import { useParams, usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Clapperboard,
  Building2,
  Globe,
  Pencil,
  Film,
  LayoutDashboard,
  Users,
  UserCog,
  FileText,
  Layers,
  CalendarDays,
  ClipboardList,
  Video,
  Camera,
  IndianRupee,
  Scissors,
  Megaphone,
  MapPin,
  CheckCircle,
  HardDrive,
  Zap,
} from "lucide-react";
import { useProject } from "@/lib/project-store";
import { projectTypeLabels } from "@/lib/mock-data";
import { ProductionBadge } from "@/components/app/production-badge";
import { ProjectPoster } from "@/components/projects/project-poster";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { verifiedFilmMetadata } from "@/lib/film-metadata-registry";
import { DigitalClapperboardModal } from "@/components/production/digital-clapperboard-modal";

interface ProjectTab {
  label: string;
  segment: string;
  icon: typeof LayoutDashboard;
}

const projectTabs: ProjectTab[] = [
  { label: "Overview", segment: "", icon: LayoutDashboard },
  { label: "Cast", segment: "/cast", icon: Users },
  { label: "Crew", segment: "/crew", icon: UserCog },
  { label: "Attendance", segment: "/attendance", icon: CheckCircle },
  { label: "Equipment", segment: "/equipment", icon: Camera },
  { label: "Locations", segment: "/locations", icon: MapPin },
  { label: "Media", segment: "/media", icon: HardDrive },
  { label: "Script", segment: "/script", icon: FileText },
  { label: "Scenes", segment: "/scenes", icon: Layers },
  { label: "Schedule", segment: "/schedule", icon: CalendarDays },
  { label: "Call Sheets", segment: "/call-sheets", icon: ClipboardList },
  { label: "Production", segment: "/production", icon: Video },
  { label: "VFX", segment: "/vfx", icon: Zap },
  { label: "Finance", segment: "/finance", icon: IndianRupee },
  { label: "Post Production", segment: "/post-production", icon: Scissors },
  { label: "Subtitles", segment: "/subtitles", icon: Globe },
  { label: "Distribution", segment: "/distribution", icon: Megaphone },
];

export default function ProjectWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const project = useProject(params.id as string);
  const [editing, setEditing] = useState(false);
  const [slateOpen, setSlateOpen] = useState(false);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Film className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">Project not found</h3>
        <p className="text-muted-foreground text-sm mb-4">
          This project may have been removed or the link is incorrect.
        </p>
        <Link href="/dashboard/projects">
          <Button variant="outline" size="sm">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const basePath = `/dashboard/projects/${project.id}`;
  const publicMetadata = verifiedFilmMetadata.find((item) => item.projectId === project.id);

  function isActive(segment: string) {
    const tabPath = basePath + segment;
    if (segment === "") return pathname === basePath;
    return pathname.startsWith(tabPath);
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-0">
      {/* Back link */}
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        All Projects
      </Link>

      {/* Hero Header */}
      <div className="rounded-2xl border bg-card overflow-hidden mb-0 shadow-sm">
        <div className="relative h-36 sm:h-48 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-800 to-indigo-950">
          {(project.bannerImage || project.posterImage) && (
            <img
              src={project.bannerImage || project.posterImage || undefined}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-45 blur-[1px] scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/55 to-slate-950/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative px-5 sm:px-6 pb-5">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Poster */}
            <ProjectPoster
              title={project.title}
              gradient={project.posterColor}
              image={project.posterImage}
              className="w-24 h-[132px] sm:w-32 sm:h-[172px] -mt-14 sm:-mt-16 shrink-0 shadow-xl ring-4 ring-card"
            />

            {/* Info */}
            <div className="flex-1 min-w-0 pt-0 sm:pt-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold truncate">{project.title}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap text-sm text-muted-foreground">
                    <span>{projectTypeLabels[project.type] ?? project.type}</span>
                    <span className="text-muted-foreground/30">|</span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" /> {project.language}
                    </span>
                    <span className="text-muted-foreground/30">|</span>
                    <ProductionBadge status={project.status} />
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/60 font-semibold shadow-sm text-xs cursor-pointer"
                    onClick={() => setSlateOpen(true)}
                  >
                    <Clapperboard className="w-3.5 h-3.5 text-amber-500" />
                    Cinema Slate
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => setEditing(true)}>
                    <Pencil className="w-3.5 h-3.5" />
                    Edit Project
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> {project.director}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clapperboard className="w-3.5 h-3.5" /> {project.producer}
                </span>
                {project.productionHouse && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> {project.productionHouse}
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-600 dark:text-emerald-300">
                  {publicMetadata ? "Active Feature Slate · Principal Hub" : "Production Workspace"}
                </span>
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-medium text-primary">
                  flowbender verified · Production Ready
                </span>
                {publicMetadata?.releaseDate && publicMetadata.releaseDate !== "Not publicly confirmed" && (
                  <span className="rounded-full border border-muted-foreground/20 bg-muted/40 px-2.5 py-1 text-muted-foreground">
                    Release: {publicMetadata.releaseDate}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="border-t">
          <ScrollArea className="w-full">
            <nav className="flex px-4 sm:px-6 min-w-max">
              {projectTabs.map((tab) => {
                const active = isActive(tab.segment);
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.segment}
                    href={basePath + tab.segment}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                      active
                        ? "border-amber-500 text-amber-400"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      {/* Tab content */}
      <div className="pt-6">{children}</div>
      {editing && <EditProjectDialog key={project.id} project={project} onClose={() => setEditing(false)} />}
      <DigitalClapperboardModal
        open={slateOpen}
        onOpenChange={setSlateOpen}
        defaultProjectId={project.id}
        defaultProjectTitle={project.title}
        defaultDirector={project.director}
      />
    </div>
  );
}
