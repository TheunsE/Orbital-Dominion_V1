'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient();

export default function ShipPage() {
  const { id } = useParams();
  const shipTypeId = Number(id);

  const [ship, setShip] = useState<any>(null);
  const [type, setType] = useState<any>(null);
  const [resources, setResources] = useState({ metal: 0, food: 0 });
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [s, t, r] = await Promise.all([
        supabase.from('player_ships').select('*').eq('player_id', user.id).eq('ship_type_id', shipTypeId).single(),
        supabase.from('ship_types').select('*').eq('id', shipTypeId).single(),
        supabase.from('resources').select('*').eq('player_id', user.id)
      ]);

      setShip(s.data || { quantity: 0 });
      setType(t.data);

      const resMap = (r.data || []).reduce((acc: any, row: any) => {
        if (row.resource_type === 'metal' || row.resource_type === 'food') acc[row.resource_type] = row.quantity;
        return acc;
      }, { metal: 0, food: 0 });
      setResources(resMap);
    };
    load();
  }, [shipTypeId]);

  if (!type) return <div className="text-white p-10">Loading...</div>;

  const canBuild = resources.metal >= type.metal_cost && resources.food >= type.food_cost;

  const build = async () => {
    if (!canBuild) return;

    await Promise.all([
      supabase.from('resources').update({ quantity: resources.metal - type.metal_cost }).eq('player_id', userId).eq('resource_type', 'metal'),
      supabase.from('resources').update({ quantity: resources.food - type.food_cost }).eq('player_id', userId).eq('resource_type', 'food'),
      supabase.from('player_ships').upsert({
        player_id: userId,
        ship_type_id: shipTypeId,
        quantity: ship.quantity + 1
      }, { onConflict: 'player_id,ship_type_id' })
    ]);

    setShip({ ...ship, quantity: ship.quantity + 1 });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-12">
      <Link href="/game" className="text-cyan-400 hover:underline mb-6 inline-block">Back</Link>
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl p-10">
        <h1 className="text-5xl font-bold mb-6">{type.name}</h1>
        <p className="text-3xl mb-8">Owned: <span className="text-cyan-400">{ship.quantity}</span></p>

        <button
          onClick={build}
          disabled={!canBuild}
          className={`w-full py-6 text-3xl font-bold rounded-lg ${canBuild ? 'bg-cyan-600 hover:bg-cyan-500 text-black' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
        >
          {canBuild ? `Build Ship • ${type.metal_cost}M + ${type.food_cost}F` : 'Not enough resources'}
        </button>
      </div>
    </div>
  );
}
