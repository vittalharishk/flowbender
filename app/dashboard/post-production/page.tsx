"use client";

import { PostProductionWorkspace } from "@/components/post-production/post-production-workspace";
import { PostProdPipeline } from "@/components/schedule/post-prod-pipeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PostProductionDashboardPage() {
  return (
    <div className="max-w-[1600px] mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Post-Production</h1>
        <p className="text-sm text-muted-foreground mt-1">Pipeline, milestones and delivery management across all projects</p>
      </div>
      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline & Milestones</TabsTrigger>
          <TabsTrigger value="workspace">Tasks & Deliverables</TabsTrigger>
        </TabsList>
        <TabsContent value="pipeline" className="mt-4">
          <PostProdPipeline />
        </TabsContent>
        <TabsContent value="workspace" className="mt-4">
          <PostProductionWorkspace />
        </TabsContent>
      </Tabs>
    </div>
  );
}
