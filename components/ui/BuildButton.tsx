'use client'
import type { BuildingType } from '@/types'

type Props = {
  buildingType: BuildingType
  onBuilt: () => void
  disabled?: boolean
  disabledText?: string
}

export default function BuildButton({ buildingType, onBuilt, disabled = false, disabledText}: Props) {
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
      disabled={disabled}
      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded disabled:bg-slate-600 disabled:cursor-not-allowed"
    >
      {disabled ? disabledText : `Build ${buildingType.name}`}
    </button>
  )
}
