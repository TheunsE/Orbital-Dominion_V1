'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SignUp(){
  const supabase = createClient()
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState('');

  async function handle(e:any){
    e.preventDefault();

    if (password !== confirmPassword) {
      setMsg("Passwords do not match.");
      return;
    }
    if (!username) {
        setMsg("Please enter a username.");
        return;
    }

    setMsg('Registering...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: username
            }
        }
    });

    if (signUpError) {
      setMsg(signUpError.message);
      return;
    }

    //The trigger will handle the profile creation.
    setMsg('Check your email for confirmation (if enabled).');

  }
  return (
    <form onSubmit={handle} className="max-w-md mx-auto bg-slate-800 p-6 rounded">
      <h2 className="text-xl font-semibold text-emerald-200 mb-4">Create Account</h2>
      <input className="w-full p-2 rounded bg-slate-900 mb-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="w-full p-2 rounded bg-slate-900 mb-2" placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
      <div className="relative">
        <input type={showPassword ? "text" : "password"} className="w-full p-2 rounded bg-slate-900 mb-2" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-400">
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
      <input type="password" className="w-full p-2 rounded bg-slate-900 mb-2" placeholder="Confirm Password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />
      <button className="w-full bg-sky-600 p-2 rounded">Sign Up</button>
      <p className="text-sm text-slate-400 mt-2">{msg}</p>
    </form>
  )
}
