export interface PlayerAccount {
  id: string
  username: string
  email: string | null
  role: string
  created_at: string
}

export interface BuildingType {
  id: number
  name: string
  tier: number
  cost_metal: number
  cost_crystal: number
  cost_food: number
  power_usage: number
  requirements: any // jsonb in DB – can be typed better later
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

// This is what comes back from: SELECT *, building_types(*) FROM player_buildings
export interface PlayerBuilding {
  id: number
  player_id: string
  building_type_id: number
  level: number
  construction_ends_at: string | null // null = not building/upgrading
  created_at: string

  // This is the JOINED data from building_types table
  building_types: BuildingType
}

// Player's current resources (metal, crystal, food)
export interface Resource {
  id: number
  player_id: string
  resource_type: 'metal' | 'crystal' | 'food'
  quantity: number
  created_at: string
}

// Admin table – defines which resources exist (metal, crystal, etc.)
export interface ResourceDefinition {
  id: number
  name: string
  description: string | null
  created_at: string
}

export interface ShipType {
  id: number
  name: string
  tier: number
  role: string | null
  unlock_requirement: any
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

// This is what comes back from: SELECT *, ship_types(*) FROM player_ships
export interface PlayerShip {
  id: number
  player_id: string
  ship_type_id: number
  quantity: number
  created_at: string

  // This is the JOINED data from ship_types table – THIS WAS MISSING BEFORE
  ship_types: {
    id: number
    name: string
    tier: number
    role: string | null
    unlock_requirement: any
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
}

// Optional: For future use (tech, artifacts, etc.)
export interface TechType {
  id: number
  name: string
  unlocks: string | null
  required_lab_level: number
  created_at: string
}

export interface PlayerTech {
  id: number
  player_id: string
  tech_type_id: number
  created_at: string
  tech_types: {
    id: number
    name: string
    unlocks: string | null
    required_lab_level: number
    created_at: string
  }
}
