import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-6xl font-extrabold text-cyan-400">404</h1>
      <h2 className="text-3xl font-bold mt-4">Page Not Found</h2>
      <p className="text-slate-300 mt-2">Sorry, the page you are looking for does not exist.</p>
      <Link to="/" className="mt-8 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-full transition-colors duration-300">
        Go Home
      </Link>
    </div>
  );
};

export default NotFoundPage;