import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFoundPage = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-6xl font-extrabold text-cyan-400">{t('notFound.title')}</h1>
      <h2 className="text-3xl font-bold mt-4">{t('notFound.heading')}</h2>
      <p className="text-slate-300 mt-2">{t('notFound.message')}</p>
      <Link to="/" className="mt-8 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-full transition-colors duration-300">
        {t('notFound.goHome')}
      </Link>
    </div>
  );
};

export default NotFoundPage;