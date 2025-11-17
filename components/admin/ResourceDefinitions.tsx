'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ResourceDefinition } from '@/types'

export default function ResourceDefinitions() {
  const supabase = createClient()
  const [resourceDefinitions, setResourceDefinitions] = useState<ResourceDefinition[]>([])
  const [name, setName] = useState('')

  useEffect(() => {
    fetchResourceDefinitions()
  }, [])

  const fetchResourceDefinitions = async () => {
    const { data } = await supabase.from('resource_definitions').select('*')
    setResourceDefinitions(data || [])
  }

  const handleAdd = async () => {
    await supabase.from('resource_definitions').insert({ name })
    fetchResourceDefinitions()
  }

  const handleDelete = async (id: number) => {
    await supabase.from('resource_definitions').delete().eq('id', id)
    fetchResourceDefinitions()
  }

  return (
    <div>
      <h2 className="text-xl font-bold">Resource Definitions</h2>
      <div className="flex gap-2 mt-4">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 rounded"
        />
        <button onClick={handleAdd} className="bg-blue-500 text-white p-2 rounded">
          Add
        </button>
      </div>
      <ul className="mt-4">
        {resourceDefinitions.map((rd) => (
          <li key={rd.id} className="flex justify-between items-center p-2 border-b">
            <span>{rd.name}</span>
            <button onClick={() => handleDelete(rd.id)} className="bg-red-500 text-white p-1 rounded">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
