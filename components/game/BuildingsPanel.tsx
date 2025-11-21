import type { PlayerBuilding, Resource } from '@/types'
import UpgradeButton from '@/components/ui/UpgradeButton'
import CountdownTimer from '@/components/ui/CountdownTimer'

type Props = {
  buildings: PlayerBuilding[]
  resources: Resource[]
  onGameUpdate: () => void
}

export default function BuildingsPanel({ buildings, resources, onGameUpdate }: Props) {
  return (
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
                  playerBuilding={b}
                  resources={resources}
                  onUpgraded={onGameUpdate}
                />
              )}
          </li>
        ))}
      </ul>
    </div>
  )
}
