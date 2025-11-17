import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { shipTypeId, quantity } = await req.json()
  const supabase = createRouteHandlerClient({ cookies })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Get ship type details (costs)
  const { data: shipType, error: shipError } = await supabase
    .from('ship_types')
    .select('metal_cost, food_cost, energy_cost')
    .eq('id', shipTypeId)
    .single()

  if (shipError || !shipType) {
    return NextResponse.json({ error: 'Ship type not found' }, { status: 404 })
  }

  // 2. Get player's resources
  const { data: playerResources, error: resourceError } = await supabase
    .from('resources')
    .select('resource_type, quantity')
    .eq('player_id', user.id)

  if (resourceError || !playerResources) {
    return NextResponse.json({ error: 'Player resources not found' }, { status: 404 })
  }

  const resources = playerResources.reduce((acc: { [key: string]: number }, r) => {
    acc[r.resource_type] = r.quantity
    return acc
  }, {})

  // 3. Check for sufficient resources
  const totalMetalCost = shipType.metal_cost * quantity
  const totalFoodCost = shipType.food_cost * quantity
  const totalEnergyCost = shipType.energy_cost * quantity

  if (resources['Metal'] < totalMetalCost || resources['Food'] < totalFoodCost || resources['Energy'] < totalEnergyCost) {
    return NextResponse.json({ error: 'Insufficient resources to build ships' }, { status: 400 })
  }

  // 4. Deduct resources
  // This should be in a transaction, but for simplicity...
  const updatePromises = [
    supabase.from('resources').update({ quantity: resources['Metal'] - totalMetalCost }).eq('player_id', user.id).eq('resource_type', 'Metal'),
    supabase.from('resources').update({ quantity: resources['Food'] - totalFoodCost }).eq('player_id', user.id).eq('resource_type', 'Food'),
    supabase.from('resources').update({ quantity: resources['Energy'] - totalEnergyCost }).eq('player_id', user.id).eq('resource_type', 'Energy'),
  ]
  await Promise.all(updatePromises)
  
  // 5. Add ships to player's fleet
  const { error: insertError } = await supabase
    .from('player_ships')
    .insert({ player_id: user.id, ship_type_id: shipTypeId, quantity: quantity })

  if (insertError) {
    return NextResponse.json({ error: 'Failed to build ships' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Ships built successfully' })
}
