"use client";

import { useParams } from "next/navigation";
import { useScenesByProject } from "@/lib/scene-store";
import { SceneListView } from "@/components/scenes/scene-list-view";

export default function ProjectScenesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const scenes = useScenesByProject(projectId);

  return (
    <SceneListView
      key={projectId}
      scenes={scenes}
      projectId={projectId}
      basePath={`/dashboard/projects/${projectId}/scenes`}
      onSceneAdded={() => undefined}
    />
  );
}
