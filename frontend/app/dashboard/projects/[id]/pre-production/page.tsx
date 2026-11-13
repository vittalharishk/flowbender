"use client";

import { useParams } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { useAppDataSlice } from "@/lib/app-data-store";
import { PreProdBoard } from "@/components/schedule/pre-prod-board";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

export default function PreProductionPage() {
  const params = useParams();
  const id = params.id as string;
  const projects = useAppDataSlice("projects") ?? [];
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return <EmptyState title="Project not found" description="This project may have been removed or the link is incorrect." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ClipboardList}
        title="Pre-Production"
        description="Task management, checklist and readiness"
      />
      <PreProdBoard projectId={id} />
    </div>
  );
}
