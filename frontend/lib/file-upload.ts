// Browser side of file uploads. Files go to POST /api/files (stored on the
// server today, S3 later) and records keep only the returned URL.
export interface UploadedFile {
  url: string;
  key: string;
  name: string;
  size: number;
  contentType: string;
}

export const MAX_UPLOAD_MB = 50;

export async function uploadFile(file: Blob, name?: string): Promise<UploadedFile> {
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`File is larger than ${MAX_UPLOAD_MB} MB.`);
  const form = new FormData();
  form.append("file", file, name ?? (file instanceof File ? file.name : "upload.bin"));
  const response = await fetch("/api/files", { method: "POST", body: form });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Upload failed (${response.status}).`);
  return body as UploadedFile;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, data] = dataUrl.split(",");
  const type = head.match(/data:([^;]+)/)?.[1] ?? "application/octet-stream";
  const bytes = atob(data);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
  return new Blob([buffer], { type });
}
