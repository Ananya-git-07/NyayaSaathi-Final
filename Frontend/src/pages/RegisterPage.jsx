// PASTE THIS ENTIRE FILE INTO src/pages/RegisterPage.jsx

"use client"

import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { Link, Navigate } from "react-router-dom"
import Spinner from "../components/Spinner"
import { useTranslation } from "react-i18next"
import {
  User, Mail, Lock, CreditCard, Phone,
  Eye, EyeOff, Scale, ArrowRight,
} from "lucide-react"

const RegisterPage = () => {
  const { register, isAuthenticated, isLoading } = useAuth()
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    fullName: "", email: "", password: "", aadhaarNumber: "", role: "citizen",
    phoneNumber: "",
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register(formData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading && !isAuthenticated) return <Spinner />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto flex rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-slate-800 my-8">
        <div className="hidden lg:block lg:w-2/5 relative">
          <img src="/hero-image.jpg" alt="Community hands together" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-blue-500/30"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-white text-center">
             <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <Scale size={32} />
            </div>
            <h3 className="text-3xl font-bold mb-3">{t("registerPage.joinTitle")}</h3>
            <p className="text-white/80 leading-relaxed">{t("registerPage.joinSubtitle")}</p>
          </div>
        </div>

        <div className="w-full lg:w-3/5 p-8 sm:p-12 max-h-[90vh] overflow-y-auto" style={{ scrollBehavior: 'auto' }}>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t("registerPage.title")}</h2>
            <p className="text-slate-600 dark:text-slate-400">{t("registerPage.subtitle")}</p>
          </div>

          {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6 text-center">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              {t("registerPage.credentialsTitle")}
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t("registerPage.fullNameLabel")}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input name="fullName" placeholder={t("registerPage.fullNamePlaceholder")} value={formData.fullName} onChange={handleChange} required className="input-style pl-12"/>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t("registerPage.emailLabel")}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input name="email" type="email" placeholder={t("registerPage.emailPlaceholder")} value={formData.email} onChange={handleChange} required className="input-style pl-12"/>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t("registerPage.passwordLabel")}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input name="password" type={showPassword ? "text" : "password"} placeholder={t("registerPage.passwordPlaceholder")} value={formData.password} onChange={handleChange} required minLength={6} className="input-style pl-12 pr-12"/>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t("registerPage.aadhaarLabel")}</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input name="aadhaarNumber" placeholder={t("registerPage.aadhaarPlaceholder")} value={formData.aadhaarNumber} onChange={handleChange} required pattern="\d{12}" title={t("registerPage.aadhaarError")} className="input-style pl-12"/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t("registerPage.phoneLabel")}</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input name="phoneNumber" placeholder={t("registerPage.phonePlaceholder")} value={formData.phoneNumber} onChange={handleChange} pattern="\d{10}" title={t("registerPage.phoneError")} className="input-style pl-12"/>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary text-lg py-4 group mt-8">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{t("registerPage.submittingButton")}</span>
                </>
              ) : (
                <>
                  <span>{t("registerPage.submitButton")}</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            {t("registerPage.alreadyAccount")}{" "}
            <Link to="/login" className="font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-500 transition-colors">
              {t("registerPage.signInLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
 
export default RegisterPage;