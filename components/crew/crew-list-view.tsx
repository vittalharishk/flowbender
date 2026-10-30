"use client";

import { useState, useMemo } from "react";
import { formatINR } from "@/lib/utils";
import { Search, LayoutGrid, List, Plus, UserCog, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">Seeded crew assignments, contact details, contracts and rates are demo planning data, not confirmed employment records. All amounts are INR.</p>
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Crew</p>
          <p className="text-xl font-bold mt-0.5">{stats.total}</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">On Set</p>
          <p className="text-xl font-bold mt-0.5 text-amber-400">{stats.onSet}</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Departments</p>
          <p className="text-xl font-bold mt-0.5">{stats.depts}</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Avg. Day Rate</p>
          <p className="text-xl font-bold mt-0.5">{fmtShort(stats.total > 0 ? Math.round(stats.totalRate / stats.total) : 0)}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            aria-label="Search crew"
            placeholder="Search by name, role, department, or project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5 sm:hidden" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          </Button>
          <div className={`${showFilters ? "flex" : "hidden"} sm:flex gap-2 flex-wrap`}>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {Object.entries(crewDepartmentLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={availFilter} onValueChange={setAvailFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Availability" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(availabilityLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={contractFilter} onValueChange={setContractFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Contract" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contracts</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                {Object.entries(sortLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center border rounded-md overflow-hidden">
            <button aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")} className={`p-2 ${view === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white gap-1.5" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" /> Add Crew
          </Button>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <UserCog className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">No crew members found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {search || deptFilter !== "all" || contractFilter !== "all" || availFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Add your first crew member to get started."}
          </p>
          {(search || deptFilter !== "all" || contractFilter !== "all" || availFilter !== "all") && (
            <Button size="sm" variant="outline" onClick={() => { setSearch(""); setDeptFilter("all"); setContractFilter("all"); setAvailFilter("all"); }}>Clear search and filters</Button>
          )}
          {!search && deptFilter === "all" && contractFilter === "all" && availFilter === "all" && (
            <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Crew Member
            </Button>
          )}
        </div>
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
