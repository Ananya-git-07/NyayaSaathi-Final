import MotionWrap from "../../components/MotionWrap"
import { Network, BrainCircuit, Goal, Smartphone, CheckCircle } from "lucide-react"

const factors = [
  {
    icon: <Network size={24} />,
    text: "Digital India infrastructure is now operational and widespread.",
    color: "from-cyan-50 to-blue-50 border-cyan-200",
    iconColor: "text-cyan-600",
  },
  {
    icon: <BrainCircuit size={24} />,
    text: "Advanced AI models for local languages have matured and are reliable.",
    color: "from-green-50 to-emerald-50 border-green-200",
    iconColor: "text-green-600",
  },
  {
    icon: <Goal size={24} />,
    text: "Government legal aid reforms are expanding rapidly.",
    color: "from-purple-50 to-pink-50 border-purple-200",
    iconColor: "text-purple-600",
  },
  {
    icon: <Smartphone size={24} />,
    text: "Rural digital adoption and trust in online platforms are at an all-time high.",
    color: "from-orange-50 to-red-50 border-orange-200",
    iconColor: "text-orange-600",
  },
]

const WhyNowSection = () => {
  return (
    <section
      className="section-padding relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/placeholder.svg?height=800&width=1200')" }}
    >
      {/* Enhanced overlay for light theme */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm"></div>

      <MotionWrap className="relative z-10">
        <div className="mx-auto max-w-7xl container-padding">
          <div className="mx-auto max-w-4xl text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-cyan-600 mb-4">Why Now?</h2>
            <h3 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl mb-6">
              The Perfect Confluence of
              <span className="gradient-text"> Factors</span>
            </h3>
            <p className="text-xl leading-8 text-slate-700">
              We are uniquely positioned to deliver AI-powered legal access to 900 million underserved Indians because
              the technology, infrastructure, and user readiness have finally aligned.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {factors.map((factor, index) => (
              <div key={factor.text} className={`card-light bg-gradient-to-br ${factor.color} p-8 group`}>
                <div className="flex items-start gap-6">
                  <div
                    className={`w-16 h-16 bg-white/80 rounded-xl flex items-center justify-center ${factor.iconColor} group-hover:scale-110 transition-transform duration-300 flex-shrink-0 shadow-sm`}
                  >
                    {factor.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle size={20} className="text-cyan-600" />
                      <span className="text-cyan-600 font-semibold">Factor {index + 1}</span>
                    </div>
                    <p className="text-lg text-slate-800 leading-relaxed">{factor.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </MotionWrap>
    </section>
  )
}

export default WhyNowSection
