// PASTE THIS ENTIRE FILE INTO src/pages/HomePage.jsx

"use client"

import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import PublicHero from "./HomePage/PublicHero"
import AuthenticatedHero from "./HomePage/AuthenticatedHero"
import FeaturesSection from "./HomePage/FeaturesSection"
import AboutSection from "./HomePage/AboutSection"
import WhyNowSection from "./HomePage/WhyNowSection"
import HowItWorksSection from "./HomePage/HowItWorksSection"
import Spinner from "../components/Spinner"
import { ArrowRight, FileText, AlertCircle, BarChart3, Scale, BookOpen } from "lucide-react"
import { motion } from "framer-motion"

import SmartAssistantModal from "../components/SmartAssistantModal"
import AddIssueModal from "../components/AddIssueModal"
import AddDocumentModal from "../components/AddDocumentModal"

const QuickActionCard = ({ icon, title, description, onClick, colorClasses }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    className={`p-6 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg border ${colorClasses}`}
    onClick={onClick}
  >
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-lg bg-white/80 dark:bg-slate-800/50 flex items-center justify-center shadow-sm">{icon}</div>
      <div className="flex-1">
        <h3 className="text-slate-800 dark:text-slate-100 font-semibold text-lg mb-2">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{description}</p>
        <div className="flex items-center text-slate-700 dark:text-cyan-400 text-sm font-medium">
          <span>Get Started</span>
          <ArrowRight size={16} className="ml-2" />
        </div>
      </div>
    </div>
  </motion.div>
)

const HomePage = () => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [isSmartAssistantModalOpen, setSmartAssistantModalOpen] = useState(false)
  const [isAddIssueModalOpen, setAddIssueModalOpen] = useState(false)
  const [isAddDocumentModalOpen, setAddDocumentModalOpen] = useState(false)
  
  const handleSuccess = () => {
    setTimeout(() => navigate("/dashboard"), 500)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="relative overflow-x-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full -z-0">
        <div className="absolute top-[-10rem] left-[-20rem] w-[50rem] h-[50rem] bg-cyan-200 dark:bg-cyan-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div
          className="absolute top-[20rem] right-[-20rem] w-[50rem] h-[50rem] bg-pink-200 dark:bg-pink-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-[60rem] left-[0rem] w-[40rem] h-[40rem] bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <main className="relative z-10">
        {isAuthenticated ? (
          <>
            <AuthenticatedHero onVoiceQueryClick={() => setSmartAssistantModalOpen(true)} />

            <section className="py-16 px-4 bg-secondary">
              <div className="max-w-7xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-12"
                >
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{t("homePage.quickActionsTitle", { name: user?.fullName })}</h2>
                  <p className="text-slate-600 dark:text-slate-400 text-lg">{t("homePage.quickActionsSubtitle")}</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <QuickActionCard
                    icon={<BarChart3 size={24} className="text-blue-600 dark:text-blue-400" />}
                    title={t("homePage.viewDashboardTitle")}
                    description={t("homePage.viewDashboardDesc")}
                    onClick={() => navigate("/dashboard")}
                    colorClasses="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 dark:from-blue-900/30 dark:to-cyan-900/30 dark:border-blue-800"
                  />
                  <QuickActionCard
                    icon={<AlertCircle size={24} className="text-red-600 dark:text-red-400" />}
                    title={t("homePage.reportIssueTitle")}
                    description={t("homePage.reportIssueDesc")}
                    onClick={() => setAddIssueModalOpen(true)}
                    colorClasses="bg-gradient-to-br from-red-50 to-pink-50 border-red-200 dark:from-red-900/30 dark:to-pink-900/30 dark:border-red-800"
                  />
                  <QuickActionCard
                    icon={<FileText size={24} className="text-green-600 dark:text-green-400" />}
                    title={t("homePage.uploadDocTitle")}
                    description={t("homePage.uploadDocDesc")}
                    onClick={() => setAddDocumentModalOpen(true)}
                    colorClasses="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 dark:from-green-900/30 dark:to-emerald-900/30 dark:border-green-800"
                  />
                  <QuickActionCard
                    icon={<Scale size={24} className="text-purple-600 dark:text-purple-400" />}
                    title={t("homePage.legalHelpTitle")}
                    description={t("homePage.legalHelpDesc")}
                    onClick={() => navigate("/legal-help")}
                    colorClasses="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 dark:from-purple-900/30 dark:to-indigo-900/30 dark:border-purple-800"
                  />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-center"
                >
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
                  >
                    <BarChart3 size={20} />
                    {t("homePage.goToDashboard")}
                    <ArrowRight size={20} />
                  </button>
                </motion.div>
              </div>
            </section>
          </>
        ) : (
          <>
            <PublicHero />
            <section className="py-16 px-4 bg-secondary">
              <div className="max-w-4xl mx-auto text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 p-8 rounded-xl border border-purple-200 dark:border-purple-800"
                >
                  <Scale className="mx-auto mb-4 text-purple-600 dark:text-purple-400" size={48} />
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t("homePage.ctaLegalHelpTitle")}</h2>
                  <p className="text-slate-700 dark:text-slate-400 mb-6">
                    {t("homePage.ctaLegalHelpDesc")}
                  </p>
                  <button
                    onClick={() => navigate("/legal-help")}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <BookOpen size={20} />
                    {t("homePage.ctaAccessLegalHelp")}
                    <ArrowRight size={20} />
                  </button>
                </motion.div>
              </div>
            </section>
          </>
        )}

        <FeaturesSection />
        <AboutSection />
        <WhyNowSection />
        <HowItWorksSection />
      </main>

      <SmartAssistantModal
        isOpen={isSmartAssistantModalOpen}
        onClose={() => setSmartAssistantModalOpen(false)}
      />
      <AddIssueModal 
        isOpen={isAddIssueModalOpen} 
        onClose={() => setAddIssueModalOpen(false)} 
        onSuccess={handleSuccess} 
      />
      <AddDocumentModal 
        isOpen={isAddDocumentModalOpen} 
        onClose={() => setAddDocumentModalOpen(false)} 
        onSuccess={handleSuccess}
      />
    </div>
  )
}

export default HomePage