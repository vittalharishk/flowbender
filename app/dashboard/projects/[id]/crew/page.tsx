"use client";

import { useParams } from "next/navigation";
import { useProject } from "@/lib/project-store";
import { useCrewByProject } from "@/lib/crew-store";
import { CrewListView } from "@/components/crew/crew-list-view";

export default function ProjectCrewPage() {
  const params = useParams();
  const project = useProject(params.id as string);
  const members = useCrewByProject(params.id as string);

  if (!project) return null;

  return (
    <CrewListView
      members={members}
      projectScope
      projectId={project.id}
      projectTitle={project.title}
      onCrewAdded={() => undefined}
    />
  );
}
