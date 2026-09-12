import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import StudioHeader from "@/components/StudioHeader";
import { buttonVariants } from "@/components/ui/button";

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <StudioHeader />
      <main className="mx-auto grid max-w-lg place-items-center px-6 py-28 text-center">
        <div data-testid="payment-cancel">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight">Checkout cancelled</h1>
          <p className="mt-2 text-muted-foreground">
            No charge was made. Your free generations are still available.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <Link to="/pricing" className={buttonVariants({})} data-testid="cancel-pricing-link">
              Back to pricing
            </Link>
            <Link
              to="/dashboard"
              className={buttonVariants({ variant: "outline" })}
              data-testid="cancel-dashboard-link"
            >
              <ArrowLeft className="size-4" /> Workspace
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
