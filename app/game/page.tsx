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

const supabase = createClient()

export default function GamePage() {
  const [playerResources, setPlayerResources] = useState<Resource[]>([])
  const [buildings, setBuildings] = useState<PlayerBuilding[]>([])
  const [buildingTypes, setBuildingTypes] = useState<BuildingType[]>([])
  const [ships, setShips] = useState<Ship[]>([])
  const [isBuilding, setIsBuilding] = useState(false)
  const [message, setMessage] = useState('')
  const [userEmail, setUserEmail] = useState<string>('Commander')

  const hasShelter = buildings.some(b => b.building_types.name === 'Shelter' && b.level > 0)

  // Load user email once
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserEmail(data.user.email.split('@')[0]) // show username only
      }
    })
  }, [])

  useEffect(() => {
    loadGameData()
    const interval = setInterval(loadGameData, 10000)
    return () => clearInterval(interval)
  }, [])

  async function loadGameData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: player } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!player) return

    const [
      { data: res },
      { data: blds },
      { data: bTypes },
      { data: fleet }
    ] = await Promise.all([
      supabase.from('resources').select('*').eq('player_id', player.id),
      supabase.from('player_buildings').select('*, building_types(*)').eq('player_id', player.id),
      supabase.from('building_types').select('*'),
      supabase.from('player_ships').select('*, ship_types(*)').eq('player_id', player.id)
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
    const { data: { user } } = await supabase.auth.getUser()
    const { data: player } = await supabase.from('players').select('id').eq('user_id', user?.id).single()

    const { error } = await supabase.rpc('build_building', {
      p_player_id: player?.id,
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
          <div className="text-lg opacity-90">
            Welcome, <span className="text-emerald-300 font-medium">{userEmail}</span>
          </div>
        </div>
      </div>

      {/* Alert */}
      {!hasShelter && (
        <div className="bg-orange-900/60 border border-orange-500 text-orange-200 px-6 py-4 text-center font-medium text-lg">
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

          {/* LEFT COLUMN */}
          <div className="lg:col-span-3 space-y-6">
            <ResourcesPanel resources={playerResources} />
            <FleetPanel ships={ships} />
            <TechPanel techs={[]} />
          </div>

          {/* CENTER COLUMN - Your Buildings */}
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
