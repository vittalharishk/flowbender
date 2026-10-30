"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useCastMember } from "@/lib/cast-store";
import { CastProfile } from "@/components/cast/cast-profile";

export default function ProjectCastProfilePage() {
  const params = useParams();
  const member = useCastMember(params.castId as string);

  if (!member || member.projectId !== params.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <h3 className="font-semibold text-lg mb-1">Cast member not found</h3>
        <p className="text-sm text-muted-foreground">This person may have been removed or the link is incorrect.</p>
        <Link href={`/dashboard/projects/${params.id}/cast`} className="mt-4 text-primary underline">Back to Project Cast</Link>
      </div>
    );
  }

  return (
    <CastProfile
      member={member}
      backHref={`/dashboard/projects/${params.id}/cast`}
      backLabel="Back to Cast"
      onUpdate={() => undefined}
    />
  );
}
