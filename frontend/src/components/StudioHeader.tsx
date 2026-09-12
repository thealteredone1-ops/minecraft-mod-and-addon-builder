import { Link, useNavigate } from "react-router-dom";
import { Blocks, LogOut, Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { endSession, useSession } from "@/lib/session";
import { toast } from "sonner";

export default function StudioHeader() {
  const { data: user } = useSession();
  const navigate = useNavigate();

  async function signOut() {
    await endSession();
    toast.success("Signed out");
    navigate("/");
  }

  return (
    <header
      className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-xl"
      data-testid="studio-header"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3.5">
        <Link to="/" className="flex items-center gap-2.5 group" data-testid="brand-link">
          <span className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30 transition-colors duration-200 group-hover:bg-primary/25">
            <Blocks className="size-5" />
          </span>
          <span className="font-heading text-lg font-extrabold tracking-tight">
            ModCraft<span className="text-primary">.</span>Studio
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2.5">
          {user ? (
            <>
              <Badge
                variant={user.plan === "pro" ? "default" : "outline"}
                className="font-mono text-[11px] uppercase tracking-[0.18em]"
                data-testid="plan-badge"
              >
                {user.plan === "pro" ? "Pro · 18+" : `Free · ${user.mods_generated} mods`}
              </Badge>
              <Link
                to="/dashboard"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
                data-testid="nav-dashboard"
              >
                Workspace
              </Link>
              {user.plan !== "pro" && (
                <Link
                  to="/pricing"
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                  data-testid="nav-upgrade"
                >
                  <Sparkles className="size-4" /> Go Pro
                </Link>
              )}
              <Button variant="ghost" size="icon-sm" onClick={signOut} data-testid="sign-out-button">
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/pricing"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
                data-testid="nav-pricing"
              >
                Pricing
              </Link>
              <Link
                to="/auth"
                className={buttonVariants({ variant: "default", size: "sm" })}
                data-testid="nav-signin"
              >
                Start building
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
