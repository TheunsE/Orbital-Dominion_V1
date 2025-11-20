'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PlayerResource, PlayerBuilding, BuildingType, ShipType, PlayerShip, TechType, PlayerTech } from '@/types'
import BuildButton from '@/components/ui/BuildButton'
import UpgradeButton from '@/components/ui/UpgradeButton'
import CountdownTimer from '@/components/ui/CountdownTimer'
import Message from '@/components/ui/Message'

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

    const currentlyBuilding = buildingsData?.some(
      b => b.construction_ends_at && new Date(b.construction_ends_at) > new Date()
    )
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
  // START LIVE POLLING WHEN USER IS LOADED
  // ------------------------------------------
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      fetchGameData(user.id)
    }, 1000)

    return () => clearInterval(interval)
  }, [user])

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
  if (loading) return <div>Loading...</div>

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

          {/* RESOURCES */}
          <div>
            <h3 className="text-2xl font-semibold text-emerald-400">Resources</h3>
            <ul className="bg-slate-800 p-4 rounded-lg">
              {resources.map(r => (
                <li key={r.id} className="text-lg">
                  {r.resource_type}: {r.quantity}
                </li>
              ))}
            </ul>
          </div>

          {/* SHIPS */}
          <div>
            <h3 className="text-2xl font-semibold text-emerald-400">Your Fleet</h3>
            <ul className="bg-slate-800 p-4 rounded-lg">
              {ships.map(s => (
                <li key={s.id}>{s.ship_types.name}: {s.quantity}</li>
              ))}
            </ul>
          </div>

          {/* TECH */}
          <div>
            <h3 className="text-2xl font-semibold text-emerald-400">Unlocked Tech</h3>
            <ul className="bg-slate-800 p-4 rounded-lg">
              {techs.map(t => (
                <li key={t.id}>{t.tech_types.name}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-4">

          {/* BUILDINGS */}
          <div>
            <h3 className="text-2xl font-semibold text-emerald-400">Your Buildings</h3>
            <ul className="space-y-2">
              {buildings.map(b => (
                <li
                  key={b.id}
                  className="bg-slate-800 p-3 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold">
                      {b.building_types.name} (Level {b.level})
                    </p>

                    {/* Construction countdown or stats */}
                    {b.construction_ends_at &&
                      new Date(b.construction_ends_at) > new Date()
                      ? (
                        <CountdownTimer endDate={new Date(b.construction_ends_at)} />
                      ) : (
                        <p className="text-sm text-slate-400">
                          {b.building_types.base_production > 0 &&
                            `Production: ${
                              b.building_types.base_production *
                              (1 +
                                (b.level - 1) *
                                  b.building_types.production_bonus_per_level)
                            }/hr `}

                          {b.building_types.base_storage > 0 &&
                            `Storage: ${
                              b.building_types.base_storage *
                              (1 +
                                (b.level - 1) *
                                  b.building_types.storage_bonus_per_level)
                            } `}

                          {b.building_types.base_power_generation > 0 &&
                            `Power: ${
                              b.level * b.building_types.power_generation_per_level
                            }`}
                        </p>
                      )}
                  </div>

                  {/* FIXED UPGRADE BUTTON CONDITION */}
                  {(!b.construction_ends_at ||
                    new Date(b.construction_ends_at) <= new Date()) && (
                      <UpgradeButton
                        playerBuildingId={b.id}
                        onUpgraded={handleGameUpdate}
                      />
                    )}
                </li>
              ))}
            </ul>
          </div>

          {/* CONSTRUCT NEW BUILDINGS */}
          <div>
            <h3 className="text-2xl font-semibold text-emerald-400">Construct</h3>

            <div className="flex flex-wrap gap-2">
              {buildingTypes.map(bt => {
                const isShelter = bt.name === 'Shelter'
                const existingBuilding = buildings.find(b => b.building_type_id === bt.id)

                const disabled = !!(existingBuilding || isBuilding || (!isShelter && !hasShelter)

                const disabledText =
                  existingBuilding
                    ? 'Already Built'
                    : isBuilding
                      ? 'Construction in Progress'
                      : 'Requires Shelter'

                if (isShelter && hasShelter) return null

                return (
                  <BuildButton
                    key={bt.id}
                    buildingType={bt}
                    disabled={disabled}
                    disabledText={disabledText}
                    onBuilt={handleGameUpdate}
                  />
                )
              })}
            </div>

          </div>

        </div>

      </div>
    </div>
  )
           }
