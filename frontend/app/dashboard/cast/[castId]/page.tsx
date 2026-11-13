"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { UserX } from "lucide-react";
import { useCastMember } from "@/lib/cast-store";
import { CastProfile } from "@/components/cast/cast-profile";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";

export default function GlobalCastProfilePage() {
  const params = useParams();
  const member = useCastMember(params.castId as string);

  if (!member) {
    return (
      <EmptyState
        icon={UserX}
        title="Cast member not found"
        description="This person may have been removed or the link is incorrect."
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard/cast">Back to Cast</Link>
          </Button>
        }
      />
    );
  }

  return <CastProfile member={member} backHref="/dashboard/cast" backLabel="All Cast" />;
}
