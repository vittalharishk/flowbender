// App data persistence: PostgreSQL is the source of truth (app_state table,
// one JSONB row per collection). The JSON file remains a local backup/seed:
// on first run the database is seeded from it, and every save also refreshes it.
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { ensureAppStateTable, getPool } from "@/lib/server/db";

const storageDirectory = path.join(process.cwd(), "data");
const storageFile = path.join(storageDirectory, "flowbender-demo-data.json");

const META_KEY = "_meta";
const ACCOUNTS_KEY = "_demoAccounts";
// Rows for module-store slices (BGM, dubbing, invoices, business, ...): "mod:<sliceKey>".
const MODULE_PREFIX = "mod:";
const MODULE_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_.-]{0,80}$/;

export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readSeedFile(): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readFile(storageFile, "utf8");
    const parsed = JSON.parse(raw) as { data?: unknown };
    return isRecord(parsed.data) ? (parsed.data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function writeBackupFile(state: Record<string, unknown>) {
  try {
    await mkdir(storageDirectory, { recursive: true });
    await writeFile(storageFile, JSON.stringify({ data: state }), "utf8");
  } catch (error) {
    console.warn("Could not refresh the JSON backup file.", error);
  }
}

// One round trip: every collection in the payload is upserted with a single
// statement (the remote database is far away, so per-row queries were slow).
// Partial payloads (only the collections that changed) are the normal case;
// top-level meta fields are merged into the existing meta row.
async function saveStateToDb(state: Record<string, unknown>) {
  const keys: string[] = [];
  const values: string[] = [];
  const meta: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(state)) {
    if (Array.isArray(value)) {
      keys.push(key);
      values.push(JSON.stringify(value));
    } else {
      meta[key] = value;
    }
  }
  keys.push(META_KEY);
  values.push(JSON.stringify(meta));
  await getPool().query(
    `INSERT INTO app_state (key, data, updated_at)
       SELECT k, d::jsonb, now() FROM unnest($1::text[], $2::text[]) AS t(k, d)
     ON CONFLICT (key) DO UPDATE SET
       data = CASE WHEN app_state.key = $3 THEN app_state.data || EXCLUDED.data ELSE EXCLUDED.data END,
       updated_at = now()`,
    [keys, values, META_KEY]
  );
}

async function loadStateFromDb(): Promise<Record<string, unknown> | null> {
  const result = await getPool().query<{ key: string; data: unknown }>(
    "SELECT key, data FROM app_state WHERE key <> $1 AND key NOT LIKE $2",
    [ACCOUNTS_KEY, MODULE_PREFIX + "%"]
  );
  if (result.rows.length === 0) return null;
  const state: Record<string, unknown> = {};
  for (const row of result.rows) {
    if (row.key === META_KEY) {
      if (isRecord(row.data)) Object.assign(state, row.data);
    } else {
      state[row.key] = row.data;
    }
  }
  return state;
}

async function handleAccountsGet() {
  await ensureAppStateTable();
  const result = await getPool().query<{ data: unknown }>(
    "SELECT data FROM app_state WHERE key = $1",
    [ACCOUNTS_KEY]
  );
  return NextResponse.json({ accounts: result.rows[0]?.data ?? null });
}

async function handleAccountsPut(payload: unknown) {
  if (!isRecord(payload) || !Array.isArray(payload.accounts)) {
    return NextResponse.json({ error: "Invalid accounts payload." }, { status: 400 });
  }
  await ensureAppStateTable();
  await getPool().query(
    `INSERT INTO app_state (key, data, updated_at) VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [ACCOUNTS_KEY, JSON.stringify(payload.accounts)]
  );
  return NextResponse.json({ saved: true });
}

async function handleModulesGet() {
  await ensureAppStateTable();
  const result = await getPool().query<{ key: string; data: unknown }>(
    "SELECT key, data FROM app_state WHERE key LIKE $1",
    [MODULE_PREFIX + "%"]
  );
  const modules: Record<string, unknown> = {};
  for (const row of result.rows) modules[row.key.slice(MODULE_PREFIX.length)] = row.data;
  return NextResponse.json({ modules });
}

async function handleModulePut(payload: unknown) {
  if (
    !isRecord(payload) ||
    typeof payload.key !== "string" ||
    !MODULE_KEY_PATTERN.test(payload.key) ||
    !Array.isArray(payload.data)
  ) {
    return NextResponse.json({ error: "Invalid module payload." }, { status: 400 });
  }
  await ensureAppStateTable();
  await getPool().query(
    `INSERT INTO app_state (key, data, updated_at) VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [MODULE_PREFIX + payload.key, JSON.stringify(payload.data)]
  );
  return NextResponse.json({ saved: true });
}

export async function GET(request: Request) {
  const slice = new URL(request.url).searchParams.get("slice");
  try {
    if (slice === "accounts") return await handleAccountsGet();
    if (slice === "modules") return await handleModulesGet();

    await ensureAppStateTable();
    let state = await loadStateFromDb();
    if (!state) {
      // First run: seed the database from the bundled dummy-data JSON file.
      const seed = await readSeedFile();
      if (!seed) return NextResponse.json({ data: null }, { status: 404 });
      await saveStateToDb(seed);
      state = seed;
    }
    return NextResponse.json({ data: state, source: "database" });
  } catch (error) {
    console.error("Database read failed; falling back to the JSON file.", error);
    const fallback = await readSeedFile();
    if (fallback) return NextResponse.json({ data: fallback, source: "file-fallback" });
    return NextResponse.json({ data: null }, { status: 404 });
  }
}

export async function PUT(request: Request) {
  let slice: string | null = null;
  try {
    slice = new URL(request.url).searchParams.get("slice");
    const payload: unknown = await request.json();

    if (slice === "accounts") return await handleAccountsPut(payload);
    if (slice === "module") return await handleModulePut(payload);

    if (!isRecord(payload) || !isRecord(payload.data)) {
      return NextResponse.json({ error: "Invalid demo data payload." }, { status: 400 });
    }
    const state = payload.data as Record<string, unknown>;
    await ensureAppStateTable();
    await saveStateToDb(state);
    // The JSON backup needs the whole state; partial saves skip it.
    if (payload.partial !== true) void writeBackupFile(state);
    return NextResponse.json({ saved: true, target: "database" });
  } catch (error) {
    console.error("Failed to save app data to the database.", error);
    return NextResponse.json({ error: "Unable to save data to the database." }, { status: 500 });
  }
}
