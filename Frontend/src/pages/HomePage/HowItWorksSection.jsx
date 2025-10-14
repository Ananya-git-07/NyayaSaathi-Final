import MotionWrap from "../../components/MotionWrap"
import { ArrowRight, CheckCircle } from "lucide-react"

const steps = [
  {
    name: "Access",
    description: "User opens the Nyaya Saathi app or visits a nearby kiosk.",
    color: "from-cyan-50 to-blue-50 border-cyan-200",
  },
  {
    name: "Speak the Problem",
    description: "User explains the issue in Hindi or their local dialect; no legal terms needed.",
    color: "from-green-50 to-emerald-50 border-green-200",
  },
  {
    name: "AI Understands",
    description: "Our AI extracts key information, identifies the issue, and asks clarifying questions.",
    color: "from-purple-50 to-pink-50 border-purple-200",
  },
  {
    name: "Auto-Generate Documents",
    description: "The system instantly fills forms and generates affidavits, letters, or certificates.",
    color: "from-orange-50 to-red-50 border-orange-200",
  },
  {
    name: "Guide & Submit",
    description: "We provide clear voice guidance, print necessary forms, and help track the status.",
    color: "from-indigo-50 to-purple-50 border-indigo-200",
  },
  {
    name: "Human Escalation",
    description: "Complex cases are intelligently routed to our network of local paralegals for expert help.",
    color: "from-teal-50 to-cyan-50 border-teal-200",
  },
]

const HowItWorksSection = () => {
  return (
    <section className="section-padding bg-slate-50">
      <MotionWrap>
        <div className="mx-auto max-w-7xl container-padding">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-cyan-600 mb-4">How It Works</h2>
            <h3 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-6">
              From Conversation to Resolution in
              <span className="gradient-text"> 6 Simple Steps</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.name} className="relative">
                <div className={`card-light bg-gradient-to-br ${step.color} p-8 h-full group`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-white/80 rounded-xl flex items-center justify-center text-slate-900 font-bold text-lg group-hover:scale-110 transition-transform duration-300 shadow-sm">
                      {index + 1}
                    </div>
                    <CheckCircle size={20} className="text-cyan-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-slate-900 mb-4">{step.name}</h4>
                  <p className="text-slate-700 leading-relaxed">{step.description}</p>
                </div>

                {/* Arrow connector for larger screens */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight size={24} className="text-cyan-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </MotionWrap>
    </section>
  )
}

export default HowItWorksSection
