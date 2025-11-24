'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient();

export default function BuildingPage() {
  const { name } = useParams();
  const buildingName = decodeURIComponent(name as string);

  const [building, setBuilding] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [resources, setResources] = useState<any>({});
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [bRes, cRes, rRes] = await Promise.all([
        supabase.from('buildings').select('*').eq('user_id', user.id).eq('name', buildingName).single(),
        supabase.from('building_configs').select('*').eq('name', buildingName).single(),
        supabase.from('resources').select('*').eq('user_id', user.id).single()
      ]);

      setBuilding(bRes.data || { level: 0 });
      setConfig(cRes.data);
      setResources(rRes.data || { metal:0, crystal:0, food:0, power:0 });
    };
    load();
  }, [buildingName]);

  if (!config || building === null) return <div className="text-white p-10">Loading...</div>;

  const nextLevel = building.level + 1;
  const cost = {
    metal: config.base_cost_metal * nextLevel,
    crystal: config.base_cost_crystal * nextLevel,
    food: config.base_cost_food * nextLevel,
    power: config.base_cost_power * nextLevel,
  };
  const time = config.build_time_seconds * nextLevel;

  const canAfford = resources.metal >= cost.metal &&
                    resources.crystal >= cost.crystal &&
                    resources.food >= cost.food &&
                    (cost.power === 0 || resources.power >= cost.power);

  const upgrade = async () => {
    if (!canAfford) return;

    await supabase.from('resources').update({
      metal: resources.metal - cost.metal,
      crystal: resources.crystal - cost.crystal,
      food: resources.food - cost.food,
      power: resources.power - cost.power,
    }).eq('user_id', userId);

    await supabase.from('buildings').upsert({
      user_id: userId,
      name: buildingName,
      level: nextLevel
    });

    setBuilding({ ...building, level: nextLevel });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-12">
      <Link href="/game" className="text-cyan-400 hover:underline mb-6 inline-block">&larr; Back to Dashboard</Link>
      <div className="max-w-3xl mx-auto bg-gray-800 rounded-xl p-10">
        <h1 className="text-5xl font-bold mb-4">{buildingName.replace(/([A-Z])/g, ' $1').trim()}</h1>
        <p className="text-xl opacity-80 mb-8">{config.description}</p>
        <p className="text-7xl mb-10 text-cyan-400">Level {building.level}</p>

        <div className="space-y-6 text-xl">
          <h2 className="text-3xl">Upgrade to Level {nextLevel}</h2>
          <p className="text-lg opacity-75">Build time: {time} seconds</p>

          <div className="space-y-2">
            {cost.metal > 0 && <div className={resources.metal >= cost.metal ? 'text-green-400' : 'text-red-400'}>Metal: {cost.metal}</div>}
            {cost.crystal > 0 && <div className={resources.crystal >= cost.crystal ? 'text-green-400' : 'text-red-400'}>Crystal: {cost.crystal}</div>}
            {cost.food > 0 && <div className={resources.food >= cost.food ? 'text-green-400' : 'text-red-400'}>Food: {cost.food}</div>}
            {cost.power > 0 && <div className={resources.power >= cost.power ? 'text-green-400' : 'text-red-400'}>Power: {cost.power}</div>}
          </div>

          <button
            onClick={upgrade}
            disabled={!canAfford}
            className={`w-full py-6 text-3xl font-bold rounded-lg transition-all
              ${canAfford 
                ? 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-lg shadow-cyan-500/50' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
          >
            {canAfford ? `Upgrade • ${time}s` : 'Not enough resources'}
          </button>
        </div>
      </div>
    </div>
  );
}
