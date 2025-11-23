'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ResourcesPanel from '@/components/game/ResourcesPanel'
import FleetPanel from '@/components/game/FleetPanel'
import TechPanel from '@/components/game/TechPanel'
import BuildingsPanel from '@/components/game/BuildingsPanel'
import ConstructionPanel from '@/components/game/ConstructionPanel'
import type { Resource, PlayerBuilding, BuildingType, PlayerShip } from '@/types'

const supabase = createClient()

export default function GamePage() {
  const [userName, setUserName] = useState('Commander')
  const [resources, setResources] = useState<Resource[]>([])
  const [buildings, setBuildings] = useState<PlayerBuilding[]>([])
  const [buildingTypes, setBuildingTypes] = useState<BuildingType[]>([])
  const [ships, setShips] = useState<PlayerShip[]>([])
  const [alerts, setAlerts] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBuilding, setIsBuilding] = useState(false)

  const hasShelter = buildings.some(b => b.building_types.name === 'Shelter' && b.level > 0)

  // ─────────────────────────────────────────────────────────────
  // Get display name from email
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserName(data.user.email.split('@')[0])
      }
    })
  }, [])

  // ─────────────────────────────────────────────────────────────
  // Auto-refresh data every 15 seconds
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 15000)
    return () => clearInterval(interval)
  }, [])

  // ─────────────────────────────────────────────────────────────
  // FINAL BULLETPROOF DATA LOADER + AUTO PLAYER & STARTER SETUP
  // ─────────────────────────────────────────────────────────────
  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.warn('No authenticated user')
        return
      }

      // 1. Check if player already exists
      let { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      // 2. If not → create player + give starter resources & Shelter
      if (!player) {
        console.log('No player found → creating new empire for', user.email)

        const { data: newPlayer, error: createError } = await supabase
          .from('players')
          .insert({ user_id: user.id })
          .select('id')
          .single()

        if (createError || !newPlayer) {
          throw new Error('Failed to create player: ' + createError?.message)
        }

        player = newPlayer

        // Give starter resources
        await supabase.from('resources').insert([
          { player_id: player.id, resource_type: 'metal', quantity: 500 },
          { player_id: player.id, resource_type: 'crystal', quantity: 300 },
          { player_id: player.id, resource_type: 'food', quantity: 200 },
        ])

        // Give starter Shelter (level 1)
        const { data: shelterType } = await supabase
          .from('building_types')
          .select('id')
          .eq('name', 'Shelter')
          .single()

        if (shelterType) {
          await supabase.from('player_buildings').insert({
            player_id: player.id,
            building_type_id: shelterType.id,
            level: 1,
          })
        }
      }

      // 3. NOW load all player data — guaranteed to exist
      const [
        { data: res },
        { data: blds },
        { data: types },
        { data: fleet },
      ] = await Promise.all([
        supabase.from('resources').select('*').eq('player_id', player.id),
        supabase.from('player_buildings').select('*, building_types(*)').eq('player_id', player.id),
        supabase.from('building_types').select('*'),
        supabase.from('player_ships').select('*, ship_types(*)').eq('player_id', player.id),
      ])

      setResources(res || [])
      setBuildings(blds || [])
      setBuildingTypes(types || [])
      setShips(fleet || [])

    } catch (err: any) {
      console.error('Critical error in loadData:', err)
    } finally {
      setIsLoading(false)   // ← This runs EVERY time — no more stuck screens
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER LOGIC
  // ─────────────────────────────────────────────────────────────

  // 1. Initial loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-5xl font-bold text-cyan-400 animate-pulse">
          Entering orbit...
        </div>
      </div>
    )
  }

  // 2. Safety fallback (should almost never show now)
  if (!resources.length || !buildings.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-6xl font-bold text-cyan-400 animate-pulse mb-8">
            Initializing your empire...
          </div>
          <p className="text-xl">Please wait a moment and refresh if needed.</p>
        </div>
      </div>
    )
  }

  // 3. MAIN GAME DASHBOARD — you will always reach here
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-cyan-600/30">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Orbital Dominion
          </h1>
          <div className="text-xl">
            Welcome, <span className="text-emerald-300 font-semibold">{userName}</span>
          </div>
        </div>
      </header>

      {/* Future alerts */}
      {alerts.length > 0 && (
        <div className="bg-red-900/90 border-y-4 border-red-500 text-center py-4">
          {alerts.map((a, i) => (
            <div key={i} className="text-xl font-bold text-red-100">{a}</div>
          ))}
        </div>
      )}

      {/* Shelter warning */}
      {!hasShelter && (
        <div className="bg-orange-900/70 text-orange-100 text-center py-4 text-lg font-medium">
          Your first priority is to protect your crew. Construct a Shelter to begin.
        </div>
      )}

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Sidebar */}
          <aside className="lg:col-span-3 space-y-6">
            <ResourcesPanel resources={resources} buildings={buildings} />
            <FleetPanel ships={ships} />
            <TechPanel techs={[]} />
          </aside>

          {/* Center: Your Buildings */}
          <main className="lg:col-span-5">
            <div className="bg-slate-800/70 backdrop-blur-lg rounded-2xl border border-cyan-500/40 p-8">
              <h2 className="text-3xl font-bold text-emerald-400 mb-8 text-center">Your Buildings</h2>
              <BuildingsPanel
                buildings={buildings}
                resources={resources}
                onGameUpdate={loadData}
              />
            </div>
          </main>

          {/* Right: Construction */}
          <aside className="lg:col-span-4">
            <div className="bg-slate-800/70 backdrop-blur-lg rounded-2xl border border-purple-500/40 p-8">
              <h2 className="text-3xl font-bold text-purple-400 mb-8 text-center">Construct New</h2>
              <ConstructionPanel
                buildingTypes={buildingTypes}
                buildings={buildings}
                resources={resources}
                hasShelter={hasShelter}
                isBuilding={isBuilding}
                onGameUpdate={loadData}
              />
            </div>
          </aside>

        </div>
      </div>
    </div>
  )
}
