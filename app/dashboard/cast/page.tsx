"use client";

import { useCastMembers } from "@/lib/cast-store";
import { CastListView } from "@/components/cast/cast-list-view";

export default function GlobalCastPage() {
  const members = useCastMembers();

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Cast</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All cast members across every production
        </p>
      </div>
      <CastListView members={members} onCastAdded={() => undefined} />
    </div>
  );
}
