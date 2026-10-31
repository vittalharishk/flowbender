"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useProject } from "@/lib/project-store";
import { useCastByProject } from "@/lib/cast-store";
import { CastListView } from "@/components/cast/cast-list-view";
import { RolesProbableTab } from "@/components/cast/roles-probable-tab";
import { CastingDashboardTab } from "@/components/cast/casting-dashboard-tab";
import { ContractsTab } from "@/components/cast/contracts-tab";
import { AvailabilityTab } from "@/components/cast/availability-tab";

const TABS = [
  { id: "members", label: "Cast Members" },
  { id: "roles", label: "Roles & Probable" },
  { id: "casting", label: "Casting" },
  { id: "contracts", label: "Contracts" },
  { id: "availability", label: "Availability" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default function ProjectCastPage() {
  const params = useParams();
  const project = useProject(params.id as string);
  const members = useCastByProject(params.id as string);
  const [tab, setTab] = useState<Tab>("members");

  if (!project) return null;

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? "border-amber-500 text-amber-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "members" && (
        <CastListView
          members={members}
          projectScope
          projectId={project.id}
          projectTitle={project.title}
          onCastAdded={() => undefined}
        />
      )}
      {tab === "roles" && <RolesProbableTab projectId={project.id} />}
      {tab === "casting" && <CastingDashboardTab projectId={project.id} />}
      {tab === "contracts" && <ContractsTab projectId={project.id} />}
      {tab === "availability" && <AvailabilityTab projectId={project.id} />}
    </div>
  );
}
