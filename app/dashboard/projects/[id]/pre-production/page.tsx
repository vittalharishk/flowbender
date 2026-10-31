"use client";

import { use } from "react";
import { useAppDataSlice } from "@/lib/app-data-store";
import { PreProdBoard } from "@/components/schedule/pre-prod-board";

export default function PreProductionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const projects = useAppDataSlice("projects") ?? [];
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return <div className="p-8 text-muted-foreground">Project not found.</div>;
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Pre-Production</h1>
        <p className="text-sm text-muted-foreground mt-1">{project.title} · Task management, checklist and readiness</p>
      </div>
      <PreProdBoard projectId={id} />
    </div>
  );
}
