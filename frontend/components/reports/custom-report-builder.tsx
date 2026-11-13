"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects } from "@/lib/project-store";
import { useProjectBudgets, useDepartmentBudgets } from "@/lib/accounts-store";
import { useDistributionRevenue } from "@/lib/distribution-store";
import { useProductionExpenses } from "@/lib/expense-store";
import { useSavedReportConfigs, addReportConfig, deleteReportConfig, type SavedReportConfig } from "@/lib/report-store";
import { Download, Save, Trash2, FileText } from "lucide-react";

type ReportType = "financial" | "production" | "crew" | "distribution";

const COLUMN_OPTIONS: Record<ReportType, { key: string; label: string }[]> = {
  financial: [
    { key: "project", label: "Project" },
    { key: "budget", label: "Budget" },
    { key: "spent", label: "Spent" },
    { key: "variance", label: "Variance" },
    { key: "utilization", label: "Utilization %" },
    { key: "revenue", label: "Revenue" },
    { key: "profit", label: "Profit/Loss" },
  ],
  production: [
    { key: "project", label: "Project" },
    { key: "status", label: "Status" },
    { key: "totalScenes", label: "Total Scenes" },
    { key: "scenesShot", label: "Scenes Shot" },
    { key: "progress", label: "Progress %" },
    { key: "startDate", label: "Start Date" },
    { key: "endDate", label: "End Date" },
  ],
  crew: [
    { key: "project", label: "Project" },
    { key: "director", label: "Director" },
    { key: "producer", label: "Producer" },
    { key: "productionHouse", label: "Production House" },
    { key: "status", label: "Status" },
    { key: "language", label: "Language" },
  ],
  distribution: [
    { key: "project", label: "Project" },
    { key: "revenueType", label: "Revenue Type" },
    { key: "territory", label: "Territory" },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status" },
    { key: "receivedDate", label: "Received Date" },
  ],
};

function formatCurrency(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function CustomReportBuilder() {
  const projects = useProjects();
  const budgets = useProjectBudgets();
  const revenue = useDistributionRevenue();
  const expenses = useProductionExpenses();
  const savedConfigs = useSavedReportConfigs();

  const [reportType, setReportType] = useState<ReportType>("financial");
  const [selectedProjects, setSelectedProjects] = useState<string[]>(["all"]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>(COLUMN_OPTIONS.financial.map((c) => c.key));
  const [reportName, setReportName] = useState("");

  const toggleProject = useCallback((pid: string) => {
    setSelectedProjects((prev) => {
      if (pid === "all") return ["all"];
      const without = prev.filter((p) => p !== "all");
      return without.includes(pid) ? without.filter((p) => p !== pid) : [...without, pid];
    });
  }, []);

  const toggleColumn = useCallback((col: string) => {
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  }, []);

  const handleTypeChange = useCallback((type: ReportType) => {
    setReportType(type);
    setSelectedColumns(COLUMN_OPTIONS[type].map((c) => c.key));
  }, []);

  const filteredProjects = useMemo(() => {
    if (selectedProjects.includes("all")) return projects;
    return projects.filter((p) => selectedProjects.includes(p.id));
  }, [projects, selectedProjects]);

  const tableData: Record<string, string>[] = useMemo(() => {
    const rows: Record<string, string>[] = [];
    for (const p of filteredProjects) {
      const projRevenue = revenue.filter((r) => r.projectId === p.id);
      const totalRevenue = projRevenue.reduce((s, r) => s + (r.amount || 0), 0);

      if (reportType === "financial") {
        rows.push({
          project: p.title,
          budget: formatCurrency(p.budget || 0),
          spent: formatCurrency(p.spent || 0),
          variance: formatCurrency((p.budget || 0) - (p.spent || 0)),
          utilization: p.budget > 0 ? `${Math.round((p.spent / p.budget) * 100)}%` : "0%",
          revenue: formatCurrency(totalRevenue),
          profit: formatCurrency(totalRevenue - (p.spent || 0)),
        });
      } else if (reportType === "production") {
        rows.push({
          project: p.title,
          status: p.status.replace("-", " "),
          totalScenes: "—",
          scenesShot: "—",
          progress: "—",
          startDate: p.startDate || "—",
          endDate: p.endDate || "—",
        });
      } else if (reportType === "crew") {
        rows.push({
          project: p.title,
          director: p.director || "—",
          producer: p.producer || "—",
          productionHouse: p.productionHouse || "—",
          status: p.status.replace("-", " "),
          language: p.language || "—",
        });
      } else if (reportType === "distribution") {
        if (projRevenue.length === 0) {
          rows.push({
            project: p.title, revenueType: "—", territory: "—",
            amount: "₹0", status: "—", receivedDate: "—",
          });
        } else {
          for (const r of projRevenue) {
            rows.push({
              project: p.title,
              revenueType: r.revenueType || "—",
              territory: r.territory || "—",
              amount: formatCurrency(r.amount || 0),
              status: r.status || "—",
              receivedDate: r.receivedDate || "—",
            });
          }
        }
      }
    }
    return rows;
  }, [filteredProjects, revenue, reportType]);

  const visibleColumns = useMemo(() =>
    COLUMN_OPTIONS[reportType].filter((c) => selectedColumns.includes(c.key)),
    [reportType, selectedColumns]
  );

  const exportCsv = useCallback(() => {
    const header = visibleColumns.map((c) => c.label).join(",");
    const rows = tableData.map((row: Record<string, string>) =>
      visibleColumns.map((c) => `"${(row[c.key] || "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportName || reportType}-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [visibleColumns, tableData, reportName, reportType]);

  const saveConfig = useCallback(() => {
    if (!reportName.trim()) return;
    addReportConfig({
      name: reportName,
      category: reportType,
      projectIds: selectedProjects,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      columns: selectedColumns,
    });
    setReportName("");
  }, [reportName, reportType, selectedProjects, dateFrom, dateTo, selectedColumns]);

  const loadConfig = useCallback((config: SavedReportConfig) => {
    setReportType(config.category);
    setSelectedProjects(config.projectIds);
    setDateFrom(config.dateFrom || "");
    setDateTo(config.dateTo || "");
    setSelectedColumns(config.columns);
    setReportName(config.name);
  }, []);

  return (
    <div className="space-y-4">
      {/* Saved Reports */}
      {savedConfigs.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Saved Reports</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {savedConfigs.map((c) => (
                <div key={c.id} className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => loadConfig(c)}>
                    <FileText className="w-3 h-3 mr-1" />{c.name}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500" onClick={() => deleteReportConfig(c.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Controls */}
        <Card className="border-border/50 lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Report Builder</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Report Type</Label>
              <Select value={reportType} onValueChange={(v) => handleTypeChange(v as ReportType)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="crew">Crew</SelectItem>
                  <SelectItem value="distribution">Distribution</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Projects</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge
                  variant={selectedProjects.includes("all") ? "default" : "outline"}
                  className="cursor-pointer text-[10px]"
                  onClick={() => toggleProject("all")}
                >All</Badge>
                {projects.map((p) => (
                  <Badge
                    key={p.id}
                    variant={selectedProjects.includes(p.id) ? "default" : "outline"}
                    className="cursor-pointer text-[10px]"
                    onClick={() => toggleProject(p.id)}
                  >{p.title.slice(0, 12)}{p.title.length > 12 ? "…" : ""}</Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">From</Label>
                <Input type="date" className="h-8 text-xs" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">To</Label>
                <Input type="date" className="h-8 text-xs" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>

            <div>
              <Label className="text-xs">Columns</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {COLUMN_OPTIONS[reportType].map((col) => (
                  <Badge
                    key={col.key}
                    variant={selectedColumns.includes(col.key) ? "default" : "outline"}
                    className="cursor-pointer text-[10px]"
                    onClick={() => toggleColumn(col.key)}
                  >{col.label}</Badge>
                ))}
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <div className="flex gap-2">
                <Input placeholder="Report name…" className="h-8 text-xs flex-1" value={reportName} onChange={(e) => setReportName(e.target.value)} />
                <Button size="sm" className="h-8" onClick={saveConfig} disabled={!reportName.trim()}>
                  <Save className="w-3 h-3" />
                </Button>
              </div>
              <Button size="sm" className="w-full h-8 text-xs" variant="outline" onClick={exportCsv}>
                <Download className="w-3 h-3 mr-1" /> Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Table */}
        <Card className="border-border/50 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Preview ({tableData.length} rows)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    {visibleColumns.map((col) => (
                      <th key={col.key} className="text-left py-2 px-3 font-medium text-muted-foreground whitespace-nowrap">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.length > 0 ? tableData.map((row: Record<string, string>, i: number) => (
                    <tr key={i} className="border-b border-border/30 hover:bg-muted/20">
                      {visibleColumns.map((col) => (
                        <td key={col.key} className="py-2 px-3 whitespace-nowrap">{row[col.key] || "—"}</td>
                      ))}
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={visibleColumns.length} className="text-center py-8 text-muted-foreground">
                        No data matching the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
