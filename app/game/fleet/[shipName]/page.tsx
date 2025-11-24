'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient();

export default function ShipPage() {
  const { shipName } = useParams();
  const name = decodeURIComponent(shipName as string);

  const [config, setConfig] = useState<any>(null);
  const [owned, setOwned] = useState(0);
  const [resources, setResources] = useState<any>({});
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [cRes, sRes, rRes] = await Promise.all([
        supabase.from('ship_configs').select('*').eq('name', name).single(),
        supabase.from('player_ships').select('quantity').eq('user_id', user.id).eq('ship_name', name).single(),
        supabase.from('resources').select('*').eq('user_id', user.id).single()
      ]);

      setConfig(cRes.data);
      setOwned(sRes.data?.quantity || 0);
      setResources(rRes.data || { metal:0, crystal:0, food:0 });
    };
    load();
  }, [name]);

  if (!config) return <div className="text-white p-10">Loading...</div>;

  const canBuild = resources.metal >= config.base_cost_metal &&
                   resources.crystal >= config.base_cost_crystal &&
                   resources.food >= config.base_cost_food;

  const build = async () => {
    if (!canBuild) return;

    await supabase.from('resources').update({
      metal: resources.metal - config.base_cost_metal,
      crystal: resources.crystal - config.base_cost_crystal,
      food: resources.food - config.base_cost_food,
    }).eq('user_id', userId);

    await supabase.from('player_ships').upsert({
      user_id: userId,
      ship_name: name,
      quantity: owned + 1
    }, { onConflict: 'user_id,ship_name' });

    setOwned(owned + 1);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-12">
      <Link href="/game" className="text-cyan-400 hover:underline mb-6 inline-block">&larr; Back to Dashboard</Link>
      <div className="max-w-3xl mx-auto bg-gray-800 rounded-xl p-10">
        <h1 className="text-5xl font-bold mb-6">{name}</h1>
        <p className="text-2xl mb-8">Owned: <span className="text-cyan-400">{owned}</span></p>

        <div className="grid grid-cols-2 gap-6 text-lg mb-10">
          <div>Attack: <span className="text-cyan-400">{config.attack_points}</span></div>
          <div>Defense: <span className="text-cyan-400">{config.defense_points}</span></div>
          <div>Health: <span className="text-cyan-400">{config.health_points}</span></div>
          <div>Cargo: <span className="text-cyan-400">{config.cargo_capacity}</span></div>
          <div>Food/hour: <span className="text-red-400">{config.food_cost_per_hour}</span></div>
          <div>Build time: {config.build_time_seconds}s</div>
        </div>

        <div className="space-y-4 text-xl">
          <div className={resources.metal >= config.base_cost_metal ? 'text-green-400' : 'text-red-400'}>
            Metal: {config.base_cost_metal}
          </div>
          <div className={resources.crystal >= config.base_cost_crystal ? 'text-green-400' : 'text-red-400'}>
            Crystal: {config.base_cost_crystal}
          </div>
          <div className={resources.food >= config.base_cost_food ? 'text-green-400' : 'text-red-400'}>
            Food: {config.base_cost_food}
          </div>

          <button
            onClick={build}
            disabled={!canBuild}
            className={`w-full py-6 text-3xl font-bold rounded-lg transition-all mt-8
              ${canBuild 
                ? 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-lg shadow-cyan-500/50' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
          >
            {canBuild ? `Build Ship • ${config.build_time_seconds}s` : 'Not enough resources'}
          </button>
        </div>
      </div>
    </div>
  );
}
