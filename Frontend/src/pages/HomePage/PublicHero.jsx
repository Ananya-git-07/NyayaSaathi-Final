"use client"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { ArrowRight, Sparkles, Shield, Users } from "lucide-react"

const PublicHero = () => {
  const { t } = useTranslation()

  return (
    <section className="min-h-screen w-full flex items-center justify-center text-center container-padding relative overflow-hidden">
      {/* Background decorations - Updated for light theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-transparent to-blue-50/50"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-cyan-200/30 to-transparent rounded-full blur-3xl animate-pulse-slow"></div>
      <div
        className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-blue-200/30 to-transparent rounded-full blur-3xl animate-pulse-slow"
        style={{ animationDelay: "2s" }}
      ></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="glass-card p-12 w-full max-w-6xl relative z-10"
      >
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles size={24} className="text-cyan-600" />
            <span className="text-cyan-700 font-semibold">AI-Powered Legal Assistant</span>
            <Sparkles size={24} className="text-cyan-600" />
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
            <span dangerouslySetInnerHTML={{ __html: t("publicHero.title", { nsSeparator: "||" }) }} />
          </h1>

          <p className="max-w-4xl mx-auto text-xl md:text-2xl text-slate-700 mb-12 leading-relaxed">
            {t("publicHero.subtitle")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-12">
          <Link to="/register" className="btn-primary text-lg py-4 px-8 rounded-2xl shadow-xl shadow-cyan-200/50 group">
            {t("publicHero.getStarted")}
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/login" className="btn-secondary text-lg py-4 px-8 rounded-2xl group">
            {t("publicHero.login")}
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 border-t border-slate-200">
          <div className="flex items-center justify-center gap-3 text-slate-700">
            <Shield size={20} className="text-cyan-600" />
            <span>Secure & Private</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-slate-700">
            <Users size={20} className="text-cyan-600" />
            <span>Trusted by Thousands</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-slate-700">
            <Sparkles size={20} className="text-cyan-600" />
            <span>AI-Powered</span>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

export default PublicHero
