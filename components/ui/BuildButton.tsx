'use client'

import type { BuildingType, Resource } from '@/types'
import { Button } from '@/components/ui/button'
import { hasSufficientResources } from '@/lib/game-logic'

interface BuildButtonProps {
  buildingType: BuildingType
  resources: Resource[]
  // Optional: used by ConstructionPanel to block Shelter requirement, already built, etc.
  disabled?: boolean
  disabledText?: string
  // Called when player clicks "Build" and has enough resources
  onBuilt: () => void
}

export default function BuildButton({
  buildingType,
  resources,
  disabled = false,
  disabledText = '',
  onBuilt,
}: BuildButtonProps) {
  // Define exact costs for this building (level 1)
  const costs = [
    { resource_type: 'metal' as const, cost: buildingType.cost_metal },
    { resource_type: 'crystal' as const, cost: buildingType.cost_crystal },
    { resource_type: 'food' as const, cost: buildingType.cost_food },
  ]

  // Check if player can afford it
  const canAfford = hasSufficientResources(resources, costs)

  // Final disabled state: either manually disabled OR can't afford
  const isDisabled = disabled || !canAfford

  // What message to show when disabled
  const reason = disabled && disabledText
    ? disabledText
    : !canAfford
    ? 'Not enough resources'
    : ''

  return (
    <Button
      onClick={onBuilt}
      disabled={isDisabled}
      className="w-full text-left"
      variant={isDisabled ? 'secondary' : 'default'}
    >
      <div>
        {/* Building name */}
        <div className="font-semibold">Build {buildingType.name}</div>

        {/* Cost display */}
        <div className="text-xs opacity-80">
          Cost: {buildingType.cost_metal.toLocaleString()} Metal |{' '}
          {buildingType.cost_crystal.toLocaleString()} Crystal |{' '}
          {buildingType.cost_food.toLocaleString()} Food
        </div>

        {/* Show why it's disabled */}
        {isDisabled && reason && (
          <div className="text-xs text-red-400 font-medium mt-1">
            {reason}
          </div>
        )}
      </div>
    </Button>
  )
}
