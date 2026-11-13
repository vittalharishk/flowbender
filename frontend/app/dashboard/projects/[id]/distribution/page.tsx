"use client";

import { useParams } from "next/navigation";
import { ProjectDistributionWorkspace } from "@/components/distribution/project-distribution-workspace";

export default function ProjectDistributionPage() {
  const params = useParams();
  return <ProjectDistributionWorkspace key={params.id as string} projectId={params.id as string} />;
}
