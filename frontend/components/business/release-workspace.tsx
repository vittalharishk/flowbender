"use client";

import { useState, useMemo } from "react";
import { Rocket, FileText, IndianRupee, Calendar, Tv, Music2, MonitorPlay } from "lucide-react";
import { useReleases, useReleaseDashboard } from "@/lib/release-store";
import { useProjects } from "@/lib/project-store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import type { Release } from "@/lib/release-store";

const channelLabels: Record<string, string> = {
  theatrical: "Theatrical",
  ott: "OTT / Digital",
  "satellite-tv": "Television",
  music: "Music Release",
  other: "Other",
};

export function ReleaseWorkspace() {
  const projects = useProjects();
  const [projectId, setProjectId] = useState("all");
  const pid = projectId === "all" ? undefined : projectId;

  const releases = useReleases(pid);
  const dash = useReleaseDashboard(pid);

  const columns: DataTableColumn<Release>[] = [
    { key: "title", header: "Release", cell: (r) => <span className="font-medium">{r.title}</span>, sortValue: (r) => r.title },
    { key: "channel", header: "Channel", cell: (r) => <Badge variant="outline" className="text-xs">{channelLabels[r.channel] ?? r.channel}</Badge>, sortValue: (r) => r.channel },
    { key: "territory", header: "Territory", cell: (r) => <span className="max-w-[180px] truncate block">{r.territory}</span>, sortValue: (r) => r.territory },
    { key: "partner", header: "Partner", cell: (r) => r.partner || "—", sortValue: (r) => r.partner || "" },
    { key: "date", header: "Release Date", cell: (r) => r.releaseDate || "TBD", sortValue: (r) => r.releaseDate || "9999" },
    { key: "screens", header: "Screens", cell: (r) => r.screens ? String(r.screens) : "—", sortValue: (r) => r.screens || 0, align: "right" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
  ];

  function channelReleases(channel: string) {
    return releases.filter((r) => r.channel === channel);
  }

  function renderTable(rows: Release[], emptyLabel: string) {
    if (rows.length === 0) return <EmptyState title={`No ${emptyLabel}`} description={`No ${emptyLabel.toLowerCase()} releases found.`} icon={Rocket} />;
    return (
      <Card>
        <CardContent className="pt-4">
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} caption={`${emptyLabel} releases`} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        as="h1"
        title="Release Management"
        description="Plan and track movie releases across all channels."
        icon={Rocket}
        badge={pid ? <Badge variant="outline" className="text-xs">{projects.find((p) => p.id === pid)?.title}</Badge> : undefined}
        actions={
          <div>
            <Label htmlFor="rel-project-filter" className="sr-only">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="rel-project-filter" aria-label="Filter by project" className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Releases" value={String(dash.total)} icon={FileText} />
        <StatCard label="Planned" value={String(dash.planned)} icon={Calendar} />
        <StatCard label="Confirmed" value={String(dash.confirmed)} icon={Rocket} />
        <StatCard label="Released" value={String(dash.released)} icon={MonitorPlay} />
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="all">All Releases</TabsTrigger>
          <TabsTrigger value="theatrical">Theatrical</TabsTrigger>
          <TabsTrigger value="ott">OTT / Digital</TabsTrigger>
          <TabsTrigger value="tv">Television</TabsTrigger>
          <TabsTrigger value="music">Music Release</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {renderTable(releases, "release")}
        </TabsContent>
        <TabsContent value="theatrical">
          {renderTable(channelReleases("theatrical"), "theatrical")}
        </TabsContent>
        <TabsContent value="ott">
          {renderTable(channelReleases("ott"), "OTT/Digital")}
        </TabsContent>
        <TabsContent value="tv">
          {renderTable(channelReleases("satellite-tv"), "television")}
        </TabsContent>
        <TabsContent value="music">
          {renderTable(channelReleases("music"), "music")}
        </TabsContent>
      </Tabs>
    </div>
  );
}
