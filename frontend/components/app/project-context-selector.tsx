"use client";

import { ProjectSelector } from "./project-selector";

export function ProjectContextSelector({ projectId }: { projectId: string }) {
  return <ProjectSelector currentProjectId={projectId} syncUrl={true} />;
}

