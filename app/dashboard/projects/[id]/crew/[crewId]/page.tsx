"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useCrewMember } from "@/lib/crew-store";
import { CrewProfile } from "@/components/crew/crew-profile";

export default function ProjectCrewProfilePage() {
  const params = useParams();
  const member = useCrewMember(params.crewId as string);

  if (!member || member.projectId !== params.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <h3 className="font-semibold text-lg mb-1">Crew member not found</h3>
        <p className="text-sm text-muted-foreground">This person may have been removed or the link is incorrect.</p>
        <Link href={`/dashboard/projects/${params.id}/crew`} className="mt-4 text-primary underline">Back to Project Crew</Link>
      </div>
    );
  }

  return (
    <CrewProfile
      member={member}
      backHref={`/dashboard/projects/${params.id}/crew`}
      backLabel="Back to Crew"
      onUpdate={() => undefined}
    />
  );
}
