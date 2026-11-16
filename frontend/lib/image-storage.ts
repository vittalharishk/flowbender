import { dataUrlToBlob, uploadFile } from "./file-upload";

export interface ImageStorageRepository {
  save(file: File): Promise<string>;
  remove(value?: string | null): null;
}

// Images are compressed in the browser, then uploaded to the server file store
// (/api/files). Records keep only the URL. If the upload fails (offline, server
// down) the compressed image is kept inline so the user never loses it.
export class ServerImageStorageRepository implements ImageStorageRepository {
  async save(file: File) {
    const { compressImage } = await import("./image-compression");
    const dataUrl = await compressImage(file);
    try {
      const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
      return (await uploadFile(dataUrlToBlob(dataUrl), `${baseName}.webp`)).url;
    } catch (error) {
      console.warn("Image upload failed; keeping it inline.", error);
      return dataUrl;
    }
  }
  remove() {
    return null;
  }
}

export const imageStorage = new ServerImageStorageRepository();
