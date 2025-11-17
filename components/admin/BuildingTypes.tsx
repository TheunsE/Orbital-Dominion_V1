'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BuildingType } from '@/types'

export default function BuildingTypes() {
  const supabase = createClient()
  const [buildingTypes, setBuildingTypes] = useState<BuildingType[]>([])
  const [name, setName] = useState('')
  const [cost, setCost] = useState(0)

  useEffect(() => {
    fetchBuildingTypes()
  }, [])

  const fetchBuildingTypes = async () => {
    const { data } = await supabase.from('building_types').select('*')
    setBuildingTypes(data || [])
  }

  const handleAdd = async () => {
    await supabase.from('building_types').insert({ name, cost })
    fetchBuildingTypes()
  }

  const handleDelete = async (id: number) => {
    await supabase.from('building_types').delete().eq('id', id)
    fetchBuildingTypes()
  }

  return (
    <div>
      <h2 className="text-xl font-bold">Building Types</h2>
      <div className="flex gap-2 mt-4">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 rounded"
        />
        <input
          type="number"
          placeholder="Cost"
          value={cost}
          onChange={(e) => setCost(Number(e.target.value))}
          className="p-2 rounded"
        />
        <button onClick={handleAdd} className="bg-blue-500 text-white p-2 rounded">
          Add
        </button>
      </div>
      <ul className="mt-4">
        {buildingTypes.map((bt) => (
          <li key={bt.id} className="flex justify-between items-center p-2 border-b">
            <span>
              {bt.name} - {bt.cost}
            </span>
            <button onClick={() => handleDelete(bt.id)} className="bg-red-500 text-white p-1 rounded">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
