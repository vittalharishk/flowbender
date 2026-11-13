"use client";

import { useParams } from "next/navigation";
import { VfxTrackingWorkspace } from "@/components/vfx/vfx-tracking-workspace";

export default function ProjectVfxPage() {
  const { id } = useParams<{ id: string }>();
  return <VfxTrackingWorkspace key={id} projectId={id} />;
}
