import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import StudioHeader from "@/components/StudioHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiGet, apiPost } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { CheckoutResponse, Plan } from "@/lib/types";

const FREE_FEATURES = [
  "Unlimited mod & addon generations",
  "Full element editor",
  "Java Forge/Fabric source export",
  "Bedrock .mcaddon export",
];

const PRO_FEATURES = [
  "18+ mature mods & addons unlocked",
  "Unlimited generations (same as Free)",
  "Priority generation queue",
  "Everything in Free",
];

export default function Pricing() {
  const { data: user } = useSession();
  const navigate = useNavigate();

  const plans = useQuery<{ plans: Plan[] }>({
    queryKey: ["plans"],
    queryFn: () => apiGet<{ plans: Plan[] }>("/plans"),
  });

  const checkout = useMutation({
    mutationFn: (lookup_key: string) =>
      apiPost<CheckoutResponse>("/payments/checkout", {
        lookup_key,
        origin_url: window.location.origin,
      }),
    onSuccess: (res) => {
      window.location.href = res.checkout_url;
    },
    onError: () => toast.error("Could not start checkout"),
  });

  function upgrade(lookupKey: string) {
    if (!user) {
      toast.info("Create an account first");
      navigate("/auth");
      return;
    }
    checkout.mutate(lookupKey);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StudioHeader />

      <main className="relative mx-auto max-w-5xl px-6 py-20">
        <div className="grid-haze pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">Pricing</p>
          <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Build free. Unlock 18+ when you need it.
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Every plan generates unlimited mods and addons. Pro unlocks 18+ mature content.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-7" data-testid="plan-free">
              <h2 className="font-heading text-2xl font-bold tracking-tight">Free</h2>
              <p className="mt-2 font-heading text-4xl font-extrabold">
                $0<span className="text-base font-normal text-muted-foreground">/forever</span>
              </p>
              <ul className="mt-6 space-y-2.5">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to={user ? "/dashboard" : "/auth"}
                className={buttonVariants({ variant: "outline", className: "mt-7 w-full" })}
                data-testid="free-cta"
              >
                {user ? "Open workspace" : "Start free"}
              </Link>
            </div>

            <div
              className="relative rounded-2xl border-2 border-primary/40 bg-card p-7 shadow-[0_0_40px_rgba(16,185,129,0.12)]"
              data-testid="plan-pro"
            >
              <Badge className="absolute -top-3 left-7 font-mono text-[10px] uppercase tracking-[0.2em]">
                Most popular
              </Badge>
              <h2 className="font-heading text-2xl font-bold tracking-tight">Pro</h2>
              <p className="mt-2 font-heading text-4xl font-extrabold">
                $9<span className="text-base font-normal text-muted-foreground">/month</span>
              </p>
              <ul className="mt-6 space-y-2.5">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>

              {user?.plan === "pro" ? (
                <p className="mt-7 text-center font-mono text-sm text-primary" data-testid="pro-active">
                  Pro is active on your account
                </p>
              ) : (
                <div className="mt-7 space-y-2">
                  {(plans.data?.plans ?? []).map((p) => (
                    <Button
                      key={p.lookup_key}
                      className="w-full"
                      variant={p.lookup_key === "pro_monthly" ? "default" : "secondary"}
                      disabled={checkout.isPending}
                      onClick={() => upgrade(p.lookup_key)}
                      data-testid={`upgrade-${p.lookup_key}`}
                    >
                      {checkout.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Sparkles className="size-4" />
                      )}
                      {p.name} — {p.price}
                    </Button>
                  ))}
                  {plans.isError && (
                    <p className="text-center text-sm text-muted-foreground">
                      Plans are unavailable right now.
                    </p>
                  )}
                </div>
              )}
              <p className="mt-4 text-center font-mono text-[11px] text-muted-foreground">
                Test mode — card 4242 4242 4242 4242
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
