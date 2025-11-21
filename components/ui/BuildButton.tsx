'use client'
import type { BuildingType, PlayerResource } from '@/types'
import { hasSufficientResources } from '@/lib/game-logic'

type Props = {
  buildingType: BuildingType
  resources: PlayerResource[]
  onBuilt: () => void
  disabled?: boolean
  disabledText?: string
}

export default function BuildButton({ buildingType, resources, onBuilt, disabled = false, disabledText}: Props) {
  const handleBuild = async () => {
    const res = await fetch('/api/game/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buildingTypeId: buildingType.id }),
    })
    const data = await res.json()
    if (res.ok) {
      alert(data.message)
      onBuilt()
    } else {
      alert(`Error: ${data.error}`)
    }
  }

  const costs = [
    { resource_type: 'Metal', cost: buildingType.cost_metal },
    { resource_type: 'Crystal', cost: buildingType.cost_crystal },
    { resource_type: 'Energy', cost: buildingType.cost_energy },
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

  const isDisabled = disabled || !sufficientResources
  const buttonText = disabled
    ? disabledText
    : !sufficientResources
    ? `Needed: ${getMissingResources()}`
    : `Build ${buildingType.name}`

  return (
    <button
      onClick={handleBuild}
      disabled={isDisabled}
      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded disabled:bg-slate-600 disabled:cursor-not-allowed"
    >
      {buttonText}
    </button>
  )
}
