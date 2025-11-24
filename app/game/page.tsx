// app/game/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient();

export default function GamePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [onboarding, setOnboarding] = useState<boolean | null>(null);
  const [timer, setTimer] = useState(10);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      setUser(user);

      const { data } = await supabase
        .from('profiles')
        .select('has_completed_onboarding')
        .eq('id', user.id)
        .single();

      if (data?.has_completed_onboarding) {
        setOnboarding(false);
      } else {
        setOnboarding(true);
        const iv = setInterval(() => setTimer(t => t > 0 ? t - 1 : 0), 1000);
        return () => clearInterval(iv);
      }
    };
    check();
  }, [router]);

  const handleConstructBase = async () => {
    if (timer > 0) return;

    const buildings = [
      'Communications Center','Warroom','Radar Station','Trade Pod',
      'Work Yard','Research lab','Bunker','Silo','Shield'
    ].map(name => ({
      user_id: user.id,
      name,
      level: name === 'Communications Center' ? 1 : 0
    }));

    await Promise.all([
      supabase.from('buildings').upsert(buildings, { onConflict: 'user_id,name' }),
      supabase.from('profiles').update({ has_completed_onboarding: true }).eq('id', user.id)
    ]);

    setOnboarding(false);
  };

  if (onboarding === null)
    return <div className="h-screen bg-black text-white flex items-center justify-center text-4xl">Entering orbit...</div>;

  if (onboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-blue-950 flex flex-col items-center justify-center text-white px-6">
        <div className="max-w-4xl text-center space-y-8">
          <h1 className="text-5xl font-bold mb-10 text-cyan-400">Welcome, Commander.</h1>
          <p className="text-xl leading-relaxed">
            Your colony ship has emerged from hyperspace above an unclaimed world.<br />
            Sensors show no signs of civilization — only endless potential.<br /><br />
            With limited supplies and a small crew, your first task is critical:<br />
            <strong className="text-2xl text-cyan-300">Establish a Colonial Command Base.</strong><br /><br />
            Only then can you expand, gather resources, and secure your foothold in this hostile sector.<br /><br />
            Other empires are out there. Watching. Advancing. Claiming.<br /><br />
            Your survival begins now.<br />
            <em className="text-2xl text-cyan-400">Your dominion begins today.</em>
          </p>

          <button
            onClick={handleConstructBase}
            disabled={timer > 0}
            className={`mt-16 px-12 py-6 text-2xl font-bold rounded-lg transition-all duration-300
              ${timer > 0 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-cyan-600 hover:bg-cyan-500 text-black animate-pulse shadow-2xl shadow-cyan-500/50'
              }`}
          >
            {timer > 0 ? `Construct Colonial Command Base (${timer}s)` : 'Construct Colonial Command Base'}
          </button>
        </div>
      </div>
    );
  }

  return <Dashboard userId={user.id} />;
}

// ──────────────────────────────────────
// DASHBOARD
// ──────────────────────────────────────
function Dashboard({ userId }: { userId: string }) {
  const [resources, setResources] = useState({ metal: 0, crystal: 0, food: 0, power: 0 });
  const [buildings, setBuildings] = useState<any[]>([]);
  const [buildingConfigs, setBuildingConfigs] = useState<any[]>([]);
  const [playerShips, setPlayerShips] = useState<any[]>([]);
  const [shipConfigs, setShipConfigs] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const [r, b, bc, ps, sc] = await Promise.all([
        supabase.from('resources').select('*').eq('user_id', userId).single(),
        supabase.from('buildings').select('name,level').eq('user_id', userId),
        supabase.from('building_configs').select('*'),
        supabase.from('player_ships').select('*').eq('user_id', userId),
        supabase.from('ship_configs').select('*')
      ]);

      setResources(r.data || { metal:0, crystal:0, food:0, power:0 });
      setBuildings(b.data || []);
      setBuildingConfigs(bc.data || []);
      setPlayerShips(ps.data || []);
      setShipConfigs(sc.data || []);
    };

    fetch();
    const i = setInterval(fetch, 5000);
    return () => clearInterval(i);
  }, [userId]);

  const production = buildingConfigs.reduce((acc, cfg) => {
    const lvl = buildings.find(b => b.name === cfg.name)?.level || 0;
    acc.metal += lvl * cfg.production_metal_per_level;
    acc.crystal += lvl * cfg.production_crystal_per_level;
    acc.food += lvl * cfg.production_food_per_level;
    acc.power += lvl * cfg.production_power_per_level;
    return acc;
  }, { metal: 0, crystal: 0, food: 0, power: 0 });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-8 text-cyan-400">Orbital Dominion</h1>

        {/* Resources */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {(['metal','crystal','food','power'] as const).map(res => (
            <div key={res} className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg capitalize">{res}</h3>
              <p className="text-2xl">{resources[res]} <span className="text-green-400">+{production[res]}/h</span></p>
            </div>
          ))}
        </div>

        {/* Buildings */}
        <h2 className="text-3xl mb-6">Buildings</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
          {buildingConfigs.map(cfg => {
            const lvl = buildings.find(b => b.name === cfg.name)?.level || 0;
            return (
              <Link
                key={cfg.name}
                href={`/game/building/${encodeURIComponent(cfg.name)}`}
                className="bg-gray-800 p-8 rounded-lg hover:bg-gray-700 border border-gray-700 hover:border-cyan-500 transition text-center"
              >
                <h3 className="text-xl font-bold">{cfg.name.replace(/([A-Z])/g, ' $1').trim()}</h3>
                <p className="text-4xl mt-4 text-cyan-400">Level {lvl}</p>
              </Link>
            );
          })}
        </div>

        {/* Fleet */}
        <h2 className="text-3xl mb-6">Fleet (Work Yard)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {shipConfigs.map(ship => {
            const owned = playerShips.find(s => s.ship_name === ship.name)?.quantity || 0;
            return (
              <Link
                key={ship.name}
                href={`/game/fleet/${encodeURIComponent(ship.name)}`}
                className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 border border-gray-700 hover:border-cyan-500 transition text-center"
              >
                <h3 className="text-xl font-bold">{ship.name}</h3>
                <p className="text-3xl text-cyan-400">×{owned}</p>
                <p className="text-xs opacity-75 mt-2">
                  ATK {ship.attack_points} | DEF {ship.defense_points}
                </p>
              </Link>
            );
          })}
        </div>

        <div className="mt-16 text-center space-x-8 text-lg">
          <Link href="/account" className="text-cyan-400 hover:underline">Account</Link>
          <Link href="/faq" className="text-cyan-400 hover:underline">FAQ</Link>
          <Link href="/contact" className="text-cyan-400 hover:underline">Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
