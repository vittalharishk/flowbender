"use client";

import { useParams } from "next/navigation";
import { SubtitleManagementWorkspace } from "@/components/post-production/subtitle-management-workspace";

export default function ProjectSubtitlesPage() {
  const { id } = useParams<{ id: string }>();
  return <SubtitleManagementWorkspace key={id} projectId={id} />;
}
