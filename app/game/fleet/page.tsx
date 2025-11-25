'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

const supabase = createClient();

export default function FleetPage() {
  const [ships, setShips] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from('player_ships')
        .select('*, ship_types(*)')
        .eq('player_id', user.id)
        .order('ship_type_id');

      setShips(data || []);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/game" className="text-cyan-400 hover:underline text-xl mb-8 inline-block">
          ← Back to Base
        </Link>

        <h1 className="text-6xl font-bold mb-12 text-center text-cyan-400 bg-gradient-to-r from-purple-600 to-cyan-400 bg-clip-text text-transparent">
          Work Yard • Shipyard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {ships.map((s) => {
            const type = s.ship_types;
            return (
              <div
                key={s.id}
                className="bg-gray-800/90 backdrop-blur-lg border border-gray-700 rounded-2xl p-8 hover:border-cyan-500 transition-all shadow-2xl"
              >
                <h2 className="text-3xl font-bold mb-4 text-cyan-300">{type.name}</h2>
                <div className="text-5xl font-extrabold text-cyan-400 mb-6">×{s.quantity}</div>

                <div className="grid grid-cols-2 gap-4 text-lg mb-8">
                  <div>Attack: <span className="text-green-400">{type.attack}</span></div>
                  <div>Defense: <span className="text-blue-400">{type.defense}</span></div>
                  <div>Speed: <span className="text-yellow-400">{type.speed}</span></div>
                  <div>HP: <span className="text-red-400">{type.hp}</span></div>
                </div>

                <div className="text-sm opacity-75 space-y-1">
                  <div>Metal: {type.metal_cost.toLocaleString()}</div>
                  <div>Food: {type.food_cost.toLocaleString()}</div>
                  <div>Energy: {type.energy_cost}</div>
                </div>

                <Link
                  href={`/game/fleet/${s.ship_type_id}`}
                  className="mt-8 block text-center py-4 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xl rounded-lg transition"
                >
                  Build {type.name}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
