// PASTE THIS ENTIRE FILE INTO src/pages/HomePage/WhyNowSection.jsx

import MotionWrap from "../../components/MotionWrap"
import { useTranslation } from "react-i18next"
import { Network, BrainCircuit, Goal, Smartphone, CheckCircle } from "lucide-react"

const WhyNowSection = () => {
  const { t } = useTranslation()

  const factors = [
    {
      icon: <Network size={24} />,
      text: t("whyNow.factors.digitalIndia"),
      color: "from-cyan-50 to-blue-50 border-cyan-200 dark:from-cyan-900/30 dark:to-blue-900/30 dark:border-cyan-800",
      iconColor: "text-cyan-600 dark:text-cyan-400",
    },
    {
      icon: <BrainCircuit size={24} />,
      text: t("whyNow.factors.ai"),
      color: "from-green-50 to-emerald-50 border-green-200 dark:from-green-900/30 dark:to-emerald-900/30 dark:border-green-800",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      icon: <Goal size={24} />,
      text: t("whyNow.factors.reforms"),
      color: "from-purple-50 to-pink-50 border-purple-200 dark:from-purple-900/30 dark:to-pink-900/30 dark:border-purple-800",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      icon: <Smartphone size={24} />,
      text: t("whyNow.factors.adoption"),
      color: "from-orange-50 to-red-50 border-orange-200 dark:from-orange-900/30 dark:to-red-900/30 dark:border-orange-800",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
  ]
  
  return (
    <section
      className="section-padding relative bg-cover bg-center bg-no-repeat"
    >
      <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm"></div>

      <MotionWrap className="relative z-10">
        <div className="mx-auto max-w-7xl container-padding">
          <div className="mx-auto max-w-4xl text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-cyan-600 dark:text-cyan-400 mb-4">{t("whyNow.sectionTitle")}</h2>
            <h3 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl mb-6"
                dangerouslySetInnerHTML={{ __html: t("whyNow.title") }} />
            <p className="text-xl leading-8 text-slate-700 dark:text-slate-400">
              {t("whyNow.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {factors.map((factor, index) => (
              <div key={factor.text} className={`card-light bg-gradient-to-br ${factor.color} p-8 group`}>
                <div className="flex items-start gap-6">
                  <div
                    className={`w-16 h-16 bg-white/80 dark:bg-slate-800/50 rounded-xl flex items-center justify-center ${factor.iconColor} group-hover:scale-110 transition-transform duration-300 flex-shrink-0 shadow-sm`}
                  >
                    {factor.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle size={20} className="text-cyan-600 dark:text-cyan-400" />
                      <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Factor {index + 1}</span>
                    </div>
                    <p className="text-lg text-slate-800 dark:text-slate-200 leading-relaxed">{factor.text}</p>
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