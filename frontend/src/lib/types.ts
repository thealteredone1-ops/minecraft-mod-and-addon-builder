// Hand-written mirrors of the Pydantic models in backend/models/schemas.py.
// Change one, change the other in the same edit.

export interface User {
  id: string;
  email: string;
  display_name: string;
  plan: "free" | "pro";
  mods_generated: number;
  free_limit: number;
}

export interface ModItem {
  id: string;
  name: string;
  identifier: string;
  description: string;
  category: string;
  stack_size: number;
  rarity: string;
  texture_hint: string;
}

export interface ModBlock {
  id: string;
  name: string;
  identifier: string;
  description: string;
  material: string;
  hardness: number;
  resistance: number;
  light_level: number;
  drops: string;
  texture_hint: string;
}

export interface ModRecipe {
  id: string;
  result_identifier: string;
  result_count: number;
  type: "shaped" | "shapeless" | "smelting";
  pattern: string[];
  key: Record<string, string>;
  ingredients: string[];
}

export interface ModMob {
  id: string;
  name: string;
  identifier: string;
  description: string;
  health: number;
  movement_speed: number;
  attack_damage: number;
  hostile: boolean;
  spawn_biomes: string[];
}

export interface ModGear {
  id: string;
  name: string;
  identifier: string;
  kind: "tool" | "armor";
  slot: string;
  durability: number;
  damage: number;
  mining_level: number;
  armor_points: number;
}

export interface ModOre {
  id: string;
  name: string;
  identifier: string;
  drop_identifier: string;
  vein_size: number;
  veins_per_chunk: number;
  min_y: number;
  max_y: number;
  dimension: string;
}

export interface ModSpec {
  mod_name: string;
  mod_id: string;
  description: string;
  creative_tab: string;
  mature: boolean;
  items: ModItem[];
  blocks: ModBlock[];
  recipes: ModRecipe[];
  mobs: ModMob[];
  gear: ModGear[];
  ores: ModOre[];
}

export interface Project {
  id: string;
  owner_id: string;
  prompt: string;
  target: "both" | "java" | "bedrock";
  loader: "forge" | "fabric";
  mature: boolean;
  spec: ModSpec;
  created_at: string;
  updated_at: string;
}

export interface ProjectSummary {
  id: string;
  mod_name: string;
  mod_id: string;
  description: string;
  target: string;
  loader: string;
  mature: boolean;
  element_count: number;
  updated_at: string;
}

export interface GenerateRequest {
  prompt: string;
  target: "both" | "java" | "bedrock";
  loader: "forge" | "fabric";
  mature: boolean;
}

export interface Plan {
  lookup_key: string;
  name: string;
  price: string;
  interval: string;
}

export interface CheckoutResponse {
  checkout_url: string;
  session_id: string;
}

export interface PaymentStatus {
  session_id: string;
  status: string;
  payment_status: string;
}

export interface MessageResponse {
  message: string;
}
