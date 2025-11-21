import type { Resource } from '@/types'

type Props = {
  resources: Resource[] 
}

export default function ResourcesPanel({ resources }: Props) {
  const metal = resources.find(r => r.resource_type === 'metal')?.quantity || 0
  const crystal = resources.find(r => r.resource_type === 'crystal')?.quantity || 0
  const food = resources.find(r => r.resource_type === 'food')?.quantity || 0

  return (
    <div className="bg-slate-800 p-4 rounded-lg">
      <h3 className="text-2xl font-semibold text-emerald-400 mb-4">Resources</h3>
      <div className="space-y-2 text-lg">
        <div className="flex justify-between">
          <span className="text-cyan-300">Metal</span>
          <span className="font-bold">{metal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-purple-300">Crystal</span>
          <span className="font-bold">{crystal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-yellow-300">Food</span>
          <span className="font-bold">{food.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}
