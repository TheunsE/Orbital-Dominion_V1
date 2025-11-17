import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { buildingTypeId } = await req.json()

  // In a real application, you would have more complex logic here,
  // such as checking if the user has enough resources to build the building.
  const { data, error } = await supabase
    .from('player_buildings')
    .insert({ player_id: user.id, building_type_id: buildingTypeId, level: 1 })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
