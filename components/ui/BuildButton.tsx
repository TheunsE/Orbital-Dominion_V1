'use client'

import { BuildingType, Resource } from '@/types'
import { Button } from './button'
import { hasSufficientResources } from '@/lib/game-logic'

interface BuildButtonProps {
  buildingType: BuildingType
  resources: Resource[]
  onBuild: (buildingName: string) => void
}

const BuildButton = ({
  buildingType,
  resources,
  onBuild,
}: BuildButtonProps) => {
  const handleBuildClick = () => {
    onBuild(buildingType.name)
  }

  const costs = [
    { resource_type: 'metal', cost: buildingType.cost_metal },
    { resource_type: 'crystal', cost: buildingType.cost_crystal },
    { resource_type: 'food', cost: buildingType.cost_food },
  ]

  const sufficientResources = hasSufficientResources(resources, costs)

  const getMissingResources = () => {
    return costs
      .filter((cost) => {
        const resource = resources.find(
          (r) => r.resource_type === cost.resource_type,
        )
        return !resource || resource.quantity < cost.cost
      })
      .map((cost) => `${cost.cost} ${cost.resource_type}`)
      .join(', ')
  }

  return (
    <Button
      onClick={handleBuildClick}
      disabled={!sufficientResources}
      className="w-full"
    >
      <div>
        <span>Build {buildingType.name}</span>
        <div className="text-xs">
          Cost: {buildingType.cost_metal} Metal, {buildingType.cost_crystal}{' '}
          Crystal, {buildingType.cost_food} Food
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

export default BuildButton
