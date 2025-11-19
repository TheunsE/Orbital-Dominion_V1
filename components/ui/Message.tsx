'use client'

import { useState } from 'react'

interface MessageProps {
  messages: string[]
}

const Message = ({ messages }: MessageProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  const handleNextMessage = () => {
    if (currentMessageIndex < messages.length - 1) {
      setCurrentMessageIndex(currentMessageIndex + 1)
    }
  }

  return (
    <div className="bg-slate-800 p-4 rounded-lg mb-4">
      <p className="text-lg text-white">{messages[currentMessageIndex]}</p>
      {currentMessageIndex < messages.length - 1 && (
        <button
          onClick={handleNextMessage}
          className="mt-2 px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
        >
          Next
        </button>
      )}
    </div>
  )
}

export default Message
