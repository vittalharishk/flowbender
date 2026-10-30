"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useCastMember } from "@/lib/cast-store";
import { CastProfile } from "@/components/cast/cast-profile";

export default function GlobalCastProfilePage() {
  const params = useParams();
  const member = useCastMember(params.castId as string);

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <h3 className="font-semibold text-lg mb-1">Cast member not found</h3>
        <p className="text-sm text-muted-foreground">This person may have been removed or the link is incorrect.</p>
        <Link href="/dashboard/cast" className="mt-4 text-primary underline">Back to Cast</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <CastProfile
        member={member}
        backHref="/dashboard/cast"
        backLabel="All Cast"
        onUpdate={() => undefined}
      />
    </div>
  );
}
