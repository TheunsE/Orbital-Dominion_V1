'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient();

export default function BuildingPage() {
  const { id } = useParams();
  const buildingTypeId = Number(id);

  const [building, setBuilding] = useState<any>(null);
  const [type, setType] = useState<any>(null);
  const [resources, setResources] = useState({ metal: 0, crystal: 0, food: 0 });
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [b, t, r] = await Promise.all([
        supabase.from('player_buildings').select('*').eq('player_id', user.id).eq('building_type_id', buildingTypeId).single(),
        supabase.from('building_types').select('*').eq('id', buildingTypeId).single(),
        supabase.from('resources').select('*').eq('player_id', user.id)
      ]);

      setBuilding(b.data);
      setType(t.data);

      const resMap = (r.data || []).reduce((acc: any, row: any) => {
        acc[row.resource_type] = row.quantity;
        return acc;
      }, { metal: 0, crystal: 0, food: 0 });
      setResources(resMap);
    };
    load();
  }, [buildingTypeId]);

  if (!building || !type) return <div className="text-white p-10">Loading...</div>;

  const nextLevel = building.level + 1;
  const cost = {
    metal: type.cost_metal * nextLevel,
    crystal: type.cost_crystal * nextLevel,
    food: type.cost_food * nextLevel,
  };

  const canAfford = resources.metal >= cost.metal && resources.crystal >= cost.crystal && resources.food >= cost.food;

  const upgrade = async () => {
    if (!canAfford) return;

    await Promise.all([
      supabase.from('player_buildings').update({ level: nextLevel }).eq('id', building.id),
      supabase.from('resources').update({ quantity: resources.metal - cost.metal }).eq('player_id', userId).eq('resource_type', 'metal'),
      supabase.from('resources').update({ quantity: resources.crystal - cost.crystal }).eq('player_id', userId).eq('resource_type', 'crystal'),
      supabase.from('resources').update({ quantity: resources.food - cost.food }).eq('player_id', userId).eq('resource_type', 'food'),
    ]);

    setBuilding({ ...building, level: nextLevel });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-12">
      <Link href="/game" className="text-cyan-400 hover:underline mb-6 inline-block">Back</Link>
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl p-10">
        <h1 className="text-5xl font-bold mb-4">{type.name}</h1>
        <p className="text-7xl mb-10 text-cyan-400">Level {building.level}</p>

        <div className="space-y-6 text-xl">
          <h2 className="text-3xl">Upgrade to Level {nextLevel}</h2>
          <div className="space-y-3">
            <div className={resources.metal >= cost.metal ? 'text-green-400' : 'text-red-400'}>Metal: {cost.metal}</div>
            <div className={resources.crystal >= cost.crystal ? 'text-green-400' : 'text-red-400'}>Crystal: {cost.crystal}</div>
            <div className={resources.food >= cost.food ? 'text-green-400' : 'text-red-400'}>Food: {cost.food}</div>
          </div>

          <button
            onClick={upgrade}
            disabled={!canAfford}
            className={`w-full py-6 text-3xl font-bold rounded-lg ${canAfford ? 'bg-cyan-600 hover:bg-cyan-500 text-black' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
          >
            {canAfford ? 'Upgrade' : 'Not enough resources'}
          </button>
        </div>
      </div>
    </div>
  );
}
