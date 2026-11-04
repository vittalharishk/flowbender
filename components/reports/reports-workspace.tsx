"use client";

import { useState } from "react";
import {
  BarChart3,
  Calendar,
  Camera,
  ClipboardList,
  Clock,
  Download,
  Film,
  HardDrive,
  IndianRupee,
  LayoutDashboard,
  Megaphone,
  Palette,
  Shield,
  Users,
  Wand2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportFilterBar, useReportFilters } from "./report-filters";
import { ProjectPerformanceReport } from "./project-performance-report";
import { ProductionProgressReport } from "./production-progress-report";
import { DailyProductionReport } from "./daily-production-report";
import { ScheduleVarianceReport } from "./schedule-variance-report";
import { CastCrewReport } from "./cast-crew-report";
import { EquipmentUtilizationReport } from "./equipment-utilization-report";
import { MediaFootageReport } from "./media-footage-report";
import { VfxProgressReport } from "./vfx-progress-report";
import { BudgetExpenseReport } from "./budget-expense-report";
import { DepartmentSummaryReport } from "./department-summary-report";
import { InsuranceSummaryReport } from "./insurance-summary-report";
import { DistributionReport } from "./distribution-report";

type ReportCategory =
  | "project-performance"
  | "production-progress"
  | "daily-production"
  | "schedule-variance"
  | "cast-crew"
  | "equipment"
  | "media"
  | "vfx"
  | "budget-expense"
  | "department"
  | "insurance"
  | "distribution";

interface CategoryDef {
  key: ReportCategory;
  label: string;
  icon: typeof BarChart3;
  description: string;
}

const CATEGORIES: CategoryDef[] = [
  { key: "project-performance", label: "Project Performance", icon: LayoutDashboard, description: "Budget, progress, and risk indicators per project" },
  { key: "production-progress", label: "Production Progress", icon: Film, description: "Scene completion, shoot days, and schedule status" },
  { key: "daily-production", label: "Daily Production (DPR)", icon: ClipboardList, description: "Shoot-day reports, attendance, and production notes" },
  { key: "schedule-variance", label: "Schedule Variance", icon: Clock, description: "Planned vs actual dates and milestone delays" },
  { key: "cast-crew", label: "Cast & Crew", icon: Users, description: "Assignments, availability, contracts, and attendance" },
  { key: "equipment", label: "Equipment Utilization", icon: Camera, description: "Inventory, allocations, maintenance, and utilization" },
  { key: "media", label: "Media & Footage", icon: HardDrive, description: "Assets, versions, reviews, and storage summaries" },
  { key: "vfx", label: "VFX Progress", icon: Wand2, description: "Shot status, versions, reviews, and overdue tracking" },
  { key: "budget-expense", label: "Budget & Expenses", icon: IndianRupee, description: "Committed, paid, outstanding, and variance analysis" },
  { key: "department", label: "Department Summary", icon: Palette, description: "Department activities, expenses, and budget utilization" },
  { key: "insurance", label: "Insurance Summary", icon: Shield, description: "Policies, coverage, premiums, and claims" },
  { key: "distribution", label: "Distribution", icon: Megaphone, description: "Rights deals, revenue, territories, and collections" },
];

export function ReportsWorkspace() {
  const [activeCategory, setActiveCategory] = useState<ReportCategory>("project-performance");
  const filterState = useReportFilters();

  const activeDef = CATEGORIES.find((c) => c.key === activeCategory)!;
  const ActiveIcon = activeDef.icon;

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold">Reports & Analytics</h2>
              <Badge variant="outline" className="text-xs">{activeDef.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Production, finance, asset, and operational intelligence across all modules.
            </p>
          </div>
        </div>
      </div>

      {/* Category navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = cat.key === activeCategory;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors
                ${isActive
                  ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/60 border border-transparent"
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <ReportFilterBar
        {...filterState}
        showDepartment={["department", "budget-expense", "production-progress"].includes(activeCategory)}
        showStatus={["cast-crew", "equipment", "vfx", "media", "insurance"].includes(activeCategory)}
        statuses={getStatusesForCategory(activeCategory)}
      />

      {/* Report content */}
      <ReportContent category={activeCategory} filters={filterState.filters} projectName={filterState.projectName} />
    </div>
  );
}

function getStatusesForCategory(category: ReportCategory): Array<{ key: string; display: string }> {
  switch (category) {
    case "cast-crew":
      return [
        { key: "confirmed", display: "Confirmed" },
        { key: "tentative", display: "Tentative" },
        { key: "wrapped", display: "Wrapped" },
      ];
    case "equipment":
      return [
        { key: "available", display: "Available" },
        { key: "in-use", display: "In Use" },
        { key: "maintenance", display: "Maintenance" },
      ];
    case "vfx":
      return [
        { key: "briefed", display: "Briefed" },
        { key: "in-progress", display: "In Progress" },
        { key: "client-review", display: "Client Review" },
        { key: "final", display: "Final" },
      ];
    case "media":
      return [
        { key: "registered", display: "Registered" },
        { key: "in-review", display: "In Review" },
        { key: "approved", display: "Approved" },
        { key: "archived", display: "Archived" },
      ];
    case "insurance":
      return [
        { key: "active", display: "Active" },
        { key: "expired", display: "Expired" },
        { key: "pending", display: "Pending" },
      ];
    default:
      return [];
  }
}

function ReportContent({
  category,
  filters,
  projectName,
}: {
  category: ReportCategory;
  filters: import("./report-filters").ReportFilterState;
  projectName: string;
}) {
  const pid = filters.projectId === "all" ? undefined : filters.projectId;

  switch (category) {
    case "project-performance":
      return <ProjectPerformanceReport projectId={pid} filters={filters} projectName={projectName} />;
    case "production-progress":
      return <ProductionProgressReport projectId={pid} filters={filters} projectName={projectName} />;
    case "daily-production":
      return <DailyProductionReport projectId={pid} filters={filters} projectName={projectName} />;
    case "schedule-variance":
      return <ScheduleVarianceReport projectId={pid} filters={filters} projectName={projectName} />;
    case "cast-crew":
      return <CastCrewReport projectId={pid} filters={filters} projectName={projectName} />;
    case "equipment":
      return <EquipmentUtilizationReport projectId={pid} filters={filters} projectName={projectName} />;
    case "media":
      return <MediaFootageReport projectId={pid} filters={filters} projectName={projectName} />;
    case "vfx":
      return <VfxProgressReport projectId={pid} filters={filters} projectName={projectName} />;
    case "budget-expense":
      return <BudgetExpenseReport projectId={pid} filters={filters} projectName={projectName} />;
    case "department":
      return <DepartmentSummaryReport projectId={pid} filters={filters} projectName={projectName} />;
    case "insurance":
      return <InsuranceSummaryReport projectId={pid} filters={filters} projectName={projectName} />;
    case "distribution":
      return <DistributionReport projectId={pid} filters={filters} projectName={projectName} />;
    default:
      return null;
  }
}
