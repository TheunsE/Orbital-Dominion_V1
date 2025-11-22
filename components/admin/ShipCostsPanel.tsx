'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ShipType } from '@/types'

export default function ShipCostsPanel() {
  const supabase = createClient()
  const [ships, setShips] = useState<ShipType[]>([])
  const [msg, setMsg] = useState('')
  const [costs, setCosts] = useState<Record<string, { cost_metal: number; cost_crystal: number; cost_food: number }>>({})

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data, error } = await supabase.from('ship_types').select('*').order('name')
    if (error) {
      setMsg(error.message || '')
    } else {
      setShips(data || [])
      const initialCosts: { [key: string]: { metal_cost: number, food_cost: number, energy_cost: number } } = {}
      data?.forEach(s => {
        initialCosts[String(b.id)] = {
          metal_cost: s.metal_cost,
          food_cost: s.food_cost,
          energy_cost: s.energy_cost
        }
      })
      setCosts(initialCosts)
    }
  }

  const handleCostChange = (id: string, resource: string, value: string) => {
    setCosts(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [resource]: parseInt(value, 10) || 0
      }
    }))
  }

  async function save(id: string) {
    const { error } = await supabase
      .from('ship_types')
      .update(costs[id])
      .eq('id', id)
    if (error) {
      setMsg(error.message || '')
    } else {
      setMsg('Saved successfully!')
      setTimeout(() => setMsg(''), 3000)
      load()
    }
  }

  return (
    <div className="bg-slate-800 p-4 rounded">
      <h3 className="font-medium">Ship Costs</h3>
      <p className="text-sm text-slate-400 mt-2">{msg}</p>
      <ul className="text-slate-300">
        {ships.map(s => (
          <li key={s.id} className="py-2 border-b border-slate-700 space-y-2">
            <div className="font-medium">{s.name}</div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                Metal:
                <input
                  type="number"
                  className="w-24 p-1 rounded bg-slate-900"
                  value={costs[s.id]?.metal_cost || 0}
                  onChange={e => handleCostChange(s.id, 'metal_cost', e.target.value)}
                />
              </label>
              <label className="flex items-center gap-2">
                Food:
                <input
                  type="number"
                  className="w-24 p-1 rounded bg-slate-900"
                  value={costs[s.id]?.food_cost || 0}
                  onChange={e => handleCostChange(s.id, 'food_cost', e.target.value)}
                />
              </label>
              <label className="flex items-center gap-2">
                Energy:
                <input
                  type="number"
                  className="w-24 p-1 rounded bg-slate-900"
                  value={costs[s.id]?.energy_cost || 0}
                  onChange={e => handleCostChange(s.id, 'energy_cost', e.target.value)}
                />
              </label>
              <button onClick={() => save(s.id)} className="bg-emerald-500 px-3 py-1 rounded">Save</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
