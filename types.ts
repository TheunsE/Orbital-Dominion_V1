export type BuildingType = {
  id: number;
  name: string;
  cost: number;
  tier: number;
  power_usage: number;
  requirements: Record<string, any>; // JSONB
  base_production: number;
  production_bonus_per_level: number;
  base_storage: number;
  storage_bonus_per_level: number;
  base_power_generation: number;
  power_generation_per_level: number;
  max_level: number;
  construction_time_seconds: number;
};

export type ResourceDefinition = {
  id: number;
  name:string;
}

export type PlayerAccount = {
  id: string;
  email: string;
  role: string;
}

export type PlayerResource = {
  id: number;
  resource_type: string;
  quantity: number;
}

export type PlayerBuilding = {
  id: number;
  level: number;
  construction_ends_at: string | null; // timestamptz
  building_types: BuildingType;
}

export type ShipType = {
    id: number;
    name: string;
    tier: number;
    role: string;
    unlock_requirement: Record<string, any>; // JSONB
    metal_cost: number;
    food_cost: number;
    energy_cost: number;
    attack: number;
    defense: number;
    speed: number;
    hp: number;
    crew_food_per_hour: number;
};

export type PlayerShip = {
    id: number;
    player_id: string;
    ship_type_id: number;
    quantity: number;
    ship_types: ShipType;
};

export type TechType = {
    id: number;
    name: string;
    unlocks: string;
    required_lab_level: number;
};

export type PlayerTech = {
    id: number;
    player_id: string;
    tech_type_id: number;
    tech_types: TechType;
};

export type ArtifactType = {
    id: number;
    name: string;
    buff: string;
    source: string;
};

export type PlayerArtifact = {
    id: number;
    player_id: string;
    artifact_type_id: number;
    artifact_types: ArtifactType;
};
