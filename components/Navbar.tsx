'use client'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

// Define your Supabase "profiles" table shape
type Profile = {
  id: string;
  username?: string;
  role?: 'admin' | 'moderator' | 'player' | string;
};

export default function Navbar(){
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

// Fetch profile details when a session exists
  useEffect(() => {
    // Function to fetch profile
    const fetchProfile = async (user_id: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role') // include `id` to match the Profile type
        .eq('id', user_id)
        .single();
      if (error) {
        console.error('Error fetching profile:', error.message);
        setProfile(null);
      } else {
        setProfile(data as Profile);
      }
    };

    // Check initial session
    const checkSession = async () => {
        const { 
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
            setUser(session.user);
            fetchProfile(session.user.id);
        }
    };
    checkSession();


    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null); // Clear profile on sign out
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  async function signOut(){
    await supabase.auth.signOut();
    router.push('/');
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'moderator';

  return (
    <nav className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-400 rounded" />
        <div className="font-semibold text-emerald-200">Orbital Dominion</div>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/" className="text-slate-300 hover:underline">Home</Link>
		{user && (
		 <Link href="/game" className="text-slate-300 hover:underline">Game</Link>
		)}
        {isAdmin && (
          <Link href="/admin" className="text-slate-300 hover:underline">Admin</Link>
        )}
        {user ? (
          <button onClick={signOut} className="bg-red-600 px-3 py-1 rounded text-white hover:bg-red-700">Sign Out</button>
        ) : (
          <>
            <Link href="/auth/signin" className="text-slate-300 hover:underline">Sign In</Link>
            <Link href="/auth/signup" className="text-slate-300 hover:underline">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  )
}