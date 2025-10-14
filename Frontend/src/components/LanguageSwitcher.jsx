import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी' },
  ];

  return (
    <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full p-1">
      <Languages size={16} className="text-slate-400 ml-2" />
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={`px-3 py-1 text-sm rounded-full transition-colors duration-200 ${
            i18n.language === lang.code
              ? 'bg-cyan-500 text-white font-semibold'
              : 'text-slate-300 hover:bg-slate-700'
          }`}
        >
          {lang.name}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;