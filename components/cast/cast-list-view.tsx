"use client";

import { useState, useMemo } from "react";
import { formatINR } from "@/lib/utils";
import { Search, LayoutGrid, List, Plus, Users, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">Seeded cast assignments, contact details, contracts and fees are demo planning data, not casting confirmations. All amounts are INR.</p>
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Cast</p>
          <p className="text-xl font-bold mt-0.5">{stats.total}</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Contracts Signed</p>
          <p className="text-xl font-bold mt-0.5 text-emerald-400">{stats.signed}</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Pending / Negotiating</p>
          <p className="text-xl font-bold mt-0.5 text-amber-400">{stats.pending}</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Fees</p>
          <p className="text-xl font-bold mt-0.5">{fmtShort(stats.totalFee)}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            aria-label="Search cast"
            placeholder="Search by name, character, or project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/40"
          />
        </div>
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
              <SelectTrigger className="w-[150px] h-9 text-xs">
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
              <SelectTrigger className="w-[140px] h-9 text-xs">
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
              <SelectTrigger className="w-[150px] h-9 text-xs">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(sortLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center border rounded-md overflow-hidden">
            <button
              aria-label="Grid view" aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
              className={`p-2 ${view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              aria-label="List view" aria-pressed={view === "list"}
              onClick={() => setView("list")}
              className={`p-2 ${view === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white gap-1.5"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="w-4 h-4" />
            Add Cast
          </Button>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">No cast members found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {search || categoryFilter !== "all" || contractFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Add your first cast member to get started."}
          </p>
          {(search || categoryFilter !== "all" || contractFilter !== "all") && (
            <Button size="sm" variant="outline" onClick={() => { setSearch(""); setCategoryFilter("all"); setContractFilter("all"); }}>Clear search and filters</Button>
          )}
          {!search && categoryFilter === "all" && contractFilter === "all" && (
            <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Cast Member
            </Button>
          )}
        </div>
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
