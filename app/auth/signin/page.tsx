'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignIn(){
  const supabase = createClient()
  const [username,setUsername]=useState(''); const [password,setPassword]=useState(''); const [msg,setMsg]=useState('')
  const router = useRouter()
  async function handle(e:any){
    e.preventDefault();
    setMsg('Signing in...');

    // First, get the email for the given username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .single();

    if (profileError || !profile) {
      setMsg('Invalid username or password.');
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email: profile.email, password });
    if (signInError) {
      setMsg(signInError.message);
    } else {
      router.push('/game');
    }
  }
  return (
    <form onSubmit={handle} className="max-w-md mx-auto bg-slate-800 p-6 rounded">
      <h2 className="text-xl font-semibold text-emerald-200 mb-4">Sign In</h2>
      <input className="w-full p-2 rounded bg-slate-900 mb-2" placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
      <input type="password" className="w-full p-2 rounded bg-slate-900 mb-2" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button className="w-full bg-emerald-500 p-2 rounded">Sign In</button>
      <p className="text-sm text-slate-400 mt-2">{msg}</p>
    </form>
  )
}