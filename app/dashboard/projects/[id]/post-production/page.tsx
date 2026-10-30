"use client";

import { useParams } from "next/navigation";
import { PostProductionWorkspace } from "@/components/post-production/post-production-workspace";

export default function ProjectPostProductionPage() {
  const { id } = useParams<{ id: string }>();
  return <PostProductionWorkspace key={id} projectId={id} />;
}
