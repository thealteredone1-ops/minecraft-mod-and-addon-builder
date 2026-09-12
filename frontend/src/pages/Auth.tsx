import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Blocks } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError, apiPost } from "@/lib/api";
import { beginSession, useSession } from "@/lib/session";
import type { User } from "@/lib/types";

function errText(e: unknown, fallback: string) {
  if (e instanceof ApiError) {
    const body = e.body as { detail?: unknown } | null;
    if (typeof body?.detail === "string") return body.detail;
  }
  return fallback;
}

export default function Auth() {
  const navigate = useNavigate();
  const { data: user } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const login = useMutation({
    mutationFn: () => apiPost<User>("/auth/login", { email, password }),
    onSuccess: async (u) => {
      await beginSession();
      toast.success(`Welcome back, ${u.display_name}`);
      navigate("/dashboard");
    },
    onError: (e) => toast.error(errText(e, "Could not sign in")),
  });

  const signup = useMutation({
    mutationFn: () =>
      apiPost<User>("/auth/signup", { email, password, display_name: displayName || "Modder" }),
    onSuccess: async (u) => {
      await beginSession();
      toast.success(`Workspace ready, ${u.display_name}`);
      navigate("/dashboard");
    },
    onError: (e) => toast.error(errText(e, "Could not create account")),
  });

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-6 py-16">
      <div className="grid-haze pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-0 size-[34rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
            <Blocks className="size-5" />
          </span>
          <div>
            <p className="font-heading text-xl font-extrabold tracking-tight">ModCraft Studio</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Creator access
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <Tabs defaultValue="signup">
            <TabsList className="w-full" data-testid="auth-tabs">
              <TabsTrigger value="signup" className="flex-1" data-testid="tab-signup">
                Create account
              </TabsTrigger>
              <TabsTrigger value="login" className="flex-1" data-testid="tab-login">
                Sign in
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signup" className="pt-5">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  signup.mutate();
                }}
                data-testid="signup-form"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="su-name">Creator name</Label>
                  <Input
                    id="su-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Steve"
                    required
                    data-testid="signup-name-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-email">Email</Label>
                  <Input
                    id="su-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    data-testid="signup-email-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-password">Password</Label>
                  <Input
                    id="su-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    minLength={6}
                    required
                    data-testid="signup-password-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={signup.isPending}
                  data-testid="signup-submit-button"
                >
                  {signup.isPending ? "Creating…" : "Create free account"}
                </Button>
                <p className="text-center font-mono text-[11px] text-muted-foreground">
                  Unlimited free mod generations
                </p>
              </form>
            </TabsContent>

            <TabsContent value="login" className="pt-5">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  login.mutate();
                }}
                data-testid="login-form"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="li-email">Email</Label>
                  <Input
                    id="li-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="login-email-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="li-password">Password</Label>
                  <Input
                    id="li-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    data-testid="login-password-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={login.isPending}
                  data-testid="login-submit-button"
                >
                  {login.isPending ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
