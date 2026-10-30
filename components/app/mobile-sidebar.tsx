"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigation, isNavItemActive } from "@/lib/navigation";
import { currentUser } from "@/lib/mock-data";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const { user, hasPermission } = useAuth();
  const displayName = user?.full_name ?? currentUser.name;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="w-[280px] p-0 bg-sidebar border-sidebar-border">
        <SheetHeader className="px-4 h-16 flex flex-row items-center gap-3 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Clapperboard className="w-[18px] h-[18px] text-white" />
          </div>
          <SheetTitle className="text-lg font-bold text-sidebar-accent-foreground tracking-tight lowercase">
            harish
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 py-3 h-[calc(100vh-8rem)]">
          <nav className="space-y-5 px-3">
            {navigation.map((group) => {
              const items = group.items.filter((item) => !item.permission || hasPermission(item.permission));
              if (!items.length) return null;
              return (
              <div key={group.title}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted mb-2 px-2">
                  {group.title}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = isNavItemActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                          active
                            ? "bg-gradient-to-r from-amber-500/15 to-orange-600/10 text-amber-400"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <Icon className={cn("w-[18px] h-[18px] shrink-0", active && "text-amber-400")} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs font-medium">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{displayName}</p>
              <p className="text-xs text-sidebar-muted truncate">{user?.roles.map((role) => role.name).join(", ") || "Workspace member"}</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
