// app/game/fleet/[shipName]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { PlayerShip, Resource } from '@/types';

const supabase = createClient();

export default function ShipPage() {
  const { shipName } = useParams();
  const name = decodeURIComponent(shipName as string);

  const [ship, setShip] = useState<PlayerShip | null>(null);
  const [resources, setResources] = useState<{ metal: number; crystal: number; food: number }>({ metal: 0, crystal: 0, food: 0 });
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [sRes, rRes] = await Promise.all([
        supabase
          .from('player_ships')
          .select('*, ship_types(*)')
          .eq('player_id', user.id)
          .eq('ship_types.name', name)
          .single(),
        supabase.from('resources').select('*').eq('player_id', user.id)
      ]);

      setShip(sRes.data);
      const resMap = (rRes.data as Resource[] || []).reduce((acc, r) => {
        if (r.resource_type in acc) acc[r.resource_type] = r.quantity;
        return acc;
      }, { metal: 0, crystal: 0, food: 0 });
      setResources(resMap);
    };
    load();
  }, [name]);

  if (!ship) return <div className="text-white p-10">Loading...</div>;

  const type = ship.ship_types;
  const canBuild = resources.metal >= type.metal_cost &&
                   resources.food >= type.food_cost;

  const build = async () => {
    if (!canBuild) return;

    await Promise.all([
      supabase.from('resources').update({ quantity: resources.metal - type.metal_cost })
        .eq('player_id', userId).eq('resource_type', 'metal'),
      supabase.from('resources').update({ quantity: resources.food - type.food_cost })
        .eq('player_id', userId).eq('resource_type', 'food'),
    ]);

    await supabase.from('player_ships').update({
      quantity: ship.quantity + 1
    }).eq('id', ship.id);

    setShip({ ...ship, quantity: ship.quantity + 1 });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-12">
      <Link href="/game" className="text-cyan-400 hover:underline mb-6 inline-block">Back to Dashboard</Link>
      <div className="max-w-3xl mx-auto bg-gray-800 rounded-xl p-10">
        <h1 className="text-5xl font-bold mb-6">{type.name}</h1>
        <p className="text-2xl mb-8">Owned: <span className="text-cyan-400">{ship.quantity}</span></p>

        <div className="grid grid-cols-2 gap-6 text-lg mb-10">
          <div>Attack: <span className="text-cyan-400">{type.attack}</span></div>
          <div>Defense: <span className="text-cyan-400">{type.defense}</span></div>
          <div>Speed: <span className="text-cyan-400">{type.speed}</span></div>
          <div>HP: <span className="text-cyan-400">{type.hp}</span></div>
          <div>Food/h: <span className="text-red-400">{type.crew_food_per_hour}</span></div>
        </div>

        <div className="space-y-4 text-xl">
          <div className={resources.metal >= type.metal_cost ? 'text-green-400' : 'text-red-400'}>
            Metal: {type.metal_cost}
          </div>
          <div className={resources.food >= type.food_cost ? 'text-green-400' : 'text-red-400'}>
            Food: {type.food_cost}
          </div>

          <button
            onClick={build}
            disabled={!canBuild}
            className={`w-full py-6 text-3xl font-bold rounded-lg transition-all mt-8
              ${canBuild ? 'bg-cyan-600 hover:bg-cyan-500 text-black' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
          >
            {canBuild ? `Build Ship` : 'Not enough resources'}
          </button>
        </div>
      </div>
    </div>
  );
}
