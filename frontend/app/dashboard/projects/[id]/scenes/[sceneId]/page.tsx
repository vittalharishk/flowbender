"use client";

import { useParams } from "next/navigation";
import { useScene } from "@/lib/scene-store";
import { SceneDetail } from "@/components/scenes/scene-detail";

export default function ProjectSceneDetailPage() {
  const params = useParams();
  const scene = useScene(params.sceneId as string);

  if (!scene || scene.projectId !== params.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <h3 className="font-semibold text-lg mb-1">Scene not found</h3>
        <p className="text-sm text-muted-foreground">This scene may have been removed or the link is incorrect.</p>
      </div>
    );
  }

  return (
    <SceneDetail
      key={scene.id}
      scene={scene}
      backHref={`/dashboard/projects/${params.id}/scenes`}
      backLabel="Back to Scenes"
      onUpdate={() => undefined}
    />
  );
}
