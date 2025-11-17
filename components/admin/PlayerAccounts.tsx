'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PlayerAccount } from '@/types'

export default function PlayerAccounts() {
  const supabase = createClient()
  const [playerAccounts, setPlayerAccounts] = useState<PlayerAccount[]>([])

  useEffect(() => {
    fetchPlayerAccounts()
  }, [])

  const fetchPlayerAccounts = async () => {
    const { data } = await supabase.from('profiles').select('*')
    setPlayerAccounts(data || [])
  }

  return (
    <div>
      <h2 className="text-xl font-bold">Player Accounts</h2>
      <ul className="mt-4">
        {playerAccounts.map((pa) => (
          <li key={pa.id} className="p-2 border-b">
            <span>{pa.email} - {pa.role}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
