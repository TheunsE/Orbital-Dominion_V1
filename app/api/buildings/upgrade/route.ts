import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { buildingId } = await req.json();

  if (!buildingId) {
    return NextResponse.json({ error: 'Building ID is required' }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('enqueue_building_upgrade', {
    p_player_id: user.id,
    p_building_id: buildingId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
