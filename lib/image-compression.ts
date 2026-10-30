import { validateImage } from "./image-validation";

export async function compressImage(file: File, maxSize = 1600): Promise<string> {
  const error = validateImage(file);
  if (error) throw new Error(error);
  const source = typeof createImageBitmap === "function"
    ? await createImageBitmap(file)
    : await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Unable to decode image."));
      image.src = URL.createObjectURL(file);
    });
  const scale = Math.min(1, maxSize / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ("close" in source) source.close();
  return canvas.toDataURL("image/webp", 0.82);
}
