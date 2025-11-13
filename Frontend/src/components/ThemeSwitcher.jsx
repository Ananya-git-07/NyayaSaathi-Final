// PASTE THIS ENTIRE FILE INTO src/components/ThemeSwitcher.jsx

import useTheme from '../hooks/useTheme'; // Import our custom hook
import { Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

const ThemeSwitcher = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // This prevents hydration mismatch errors
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="p-2 w-[36px] h-[36px]"></div>;
    }

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    return (
        <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
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

export default ThemeSwitcher;