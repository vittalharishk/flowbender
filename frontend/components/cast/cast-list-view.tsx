"use client";

import { useState, useMemo } from "react";
import { formatINR } from "@/lib/utils";
import { LayoutGrid, List, Plus, Users, SlidersHorizontal, FileSignature, Clock, IndianRupee } from "lucide-react";
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
import type { CastMember, CastCategory, ContractStatus } from "@/lib/types";
import { castCategoryLabels } from "@/lib/cast-store";
import { CastCard } from "./cast-card";
import { CastListRow } from "./cast-list-row";
import { AddCastDialog } from "./add-cast-dialog";

interface CastListViewProps {
  members: CastMember[];
  projectScope?: boolean;
  projectId?: string;
  projectTitle?: string;
  onCastAdded?: () => void;
}

type SortOption = "name" | "category" | "fee-desc" | "fee-asc" | "recent";

const sortLabels: Record<SortOption, string> = {
  name: "Name A-Z",
  category: "Category",
  "fee-desc": "Fee: High to Low",
  "fee-asc": "Fee: Low to High",
  recent: "Recently Added",
};

const categoryOrder: CastCategory[] = [
  "lead", "supporting", "character-artist", "guest", "child-artist", "special-appearance",
];

export function CastListView({
  members,
  projectScope,
  projectId,
  projectTitle,
  onCastAdded,
}: CastListViewProps) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [contractFilter, setContractFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortOption>("category");
  const [showAdd, setShowAdd] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let results = members;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      results = results.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.character.toLowerCase().includes(q) ||
          m.projectTitle.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all") {
      results = results.filter((m) => m.category === categoryFilter);
    }
    if (contractFilter !== "all") {
      results = results.filter((m) => m.contractStatus === contractFilter);
    }

    results = [...results].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "category":
          return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
        case "fee-desc":
          return b.totalFee - a.totalFee;
        case "fee-asc":
          return a.totalFee - b.totalFee;
        case "recent":
          return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
        default:
          return 0;
      }
    });
    return results;
  }, [members, search, categoryFilter, contractFilter, sort]);

  const stats = useMemo(() => {
    const signed = members.filter((m) => m.contractStatus === "signed").length;
    const pending = members.filter((m) => m.contractStatus === "pending" || m.contractStatus === "negotiating").length;
    const totalFee = members.reduce((s, m) => s + m.totalFee, 0);
    const paidFee = members.reduce((s, m) => s + m.paidAmount, 0);
    return { total: members.length, signed, pending, totalFee, paidFee };
  }, [members]);

  function fmtShort(v: number) {
    return formatINR(v);
  }

  const hasActiveFilters = Boolean(search) || categoryFilter !== "all" || contractFilter !== "all";

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">Seeded cast assignments, contact details, contracts and fees are demo planning data, not casting confirmations. All amounts are INR.</p>
      {/* Summary bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Cast" value={stats.total} icon={Users} compact />
        <StatCard label="Contracts Signed" value={stats.signed} icon={FileSignature} compact />
        <StatCard label="Pending / Negotiating" value={stats.pending} icon={Clock} compact />
        <StatCard label="Total Fees" value={fmtShort(stats.totalFee)} icon={IndianRupee} compact hint={`${fmtShort(stats.paidFee)} paid`} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput
          label="Search cast"
          placeholder="Search by name, character, or project..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          wrapperClassName="flex-1"
          className="h-10"
        />
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 sm:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </Button>
          <div className={`${showFilters ? "flex" : "hidden"} sm:flex gap-2 flex-wrap`}>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger aria-label="Filter by category" className="h-9 w-[150px] text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(castCategoryLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={contractFilter} onValueChange={setContractFilter}>
              <SelectTrigger aria-label="Filter by contract status" className="h-9 w-[140px] text-xs">
                <SelectValue placeholder="Contract" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contracts</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger aria-label="Sort cast" className="h-9 w-[150px] text-xs">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(sortLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center overflow-hidden rounded-md border" role="group" aria-label="View mode">
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
              className={`p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 ${view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              className={`border-l p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 ${view === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <Button variant="primary"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="w-4 h-4" />
            Add Cast
          </Button>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No cast members found"
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters."
              : "Add your first cast member to get started."
          }
          action={
            hasActiveFilters ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("all");
                  setContractFilter("all");
                }}
              >
                Clear search and filters
              </Button>
            ) : (
              <Button size="sm" variant="primary" className="gap-1.5" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Add Cast Member
              </Button>
            )
          }
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((m) => (
            <CastCard key={m.id} member={m} projectScope={projectScope} />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((m) => (
            <CastListRow key={m.id} member={m} projectScope={projectScope} />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center pt-2">
        Showing {filtered.length} of {members.length} cast member{members.length !== 1 ? "s" : ""}
      </p>

      <AddCastDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        projectId={projectId}
        projectTitle={projectTitle}
        onCreated={() => {
          setShowAdd(false);
          setSearch(""); setCategoryFilter("all"); setContractFilter("all"); setSort("recent");
          onCastAdded?.();
        }}
      />
    </div>
  );
}
