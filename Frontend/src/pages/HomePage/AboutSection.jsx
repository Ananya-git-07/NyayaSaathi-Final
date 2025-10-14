import MotionWrap from "../../components/MotionWrap"
import { AlertTriangle, FileX, Users } from "lucide-react"

const problems = [
  {
    icon: <FileX size={32} />,
    title: "Document & Court Summons Errors",
    description: "Low digital literacy and complex legal language lead to mistakes and missed deadlines.",
    color: "from-red-50 to-pink-50 border-red-200",
    iconColor: "text-red-600",
  },
  {
    icon: <Users size={32} />,
    title: "Welfare Scheme & Land Gaps",
    description: "Outdated records and middlemen exploitation block access to rightful benefits and property claims.",
    color: "from-orange-50 to-yellow-50 border-orange-200",
    iconColor: "text-orange-600",
  },
  {
    icon: <AlertTriangle size={32} />,
    title: "Limited Legal Access",
    description:
      "Courts are far, lawyers are expensive, and reliable legal aid is often out of reach for many villagers.",
    color: "from-purple-50 to-indigo-50 border-purple-200",
    iconColor: "text-purple-600",
  },
]

const AboutSection = () => {
  return (
    <section className="section-padding bg-slate-50">
      <MotionWrap>
        <div className="mx-auto max-w-7xl container-padding">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-cyan-600 mb-4">The Core Problem</h2>
            <h3 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-6">
              Bridging the Justice Gap for
              <span className="gradient-text"> 900 Million Indians</span>
            </h3>
            <p className="text-xl leading-8 text-slate-700">
              Essential legal processes are broken for rural communities. From inaccessible government services to
              intimidating court procedures, the system is designed for failure.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {problems.map((problem, index) => (
              <div key={problem.title} className={`card-light bg-gradient-to-br ${problem.color} p-8 group`}>
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`w-16 h-16 bg-white/80 rounded-xl flex items-center justify-center ${problem.iconColor} group-hover:scale-110 transition-transform duration-300 shadow-sm`}
                  >
                    {problem.icon}
                  </div>
                  <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                    <span className="text-cyan-600 font-bold">{index + 1}</span>
                  </div>
                </div>
                <h4 className="text-xl font-semibold text-slate-900 mb-4">{problem.title}</h4>
                <p className="text-slate-700 leading-relaxed">{problem.description}</p>
              </div>
            ))}
          </div>
        </div>
      </MotionWrap>
    </section>
  )
}

export default AboutSection
