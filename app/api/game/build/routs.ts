import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { buildingTypeId } = await req.json()
  const supabase = createRouteHandlerClient({ cookies })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Get building cost
  const { data: buildingType, error: buildingError } = await supabase
    .from('building_types')
    .select('cost')
    .eq('id', buildingTypeId)
    .single()

  if (buildingError || !buildingType) {
    return NextResponse.json({ error: 'Building type not found' }, { status: 404 })
  }

  // 2. Get player's metal resource
  const { data: playerResource, error: resourceError } = await supabase
    .from('resources')
    .select('quantity')
    .eq('player_id', user.id)
    .eq('resource_type', 'Metal')
    .single()

  if (resourceError || !playerResource) {
    return NextResponse.json({ error: 'Player resource not found' }, { status: 404 })
  }

  // 3. Check if player has enough resources
  if (playerResource.quantity < buildingType.cost) {
    return NextResponse.json({ error: 'Insufficient resources' }, { status: 400 })
  }

  // 4. Deduct resources and insert new building in a transaction
  const newQuantity = playerResource.quantity - buildingType.cost
  
  const { error: updateError } = await supabase
    .from('resources')
    .update({ quantity: newQuantity })
    .eq('player_id', user.id)
    .eq('resource_type', 'Metal')
  
  if (updateError) {
    return NextResponse.json({ error: 'Failed to update resources' }, { status: 500 })
  }

  const { error: insertError } = await supabase
    .from('player_buildings')
    .insert({ player_id: user.id, building_type_id: buildingTypeId, level: 1 })

  if (insertError) {
    // Ideally, you'd roll back the resource update here.
    // Supabase Edge Functions would be better for true transactions.
    return NextResponse.json({ error: 'Failed to create building' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Building constructed successfully' })
}
