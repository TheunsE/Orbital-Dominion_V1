import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { buildingName } = await request.json()
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  // 1. Get building costs and requirements
  const { data: buildingType, error: buildingError } = await supabase
    .from('building_types')
    .select('id, name, cost_metal, cost_crystal, cost_food, construction_time_seconds, requirements')
    .eq('name', buildingName)
    .single()

  if (buildingError) {
    return NextResponse.json({ error: buildingError.message }, { status: 500 })
  }

  // 2. Check for Shelter requirement
  if (buildingName !== 'Shelter') {
    const { data: shelter, error: shelterError } = await supabase
      .from('player_buildings')
      .select('id, construction_ends_at')
      .eq('player_id', session?.user.id)
      .eq('building_type_id', 1) // Assuming Shelter has id 1
      .single()

    if (shelterError || !shelter || new Date(shelter.construction_ends_at) > new Date()) {
      return NextResponse.json({ error: 'A completed Shelter is required' }, { status: 400 })
    }
  }

  // 3. Check player resources
  const { data: playerResources, error: resourceError } = await supabase
    .from('resources')
    .select('resource_type, quantity')
    .eq('player_id', session?.user.id)

  if (resourceError) {
    return NextResponse.json({ error: resourceError.message }, { status: 500 })
  }

  // 4. Validate resources
  const metal = playerResources.find(r => r.resource_type === 'metal')?.quantity ?? 0
  const crystal = playerResources.find(r => r.resource_type === 'crystal')?.quantity ?? 0
  const food = playerResources.find(r => r.resource_type === 'food')?.quantity ?? 0

  if (metal < buildingType.cost_metal || crystal < buildingType.cost_crystal || food < buildingType.cost_food) {
    return NextResponse.json({ error: 'Insufficient resources' }, { status: 400 })
  }

  // 5. Deduct resources
  const { error: deductError } = await supabase.rpc('deduct_resources', {
    p_player_id: session?.user.id,
    p_metal: buildingType.cost_metal,
    p_crystal: buildingType.cost_crystal,
    p_food: buildingType.cost_food,
  })

  if (deductError) {
    return NextResponse.json({ error: 'Failed to deduct resources' }, { status: 500 })
  }

  // 6. Add building to player_buildings
  const constructionEndsAt = new Date()
  constructionEndsAt.setSeconds(constructionEndsAt.getSeconds() + buildingType.construction_time_seconds)

  const { error: insertError } = await supabase
    .from('player_buildings')
    .insert({
      player_id: session?.user.id,
      building_type_id: buildingType.id,
      level: 1,
      construction_ends_at: constructionEndsAt.toISOString(),
    })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Building construction started' })
}
