"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Crop,
  Upload,
  Link as LinkIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sparkles,
  Check,
  X,
  Maximize2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const SAMPLE_PRESETS = [
  {
    name: "Charminar Heritage",
    type: "heritage",
    url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Film City Backlot",
    type: "studio",
    url: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Old City Cafe",
    type: "cafe",
    url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "MMTS Railway Transit",
    type: "transit",
    url: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Riverfront Pier",
    type: "waterfront",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Night Urban Circle",
    type: "urban",
    url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Apartment Terrace Set",
    type: "housing",
    url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Grand Music Hall",
    type: "interior",
    url: "https://images.unsplash.com/photo-1520523839898-507127054c3f?auto=format&fit=crop&w=1200&q=85",
  },
];

interface ImageCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialImage?: string | null;
  onApply: (croppedDataUrl: string) => void;
  title?: string;
  defaultAspect?: "16:9" | "2.39:1" | "4:3" | "1:1";
}

export function ImageCropModal({
  open,
  onOpenChange,
  initialImage,
  onApply,
  title = "Location Image & Framing",
  defaultAspect = "16:9",
}: ImageCropModalProps) {
  const [activeSourceTab, setActiveSourceTab] = useState<"upload" | "url" | "presets">("upload");
  const [imageSrc, setImageSrc] = useState<string>(initialImage || "");
  const [urlInput, setUrlInput] = useState<string>("");
  const [aspectRatioKey, setAspectRatioKey] = useState<"16:9" | "2.39:1" | "4:3" | "1:1">(defaultAspect);
  
  // Transform states
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync initialImage when modal opens
  useEffect(() => {
    if (open) {
      if (initialImage) {
        setImageSrc(initialImage);
        if (initialImage.startsWith("http")) {
          setUrlInput(initialImage);
        }
      }
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
    }
  }, [open, initialImage]);

  const aspectRatios = {
    "16:9": 16 / 9,
    "2.39:1": 2.39,
    "4:3": 4 / 3,
    "1:1": 1,
  };
  const targetAspect = aspectRatios[aspectRatioKey];

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImageSrc(result);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
      toast.success("Image uploaded. You can now pan and crop below.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // URL Submit Handler
  const handleLoadUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      toast.error("Enter an image URL.");
      return;
    }
    try {
      new URL(trimmed);
      setImageSrc(trimmed);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
      toast.success("URL loaded. You can now adjust framing.");
    } catch {
      toast.error("Please enter a valid HTTP or HTTPS image URL.");
    }
  };

  // Drag to Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageSrc) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Reset transforms
  const handleResetTransforms = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  // Canvas Crop & Export
  const handleApplyCrop = async () => {
    if (!imageSrc) {
      toast.error("Please select or upload an image first.");
      return;
    }

    setIsProcessing(true);

    try {
      // Create offscreen image to load and draw
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageSrc;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => {
          // If cross-origin error occurs when loading remote url into canvas, fallback to raw url
          resolve();
        };
      });

      // Target canvas dimensions
      const canvasWidth = 1280;
      const canvasHeight = Math.round(canvasWidth / targetAspect);

      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        onApply(imageSrc);
        onOpenChange(false);
        setIsProcessing(false);
        return;
      }

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Translate to canvas center
      ctx.save();
      ctx.translate(canvasWidth / 2, canvasHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      // Compute draw dimensions preserving aspect
      const imgAspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
      let drawW = canvasWidth * zoom;
      let drawH = (canvasWidth / imgAspect) * zoom;

      if (imgAspect < targetAspect) {
        drawH = canvasHeight * zoom;
        drawW = canvasHeight * imgAspect * zoom;
      }

      // Apply normalized pan
      const panFactor = canvasWidth / 480; // Scale pan from preview container (approx 480px width)
      const scaledPanX = pan.x * panFactor;
      const scaledPanY = pan.y * panFactor;

      try {
        ctx.drawImage(
          img,
          -drawW / 2 + scaledPanX,
          -drawH / 2 + scaledPanY,
          drawW,
          drawH
        );
        ctx.restore();

        const croppedDataUrl = canvas.toDataURL("image/webp", 0.88);
        onApply(croppedDataUrl);
        toast.success("Image framed and saved successfully.");
      } catch (canvasError) {
        // Fallback in case of CORS canvas taint on third-party URLs
        console.warn("Direct canvas draw was protected by CORS; using direct URL:", canvasError);
        onApply(imageSrc);
        toast.success("Image URL applied.");
      }

      onOpenChange(false);
    } catch (err) {
      console.error("Failed to crop image:", err);
      onApply(imageSrc);
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-3xl overflow-hidden p-0 gap-0">
        <DialogHeader className="p-5 pb-3 border-b bg-muted/20">
          <DialogTitle className="text-lg flex items-center gap-2">
            <Crop className="w-5 h-5 text-primary" /> {title}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Upload an image from your computer, paste a web URL, or choose a set preset, then crop and frame your shot.
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Source Tabs */}
          <Tabs
            value={activeSourceTab}
            onValueChange={(v) => setActiveSourceTab(v as any)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 w-full h-9">
              <TabsTrigger value="upload" className="text-xs gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Upload File
              </TabsTrigger>
              <TabsTrigger value="url" className="text-xs gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" /> Image URL
              </TabsTrigger>
              <TabsTrigger value="presets" className="text-xs gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Presets
              </TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="pt-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-5 text-center cursor-pointer hover:border-primary/60 transition-colors bg-muted/20 hover:bg-muted/40"
              >
                <Upload className="w-7 h-7 mx-auto text-muted-foreground mb-1.5" />
                <p className="text-sm font-semibold">Click to upload photo from your computer</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Supports PNG, JPG, JPEG, WEBP (high resolution recommended)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </TabsContent>

            {/* URL Tab */}
            <TabsContent value="url" className="pt-3">
              <div className="flex gap-2">
                <Input
                  placeholder="https://images.unsplash.com/... or CDN link"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleLoadUrl();
                    }
                  }}
                  className="text-xs"
                />
                <Button size="sm" onClick={handleLoadUrl} className="shrink-0 gap-1 text-xs">
                  Load URL
                </Button>
              </div>
            </TabsContent>

            {/* Presets Tab */}
            <TabsContent value="presets" className="pt-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                {SAMPLE_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setImageSrc(preset.url);
                      setUrlInput(preset.url);
                      setZoom(1);
                      setPan({ x: 0, y: 0 });
                      setRotation(0);
                      toast.info(`Selected preset: ${preset.name}`);
                    }}
                    className="relative group rounded-lg overflow-hidden border text-left hover:border-primary transition-all p-1 bg-card hover:shadow-md"
                  >
                    <div className="h-14 rounded bg-muted overflow-hidden">
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="text-[11px] font-semibold truncate mt-1 px-0.5">{preset.name}</p>
                    <p className="text-[9px] text-muted-foreground uppercase px-0.5">{preset.type}</p>
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Interactive Crop & Viewport Area */}
          <div className="space-y-3 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1 font-semibold text-muted-foreground">
                <span>Aspect Ratio:</span>
                {(["16:9", "2.39:1", "4:3", "1:1"] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatioKey(ratio)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                      aspectRatioKey === ratio
                        ? "bg-primary text-primary-foreground border-primary font-bold"
                        : "bg-background hover:bg-muted text-foreground"
                    }`}
                  >
                    {ratio === "16:9" ? "16:9 (Standard)" : ratio === "2.39:1" ? "2.39:1 (Scope)" : ratio}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  title="Rotate 90 degrees"
                >
                  <RotateCw className="w-3.5 h-3.5 mr-1" /> Rotate
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={handleResetTransforms}
                  title="Reset zoom & pan"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reset
                </Button>
              </div>
            </div>

            {/* Interactive Viewport Frame */}
            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                aspectRatio: `${targetAspect}`,
              }}
              className="relative w-full max-h-[300px] mx-auto rounded-xl overflow-hidden border-2 border-primary/40 bg-slate-950 flex items-center justify-center cursor-grab active:cursor-grabbing select-none shadow-inner group"
            >
              {imageSrc ? (
                <>
                  <div
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                      transition: isDragging ? "none" : "transform 0.15s ease-out",
                    }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <img
                      ref={imageRef}
                      src={imageSrc}
                      alt="Crop target"
                      className="max-w-none w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>

                  {/* Cinematic Frame Overlay Guidelines */}
                  <div className="absolute inset-0 pointer-events-none border border-white/20">
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-white" />
                      <div className="border-r border-white" />
                      <div />
                    </div>
                  </div>

                  {/* Hint pill */}
                  <div className="absolute bottom-2 right-2 rounded-md bg-black/70 backdrop-blur-sm px-2 py-0.5 text-[10px] text-white/90 pointer-events-none border border-white/10">
                    Drag to pan · Slider to zoom
                  </div>
                </>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <Crop className="w-10 h-10 mx-auto opacity-30 mb-2" />
                  <p className="text-sm font-medium">No image loaded</p>
                  <p className="text-xs mt-0.5">Upload a photo or paste a URL above to begin framing.</p>
                </div>
              )}
            </div>

            {/* Zoom Controls */}
            {imageSrc && (
              <div className="flex items-center gap-3 px-1 pt-1">
                <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
                />
                <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-xs font-mono text-muted-foreground w-12 text-right">
                  {zoom.toFixed(1)}x
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={!imageSrc || isProcessing}
            onClick={handleApplyCrop}
            className="gap-1.5 font-semibold bg-primary text-primary-foreground"
          >
            {isProcessing ? (
              <>Processing...</>
            ) : (
              <>
                <Check className="w-4 h-4" /> Apply & Save Image
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
