import type { PlayerTech } from '@/types'

type Props = {
  techs: PlayerTech[]
}

export default function TechPanel({ techs }: Props) {
  return (
    <div>
      <h3 className="text-2xl font-semibold text-emerald-400">Unlocked Tech</h3>
      <ul className="bg-slate-800 p-4 rounded-lg">
        {techs.map(t => (
          <li key={t.id}>{t.tech_types.name}</li>
        ))}
      </ul>
    </div>
  )
}
