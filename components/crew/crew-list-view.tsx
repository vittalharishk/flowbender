"use client";

import { useState, useMemo } from "react";
import { formatINR } from "@/lib/utils";
import { LayoutGrid, List, Plus, UserCog, SlidersHorizontal, Users, Building2, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/app/stat-card";
import { SearchInput } from "@/components/app/search-input";
import { EmptyState } from "@/components/app/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CrewMember, CrewDepartment } from "@/lib/types";
import { crewDepartmentLabels, availabilityLabels } from "@/lib/crew-store";
import { CrewCard } from "./crew-card";
import { CrewListRow } from "./crew-list-row";
import { AddCrewDialog } from "./add-crew-dialog";

interface Props {
  members: CrewMember[];
  projectScope?: boolean;
  projectId?: string;
  projectTitle?: string;
  onCrewAdded?: () => void;
}

type SortOption = "name" | "department" | "rate-desc" | "rate-asc" | "recent";

const sortLabels: Record<SortOption, string> = {
  name: "Name A-Z",
  department: "Department",
  "rate-desc": "Rate: High to Low",
  "rate-asc": "Rate: Low to High",
  recent: "Recently Added",
};

export function CrewListView({ members, projectScope, projectId, projectTitle, onCrewAdded }: Props) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [contractFilter, setContractFilter] = useState<string>("all");
  const [availFilter, setAvailFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortOption>("department");
  const [showAdd, setShowAdd] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let results = members;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      results = results.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.role.toLowerCase().includes(q) ||
          m.projectTitle.toLowerCase().includes(q) ||
          crewDepartmentLabels[m.department].toLowerCase().includes(q)
      );
    }
    if (deptFilter !== "all") results = results.filter((m) => m.department === deptFilter);
    if (contractFilter !== "all") results = results.filter((m) => m.contractStatus === contractFilter);
    if (availFilter !== "all") results = results.filter((m) => m.availability === availFilter);

    const deptOrder = Object.keys(crewDepartmentLabels) as CrewDepartment[];
    results = [...results].sort((a, b) => {
      switch (sort) {
        case "name": return a.name.localeCompare(b.name);
        case "department": return deptOrder.indexOf(a.department) - deptOrder.indexOf(b.department);
        case "rate-desc": return b.dayRate - a.dayRate;
        case "rate-asc": return a.dayRate - b.dayRate;
        case "recent": return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
        default: return 0;
      }
    });
    return results;
  }, [members, search, deptFilter, contractFilter, availFilter, sort]);

  const stats = useMemo(() => {
    const onSet = members.filter((m) => m.availability === "on-set").length;
    const signed = members.filter((m) => m.contractStatus === "signed").length;
    const totalRate = members.reduce((s, m) => s + m.dayRate, 0);
    const depts = new Set(members.map((m) => m.department)).size;
    return { total: members.length, onSet, signed, totalRate, depts };
  }, [members]);

  function fmtShort(v: number) {
    return formatINR(v);
  }

  const hasActiveFilters =
    Boolean(search) || deptFilter !== "all" || contractFilter !== "all" || availFilter !== "all";

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">Seeded crew assignments, contact details, contracts and rates are demo planning data, not confirmed employment records. All amounts are INR.</p>
      {/* Summary bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Crew" value={stats.total} icon={Users} compact />
        <StatCard label="On Set" value={stats.onSet} icon={UserCog} compact />
        <StatCard label="Departments" value={stats.depts} icon={Building2} compact />
        <StatCard
          label="Avg. Day Rate"
          value={fmtShort(stats.total > 0 ? Math.round(stats.totalRate / stats.total) : 0)}
          icon={IndianRupee}
          compact
          hint={`${stats.signed} signed`}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput
          label="Search crew"
          placeholder="Search by name, role, department, or project..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          wrapperClassName="flex-1"
          className="h-10"
        />
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5 sm:hidden" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          </Button>
          <div className={`${showFilters ? "flex" : "hidden"} sm:flex gap-2 flex-wrap`}>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger aria-label="Filter by department" className="h-9 w-[160px] text-xs"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {Object.entries(crewDepartmentLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={availFilter} onValueChange={setAvailFilter}>
              <SelectTrigger aria-label="Filter by availability" className="h-9 w-[140px] text-xs"><SelectValue placeholder="Availability" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(availabilityLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={contractFilter} onValueChange={setContractFilter}>
              <SelectTrigger aria-label="Filter by contract status" className="h-9 w-[140px] text-xs"><SelectValue placeholder="Contract" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contracts</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger aria-label="Sort crew" className="h-9 w-[150px] text-xs"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                {Object.entries(sortLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center overflow-hidden rounded-md border" role="group" aria-label="View mode">
            <button type="button" aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")} className={`p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 ${view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")} className={`border-l p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 ${view === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <List className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <Button variant="primary" size="sm" className="gap-1.5" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" /> Add Crew
          </Button>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No crew members found"
          description={hasActiveFilters ? "Try adjusting your search or filters." : "Add your first crew member to get started."}
          action={
            hasActiveFilters ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setSearch(""); setDeptFilter("all"); setContractFilter("all"); setAvailFilter("all"); }}
              >
                Clear search and filters
              </Button>
            ) : (
              <Button size="sm" variant="primary" className="gap-1.5" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Add Crew Member
              </Button>
            )
          }
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((m) => (
            <CrewCard key={m.id} member={m} projectScope={projectScope} />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((m) => (
            <CrewListRow key={m.id} member={m} projectScope={projectScope} />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center pt-2">
        Showing {filtered.length} of {members.length} crew member{members.length !== 1 ? "s" : ""}
      </p>

      <AddCrewDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        projectId={projectId}
        projectTitle={projectTitle}
        onCreated={() => { setShowAdd(false); setSearch(""); setDeptFilter("all"); setContractFilter("all"); setAvailFilter("all"); setSort("recent"); onCrewAdded?.(); }}
      />
    </div>
  );
}
