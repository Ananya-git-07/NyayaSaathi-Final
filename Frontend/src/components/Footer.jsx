// PASTE THIS ENTIRE FILE INTO src/components/Footer.jsx

"use client"

import { Link } from "react-router-dom"
import { Scale, Mail, Phone, MapPin } from 'lucide-react'
import { useTranslation } from "react-i18next"

const Footer = () => {
  const { t } = useTranslation()

  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto container-padding">
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
            {/* Brand Section */}
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center shadow-md">
                  <Scale size={20} className="text-white" />
                </div>
                <span className="text-2xl font-bold">
                  <span className="gradient-text">{t("nav.brand1")}</span><span className="text-slate-800 dark:text-slate-300">{t("nav.brand2")}</span>
                </span>
              </Link>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{t("footer.quickLinks")}</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                    {t("nav.home")}
                  </Link>
                </li>
                <li>
                  <Link to="/legal-help" className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                    {t("nav.legalHelp")}
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                    {t("nav.register")}
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                    {t("nav.login")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{t("footer.contact")}</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <Mail size={16} />
                  <span>support@nyayasaathi.gov.in</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <Phone size={16} />
                  <span>70785674XX</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <MapPin size={16} />
                  <span>{t("footer.location")}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              {t("footer.tagline")}
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm transition-colors">
                {t("footer.privacy")}
              </Link>
              <Link to="/terms" className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm transition-colors">
                {t("footer.terms")}
              </Link>
              <Link to="/accessibility" className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm transition-colors">
                {t("footer.accessibility")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer