"use client";

import type { Project, Script, ScriptBlock, ScriptDraftVersion, ScriptScene, ScriptStatus, ScriptType, Shot, ScriptReference } from "./types";
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
    shots: [], references: [],
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

// ── Shot CRUD ──

export function addShot(scriptId: string, sceneId: string, input: Omit<Shot, "id">): Shot | undefined {
  const script = getScript(scriptId);
  if (!script) return;
  const shot: Shot = { ...input, id: id("shot") };
  updateScript(scriptId, { shots: [...(script.shots ?? []), shot] });
  return shot;
}

export function updateShot(scriptId: string, shotId: string, updates: Partial<Shot>) {
  const script = getScript(scriptId);
  if (!script) return;
  updateScript(scriptId, { shots: (script.shots ?? []).map((s) => s.id === shotId ? { ...s, ...updates } : s) });
}

export function removeShot(scriptId: string, shotId: string) {
  const script = getScript(scriptId);
  if (!script) return;
  updateScript(scriptId, { shots: (script.shots ?? []).filter((s) => s.id !== shotId) });
}

// ── Reference CRUD ──

export function addReference(scriptId: string, input: Omit<ScriptReference, "id" | "createdAt">): ScriptReference | undefined {
  const script = getScript(scriptId);
  if (!script) return;
  const ref: ScriptReference = { ...input, id: id("ref"), createdAt: new Date().toISOString() };
  updateScript(scriptId, { references: [...(script.references ?? []), ref] });
  return ref;
}

export function updateReference(scriptId: string, refId: string, updates: Partial<ScriptReference>) {
  const script = getScript(scriptId);
  if (!script) return;
  updateScript(scriptId, { references: (script.references ?? []).map((r) => r.id === refId ? { ...r, ...updates } : r) });
}

export function removeReference(scriptId: string, refId: string) {
  const script = getScript(scriptId);
  if (!script) return;
  updateScript(scriptId, { references: (script.references ?? []).filter((r) => r.id !== refId) });
}

// ── Version management ──

export function restoreScriptVersion(scriptId: string, versionId: string) {
  const script = getScript(scriptId);
  if (!script) return;
  const version = script.versions.find((v) => v.id === versionId);
  if (!version) return;
  const snapshot: ScriptDraftVersion = {
    id: id("version"),
    number: Math.max(0, ...script.versions.map((v) => v.number)) + 1,
    name: `Restored from V${version.number} — ${version.name}`,
    revisionDate: new Date().toISOString(),
    createdBy: "Production Team",
    notes: `Restored from version ${version.number} (${version.name})`,
    status: version.status,
    blocks: script.blocks,
    scenes: script.scenes,
  };
  updateScript(scriptId, {
    blocks: version.blocks,
    scenes: version.scenes,
    status: version.status,
    versions: [snapshot, ...script.versions],
    draftName: version.name,
    draftNumber: String(snapshot.number),
  });
  return snapshot;
}

export function deleteScriptVersion(scriptId: string, versionId: string) {
  const script = getScript(scriptId);
  if (!script) return;
  updateScript(scriptId, { versions: script.versions.filter((v) => v.id !== versionId) });
}

export function updateScriptVersion(scriptId: string, versionId: string, updates: Partial<Pick<ScriptDraftVersion, "name" | "notes">>) {
  const script = getScript(scriptId);
  if (!script) return;
  updateScript(scriptId, { versions: script.versions.map((v) => v.id === versionId ? { ...v, ...updates } : v) });
}

export function reorderScriptScenes(scriptId: string, sceneIds: string[]) {
  const script = getScript(scriptId);
  if (!script) return;
  const ordered = sceneIds.map((sid) => script.scenes.find((s) => s.id === sid)).filter(Boolean) as ScriptScene[];
  const remaining = script.scenes.filter((s) => !sceneIds.includes(s.id));
  updateScript(scriptId, { scenes: [...ordered, ...remaining] });
}

export function useScripts() { return useAppDataSlice("scripts"); }
export function useScript(scriptId: string) { return useScripts().find((script) => script.id === scriptId); }
export function projectName(projects: Project[], projectId: string) { return projects.find((project) => project.id === projectId)?.title ?? "Unknown project"; }
