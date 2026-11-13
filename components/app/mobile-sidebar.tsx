"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SidebarBrand, SidebarNav } from "./sidebar-nav";
import { SidebarUser } from "./sidebar";

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="flex w-[280px] max-w-[85vw] flex-col gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
        <SheetHeader className="flex h-16 shrink-0 flex-row items-center space-y-0 border-b border-sidebar-border px-4 text-left">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Main navigation for flowbender</SheetDescription>
          <SidebarBrand />
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto py-3">
          <SidebarNav onNavigate={onClose} />
        </div>

        <div className="shrink-0 border-t border-sidebar-border p-3">
          <SidebarUser />
        </div>
      </SheetContent>
    </Sheet>
  );
}
