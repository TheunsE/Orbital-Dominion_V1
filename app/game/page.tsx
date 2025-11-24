'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ResourcesPanel from '@/components/game/ResourcesPanel'
import FleetPanel from '@/components/game/FleetPanel'
import TechPanel from '@/components/game/TechPanel'
import BuildingsPanel from '@/components/game/BuildingsPanel'
import ConstructionPanel from '@/components/game/ConstructionPanel'
import type { Resource, PlayerBuilding, BuildingType, PlayerShip } from '@/types'
import TutorialPanel from '@/components/game/TutorialPanel'

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
  const [isNewPlayer, setIsNewPlayer] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)

  const hasShelter = buildings.some(b => b.building_types.name === 'Shelter' && b.level > 0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserName(data.user.email.split('@')[0])
      }
    })
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 15000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.warn('No authenticated user')
      return
    }

    // CORRECTED: Use the player's ID directly (same as user ID)
    const playerId = user.id

    let { data: player } = await supabase
      .from('players')
      .select('id')
      .eq('id', playerId) // CORRECTED: Use 'id' not 'user_id'
      .maybeSingle()

    if (!player) {
      console.log('No player found → waiting for trigger to create player')
      // The trigger should create the player automatically
      setIsLoading(false)
      return
    }

    const [
      { data: res },
      { data: blds },
      { data: types },
      { data: fleet },
    ] = await Promise.all([
      supabase.from('resources').select('*').eq('player_id', playerId),
      supabase.from('player_buildings').select('*, building_types(*)').eq('player_id', playerId),
      supabase.from('building_types').select('*'),
      supabase.from('player_ships').select('*, ship_types(*)').eq('player_id', playerId),
    ])

    // Check if this is a new player (no buildings)
    if (blds && blds.length === 0) {
      setIsNewPlayer(true)
      setTutorialStep(1) // Start tutorial
    } else if (blds) {
      // Tutorial progression based on actual building names
      const hasShelter = blds.some(b => b.building_types.name === 'Shelter')
      const hasMine = blds.some(b => b.building_types.name === 'Metal Mine')
      const hasExtractor = blds.some(b => b.building_types.name === 'Crystal Extractor')
      const hasFarm = blds.some(b => b.building_types.name === 'Hydroponics Farm')
      const hasPlant = blds.some(b => b.building_types.name === 'Solar Plant')
      const hasDepot = blds.some(b => b.building_types.name === 'Storage Depot')

      if (!hasShelter) setTutorialStep(1)
      else if (hasShelter && !hasMine) setTutorialStep(2)
      else if (hasMine && !hasExtractor) setTutorialStep(3)
      else if (hasExtractor && !hasFarm) setTutorialStep(4)
      else if (hasFarm && !hasPlant) setTutorialStep(5)
      else if (hasPlant && !hasDepot) setTutorialStep(6)
      else setTutorialStep(0) // Completed
    }

    setResources(res || [])
    setBuildings(blds || [])
    setBuildingTypes(types || [])
    setShips(fleet || [])

  } catch (err: any) {
    console.error('Critical error in loadData:', err)
    setAlerts(['Failed to load game data. Please refresh the page.'])
  } finally {
    setIsLoading(false)
  }
}

  const handleTutorialAdvance = () => {
    // This will be called after a building is constructed
    loadData()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-5xl font-bold text-cyan-400 animate-pulse">
          Entering orbit...
        </div>
      </div>
    )
  }
  
  // Custom check for the "stuck" screen
  if (!resources.length && isNewPlayer === false) {
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


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
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

      {alerts.length > 0 && (
        <div className="bg-red-900/90 border-y-4 border-red-500 text-center py-4">
          {alerts.map((a, i) => (
            <div key={i} className="text-xl font-bold text-red-100">{a}</div>
          ))}
        </div>
      )}

      {/* TUTORIAL PANEL */}
      {isNewPlayer && tutorialStep > 0 && (
        <TutorialPanel 
          step={tutorialStep} 
          onDismiss={() => {
            setIsNewPlayer(false)
            setTutorialStep(0)
          }} 
        />
      )}

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3 space-y-6">
            <ResourcesPanel resources={resources} buildings={buildings} />
            <FleetPanel ships={ships} />
            <TechPanel techs={[]} />
          </aside>

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

          <aside className="lg:col-span-4">
            <div className="bg-slate-800/70 backdrop-blur-lg rounded-2xl border border-purple-500/40 p-8">
              <h2 className="text-3xl font-bold text-purple-400 mb-8 text-center">Construct New</h2>
              <ConstructionPanel
                buildingTypes={buildingTypes}
                buildings={buildings}
                resources={resources}
                hasShelter={hasShelter}
                isBuilding={isBuilding}
                onGameUpdate={handleTutorialAdvance} // Use the new handler
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
