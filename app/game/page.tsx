'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ResourcesPanel from '@/components/game/ResourcesPanel'
import FleetPanel from '@/components/game/FleetPanel'
import TechPanel from '@/components/game/TechPanel'
import BuildingsPanel from '@/components/game/BuildingsPanel'
import ConstructionPanel from '@/components/game/ConstructionPanel'
import { hasSufficientResources } from '@/lib/game-logic'
import type { Resource, PlayerBuilding, BuildingType, Ship } from '@/types'

export default function GamePage() {
  const supabase = createClient()
  const [playerResources, setPlayerResources] = useState<Resource[]>([])
  const [buildings, setBuildings] = useState<PlayerBuilding[]>([])
  const [buildingTypes, setBuildingTypes] = useState<BuildingType[]>([])
  const [ships, setShips] = useState<Ship[]>([])
  const [isBuilding, setIsBuilding] = useState(false)
  const [message, setMessage] = useState('')

  const hasShelter = buildings.some(b => b.building_types.name === 'Shelter' && b.level > 0)

  useEffect(() => {
    loadGameData()
    const interval = setInterval(loadGameData, 10000) // refresh every 10s
    return () => clearInterval(interval)
  }, [])

  async function loadGameData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const playerRes = await supabase.from('players').select('id').eq('user_id', user.id).single()
    if (!playerRes.data) return
    const playerId = playerRes.data.id

    // Load all data in parallel
    const [
      { data: res },
      { data: blds },
      { data: bTypes },
      { data: fleet }
    ] = await Promise.all([
      supabase.from('resources').select('*').eq('player_id', playerId),
      supabase.from('player_buildings').select('*, building_types(*)').eq('player_id', playerId),
      supabase.from('building_types').select('*'),
      supabase.from('player_ships').select('*, ship_types(*)').eq('player_id', playerId)
    ])

    setPlayerResources(res || [])
    setBuildings(blds || [])
    setBuildingTypes(bTypes || [])
    setShips(fleet || [])
  }

  async function handleBuild(buildingType: BuildingType) {
    const costs = [
      { resource_type: 'metal' as const, cost: buildingType.cost_metal },
      { resource_type: 'crystal' as const, cost: buildingType.cost_crystal },
      { resource_type: 'food' as const, cost: buildingType.cost_food },
    ]

    if (!hasSufficientResources(playerResources, costs)) {
      setMessage('Not enough resources!')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    setIsBuilding(true)
    const { error } = await supabase.rpc('build_building', {
      p_player_id: (await supabase.from('players').select('id').eq('user_id', (await supabase.auth.getUser()).data.user?.id).single()).data?.id,
      p_building_type_id: buildingType.id
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage(`Started building ${buildingType.name}!`)
      loadGameData()
    }
    setIsBuilding(false)
    setTimeout(() => setMessage(''), 4000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur border-b border-cyan-500/30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Game Dashboard
          </h1>
          <div className="text-sm opacity-80">
            Welcome, {(await supabase.auth.getUser()).data.user?.email}
          </div>
        </div>
      </div>

      {/* Alert */}
      {!hasShelter && (
        <div className="bg-orange-900/50 border border-orange-500 text-orange-200 px-6 py-4 text-center font-medium">
          Your first priority is to protect your crew. Construct a Shelter to begin.
        </div>
      )}

      {message && (
        <div className="bg-emerald-900/80 border border-emerald-500 text-emerald-200 px-6 py-3 text-center font-medium">
          {message}
        </div>
      )}

      {/* Main 3-column layout */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN - Resources + Fleet */}
          <div className="lg:col-span-3 space-y-6">
            <ResourcesPanel resources={playerResources} />
            <FleetPanel ships={ships} />
            <TechPanel techs={[]} />
          </div>

          {/* CENTER COLUMN - Buildings List */}
          <div className="lg:col-span-5">
            <div className="bg-slate-800/80 backdrop-blur rounded-xl border border-cyan-500/30 p-6">
              <h2 className="text-2xl font-bold text-emerald-400 mb-6">Your Buildings</h2>
              <BuildingsPanel
                buildings={buildings}
                resources={playerResources}
                onGameUpdate={loadGameData}
              />
            </div>
          </div>

          {/* RIGHT COLUMN - Construction */}
          <div className="lg:col-span-4">
            <div className="bg-slate-800/80 backdrop-blur rounded-xl border border-purple-500/30 p-6">
              <h2 className="text-2xl font-bold text-purple-400 mb-6">Construct</h2>
              <ConstructionPanel
                buildingTypes={buildingTypes}
                buildings={buildings}
                resources={playerResources}
                isBuilding={isBuilding}
                hasShelter={hasShelter}
                onGameUpdate={loadGameData}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
