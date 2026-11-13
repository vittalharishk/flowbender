"use client";

import { useParams } from "next/navigation";
import { useShootDay } from "@/lib/schedule-store";
import { ShootDayDetail } from "@/components/schedule/shoot-day-detail";

export default function GlobalShootDayDetailPage() {
  const params = useParams();
  const day = useShootDay(params.dayId as string);

  if (!day) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <h3 className="font-semibold text-lg mb-1">Shoot day not found</h3>
        <p className="text-sm text-muted-foreground">This shoot day may have been removed or the link is incorrect.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <ShootDayDetail day={day} backHref="/dashboard/schedule" backLabel="All Schedule" onUpdate={() => undefined} />
    </div>
  );
}
