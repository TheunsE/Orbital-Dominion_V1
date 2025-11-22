'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ShipType } from '@/types'

export default function ShipCostsPanel() {
  const supabase = createClient()
  const [ships, setShips] = useState<ShipType[]>([])
  const [msg, setMsg] = useState('')

  const [costs, setCosts] = useState<Record<string, { metal_cost: number; food_cost: number; energy_cost: number }>>({})

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data, error } = await supabase.from('ship_types').select('*').order('name')
    if (error) {
      setMsg(error.message || '')
    } else {
      setShips(data || [])
      const initialCosts: Record<string, any> = {}
      data?.forEach(s => {
        initialCosts[String(s.id)] = {
          metal_cost: s.metal_cost,
          food_cost: s.food_cost,
          energy_cost: s.energy_cost
        }
      })
      setCosts(initialCosts)
    }
  }

  const handleCostChange = (
    id: string,
    resource: 'metal_cost' | 'food_cost' | 'energy_cost',
    value: string
  ) => {
    setCosts(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [resource]: parseInt(value, 10) || 0
      }
    }))
  }

  async function save(id: number) {
    const { error } = await supabase
      .from('ship_types')
      .update(costs[String(id)])
      .eq('id', id)

    if (error) {
      setMsg(error.message || '')
    } else {
      setMsg('Saved successfully!')
      setTimeout(() => setMsg(''), 3000)
    }
  }

  return (
    <div className="bg-slate-800 p-6 rounded-lg mt-8">
      <h3 className="text-2xl font-bold text-emerald-400 mb-4">Ship Costs Editor</h3>
      <p className="text-sm text-green-400 mb-4">{msg}</p>

      <div className="space-y-4">
        {ships.map(s => (
          <div key={s.id} className="bg-slate-700/50 p-4 rounded border border-slate-600">
            <div className="font-semibold text-lg mb-3">{s.name} (Tier {s.tier})</div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <label className="flex items-center gap-2">
                <span className="text-cyan-300">Metal:</span>
                <input
                  type="number"
                  className="w-32 p-2 rounded bg-slate-900 text-white"
                  value={costs[String(s.id)]?.metal_cost || 0}
                  onChange={e => handleCostChange(String(s.id), 'metal_cost', e.target.value)}
                />
              </label>

              <label className="flex items-center gap-2">
                <span className="text-yellow-300">Food:</span>
                <input
                  type="number"
                  className="w-32 p-2 rounded bg-slate-900 text-white"
                  value={costs[String(s.id)]?.food_cost || 0}
                  onChange={e => handleCostChange(String(s.id), 'food_cost', e.target.value)}
                />
              </label>

              <label className="flex items-center gap-2">
                <span className="text-red-400">Energy:</span>
                <input
                  type="number"
                  className="w-32 p-2 rounded bg-slate-900 text-white"
                  value={costs[String(s.id)]?.energy_cost || 0}
                  onChange={e => handleCostChange(String(s.id), 'energy_cost', e.target.value)}
                />
              </label>

              <button
                onClick={() => save(s.id)}
                className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded font-medium"
              >
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
