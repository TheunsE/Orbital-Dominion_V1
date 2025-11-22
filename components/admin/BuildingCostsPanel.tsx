'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BuildingType } from '@/types'

export default function BuildingCostsPanel() {
  const supabase = createClient()
  const [buildings, setBuildings] = useState<BuildingType[]>([])
  const [msg, setMsg] = useState('')
  const [costs, setCosts] = useState<Record<string, { cost_metal: number; cost_crystal: number; cost_food: number }>>({})

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data, error } = await supabase.from('building_types').select('*').order('name')
    if (error) {
      setMsg(error.message || '')
    } else {
      setBuildings(data || [])
      const initialCosts: { [key: string]: { cost_metal: number, cost_crystal: number, cost_food: number } } = {}
      data?.forEach(b => {
        initialCosts[String(b.id)] = {
          cost_metal: b.cost_metal,
          cost_crystal: b.cost_crystal,
          cost_food: b.cost_food
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
      .from('building_types')
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
      <h3 className="font-medium">Building Costs</h3>
      <p className="text-sm text-slate-400 mt-2">{msg}</p>
      <ul className="text-slate-300">
        {buildings.map(b => (
          <li key={b.id} className="py-2 border-b border-slate-700 space-y-2">
            <div className="font-medium">{b.name}</div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                Metal:
                <input
                  type="number"
                  className="w-24 p-1 rounded bg-slate-900"
                  value={costs[b.id]?.cost_metal || 0}
                  onChange={e => handleCostChange(b.id, 'cost_metal', e.target.value)}
                />
              </label>
              <label className="flex items-center gap-2">
                Crystal:
                <input
                  type="number"
                  className="w-24 p-1 rounded bg-slate-900"
                  value={costs[b.id]?.cost_crystal || 0}
                  onChange={e => handleCostChange(b.id, 'cost_crystal', e.target.value)}
                />
              </label>
              <label className="flex items-center gap-2">
                Food:
                <input
                  type="number"
                  className="w-24 p-1 rounded bg-slate-900"
                  value={costs[b.id]?.cost_food || 0}
                  onChange={e => handleCostChange(b.id, 'cost_food', e.target.value)}
                />
              </label>
              <button onClick={() => save(b.id)} className="bg-emerald-500 px-3 py-1 rounded">Save</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
