import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { techTypeId } = await req.json()
  const supabase = createRouteHandlerClient({ cookies })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Get the technology details
  const { data: techType, error: techError } = await supabase
    .from('tech_types')
    .select('required_lab_level')
    .eq('id', techTypeId)
    .single()

  if (techError || !techType) {
    return NextResponse.json({ error: 'Technology not found' }, { status: 404 })
  }

  // 2. Check if the player has a Research Lab of the required level
  const { data: researchLab, error: labError } = await supabase
    .from('player_buildings')
    .select('level')
    .eq('player_id', user.id)
    .eq('building_type_id', (await supabase.from('building_types').select('id').eq('name', 'Research Lab')).data[0].id)
    .single()
    
  if (labError || !researchLab || researchLab.level < techType.required_lab_level) {
    return NextResponse.json({ error: 'Research Lab level not high enough' }, { status: 400 })
  }
  
  // 3. (Optional) Check for resource costs for research, if any.
  
  // 4. Grant the technology to the player
  const { error: insertError } = await supabase
    .from('player_techs')
    .insert({ player_id: user.id, tech_type_id: techTypeId })

  if (insertError) {
    return NextResponse.json({ error: 'Failed to unlock technology' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Technology unlocked successfully' })
}
