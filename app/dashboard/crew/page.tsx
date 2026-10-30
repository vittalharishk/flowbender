"use client";

import { useCrewMembers } from "@/lib/crew-store";
import { CrewListView } from "@/components/crew/crew-list-view";

export default function GlobalCrewPage() {
  const members = useCrewMembers();

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Crew</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All crew members across every production
        </p>
      </div>
      <CrewListView members={members} onCrewAdded={() => undefined} />
    </div>
  );
}
