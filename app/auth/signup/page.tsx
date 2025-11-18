'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SignUp() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  // Debounced username availability check
  useEffect(() => {
    const checkUsername = async () => {
      if (!username || username.length < 3) {
        setUsernameAvailable(null)
        return
      }

      const cleaned = username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()
      if (cleaned.length < 3) {
        setUsernameAvailable(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', cleaned)
        .single()

      setUsernameAvailable(!data)
    }

    const timer = setTimeout(checkUsername, 500)
    return () => clearTimeout(timer)
  }, [username, supabase])

  async function handle(e: any) {
    e.preventDefault()
    setMsg('')
    setLoading(true)

    if (password !== confirmPassword) {
      setMsg('Passwords do not match.')
      setLoading(false)
      return
    }
    if (!username || username.length < 3) {
      setMsg('Username must be at least 3 characters.')
      setLoading(false)
      return
    }
    if (!email.includes('@')) {
      setMsg('Please enter a valid email.')
      setLoading(false)
      return
    }
    if (password.length < 6) {
      setMsg('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    setMsg('Creating account...')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.trim() }
      }
    })

    if (error) {
      setMsg(error.message)
    } else if (data.user) {
      setMsg('Account created! Check your email for confirmation link.')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handle} className="max-w-md mx-auto bg-slate-800 p-8 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold text-emerald-200 mb-6 text-center">Create Account</h2>

      <input
        className="w-full p-3 rounded bg-slate-900 mb-3 text-white placeholder-gray-500"
        placeholder="Email"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />

      <div className="relative mb-3">
        <input
          className="w-full p-3 rounded bg-slate-900 text-white placeholder-gray-500"
          placeholder="Username (3+ chars, letters/numbers/_)"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        {username.length >= 3 && (
          <span className={`absolute right-3 top-3.5 text-sm ${usernameAvailable === true ? 'text-green-400' : usernameAvailable === false ? 'text-red-400' : 'text-gray-500'}`}>
            {usernameAvailable === true ? 'Available' : usernameAvailable === false ? 'Taken' : 'Checking...'}
          </span>
        )}
      </div>

      <div className="relative mb-3">
        <input
          type={showPassword ? "text" : "password"}
          className="w-full p-3 rounded bg-slate-900 text-white placeholder-gray-500"
          placeholder="Password (6+ chars)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-400 hover:text-gray-300"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>

      <input
        type="password"
        className="w-full p-3 rounded bg-slate-900 mb-4 text-white placeholder-gray-500"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
        required
      />

      <button
        className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-gray-600 p-3 rounded font-semibold transition"
        disabled={loading || usernameAvailable === false}
      >
        {loading ? 'Creating...' : 'Sign Up'}
      </button>

      {msg && (
        <p className={`text-sm mt-3 text-center ${msg.includes('created') || msg.includes('Check') ? 'text-green-400' : 'text-red-400'}`}>
          {msg}
        </p>
      )}
    </form>
  )
}
