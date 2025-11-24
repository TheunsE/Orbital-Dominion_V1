'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
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
    if (timer > 0 || !user) return;

    // Find Communications Center and set to level 1
    const { data: commCenter } = await supabase
      .from('building_types')
      .select('id')
      .eq('name', 'Communications Center')
      .single();

    if (commCenter) {
      await supabase
        .from('player_buildings')
        .update({ level: 1 })
        .eq('player_id', user.id)
        .eq('building_type_id', commCenter.id);
    }

    await supabase
      .from('profiles')
      .update({ has_completed_onboarding: true })
      .eq('id', user.id);

    setOnboarding(false);
  };

  if (!user || onboarding === null) {
    return <div className="h-screen bg-black text-white flex items-center justify-center text-4xl">Entering orbit...</div>;
  }

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
// DASHBOARD – SHOWS METAL, CRYSTAL, FOOD, POWER CORRECTLY
// ──────────────────────────────────────
function Dashboard({ userId }: { userId: string }) {
  const [resources, setResources] = useState({
    metal: 0,
    crystal: 0,
    food: 0,
    power: 0,
  });
  const [buildings, setBuildings] = useState<any[]>([]);
  const [ships, setShips] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [
        { data: resData },
        { data: buildingData },
        { data: shipData },
      ] = await Promise.all([
        supabase.from('resources').select('resource_type, quantity').eq('player_id', userId),
        supabase.from('player_buildings').select('*, building_types(name)').eq('player_id', userId),
        supabase.from('player_ships').select('*, ship_types(name)').eq('player_id', userId),
      ]);

      // Map all 4 resources correctly
      const resMap = { metal: 0, crystal: 0, food: 0, power: 0 };
      (resData || []).forEach((r: any) => {
        if (r.resource_type in resMap) {
          resMap[r.resource_type as keyof typeof resMap] = r.quantity;
        }
      });
      setResources(resMap);

      setBuildings(buildingData || []);
      setShips(shipData || []);
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-8 text-cyan-400">Orbital Dominion</h1>

        {/* RESOURCES – NOW SHOWS ALL 4 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {(['metal', 'crystal', 'food', 'power'] as const).map((res) => (
            <div key={res} className="bg-gray-800 p-6 rounded-lg text-center border border-gray-700">
              <h3 className="text-lg uppercase tracking-wider">{res}</h3>
              <p className="text-4xl font-bold mt-2 text-cyan-400">
                {resources[res].toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* BUILDINGS */}
        <h2 className="text-3xl mb-6 text-cyan-300">Buildings</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
          {buildings.map((b) => (
            <Link
              key={b.id}
              href={`/game/building/${b.building_type_id}`}
              className="bg-gray-800 p-8 rounded-lg hover:bg-gray-700 border border-gray-700 hover:border-cyan-500 transition text-center"
            >
              <h3 className="text-xl font-bold">{b.building_types.name}</h3>
              <p className="text-5xl mt-4 text-cyan-400">Lv.{b.level}</p>
            </Link>
          ))}
        </div>

        {/* FLEET */}
        <h2 className="text-3xl mb-6 text-cyan-300">Fleet</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {ships.map((s) => (
            <Link
              key={s.id}
              href={`/game/fleet/${s.ship_type_id}`}
              className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 border border-gray-700 hover:border-cyan-500 transition text-center"
            >
              <h3 className="text-xl font-bold">{s.ship_types.name}</h3>
              <p className="text-4xl text-cyan-400">×{s.quantity}</p>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center space-x-8 text-lg">
          <Link href="/account" className="text-cyan-400 hover:underline">Account</Link>
          <Link href="/faq" className="text-cyan-400 hover:underline">FAQ</Link>
          <Link href="/contact" className="text-cyan-400 hover:underline">Contact</Link>
        </div>
      </div>
    </div>
  );
}
