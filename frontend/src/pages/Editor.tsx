import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Save } from "lucide-react";
import { toast } from "sonner";
import StudioHeader from "@/components/StudioHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiGet, apiPut } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import type { ModSpec, Project } from "@/lib/types";

type NumKeys = "stack_size" | "hardness" | "light_level" | "health" | "attack_damage" | "durability" | "damage" | "vein_size" | "veins_per_chunk" | "min_y" | "max_y";

function Field(props: {
  label: string;
  value: string | number;
  testid: string;
  type?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {props.label}
      </Label>
      <Input
        value={props.value}
        type={props.type ?? "text"}
        onChange={(e) => props.onChange(e.target.value)}
        className="h-9"
        data-testid={props.testid}
      />
    </div>
  );
}

export default function Editor() {
  const { id = "" } = useParams();
  const [spec, setSpec] = useState<ModSpec | null>(null);

  const project = useQuery<Project>({
    queryKey: ["project", id],
    queryFn: () => apiGet<Project>(`/projects/${id}`),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (project.data) setSpec(project.data.spec);
  }, [project.data]);

  const save = useMutation({
    mutationFn: () => apiPut<Project>(`/projects/${id}`, { spec }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["project", id] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Mod saved");
    },
    onError: () => toast.error("Could not save mod"),
  });

  function patch<K extends keyof ModSpec>(key: K, value: ModSpec[K]) {
    setSpec((s) => (s ? { ...s, [key]: value } : s));
  }

  function patchEntry(key: "items" | "blocks" | "mobs" | "gear" | "ores" | "recipes", idx: number, field: string, raw: string) {
    setSpec((s) => {
      if (!s) return s;
      const list = [...(s[key] as unknown as Record<string, unknown>[])];
      const numeric: NumKeys[] = ["stack_size", "hardness", "light_level", "health", "attack_damage", "durability", "damage", "vein_size", "veins_per_chunk", "min_y", "max_y"];
      const value = numeric.includes(field as NumKeys) ? Number(raw) || 0 : raw;
      list[idx] = { ...list[idx], [field]: value };
      return { ...s, [key]: list } as ModSpec;
    });
  }

  const counts = spec
    ? [
        ["Items", spec.items.length],
        ["Blocks", spec.blocks.length],
        ["Recipes", spec.recipes.length],
        ["Mobs", spec.mobs.length],
        ["Gear", spec.gear.length],
        ["Ores", spec.ores.length],
      ]
    : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StudioHeader />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <Link
          to="/dashboard"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
          data-testid="back-to-dashboard"
        >
          <ArrowLeft className="size-4" /> Workspace
        </Link>

        {project.isError && (
          <p className="mt-8 text-muted-foreground" data-testid="project-error">
            This mod could not be loaded.
          </p>
        )}

        {!spec && !project.isError && (
          <p className="mt-8 font-mono text-sm text-muted-foreground">Loading mod…</p>
        )}

        {spec && (
          <>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
              <div>
                <h1
                  className="font-heading text-4xl font-extrabold tracking-tight"
                  data-testid="mod-name-heading"
                >
                  {spec.mod_name}
                </h1>
                <p className="mt-1 font-mono text-sm text-primary" data-testid="mod-id-label">
                  {spec.mod_id}
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {spec.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => save.mutate()}
                  disabled={save.isPending}
                  data-testid="save-button"
                >
                  <Save className="size-4" /> {save.isPending ? "Saving…" : "Save"}
                </Button>
                <a
                  href={`/api/projects/${id}/export/java`}
                  className={buttonVariants({})}
                  data-testid="export-java-button"
                >
                  <Download className="size-4" /> Java source .zip
                </a>
                <a
                  href={`/api/projects/${id}/export/bedrock`}
                  className={buttonVariants({ variant: "outline" })}
                  data-testid="export-bedrock-button"
                >
                  <Download className="size-4" /> Bedrock .mcaddon
                </a>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2" data-testid="element-counts">
              {counts.map(([label, n]) => (
                <Badge key={String(label)} variant="secondary" className="font-mono text-[11px]">
                  {label}: {n}
                </Badge>
              ))}
            </div>

            <div className="mt-8 grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
              <Field
                label="Mod name"
                value={spec.mod_name}
                testid="field-mod-name"
                onChange={(v) => patch("mod_name", v)}
              />
              <Field
                label="Creative tab"
                value={spec.creative_tab}
                testid="field-creative-tab"
                onChange={(v) => patch("creative_tab", v)}
              />
            </div>

            <Tabs defaultValue="items" className="mt-8">
              <TabsList variant="line" data-testid="element-tabs">
                <TabsTrigger value="items" data-testid="tab-items">Items</TabsTrigger>
                <TabsTrigger value="blocks" data-testid="tab-blocks">Blocks</TabsTrigger>
                <TabsTrigger value="recipes" data-testid="tab-recipes">Recipes</TabsTrigger>
                <TabsTrigger value="mobs" data-testid="tab-mobs">Mobs</TabsTrigger>
                <TabsTrigger value="gear" data-testid="tab-gear">Tools &amp; Armor</TabsTrigger>
                <TabsTrigger value="ores" data-testid="tab-ores">Ores</TabsTrigger>
              </TabsList>

              <TabsContent value="items" className="pt-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  {spec.items.map((it, i) => (
                    <div key={it.id} className="rounded-xl border border-border bg-card p-5" data-testid={`item-card-${it.identifier}`}>
                      <p className="font-heading font-bold tracking-tight">{it.name}</p>
                      <p className="font-mono text-[11px] text-primary">{it.identifier}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{it.description}</p>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <Field label="Name" value={it.name} testid={`item-name-${i}`} onChange={(v) => patchEntry("items", i, "name", v)} />
                        <Field label="Stack size" type="number" value={it.stack_size} testid={`item-stack-${i}`} onChange={(v) => patchEntry("items", i, "stack_size", v)} />
                        <Field label="Rarity" value={it.rarity} testid={`item-rarity-${i}`} onChange={(v) => patchEntry("items", i, "rarity", v)} />
                        <Field label="Category" value={it.category} testid={`item-category-${i}`} onChange={(v) => patchEntry("items", i, "category", v)} />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="blocks" className="pt-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  {spec.blocks.map((b, i) => (
                    <div key={b.id} className="rounded-xl border border-border bg-card p-5" data-testid={`block-card-${b.identifier}`}>
                      <p className="font-heading font-bold tracking-tight">{b.name}</p>
                      <p className="font-mono text-[11px] text-primary">{b.identifier}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{b.description}</p>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <Field label="Name" value={b.name} testid={`block-name-${i}`} onChange={(v) => patchEntry("blocks", i, "name", v)} />
                        <Field label="Material" value={b.material} testid={`block-material-${i}`} onChange={(v) => patchEntry("blocks", i, "material", v)} />
                        <Field label="Hardness" type="number" value={b.hardness} testid={`block-hardness-${i}`} onChange={(v) => patchEntry("blocks", i, "hardness", v)} />
                        <Field label="Light level" type="number" value={b.light_level} testid={`block-light-${i}`} onChange={(v) => patchEntry("blocks", i, "light_level", v)} />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="recipes" className="pt-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  {spec.recipes.map((r) => (
                    <div key={r.id} className="rounded-xl border border-border bg-card p-5" data-testid={`recipe-card-${r.result_identifier}`}>
                      <div className="flex items-center justify-between">
                        <p className="font-heading font-bold tracking-tight">{r.result_identifier}</p>
                        <Badge variant="outline" className="font-mono text-[10px]">{r.type}</Badge>
                      </div>
                      {r.type === "shaped" ? (
                        <div className="mt-4 inline-grid grid-cols-3 gap-1.5 rounded-lg border-2 border-border bg-[#090D16] p-2 shadow-inner">
                          {r.pattern.flatMap((row, ri) =>
                            row.split("").map((ch, ci) => (
                              <div
                                key={`${ri}-${ci}`}
                                title={r.key[ch] ?? "empty"}
                                className="grid size-12 place-items-center rounded border border-border font-mono text-[10px] text-muted-foreground transition-colors duration-150 hover:border-primary/60"
                              >
                                {ch.trim() ? (r.key[ch]?.split(":").pop()?.slice(0, 4) ?? ch) : ""}
                              </div>
                            )),
                          )}
                        </div>
                      ) : (
                        <p className="mt-4 font-mono text-xs text-muted-foreground">
                          {r.ingredients.join(" + ") || "—"}
                        </p>
                      )}
                      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
                        yields {r.result_count}× {r.result_identifier}
                      </p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="mobs" className="pt-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  {spec.mobs.map((m, i) => (
                    <div key={m.id} className="rounded-xl border border-border bg-card p-5" data-testid={`mob-card-${m.identifier}`}>
                      <div className="flex items-center justify-between">
                        <p className="font-heading font-bold tracking-tight">{m.name}</p>
                        <Badge variant={m.hostile ? "destructive" : "secondary"}>
                          {m.hostile ? "hostile" : "passive"}
                        </Badge>
                      </div>
                      <p className="font-mono text-[11px] text-primary">{m.identifier}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{m.description}</p>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <Field label="Health" type="number" value={m.health} testid={`mob-health-${i}`} onChange={(v) => patchEntry("mobs", i, "health", v)} />
                        <Field label="Attack damage" type="number" value={m.attack_damage} testid={`mob-attack-${i}`} onChange={(v) => patchEntry("mobs", i, "attack_damage", v)} />
                      </div>
                      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
                        biomes: {m.spawn_biomes.join(", ") || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="gear" className="pt-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  {spec.gear.map((g, i) => (
                    <div key={g.id} className="rounded-xl border border-border bg-card p-5" data-testid={`gear-card-${g.identifier}`}>
                      <div className="flex items-center justify-between">
                        <p className="font-heading font-bold tracking-tight">{g.name}</p>
                        <Badge variant="outline" className="font-mono text-[10px]">{g.kind} · {g.slot}</Badge>
                      </div>
                      <p className="font-mono text-[11px] text-primary">{g.identifier}</p>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <Field label="Durability" type="number" value={g.durability} testid={`gear-durability-${i}`} onChange={(v) => patchEntry("gear", i, "durability", v)} />
                        <Field label="Damage" type="number" value={g.damage} testid={`gear-damage-${i}`} onChange={(v) => patchEntry("gear", i, "damage", v)} />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="ores" className="pt-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  {spec.ores.map((o, i) => (
                    <div key={o.id} className="rounded-xl border border-border bg-card p-5" data-testid={`ore-card-${o.identifier}`}>
                      <p className="font-heading font-bold tracking-tight">{o.name}</p>
                      <p className="font-mono text-[11px] text-primary">{o.identifier}</p>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <Field label="Vein size" type="number" value={o.vein_size} testid={`ore-vein-${i}`} onChange={(v) => patchEntry("ores", i, "vein_size", v)} />
                        <Field label="Veins / chunk" type="number" value={o.veins_per_chunk} testid={`ore-count-${i}`} onChange={(v) => patchEntry("ores", i, "veins_per_chunk", v)} />
                        <Field label="Min Y" type="number" value={o.min_y} testid={`ore-miny-${i}`} onChange={(v) => patchEntry("ores", i, "min_y", v)} />
                        <Field label="Max Y" type="number" value={o.max_y} testid={`ore-maxy-${i}`} onChange={(v) => patchEntry("ores", i, "max_y", v)} />
                      </div>
                      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
                        dimension: {o.dimension}
                      </p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
