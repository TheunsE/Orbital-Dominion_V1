import type { PlayerTech } from '@/types'

type Props = {
  techs: PlayerTech[]
}

export default function TechPanel({ techs }: Props) {
  return (
    <div>
      <h3 className="text-2xl font-semibold text-emerald-400">Unlocked Tech</h3>
      <ul className="bg-slate-800 p-4 rounded-lg">
  {techs.length === 0 ? (
    <li className="text-gray-400">No research completed yet</li>
  ) : (
    techs.map(t => (
      <li key={t.id}>
        {(t as any).tech_types?.name || `Research Complete (ID: ${t.tech_type_id})`}
      </li>
    ))
  )}
</ul>>
    </div>
  )
}
