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

      if (data?.has_completed_onboarding) setOnboarding(false);
      else {
        setOnboarding(true);
        const iv = setInterval(() => setTimer(t => t > 0 ? t - 1 : 0), 1000);
        return () => clearInterval(iv);
      }
    };
    check();
  }, [router]);

  const handleConstructBase = async () => {
    if (timer > 0 || !user) return;

    const { data: commCenter } = await supabase
      .from('building_types')
      .select('id')
      .eq('name', 'Communications Center')
      .single();

    if (commCenter) {
      const endsAt = new Date(Date.now() + 30_000).toISOString();
      await supabase
        .from('player_buildings')
        .update({ level: 1, construction_ends_at: endsAt })
        .eq('player_id', user.id)
        .eq('building_type_id', commCenter.id);
    }

    await supabase.from('profiles').update({ has_completed_onboarding: true }).eq('id', user.id);
    setOnboarding(false);
  };

  if (!user || onboarding === null)
    return <div className="h-screen bg-black text-white flex items-center justify-center text-4xl">Entering orbit...</div>;

  if (onboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-blue-950 flex flex-col items-center justify-center text-white px-6">
        <div className="max-w-4xl text-center space-y-8">
          <h1 className="text-5xl font-bold mb-10 text-cyan-400">Welcome, Commander.</h1>
          <p className="text-xl leading-relaxed">
            Your colony ship has emerged from hyperspace above an unclaimed world.<br />
            With limited supplies, your first task is critical:<br />
            <strong className="text-2xl text-cyan-300">Establish a Colonial Command Base.</strong>
          </p>
          <button
            onClick={handleConstructBase}
            disabled={timer > 0}
            className={`mt-16 px-12 py-6 text-2xl font-bold rounded-lg transition-all
              ${timer > 0 ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 text-black animate-pulse shadow-2xl shadow-cyan-500/50'}`}
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
// DASHBOARD + WORK YARD → SHIPYARD + QUEUE
// ──────────────────────────────────────
function Dashboard({ userId }: { userId: string }) {
  const [resources, setResources] = useState({ metal: 0, crystal: 0, food: 0, power: 0 });
  const [production, setProduction] = useState({ metal: 0, crystal: 0, food: 0, power: 0 });
  const [buildings, setBuildings] = useState<any[]>([]);
  const [ships, setShips] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const fetch = async () => {
      const [
        { data: res },
        { data: bldgs },
        { data: shps },
        { data: q },
      ] = await Promise.all([
        supabase.from('resources').select('resource_type, quantity').eq('player_id', userId),
        supabase.from('player_buildings').select('*, building_types(*)').eq('player_id', userId),
        supabase.from('player_ships').select('*, ship_types(*)').eq('player_id', userId),
        supabase.from('player_buildings').select('*, building_types(name)').eq('player_id', userId).not('construction_ends_at', 'is', null).order('construction_ends_at'),
      ]);

      // Resources
      const resMap = { metal: 0, crystal: 0, food: 0, power: 0 };
      (res || []).forEach((r: any) => resMap[r.resource_type as keyof typeof resMap] = r.quantity);
      setResources(resMap);

      // Production
      const prod = { metal: 0, crystal: 0, food: 0, power: 0 };
      (bldgs || []).forEach((b: any) => {
        const lvl = b.level;
        const t = b.building_types;
        prod.metal += Math.floor(lvl * (t.production_bonus_per_level || 0));
        prod.crystal += Math.floor(lvl * (t.production_bonus_per_level || 0));
        prod.food += Math.floor(lvl * (t.production_bonus_per_level || 0));
        prod.power += Math.floor(lvl * (t.power_generation_per_level || 0));
      });
      setProduction(prod);

      setBuildings(bldgs || []);
      setShips(shps || []);
      setQueue(q || []);

      if (q && q[0]?.construction_ends_at) {
        const ends = new Date(q[0].construction_ends_at).getTime();
        const now = Date.now();
        setTimeLeft(Math.max(0, Math.floor((ends - now) / 1000)));
      } else {
        setTimeLeft(0);
      }
    };

    fetch();
    const i = setInterval(fetch, 1000);
    return () => clearInterval(i);
  }, [userId]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(t => t > 0 ? t - 1 : 0), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h ? h + 'h ' : ''}${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">

        {/* QUEUE BAR */}
        {queue.length > 0 && (
          <div className="fixed top-0 left-0 right-0 bg-black/90 border-b-4 border-cyan-500 p-4 z-50 shadow-2xl">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div>
                <span className="text-cyan-400 font-bold">Build Queue ({queue.length})</span>
                <span className="ml-4 text-xl">
                  {queue[0].building_types.name} → Level {queue[0].level + 1}
                </span>
              </div>
              <div className="text-3xl font-mono text-cyan-300">
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        )}

        <div className={queue.length > 0 ? "mt-24" : ""}>
          <h1 className="text-6xl font-bold mb-8 text-cyan-400 text-center">Orbital Dominion</h1>

          {/* RESOURCES */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {(['metal', 'crystal', 'food', 'power'] as const).map((res) => (
              <div key={res} className="bg-gray-800/90 backdrop-blur p-8 rounded-xl border border-gray-700">
                <h3 className="text-lg uppercase tracking-widest">{res}</h3>
                <p className="text-5xl font-bold mt-2 text-cyan-300">{resources[res].toLocaleString()}</p>
                <p className="text-green-400 text-xl">+{production[res]}/h</p>
              </div>
            ))}
          </div>

          {/* BUILDINGS */}
          <h2 className="text-4xl font-bold mb-8 text-cyan-300">Buildings</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {buildings.map((b) => {
              const isWorkYard = b.building_types.name === 'Work Yard';
              const isBuilding = queue.some((q: any) => q.building_type_id === b.building_type_id);

              if (isWorkYard) {
                return (
                  <Link
                    key={b.id}
                    href="/game/fleet"
                    className="relative p-10 rounded-2xl border-2 transition-all border-purple-600 hover:border-purple-400 bg-gradient-to-br from-purple-900/60 to-cyan-900/60 backdrop-blur-lg shadow-2xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-2xl animate-pulse"></div>
                    <h3 className="text-3xl font-bold relative z-10 text-purple-300">Work Yard</h3>
                    <p className="text-7xl font-extrabold mt-6 relative z-10 text-white">Lv.{b.level}</p>
                    <div className="mt-4 text-lg uppercase tracking-wider text-cyan-200 relative z-10">
                      Shipyard
                    </div>
                  </Link>
                );
              }

              return (
                <Link
                  key={b.id}
                  href={`/game/building/${b.building_type_id}`}
                  className={`relative p-10 rounded-2xl border-2 transition-all ${isBuilding ? 'border-yellow-500 animate-pulse' : 'border-gray-700 hover:border-cyan-500'} bg-gray-800/80 backdrop-blur`}
                >
                  {isBuilding && <div className="absolute -top-3 -right-3 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">BUILDING</div>}
                  <h3 className="text-2xl font-bold">{b.building_types.name}</h3>
                  <p className="text-6xl font-extrabold mt-6 text-cyan-400">Lv.{b.level}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
