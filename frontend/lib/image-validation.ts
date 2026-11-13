export const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImage(file: File): string | null {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    return "Please choose a PNG, JPG, JPEG, or WEBP image.";
  }
  if (file.size > MAX_IMAGE_BYTES) return "Image must be smaller than 5 MB.";
  return null;
}
