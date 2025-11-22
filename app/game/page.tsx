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

  const hasShelter = buildings.some(
    b => b.building_types.name === 'Shelter' && b.level > 0
  )

  // Get username
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserName(data.user.email.split('@')[0])
      }
    })
  }, [])

  // Auto-refresh every 15 seconds
  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 15000)
    return () => clearInterval(interval)
  }, [])

  // ─────────────────────────────────────────────────────────────
  // BULLETPROOF DATA LOADER – never gets stuck
  // ─────────────────────────────────────────────────────────────
  async function loadData() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.warn('No authenticated user')
        return
      }

      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (playerError || !player) {
        console.error('Player not found:', playerError?.message)
        return
      }

      const [
        { data: res, error: resErr },
        { data: blds, error: bldErr },
        { data: types, error: typeErr },
        { data: fleet, error: fleetErr }
      ] = await Promise.all([
        supabase.from('resources').select('*').eq('player_id', player.id),
        supabase.from('player_buildings').select('*, building_types(*)').eq('player_id', player.id),
        supabase.from('building_types').select('*'),
        supabase.from('player_ships').select('*, ship_types(*)').eq('player_id', player.id)
      ])

      // Log errors but never block UI
      if (resErr) console.error('Resources error:', resErr.message)
      if (bldErr) console.error('Buildings error:', bldErr.message)
      if (typeErr) console.error('Building types error:', typeErr.message)
      if (fleetErr) console.error('Fleet error:', fleetErr.message)

      setResources(res || [])
      setBuildings(blds || [])
      setBuildingTypes(types || [])
      setShips(fleet || [])

    } catch (err: any) {
      console.error('Unexpected error in loadData:', err)
    } finally {
      setIsLoading(false)   // ← This guarantees we always exit loading screen
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  // 1. Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-5xl font-bold text-cyan-400 animate-pulse">
          Entering orbit...
        </div>
      </div>
    )
  }

  // 2. First-time player / empty data fallback
  if (!resources.length && !buildings.length && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center text-white">
        <div className="text-center max-w-2xl px-8">
          <h1 className="text-5xl font-bold text-emerald-400 mb-6">
            Welcome to Orbital Dominion, {userName}!
          </h1>
          <p className="text-xl mb-4">
            Your empire is being initialized...
          </p>
          <p className="text-lg opacity-80">
            If this is your first login, your starter resources and buildings are being created right now.<br />
            Refresh in a few seconds or check your Supabase dashboard.
          </p>
        </div>
      </div>
    )
  }

  // 3. Main dashboard (everything working)
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

      {/* Alerts (future attacks, etc.) */}
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

      {/* Main 3-column layout */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT SIDEBAR */}
          <aside className="lg:col-span-3 space-y-6">
            <ResourcesPanel resources={resources} buildings={buildings} />
            <FleetPanel ships={ships} />
            <TechPanel techs={[]} />
          </aside>

          {/* CENTER – Your Buildings */}
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

          {/* RIGHT – Construction */}
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
