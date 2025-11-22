import type { Resource, PlayerBuilding } from '@/types'

interface Props {
  resources: Resource[]
  buildings: PlayerBuilding[]
}

export default function ResourcesPanel({ resources, buildings }: Props) {
  const getHourlyProduction = (type: 'metal' | 'crystal' | 'food' | 'power') => {
    if (type === 'power') {
      return buildings.reduce((sum, b) => {
        const base = b.building_types.base_power_generation || 0
        const bonus = b.building_types.power_generation_per_level || 0
        return sum + (base + (b.level - 1) * bonus)
      }, 0)
    }

    return buildings.reduce((sum, b) => {
      const bt = b.building_types
      if (bt.base_production <= 0) return sum

      if (
        (type === 'metal' && bt.name.includes('Metal')) ||
        (type === 'crystal' && bt.name.includes('Crystal')) ||
        (type === 'food' && bt.name.includes('Hydroponics'))
      ) {
        const bonus = bt.production_bonus_per_level || 0
        return sum + bt.base_production * b.level * (1 + (b.level - 1) * bonus)
      }
      return sum
    }, 0)
  }

  const getResource = (type: 'metal' | 'crystal' | 'food') =>
    resources.find(r => r.resource_type === type)?.quantity || 0

  return (
    <div className="bg-slate-800/80 backdrop-blur rounded-xl border border-cyan-500/30 p-6">
      <h3 className="text-2xl font-bold text-cyan-400 mb-6">Resources</h3>
      <div className="space-y-5">
        {(['metal', 'crystal', 'food'] as const).map(type => (
          <div
            key={type}
            className="bg-slate-700/60 rounded-lg p-5 cursor-pointer hover:bg-slate-600/80 transition-all"
          >
            <div className="flex justify-between items-end">
              <span className="text-xl font-semibold capitalize text-cyan-200">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">
                  {getResource(type).toLocaleString()}
                </div>
                <div className="text-sm text-green-400">
                  +{Math.floor(getHourlyProduction(type))} / hour
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="bg-slate-700/60 rounded-lg p-5">
          <div className="flex justify-between items-end">
            <span className="text-xl font-semibold text-yellow-300">Power</span>
            <div className="text-right">
              <div className="text-3xl font-bold text-yellow-300">
                {getHourlyProduction('power')}
              </div>
              <div className="text-sm text-green-400">Generated / hour</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
