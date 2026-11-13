"use client";

import { useState } from "react";
import { Film } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectPosterProps {
  title: string;
  gradient: string;
  className?: string;
  image?: string | null;
}

export function ProjectPoster({ title, gradient, className, image }: ProjectPosterProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const initials = title
    .split(" ")
    .filter((w) => w.length > 0 && w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  const safeGradient = gradient || "from-slate-700 via-slate-800 to-indigo-950";

  return image && image !== failedImage ? <img src={image} alt={title} onError={() => setFailedImage(image)} className={cn("rounded-lg object-cover", className)} /> : (
    <div
      role="img"
      aria-label={`${title} poster placeholder`}
      className={cn(
        "rounded-lg bg-gradient-to-br flex flex-col items-center justify-center overflow-hidden",
        safeGradient,
        className
      )}
    >
      <Film className="w-6 h-6 text-white/50 mb-1" />
      <span className="text-white/70 text-[10px] font-bold tracking-widest uppercase">
        {initials}
      </span>
    </div>
  );
}
