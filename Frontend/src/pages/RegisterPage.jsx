"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { Link, Navigate } from "react-router-dom"
import Spinner from "../components/Spinner"
import { useTranslation } from "react-i18next"
import {
  User, Mail, Lock, CreditCard, Users, Building, Phone, Award,
  MapPin, Eye, EyeOff, Scale, ArrowRight, Search, AlertCircle,
} from "lucide-react"
import apiClient from "../api/axiosConfig"
import toast from "react-hot-toast"

const RegisterPage = () => {
  const { register, isAuthenticated, isLoading } = useAuth()
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    fullName: "", email: "", password: "", aadhaarNumber: "", role: "citizen",
    phoneNumber: "", department: "", designation: "", roleLevel: "staff",
    kioskId: "", areasOfExpertise: [], assignedDistricts: [],
    status: "active", adminRole: "DistrictAdmin",
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [kiosks, setKiosks] = useState([])
  const [loadingKiosks, setLoadingKiosks] = useState(false)
  const [kioskError, setKioskError] = useState(null)
  const [kioskSearch, setKioskSearch] = useState("")
  const [filteredKiosks, setFilteredKiosks] = useState([])

  useEffect(() => {
    if (formData.role === "employee") {
      fetchKiosks()
    } else {
      setKiosks([]); setFilteredKiosks([]); setKioskError(null)
    }
  }, [formData.role])

  useEffect(() => {
    if (kioskSearch.trim()) {
      const lowerCaseSearch = kioskSearch.toLowerCase()
      const filtered = kiosks.filter(
        (kiosk) =>
          kiosk.location?.toLowerCase().includes(lowerCaseSearch) ||
          kiosk.village?.toLowerCase().includes(lowerCaseSearch) ||
          kiosk.district?.toLowerCase().includes(lowerCaseSearch) ||
          kiosk.organizationName?.toLowerCase().includes(lowerCaseSearch) ||
          kiosk.organizationType?.toLowerCase().includes(lowerCaseSearch)
      )
      setFilteredKiosks(filtered)
    } else {
      setFilteredKiosks(kiosks)
    }
  }, [kioskSearch, kiosks])

  const fetchKiosks = async () => {
    setLoadingKiosks(true)
    setKioskError(null)
    try {
      const response = await apiClient.get("/kiosks")
      const activeKiosks = response.data
      if (!Array.isArray(activeKiosks)) {
        throw new Error("API returned an unexpected data format.")
      }
      if (activeKiosks.length === 0) {
        setKioskError("No active kiosks are available. Please contact an administrator.")
        toast.error("No active kiosks found for assignment.")
      } else {
        setKiosks(activeKiosks)
        setFilteredKiosks(activeKiosks)
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "An unknown error occurred."
      setKioskError(`Server Error: ${errorMessage}`)
      toast.error(`Kiosk loading failed: ${errorMessage}`)
    } finally {
      setLoadingKiosks(false)
    }
  }
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
        setFormData(prevData => {
            const expertise = prevData.areasOfExpertise || [];
            if (checked) {
                return { ...prevData, areasOfExpertise: [...expertise, value] };
            } else {
                return { ...prevData, areasOfExpertise: expertise.filter(area => area !== value) };
            }
        });
    } else {
        setFormData(prevData => ({ ...prevData, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (formData.role === "employee" && !formData.kioskId) {
      toast.error("Kiosk selection is required for employees.")
      return
    }
    if (formData.role === "paralegal" && (!formData.areasOfExpertise || formData.areasOfExpertise.length === 0)) {
        toast.error("Please select at least one area of expertise.");
        return;
    }
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

  const renderRoleSpecificFields = () => {
    switch (formData.role) {
      case "employee":
        return (
          <>
            <h3 className="text-lg font-semibold text-slate-800 border-t border-slate-200 pt-6">
              {t("registerPage.employeeInfoTitle")}
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t("registerPage.kioskLabel")}</label>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder={t("registerPage.kioskSearchPlaceholder")}
                    value={kioskSearch}
                    onChange={(e) => setKioskSearch(e.target.value)}
                    className="input-style pl-12"
                    disabled={loadingKiosks || !!kioskError}
                  />
                </div>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <select
                    name="kioskId"
                    value={formData.kioskId}
                    onChange={handleChange}
                    required
                    className="input-style pl-12 appearance-none"
                    disabled={loadingKiosks || !!kioskError}
                  >
                    <option value="">
                      {loadingKiosks ? t("registerPage.kioskLoading")
                        : kioskError ? t("registerPage.kioskError")
                        : filteredKiosks.length === 0 ? t("registerPage.kioskNone")
                        : t("registerPage.kioskSelectDefault")
                      }
                    </option>
                    {filteredKiosks.map((kiosk) => (
                      <option key={kiosk._id} value={kiosk._id}>
                        {`${kiosk.location} - ${kiosk.village}, ${kiosk.district}`}
                        {kiosk.organizationName && ` (${kiosk.organizationName})`}
                      </option>
                    ))}
                  </select>
                </div>
                {kioskError && (
                  <div className="flex items-center gap-2 text-xs text-red-600 mt-1">
                    <AlertCircle size={12} />
                    {kioskError}
                    <button type="button" onClick={fetchKiosks} className="underline hover:no-underline ml-1">
                      {t("registerPage.kioskRetry")}
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t("registerPage.departmentLabel")}</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input name="department" placeholder={t("registerPage.departmentPlaceholder")} value={formData.department} onChange={handleChange} required className="input-style pl-12" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t("registerPage.designationLabel")}</label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input name="designation" placeholder={t("registerPage.designationPlaceholder")} value={formData.designation} onChange={handleChange} required className="input-style pl-12" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t("registerPage.roleLevelLabel")}</label>
                <div className="grid grid-cols-2 gap-4">
                  {["staff", "manager"].map((level) => (
                    <label 
                        key={level} 
                        htmlFor={`roleLevel-${level}`} 
                        className={`role-radio-label ${formData.roleLevel === level ? "role-radio-label-active" : ""}`}
                    >
                      <input 
                        id={`roleLevel-${level}`}
                        type="radio" 
                        name="roleLevel" 
                        value={level} 
                        checked={formData.roleLevel === level} 
                        onChange={handleChange} 
                        className="sr-only"
                      />
                      <div className="text-center">
                        <div className="font-medium capitalize">{t(`registerPage.roleLevels.${level}`)}</div>
                        <div className="text-xs opacity-75">{t(`registerPage.roleLevelDescriptions.${level}`)}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </>
        )
      case "paralegal":
        return (
            <>
                <h3 className="text-lg font-semibold text-slate-800 border-t border-slate-200 pt-6">
                    {t("registerPage.paralegalInfoTitle")}
                </h3>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t("registerPage.phoneLabel")}</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                            <input name="phoneNumber" placeholder={t("registerPage.phonePlaceholder")} value={formData.phoneNumber} onChange={handleChange} required pattern="\d{10}" title={t("registerPage.phoneError")} className="input-style pl-12"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">{t("registerPage.expertiseLabel")}</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.keys(t("registerPage.expertiseAreas", { returnObjects: true })).map((area) => (
                                <label key={area} className={`expertise-checkbox-label ${formData.areasOfExpertise.includes(t(`registerPage.expertiseAreas.${area}`)) ? "expertise-checkbox-label-active" : ""}`}>
                                    <input type="checkbox" name="areasOfExpertise" value={t(`registerPage.expertiseAreas.${area}`)} checked={formData.areasOfExpertise.includes(t(`registerPage.expertiseAreas.${area}`))} onChange={handleChange} className="sr-only"/>
                                    <span className="text-sm font-medium">{t(`registerPage.expertiseAreas.${area}`)}</span>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">{t("registerPage.expertiseHint")}</p>
                    </div>
                </div>
            </>
        )
      default: return null
    }
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto flex rounded-2xl shadow-2xl overflow-hidden bg-white my-8">
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

        <div className="w-full lg:w-3/5 p-8 sm:p-12 max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{t("registerPage.title")}</h2>
            <p className="text-slate-600">{t("registerPage.subtitle")}</p>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 text-center">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">{t("registerPage.selectRole")}</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "citizen", icon: <User size={20} /> },
                  { value: "employee", icon: <Users size={20} /> },
                  { value: "paralegal", icon: <Award size={20} /> },
                  { value: "admin", icon: <Building size={20} /> },
                ].map((role) => (
                  <label key={role.value} className={`flex flex-col sm:flex-row items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.role === role.value ? "border-cyan-500 bg-cyan-50 text-cyan-700" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"}`}>
                    <input type="radio" name="role" value={role.value} checked={formData.role === role.value} onChange={handleChange} className="sr-only"/>
                    <div className="flex-shrink-0">{role.icon}</div>
                    <div className="text-center sm:text-left">
                      <div className="font-medium">{t(`registerPage.roles.${role.value}`)}</div>
                      <div className="text-xs opacity-75 hidden sm:block">{t(`registerPage.roleDescriptions.${role.value}`)}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-slate-800 border-t border-slate-200 pt-6">
              {t("registerPage.credentialsTitle")}
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t("registerPage.fullNameLabel")}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input name="fullName" placeholder={t("registerPage.fullNamePlaceholder")} value={formData.fullName} onChange={handleChange} required className="input-style pl-12"/>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t("registerPage.emailLabel")}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input name="email" type="email" placeholder={t("registerPage.emailPlaceholder")} value={formData.email} onChange={handleChange} required className="input-style pl-12"/>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t("registerPage.passwordLabel")}</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-2">{t("registerPage.aadhaarLabel")}</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input name="aadhaarNumber" placeholder={t("registerPage.aadhaarPlaceholder")} value={formData.aadhaarNumber} onChange={handleChange} required pattern="\d{12}" title={t("registerPage.aadhaarError")} className="input-style pl-12"/>
                </div>
              </div>
            </div>
            
            {renderRoleSpecificFields()}

            <button type="submit" disabled={loading} className="w-full btn-primary text-lg py-4 group mt-8">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {t("registerPage.submittingButton")}
                </>
              ) : (
                <>
                  {t("registerPage.submitButton")}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600">
            {t("registerPage.alreadyAccount")}{" "}
            <Link to="/login" className="font-medium text-cyan-600 hover:text-cyan-700 transition-colors">
              {t("registerPage.signInLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
 
export default RegisterPage;