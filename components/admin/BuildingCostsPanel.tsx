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
      const initialCosts: Record<string, any> = {}
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

  const handleCostChange = (id: string, resource: 'cost_metal' | 'cost_crystal' | 'cost_food', value: string) => {
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
      .from('building_types')
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
    <div className="bg-slate-800 p-6 rounded-lg">
      <h3 className="text-2xl font-bold text-emerald-400 mb-4">Building Costs Editor</h3>
      <p className="text-sm text-green-400 mb-4">{msg}</p>
      <div className="space-y-4">
        {buildings.map(b => (
          <div key={b.id} className="bg-slate-700/50 p-4 rounded border border-slate-600">
            <div className="font-semibold text-lg mb-3">{b.name} (Tier {b.tier})</div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <label className="flex items-center gap-2">
                <span className="text-cyan-300">Metal:</span>
                <input
                  type="number"
                  className="w-32 p-2 rounded bg-slate-900 text-white"
                  value={costs[String(b.id)]?.cost_metal || 0}
                  onChange={e => handleCostChange(String(b.id), 'cost_metal', e.target.value)}
                />
              </label>
              <label className="flex items-center gap-2">
                <span className="text-purple-300">Crystal:</span>
                <input
                  type="number"
                  className="w-32 p-2 rounded bg-slate-900 text-white"
                  value={costs[String(b.id)]?.cost_crystal || 0}
                  onChange={e => handleCostChange(String(b.id), 'cost_crystal', e.target.value)}
                />
              </label>
              <label className="flex items-center gap-2">
                <span className="text-yellow-300">Food:</span>
                <input
                  type="number"
                  className="w-32 p-2 rounded bg-slate-900 text-white"
                  value={costs[String(b.id)]?.cost_food || 0}
                  onChange={e => handleCostChange(String(b.id), 'cost_food', e.target.value)}
                />
              </label>
              <button onClick={() => save(b.id)} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded font-medium">
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
