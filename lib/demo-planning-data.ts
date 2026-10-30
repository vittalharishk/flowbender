import type { AppDataCollections } from "./app-data-store";
import { createFlowBenderSeedData } from "./flowbender-demo-seed";

export const DEMO_REFERENCE_DATE = "2026-09-06";

export function createDemoPlanningData(): AppDataCollections {
  return createFlowBenderSeedData();
}
