import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import StudioHeader from "@/components/StudioHeader";
import { buttonVariants } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { sessionKey } from "@/lib/session";
import type { PaymentStatus } from "@/lib/types";

const MAX_POLLS = 12;

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id") ?? "";
  const [state, setState] = useState<"polling" | "paid" | "timeout">("polling");

  useEffect(() => {
    if (!sessionId) {
      setState("timeout");
      return;
    }
    let cancelled = false;
    let tries = 0;

    async function poll() {
      if (cancelled) return;
      tries += 1;
      try {
        const res = await apiGet<PaymentStatus>(`/payments/status/${sessionId}`);
        if (res.payment_status === "paid") {
          if (cancelled) return;
          setState("paid");
          await queryClient.invalidateQueries({ queryKey: sessionKey });
          return;
        }
      } catch {
        /* keep polling */
      }
      if (tries >= MAX_POLLS) {
        if (!cancelled) setState("timeout");
        return;
      }
      setTimeout(poll, 2000);
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StudioHeader />
      <main className="mx-auto grid max-w-lg place-items-center px-6 py-28 text-center">
        {state === "polling" && (
          <div data-testid="payment-polling">
            <Loader2 className="mx-auto size-10 animate-spin text-primary" />
            <h1 className="mt-6 font-heading text-3xl font-extrabold tracking-tight">
              Confirming your payment…
            </h1>
            <p className="mt-2 text-muted-foreground">This usually takes a couple of seconds.</p>
          </div>
        )}
        {state === "paid" && (
          <div data-testid="payment-success">
            <CheckCircle2 className="mx-auto size-10 text-primary" />
            <h1 className="mt-6 font-heading text-3xl font-extrabold tracking-tight">
              Pro unlocked
            </h1>
            <p className="mt-2 text-muted-foreground">
              Unlimited generations and 18+ mods are now available on your account.
            </p>
            <Link
              to="/dashboard"
              className={buttonVariants({ className: "mt-7" })}
              data-testid="success-dashboard-link"
            >
              Back to workspace
            </Link>
          </div>
        )}
        {state === "timeout" && (
          <div data-testid="payment-timeout">
            <XCircle className="mx-auto size-10 text-amber-400" />
            <h1 className="mt-6 font-heading text-3xl font-extrabold tracking-tight">
              Still processing
            </h1>
            <p className="mt-2 text-muted-foreground">
              We could not confirm the payment yet. Refresh in a moment or check your workspace.
            </p>
            <Link
              to="/dashboard"
              className={buttonVariants({ variant: "outline", className: "mt-7" })}
              data-testid="timeout-dashboard-link"
            >
              Back to workspace
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
