"use client";

import { Clapperboard } from "lucide-react";
import { ProductionManagementWorkspace } from "@/components/production/production-management-workspace";
import { PreProdBoard } from "@/components/schedule/pre-prod-board";
import { ProductionDashboard } from "@/components/schedule/production-dashboard";
import { PageHeader } from "@/components/app/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProductionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        as="h1"
        icon={Clapperboard}
        title="Production"
        description="Pre-production planning and daily production management"
      />
      <Tabs defaultValue="overview">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pre-production">Pre-Production</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="pt-4">
          <ProductionManagementWorkspace />
        </TabsContent>
        <TabsContent value="pre-production" className="pt-4">
          <PreProdBoard />
        </TabsContent>
        <TabsContent value="production" className="pt-4">
          <ProductionDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
