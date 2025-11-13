// PASTE THIS ENTIRE FILE INTO src/pages/LoginPage.jsx

"use client"

import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { Link, Navigate } from "react-router-dom"
import Spinner from "../components/Spinner"
import { useTranslation } from "react-i18next"
import { Mail, Lock, Eye, EyeOff, Scale, ArrowRight } from "lucide-react"

const LoginPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated, isLoading } = useAuth()
  const { t } = useTranslation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message || "An unknown error occurred.")
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return <Spinner />
  }
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex rounded-2xl shadow-xl overflow-hidden glass-card my-8">
      {/* Image Side */}
      <div className="hidden lg:block lg:w-2/5 relative">
        <img src="/hero-image.jpg" alt="Smiling women from rural India" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Scale size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-2">{t("loginPage.heroTitle")}</h3>
            <p className="text-white/80">{t("loginPage.heroSubtitle")}</p>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-3/5 p-8 lg:p-12 flex flex-col justify-center bg-white dark:bg-slate-800">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t("loginPage.title")}</h2>
          <p className="text-slate-600 dark:text-slate-400">{t("loginPage.subtitle")}</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6 text-center">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t("loginPage.emailLabel")}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="input-style pl-12"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t("loginPage.passwordLabel")}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input-style pl-12 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <button type="submit" disabled={loading} className="w-full btn-primary text-lg py-4 group">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{t("loginPage.signingInButton")}</span>
                </>
              ) : (
                <>
                  <span>{t("loginPage.signInButton")}</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          {t("loginPage.noAccount")}{" "}
          <Link to="/register" className="font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-500 transition-colors">
            {t("loginPage.signUpLink")}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage