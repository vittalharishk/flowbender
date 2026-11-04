"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCastMembers } from "@/lib/cast-store";
import { useCastContracts } from "@/lib/casting-store";
import { useCrewMembers, useRemunerationAgreements } from "@/lib/crew-store";
import { useAttendanceRecords } from "@/lib/attendance-store";
import { useProjects } from "@/lib/project-store";
import { exportToCsv, formatFilterContext } from "@/lib/report-export";
import { formatCrore, pct, filterByProject, groupBy } from "@/lib/report-utils";
import type { ReportFilterState } from "./report-filters";

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

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
    return <Card><CardContent className="p-8 text-center text-muted-foreground">No cast or crew data available for the selected filters.</CardContent></Card>;
  }

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
        <KPI label="Total Cast" value={String(cast.length)} />
        <KPI label="Total Crew" value={String(crew.length)} tone="text-blue-400" />
        <KPI label="Active Contracts" value={String(activeContracts)} tone="text-emerald-400" />
        <KPI label="Attendance Rate" value={`${attendanceRate}%`} tone="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cast table */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Cast ({cast.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Character</th>
                    <th className="text-right p-3">Contract Amt</th>
                    <th className="text-left p-3">Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {castWithContracts.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3 text-muted-foreground">{c.character}</td>
                      <td className="p-3 text-right">{c.contractAmount > 0 ? formatCrore(c.contractAmount) : "—"}</td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{c.contractStage}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Crew dept pie */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Crew by Department</CardTitle></CardHeader>
          <CardContent>
            {crewDeptDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={crewDeptDistribution} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {crewDeptDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No crew data.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Crew table */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Crew ({crew.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Department</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Contract</th>
                  <th className="text-left p-3">Availability</th>
                  <th className="text-right p-3">Days Worked</th>
                </tr>
              </thead>
              <tbody>
                {crew.slice(0, 100).map((c) => (
                  <tr key={c.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3">{c.department}</td>
                    <td className="p-3 text-muted-foreground">{c.role}</td>
                    <td className="p-3"><Badge variant="outline" className="text-xs">{c.contractStatus}</Badge></td>
                    <td className="p-3"><Badge variant="outline" className={`text-xs ${c.availability === "available" ? "border-emerald-500/30 text-emerald-400" : ""}`}>{c.availability}</Badge></td>
                    <td className="p-3 text-right">{c.daysWorked}/{c.totalDays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {crew.length > 100 && <p className="text-xs text-muted-foreground text-center py-2">Showing first 100 of {crew.length}.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({ label, value, tone = "text-foreground" }: { label: string; value: string; tone?: string }) {
  return <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-lg font-semibold mt-1 ${tone}`}>{value}</p></CardContent></Card>;
}
