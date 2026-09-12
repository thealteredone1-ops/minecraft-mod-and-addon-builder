import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, Loader2, Lock, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import StudioHeader from "@/components/StudioHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError, apiDelete, apiGet, apiPost } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { sessionKey, useSession } from "@/lib/session";
import type { MessageResponse, Project, ProjectSummary } from "@/lib/types";

const PRESETS = [
  "A deep-ocean mod with pressure-forged tools, glowing coral blocks and a lurking abyss mob",
  "A candy dimension: sugar ores, gummy armor, lollipop swords and a hostile gingerbread golem",
  "A steampunk tech mod with brass ingots, pressure valves, a copper drill and boiler blocks",
];

const TARGET_LABELS: Record<string, string> = {
  both: "Java + Bedrock",
  java: "Java only",
  bedrock: "Bedrock only",
};
const LOADER_LABELS: Record<string, string> = { forge: "Forge", fabric: "Fabric" };

function errText(e: unknown, fallback: string) {
  if (e instanceof ApiError) {
    const body = e.body as { detail?: unknown } | null;
    if (typeof body?.detail === "string") return body.detail;
  }
  return fallback;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: user, isLoading: sessionLoading } = useSession();
  const [prompt, setPrompt] = useState("");
  const [target, setTarget] = useState("both");
  const [loader, setLoader] = useState("forge");
  const [mature, setMature] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !user) navigate("/auth", { replace: true });
  }, [sessionLoading, user, navigate]);

  const projects = useQuery<ProjectSummary[]>({
    queryKey: ["projects"],
    queryFn: () => apiGet<ProjectSummary[]>("/projects"),
    enabled: Boolean(user),
  });

  const generate = useMutation({
    mutationFn: () => apiPost<Project>("/projects/generate", { prompt, target, loader, mature }),
    onSuccess: async (p) => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: sessionKey });
      toast.success(`"${p.spec.mod_name}" generated`);
      navigate(`/project/${p.id}`);
    },
    onError: (e) => toast.error(errText(e, "Generation failed")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete<MessageResponse>(`/projects/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
    onError: () => toast.error("Could not delete project"),
  });


  return (
    <div className="min-h-screen bg-background text-foreground">
      <StudioHeader />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">Workspace</p>
          <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight">
            Describe the mod you want to exist.
          </h1>
          <p className="mt-3 text-muted-foreground">
            One brief becomes items, blocks, recipes, mobs, gear and ore worldgen — exportable to
            Java and Bedrock.
          </p>
        </div>

        <section
          className="mt-8 rounded-2xl border-2 border-primary/25 bg-card p-5 shadow-[0_0_40px_rgba(16,185,129,0.10)] transition-colors duration-200 focus-within:border-primary/60"
          data-testid="ai-composer"
        >
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="e.g. A frostbitten tundra mod with permafrost ore, icicle spears, an aurora beacon block and a wandering frost wraith…"
            className="resize-none border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
            data-testid="prompt-input"
          />

          <div className="mt-2 flex flex-wrap gap-2">
            {PRESETS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPrompt(p)}
                className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-left font-mono text-[11px] text-muted-foreground transition-colors duration-150 hover:border-primary/50 hover:text-foreground"
                data-testid={`preset-chip-${i}`}
              >
                {p.slice(0, 46)}…
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Select value={target} onValueChange={(v: string) => setTarget(v)}>
              <SelectTrigger className="w-[170px]" data-testid="target-select">
                <SelectValue>{(v) => TARGET_LABELS[v as string] ?? "Java + Bedrock"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Java + Bedrock</SelectItem>
                <SelectItem value="java">Java only</SelectItem>
                <SelectItem value="bedrock">Bedrock only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={loader} onValueChange={(v: string) => setLoader(v)}>
              <SelectTrigger className="w-[130px]" data-testid="loader-select">
                <SelectValue>{(v) => LOADER_LABELS[v as string] ?? "Forge"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="forge">Forge</SelectItem>
                <SelectItem value="fabric">Fabric</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
              <Checkbox
                id="mature"
                checked={mature}
                onCheckedChange={(c) => {
                  if (c && user?.plan !== "pro") {
                    toast.error("18+ mod generation is a Pro feature");
                    return;
                  }
                  setMature(Boolean(c));
                }}
                data-testid="mature-checkbox"
              />
              <Label htmlFor="mature" className="flex items-center gap-1.5 text-sm">
                {user?.plan !== "pro" && <Lock className="size-3.5 text-muted-foreground" />}
                18+ mature content
              </Label>
            </div>

            <Button
              className="ml-auto"
              size="lg"
              disabled={generate.isPending || prompt.trim().length < 8}
              onClick={() => generate.mutate()}
              data-testid="generate-button"
            >
              {generate.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Forging mod…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" /> Generate mod
                </>
              )}
            </Button>
          </div>

          <p className="mt-3 font-mono text-[11px] text-muted-foreground" data-testid="quota-note">
            Unlimited mod &amp; addon generations on every plan.
          </p>
        </section>

        <section className="mt-14">
          <div className="flex items-baseline justify-between">
            <h2 className="font-heading text-2xl font-bold tracking-tight">Your mods</h2>
            <span className="font-mono text-xs text-muted-foreground" data-testid="project-count">
              {projects.data?.length ?? 0} project{(projects.data?.length ?? 0) === 1 ? "" : "s"}
            </span>
          </div>

          {projects.isError && (
            <p className="mt-6 text-sm text-muted-foreground">
              Projects are unavailable right now.
            </p>
          )}

          {!projects.isError && (projects.data?.length ?? 0) === 0 && !projects.isLoading && (
            <div
              className="mt-6 rounded-xl border border-dashed border-border p-10 text-center"
              data-testid="projects-empty"
            >
              <p className="text-muted-foreground">
                No mods yet — write a brief above and hit Generate.
              </p>
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.data?.map((p) => (
              <div
                key={p.id}
                className="group rounded-xl border border-border bg-card p-5 transition-[border-color,transform] duration-200 hover:-translate-y-[3px] hover:border-primary/40"
                data-testid={`project-card-${p.mod_id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-lg font-bold tracking-tight">{p.mod_name}</h3>
                    <p className="font-mono text-[11px] text-primary">{p.mod_id}</p>
                  </div>
                  {p.mature && <Badge variant="destructive">18+</Badge>}
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {p.element_count} elements
                  </Badge>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {TARGET_LABELS[p.target] ?? p.target}
                  </Badge>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {LOADER_LABELS[p.loader] ?? p.loader}
                  </Badge>
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <Link
                    to={`/project/${p.id}`}
                    className={buttonVariants({ size: "sm" })}
                    data-testid={`open-project-${p.mod_id}`}
                  >
                    Open <ArrowRight className="size-3.5" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove.mutate(p.id)}
                    data-testid={`delete-project-${p.mod_id}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
