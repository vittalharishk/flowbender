"use client";

import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { currentUser } from "@/lib/mock-data";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarBrand, SidebarNav } from "./sidebar-nav";

export const SIDEBAR_WIDTH = "w-[260px]";
export const SIDEBAR_COLLAPSED_WIDTH = "w-[68px]";

export function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function SidebarUser({ collapsed = false }: { collapsed?: boolean }) {
  const { user } = useAuth();
  const displayName = user?.full_name ?? currentUser.name;
  const roles = user?.roles.map((role) => role.name).join(", ") || "Workspace member";
  return (
    <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
      <Avatar className="h-8 w-8 shrink-0" aria-hidden={collapsed ? undefined : true}>
        <AvatarFallback className="bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground" title={collapsed ? displayName : undefined}>
          {getInitials(displayName)}
        </AvatarFallback>
      </Avatar>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-sidebar-accent-foreground">{displayName}</p>
          <p className="truncate text-xs text-sidebar-muted">{roles}</p>
        </div>
      )}
    </div>
  );
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <aside
        aria-label="Sidebar"
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300",
          collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH
        )}
      >
        <div className={cn("flex h-16 shrink-0 items-center border-b border-sidebar-border", collapsed ? "justify-center px-2" : "px-4")}>
          <SidebarBrand collapsed={collapsed} />
        </div>

        <ScrollArea className="flex-1 py-3">
          <SidebarNav collapsed={collapsed} />
        </ScrollArea>

        <div className="shrink-0 border-t border-sidebar-border p-3">
          <SidebarUser collapsed={collapsed} />
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggle}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              className="flex h-10 shrink-0 items-center justify-center border-t border-sidebar-border text-sidebar-muted transition-colors hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500"
            >
              {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</TooltipContent>
        </Tooltip>
      </aside>
    </TooltipProvider>
  );
}
