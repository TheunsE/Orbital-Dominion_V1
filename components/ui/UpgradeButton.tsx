'use client'

import { PlayerBuilding, Resource } from '@/types'
import { Button } from './button'
import { hasSufficientResources } from '@/lib/game-logic'

interface UpgradeButtonProps {
  playerBuilding: PlayerBuilding
  resources: Resource[]
  onUpgrade?: (playerBuildingId: number) => void
  onUpgraded?: () => void
}

const UpgradeButton = ({
  playerBuilding,
  resources,
  onUpgrade,
  onUpgraded,
}: UpgradeButtonProps) => {
  const handleUpgradeClick = () => {
    // Trigger legacy callback (with ID)
    onUpgrade?.(playerBuilding.id)

    // Trigger new callback (no ID)
    onUpgraded?.()
  }

  const upgradeCost = {
    metal: Math.floor(
      playerBuilding.building_types.cost_metal *
        Math.pow(1.5, playerBuilding.level)
    ),
    crystal: Math.floor(
      playerBuilding.building_types.cost_crystal *
        Math.pow(1.5, playerBuilding.level)
    ),
    food: Math.floor(
      playerBuilding.building_types.cost_food *
        Math.pow(1.5, playerBuilding.level)
    ),
  }

  const costs = [
    { resource_type: 'metal', cost: upgradeCost.metal },
    { resource_type: 'crystal', cost: upgradeCost.crystal },
    { resource_type: 'food', cost: upgradeCost.food },
  ]

  const sufficientResources = hasSufficientResources(resources, costs)

  const getMissingResources = () => {
    return costs
      .filter((cost) => {
        const resource = resources.find(
          (r) => r.resource_type === cost.resource_type
        )
        return !resource || resource.quantity < cost.cost
      })
      .map((c) => `${c.cost} ${c.resource_type}`)
      .join(', ')
  }

  return (
    <Button
      onClick={handleUpgradeClick}
      disabled={!sufficientResources}
      className="w-full"
    >
      <div>
        <span>
          Upgrade {playerBuilding.building_types.name} to Level{' '}
          {playerBuilding.level + 1}
        </span>
        <div className="text-xs">
          Cost: {upgradeCost.metal} Metal, {upgradeCost.crystal} Crystal,{' '}
          {upgradeCost.food} Food
        </div>
        {!sufficientResources && (
          <div className="text-xs text-red-500">
            Missing: {getMissingResources()}
          </div>
        )}
      </div>
    </Button>
  )
}

export default UpgradeButton
