"use client"

import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import PublicHero from "./HomePage/PublicHero"
import AuthenticatedHero from "./HomePage/AuthenticatedHero"
import SmartAssistantModal from "../components/SmartAssistantModal"
import FeaturesSection from "./HomePage/FeaturesSection"
import AboutSection from "./HomePage/AboutSection"
import WhyNowSection from "./HomePage/WhyNowSection"
import HowItWorksSection from "./HomePage/HowItWorksSection"
import Spinner from "../components/Spinner"
import { ArrowRight, FileText, AlertCircle, BarChart3, Scale, BookOpen } from "lucide-react"
import { motion } from "framer-motion"

const QuickActionCard = ({ icon, title, description, onClick, color }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    className={`${color} p-6 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg border`}
    onClick={onClick}
  >
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">{icon}</div>
      <div className="flex-1">
        <h3 className="text-slate-800 font-semibold text-lg mb-2">{title}</h3>
        <p className="text-slate-600 text-sm mb-4">{description}</p>
        <div className="flex items-center text-slate-700 text-sm font-medium">
          <span>Get Started</span>
          <ArrowRight size={16} className="ml-2" />
        </div>
      </div>
    </div>
  </motion.div>
)

const HomePage = () => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const [isSmartAssistantModalOpen, setSmartAssistantModalOpen] = useState(false)
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Background Glows - Updated for light theme */}
      <div className="absolute top-0 left-0 w-full h-full -z-0">
        <div className="absolute top-[-10rem] left-[-20rem] w-[50rem] h-[50rem] bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div
          className="absolute top-[20rem] right-[-20rem] w-[50rem] h-[50rem] bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-[60rem] left-[0rem] w-[40rem] h-[40rem] bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <main className="relative z-10">
        {isAuthenticated ? (
          <>
            <AuthenticatedHero onVoiceQueryClick={() => setSmartAssistantModalOpen(true)} />

            {/* Quick Actions Section for Authenticated Users */}
            <section className="py-16 px-4 bg-slate-50">
              <div className="max-w-7xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-12"
                >
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">Quick Actions for {user?.fullName}</h2>
                  <p className="text-slate-600 text-lg">Manage your legal matters efficiently</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <QuickActionCard
                    icon={<BarChart3 size={24} className="text-blue-600" />}
                    title="View Dashboard"
                    description="See all your legal issues, documents, and track progress"
                    onClick={() => navigate("/dashboard")}
                    color="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200"
                  />
                  <QuickActionCard
                    icon={<AlertCircle size={24} className="text-red-600" />}
                    title="Report New Issue"
                    description="Quickly report a new legal issue or problem"
                    onClick={() => setSmartAssistantModalOpen(true)}
                    color="bg-gradient-to-br from-red-50 to-pink-50 border-red-200"
                  />
                  <QuickActionCard
                    icon={<FileText size={24} className="text-green-600" />}
                    title="Upload Document"
                    description="Add important documents to your legal cases"
                    onClick={() => setSmartAssistantModalOpen(true)}
                    color="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                  />
                  <QuickActionCard
                    icon={<Scale size={24} className="text-purple-600" />}
                    title="Legal Help"
                    description="Get detailed information about Indian laws and procedures"
                    onClick={() => navigate("/legal-help")}
                    color="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200"
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
                    Go to Full Dashboard
                    <ArrowRight size={20} />
                  </button>
                </motion.div>
              </div>
            </section>
          </>
        ) : (
          <>
            <PublicHero />

            {/* Legal Help CTA for Public Users */}
            <section className="py-16 px-4 bg-slate-50">
              <div className="max-w-4xl mx-auto text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-gradient-to-br from-purple-50 to-indigo-50 p-8 rounded-xl border border-purple-200"
                >
                  <Scale className="mx-auto mb-4 text-purple-600" size={48} />
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Need Legal Help?</h2>
                  <p className="text-slate-700 mb-6">
                    Get instant access to comprehensive legal information about Indian laws, procedures, and your
                    rights. No registration required!
                  </p>
                  <button
                    onClick={() => navigate("/legal-help")}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <BookOpen size={20} />
                    Access Legal Help
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
        onSuccess={() => {
          // Optional: Navigate to dashboard after successful action
          setTimeout(() => navigate("/dashboard"), 1000)
        }}
      />
    </div>
  )
}

export default HomePage
