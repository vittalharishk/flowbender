"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clapperboard,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Layers,
  ChevronRight,
  Sparkles,
  Search,
  ExternalLink,
  SlidersHorizontal,
  MapPin,
  Clock,
  Sun,
  Video,
  Camera,
} from "lucide-react";
import { useProjects, useProject } from "@/lib/project-store";
import { useShootDays } from "@/lib/schedule-store";
import type { Project, ShootDay } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DigitalClapperboardModal } from "./digital-clapperboard-modal";

const CuratedProjectArtwork: Record<string, { banner: string; tag: string }> = {
  p1: {
    banner: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=85",
    tag: "Action / Period Drama",
  },
  p2: {
    banner: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=85",
    tag: "Sci-Fi / Dystopian Epic",
  },
  p3: {
    banner: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85",
    tag: "Coastal Action Drama",
  },
  p4: {
    banner: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1200&q=85",
    tag: "Psychological Action Noir",
  },
  p5: {
    banner: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=85",
    tag: "Gangster Action Thriller",
  },
  p6: {
    banner: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=1200&q=85",
    tag: "Heritage Romantic Comedy",
  },
  p7: {
    banner: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85",
    tag: "Political Action Thriller",
  },
  p8: {
    banner: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=85",
    tag: "Investigative Crime Thriller",
  },
};

interface ProductionWorkspaceProps {
  scopedProjectId?: string;
}

export function ProductionManagementWorkspace({ scopedProjectId }: ProductionWorkspaceProps) {
  const allProjects = useProjects();
  const allShootDays = useShootDays();

  const [clapperOpen, setClapperOpen] = useState(false);
  const [selectedClapperProject, setSelectedClapperProject] = useState<{
    id: string;
    title: string;
    director?: string;
  } | null>(null);

  const [searchFilter, setSearchFilter] = useState("");
  const [statusTab, setStatusTab] = useState<"all" | "production" | "pre-production" | "post-production">("all");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>("all");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const displayedProjects = allProjects.filter((p) => {
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
  });

  const handleOpenClapper = (project: Project) => {
    setSelectedClapperProject({
      id: project.id,
      title: project.title,
      director: project.director,
    });
    setClapperOpen(true);
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Hero Studio Floor Operations Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-card via-card to-amber-950/10 p-6 md:p-8 shadow-sm">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/50 border px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur-sm">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                Hyderabad Studio Hub
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 backdrop-blur-sm">
                <Sun className="w-3.5 h-3.5 text-yellow-500" />
                32°C Sunny
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 backdrop-blur-sm">
                <Clock className="w-3.5 h-3.5" />
                {currentTime || "..."}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
              <Clapperboard className="w-9 h-9 text-amber-500 shrink-0" />
              Production Control & Operations
            </h1>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Manage digital slates and call sheets across all studio feature slates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              onClick={() => {
                setSelectedClapperProject(null);
                setClapperOpen(true);
              }}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold shadow-md gap-2"
            >
              <Clapperboard className="w-4 h-4" />
              Digital Slate / Clapper
            </Button>
            <Button variant="outline" asChild className="gap-1.5 border-border/80">
              <Link href="/dashboard/schedule">
                <Calendar className="w-4 h-4 text-primary" />
                Master Schedule
              </Link>
            </Button>
          </div>
        </div>

        </div>

      {/* Global Quick Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border bg-card/60 backdrop-blur-md shadow-sm">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Active Slates</span>
          <span className="text-2xl font-black text-foreground">{allProjects.length}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Total Shoot Days</span>
          <span className="text-2xl font-black text-amber-500">
            {allProjects.reduce((acc, p) => acc + (p.totalShootDays || 60), 0)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Combined Budget</span>
          <span className="text-2xl font-black text-emerald-500">
            {formatINR(allProjects.reduce((acc, p) => acc + (p.budget || 2500000000), 0))}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Crew Deployed</span>
          <span className="text-2xl font-black text-blue-500">
            2,450+
          </span>
        </div>
      </div>

      {/* Active Studio Productions Slate Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              Active Feature Slates & Productions
            </h2>
            <p className="text-xs text-muted-foreground">
              Principal photography tracking, continuity binders, and call sheets by project
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {!scopedProjectId && (
              <select
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                className="h-8 px-3 text-xs font-semibold rounded-lg border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_8px_center]"
              >
                <option value="all">All Projects</option>
                {allProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            )}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search slates..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="h-8 pl-8 pr-3 text-xs rounded-lg border bg-background text-foreground w-40 sm:w-52 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center border rounded-lg overflow-hidden bg-background">
              {(["all", "production", "pre-production", "post-production"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusTab(tab)}
                  className={`px-2.5 py-1 text-xs font-semibold capitalize transition-colors ${
                    statusTab === tab
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "all" ? "All Slates" : tab.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedProjects.map((project) => {
            const artwork = CuratedProjectArtwork[project.id] || {
              banner: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85",
              tag: project.type,
            };
            const projectShootDays = allShootDays.filter((d) => d.projectId === project.id);
            const totalDays = project.totalShootDays || 60;
            const completedDays = project.completedShootDays || projectShootDays.filter((d) => d.status === "completed").length || 18;
            const progressPercent = Math.min(100, Math.round((completedDays / totalDays) * 100));

            return (
              <Card
                key={project.id}
                className="group overflow-hidden border hover:border-primary/50 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  {/* Poster / Backdrop Header */}
                  <div className="h-44 relative overflow-hidden bg-muted">
                    <img
                      src={project.bannerImage || artwork.banner}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center rounded-md bg-black/75 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white border border-white/10">
                        {artwork.tag}
                      </span>
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      <Badge
                        variant="secondary"
                        className={`capitalize font-semibold text-xs border ${
                          project.status === "production"
                            ? "bg-amber-500/20 text-amber-500 border-amber-500/30"
                            : project.status === "post-production"
                            ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                            : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        }`}
                      >
                        {project.status === "production" ? "● Shooting" : project.status}
                      </Badge>
                    </div>

                    <div className="absolute bottom-2.5 left-3 right-3">
                      <h3 className="text-lg font-bold text-white drop-shadow-md truncate">
                        {project.title}
                      </h3>
                      {project.director && (
                        <p className="text-xs text-white/80 font-medium">Dir: {project.director}</p>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3.5 text-xs">
                    {/* Progress */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-muted-foreground font-medium">
                        <span>Principal Photography</span>
                        <span className="text-foreground font-semibold">
                          Day {completedDays} / {totalDays} ({progressPercent}%)
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>

                    {/* Metadata items */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1 border-t">
                      <div>
                        <span className="text-foreground font-medium">Production House:</span>
                        <p className="truncate">{project.productionHouse || "Mythri / Geetha Arts"}</p>
                      </div>
                      <div>
                        <span className="text-foreground font-medium">Budget:</span>
                        <p className="font-semibold text-foreground">
                          {formatINR(project.budget || 2500000000)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Key Talent Avatars */}
                    <div className="pt-2 border-t mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Key Talent & Crew</span>
                        <div className="flex -space-x-1.5">
                          {[1, 2, 3, 4].map((i) => {
                            const seed = (project.id.charCodeAt(0) || 0) + i * 15;
                            return (
                              <Avatar key={i} className="w-5 h-5 border-2 border-background">
                                <AvatarImage src={`https://i.pravatar.cc/100?img=${seed % 70}`} />
                                <AvatarFallback className="text-[8px]">T{i}</AvatarFallback>
                              </Avatar>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>

                {/* Card Action Footer */}
                <div className="p-3 pt-0 border-t flex flex-wrap items-center justify-between gap-2 bg-muted/10">
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                      onClick={() => handleOpenClapper(project)}
                    >
                      <Clapperboard className="w-3 h-3" />
                      Slate
                    </Button>
                    <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                      <Link href={`/dashboard/projects/${project.id}/call-sheets`}>
                        Call Sheets
                      </Link>
                    </Button>
                  </div>

                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
        {/* Static Camera Units */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-foreground">Studio Camera Units</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((unit) => (
              <div key={unit} className="rounded-xl border bg-card overflow-hidden shadow-sm">
                <div className="aspect-video bg-muted relative flex items-center justify-center">
                  <Camera className="w-8 h-8 text-muted-foreground/30" />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    REC
                  </div>
                </div>
                <div className="p-3 bg-card border-t flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold">Unit {String.fromCharCode(64 + unit)} (Main)</p>
                    <p className="text-[10px] text-muted-foreground">ARRI Alexa Mini LF</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">Online</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Static Recent DPRs */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-foreground">Recent DPR Submissions</h2>
          </div>
          <div className="rounded-xl border bg-card shadow-sm p-4 space-y-4">
            {[1, 2, 3].map((dpr) => (
              <div key={dpr} className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0">
                <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">Day {142 - dpr} Report</p>
                  <p className="text-[10px] text-muted-foreground truncate">Submitted by 1st AD</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>
            ))}
            <Button variant="outline" className="w-full text-xs h-8">View All Reports</Button>
          </div>
        </div>
      </div>

      {/* Digital Clapperboard Modal */}
      <DigitalClapperboardModal
        open={clapperOpen}
        onOpenChange={setClapperOpen}
        defaultProjectId={selectedClapperProject?.id || "p1"}
        defaultProjectTitle={selectedClapperProject?.title || "Pushpa 2: The Rule"}
        defaultDirector={selectedClapperProject?.director || "Sukumar"}
      />
    </div>
  );
}
