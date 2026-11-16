import { NextResponse } from "next/server";
import { MAX_UPLOAD_BYTES, allowedExtension, getFileStorage } from "@/lib/server/file-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST multipart/form-data with a "file" field. Returns { url, key, name, size, contentType }.
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }
  const file = form.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "File is empty." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "File is larger than 50 MB." }, { status: 413 });
  if (!allowedExtension(file.name)) return NextResponse.json({ error: "This file type is not allowed." }, { status: 415 });
  try {
    const owner = form.get("owner");
    const stored = await getFileStorage().save(Buffer.from(await file.arrayBuffer()), file.name, file.type, typeof owner === "string" ? owner : undefined);
    return NextResponse.json(stored, { status: 201 });
  } catch (error) {
    console.error("[files] upload failed:", error);
    return NextResponse.json({ error: "Could not store the file." }, { status: 500 });
  }
}
