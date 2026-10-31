"use client";

import { useState } from "react";
import { useCastMembers } from "@/lib/cast-store";
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

export default function GlobalCastPage() {
  const members = useCastMembers();
  const [tab, setTab] = useState<Tab>("members");

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Cast</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All cast members and casting pipeline across every production
        </p>
      </div>

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
        <CastListView members={members} onCastAdded={() => undefined} />
      )}
      {tab === "roles" && <RolesProbableTab />}
      {tab === "casting" && <CastingDashboardTab />}
      {tab === "contracts" && <ContractsTab />}
      {tab === "availability" && <AvailabilityTab />}
    </div>
  );
}
