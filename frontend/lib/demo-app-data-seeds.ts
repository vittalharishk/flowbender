import { registerAppDataSeed, type AppDataCollectionKey } from "./app-data-store";
import { createFlowBenderSeedData } from "./flowbender-demo-seed";

const seeds = createFlowBenderSeedData();
for (const key of Object.keys(seeds) as AppDataCollectionKey[]) {
  registerAppDataSeed(key, seeds[key]);
}
