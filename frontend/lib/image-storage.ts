export interface ImageStorageRepository {
  save(file: File): Promise<string>;
  remove(value?: string | null): null;
}

export class LocalImageStorageRepository implements ImageStorageRepository {
  async save(file: File) {
    const { compressImage } = await import("./image-compression");
    return compressImage(file);
  }
  remove() {
    return null;
  }
}

export const imageStorage = new LocalImageStorageRepository();
