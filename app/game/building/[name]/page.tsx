// app/game/building/[name]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { PlayerBuilding, Resource } from '@/types';

const supabase = createClient();

export default function BuildingPage() {
  const { name } = useParams();
  const buildingName = decodeURIComponent(name as string);

  const [building, setBuilding] = useState<PlayerBuilding | null>(null);
  const [resources, setResources] = useState<{ metal: number; crystal: number; food: number }>({ metal: 0, crystal: 0, food: 0 });
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [bRes, rRes] = await Promise.all([
        supabase
          .from('player_buildings')
          .select('*, building_types(*)')
          .eq('player_id', user.id)
          .eq('building_types.name', buildingName)
          .single(),
        supabase.from('resources').select('*').eq('player_id', user.id)
      ]);

      setBuilding(bRes.data);
      const resMap = (rRes.data as Resource[] || []).reduce((acc, r) => {
        if (r.resource_type in acc) acc[r.resource_type] = r.quantity;
        return acc;
      }, { metal: 0, crystal: 0, food: 0 });
      setResources(resMap);
    };
    load();
  }, [buildingName]);

  if (!building) return <div className="text-white p-10">Loading...</div>;

  const type = building.building_types;
  const nextLevel = building.level + 1;
  const cost = {
    metal: type.cost_metal * nextLevel,
    crystal: type.cost_crystal * nextLevel,
    food: type.cost_food * nextLevel,
  };

  const canAfford = resources.metal >= cost.metal &&
                    resources.crystal >= cost.crystal &&
                    resources.food >= cost.food;

  const upgrade = async () => {
    if (!canAfford) return;

    await supabase.from('player_buildings').update({
      level: nextLevel
    }).eq('id', building.id);

    // Deduct resources
    await Promise.all([
      supabase.from('resources').update({ quantity: resources.metal - cost.metal })
        .eq('player_id', userId).eq('resource_type', 'metal'),
      supabase.from('resources').update({ quantity: resources.crystal - cost.crystal })
        .eq('player_id', userId).eq('resource_type', 'crystal'),
      supabase.from('resources').update({ quantity: resources.food - cost.food })
        .eq('player_id', userId).eq('resource_type', 'food'),
    ]);

    setBuilding({ ...building, level: nextLevel });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-12">
      <Link href="/game" className="text-cyan-400 hover:underline mb-6 inline-block">Back to Dashboard</Link>
      <div className="max-w-3xl mx-auto bg-gray-800 rounded-xl p-10">
        <h1 className="text-5xl font-bold mb-4">{type.name}</h1>
        <p className="text-7xl mb-10 text-cyan-400">Level {building.level}</p>

        <div className="space-y-6 text-xl">
          <h2 className="text-3xl">Upgrade to Level {nextLevel}</h2>
          <p className="text-lg opacity-75">Time: {type.construction_time_seconds * nextLevel}s</p>

          <div className="space-y-3">
            <div className={resources.metal >= cost.metal ? 'text-green-400' : 'text-red-400'}>Metal: {cost.metal}</div>
            <div className={resources.crystal >= cost.crystal ? 'text-green-400' : 'text-red-400'}>Crystal: {cost.crystal}</div>
            <div className={resources.food >= cost.food ? 'text-green-400' : 'text-red-400'}>Food: {cost.food}</div>
          </div>

          <button
            onClick={upgrade}
            disabled={!canAfford}
            className={`w-full py-6 text-3xl font-bold rounded-lg transition-all
              ${canAfford ? 'bg-cyan-600 hover:bg-cyan-500 text-black' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
          >
            {canAfford ? `Upgrade • ${type.construction_time_seconds * nextLevel}s` : 'Not enough resources'}
          </button>
        </div>
      </div>
    </div>
  );
}
