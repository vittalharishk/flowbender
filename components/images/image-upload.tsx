"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { imageStorage } from "@/lib/image-storage";

interface ImageUploadProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  aspect?: "square" | "video" | "portrait";
  className?: string;
}

export function ImageUpload({ value, onChange, label = "Upload image", aspect = "square", className }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function choose(file?: File) {
    if (!file) return;
    if (busy) {
      setError("Wait for the current image to finish processing.");
      return;
    }
    setError(""); setBusy(true);
    try { onChange(await imageStorage.save(file)); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to read image."); }
    finally { setBusy(false); }
  }
  return (
    <div className={cn("space-y-2", className)}>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); void choose(e.dataTransfer.files[0]); }}
        role="button"
        tabIndex={busy ? -1 : 0}
        aria-label={label}
        aria-disabled={busy}
        onKeyDown={(event) => {
          if (!busy && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => !busy && inputRef.current?.click()}
        className={cn("relative cursor-pointer overflow-hidden rounded-xl border border-dashed bg-muted/30 transition-colors hover:border-amber-500/60", aspect === "video" ? "aspect-video" : aspect === "portrait" ? "aspect-[3/4]" : "aspect-square")}
      >
        {value ? <img src={value} alt={label} className="h-full w-full object-cover" /> : <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground"><UploadCloud className="h-7 w-7" /><span className="text-sm">{label}</span><span className="text-[11px]">PNG, JPG, JPEG, WEBP · max 5 MB</span></div>}
        {busy && <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white">Processing…</div>}
      </div>
      <input ref={inputRef} type="file" aria-label={label} accept="image/png,image/jpeg,image/webp" className="hidden" disabled={busy} onChange={(e) => { void choose(e.target.files?.[0]); e.currentTarget.value = ""; }} />
      {value && <div className="flex gap-2"><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}><ImagePlus className="mr-1 h-3.5 w-3.5" />Change</Button><Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => onChange(null)}><Trash2 className="mr-1 h-3.5 w-3.5" />Remove</Button></div>}
      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function Avatar({ src, initials, alt = "", className }: { src?: string | null; initials: string; alt?: string; className?: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (src && failedSource !== src) {
    return <img src={src} alt={alt} onError={() => setFailedSource(src)} className={cn("h-12 w-12 rounded-full object-cover", className)} />;
  }
  return <div className={cn("flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 text-sm font-bold text-amber-400", className)}>{initials}</div>;
}

export function ImageLightbox({ src, alt = "Preview", onClose }: { src?: string | null; alt?: string; onClose: () => void }) {
  if (!src) return null;
  return <Dialog open onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-w-[95vw] border-0 bg-background/95 p-6">
      <DialogTitle className="sr-only">Image preview</DialogTitle>
      <DialogDescription className="sr-only">{alt}</DialogDescription>
      <img src={src} alt={alt} className="mx-auto max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl" />
    </DialogContent>
  </Dialog>;
}
