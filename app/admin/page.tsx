'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Event = { id?: string; title: string; description?: string }

export default function Admin(){
  const supabase = createClient()
  const [events, setEvents] = useState<Event[]>([])
  const [title,setTitle]=useState(''); const [desc,setDesc]=useState(''); const [msg,setMsg]=useState('')

  useEffect(()=>{ load() },[])

  async function load(){
    const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false })
    if (error) {
      setMsg(error.message||'')
    } else {
      setEvents(data||[])
    }
  }

  async function add(){
    if (!title) return
    const { error } = await supabase.from('events').insert({ title, description: desc })
    if (error) {
      setMsg(error.message||'')
    } else {
      setTitle('');
      setDesc('');
      load()
    }
  }

  async function del(id?:string){
    if (!id) return
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) {
      setMsg(error.message||'')
    } else {
      load()
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-emerald-200">Admin Console</h2>
      <div className="bg-slate-800 p-4 rounded">
        <h3 className="font-medium">Create Event</h3>
        <input className="w-full p-2 rounded bg-slate-900 my-2" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
        <textarea className="w-full p-2 rounded bg-slate-900 my-2" placeholder="Description" value={desc} onChange={e=>setDesc(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={add} className="bg-emerald-500 px-4 py-2 rounded">Add Event</button>
          <button onClick={load} className="bg-slate-600 px-4 py-2 rounded">Refresh</button>
        </div>
        <p className="text-sm text-slate-400 mt-2">{msg}</p>
      </div>

      <div className="bg-slate-800 p-4 rounded">
        <h3 className="font-medium">Existing Events</h3>
        <ul className="text-slate-300">
          {events.map(ev=>(
            <li key={ev.id} className="py-2 border-b border-slate-700 flex justify-between">
              <div>
                <div className="font-medium">{ev.title}</div>
                <div className="text-sm text-slate-400">{ev.description}</div>
              </div>
              <div>
                <button onClick={()=>del(ev.id)} className="bg-red-600 px-3 py-1 rounded">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
