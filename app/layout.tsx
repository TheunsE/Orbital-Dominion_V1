import './globals.css'
import { ReactNode } from 'react'
import Navbar from '../components/Navbar'

export const metadata = { title: 'Orbital Dominion' }

export default function RootLayout({ children }: { children: ReactNode }){
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-slate-100">
        <div className="max-w-6xl mx-auto p-6">
          <Navbar />
          <main className="mt-6">{children}</main>
        </div>
      </body>
    </html>
  )
}
