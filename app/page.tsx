import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = createClient()
  let dbError = false;
  try {
    // A simple query to check if the database is responding
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
        dbError = true;
    }
  } catch (e) {
    dbError = true;
  }


  return (
    <div className="space-y-6">
      <section className="bg-slate-800 p-6 rounded">
        <h1 className="text-3xl font-bold text-emerald-300">Orbital Dominion</h1>
        {dbError ? (
            <div className="mt-4 p-4 bg-red-900 border border-red-700 rounded text-white">
                <p className="font-bold">Database Connection Error</p>
                <p>Could not connect to the database. Please ensure your Supabase instance is running and the schema in `/supabase_sql` has been applied.</p>
            </div>
        ) : (
            <>
                <p className="text-slate-300 mt-2">Admin CRUD connected to Supabase. Use Sign Up to create accounts.</p>
                <div className="mt-4 flex gap-3">
                    <Link href="/auth/signup" className="px-4 py-2 bg-sky-600 rounded">Sign Up</Link>
                    <Link href="/auth/signin" className="px-4 py-2 bg-emerald-500 rounded">Sign In</Link>
                </div>
            </>
        )}
      </section>
    </div>
  )
}
