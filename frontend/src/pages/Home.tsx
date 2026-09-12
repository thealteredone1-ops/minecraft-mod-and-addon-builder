import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Boxes,
  Cpu,
  Download,
  Hammer,
  Package,
  Pickaxe,
  Rabbit,
  Sparkles,
  Wand2,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StudioHeader from "@/components/StudioHeader";
import { useSession } from "@/lib/session";

const ELEMENTS = [
  { icon: Package, label: "Items", copy: "Stack sizes, rarity, creative tab placement." },
  { icon: Boxes, label: "Blocks", copy: "Hardness, blast resistance, light emission, drops." },
  { icon: Hammer, label: "Tools & Armor", copy: "Durability, damage, mining level, armor points." },
  { icon: Rabbit, label: "Mobs", copy: "Health, speed, attack, hostility, spawn biomes." },
  { icon: Pickaxe, label: "Ores + Worldgen", copy: "Vein size, frequency, Y-range, dimension." },
  { icon: Wand2, label: "Recipes", copy: "Shaped, shapeless and smelting — both editions." },
];

export default function Home() {
  const { data: user } = useSession();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StudioHeader />

      <main>
        <section className="relative overflow-hidden border-b border-border/70">
          <div className="grid-haze pointer-events-none absolute inset-0 opacity-50" />
          <div className="pointer-events-none absolute -left-40 top-[-10rem] size-[32rem] rounded-full bg-primary/12 blur-3xl" />
          <div className="pointer-events-none absolute right-[-12rem] top-40 size-[26rem] rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-[1.15fr_0.85fr] lg:py-32">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">
                Java Forge / Fabric · Bedrock Addons
              </p>
              <h1 className="mt-5 max-w-2xl font-heading text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
                Describe the mod.
                <br />
                <span className="bg-gradient-to-r from-primary via-sky-400 to-amber-400 bg-clip-text text-transparent animate-mc-sweep">
                  Download the project.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                ModCraft Studio turns one plain-English brief into a full mod definition — items,
                blocks, recipes, mobs, gear and ore worldgen — then exports a buildable Forge/Fabric
                Gradle project and a ready-to-import Bedrock <code className="font-mono text-sm text-primary">.mcaddon</code>.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  to={user ? "/dashboard" : "/auth"}
                  className={buttonVariants({ size: "lg" })}
                  data-testid="hero-cta"
                >
                  <Sparkles className="size-4" />
                  {user ? "Open your workspace" : "Build your first mod free"}
                </Link>
                <Link
                  to="/pricing"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                  data-testid="hero-pricing"
                >
                  See Pro & 18+ unlock
                </Link>
              </div>

              <p className="mt-5 font-mono text-xs text-muted-foreground">
                Unlimited free mods · no credit card · Minecraft 1.20+
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.12, ease: "easeOut" }}
              className="relative"
            >
              <div className="animate-mc-float rounded-2xl border border-border bg-card p-5 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <span className="size-2.5 rounded-full bg-destructive/70" />
                  <span className="size-2.5 rounded-full bg-amber-500/70" />
                  <span className="size-2.5 rounded-full bg-primary/70" />
                  <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                    abyssal_depths / spec.json
                  </span>
                </div>
                <pre className="mt-4 overflow-x-auto font-mono text-[12px] leading-relaxed text-slate-300">
{`{
  "mod_id": "abyssal_depths",
  "items":  [ "abyssal_pearl", "tide_core" ],
  "blocks": [ "pressure_coral", "glow_kelp" ],
  "gear":   [ "trident_of_depths" ],
  "ores":   [ { "abyssite_ore": "y -54..8" } ],
  "mobs":   [ { "deep_lurker": { "hp": 44 } } ]
}`}
                </pre>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 font-mono text-[11px] text-primary">
                    <Download className="mb-1 size-3.5" /> java-forge.zip
                  </div>
                  <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 font-mono text-[11px] text-sky-300">
                    <Download className="mb-1 size-3.5" /> .mcaddon
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
              What gets generated
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Every element, wired for both editions
            </h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ELEMENTS.map((el, i) => (
              <motion.div
                key={el.label}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card p-5 transition-[border-color,transform] duration-200 hover:-translate-y-[3px] hover:border-primary/40"
                data-testid={`feature-${el.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
              >
                <el.icon className="size-5 text-primary" />
                <h3 className="mt-3 font-heading text-base font-bold tracking-tight">{el.label}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{el.copy}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="border-y border-border/70 bg-card/40">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 md:grid-cols-3">
            {[
              { n: "01", t: "Brief it", d: "One paragraph. Pick Java loader, Bedrock, or both." },
              { n: "02", t: "Tune it", d: "Edit any item, block, mob, recipe or ore in the workspace." },
              { n: "03", t: "Ship it", d: "Download the Gradle source zip and the .mcaddon." },
            ].map((s) => (
              <div key={s.n} className="flex gap-4">
                <span className="font-mono text-sm text-primary">{s.n}</span>
                <div>
                  <h3 className="font-heading text-lg font-bold tracking-tight">{s.t}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto flex max-w-4xl flex-col items-start gap-5 px-6 py-20">
          <Badge variant="outline" className="font-mono text-[11px] uppercase tracking-[0.2em]">
            <Cpu className="size-3.5" /> Powered by Claude Sonnet 4.5
          </Badge>
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Stop hand-writing registry boilerplate.
          </h2>
          <p className="text-muted-foreground">
            Generated projects ship with <code className="font-mono text-primary">mods.toml</code>,
            deferred registries, blockstates, models, loot tables, lang files, recipe JSON and
            worldgen placed features — plus a Bedrock behaviour and resource pack pair.
          </p>
          <Link to={user ? "/dashboard" : "/auth"} className={buttonVariants({ size: "lg" })} data-testid="footer-cta">
            Start building
          </Link>
        </section>
      </main>

      <footer className="border-t border-border/70 py-8">
        <p className="mx-auto max-w-7xl px-6 font-mono text-xs text-muted-foreground">
          ModCraft Studio — not affiliated with Mojang or Microsoft.
        </p>
      </footer>
    </div>
  );
}
