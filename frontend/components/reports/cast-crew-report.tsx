"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCastMembers } from "@/lib/cast-store";
import { useCastContracts } from "@/lib/casting-store";
import { useCrewMembers, useRemunerationAgreements } from "@/lib/crew-store";
import { useAttendanceRecords } from "@/lib/attendance-store";
import { useProjects } from "@/lib/project-store";
import { exportToCsv, formatFilterContext } from "@/lib/report-export";
import { formatCrore, pct, filterByProject, groupBy } from "@/lib/report-utils";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { ChartContainer, seriesColors } from "@/components/app/chart-container";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import type { ReportFilterState } from "./report-filters";

interface Props {
  projectId?: string;
  filters: ReportFilterState;
  projectName: string;
}

export function CastCrewReport({ projectId, filters, projectName }: Props) {
  const allCast = useCastMembers();
  const allContracts = useCastContracts();
  const crew = useCrewMembers(projectId);
  const agreements = useRemunerationAgreements(projectId);
  const attendance = useAttendanceRecords();
  const projects = useProjects();

  const cast = useMemo(() => {
    if (!projectId || projectId === "all") return allCast;
    return allCast.filter((c) => c.projectId === projectId);
  }, [allCast, projectId]);

  const contracts = useMemo(() => {
    if (!projectId || projectId === "all") return allContracts;
    return allContracts.filter((c) => c.projectId === projectId);
  }, [allContracts, projectId]);

  const castWithContracts = useMemo(() => {
    return cast.map((c) => {
      const contract = contracts.find((ct) => ct.castId === c.id);
      return {
        id: c.id,
        name: c.name,
        character: c.character,
        projectId: c.projectId,
        projectTitle: c.projectTitle,
        category: c.category,
        contractAmount: contract?.amount ?? 0,
        contractStage: contract?.contractStage ?? "none",
        contractRef: contract?.contractRef ?? "—",
      };
    });
  }, [cast, contracts]);

  const crewDeptDistribution = useMemo(() => {
    const depts = groupBy(crew, (c) => c.department || "Unknown");
    return Object.entries(depts).map(([dept, members]) => ({
      name: dept,
      value: members.length,
    })).sort((a, b) => b.value - a.value);
  }, [crew]);

  const attendanceRate = useMemo(() => {
    const relevant = projectId ? attendance.filter((a) => a.projectId === projectId) : attendance;
    if (relevant.length === 0) return 0;
    const present = relevant.filter((a) => a.status === "present" || a.status === "half-day").length;
    return pct(present, relevant.length);
  }, [attendance, projectId]);

  const activeContracts = contracts.filter((c) => c.contractStage === "signed" || c.contractStage === "approved").length;

  const handleCastExport = () => {
    exportToCsv(castWithContracts, [
      { header: "Name", accessor: (r) => r.name },
      { header: "Character", accessor: (r) => r.character },
      { header: "Project", accessor: (r) => r.projectTitle },
      { header: "Category", accessor: (r) => r.category },
      { header: "Contract Amount", accessor: (r) => r.contractAmount },
      { header: "Contract Stage", accessor: (r) => r.contractStage },
      { header: "Contract Ref", accessor: (r) => r.contractRef },
    ], {
      filename: "cast-report",
      title: "Cast Report",
      filters: formatFilterContext({ projectId, projectName }),
    });
  };

  const handleCrewExport = () => {
    exportToCsv(crew, [
      { header: "Name", accessor: (r) => r.name },
      { header: "Department", accessor: (r) => r.department },
      { header: "Role", accessor: (r) => r.role },
      { header: "Project", accessor: (r) => r.projectTitle },
      { header: "Contract Status", accessor: (r) => r.contractStatus },
      { header: "Day Rate", accessor: (r) => r.dayRate },
      { header: "Total Days", accessor: (r) => r.totalDays },
      { header: "Days Worked", accessor: (r) => r.daysWorked },
      { header: "Availability", accessor: (r) => r.availability },
    ], {
      filename: "crew-report",
      title: "Crew Report",
      filters: formatFilterContext({ projectId, projectName }),
    });
  };

  if (cast.length === 0 && crew.length === 0) {
    return <EmptyState title="No cast or crew data" description="No cast or crew data available for the selected filters." />;
  }

  type CastRow = (typeof castWithContracts)[number];
  type CrewRow = (typeof crew)[number];

  const castColumns = useMemo((): DataTableColumn<CastRow>[] => [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name },
    { key: "character", header: "Character", cell: (r) => <span className="text-muted-foreground">{r.character}</span> },
    { key: "contractAmt", header: "Contract Amt", cell: (r) => r.contractAmount > 0 ? formatCrore(r.contractAmount) : "—", align: "right", sortValue: (r) => r.contractAmount },
    { key: "stage", header: "Stage", cell: (r) => <StatusBadge status={r.contractStage} /> },
  ], []);

  const crewColumns = useMemo((): DataTableColumn<CrewRow>[] => [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name },
    { key: "dept", header: "Department", cell: (r) => r.department, sortValue: (r) => r.department },
    { key: "role", header: "Role", cell: (r) => <span className="text-muted-foreground">{r.role}</span> },
    { key: "contract", header: "Contract", cell: (r) => <StatusBadge status={r.contractStatus} /> },
    { key: "availability", header: "Availability", cell: (r) => <StatusBadge status={r.availability} /> },
    { key: "daysWorked", header: "Days Worked", cell: (r) => `${r.daysWorked}/${r.totalDays}`, align: "right" },
  ], []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Generated at {new Date().toLocaleString()}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCastExport}><Download className="w-3.5 h-3.5" /> Cast CSV</Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCrewExport}><Download className="w-3.5 h-3.5" /> Crew CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Cast" value={String(cast.length)} />
        <StatCard label="Total Crew" value={String(crew.length)} />
        <StatCard label="Active Contracts" value={String(activeContracts)} />
        <StatCard label="Attendance Rate" value={`${attendanceRate}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold mb-2">Cast ({cast.length})</h3>
          <DataTable columns={castColumns} rows={castWithContracts} rowKey={(r) => r.id} caption="Cast members" />
        </div>

        <Card>
          <CardHeader><CardTitle className="text-sm">Crew by Department</CardTitle></CardHeader>
          <CardContent>
            {crewDeptDistribution.length > 0 ? (
              <ChartContainer label="Crew by department pie chart" height={300}>
                <PieChart>
                  <Pie data={crewDeptDistribution} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {crewDeptDistribution.map((_, i) => <Cell key={i} fill={seriesColors[i % seriesColors.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No crew data.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <h3 className="text-sm font-semibold">Crew ({crew.length})</h3>
      <DataTable columns={crewColumns} rows={crew} rowKey={(r) => r.id} caption="Crew members" />
    </div>
  );
}
