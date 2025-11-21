import type { ResourceDefinition } from '@/types'

type Props = {
  resources: ResourceDefinition[]
}

export default function ResourcesPanel({ resources }: Props) {
  return (
    <div>
      <h3 className="text-2xl font-semibold text-emerald-400">Resources</h3>
      <ul className="bg-slate-800 p-4 rounded-lg">
        {resources.map(r => (
          <li key={r.id} className="text-lg">
            {r.resource_type}: {r.quantity}
          </li>
        ))}
      </ul>
    </div>
  )
}
