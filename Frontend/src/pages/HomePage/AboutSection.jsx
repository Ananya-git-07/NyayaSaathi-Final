// PASTE THIS ENTIRE FILE INTO src/pages/HomePage/AboutSection.jsx

import MotionWrap from "../../components/MotionWrap"
import { useTranslation } from "react-i18next"
import { AlertTriangle, FileX, Users } from "lucide-react"

const AboutSection = () => {
  const { t } = useTranslation()

  const problems = [
    {
      icon: <FileX size={32} />,
      title: t("about.problems.docs.title"),
      description: t("about.problems.docs.desc"),
      color: "from-red-50 to-pink-50 border-red-200 dark:from-red-900/30 dark:to-pink-900/30 dark:border-red-800",
      iconColor: "text-red-600 dark:text-red-400",
    },
    {
      icon: <Users size={32} />,
      title: t("about.problems.welfare.title"),
      description: t("about.problems.welfare.desc"),
      color: "from-orange-50 to-yellow-50 border-orange-200 dark:from-orange-900/30 dark:to-yellow-900/30 dark:border-orange-800",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      icon: <AlertTriangle size={32} />,
      title: t("about.problems.access.title"),
      description: t("about.problems.access.desc"),
      color: "from-purple-50 to-indigo-50 border-purple-200 dark:from-purple-900/30 dark:to-indigo-900/30 dark:border-purple-800",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
  ]

  return (
    <section className="section-padding bg-slate-50 dark:bg-slate-950">
      <MotionWrap>
        <div className="mx-auto max-w-7xl container-padding">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-cyan-600 dark:text-cyan-400 mb-4">{t("about.sectionTitle")}</h2>
            <h3 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-6"
                dangerouslySetInnerHTML={{ __html: t("about.title") }} />
            <p className="text-xl leading-8 text-slate-700 dark:text-slate-400">
              {t("about.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {problems.map((problem, index) => (
              <div key={problem.title} className={`card-light bg-gradient-to-br ${problem.color} p-8 group`}>
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`w-16 h-16 bg-white/80 dark:bg-slate-800/50 rounded-xl flex items-center justify-center ${problem.iconColor} group-hover:scale-110 transition-transform duration-300 shadow-sm`}
                  >
                    {problem.icon}
                  </div>
                  <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/50 rounded-full flex items-center justify-center">
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold">{index + 1}</span>
                  </div>
                </div>
                <h4 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">{problem.title}</h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{problem.description}</p>
              </div>
            ))}
          </div>
        </div>
      </MotionWrap>
    </section>
  )
}

export default AboutSection