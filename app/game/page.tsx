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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setUser(user);

      const { data } = await supabase.from('profiles').select('has_completed_onboarding').eq('id', user.id).single();

      if (data?.has_completed_onboarding) {
        setOnboarding(false);
      } else {
        setOnboarding(true);
        const iv = setInterval(() => setTimer(t => (t > 0 ? t - 1 : 0)), 1000);
        return () => clearInterval(iv);
      }
    };
    check();
  }, [router]);

  const handleConstructBase = async () => {
    if (timer > 0 || !user) return;

    // This is part of the tutorial and doesn't use the new queue system.
    // It's a one-off action.
    const { data: commCenter } = await supabase.from('building_types').select('id').eq('name', 'Communications Center').single();

    if (commCenter) {
      const endsAt = new Date(Date.now() + 30_000).toISOString();
      await supabase
        .from('player_buildings')
        .update({ construction_ends_at: endsAt })
        .eq('player_id', user.id)
        .eq('building_type_id', commCenter.id);
    }

    await supabase.from('profiles').update({ has_completed_onboarding: true }).eq('id', user.id);

    setOnboarding(false);
  };

  if (!user || onboarding === null)
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center text-4xl">
        Entering orbit...
      </div>
    );

  if (onboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-blue-950 flex flex-col items-center justify-center text-white px-6">
        <div className="max-w-4xl text-center space-y-8">
          <h1 className="text-5xl font-bold mb-10 text-cyan-400">Welcome, Commander.</h1>
          <p className="text-xl leading-relaxed">
            Your colony ship has emerged from hyperspace above an unclaimed world.
            <br />
            With limited supplies, your first task is critical:
            <br />
            <strong className="text-2xl text-cyan-300">Establish a Colonial Command Base.</strong>
          </p>
          <button
            onClick={handleConstructBase}
            disabled={timer > 0}
            className={`mt-16 px-12 py-6 text-2xl font-bold rounded-lg transition-all ${
              timer > 0
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
//─────────────────────────────────
//           Dashboard
//─────────────────────────────────
  return <Dashboard userId={user.id} />;
}

function Dashboard({ userId }: { userId: string }) {
  const [resources, setResources] = useState({ metal: 0, crystal: 0, food: 0, power: 0 });
  const [production, setProduction] = useState({ metal: 0, crystal: 0, food: 0, power: 0 });
  const [buildings, setBuildings] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);

  const fetchData = async () => {
    const [{ data: res }, { data: bldgs }, { data: q }] = await Promise.all([
      supabase.from('resources').select('resource_type, quantity').eq('player_id', userId),
      supabase.from('player_buildings').select('*, building_types(*)').eq('player_id', userId),
      supabase
        .from('building_queue')
        .select('*, player_buildings(*, building_types(name))')
        .eq('player_id', userId)
        .order('ends_at', { ascending: true }),
    ]);

    // Resources
    const resMap = { metal: 0, crystal: 0, food: 0, power: 0 };
    (res || []).forEach((r: any) => {
      const key = r.resource_type as keyof typeof resMap;
      if (key in resMap) resMap[key] = r.quantity;
    });
    setResources(resMap);

    // Production
    const prod = { metal: 0, crystal: 0, food: 0, power: 0 };
    (bldgs || []).forEach((b: any) => {
      const name = b.building_types.name;
      const level = b.level;
      if (name === 'Metal Mine') prod.metal = 30 + level * 30;
      if (name === 'Crystal Mine') prod.crystal = 20 + level * 20;
      if (name === 'Food Synthesizer') prod.food = 15 + level * 15;
      if (name === 'Solar Plant') prod.power = 20 + level * 20;
    });
    setProduction(prod);

    setBuildings(bldgs || []);
    setQueue(q || []);
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  useEffect(() => {
    if (queue.length === 0) {
      setTimeLeft(0);
      return;
    }

    const firstItem = queue[0];
    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((new Date(firstItem.ends_at).getTime() - Date.now()) / 1000));
      setTimeLeft(diff);

      if (diff === 0) {
        // Time to refetch data as the building should be done
        fetchData();
      }
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [queue, userId]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + 'h ' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getBuildingId = (name: string) => buildings.find(b => b.building_types.name === name)?.building_type_id;

  const facilityBuildings = buildings.filter(b => !['Metal Mine', 'Crystal Mine', 'Food Synthesizer', 'Solar Plant'].includes(b.building_types.name));

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {queue.length > 0 && (
          <div className="fixed top-0 left-0 right-0 bg-black/95 border-b-4 border-orange-500 p-4 z-50">
            <div className="max-w-4xl mx-auto flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-orange-400 font-bold text-xl">
                  Upgrading: {queue[0].player_buildings.building_types.name} → Level {queue[0].target_level}
                </span>
                <span className="text-3xl font-mono text-orange-300">{formatTime(timeLeft)}</span>
              </div>
              {queue.length > 1 && (
                 <div className="text-gray-400">
                   Next in queue: {queue[1].player_buildings.building_types.name} → Level {queue[1].target_level}
                 </div>
              )}
            </div>
          </div>
        )}

        <div className={queue.length > 0 ? 'mt-32' : ''}>
          <h1 className="text-6xl font-bold text-center mb-12 text-cyan-400">Orbital Dominion</h1>

          <h2 className="text-4xl font-bold mb-8 text-cyan-300">Resources</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <Link href={`/game/building/${getBuildingId('Metal Mine') || ''}`} className="bg-gradient-to-br from-orange-900 to-red-900 p-8 rounded-2xl border-2 border-orange-600 hover:border-orange-400 transition cursor-pointer">
              <h3 className="text-2xl font-bold">Metal</h3>
              <p className="text-5xl font-extrabold">{resources.metal.toLocaleString()}</p>
              <p className="text-green-400">+{production.metal}/h</p>
            </Link>
            <Link href={`/game/building/${getBuildingId('Crystal Mine') || ''}`} className="bg-gradient-to-br from-purple-900 to-indigo-900 p-8 rounded-2xl border-2 border-purple-600 hover:border-purple-400 transition cursor-pointer">
              <h3 className="text-2xl font-bold">Crystal</h3>
              <p className="text-5xl font-extrabold">{resources.crystal.toLocaleString()}</p>
              <p className="text-green-400">+{production.crystal}/h</p>
            </Link>
            <Link href={`/game/building/${getBuildingId('Food Synthesizer') || ''}`} className="bg-gradient-to-br from-green-900 to-emerald-900 p-8 rounded-2xl border-2 border-green-600 hover:border-green-400 transition cursor-pointer">
              <h3 className="text-2xl font-bold">Food</h3>
              <p className="text-5xl font-extrabold">{resources.food.toLocaleString()}</p>
              <p className="text-green-400">+{production.food}/h</p>
            </Link>
            <Link href={`/game/building/${getBuildingId('Solar Plant') || ''}`} className="bg-gradient-to-br from-yellow-900 to-amber-900 p-8 rounded-2xl border-2 border-yellow-600 hover:border-yellow-400 transition cursor-pointer">
              <h3 className="text-2xl font-bold">Power</h3>
              <p className="text-5xl font-extrabold">{resources.power.toLocaleString()}</p>
              <p className="text-green-400">+{production.power}/h</p>
            </Link>
          </div>

          <h2 className="text-4xl font-bold mb-8 text-cyan-300">Buildings</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {facilityBuildings.map(b => {
              const name = b.building_types.name;
              const isWorkYard = name === 'Work Yard';
              const isInQueue = queue.some((q: any) => q.building_id === b.id);

              if (isWorkYard) {
                return (
                  <Link key={b.id} href="/game/fleet" className="bg-gradient-to-br from-purple-800 to-cyan-800 p-10 rounded-2xl border-4 border-purple-500 text-center shadow-2xl">
                    <h3 className="text-3xl font-bold text-purple-300">Work Yard</h3>
                    <p className="text-7xl font-extrabold text-white">Lv.{b.level}</p>
                    <p className="text-xl text-cyan-300">Shipyard</p>
                  </Link>
                );
              }

              return (
                <Link
                  key={b.id}
                  href={`/game/building/${b.building_type_id}`}
                  className={`relative p-10 rounded-2xl border-2 transition-all ${
                    isInQueue ? 'border-orange-500 animate-pulse' : 'border-gray-700 hover:border-cyan-500'
                  } bg-gray-800/80 backdrop-blur text-center`}
                >
                  {isInQueue && (
                    <div className="absolute -top-3 -right-3 bg-orange-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                      QUEUED
                    </div>
                  )}
                  <h3 className="text-2xl font-bold">{name}</h3>
                  <p className="text-6xl font-extrabold text-cyan-400">Lv.{b.level}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
