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

  const fetchGameData = async (userId: string) => {
    const { data: resourcesData } = await supabase.from('resources').select('*').eq('player_id', userId)
    setResources(resourcesData || [])

    const { data: buildingsData } = await supabase.from('player_buildings').select('*, building_types(*)').eq('player_id', userId)
    setBuildings(buildingsData || [])
    
    const shelter = buildingsData?.find(b => b.building_types.name === 'Shelter' && (!b.construction_ends_at || new Date(b.construction_ends_at) <= new Date()))
    setHasShelter(!!shelter)

    const currentlyBuilding = buildingsData?.some(b => b.construction_ends_at && new Date(b.construction_ends_at) > new Date())
    setIsBuilding(currentlyBuilding)
    
    const { data: shipsData } = await supabase.from('player_ships').select('*, ship_types(*)').eq('player_id', userId)
    setShips(shipsData || [])
    
    const { data: techsData } = await supabase.from('player_techs').select('*, tech_types(*)').eq('player_id', userId)
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
    fetchGameTypes()
    
    const interval = setInterval(() => {
        if (user) fetchGameData(user.id);
    }, 1000);

    return () => clearInterval(interval);
  }, [user])

  useEffect(() => {
    const hasBuilding = (name: string) => buildings.some(b => b.building_types.name === name && (!b.construction_ends_at || new Date(b.construction_ends_at) <= new Date()));

    const storyMessage = "The year is 2242. You are the commander of a small colonization vessel, sent to establish a new human presence on a distant exoplanet. After a long and arduous journey, you have finally arrived, but your vessel has sustained critical damage during atmospheric entry. You and your crew have managed to crash-land on the planet, but the ship is beyond repair.";
    const shelterMessage = "Your first priority is to establish a basic shelter to protect your crew from the harsh alien environment. Construct a Shelter to begin.";
    const metalMineMessage = "Excellent work, Commander. With the shelter in place, you can now turn your attention to resource acquisition. You will need Metal to construct more advanced buildings. Build a Metal Mine to begin extracting this vital resource.";
    const solarPanelsMessage = "Now that you have a steady supply of Metal, you will need to power your growing colony. Construct Solar Panels to generate the energy required for your buildings to operate.";
    const oxygenExtractorMessage = "With power secured, you must now address the issue of breathable air. The planet's atmosphere is thin and rich in carbon dioxide, but it contains trace amounts of oxygen that can be extracted. Build an Oxygen Extractor to provide your crew with a sustainable source of breathable air.";
    const farmMessage = "Your crew cannot survive on recycled nutrient paste forever. You must establish a sustainable food source. Build a Farm to cultivate crops and provide your colonists with fresh food.";

    const hasCompletedBuildings = buildings.some(b => !b.construction_ends_at || new Date(b.construction_ends_at) <= new Date());
    if (!hasCompletedBuildings) {
        setCurrentMessages([storyMessage, shelterMessage]);
        return;
    }
    
    if (hasBuilding('Shelter') && !hasBuilding('Metal Mine')) {
        setCurrentMessages([metalMineMessage]);
    } else if (hasBuilding('Metal Mine') && !hasBuilding('Solar Panels')) {
        setCurrentMessages([solarPanelsMessage]);
    } else if (hasBuilding('Solar Panels') && !hasBuilding('Oxygen Extractor')) {
        setCurrentMessages([oxygenExtractorMessage]);
    } else if (hasBuilding('Oxygen Extractor') && !hasBuilding('Farm')) {
        setCurrentMessages([farmMessage]);
    } else {
        setCurrentMessages([]);
    }
  }, [buildings]);
  
  const handleGameUpdate = () => {
    if (user) {
      fetchGameData(user.id)
    }
  }

  if (loading) return (<div>Loading...</div>) 
  if (!user) return (
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
        <div className="lg:col-span-1 space-y-4">
          <div>
            <h3 className="text-2xl font-semibold text-emerald-400">Resources</h3>
            <ul className="bg-slate-800 p-4 rounded-lg">
              {resources.map((r) => (
                <li key={r.id} className="text-lg">{r.resource_type}: {r.quantity}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-emerald-400">Your Fleet</h3>
            <ul className="bg-slate-800 p-4 rounded-lg">
              {ships.map((s) => (
                <li key={s.id}>{s.ship_types.name}: {s.quantity}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-emerald-400">Unlocked Tech</h3>
             <ul className="bg-slate-800 p-4 rounded-lg">
              {techs.map((t) => (
                <li key={t.id}>{t.tech_types.name}</li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-2xl font-semibold text-emerald-400">Your Buildings</h3>
            <ul className="space-y-2">
              {buildings.map((b) => (
                <li key={b.id} className="bg-slate-800 p-3 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-bold">{b.building_types.name} (Level {b.level})</p>
                    { b.construction_ends_at && new Date(b.construction_ends_at) > new Date() ?
                        <CountdownTimer endDate={new Date(b.construction_ends_at)} /> :
                        <p className="text-sm text-slate-400">
                          {b.building_types.base_production > 0 && `Production: ${b.building_types.base_production * (1 + (b.level - 1) * b.building_types.production_bonus_per_level)}/hr `}
                          {b.building_types.base_storage > 0 && `Storage: ${b.building_types.base_storage * (1 + (b.level - 1) * b.building_types.storage_bonus_per_level)} `}
                          {b.building_types.base_power_generation > 0 && `Power: ${b.level * b.building_types.power_generation_per_level}`}
                        </p>
                    }
                  </div>
                  { !b.construction_ends_at || new Date(b.construction_ends_at) <= new Date() && <UpgradeButton playerBuildingId={b.id} onUpgraded={handleGameUpdate} /> }
                </li>
              ))}
            </ul>
          </div>
           <div>
            <h3 className="text-2xl font-semibold text-emerald-400">Construct</h3>
            <div className="flex flex-wrap gap-2">
              {buildingTypes.map((bt) => {
                const isShelter = bt.name === 'Shelter'
                const existingBuilding = buildings.find(b => b.building_type_id === bt.id)
                const disabled = existingBuilding || isBuilding || (!isShelter && !hasShelter)
                const disabledText = existingBuilding ? 'Already Built' : isBuilding ? 'Construction in Progress' : 'Requires Shelter'
                
                if (isShelter && hasShelter) return null
                
                return <BuildButton key={bt.id} buildingType={bt} onBuilt={handleGameUpdate} disabled={disabled} disabledText={disabledText} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
