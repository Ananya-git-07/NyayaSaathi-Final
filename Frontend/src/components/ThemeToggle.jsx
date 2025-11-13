// PASTE THIS ENTIRE FILE INTO src/components/ThemeToggle.jsx

import { Sun, Moon } from 'lucide-react';
import useTheme from '../hooks/useTheme'; // Make sure the path to the hook is correct

const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    // This uses standard Tailwind classes that should exist in your project
    const buttonClasses = `
        p-2 rounded-full transition-colors duration-200 
        text-slate-500 dark:text-slate-400 
        hover:bg-slate-200 dark:hover:bg-slate-800 
        focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500
    `;

    return (
        <button 
            onClick={toggleTheme} 
            className={buttonClasses}
            aria-label="Toggle theme"
        >
            {theme === 'light' ? (
                <Moon className="h-5 w-5" />
            ) : (
                <Sun className="h-5 w-5" />
            )}
        </button>
    );
};

export default ThemeToggle;