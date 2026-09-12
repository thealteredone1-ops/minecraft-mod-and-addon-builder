"""Pydantic v2 models. Every model here has a hand-written TS mirror in frontend/src/lib/types.ts."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uid() -> str:
    return str(uuid.uuid4())


# ---------- auth ----------
class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    display_name: str = Field(min_length=1, max_length=60)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class User(BaseModel):
    id: str
    email: str
    display_name: str
    plan: Literal["free", "pro"] = "free"
    mods_generated: int = 0
    free_limit: int = 3


# ---------- mod elements ----------
class ModItem(BaseModel):
    id: str = Field(default_factory=_uid)
    name: str
    identifier: str
    description: str = ""
    category: str = "misc"
    stack_size: int = 64
    rarity: str = "common"
    texture_hint: str = ""


class ModBlock(BaseModel):
    id: str = Field(default_factory=_uid)
    name: str
    identifier: str
    description: str = ""
    material: str = "stone"
    hardness: float = 3.0
    resistance: float = 3.0
    light_level: int = 0
    drops: str = ""
    texture_hint: str = ""


class ModRecipe(BaseModel):
    id: str = Field(default_factory=_uid)
    result_identifier: str
    result_count: int = 1
    type: Literal["shaped", "shapeless", "smelting"] = "shaped"
    pattern: List[str] = Field(default_factory=lambda: ["   ", "   ", "   "])
    key: dict[str, str] = Field(default_factory=dict)
    ingredients: List[str] = Field(default_factory=list)


class ModMob(BaseModel):
    id: str = Field(default_factory=_uid)
    name: str
    identifier: str
    description: str = ""
    health: float = 20.0
    movement_speed: float = 0.25
    attack_damage: float = 3.0
    hostile: bool = True
    spawn_biomes: List[str] = Field(default_factory=list)


class ModGear(BaseModel):
    id: str = Field(default_factory=_uid)
    name: str
    identifier: str
    kind: Literal["tool", "armor"] = "tool"
    slot: str = "sword"
    durability: int = 250
    damage: float = 6.0
    mining_level: int = 2
    armor_points: int = 0


class ModOre(BaseModel):
    id: str = Field(default_factory=_uid)
    name: str
    identifier: str
    drop_identifier: str = ""
    vein_size: int = 6
    veins_per_chunk: int = 8
    min_y: int = -60
    max_y: int = 30
    dimension: str = "overworld"


class ModSpec(BaseModel):
    mod_name: str = "New Mod"
    mod_id: str = "newmod"
    description: str = ""
    creative_tab: str = "New Mod"
    mature: bool = False
    items: List[ModItem] = Field(default_factory=list)
    blocks: List[ModBlock] = Field(default_factory=list)
    recipes: List[ModRecipe] = Field(default_factory=list)
    mobs: List[ModMob] = Field(default_factory=list)
    gear: List[ModGear] = Field(default_factory=list)
    ores: List[ModOre] = Field(default_factory=list)


class Project(BaseModel):
    id: str = Field(default_factory=_uid)
    owner_id: str
    prompt: str = ""
    target: Literal["both", "java", "bedrock"] = "both"
    loader: Literal["forge", "fabric"] = "forge"
    mature: bool = False
    spec: ModSpec = Field(default_factory=ModSpec)
    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)


class ProjectSummary(BaseModel):
    id: str
    mod_name: str
    mod_id: str
    description: str
    target: str
    loader: str
    mature: bool
    element_count: int
    updated_at: datetime


class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=8, max_length=2000)
    target: Literal["both", "java", "bedrock"] = "both"
    loader: Literal["forge", "fabric"] = "forge"
    mature: bool = False


class UpdateSpecRequest(BaseModel):
    spec: ModSpec


# ---------- payments ----------
class CheckoutRequest(BaseModel):
    lookup_key: str
    origin_url: str


class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str


class PaymentStatus(BaseModel):
    session_id: str
    status: str
    payment_status: str


class MessageResponse(BaseModel):
    message: str


Optional  # noqa: B018  (kept for typing import parity)
