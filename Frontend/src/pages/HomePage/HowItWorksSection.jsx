// PASTE THIS ENTIRE FILE INTO src/pages/HomePage/HowItWorksSection.jsx

import MotionWrap from "../../components/MotionWrap"
import { useTranslation } from "react-i18next"
import { ArrowRight, CheckCircle } from "lucide-react"

const HowItWorksSection = () => {
  const { t } = useTranslation()

  const steps = [
    {
      name: t("howItWorks.steps.access.name"),
      description: t("howItWorks.steps.access.desc"),
      color: "from-cyan-50 to-blue-50 border-cyan-200 dark:from-cyan-900/30 dark:to-blue-900/30 dark:border-cyan-800",
    },
    {
      name: t("howItWorks.steps.speak.name"),
      description: t("howItWorks.steps.speak.desc"),
      color: "from-green-50 to-emerald-50 border-green-200 dark:from-green-900/30 dark:to-emerald-900/30 dark:border-green-800",
    },
    {
      name: t("howItWorks.steps.ai.name"),
      description: t("howItWorks.steps.ai.desc"),
      color: "from-purple-50 to-pink-50 border-purple-200 dark:from-purple-900/30 dark:to-pink-900/30 dark:border-purple-800",
    },
    {
      name: t("howItWorks.steps.generate.name"),
      description: t("howItWorks.steps.generate.desc"),
      color: "from-orange-50 to-red-50 border-orange-200 dark:from-orange-900/30 dark:to-red-900/30 dark:border-orange-800",
    },
    {
      name: t("howItWorks.steps.guide.name"),
      description: t("howItWorks.steps.guide.desc"),
      color: "from-indigo-50 to-purple-50 border-indigo-200 dark:from-indigo-900/30 dark:to-purple-900/30 dark:border-indigo-800",
    },
    {
      name: t("howItWorks.steps.escalate.name"),
      description: t("howItWorks.steps.escalate.desc"),
      color: "from-teal-50 to-cyan-50 border-teal-200 dark:from-teal-900/30 dark:to-cyan-900/30 dark:border-teal-800",
    },
  ]
  
  return (
    <section className="section-padding bg-slate-50 dark:bg-slate-950">
      <MotionWrap>
        <div className="mx-auto max-w-7xl container-padding">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-cyan-600 dark:text-cyan-400 mb-4">{t("howItWorks.sectionTitle")}</h2>
            <h3 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-6"
                dangerouslySetInnerHTML={{ __html: t("howItWorks.title") }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.name} className="relative">
                <div className={`card-light bg-gradient-to-br ${step.color} p-8 h-full group`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-white/80 dark:bg-slate-800/50 rounded-xl flex items-center justify-center text-slate-900 dark:text-white font-bold text-lg group-hover:scale-110 transition-transform duration-300 shadow-sm">
                      {index + 1}
                    </div>
                    <CheckCircle size={20} className="text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <h4 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">{step.name}</h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{step.description}</p>
                </div>

                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight size={24} className="text-cyan-500 dark:text-cyan-400" />
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