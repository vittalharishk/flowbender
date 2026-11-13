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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Clapperboard className="w-12 h-12 text-green-500 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8 backdrop-blur">
          <div className="flex items-center justify-center mb-8">
            <Clapperboard className="w-8 h-8 text-green-500 mr-3" />
            <h1 className="text-2xl font-bold text-white">flowbender</h1>
          </div>

          <h2 className="text-center text-slate-200 mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="mt-2 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-300">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => setHelp("password")}
                  className="text-xs text-green-500 hover:text-green-400"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked as boolean)}
                className="border-slate-600"
              />
              <Label htmlFor="remember" className="text-sm text-slate-400 font-normal cursor-pointer">
                Remember me
              </Label>
            </div>

            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-green-600 hover:bg-green-700 text-white mt-6"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          {isDemoMode && demoAccounts.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-800">
              <p className="text-xs text-slate-400 text-center mb-3">Demo accounts</p>
              <div className="space-y-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(account.password);
                    }}
                    className="w-full text-left p-2 rounded bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-sm text-slate-300 transition"
                  >
                    <div className="font-medium">{account.role}</div>
                    <div className="text-xs text-slate-500">{account.email}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={help !== null} onOpenChange={() => setHelp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {help === "password" ? "Reset Password" : "Request Access"}
            </DialogTitle>
            <DialogDescription>
              {help === "password"
                ? "Contact your administrator to reset your password."
                : "Contact your administrator to request access to flowbender."}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
