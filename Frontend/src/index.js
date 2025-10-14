import i18n from "i18next"
import { initReactI18next } from "react-i18next"

const resources = {
  en: {
    translation: {
      // Add translations here if needed
       translation: translationEN,
    },
  },
  hi: {
    translation: {
      // Add Hindi translations here if needed
      translation: translationHI,
    },
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
