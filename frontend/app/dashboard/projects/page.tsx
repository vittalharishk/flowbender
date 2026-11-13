"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Film,
} from "lucide-react";
import { useProjects } from "@/lib/project-store";
import { productionStatusLabels, projectTypeLabels } from "@/lib/mock-data";
import type { ProductionStatus, ProjectType, Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { SearchInput } from "@/components/app/search-input";
import { EmptyState } from "@/components/app/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectGridCard } from "@/components/projects/project-grid-card";
import { ProjectListRow } from "@/components/projects/project-list-row";

type SortKey = "title" | "startDate" | "budget" | "status" | "createdAt";
type ViewMode = "grid" | "list";

const allStatuses: ProductionStatus[] = [
  "development",
  "pre-production",
  "production",
  "post-production",
  "completed",
  "on-hold",
];

const allTypes: ProjectType[] = [
  "feature-film",
  "series",
  "short-film",
  "music-video",
  "documentary",
  "commercial",
];

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "createdAt", label: "Recently Added" },
  { value: "title", label: "Title A–Z" },
  { value: "startDate", label: "Start Date" },
  { value: "budget", label: "Budget" },
  { value: "status", label: "Status" },
];

const statusOrder: Record<ProductionStatus, number> = {
  production: 0,
  "pre-production": 1,
  "post-production": 2,
  development: 3,
  "on-hold": 4,
  completed: 5,
};

function sortProjects(projects: Project[], key: SortKey): Project[] {
  return [...projects].sort((a, b) => {
    switch (key) {
      case "title":
        return a.title.localeCompare(b.title);
      case "startDate":
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      case "budget":
        return b.budget - a.budget;
      case "status":
        return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
      case "createdAt":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });
}

export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("createdAt");
  const [showFilters, setShowFilters] = useState(false);

  const allProjects = useProjects();

  const filtered = useMemo(() => {
    let result = allProjects;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.director.toLowerCase().includes(q) ||
          p.producer.toLowerCase().includes(q) ||
          p.genre.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (typeFilter !== "all") {
      result = result.filter((p) => p.type === typeFilter);
    }

    return sortProjects(result, sortBy);
  }, [allProjects, search, statusFilter, typeFilter, sortBy]);

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) + (typeFilter !== "all" ? 1 : 0);

  return (
    <div className="space-y-6">
      <PageHeader
        as="h1"
        icon={Film}
        title="Projects"
        description={`${allProjects.length} productions · ${allProjects.filter((p) => p.status === "production").length} currently shooting`}
        actions={
          <Button asChild variant="primary" className="gap-2">
            <Link href="/dashboard/projects/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Project
            </Link>
          </Button>
        }
      />

      {/* Search + Controls */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchInput
            label="Search projects"
            placeholder="Search by title, director, producer, or genre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filter toggle */}
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="sm"
            className="h-10 gap-1.5"
            aria-expanded={showFilters}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger aria-label="Sort by" className="w-[170px] h-10">
              <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex h-10 overflow-hidden rounded-lg border" role="group" aria-label="View mode">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-pressed={viewMode === "grid"}
              aria-label="Grid view"
              className={`flex items-center justify-center px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 ${
                viewMode === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              aria-label="List view"
              className={`flex items-center justify-center border-l px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 ${
                viewMode === "list" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter row */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 rounded-lg border bg-card p-4">
          <div className="space-y-1.5">
            <label htmlFor="project-status-filter" className="text-xs font-medium text-foreground">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="project-status-filter" className="h-9 w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {allStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {productionStatusLabels[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="project-type-filter" className="text-xs font-medium text-foreground">Project Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger id="project-type-filter" className="h-9 w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {allTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {projectTypeLabels[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {activeFilterCount > 0 && (
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => {
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Film}
          title="No projects found"
          description={
            search || activeFilterCount > 0
              ? "Try adjusting your search or filters."
              : "Create your first production to get started."
          }
          action={
            search || activeFilterCount > 0 ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
              >
                Clear search and filters
              </Button>
            ) : (
              <Button asChild variant="primary">
                <Link href="/dashboard/projects/new">Create Project</Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          <p className="text-xs text-muted-foreground" role="status">
            Showing {filtered.length} of {allProjects.length} projects
          </p>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => (
                <ProjectGridCard key={p.id} project={p} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((p) => (
                <ProjectListRow key={p.id} project={p} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
