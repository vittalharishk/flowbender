"use client";

import { Bell, AlertTriangle, CheckCircle2, Info, AlertOctagon } from "lucide-react";
import { cn, formatRelativeDate } from "@/lib/utils";
import { updateAppDataSlice, useAppDataSlice } from "@/lib/app-data-store";
import type { Notification } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

const typeConfig: Record<Notification["type"], { icon: typeof Info; color: string }> = {
  info: { icon: Info, color: "text-blue-400" },
  warning: { icon: AlertTriangle, color: "text-amber-400" },
  success: { icon: CheckCircle2, color: "text-emerald-400" },
  urgent: { icon: AlertOctagon, color: "text-red-400" },
};

export function NotificationsDropdown() {
  const items = useAppDataSlice("notifications");
  const unreadCount = items.filter((n) => !n.read).length;

  function markAllRead() {
    updateAppDataSlice("notifications", (current) => current.map((item) => ({ ...item, read: true })));
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Notifications, ${unreadCount} unread`} className="relative h-9 w-9">
          <Bell className="w-[18px] h-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(380px,calc(100vw-2rem))] p-0" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="h-[min(400px,60vh)]">
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            <div className="divide-y">
              {items.map((n) => {
                const config = typeConfig[n.type];
                const Icon = config.icon;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                      !n.read && "bg-primary/5"
                    )}
                  >
                    <div className={cn("mt-0.5 shrink-0", config.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm font-medium truncate", !n.read && "text-foreground")}>
                          {n.title}
                        </p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1">{formatRelativeDate(n.timestamp)}</p>
                      {!n.read && <button className="mt-2 text-xs text-primary hover:underline" onClick={() => updateAppDataSlice("notifications", (current) => current.map((item) => item.id === n.id ? { ...item, read: true } : item))}>Mark as read</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
