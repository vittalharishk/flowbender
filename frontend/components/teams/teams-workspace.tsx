"use client";

import { useMemo } from "react";
import { Users, Building2, UserCheck, ListTodo } from "lucide-react";
import { useDepartments, useTeamMembers } from "@/lib/teams-store";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";

export function TeamsWorkspace() {
  const departments = useDepartments();
  const members = useTeamMembers();

  const stats = useMemo(() => {
    const totalDepartments = departments.length;
    const totalMembers = members.length;
    const activeMembers = members.filter((m) => m.status === "active").length;
    return { totalDepartments, totalMembers, activeMembers };
  }, [departments, members]);

  const deptRows = useMemo(() => {
    return departments.map((d) => ({
      ...d,
      memberCount: members.filter((m) => m.departmentId === d.id).length,
      head: members.find((m) => m.departmentId === d.id && m.designation && (m.designation.includes("Director") || m.designation.includes("Producer") || m.designation.includes("DOP") || m.designation.includes("Supervisor") || m.designation.includes("Chief") || m.designation.includes("Head") || m.designation.includes("Editor")))?.name || "—",
    }));
  }, [departments, members]);

  type DeptRow = (typeof deptRows)[number];
  const deptColumns: DataTableColumn<DeptRow>[] = [
    { key: "name", header: "Department", cell: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name },
    { key: "code", header: "Code", cell: (r) => <span className="font-mono text-muted-foreground">{r.code}</span>, sortValue: (r) => r.code },
    { key: "head", header: "Head", cell: (r) => r.head, sortValue: (r) => r.head },
    { key: "members", header: "Members", cell: (r) => String(r.memberCount), sortValue: (r) => r.memberCount, align: "right" as const },
    { key: "active", header: "Status", cell: (r) => <StatusBadge status={r.isActive ? "active" : "inactive"} />, sortValue: (r) => r.isActive ? "active" : "inactive" },
  ];

  const memberRows = useMemo(() => {
    return members.map((m) => ({
      ...m,
      departmentName: departments.find((d) => d.id === m.departmentId)?.name || "—",
    }));
  }, [members, departments]);

  type MemberRow = (typeof memberRows)[number];
  const memberColumns: DataTableColumn<MemberRow>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name },
    { key: "role", header: "Role", cell: (r) => r.designation || "—", sortValue: (r) => r.designation || "" },
    { key: "dept", header: "Department", cell: (r) => r.departmentName, sortValue: (r) => r.departmentName },
    { key: "email", header: "Email", cell: (r) => <span className="text-muted-foreground">{r.email || "—"}</span>, sortValue: (r) => r.email || "" },
    { key: "availability", header: "Availability", cell: (r) => <StatusBadge status={r.availability} />, sortValue: (r) => r.availability },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        as="h1"
        title="Teams"
        description="Manage departments and team members."
        icon={Users}
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Departments" value={String(stats.totalDepartments)} icon={Building2} />
        <StatCard label="Total Members" value={String(stats.totalMembers)} icon={ListTodo} />
        <StatCard label="Active Members" value={String(stats.activeMembers)} icon={UserCheck} />
      </div>

      <Tabs defaultValue="departments">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="members">Team Members</TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="mt-4">
          {deptRows.length === 0 ? (
            <EmptyState title="No departments" description="No departments found." icon={Building2} />
          ) : (
            <Card>
              <CardContent className="pt-4">
                <DataTable columns={deptColumns} rows={deptRows} rowKey={(r) => r.id} caption="Departments" />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          {memberRows.length === 0 ? (
            <EmptyState title="No team members" description="No team members found." icon={Users} />
          ) : (
            <Card>
              <CardContent className="pt-4">
                <DataTable columns={memberColumns} rows={memberRows} rowKey={(r) => r.id} caption="Team members" />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
