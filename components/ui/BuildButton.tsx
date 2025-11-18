use client'
import type { BuildingType } from '@/types'

type Props = {
  buildingType: BuildingType
  onBuilt: () => void
}

export default function BuildButton({ buildingType, onBuilt }: Props) {
  const handleBuild = async () => {
    const res = await fetch('/api/game/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buildingTypeId: buildingType.id }),
    })
    const data = await res.json()
    if (res.ok) {
      alert(data.message)
      onBuilt()
    } else {
      alert(`Error: ${data.error}`)
    }
  }

  return (
    <button
      onClick={handleBuild}
      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded"
    >
      Build {buildingType.name}
    </button>
  )
}
