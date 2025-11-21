'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { BuildingType } from '@/types'

const AdminBuildingTypes = () => {
  const [buildingTypes, setBuildingTypes] = useState<BuildingType[]>([])
  const [name, setName] = useState('')
  const [costMetal, setCostMetal] = useState(0)
  const [costCrystal, setCostCrystal] = useState(0)
  const [costFood, setCostFood] = useState(0)

  useEffect(() => {
    fetchBuildingTypes()
  }, [])

  const fetchBuildingTypes = async () => {
    const { data, error } = await supabase.from('building_types').select('*')
    if (data) setBuildingTypes(data)
  }

  const handleAddBuilding = async () => {
    await supabase.from('building_types').insert({ name, cost_metal: costMetal, cost_crystal: costCrystal, cost_food: costFood })
    fetchBuildingTypes()
  }

  const handleDeleteBuilding = async (id: number) => {
    await supabase.from('building_types').delete().eq('id', id)
    fetchBuildingTypes()
  }

  return (
    <div className="p-4 bg-gray-800 text-white">
      <h2 className="text-xl mb-4">Building Types</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-gray-700 p-2 rounded"
        />
        <input
          type="number"
          placeholder="Metal Cost"
          value={costMetal}
          onChange={(e) => setCostMetal(Number(e.target.value))}
          className="bg-gray-700 p-2 rounded"
        />
        <input
          type="number"
          placeholder="Crystal Cost"
          value={costCrystal}
          onChange={(e) => setCostCrystal(Number(e.target.value))}
          className="bg-gray-700 p-2 rounded"
        />
        <input
          type="number"
          placeholder="Food Cost"
          value={costFood}
          onChange={(e) => setCostFood(Number(e.target.value))}
          className="bg-gray-700 p-2 rounded"
        />
        <button
          onClick={handleAddBuilding}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Add Building
        </button>
      </div>
      <ul>
        {buildingTypes.map((bt) => (
          <li
            key={bt.id}
            className="flex justify-between items-center bg-gray-700 p-2 rounded mb-2"
          >
            <span>
              {bt.name} - Metal: {bt.cost_metal}, Crystal: {bt.cost_crystal}, Food: {bt.cost_food}
            </span>
            <button
              onClick={() => handleDeleteBuilding(bt.id)}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AdminBuildingTypes
