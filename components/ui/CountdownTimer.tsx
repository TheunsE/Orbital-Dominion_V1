'use client'
import { useEffect, useState } from 'react'

type Props = {
  endDate: Date
}

export default function CountdownTimer({ endDate }: Props) {
  const [timeLeft, setTimeLeft] = useState(endDate.getTime() - new Date().getTime())

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(endDate.getTime() - new Date().getTime())
    }, 1000)
    return () => clearInterval(timer)
  }, [endDate])
  
  const seconds = Math.floor((timeLeft / 1000) % 60);
  const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);

  return (
    <div className="text-amber-400">
        Construction completes in: {hours}h {minutes}m {seconds}s
    </div>
  )
}
