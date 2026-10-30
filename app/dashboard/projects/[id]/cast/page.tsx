"use client";

import { useParams } from "next/navigation";
import { useProject } from "@/lib/project-store";
import { useCastByProject } from "@/lib/cast-store";
import { CastListView } from "@/components/cast/cast-list-view";

export default function ProjectCastPage() {
  const params = useParams();
  const project = useProject(params.id as string);
  const members = useCastByProject(params.id as string);

  if (!project) return null;

  return (
    <CastListView
      members={members}
      projectScope
      projectId={project.id}
      projectTitle={project.title}
      onCastAdded={() => undefined}
    />
  );
}
