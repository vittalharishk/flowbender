"use client";

import { useParams } from "next/navigation";
import { PostProductionWorkspace } from "@/components/post-production/post-production-workspace";
import { PostProdPipeline } from "@/components/schedule/post-prod-pipeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProjectPostProductionPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="space-y-5">
      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline & Milestones</TabsTrigger>
          <TabsTrigger value="workspace">Tasks & Deliverables</TabsTrigger>
        </TabsList>
        <TabsContent value="pipeline" className="mt-4">
          <PostProdPipeline key={id} projectId={id} />
        </TabsContent>
        <TabsContent value="workspace" className="mt-4">
          <PostProductionWorkspace key={id} projectId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
