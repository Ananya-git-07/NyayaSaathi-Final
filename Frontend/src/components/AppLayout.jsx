// PASTE THIS ENTIRE FILE INTO src/components/AppLayout.jsx

"use client"
import { Outlet, Link, NavLink } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "../context/AuthContext"
import Footer from "./Footer"
import LanguageSwitcher from "./LanguageSwitcher"
import ThemeSwitcher from "./ThemeSwitcher"
import { Scale, Menu, X } from 'lucide-react'
import { useState } from "react"

const AppLayout = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const { t } = useTranslation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinkClass = ({ isActive }) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
      isActive
        ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
    }`

  const mobileNavLinkClass = ({ isActive }) =>
    `block px-4 py-3 rounded-lg text-base font-medium transition-all duration-300 ${
      isActive
        ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
    }`

  return (
    /* ---------------------------------------------------------------
       THE MAIN FIX: Theme-aware wrapper (bg + text)
       This ensures all pages properly switch light/dark.
    ---------------------------------------------------------------- */
    <div className="min-h-screen font-sans flex flex-col transition-colors duration-300 bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-300">

      <header className="glass-card sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
        <nav className="max-w-7xl mx-auto container-padding">
          <div className="flex items-center justify-between h-16">
            
            <Link to="/" className="text-2xl font-bold flex items-center gap-3 hover:scale-105 transition-transform duration-300 text-slate-900 dark:text-white">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center shadow-md">
                <Scale size={20} className="text-white" />
              </div>
              <div>
                <span className="gradient-text">{t("nav.brand1")}</span><span className="text-slate-800 dark:text-slate-300">{t("nav.brand2")}</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-2">
              <div className="flex items-baseline space-x-4">
                <NavLink to="/" className={navLinkClass} end>{t("nav.home")}</NavLink>

                {isAuthenticated ? (
                  <>
                    <NavLink to="/dashboard" className={navLinkClass}>{t("nav.dashboard")}</NavLink>
                    <NavLink to="/legal-help" className={navLinkClass}>{t("nav.legalHelp")}</NavLink>
                    <NavLink to="/profile" className={navLinkClass}>{t("nav.profile")}</NavLink>
                    {user?.role === "admin" && (
                      <NavLink to="/admin" className={navLinkClass}>{t("nav.adminPanel")}</NavLink>
                    )}

                    <button
                      onClick={logout}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-100 hover:text-red-600 transition-all duration-300 dark:text-slate-400 dark:hover:bg-red-900/50 dark:hover:text-red-400"
                    >
                      {t("nav.logout")}
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink to="/login" className={navLinkClass}>{t("nav.login")}</NavLink>
                    <NavLink to="/register" className={navLinkClass}>{t("nav.register")}</NavLink>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-700">
                <LanguageSwitcher />
                <ThemeSwitcher />
              </div>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeSwitcher />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-800 mt-4">
              <div className="space-y-2">
                <NavLink to="/" className={mobileNavLinkClass} end onClick={() => setIsMobileMenuOpen(false)}>{t("nav.home")}</NavLink>

                {isAuthenticated ? (
                  <>
                    <NavLink to="/dashboard" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>{t("nav.dashboard")}</NavLink>
                    <NavLink to="/legal-help" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>{t("nav.legalHelp")}</NavLink>
                    <NavLink to="/profile" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>{t("nav.profile")}</NavLink>

                    {user?.role === "admin" && (
                      <NavLink to="/admin" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>{t("nav.adminPanel")}</NavLink>
                    )}

                    <button
                      onClick={() => {
                        logout()
                        setIsMobileMenuOpen(false)
                      }}
                      className="block w-full text-left px-4 py-3 rounded-lg text-base font-medium text-slate-600 hover:bg-red-100 hover:text-red-600 transition-all duration-300 dark:text-slate-400 dark:hover:bg-red-900/50 dark:hover:text-red-400"
                    >
                      {t("nav.logout")}
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink to="/login" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>{t("nav.login")}</NavLink>
                    <NavLink to="/register" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>{t("nav.register")}</NavLink>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      <main className="flex-grow w-full">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}

export default AppLayout
