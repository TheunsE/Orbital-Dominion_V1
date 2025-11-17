'use client'

type Props = {
  playerBuildingId: number
  onUpgraded: () => void
}

export default function UpgradeButton({ playerBuildingId, onUpgraded }: Props) {
  const handleUpgrade = async () => {
    const res = await fetch('/api/game/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerBuildingId }),
    })
    const data = await res.json()
    if (res.ok) {
      alert(data.message)
      onUpgraded()
    } else {
      alert(`Error: ${data.error}`)
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-1 px-3 rounded text-sm"
    >
      Upgrade
    </button>
  )
}
