import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { playerBuildingId } = await req.json()
  const supabase = createRouteHandlerClient({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Get the player's building and its type
  const { data: playerBuilding, error: buildingError } = await supabase
    .from('player_buildings')
    .select('level, building_types(cost_metal, cost_crystal, cost_food, max_level)')
    .eq('id', playerBuildingId)
    .eq('player_id', session.user.id)
    .single()

  if (buildingError || !playerBuilding) {
    return NextResponse.json({ error: 'Player building not found' }, { status: 404 })
  }

  const buildingType = Array.isArray(playerBuilding.building_types)
    ? playerBuilding.building_types[0]
    : playerBuilding.building_types

  // 2. Check if the building is already at max level
  if (playerBuilding.level >= buildingType.max_level) {
    return NextResponse.json({ error: 'Building is already at max level' }, { status: 400 })
  }

  // 3. Calculate upgrade cost (e.g., base_cost * 1.5^level)
  const upgradeCostMetal = Math.floor(buildingType.cost_metal * Math.pow(1.5, playerBuilding.level))
  const upgradeCostCrystal = Math.floor(buildingType.cost_crystal * Math.pow(1.5, playerBuilding.level))
  const upgradeCostFood = Math.floor(buildingType.cost_food * Math.pow(1.5, playerBuilding.level))

  // 4. Get player's resources
  const { data: playerResources, error: resourceError } = await supabase
    .from('resources')
    .select('resource_type, quantity')
    .eq('player_id', session.user.id)

  if (resourceError) {
    return NextResponse.json({ error: resourceError.message }, { status: 500 })
  }

  // 5. Validate resources
  const metal = playerResources.find(r => r.resource_type === 'metal')?.quantity ?? 0
  const crystal = playerResources.find(r => r.resource_type === 'crystal')?.quantity ?? 0
  const food = playerResources.find(r => r.resource_type === 'food')?.quantity ?? 0

  if (metal < upgradeCostMetal || crystal < upgradeCostCrystal || food < upgradeCostFood) {
    return NextResponse.json({ error: 'Insufficient resources for upgrade' }, { status: 400 })
  }

  // 6. Deduct resources
  const { error: deductError } = await supabase.rpc('deduct_resources', {
    p_player_id: session.user.id,
    p_metal: upgradeCostMetal,
    p_crystal: upgradeCostCrystal,
    p_food: upgradeCostFood,
  })

  if (deductError) {
    return NextResponse.json({ error: 'Failed to deduct resources' }, { status: 500 })
  }

  // 7. Update building level
  const { error: upgradeError } = await supabase
    .from('player_buildings')
    .update({ level: playerBuilding.level + 1 })
    .eq('id', playerBuildingId)

  if (upgradeError) {
    return NextResponse.json({ error: 'Failed to upgrade building' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Building upgraded successfully' })
}
