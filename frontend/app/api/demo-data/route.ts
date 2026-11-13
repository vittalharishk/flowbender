import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const storageDirectory = path.join(process.cwd(), "data");
const storageFile = path.join(storageDirectory, "flowbender-demo-data.json");

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const value = await readFile(storageFile, "utf8");
    try {
      return NextResponse.json(JSON.parse(value));
    } catch (parseError) {
      console.warn("Shared demo data contained invalid JSON. Resetting to empty.", parseError);
      return NextResponse.json({ data: null });
    }
  } catch (error) {
    const code = error instanceof Error && "code" in error ? error.code : undefined;
    if (code === "ENOENT") return NextResponse.json({ data: null }, { status: 404 });
    console.error("Failed to read shared demo data.", error);
    return NextResponse.json({ data: null });
  }
}

export async function PUT(request: Request) {
  try {
    const payload: unknown = await request.json();
    if (!payload || typeof payload !== "object" || !("data" in payload)) {
      return NextResponse.json({ error: "Invalid demo data payload." }, { status: 400 });
    }

    await mkdir(storageDirectory, { recursive: true });
    await writeFile(storageFile, JSON.stringify(payload), "utf8");
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Failed to save shared demo data.", error);
    return NextResponse.json({ error: "Unable to save shared demo data." }, { status: 500 });
  }
}

