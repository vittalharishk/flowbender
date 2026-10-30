"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/app/sidebar";
import { MobileSidebar } from "@/components/app/mobile-sidebar";
import { Header } from "@/components/app/header";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import "@/lib/persistence-bootstrap";
import { isDemoMode } from "@/lib/auth-client";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
  }, [loading, user, router]);

  if (loading) return <div role="status" className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Loading your workspace...</div>;
  if (!user) return <div role="status" className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Loading your workspace...</div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Mobile sidebar */}
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main content */}
      <div
        className={cn(
          "transition-all duration-300",
          collapsed ? "lg:ml-[68px]" : "lg:ml-[260px]"
        )}
      >
        <Header onMobileMenuOpen={() => setMobileOpen(true)} />
        {isDemoMode && <div className="border-b bg-amber-500/5 px-4 py-2 text-xs text-muted-foreground sm:px-6">Demo workspace: sample planning data, not verified production records. Changes stay in this browser; no payments or messages are sent.</div>}
        <main className="min-w-0 overflow-x-hidden p-3 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
