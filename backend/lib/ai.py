"""AI mod generation via the Emergent universal LLM key (Claude Sonnet 4.5)."""
from __future__ import annotations

import json
import os
import re
import uuid

from emergentintegrations.llm.chat import LlmChat, UserMessage

from models.schemas import ModSpec

SYSTEM = """You are a senior Minecraft mod engineer. You design mods that work on BOTH
Java Edition (Forge/Fabric, MC 1.20+) and Bedrock Edition addons.

Return ONLY a single JSON object, no prose, no markdown fences. Schema:
{
 "mod_name": str, "mod_id": str (lowercase a-z0-9_ only), "description": str,
 "creative_tab": str,
 "items": [{"name","identifier","description","category","stack_size","rarity","texture_hint"}],
 "blocks": [{"name","identifier","description","material","hardness","resistance","light_level","drops","texture_hint"}],
 "recipes": [{"result_identifier","result_count","type":"shaped|shapeless|smelting","pattern":["xxx","xxx","xxx"],"key":{"x":"minecraft:diamond"},"ingredients":[]}],
 "mobs": [{"name","identifier","description","health","movement_speed","attack_damage","hostile","spawn_biomes":[]}],
 "gear": [{"name","identifier","kind":"tool|armor","slot","durability","damage","mining_level","armor_points"}],
 "ores": [{"name","identifier","drop_identifier","vein_size","veins_per_chunk","min_y","max_y","dimension"}]
}

Rules:
- Every `identifier` is lowercase snake_case WITHOUT a namespace prefix.
- Produce a coherent, playable mod: 4-8 items, 3-6 blocks, 3-6 recipes, 1-3 mobs,
  2-6 gear pieces, 1-3 ores. Recipes must reference identifiers you defined or
  vanilla ids like "minecraft:stick".
- Shaped recipe patterns are exactly 3 strings of exactly 3 characters; use a space for empty.
- Keep everything family-friendly unless the request is explicitly marked mature."""


def _slug(text: str) -> str:
    s = re.sub(r"[^a-z0-9_]+", "_", text.lower()).strip("_")
    return s or "custom_mod"


def _coerce(raw: dict, mature: bool) -> ModSpec:
    raw = dict(raw)
    raw["mod_id"] = _slug(str(raw.get("mod_id") or raw.get("mod_name") or "custom_mod"))
    raw["mature"] = mature
    for key in ("items", "blocks", "recipes", "mobs", "gear", "ores"):
        entries = raw.get(key) or []
        cleaned = []
        for e in entries:
            if not isinstance(e, dict):
                continue
            e.setdefault("id", str(uuid.uuid4()))
            if "identifier" in e:
                e["identifier"] = _slug(str(e["identifier"]))
            if key == "recipes":
                pattern = e.get("pattern") or ["   ", "   ", "   "]
                e["pattern"] = [str(row).ljust(3)[:3] for row in pattern][:3]
                while len(e["pattern"]) < 3:
                    e["pattern"].append("   ")
                e["result_identifier"] = _slug(str(e.get("result_identifier", "unknown")))
            cleaned.append(e)
        raw[key] = cleaned
    return ModSpec(**raw)


async def generate_mod_spec(prompt: str, mature: bool) -> ModSpec:
    key = os.environ.get("EMERGENT_LLM_KEY")
    if not key:
        raise RuntimeError("EMERGENT_LLM_KEY missing")
    audience = (
        "This mod is flagged MATURE (18+): darker themes, gore and intense combat are allowed, "
        "but never sexual content involving minors and nothing illegal."
        if mature
        else "Keep the mod family-friendly."
    )
    chat = LlmChat(
        api_key=key,
        session_id=f"modgen-{uuid.uuid4()}",
        system_message=SYSTEM,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")
    reply = await chat.send_message(
        UserMessage(text=f"{audience}\n\nMod request:\n{prompt}\n\nReturn the JSON object now.")
    )
    text = str(reply).strip()
    text = re.sub(r"^```(?:json)?|```$", "", text, flags=re.MULTILINE).strip()
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("model did not return JSON")
    data = json.loads(text[start : end + 1])
    return _coerce(data, mature)
