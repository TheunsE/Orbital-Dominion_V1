export interface BuildingType {
  id: number
  name: string
  cost_metal: number
  cost_crystal: number
  cost_food: number
  tier: number
  power_usage: number
  requirements: {
    buildings: { name: string; level: number }[]
  }
  base_production: number
  production_bonus_per_level: number
  base_storage: number
  storage_bonus_per_level: number
  base_power_generation: number
  power_generation_per_level: number
  max_level: number
  construction_time_seconds: number
  created_at: string
}

export interface ResourceDefinition {
  id: number
  name: string
  description: string | null
  created_at: string
}


export type PlayerAccount = {
  id: string;
  email: string;
  role: string;
}

export interface PlayerBuilding {
  id: number
  player_id: string
  building_type_id: number
  level: number
  construction_ends_at: string
  created_at: string
  building_types: BuildingType
}

export interface ShipType {
  id: number
  name: string
  tier: number
  role: string
  unlock_requirement: {
    buildings: { name: string; level: number }[]
  }
  metal_cost: number
  food_cost: number
  energy_cost: number
  attack: number
  defense: number
  speed: number
  hp: number
  crew_food_per_hour: number
  created_at: string
}

export interface PlayerShip {
  id: number
  player_id: string
  ship_type_id: number
  quantity: number
  created_at: string
  ship_types: {
    id: number
    name: string
    tier: number
    role: string
    metal_cost: number
    food_cost: number
    energy_cost: number
    attack: number
    defense: number
    speed: number
    hp: number
    crew_food_per_hour: number
  }
}

export interface TechType {
  id: number
  name: string
  unlocks: string
  required_lab_level: number
  created_at: string
}

export interface PlayerTech {
  id: number
  player_id: string
  tech_type_id: number
  created_at: string
}
