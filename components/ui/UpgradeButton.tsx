'use client'
import type { PlayerBuilding, PlayerResource } from '@/types'
import { hasSufficientResources } from '@/lib/game-logic'

type Props = {
  playerBuilding: PlayerBuilding
  resources: PlayerResource[]
  onUpgraded: () => void
}

export default function UpgradeButton({ playerBuilding, resources, onUpgraded }: Props) {
  const handleUpgrade = async () => {
    const res = await fetch('/api/game/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerBuildingId: playerBuilding.id }),
    })
    const data = await res.json()
    if (res.ok) {
      alert(data.message)
      onUpgraded()
    } else {
      alert(`Error: ${data.error}`)
    }
  }

  const upgradeCost = {
    metal: Math.floor(playerBuilding.building_types.cost_metal * Math.pow(1.5, playerBuilding.level)),
    crystal: Math.floor(playerBuilding.building_types.cost_crystal * Math.pow(1.5, playerBuilding.level)),
    energy: Math.floor(playerBuilding.building_types.cost_energy * Math.pow(1.5, playerBuilding.level)),
  }

  const costs = [
    { resource_type: 'Metal', cost: upgradeCost.metal },
    { resource_type: 'Crystal', cost: upgradeCost.crystal },
    { resource_type: 'Energy', cost: upgradeCost.energy },
  ]
  const sufficientResources = hasSufficientResources(resources, costs)

  const getMissingResources = () => {
    return costs
      .filter(cost => {
        const resource = resources.find(r => r.resource_type === cost.resource_type)
        return !resource || resource.quantity < cost.cost
      })
      .map(cost => `${cost.cost} ${cost.resource_type}`)
      .join(', ')
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={!sufficientResources}
      className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-1 px-3 rounded text-sm disabled:bg-slate-600 disabled:cursor-not-allowed"
    >
      {sufficientResources ? 'Upgrade' : `Needed: ${getMissingResources()}`}
    </button>
  )
}
