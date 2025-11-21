'use client'

import type { BuildingType, Resource } from '@/types'
import { Button } from '@/components/ui/button'
import { hasSufficientResources } from '@/lib/game-logic'

interface BuildButtonProps {
  buildingType: BuildingType
  resources: Resource[]
  disabled?: boolean
  disabledText?: string
  onBuilt: () => void
}

export default function BuildButton({
  buildingType,
  resources,
  disabled = false,
  disabledText = '',
  onBuilt,
}: BuildButtonProps) {
  const costs = [
    { resource_type: 'metal', cost: buildingType.cost_metal },
    { resource_type: 'crystal', cost: buildingType.cost_crystal },
    { resource_type: 'food', cost: buildingType.cost_food },
  ]

  const sufficientResources = hasSufficientResources(resources, costs)
  const isDisabled = disabled || !sufficientResources

  const reason = disabled && disabledText ? disabledText : 'Not enough resources'

  return (
    <Button
      onClick={onBuilt}
      disabled={isDisabled}
      className="w-full relative"
    >
      <div>
        <span>Build {buildingType.name}</span>
        <div className="text-xs">
          Cost: {buildingType.cost_metal} Metal, {buildingType.cost_crystal} Crystal,{' '}
          {buildingType.cost_food} Food
        </div>
        {isDisabled && (
          <div className="text-xs text-red-500 font-medium">
            {reason}
          </div>
        )}
      </div>
    </Button>
  )
}
