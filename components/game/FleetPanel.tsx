import type { PlayerShip } from '@/types'

type Props = {
  ships: PlayerShip[]
}

export default function FleetPanel({ ships }: Props) {
  return (
    <div>
      <h3 className="text-2xl font-semibold text-emerald-400">Your Fleet</h3>
      <ul className="bg-slate-800 p-4 rounded-lg">
        {ships.map(s => (
          <li key={s.id}>{s.ship_types.name}: {s.quantity}</li>
        ))}
      </ul>
    </div>
  )
}
