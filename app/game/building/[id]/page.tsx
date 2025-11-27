'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient();

export default function BuildingPage() {
  const { id } = useParams();
  const buildingTypeId = Number(id);
  const router = useRouter();

  const [building, setBuilding] = useState<any>(null);
  const [type, setType] = useState<any>(null);
  const [resources, setResources] = useState({ metal: 0, crystal: 0, food: 0 });
  const [userId, setUserId] = useState<string>('');
  const [queue, setQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setUserId(user.id);

      const [b, t, r, q] = await Promise.all([
        supabase
          .from('player_buildings')
          .select('*')
          .eq('player_id', user.id)
          .eq('building_type_id', buildingTypeId)
          .single(),
        supabase.from('building_types').select('*').eq('id', buildingTypeId).single(),
        supabase.from('resources').select('*').eq('player_id', user.id),
        supabase.from('building_queue').select('*').eq('player_id', user.id),
      ]);

      setBuilding(b.data);
      setType(t.data);
      setQueue(q.data || []);

      const resMap = (r.data || []).reduce(
        (acc: any, row: any) => {
          acc[row.resource_type] = row.quantity;
          return acc;
        },
        { metal: 0, crystal: 0, food: 0 }
      );
      setResources(resMap);
    };
    load();
  }, [buildingTypeId, router]);

  if (!building || !type) return <div className="text-white p-10">Loading...</div>;

  const nextLevel = building.level + 1 + (queue.filter(item => item.building_id === building.id).length);

  const cost = {
    metal: type.cost_metal * nextLevel,
    crystal: type.cost_crystal * nextLevel,
    food: type.cost_food * nextLevel,
  };

  const canAfford = resources.metal >= cost.metal && resources.crystal >= cost.crystal && resources.food >= cost.food;

  const handleUpgrade = async () => {
    if (!canAfford || isLoading) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/buildings/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ buildingId: building.id }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to start upgrade.');
      }
      
      const successData = result[0] || result;
      
      if (successData.error) {
        throw new Error(successData.error);
      }

      setSuccessMessage('Upgrade successfully added to the queue!');
      setTimeout(() => router.push('/game'), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText = () => {
    if (isLoading) {
        return queue.length > 0 ? 'Adding to queue...' : 'Upgrading...';
    }
    if (!canAfford) {
        return 'Not enough resources';
    }
    return queue.length > 0 ? 'Add to Queue' : 'Upgrade';
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-12">
      <Link href="/game" className="text-cyan-400 hover:underline mb-6 inline-block">
        Back
      </Link>
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl p-10">
        <h1 className="text-5xl font-bold mb-4">{type.name}</h1>
        <p className="text-7xl mb-10 text-cyan-400">Level {building.level}</p>

        <div className="space-y-6 text-xl">
          <h2 className="text-3xl">Upgrade to Level {nextLevel}</h2>
          <div className="space-y-3">
            <div className={resources.metal >= cost.metal ? 'text-green-400' : 'text-red-400'}>Metal: {cost.metal.toLocaleString()}</div>
            <div className={resources.crystal >= cost.crystal ? 'text-green-400' : 'text-red-400'}>Crystal: {cost.crystal.toLocaleString()}</div>
            <div className={resources.food >= cost.food ? 'text-green-400' : 'text-red-400'}>Food: {cost.food.toLocaleString()}</div>
          </div>

          <button
            onClick={handleUpgrade}
            disabled={!canAfford || isLoading}
            className={`w-full py-6 text-3xl font-bold rounded-lg ${
              canAfford && !isLoading ? 'bg-cyan-600 hover:bg-cyan-500 text-black' : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {buttonText()}
          </button>
          
          {error && <p className="text-red-500 mt-4">{error}</p>}
          {successMessage && <p className="text-green-500 mt-4">{successMessage}</p>}
        </div>
      </div>
    </div>
  );
}
