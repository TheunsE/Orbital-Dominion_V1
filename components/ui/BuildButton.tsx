'use client'
import { createClient } from '@/lib/supabase/client'
import type { BuildingType } from '@/types'
import { useRouter } from 'next/navigation'

export default function BuildButton({ buildingType }: { buildingType: BuildingType }) {
  const supabase = createClient()
  const router = useRouter()

  const handleBuild = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('You must be logged in to build.')
      return
    }

    await fetch('/api/buildings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ buildingTypeId: buildingType.id }),
    })

    router.refresh()
  }

  return (
    <button onClick={handleBuild} className="bg-green-500 text-white p-2 rounded">
      Build {buildingType.name}
    </button>
  )
}
