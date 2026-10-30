"use client";

import type { Project, Script, ScriptBlock, ScriptDraftVersion, ScriptScene, ScriptStatus, ScriptType } from "./types";
import { getAppDataSlice, updateAppDataSlice, useAppDataSlice } from "./app-data-store";

const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export interface CreateScriptInput {
  projectId: string;
  title: string;
  type: ScriptType;
  language: string;
  genre?: string;
  writer?: string;
  storyBy?: string;
  screenplayBy?: string;
  dialoguesBy?: string;
  scriptCoordinator?: string;
  draftName?: string;
  draftNumber?: string;
  status?: ScriptStatus;
  notes?: string;
}

export function getScripts() { return getAppDataSlice("scripts"); }
export function getScript(idValue: string) { return getScripts().find((script) => script.id === idValue); }

export function createScript(input: CreateScriptInput): Script {
  const now = new Date().toISOString();
  const script: Script = {
    id: id("script"), projectId: input.projectId, title: input.title.trim(), type: input.type,
    language: input.language, genre: input.genre?.trim() ?? "", writer: input.writer?.trim() ?? "",
    storyBy: input.storyBy?.trim() ?? "", screenplayBy: input.screenplayBy?.trim() ?? "",
    dialoguesBy: input.dialoguesBy?.trim() ?? "", scriptCoordinator: input.scriptCoordinator?.trim() ?? "",
    draftName: input.draftName?.trim() ?? "First Draft", draftNumber: input.draftNumber?.trim() ?? "1",
    status: input.status ?? "Concept", notes: input.notes?.trim() ?? "", createdAt: now, updatedAt: now,
    createdBy: "Production Team", archived: false, blocks: [], scenes: [], versions: [], linkedSceneIds: [],
  };
  updateAppDataSlice("scripts", (current) => [script, ...current]);
  return script;
}

export function updateScript(scriptId: string, updates: Partial<Omit<Script, "id">>) {
  let updated: Script | undefined;
  updateAppDataSlice("scripts", (current) => current.map((script) => {
    if (script.id !== scriptId) return script;
    updated = { ...script, ...updates, updatedAt: new Date().toISOString() };
    return updated;
  }));
  return updated;
}

export function deleteScript(scriptId: string) {
  updateAppDataSlice("scripts", (current) => current.filter((script) => script.id !== scriptId));
}

export function duplicateScript(scriptId: string) {
  const source = getScript(scriptId);
  if (!source) return undefined;
  const now = new Date().toISOString();
  const sceneIds = new Map<string, string>();
  const blockIds = new Map<string, string>();
  const remap = (ids: Map<string, string>, original: string, prefix: string) => {
    if (!ids.has(original)) ids.set(original, id(prefix));
    return ids.get(original)!;
  };
  const copyBlocks = (blocks: ScriptBlock[]) => blocks.map((block) => ({
    ...block, id: remap(blockIds, block.id, "block"),
    sceneId: block.sceneId ? remap(sceneIds, block.sceneId, "scene") : undefined,
  }));
  const copyScenes = (scenes: ScriptScene[]) => scenes.map((scene) => ({
    ...scene, id: remap(sceneIds, scene.id, "scene"),
    blockIds: scene.blockIds.map((blockId) => remap(blockIds, blockId, "block")),
    breakdown: scene.breakdown.map((item) => ({ ...item, id: id("item") })),
  }));
  const duplicate: Script = { ...source, id: id("script"), title: `${source.title} Copy`, createdAt: now, updatedAt: now,
    blocks: copyBlocks(source.blocks), scenes: copyScenes(source.scenes),
    versions: source.versions.map((version) => ({
      ...version, id: id("version"), blocks: copyBlocks(version.blocks), scenes: copyScenes(version.scenes),
    })), linkedSceneIds: [], archived: false };
  updateAppDataSlice("scripts", (current) => [duplicate, ...current]);
  return duplicate;
}

export function archiveScript(scriptId: string, archived = true) { return updateScript(scriptId, { archived, status: archived ? "Archived" : "Concept" }); }

export function addScriptBlock(scriptId: string, input: Omit<ScriptBlock, "id">) {
  const block = { ...input, id: id("block") };
  const script = getScript(scriptId);
  if (!script) return;
  if (block.sceneId && !script.scenes.some((scene) => scene.id === block.sceneId)) {
    throw new Error("The script scene no longer exists.");
  }
  updateScript(scriptId, {
    blocks: [...script.blocks, block],
    scenes: script.scenes.map((scene) => scene.id === block.sceneId ? { ...scene, blockIds: [...scene.blockIds, block.id] } : scene),
  });
  return block;
}

export function updateScriptBlock(scriptId: string, blockId: string, text: string) {
  const script = getScript(scriptId);
  if (!script) return;
  updateScript(scriptId, { blocks: script.blocks.map((block) => block.id === blockId ? { ...block, text } : block) });
}

export function removeScriptBlock(scriptId: string, blockId: string) {
  const script = getScript(scriptId);
  if (!script) return;
  updateScript(scriptId, {
    blocks: script.blocks.filter((block) => block.id !== blockId),
    scenes: script.scenes.map((scene) => ({ ...scene, blockIds: scene.blockIds.filter((value) => value !== blockId) })),
  });
}

export function addScriptScene(scriptId: string, input: Omit<ScriptScene, "id" | "blockIds" | "breakdown" | "status"> & { breakdown?: ScriptScene["breakdown"]; status?: ScriptScene["status"] }) {
  const script = getScript(scriptId);
  if (!script) return;
  const scene: ScriptScene = { ...input, id: id("scene"), blockIds: [], breakdown: input.breakdown ?? [], status: input.status ?? "not-scheduled" };
  updateScript(scriptId, { scenes: [...script.scenes, scene] });
  return scene;
}

export function updateScriptScene(scriptId: string, sceneId: string, updates: Partial<ScriptScene>) {
  const script = getScript(scriptId);
  if (!script) return;
  updateScript(scriptId, { scenes: script.scenes.map((scene) => scene.id === sceneId ? { ...scene, ...updates } : scene) });
}

export function removeScriptScene(scriptId: string, sceneId: string) {
  const script = getScript(scriptId);
  if (!script) return;
  updateScript(scriptId, {
    scenes: script.scenes.filter((scene) => scene.id !== sceneId),
    blocks: script.blocks.filter((block) => block.sceneId !== sceneId),
    linkedSceneIds: script.linkedSceneIds.filter((value) => value !== sceneId),
  });
}

export function createScriptVersion(scriptId: string, input: Pick<ScriptDraftVersion, "name" | "notes" | "status">) {
  const script = getScript(scriptId);
  if (!script) return;
  const version: ScriptDraftVersion = { ...input, id: id("version"), number: Math.max(0, ...script.versions.map((item) => item.number)) + 1,
    revisionDate: new Date().toISOString(), createdBy: "Production Team", blocks: script.blocks, scenes: script.scenes };
  updateScript(scriptId, { versions: [version, ...script.versions], draftName: input.name, draftNumber: String(version.number), status: input.status });
  return version;
}

export function useScripts() { return useAppDataSlice("scripts"); }
export function useScript(scriptId: string) { return useScripts().find((script) => script.id === scriptId); }
export function projectName(projects: Project[], projectId: string) { return projects.find((project) => project.id === projectId)?.title ?? "Unknown project"; }
