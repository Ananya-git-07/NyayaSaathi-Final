// PASTE THIS ENTIRE FILE INTO src/pages/HomePage/FeaturesSection.jsx

import MotionWrap from "../../components/MotionWrap"
import { useTranslation } from "react-i18next"
import { Landmark, FileText, BotMessageSquare, Users, Sparkles, Shield, Clock, Globe } from "lucide-react"

const FeaturesSection = () => {
  const { t } = useTranslation()

  const features = [
    {
      icon: <BotMessageSquare size={24} />,
      title: t("features.items.voice.title"),
      description: t("features.items.voice.desc"),
      color: "from-cyan-50 to-blue-50 border-cyan-200 dark:from-cyan-900/30 dark:to-blue-900/30 dark:border-cyan-800",
      iconColor: "text-cyan-600 dark:text-cyan-400",
    },
    {
      icon: <FileText size={24} />,
      title: t("features.items.docs.title"),
      description: t("features.items.docs.desc"),
      color: "from-green-50 to-emerald-50 border-green-200 dark:from-green-900/30 dark:to-emerald-900/30 dark:border-green-800",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      icon: <Landmark size={24} />,
      title: t("features.items.issues.title"),
      description: t("features.items.issues.desc"),
      color: "from-purple-50 to-pink-50 border-purple-200 dark:from-purple-900/30 dark:to-pink-900/30 dark:border-purple-800",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      icon: <Users size={24} />,
      title: t("features.items.human.title"),
      description: t("features.items.human.desc"),
      color: "from-orange-50 to-red-50 border-orange-200 dark:from-orange-900/30 dark:to-red-900/30 dark:border-orange-800",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
  ]

  const additionalFeatures = [
    { icon: <Shield size={20} />, text: t("features.pills.secure") },
    { icon: <Clock size={20} />, text: t("features.pills.available") },
    { icon: <Globe size={20} />, text: t("features.pills.multilang") },
    { icon: <Sparkles size={20} />, text: t("features.pills.ai") },
  ]
  
  return (
    <section className="section-padding bg-white dark:bg-slate-900">
      <MotionWrap>
        <div className="mx-auto max-w-7xl container-padding">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-cyan-600 dark:text-cyan-400 mb-4">{t("features.sectionTitle")}</h2>
            <h3 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-6"
                dangerouslySetInnerHTML={{ __html: t("features.title") }} />
            <p className="text-xl leading-8 text-slate-700 dark:text-slate-400 mb-8">
              {t("features.subtitle")}
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {additionalFeatures.map((feature) => (
                <div
                  key={feature.text}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm"
                >
                  <div className="text-cyan-600 dark:text-cyan-400">{feature.icon}</div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className={`card-light bg-gradient-to-br ${feature.color} p-8 group`}>
                <div className="flex items-start gap-6">
                  <div
                    className={`w-16 h-16 bg-white/80 dark:bg-slate-800/50 rounded-xl flex items-center justify-center ${feature.iconColor} group-hover:scale-110 transition-transform duration-300 flex-shrink-0 shadow-sm`}
                  >
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">{feature.title}</h4>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{feature.description}</p>
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

export default FeaturesSection