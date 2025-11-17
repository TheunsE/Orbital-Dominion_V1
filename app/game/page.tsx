'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PlayerResource, PlayerBuilding, BuildingType } from '@/types'
import BuildButton from '@/components/ui/BuildButton'

export default function Game() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [resources, setResources] = useState<PlayerResource[]>([])
  const [buildings, setBuildings] = useState<PlayerBuilding[]>([])
  const [buildingTypes, setBuildingTypes] = useState<BuildingType[]>([])

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      if (data.user) {
        fetchGameData(data.user.id)
      }
      setLoading(false)
    }
    init()
    fetchBuildingTypes()
  }, [])

  const fetchGameData = async (userId: string) => {
    const { data: resourcesData } = await supabase
      .from('resources')
      .select('*')
      .eq('player_id', userId)
    setResources(resourcesData || [])

    const { data: buildingsData } = await supabase
      .from('player_buildings')
      .select('*, building_types(*)')
      .eq('player_id', userId)
    setBuildings(buildingsData || [])
  }

  const fetchBuildingTypes = async () => {
    const { data } = await supabase.from('building_types').select('*')
    setBuildingTypes(data || [])
  }

  if (loading) return <div>Loading...</div>
  if (!user)
    return (
      <div className="text-center mt-10">
        Please <a href="/auth/signin" className="text-emerald-400">sign in</a>.
      </div>
    )

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-emerald-200">Game Dashboard</h2>
      <p className="text-slate-300">Welcome, {user.email}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-xl font-bold">Resources</h3>
          <ul>
            {resources.map((r) => (
              <li key={r.id}>
                {r.resource_type}: {r.quantity}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-bold">Buildings</h3>
          <ul>
            {buildings.map((b) => (
              <li key={b.id}>
                {b.building_types.name} (Level {b.level})
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div>
        <h3 className="text-xl font-bold">Construct</h3>
        <div className="flex gap-2">
          {buildingTypes.map((bt) => (
            <BuildButton key={bt.id} buildingType={bt} />
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-bold">Game Messages</h3>
        <p>No messages yet.</p>
      </div>
    </div>
  )
}
