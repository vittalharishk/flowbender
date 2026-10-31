"use client";

import { useState } from "react";
import { ProductionManagementWorkspace } from "@/components/production/production-management-workspace";
import { PreProdBoard } from "@/components/schedule/pre-prod-board";
import { ProductionDashboard } from "@/components/schedule/production-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProductionPage() {
  return (
    <div className="max-w-[1600px] mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Production</h1>
        <p className="text-sm text-muted-foreground mt-1">Pre-production planning and daily production management</p>
      </div>
      <Tabs defaultValue="overview">
        <TabsList className="h-9">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="pre-production" className="text-xs">Pre-Production</TabsTrigger>
          <TabsTrigger value="production" className="text-xs">Production</TabsTrigger>
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
