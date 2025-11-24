'use client'

interface TutorialPanelProps {
  step: number
  onDismiss: () => void
}

const steps = [
  { // 0 - Hidden
    title: "",
    message: ""
  },
  { // 1
    title: "Welcome, Commander!",
    message: "Your first priority is to protect your crew. Construct a Shelter to begin your journey."
  },
  { // 2
    title: "Excellent!",
    message: "Now, build a Metal Mine to start gathering essential resources."
  },
  { // 3
    title: "Well Done!",
    message: "Next, construct a Crystal Extractor. Crystal is vital for advanced technology."
  },
  { // 4
    title: "Good Progress",
    message: "Time for a Hydroponics Farm to provide your crew with a sustainable food source."
  },
  { // 5
    title: "Almost There",
    message: "Build a Solar Plant to power your expanding empire."
  },
  { // 6
    title: "Final Step",
    message: "Finally, construct a Storage Depot to increase your resource capacity."
  }
]


export default function TutorialPanel({ step, onDismiss }: TutorialPanelProps) {
  if (step === 0 || step >= steps.length) return null

  const currentStep = steps[step]

  return (
    <div className="bg-cyan-900/80 backdrop-blur-md border-y-4 border-cyan-500 text-center py-4 px-6 relative">
      <h3 className="text-2xl font-bold text-cyan-300 mb-2">{currentStep.title}</h3>
      <p className="text-lg text-cyan-100">{currentStep.message}</p>
      <button 
        onClick={onDismiss} 
        className="absolute top-2 right-2 text-cyan-300 hover:text-white"
        aria-label="Dismiss tutorial message"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
