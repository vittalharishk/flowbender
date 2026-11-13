"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { UserX } from "lucide-react";
import { useCrewMember } from "@/lib/crew-store";
import { CrewProfile } from "@/components/crew/crew-profile";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";

export default function GlobalCrewProfilePage() {
  const params = useParams();
  const member = useCrewMember(params.crewId as string);

  if (!member) {
    return (
      <EmptyState
        icon={UserX}
        title="Crew member not found"
        description="This person may have been removed or the link is incorrect."
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard/crew">Back to Crew</Link>
          </Button>
        }
      />
    );
  }

  return <CrewProfile member={member} backHref="/dashboard/crew" backLabel="All Crew" />;
}
