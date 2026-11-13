"use client";

import { useParams } from "next/navigation";
import { MediaManagementWorkspace } from "@/components/media/media-management-workspace";

export default function ProjectMediaPage() {
  const { id } = useParams<{ id: string }>();
  return <MediaManagementWorkspace key={id} projectId={id} />;
}
