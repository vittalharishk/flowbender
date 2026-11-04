"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDPRReports } from "@/lib/dpr-store";
import { useCallSheets } from "@/lib/call-sheet-store";
import { useAppDataSlice } from "@/lib/app-data-store";
import { useAttendanceRecords } from "@/lib/attendance-store";
import { exportToCsv, formatFilterContext } from "@/lib/report-export";
import { filterByDateRange, pct } from "@/lib/report-utils";
import type { ReportFilterState } from "./report-filters";

interface Props {
  projectId?: string;
  filters: ReportFilterState;
  projectName: string;
}

export function DailyProductionReport({ projectId, filters, projectName }: Props) {
  const dprReports = useDPRReports(projectId);
  const callSheets = useCallSheets();
  const shootDays = useAppDataSlice("shootDays");
  const attendance = useAttendanceRecords();

  const filteredDPRs = useMemo(() => {
    const dateFiltered = filterByDateRange(
      dprReports,
      (d) => d.date,
      { from: filters.dateFrom, to: filters.dateTo }
    );
    return dateFiltered.sort((a, b) => b.date.localeCompare(a.date));
  }, [dprReports, filters.dateFrom, filters.dateTo]);

  const totals = useMemo(() => {
    const totalPlanned = filteredDPRs.reduce((s, d) => s + (d.scenesPlanned || 0), 0);
    const totalCompleted = filteredDPRs.reduce((s, d) => s + (d.scenesCompleted || 0), 0);
    const totalPagesPlanned = filteredDPRs.reduce((s, d) => s + (d.pagesPlanned || 0), 0);
    const totalPagesCompleted = filteredDPRs.reduce((s, d) => s + (d.pagesCompleted || 0), 0);
    return { totalPlanned, totalCompleted, totalPagesPlanned, totalPagesCompleted, count: filteredDPRs.length };
  }, [filteredDPRs]);

  const handleExport = () => {
    exportToCsv(filteredDPRs, [
      { header: "Date", accessor: (d) => d.date },
      { header: "Shoot Day #", accessor: (d) => d.shootDayNumber },
      { header: "Location", accessor: (d) => d.location || "—" },
      { header: "Director", accessor: (d) => d.director || "—" },
      { header: "Call Time", accessor: (d) => d.callTime || "—" },
      { header: "Actual Call", accessor: (d) => d.actualCallTime || "—" },
      { header: "Wrap Time", accessor: (d) => d.wrapTime || "—" },
      { header: "Actual Wrap", accessor: (d) => d.actualWrapTime || "—" },
      { header: "Scenes Planned", accessor: (d) => d.scenesPlanned },
      { header: "Scenes Completed", accessor: (d) => d.scenesCompleted },
      { header: "Pages Planned", accessor: (d) => d.pagesPlanned },
      { header: "Pages Completed", accessor: (d) => d.pagesCompleted },
      { header: "Cast Present", accessor: (d) => d.castPresent },
      { header: "Crew Present", accessor: (d) => d.crewPresent },
      { header: "Issues", accessor: (d) => d.issues || "—" },
      { header: "Status", accessor: (d) => d.status },
    ], {
      filename: "daily-production-report",
      title: "Daily Production Report",
      filters: formatFilterContext({ projectId, projectName, dateFrom: filters.dateFrom, dateTo: filters.dateTo }),
    });
  };

  if (filteredDPRs.length === 0) {
    return (
      <Card><CardContent className="p-8 text-center text-muted-foreground">
        No daily production reports available for the selected filters.
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Generated at {new Date().toLocaleString()}</p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}><Download className="w-3.5 h-3.5" /> CSV</Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="DPR Reports" value={String(totals.count)} />
        <KPI label="Scenes Planned" value={String(totals.totalPlanned)} tone="text-blue-400" />
        <KPI label="Scenes Completed" value={String(totals.totalCompleted)} tone="text-emerald-400" />
        <KPI label="Scene Completion" value={totals.totalPlanned > 0 ? `${pct(totals.totalCompleted, totals.totalPlanned)}%` : "—"} tone="text-amber-400" />
      </div>

      {/* DPR Cards */}
      <div className="space-y-3">
        {filteredDPRs.map((dpr) => (
          <Card key={dpr.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  Day {dpr.shootDayNumber} — {dpr.date}
                </CardTitle>
                <Badge variant="outline" className={`text-xs ${dpr.status === "approved" ? "border-emerald-500/30 text-emerald-400" : dpr.status === "submitted" ? "border-blue-500/30 text-blue-400" : ""}`}>
                  {dpr.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="mt-0.5">{dpr.location || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Director</p>
                  <p className="mt-0.5">{dpr.director || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Call / Wrap</p>
                  <p className="mt-0.5">{dpr.actualCallTime || dpr.callTime || "—"} – {dpr.actualWrapTime || dpr.wrapTime || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                  <p className="mt-0.5">Cast: {dpr.castPresent}, Crew: {dpr.crewPresent}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mt-3">
                <div>
                  <p className="text-xs text-muted-foreground">Scenes Planned</p>
                  <p className="mt-0.5 font-medium">{dpr.scenesPlanned}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Scenes Completed</p>
                  <p className="mt-0.5 font-medium text-emerald-400">{dpr.scenesCompleted}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pages Planned</p>
                  <p className="mt-0.5">{dpr.pagesPlanned}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pages Completed</p>
                  <p className="mt-0.5">{dpr.pagesCompleted}</p>
                </div>
              </div>
              {dpr.issues && (
                <div className="mt-3 text-sm">
                  <p className="text-xs text-muted-foreground">Issues / Notes</p>
                  <p className="mt-0.5 text-amber-400">{dpr.issues}</p>
                </div>
              )}
              {dpr.scenes && dpr.scenes.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1">Scene Breakdown</p>
                  <div className="space-y-1">
                    {dpr.scenes.map((sc, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs py-1 border-b border-border/30 last:border-0">
                        <span className="font-medium w-16">{sc.sceneNumber}</span>
                        <span className="flex-1 truncate text-muted-foreground">{sc.heading}</span>
                        <span>{sc.pagesCompleted}/{sc.pagesPlanned} pg</span>
                        <Badge variant="outline" className="text-[10px]">{sc.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function KPI({ label, value, tone = "text-foreground" }: { label: string; value: string; tone?: string }) {
  return <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-lg font-semibold mt-1 ${tone}`}>{value}</p></CardContent></Card>;
}
