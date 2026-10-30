"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clapperboard, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/components/auth-provider";
import { getDemoAccounts, isDemoMode, type DemoAccount } from "@/lib/auth-client";
import { getSafeWorkspacePath } from "@/lib/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(false);
  const [help, setHelp] = useState<"password" | "access" | null>(null);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);

  useEffect(() => {
    if (isDemoMode) setDemoAccounts(getDemoAccounts());
    if (typeof window !== "undefined" && window.location.search.includes("_v=")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("_v");
      const cleanPath = url.pathname + (url.search ? url.search : "") + url.hash;
      window.history.replaceState(null, "", cleanPath);
    }
  }, []);

  function destination() {
    return getSafeWorkspacePath(new URLSearchParams(window.location.search).get("next"));
  }

  useEffect(() => {
    if (!authLoading && user) router.replace(getSafeWorkspacePath(new URLSearchParams(window.location.search).get("next")));
  }, [authLoading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password, remember);
      router.replace(destination());
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  async function openDemo(accountEmail = "producer@flowbender.demo") {
    setLoading(true);
    setError("");
    try {
      await login(accountEmail, "demo", remember);
      router.replace(destination());
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to open the demo workspace");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 items-center justify-center p-12">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Clapperboard className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight lowercase">flowbender</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Your production.<br />
            <span className="text-gradient">Your command.</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-10">
            The operating system for independent film and OTT production teams.
            Manage cast, crew, schedules, budgets, and distribution from one place.
          </p>

          <div className="grid grid-cols-3 gap-6">
            {[
              { value: "50+", label: "Active Productions" },
              { value: "1,200+", label: "Cast & Crew" },
              { value: "₹2,330 Cr", label: "Budget Tracked" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Clapperboard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight lowercase">flowbender</span>
          </div>

          <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Sign in to your production workspace</p>
          {isDemoMode && <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm"><p className="mb-3 text-muted-foreground">Choose a demo role. Managers only see their assigned projects; the producer sees the complete slate.</p><div className="space-y-2">{demoAccounts.map((account) => <Button key={account.email} type="button" variant={account.role === "Producer" ? "default" : "outline"} className="w-full justify-between" disabled={loading || authLoading} onClick={() => void openDemo(account.email)}><span>{account.label}</span><span className="text-xs opacity-70">{account.role === "Producer" ? "All projects" : `${account.assignedProjectIds.length} projects`}</span></Button>)}</div><p className="mt-3 text-xs text-muted-foreground">Demo password: <code>demo</code></p></div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@production.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" onClick={() => setHelp("password")} className="text-sm text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="remember" checked={remember} onCheckedChange={(checked) => setRemember(checked === true)} />
              <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
                Keep me signed in
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium shadow-lg shadow-amber-500/20 transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
            {error && <p className="text-sm text-red-500" role="alert">{error}</p>}
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            New to flowbender?{" "}
            <button type="button" onClick={() => setHelp("access")} className="text-primary hover:underline font-medium">
              Request access
            </button>
          </p>
          <Dialog open={help !== null} onOpenChange={(open) => !open && setHelp(null)}>
            <DialogContent><DialogHeader><DialogTitle>{help === "password" ? "Password help" : "Workspace access"}</DialogTitle><DialogDescription>{isDemoMode ? "This is a local demo. Use Open demo workspace without a real password. No account request or password-reset email is sent." : "Contact your production workspace administrator to request an account or reset your password. Self-service registration and password reset are not connected to this API."}</DialogDescription></DialogHeader></DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
