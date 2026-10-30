"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useCrewMember } from "@/lib/crew-store";
import { CrewProfile } from "@/components/crew/crew-profile";

export default function GlobalCrewProfilePage() {
  const params = useParams();
  const member = useCrewMember(params.crewId as string);

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <h3 className="font-semibold text-lg mb-1">Crew member not found</h3>
        <p className="text-sm text-muted-foreground">This person may have been removed or the link is incorrect.</p>
        <Link href="/dashboard/crew" className="mt-4 text-primary underline">Back to Crew</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <CrewProfile member={member} backHref="/dashboard/crew" backLabel="All Crew" onUpdate={() => undefined} />
    </div>
  );
}
