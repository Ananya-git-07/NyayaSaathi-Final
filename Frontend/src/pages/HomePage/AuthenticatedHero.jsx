"use client"
import { motion } from "framer-motion"
import { Mic, User, ArrowRight } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { Link } from "react-router-dom"

const AuthenticatedHero = ({ onVoiceQueryClick }) => {
  const { user } = useAuth()

  return (
    <section className="w-full flex items-center justify-center py-24 sm:py-32 container-padding">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="glass-card p-8 sm:p-12 w-full max-w-4xl text-center"
      >
        <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-200/50">
              <User size={40} className="text-white" />
            </div>
        </div>
        
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-2">Welcome back,</h1>
        <h2 className="text-3xl md:text-5xl font-bold gradient-text mb-6">{user?.fullName || "User"}!</h2>
        
        <p className="max-w-2xl mx-auto text-lg text-slate-700 mb-10 leading-relaxed">
            Your legal journey continues here. Start a voice query for quick assistance or head to your dashboard to manage all your cases.
        </p>

        <div className="flex flex-col items-center justify-center gap-6">
            <button
              onClick={onVoiceQueryClick}
              className="btn-primary text-lg py-4 px-8 rounded-2xl shadow-xl shadow-cyan-200/50 group"
            >
              <Mic size={24} className="group-hover:scale-110 transition-transform" />
              Start a Voice Query
            </button>
            <Link to="/dashboard" className="font-semibold text-slate-700 hover:text-cyan-600 transition-colors group flex items-center gap-2">
                Go to Full Dashboard
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
            </Link>
        </div>
      </motion.div>
    </section>
  )
}

export default AuthenticatedHero