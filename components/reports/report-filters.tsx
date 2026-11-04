"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { useProjects } from "@/lib/project-store";

export interface ReportFilterState {
  projectId: string;
  dateFrom: string;
  dateTo: string;
  department: string;
  status: string;
}

const DEFAULT_FILTERS: ReportFilterState = {
  projectId: "all",
  dateFrom: "",
  dateTo: "",
  department: "all",
  status: "all",
};

export function useReportFilters() {
  const [filters, setFilters] = useState<ReportFilterState>(DEFAULT_FILTERS);
  const projects = useProjects();

  const updateFilter = useCallback(<K extends keyof ReportFilterState>(key: K, value: ReportFilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const hasActiveFilters = filters.projectId !== "all" || filters.dateFrom !== "" || filters.dateTo !== "" || filters.department !== "all" || filters.status !== "all";

  const projectName = filters.projectId === "all" ? "All projects" : projects.find((p) => p.id === filters.projectId)?.title || filters.projectId;

  return { filters, updateFilter, resetFilters, hasActiveFilters, projects, projectName };
}

export function ReportFilterBar({
  filters,
  updateFilter,
  resetFilters,
  hasActiveFilters,
  projects,
  showDepartment = true,
  showStatus = true,
  departments,
  statuses,
}: {
  filters: ReportFilterState;
  updateFilter: <K extends keyof ReportFilterState>(key: K, value: ReportFilterState[K]) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  projects: Array<{ id: string; title: string }>;
  showDepartment?: boolean;
  showStatus?: boolean;
  departments?: Array<{ key: string; display: string }>;
  statuses?: Array<{ key: string; display: string }>;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[180px]">
            <Label className="text-xs">Project</Label>
            <Select value={filters.projectId} onValueChange={(v) => updateFilter("projectId", v)}>
              <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[140px]">
            <Label className="text-xs">Date from</Label>
            <Input type="date" className="mt-1 h-9" value={filters.dateFrom} onChange={(e) => {
              const v = e.target.value;
              if (filters.dateTo && v > filters.dateTo) return;
              updateFilter("dateFrom", v);
            }} />
          </div>
          <div className="min-w-[140px]">
            <Label className="text-xs">Date to</Label>
            <Input type="date" className="mt-1 h-9" value={filters.dateTo} onChange={(e) => {
              const v = e.target.value;
              if (filters.dateFrom && v < filters.dateFrom) return;
              updateFilter("dateTo", v);
            }} />
          </div>
          {showDepartment && (
            <div className="min-w-[160px]">
              <Label className="text-xs">Department</Label>
              <Select value={filters.department} onValueChange={(v) => updateFilter("department", v)}>
                <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {(departments || []).map((d) => <SelectItem key={d.key} value={d.key}>{d.display}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {showStatus && (
            <div className="min-w-[140px]">
              <Label className="text-xs">Status</Label>
              <Select value={filters.status} onValueChange={(v) => updateFilter("status", v)}>
                <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {(statuses || []).map((s) => <SelectItem key={s.key} value={s.key}>{s.display}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={resetFilters}>
              <X className="w-3 h-3" /> Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
