import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { playerBuildingId } = await req.json()
  const supabase = createRouteHandlerClient({ cookies })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Get the player's building and its type
  const { data: playerBuilding, error: buildingError } = await supabase
    .from('player_buildings')
    .select('level, building_types(cost, max_level)')
    .eq('id', playerBuildingId)
    .eq('player_id', user.id)
    .single()

  if (buildingError || !playerBuilding) {
    return NextResponse.json({ error: 'Player building not found' }, { status: 404 })
  }
  
  const buildingType = Array.isArray(playerBuilding.building_types) ? playerBuilding.building_types[0] : playerBuilding.building_types;


  // 2. Check if the building is already at max level
  if (playerBuilding.level >= buildingType.max_level) {
    return NextResponse.json({ error: 'Building is already at max level' }, { status: 400 })
  }

  // 3. Calculate upgrade cost (e.g., base_cost * level)
  const upgradeCost = buildingType.cost * playerBuilding.level

  // 4. Get player's metal resource
  const { data: playerResource, error: resourceError } = await supabase
    .from('resources')
    .select('quantity')
    .eq('player_id', user.id)
    .eq('resource_type', 'Metal')
    .single()

  if (resourceError || !playerResource) {
    return NextResponse.json({ error: 'Player resource not found' }, { status: 404 })
  }

  // 5. Check for sufficient resources
  if (playerResource.quantity < upgradeCost) {
    return NextResponse.json({ error: 'Insufficient resources for upgrade' }, { status: 400 })
  }

  // 6. Deduct resources and update building level
  const newQuantity = playerResource.quantity - upgradeCost
  const { error: updateError } = await supabase
    .from('resources')
    .update({ quantity: newQuantity })
    .eq('player_id', user.id)
    .eq('resource_type', 'Metal')

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update resources' }, { status: 500 })
  }

  const { error: upgradeError } = await supabase
    .from('player_buildings')
    .update({ level: playerBuilding.level + 1 })
    .eq('id', playerBuildingId)

  if (upgradeError) {
    return NextResponse.json({ error: 'Failed to upgrade building' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Building upgraded successfully' })
}
