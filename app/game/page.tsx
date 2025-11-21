'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PlayerResource, PlayerBuilding, BuildingType, ShipType, PlayerShip, TechType, PlayerTech } from '@/types'
import Message from '@/components/ui/Message'
import ResourcesPanel from '@/components/game/ResourcesPanel'
import FleetPanel from '@/components/game/FleetPanel'
import TechPanel from '@/components/game/TechPanel'
import BuildingsPanel from '@/components/game/BuildingsPanel'
import ConstructionPanel from '@/components/game/ConstructionPanel'

export default function Game() {
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [resources, setResources] = useState<PlayerResource[]>([])
  const [buildings, setBuildings] = useState<PlayerBuilding[]>([])
  const [ships, setShips] = useState<PlayerShip[]>([])
  const [techs, setTechs] = useState<PlayerTech[]>([])

  const [buildingTypes, setBuildingTypes] = useState<BuildingType[]>([])
  const [shipTypes, setShipTypes] = useState<ShipType[]>([])
  const [techTypes, setTechTypes] = useState<TechType[]>([])

  const [hasShelter, setHasShelter] = useState(false)
  const [isBuilding, setIsBuilding] = useState(false)

  const [currentMessages, setCurrentMessages] = useState<string[]>([])

  // ------------------------------------------
  // FETCH GAME DATA
  // ------------------------------------------
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

    const shelter = buildingsData?.find(
      b =>
        b.building_types.name === 'Shelter' &&
        (!b.construction_ends_at ||
          new Date(b.construction_ends_at) <= new Date())
    )
    setHasShelter(!!shelter)

    const currentlyBuilding = buildingsData?.some(b => {
  if (!b.construction_ends_at) return false

  const end = new Date(b.construction_ends_at)

  // Only treat it as "under construction" if:
  // 1. It is a valid date
  // 2. The end time is in the future
  return !isNaN(end.getTime()) && end > new Date()
})
    setIsBuilding(!!currentlyBuilding)

    const { data: shipsData } = await supabase
      .from('player_ships')
      .select('*, ship_types(*)')
      .eq('player_id', userId)

    setShips(shipsData || [])

    const { data: techsData } = await supabase
      .from('player_techs')
      .select('*, tech_types(*)')
      .eq('player_id', userId)

    setTechs(techsData || [])
  }

  const fetchGameTypes = async () => {
    const { data: buildingTypesData } = await supabase.from('building_types').select('*')
    setBuildingTypes(buildingTypesData || [])

    const { data: shipTypesData } = await supabase.from('ship_types').select('*')
    setShipTypes(shipTypesData || [])

    const { data: techTypesData } = await supabase.from('tech_types').select('*')
    setTechTypes(techTypesData || [])
  }

  // ------------------------------------------
  // INITIAL LOAD (Runs Once)
  // ------------------------------------------
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)

      if (data.user) {
        await fetchGameData(data.user.id)
      }

      setLoading(false)
    }

    init()
    fetchGameTypes()
  }, [])

  // ------------------------------------------
  // REAL-TIME DATA SUBSCRIPTION
  // ------------------------------------------
  useEffect(() => {
    if (!user) return

    // Subscribe to player_buildings changes
    const buildingsSubscription = supabase
      .channel('player_buildings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_buildings' }, 
        () => fetchGameData(user.id)
      )
      .subscribe()

    // Subscribe to resources changes
    const resourcesSubscription = supabase
      .channel('resources')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, 
        () => fetchGameData(user.id)
      )
      .subscribe()

    // Cleanup subscriptions on component unmount
    return () => {
      supabase.removeChannel(buildingsSubscription)
      supabase.removeChannel(resourcesSubscription)
    }
  }, [user, supabase])

  // ------------------------------------------
  // STORY LOGIC FIXED
  // ------------------------------------------
  useEffect(() => {
    const hasBuilding = (name: string) =>
      buildings.some(
        b =>
          b.building_types.name === name &&
          (!b.construction_ends_at ||
            new Date(b.construction_ends_at) <= new Date())
      )

    const storyMessage =
      "The year is 2242. You are the commander of a small colonization vessel, sent to establish a new human presence on a distant exoplanet. After a long and arduous journey, you have crash-landed on the planet. Your ship is destroyed and survival is now your responsibility."

    const shelterMessage =
      "Your first priority is to protect your crew. Construct a Shelter to begin."

    const metalMineMessage =
      "Good work, Commander. With shelter established, your colony needs raw materials. Construct a Metal Mine to begin resource extraction."

    const solarPanelsMessage =
      "Metal production is online. Your next priority is power. Build Solar Panels to provide energy for future buildings."

    const oxygenExtractorMessage =
      "Now you must secure breathable air. Construct an Oxygen Extractor to begin processing the planet’s thin atmosphere."

    const farmMessage =
      "Your crew needs a stable food source. Build a Farm to begin sustainable food production."

    // Tutorial steps:
    if (!hasBuilding("Shelter")) {
      setCurrentMessages([storyMessage, shelterMessage])
      return
    }

    if (hasBuilding("Shelter") && !hasBuilding("Metal Mine")) {
      setCurrentMessages([metalMineMessage])
      return
    }

    if (hasBuilding("Metal Mine") && !hasBuilding("Solar Panels")) {
      setCurrentMessages([solarPanelsMessage])
      return
    }

    if (hasBuilding("Solar Panels") && !hasBuilding("Oxygen Extractor")) {
      setCurrentMessages([oxygenExtractorMessage])
      return
    }

    if (hasBuilding("Oxygen Extractor") && !hasBuilding("Farm")) {
      setCurrentMessages([farmMessage])
      return
    }

    setCurrentMessages([])
  }, [buildings])

  const handleGameUpdate = () => {
    if (user) fetchGameData(user.id)
  }

  // ------------------------------------------
  // RENDER
  // ------------------------------------------
  if (loading) return (<div>Loading...</div>)

  if (!user)
    return (
      <div className="text-center mt-10">
        Please <a href="/auth/signin" className="text-emerald-400">sign in</a>.
      </div>
    )

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-3xl font-bold text-emerald-300">Game Dashboard</h2>
      <p className="text-slate-400">Welcome, {user.email}</p>

      {currentMessages.length > 0 && <Message messages={currentMessages} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-1 space-y-4">
          <ResourcesPanel resources={resources} />
          <FleetPanel ships={ships} />
          <TechPanel techs={techs} />
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-4">
          <BuildingsPanel
            buildings={buildings}
            resources={resources}
            onGameUpdate={handleGameUpdate}
          />
          <ConstructionPanel
            buildingTypes={buildingTypes}
            buildings={buildings}
            resources={resources}
            isBuilding={isBuilding}
            hasShelter={hasShelter}
            onGameUpdate={handleGameUpdate}
          />
        </div>

      </div>
    </div>
  )
}
