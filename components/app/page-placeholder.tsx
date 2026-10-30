import { LucideIcon, Construction } from "lucide-react";

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PagePlaceholder({ title, description, icon: Icon }: PagePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-600/10 flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-amber-500" />
      </div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      <div className="flex items-center gap-2 text-sm text-muted-foreground/60">
        <Construction className="w-4 h-4" />
        <span>Module under development</span>
      </div>
    </div>
  );
}
