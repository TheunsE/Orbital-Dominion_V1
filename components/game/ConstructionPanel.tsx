import type { BuildingType, PlayerBuilding, PlayerResource } from '@/types'
import BuildButton from '@/components/ui/BuildButton'

type Props = {
  buildingTypes: BuildingType[]
  buildings: PlayerBuilding[]
  resources: PlayerResource[]
  isBuilding: boolean
  hasShelter: boolean
  onGameUpdate: () => void
}

export default function ConstructionPanel({ buildingTypes, buildings, resources, isBuilding, hasShelter, onGameUpdate }: Props) {
  return (
    <div>
      <h3 className="text-2xl font-semibold text-emerald-400">Construct</h3>

      <div className="flex flex-wrap gap-2">
        {buildingTypes.map(bt => {
          const isShelter = bt.name === 'Shelter'
          const existingBuilding = buildings.find(b => b.building_types.id === bt.id)

          const disabled = !!(existingBuilding || isBuilding || (!isShelter && !hasShelter))

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
              resources={resources}
              disabled={disabled}
              disabledText={disabledText}
              onBuilt={onGameUpdate}
            />
          )
        })}
      </div>

    </div>
  )
}
